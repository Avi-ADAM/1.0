/**
 * Action: resolveStipendOverCap (docs/done/PLAN_STIPEND.md §6).
 *
 * Hours past the monthly ceiling do not fall by default. The ceiling is the
 * term both sides signed, so paying past it is a new agreement — and it takes
 * both of them:
 *
 *   pay      — the funder chooses to pay them (all or part). The row is `sent`
 *              (or `pending` if the money has not gone out), and the
 *              recipient's receipt is their yes: they confirm, or counter with
 *              what actually arrived — 0 included — or stay silent for the
 *              rikma's restime. Paying moves the recipient's share (α·P), which
 *              is exactly why it is not the funder's word alone.
 *   received — the recipient says the money for them already arrived. The
 *              funder's transfer was their yes; the receipt is final at once.
 *   release  — the recipient lets them go. It harms nobody but themselves, so
 *              it needs nobody else: a row of amount 0 meters the hours, moves
 *              no money and no share, and the balance closes.
 *   ask      — the recipient asks the funder to pay them. A message, not a
 *              claim: nothing is owed past the agreed ceiling until both say so.
 *
 * Two places hold such hours: the **balance** behind the watermark (earlier
 * settlements paid to the ceiling) and the **window** still open, before it
 * is settled. In the window, paying or receiving goes through the settlement
 * itself (`includeOverCap` / `receivedAmount`); `release` and `ask` work here.
 *
 * There is no funder "release". A funder who does not want to pay past the
 * ceiling simply doesn't — the balance stays visible to both, and only the
 * person it belongs to can close it without being paid.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { fields, gqlStr, numField, run } from '$lib/server/archive/gql.js';
import { moneyTextFor } from '$lib/server/money/notifyMoney.js';
import {
  fetchPledge,
  fetchProgram,
  fetchProjectContext,
  fetchRecipientContribution
} from '$lib/server/stipend/read.js';
import { readOpenWindow, readOverCapBalance } from '$lib/server/stipend/overCap.js';
import { recordStipendPayment } from '$lib/server/stipend/recordPayment.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';

const HOWS = ['pay', 'received', 'release', 'ask'] as const;
type How = (typeof HOWS)[number];

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const handler: ActionExecutionHandler = async (params, context, { notifier }) => {
  const pledgeId = String(params.pledgeId ?? '');
  if (!pledgeId) throw new Error('pledgeId is required');
  const how = String(params.how ?? '') as How;
  if (!HOWS.includes(how)) throw new Error(`how must be one of ${HOWS.join(', ')}`);

  const exec = execFromContext(context);
  const userId = String(context.userId);

  const pledge = await fetchPledge(exec, pledgeId);
  if (!pledge) throw new Error(`Stipend pledge ${pledgeId} not found`);
  if (pledge.status !== 'active') {
    throw new Error('Only an active stipend pays out — this one is ' + pledge.status);
  }
  if (!pledge.projectId || !pledge.recipientId || !pledge.funderId) {
    throw new Error('This pledge is missing its rikma, its funder or its recipient');
  }
  const isFunder = pledge.funderId === userId;
  const isRecipient = pledge.recipientId === userId && !isFunder;
  if (how === 'pay' && !isFunder) throw new Error('Only the funder pays past the ceiling');
  if (how !== 'pay' && !isRecipient) {
    throw new Error('Only the recipient can say it arrived, let it go, or ask for it');
  }

  const program = pledge.programId ? await fetchProgram(exec, pledge.programId) : null;
  const ledger = await fetchRecipientContribution(exec, pledge.projectId, pledge.recipientId).catch(() => null);
  const limits = {
    programRemaining: program?.remainingCap ?? null,
    equityHeadroom: ledger ? Math.max(0, ledger.contribution - ledger.equityDebited) : null
  };
  // Recomputed here, never taken from the client: both numbers are facts of
  // the ledger, and the card that showed them may be stale.
  //
  //   balance — held back by earlier settlements, behind the watermark;
  //   window  — what the ceiling is holding back in the window still open.
  // Paying or receiving inside the open window is the settlement's job (its
  // `includeOverCap` / `receivedAmount`); here the window only takes `release`
  // and `ask`.
  const scopeKind = params.scope === 'window' ? 'window' : 'balance';
  if (scopeKind === 'window' && (how === 'pay' || how === 'received')) {
    throw new Error('Inside the open window, pay or receive through the cycle itself');
  }
  const [balance, open] = await Promise.all([
    readOverCapBalance(exec, pledge, limits),
    readOpenWindow(exec, pledge, limits)
  ]);
  const windowTarget =
    open && open.cycle.overCap > 0
      ? {
          hours: round2(open.cycle.hours - open.cycle.paidHours),
          amount: open.cycle.overCap,
          cycleStart: open.from,
          cycleEnd: open.cycleEnd
        }
      : null;
  const target =
    scopeKind === 'window'
      ? windowTarget
      : balance.hours > 0 && balance.cycleStart && balance.cycleEnd
        ? { hours: balance.hours, amount: balance.amount, cycleStart: balance.cycleStart, cycleEnd: balance.cycleEnd }
        : null;

  const project = await fetchProjectContext(exec, pledge.projectId);
  const money = moneyTextFor(project?.currency ?? 'ILS');

  if (how === 'ask') {
    // One request for everything over the ceiling, wherever it sits.
    const askHours = round2((balance.hours > 0 ? balance.hours : 0) + (windowTarget?.hours ?? 0));
    const askAmount = round2((balance.hours > 0 ? balance.amount : 0) + (windowTarget?.amount ?? 0));
    if (askHours <= 0) {
      return {
        data: { resolved: false, reason: 'nothing_over_the_ceiling', projectId: pledge.projectId, pledgeId },
        updateStrategy: { type: 'none' as const }
      };
    }
    if (notifier) {
      notifier
        .notify(
          {
            recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
            templates: {
              title: { he: 'בקשה לשלם גם על השעות שמעבר לתקרה', en: 'A request to pay the hours over the ceiling' },
              body: {
                he: `${askHours} שעות שאושרו נשארו מעבר לתקרה החודשית (${money(askAmount)}). המקבל/ת מבקש/ת שתשקול/י לשלם גם עליהן — ההחלטה של שניכם.`,
                en: `${askHours} approved hours are left over the monthly ceiling (${money(askAmount, 'en')}). The recipient asks whether you would pay them too — it is for both of you to decide.`
              }
            },
            intent: 'personal',
            metadata: { type: 'stipendPayment', url: 'lev', priority: 'normal' }
          },
          { recipients: [pledge.funderId], projectId: pledge.projectId },
          { projectId: pledge.projectId },
          context
        )
        .catch((e: unknown) => console.warn('[resolveStipendOverCap] notification failed:', e));
    }
    return {
      data: { resolved: false, asked: true, hours: askHours, amount: askAmount, projectId: pledge.projectId, pledgeId },
      updateStrategy: { type: 'none' as const }
    };
  }

  if (!target || target.hours <= 0) {
    return {
      data: { resolved: false, reason: 'nothing_over_the_ceiling', projectId: pledge.projectId, pledgeId },
      updateStrategy: { type: 'none' as const }
    };
  }

  // How much. A release pays nothing and meters all of it; the others pay up
  // to the balance, and meter the share of the hours their money covers.
  let amount = 0;
  let hours = target.hours;
  if (how !== 'release') {
    amount = target.amount;
    if (params.amount != null && params.amount !== '') {
      const asked = Number(params.amount);
      if (!Number.isFinite(asked) || asked <= 0) throw new Error('amount must be a positive number');
      if (asked > target.amount) {
        throw new Error('More than the hours over the ceiling come to — the rest belongs to its own cycle');
      }
      amount = round2(asked);
    }
    if (amount <= 0) throw new Error('There is nothing to pay inside the remaining budget');
    hours = round2(Math.min(target.hours, (target.hours * amount) / target.amount));
  }

  const transferred = params.transferred !== false;
  const state = how === 'pay' ? (transferred ? 'sent' : 'pending') : 'confirmed';
  const recorded = await recordStipendPayment(exec, {
    pledge: { ...pledge, id: pledgeId },
    program,
    restime: project?.restime ?? null,
    amount,
    hours,
    cycleStart: target.cycleStart,
    cycleEnd: target.cycleEnd,
    state,
    note:
      how === 'release'
        ? `stipend over the monthly ceiling · ${hours}h released by the recipient · nothing paid`
        : `stipend over the monthly ceiling · ${hours}h × ${pledge.terms.stipendRate}${
            how === 'received' ? ' · receipt declared by recipient' : ''
          }`,
    tag: 'overCap'
  });

  // The budget counters move with the money, as for any cycle. The watermark
  // does not: these hours were behind it already.
  if (amount > 0) {
    await run(
      exec,
      `mutation { updateStipendPledge(id: ${gqlStr(pledgeId)}, data: { ${fields(
        numField('paidTotal', round2(pledge.paidTotal + amount))
      )} }) { data { id } } }`,
      'overCap:updatePledge'
    );
    if (program) {
      await run(
        exec,
        `mutation { updateStipendProgram(id: ${gqlStr(program.id)}, data: { ${fields(
          numField('spent', round2(program.spent + amount)),
          program.remainingCap != null && program.remainingCap - amount <= 0 ? 'status: exhausted' : null
        )} }) { data { id } } }`,
        'overCap:updateProgram'
      ).catch((e) => console.warn('[resolveStipendOverCap] program counter update failed:', e));
    }
  }

  if (notifier) {
    const toRecipient = how === 'pay';
    const templates = toRecipient
      ? {
          title: { he: 'שולם גם על השעות שמעבר לתקרה', en: 'The hours over the ceiling were paid too' },
          body: transferred
            ? {
                he: `${hours} שעות × ${money(pledge.terms.stipendRate)} = ${money(amount)}, מעבר לתקרה החודשית. אישור הקבלה הוא ההסכמה שלך — ואפשר גם לרשום שהגיע סכום אחר.`,
                en: `${hours} hours × ${money(pledge.terms.stipendRate, 'en')} = ${money(amount, 'en')}, over the monthly ceiling. Confirming it arrived is your agreement — or say a different amount arrived.`
              }
            : {
                he: `${hours} שעות × ${money(pledge.terms.stipendRate)} = ${money(amount)}, מעבר לתקרה החודשית. הכסף עוד לא יצא — נפתח כרטיס העברה עם צ׳אט לתיאום.`,
                en: `${hours} hours × ${money(pledge.terms.stipendRate, 'en')} = ${money(amount, 'en')}, over the monthly ceiling. The money has not gone out yet — a transfer card with a chat is open.`
              }
        }
      : how === 'received'
        ? {
            title: { he: 'התקבל תשלום על השעות שמעבר לתקרה', en: 'Payment for the hours over the ceiling arrived' },
            body: {
              he: `המקבל/ת הצהיר/ה שקיבל/ה ${money(amount)} עבור ${hours} שעות שמעבר לתקרה. האחוזים עודכנו לפי תנאי המלגה.`,
              en: `The recipient declared receiving ${money(amount, 'en')} for ${hours} hours over the ceiling. The shares moved according to the pledge's terms.`
            }
          }
        : {
            title: { he: 'השעות שמעבר לתקרה נסגרו בלי תשלום', en: 'The hours over the ceiling were closed unpaid' },
            body: {
              he: `המקבל/ת ויתר/ה על ${hours} השעות שמעבר לתקרה. לא עבר כסף ושום אחוז לא זז.`,
              en: `The recipient let go of the ${hours} hours over the ceiling. No money moved and no share changed.`
            }
          };
    notifier
      .notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates,
          // Paid and sent: the recipient's receipt is awaited.
          intent: toRecipient && transferred ? 'consent' : 'personal',
          metadata: { type: 'stipendPayment', url: 'lev', priority: toRecipient ? 'high' : 'normal' }
        },
        { recipients: [toRecipient ? pledge.recipientId : pledge.funderId], projectId: pledge.projectId },
        { projectId: pledge.projectId },
        context
      )
      .catch((e: unknown) => console.warn('[resolveStipendOverCap] notification failed:', e));
  }

  return {
    data: {
      resolved: true,
      how,
      status: state,
      amount,
      hours,
      paymentId: recorded.paymentId,
      halukaId: recorded.halukaId,
      forumId: recorded.forumId,
      timegramaId: recorded.timegramaId,
      equityCredit: recorded.equityCredit,
      equityDebit: recorded.equityDebit,
      scope: scopeKind,
      cycleStart: target.cycleStart,
      cycleEnd: target.cycleEnd,
      // Who else shows this (realtime audience).
      projectId: pledge.projectId,
      pledgeId
    },
    updateStrategy: { type: 'fullRefresh' as const }
  };
};

export const resolveStipendOverCapConfig: ActionConfig = {
  key: 'resolveStipendOverCap',
  description:
    'Decide on stipend hours the monthly ceiling held back. Funder: pay them (the recipient still confirms what arrives). Recipient: say the money for them arrived, let them go (an amount-0 row, no share moves), or ask the funder to pay them.',
  graphqlOperation: handler,

  paramSchema: {
    pledgeId: { type: 'string', required: true, description: 'The pledge whose over-cap hours are decided on' },
    how: {
      type: 'string',
      required: true,
      validate: (v: unknown) => HOWS.includes(String(v) as How),
      description: 'pay (funder) · received | release | ask (recipient)'
    },
    amount: {
      type: 'number',
      required: false,
      description: 'pay / received: part of the balance — omit for all of it'
    },
    scope: {
      type: 'string',
      required: false,
      validate: (v: unknown) => v == null || v === 'balance' || v === 'window',
      description:
        'balance (default): hours held back by earlier settlements · window: what the ceiling holds back in the window still open (release / ask only)'
    },
    transferred: {
      type: 'boolean',
      required: false,
      description: 'pay: has the money already gone out? false opens a transfer chat and starts no clock'
    }
  },

  // Who may do what is decided against the pledge row itself in the handler
  // (funder pays, recipient receives / releases / asks) — the parties are
  // properties of the record, not client-supplied parameters.
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to decide on stipend hours' }],

  updateStrategy: { type: 'fullRefresh' },

  realtime: {
    scopes: (p, r) =>
      scopeList([scope('project', r?.data?.projectId), scope('stipend', p.pledgeId), scope('split', r?.data?.halukaId)])
  }
};
