/**
 * Action: settleStipendCycle (docs/PLAN_STIPEND.md §6).
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
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { calcDeadlineMs } from './actionUtils.js';
import { dateField, enumField, fields, gqlStr, numField, run, strField } from '$lib/server/archive/gql.js';
import { computeStipendCycle, cycleWindow } from '$lib/stipend/computeStipendCycle.js';
import { computeStipendEquity } from '$lib/stipend/computeStipendEquity.js';
import {
  fetchApprovedHours,
  fetchPledge,
  fetchProgram,
  fetchProjectContext
} from '$lib/server/stipend/read.js';

// `advance` stays in the Strapi enum (dropping a deployed enum value is a
// migration, and rows may already carry it) but is no longer writable from
// here — see src/lib/stipend/ADVANCE_MODE.md.
const MODES = ['equity', 'gift'] as const;

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
  if (pledge.funderId !== userId) {
    throw new Error('Only the funder settles a stipend cycle');
  }
  if (!pledge.projectId || !pledge.recipientId) {
    throw new Error('This pledge is missing its rikma or its recipient');
  }

  const window = params.cycleStart && params.cycleEnd
    ? { cycleStart: String(params.cycleStart), cycleEnd: String(params.cycleEnd) }
    : cycleWindow(params.reference ? String(params.reference) : new Date(), pledge.terms.cycleSize ?? 1);

  // Hours already paid for must not be paid for twice: the previous settlement
  // moved `lastSettledAt` forward, and anything before it is closed business.
  const from =
    pledge.lastSettledAt && new Date(pledge.lastSettledAt) > new Date(window.cycleStart)
      ? pledge.lastSettledAt
      : window.cycleStart;

  const approved = await fetchApprovedHours(exec, pledge.projectId, pledge.recipientId, from);
  const program = pledge.programId ? await fetchProgram(exec, pledge.programId) : null;

  const cycle = computeStipendCycle({
    terms: pledge.terms,
    approved,
    cycleStart: from,
    cycleEnd: window.cycleEnd,
    paidTotal: pledge.paidTotal,
    programRemaining: program?.remainingCap ?? null,
    missionIds: pledge.terms.scope === 'allMissions' ? null : pledge.missionIds
  });

  if (cycle.amount <= 0) {
    return {
      data: { settled: false, reason: 'nothing_approved_this_cycle', ...cycle, ...window },
      updateStrategy: { type: 'none' as const }
    };
  }

  const project = await fetchProjectContext(exec, pledge.projectId);
  const nowISO = new Date().toISOString();
  const lines = computeStipendEquity(cycle.amount, pledge.terms);

  // The money leg. `senderconf` is true because settling *is* the funder saying
  // "I sent it"; `confirmed` waits for the recipient, like every other Haluka.
  const halukaData = fields(
    strField('usersend', pledge.funderId),
    strField('userrecive', pledge.recipientId),
    numField('amount', cycle.amount),
    strField('project', pledge.projectId),
    pledge.matbeaId ? strField('matbea', pledge.matbeaId) : null,
    'senderconf: true',
    'confirmed: false',
    'ushar: true',
    dateField('publishedAt', nowISO)
  );
  const halukaRes = await run(
    exec,
    `mutation { createHaluka(data: { ${halukaData} }) { data { id } } }`,
    'settle:createHaluka'
  );
  const halukaId = halukaRes?.createHaluka?.data?.id ? String(halukaRes.createHaluka.data.id) : null;

  // The ledger row. equityCredit/equityDebit are written now but only *count*
  // once status is `confirmed` — the same invariant a Sale has while its holder
  // claim is still open.
  const paymentRes = await run(
    exec,
    `mutation { createStipendPayment(data: { ${fields(
      strField('project', pledge.projectId),
      strField('stipend_pledge', pledgeId),
      program ? strField('stipend_program', program.id) : null,
      strField('funder', pledge.funderId),
      strField('recipient', pledge.recipientId),
      dateField('cycleStart', from),
      dateField('cycleEnd', window.cycleEnd),
      numField('hours', cycle.hours),
      numField('stipendRate', pledge.terms.stipendRate),
      numField('amount', cycle.amount),
      numField('equityCredit', lines.equityCredit),
      numField('equityDebit', lines.equityDebit),
      enumField('mode', pledge.terms.mode, MODES),
      numField('costShare', pledge.terms.costShare),
      numField('equityMultiplier', pledge.terms.equityMultiplier),
      'status: sent',
      halukaId ? strField('haluka', halukaId) : null,
      pledge.matbeaId ? strField('matbea', pledge.matbeaId) : null,
      strField(
        'note',
        `stipend · ${cycle.hours}h × ${pledge.terms.stipendRate}${cycle.cappedBy ? ` · capped by ${cycle.cappedBy}` : ''}`
      ),
      dateField('publishedAt', nowISO)
    )} }) { data { id } } }`,
    'settle:createPayment'
  );
  const paymentId = paymentRes?.createStipendPayment?.data?.id
    ? String(paymentRes.createStipendPayment.data.id)
    : null;
  if (!paymentId) throw new Error('Failed to record the stipend payment');

  // Silence-as-consent on "did it arrive?": same pattern as a sale claim —
  // no answer within the rikma's restime confirms the last version on the
  // table, and "I got nothing" is a counter of amount 0, not a veto.
  let timegramaId: string | null = null;
  try {
    const deadline = new Date(Date.now() + calcDeadlineMs(project?.restime ?? 'feh'));
    const tg = await run(
      exec,
      `mutation { createTimegrama(data: { ${fields(
        dateField('date', deadline),
        strField('whatami', 'stipend_payment'),
        strField('stipend_payment', paymentId),
        'done: false'
      )} }) { data { id } } }`,
      'settle:timegrama'
    );
    timegramaId = tg?.createTimegrama?.data?.id ? String(tg.createTimegrama.data.id) : null;
  } catch (e) {
    console.warn('[settleStipendCycle] confirmation clock failed:', e);
  }

  // Move the pledge's own counters. `paidTotal` is what the next cycle's
  // remaining budget is measured against.
  const newPaid = Math.round((pledge.paidTotal + cycle.amount) * 100) / 100;
  await run(
    exec,
    `mutation { updateStipendPledge(id: ${gqlStr(pledgeId)}, data: { ${fields(
      numField('paidTotal', newPaid),
      dateField('lastSettledAt', window.cycleEnd),
      cycle.exhausts ? 'status: exhausted' : null
    )} }) { data { id } } }`,
    'settle:updatePledge'
  );

  if (program) {
    await run(
      exec,
      `mutation { updateStipendProgram(id: ${gqlStr(program.id)}, data: { ${fields(
        numField('spent', Math.round((program.spent + cycle.amount) * 100) / 100),
        program.remainingCap != null && program.remainingCap - cycle.amount <= 0 ? 'status: exhausted' : null
      )} }) { data { id } } }`,
      'settle:updateProgram'
    ).catch((e) => console.warn('[settleStipendCycle] program counter update failed:', e));
  }

  if (notifier) {
    notifier
      .notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates: {
            title: { he: 'מלגת הקיום נשלחה', en: 'Your stipend was sent' },
            body: {
              he: `${cycle.hours} שעות שאושרו × ₪${pledge.terms.stipendRate} = ₪${cycle.amount}. אישור הקבלה הוא מה שמעדכן את האחוזים — בלעדיו כלום לא זז.`,
              en: `${cycle.hours} approved hours × ${pledge.terms.stipendRate} = ${cycle.amount}. Confirming it arrived is what updates the shares — until then nothing moves.`
            }
          },
          channels: ['socket', 'push'],
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
      timegramaId,
      ...cycle,
      cycleStart: from,
      cycleEnd: window.cycleEnd,
      equityCredit: lines.equityCredit,
      equityDebit: lines.equityDebit
    },
    updateStrategy: { type: 'fullRefresh' as const }
  };
};

export const settleStipendCycleConfig: ActionConfig = {
  key: 'settleStipendCycle',
  description:
    'Close one stipend cycle: derive the amount from approved hours × the pledged rate (capped), create the Haluka and the stipend-payment ledger row, and start the recipient’s confirmation clock.',
  graphqlOperation: handler,

  paramSchema: {
    pledgeId: { type: 'string', required: true, description: 'The pledge being settled' },
    reference: { type: 'string', required: false, description: 'Any date inside the cycle (defaults to now)' },
    cycleStart: { type: 'string', required: false, description: 'Explicit window start' },
    cycleEnd: { type: 'string', required: false, description: 'Explicit window end' }
  },

  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to settle a stipend cycle' }],

  updateStrategy: { type: 'fullRefresh' }
};
