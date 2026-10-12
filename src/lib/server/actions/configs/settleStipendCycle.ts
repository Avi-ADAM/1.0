/**
 * Action: settleStipendCycle (docs/done/PLAN_STIPEND.md §6).
 *
 * The funder closes one cycle. They do **not** type an amount: it is derived
 * from the hours the rikma approved inside the window, at the pledged rate,
 * bounded by the monthly cap, the pledge's remaining budget and the program's.
 * A free-typed number would let the money book and the equity book drift apart
 * within two cycles, and there is no honest way to reconcile them afterwards.
 *
 * The row this writes is `sent`, never `confirmed`: the money has left, but
 * nothing has touched anyone's percentage yet. That happens only when the
 * recipient says it arrived (or stays silent for the rikma's restime).
 *
 * The one exception is the recipient closing the cycle themselves — "it
 * arrived" from the accrued card. That receipt *is* the confirmation, so the
 * row is written `confirmed` and no clock starts.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { dateField, fields, gqlStr, numField, run } from '$lib/server/archive/gql.js';
import { computeStipendCycle, cycleWindow, settlementFrom } from '$lib/stipend/computeStipendCycle.js';
import { recordStipendPayment } from '$lib/server/stipend/recordPayment.js';
import { moneyTextFor } from '$lib/server/money/notifyMoney.js';
import {
  fetchApprovedHours,
  fetchMeteredHours,
  fetchPledge,
  fetchProgram,
  fetchProjectContext,
  fetchRecipientContribution
} from '$lib/server/stipend/read.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';

const handler: ActionExecutionHandler = async (params, context, { notifier }) => {
  const pledgeId = String(params.pledgeId ?? '');
  if (!pledgeId) throw new Error('pledgeId is required');

  const exec = execFromContext(context);
  const userId = String(context.userId);

  const pledge = await fetchPledge(exec, pledgeId);
  if (!pledge) throw new Error(`Stipend pledge ${pledgeId} not found`);
  if (pledge.status !== 'active') {
    throw new Error('Only an active stipend pays out — this one is ' + pledge.status);
  }
  /**
   * The recipient may close the cycle too — by saying the money arrived. Money
   * that got there was sent, whether or not its sender ever came back to press
   * "pay", and a recipient waiting on a funder who transferred and forgot had
   * no way to close the matter. Their word moves only their own side: it is a
   * receipt, so it is final at once and there is nothing for a clock to wait on.
   */
  const asRecipient = pledge.recipientId === userId && pledge.funderId !== userId;
  if (pledge.funderId !== userId && !asRecipient) {
    throw new Error('Only the funder settles a stipend cycle, or the recipient declares it arrived');
  }
  if (!pledge.projectId || !pledge.recipientId) {
    throw new Error('This pledge is missing its rikma or its recipient');
  }

  const window = params.cycleStart && params.cycleEnd
    ? { cycleStart: String(params.cycleStart), cycleEnd: String(params.cycleEnd) }
    : cycleWindow(params.reference ? String(params.reference) : new Date(), pledge.terms.cycleSize ?? 1);

  // Hours already paid for must not be paid for twice, and hours approved and
  // never paid for must not be lost when a month turns over — see
  // `settlementFrom`.
  const from = settlementFrom(
    { lastSettledAt: pledge.lastSettledAt, start: pledge.terms.start },
    window.cycleStart
  );

  const approved = await fetchApprovedHours(exec, pledge.projectId, pledge.recipientId, from);
  const program = pledge.programId ? await fetchProgram(exec, pledge.programId) : null;
  // What other pledges already paid this person for, and how much equity they
  // have left to give up. Both are rikma-wide facts, not pledge-local ones —
  // which is exactly why a pledge on its own got them wrong (docs/inprogress/FIXES.md §2).
  const [metered, ledger] = await Promise.all([
    fetchMeteredHours(exec, pledge.projectId, pledge.recipientId, from).catch(() => 0),
    fetchRecipientContribution(exec, pledge.projectId, pledge.recipientId).catch(() => null)
  ]);

  const cycleInput = {
    terms: pledge.terms,
    approved,
    cycleStart: from,
    cycleEnd: window.cycleEnd,
    paidTotal: pledge.paidTotal,
    programRemaining: program?.remainingCap ?? null,
    missionIds: pledge.terms.scope === 'allMissions' ? null : pledge.missionIds,
    hoursAlreadyMetered: metered,
    equityHeadroom: ledger ? Math.max(0, ledger.contribution - ledger.equityDebited) : null
  };
  // Within the agreed monthly ceiling, and past it. The second is never the
  // default: the ceiling is the term both signed, and what it holds back stays
  // open (unmetered) rather than falling — the funder may choose to pay it now,
  // and the recipient's receipt is still their yes.
  const capped = computeStipendCycle(cycleInput);
  const all = computeStipendCycle({ ...cycleInput, includeOverCap: true });
  const includeOverCap = !asRecipient && params.includeOverCap === true && capped.overCap > 0;
  const cycle = includeOverCap ? all : capped;

  if (cycle.amount <= 0) {
    return {
      data: { settled: false, reason: 'nothing_approved_this_cycle', ...cycle, ...window },
      updateStrategy: { type: 'none' as const }
    };
  }

  // What the recipient says arrived — what is due unless they name another
  // figure. Less leaves the rest of the hours owed; more than the ceiling is
  // the funder having paid past it, which their own transfer already agreed
  // to. More than the hours come to cannot have arrived *for these hours*.
  let amount = cycle.amount;
  let hours = cycle.paidHours;
  if (asRecipient && params.receivedAmount != null && params.receivedAmount !== '') {
    const received = Number(params.receivedAmount);
    if (!Number.isFinite(received) || received <= 0) throw new Error('receivedAmount must be a positive number');
    if (received > all.amount) {
      throw new Error('More cannot have arrived than these hours come to — the rest belongs to its own cycle');
    }
    amount = Math.round(received * 100) / 100;
    // Meter only the share of the hours this money paid for.
    hours = Math.round(Math.min(all.paidHours, (all.paidHours * amount) / all.amount) * 100) / 100;
  }
  // Less than is due under the ceiling: the rest is still *this* window's.
  const partial = amount < capped.amount;

  const project = await fetchProjectContext(exec, pledge.projectId);
  // Amounts are stored in the rikma's currency; the notice says them in it.
  const money = moneyTextFor(project?.currency ?? 'ILS');
  const nowISO = new Date().toISOString();

  /**
   * Did the money already move? Closing a cycle and transferring it are two
   * different acts, and the card used to fuse them: pressing "pay" wrote
   * `senderconf: true` — the funder testifying they had sent something they
   * often had not — and started the recipient's silence clock, so a transfer
   * nobody had made could be confirmed by nobody answering.
   *
   * So the card asks first. "Yes, I transferred" is the path above. "Not yet"
   * settles the cycle at the derived amount and opens a transfer both sides
   * can see and talk in, with no clock running until the money actually goes.
   */
  const transferred = asRecipient || params.transferred !== false;
  const overCapPaid = Math.max(0, Math.round((amount - capped.amount) * 100) / 100);

  const recorded = await recordStipendPayment(exec, {
    pledge: { ...pledge, id: pledgeId },
    program,
    restime: project?.restime ?? null,
    amount,
    hours,
    cycleStart: from,
    cycleEnd: window.cycleEnd,
    state: asRecipient ? 'confirmed' : transferred ? 'sent' : 'pending',
    note: `stipend · ${hours}h × ${pledge.terms.stipendRate}${
      cycle.cappedBy ? ` · capped by ${cycle.cappedBy}` : ''
    }${overCapPaid > 0 ? ` · over the monthly ceiling by ${overCapPaid}` : ''}${
      asRecipient ? ' · receipt declared by recipient' : ''
    }`,
    tag: 'settle'
  });
  const { paymentId, halukaId, forumId, timegramaId } = recorded;
  const lines = recorded;

  // Move the pledge's own counters. `paidTotal` is what the next cycle's
  // remaining budget is measured against.
  const newPaid = Math.round((pledge.paidTotal + amount) * 100) / 100;
  // A partial receipt leaves hours owed, so it cannot close the budget.
  const exhausts = partial ? false : amount >= all.amount ? all.exhausts : capped.exhausts;
  await run(
    exec,
    `mutation { updateStipendPledge(id: ${gqlStr(pledgeId)}, data: { ${fields(
      numField('paidTotal', newPaid),
      // The moment of settlement, **not** the end of the cycle. Writing the
      // cycle's end — a date in the future — closed the rest of the month:
      // hours approved after a mid-month settlement fell after the watermark
      // and before the next window, and were never paid at all
      // (docs/inprogress/FIXES.md §3). `now` is also the honest statement of fact: this is
      // how far the books are settled.
      //
      // Not after a partial receipt: the hours it did not pay for are still
      // owed, and the watermark moving past them would lose them. The payment
      // row metered only its share (`hours`), so the next reading from the same
      // origin finds exactly the rest.
      partial ? null : dateField('lastSettledAt', nowISO),
      exhausts ? 'status: exhausted' : null
    )} }) { data { id } } }`,
    'settle:updatePledge'
  );

  if (program) {
    await run(
      exec,
      `mutation { updateStipendProgram(id: ${gqlStr(program.id)}, data: { ${fields(
        numField('spent', Math.round((program.spent + amount) * 100) / 100),
        program.remainingCap != null && program.remainingCap - amount <= 0 ? 'status: exhausted' : null
      )} }) { data { id } } }`,
      'settle:updateProgram'
    ).catch((e) => console.warn('[settleStipendCycle] program counter update failed:', e));
  }

  if (notifier && asRecipient) {
    // The funder learns the cycle is closed and what it did to the books.
    notifier
      .notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates: {
            title: { he: 'המלגה התקבלה', en: 'The stipend arrived' },
            body: {
              he: `המקבל/ת הצהיר/ה שקיבל/ה ${money(amount)} עבור ${hours} שעות שאושרו. המחזור נסגר והאחוזים עודכנו לפי תנאי המלגה.`,
              en: `The recipient declared receiving ${money(amount, 'en')} for ${hours} approved hours. The cycle is closed and the shares moved according to the pledge's terms.`
            }
          },
          intent: 'personal',
          metadata: { type: 'stipendPayment', url: 'lev', priority: 'normal' }
        },
        { recipients: [pledge.funderId], projectId: pledge.projectId },
        { projectId: pledge.projectId },
        context
      )
      .catch((e: unknown) => console.warn('[settleStipendCycle] notification failed:', e));
  } else if (notifier) {
    notifier
      .notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates: {
            title: transferred
              ? { he: 'מלגת הקיום נשלחה', en: 'Your stipend was sent' }
              : { he: 'מחזור המלגה נסגר — ההעברה בתיאום', en: 'Your stipend cycle closed — the transfer is being arranged' },
            body: transferred
              ? {
                  he: `${hours} שעות שאושרו × ${money(pledge.terms.stipendRate)} = ${money(amount)}. אישור הקבלה הוא מה שמעדכן את האחוזים — בלעדיו כלום לא זז.`,
                  en: `${hours} approved hours × ${money(pledge.terms.stipendRate, 'en')} = ${money(amount, 'en')}. Confirming it arrived is what updates the shares — until then nothing moves.`
                }
              : {
                  he: `${hours} שעות שאושרו × ${money(pledge.terms.stipendRate)} = ${money(amount)}. הכסף עוד לא יצא — נפתח כרטיס העברה עם צ׳אט לתיאום, ואפשר לכתוב שם לאן להעביר.`,
                  en: `${hours} approved hours × ${money(pledge.terms.stipendRate, 'en')} = ${money(amount, 'en')}. The money has not gone out yet — a transfer card with a chat is open, so you can say where to send it.`
                }
          },
          // Sent: the recipient's receipt is awaited. Not yet: only news of the arrangement.
          intent: transferred ? 'consent' : 'personal',
          metadata: { type: 'stipendPayment', url: 'lev', priority: 'high' }
        },
        { recipients: [pledge.recipientId], projectId: pledge.projectId },
        { projectId: pledge.projectId },
        context
      )
      .catch((e: unknown) => console.warn('[settleStipendCycle] notification failed:', e));
  }

  return {
    data: {
      settled: true,
      paymentId,
      halukaId,
      forumId,
      timegramaId,
      transferred,
      status: asRecipient ? 'confirmed' : transferred ? 'sent' : 'pending',
      ...cycle,
      amount,
      hours,
      exhausts,
      // What the ceiling held back and nobody has decided on yet — still owed.
      overCapOpen: Math.max(0, Math.round((all.amount - Math.max(amount, capped.amount)) * 100) / 100),
      cycleStart: from,
      cycleEnd: window.cycleEnd,
      equityCredit: lines.equityCredit,
      equityDebit: lines.equityDebit,
      // Who else shows this (realtime audience).
      projectId: pledge.projectId,
      pledgeId
    },
    updateStrategy: { type: 'fullRefresh' as const }
  };
};

export const settleStipendCycleConfig: ActionConfig = {
  key: 'settleStipendCycle',
  description:
    'Close one stipend cycle: derive the amount from approved hours × the pledged rate (capped), create the Haluka and the stipend-payment ledger row, and start the recipient’s confirmation clock. Called by the recipient, it declares the money arrived: the row is confirmed at once and no clock runs.',
  graphqlOperation: handler,

  paramSchema: {
    pledgeId: { type: 'string', required: true, description: 'The pledge being settled' },
    transferred: {
      type: 'boolean',
      required: false,
      description:
        'Has the money already been transferred? true (default) marks it sent and starts the recipient’s confirmation clock; false settles the cycle as pending, opens a transfer chat and starts no clock.'
    },
    includeOverCap: {
      type: 'boolean',
      required: false,
      description:
        'Funder only: pay past the monthly ceiling too. Off by default — what the ceiling holds back is not lost, it stays open for both sides to decide on, and the recipient still confirms what arrives.'
    },
    receivedAmount: {
      type: 'number',
      required: false,
      description:
        'Recipient only: what actually arrived, when it differs from what is due — less leaves the rest of the hours owed, more (up to what the hours come to) means the funder paid past the monthly ceiling. Omit for "what is due".'
    },
    reference: { type: 'string', required: false, description: 'Any date inside the cycle (defaults to now)' },
    cycleStart: { type: 'string', required: false, description: 'Explicit window start' },
    cycleEnd: { type: 'string', required: false, description: 'Explicit window end' }
  },

  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to settle a stipend cycle' }],

  updateStrategy: { type: 'fullRefresh' },

  realtime: {
    scopes: (p, r) =>
      scopeList([scope('project', r?.data?.projectId), scope('stipend', p.pledgeId), scope('split', r?.data?.halukaId)]),
  },
};
