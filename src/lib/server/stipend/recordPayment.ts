/**
 * Writing one stipend payment: the money leg (Haluka), the transfer chat when
 * the money has not moved yet, the ledger row, and the "did it arrive?" clock.
 *
 * Both ways of paying a stipend write exactly this — closing a cycle
 * (`settleStipendCycle`) and deciding on the hours the monthly ceiling held
 * back (`resolveStipendOverCap`) — so the two can never disagree about what a
 * payment row means.
 *
 *   pending   — settled, the money has not gone out; a chat, no clock.
 *   sent      — the funder says it went out; the recipient's silence-as-consent
 *               clock starts (restime), "I got nothing" is a counter of 0.
 *   confirmed — the recipient wrote it themselves: their receipt *is* the
 *               confirmation, so no clock. With amount 0 it is a release —
 *               hours metered, nothing paid, no share moved.
 */

import { calcDeadlineMs } from '$lib/server/actions/configs/actionUtils.js';
import { dateField, enumField, fields, numField, run, strField, type Exec } from '$lib/server/archive/gql.js';
import { computeStipendEquity } from '$lib/stipend/computeStipendEquity.js';

// `advance` stays in the Strapi enum but is no longer writable — see
// src/lib/stipend/ADVANCE_MODE.md.
const MODES = ['equity', 'gift'] as const;

export type PaymentState = 'pending' | 'sent' | 'confirmed';

export interface RecordPaymentInput {
  pledge: {
    id: string;
    projectId: string | null;
    funderId: string | null;
    recipientId: string | null;
    matbeaId?: string | null;
    terms: any;
  };
  program?: { id: string } | null;
  restime?: string | null;
  amount: number;
  hours: number;
  cycleStart: string;
  cycleEnd: string;
  state: PaymentState;
  note: string;
  /** Log prefix for the non-fatal warnings. */
  tag: string;
}

export interface RecordedPayment {
  paymentId: string;
  halukaId: string | null;
  forumId: string | null;
  timegramaId: string | null;
  equityCredit: number;
  equityDebit: number;
}

export async function recordStipendPayment(exec: Exec, input: RecordPaymentInput): Promise<RecordedPayment> {
  const { pledge, program, amount, hours, state } = input;
  const nowISO = new Date().toISOString();
  const lines = computeStipendEquity(amount, pledge.terms);
  const sent = state !== 'pending';
  const byRecipient = state === 'confirmed';

  // The money leg. `senderconf` is the funder's own statement that they sent
  // it; `confirmed` waits for the recipient, like every other Haluka — unless
  // the recipient is the one writing it, in which case the arrival testifies
  // to both. A release (amount 0) moves no money, so it has no money leg.
  let halukaId: string | null = null;
  if (amount > 0) {
    const halukaRes = await run(
      exec,
      `mutation { createHaluka(data: { ${fields(
        strField('usersend', pledge.funderId),
        strField('userrecive', pledge.recipientId),
        numField('amount', amount),
        strField('project', pledge.projectId),
        pledge.matbeaId ? strField('matbea', pledge.matbeaId) : null,
        sent ? 'senderconf: true' : 'senderconf: false',
        byRecipient ? 'confirmed: true' : 'confirmed: false',
        'ushar: true',
        dateField('publishedAt', nowISO)
      )} }) { data { id } } }`,
      `${input.tag}:createHaluka`
    );
    halukaId = halukaRes?.createHaluka?.data?.id ? String(halukaRes.createHaluka.data.id) : null;
  }

  // The coordination channel. Created up front only when the money has *not*
  // moved yet, because that is the case where the two of them still have
  // something to arrange ("which account", "Tuesday") — and a chat that has to
  // be created before it can be opened is a chat nobody opens.
  let forumId: string | null = null;
  if (!sent && halukaId) {
    const forumRes = await run(
      exec,
      `mutation { createForum(data: { ${fields(
        strField('project', pledge.projectId),
        strField('haluka', halukaId),
        dateField('publishedAt', nowISO)
      )} }) { data { id } } }`,
      `${input.tag}:createForum`
    ).catch((e) => {
      console.warn(`[${input.tag}] transfer chat creation failed (non-fatal):`, e);
      return null;
    });
    forumId = forumRes?.createForum?.data?.id ? String(forumRes.createForum.data.id) : null;
  }

  // The ledger row. equityCredit/equityDebit are written now but only *count*
  // once status is `confirmed` — the same invariant a Sale has while its holder
  // claim is still open. A recipient's receipt *is* that confirmation.
  const paymentRes = await run(
    exec,
    `mutation { createStipendPayment(data: { ${fields(
      strField('project', pledge.projectId),
      strField('stipend_pledge', pledge.id),
      program ? strField('stipend_program', program.id) : null,
      strField('funder', pledge.funderId),
      strField('recipient', pledge.recipientId),
      dateField('cycleStart', input.cycleStart),
      dateField('cycleEnd', input.cycleEnd),
      numField('hours', hours),
      numField('stipendRate', pledge.terms.stipendRate),
      numField('amount', amount),
      numField('equityCredit', lines.equityCredit),
      numField('equityDebit', lines.equityDebit),
      enumField('mode', pledge.terms.mode, MODES),
      numField('costShare', pledge.terms.costShare),
      numField('equityMultiplier', pledge.terms.equityMultiplier),
      `status: ${state}`,
      byRecipient ? 'confirmedBy: recipient' : null,
      byRecipient ? dateField('confirmedAt', nowISO) : null,
      halukaId ? strField('haluka', halukaId) : null,
      pledge.matbeaId ? strField('matbea', pledge.matbeaId) : null,
      strField('note', input.note),
      dateField('publishedAt', nowISO)
    )} }) { data { id } } }`,
    `${input.tag}:createPayment`
  );
  const paymentId = paymentRes?.createStipendPayment?.data?.id
    ? String(paymentRes.createStipendPayment.data.id)
    : null;
  if (!paymentId) throw new Error('Failed to record the stipend payment');

  // Silence-as-consent on "did it arrive?": same pattern as a sale claim —
  // no answer within the rikma's restime confirms the last version on the
  // table, and "I got nothing" is a counter of amount 0, not a veto.
  //
  // A payment that has not been transferred yet gets **no** clock: silence
  // cannot confirm the arrival of money nobody sent. The clock starts when the
  // funder says it went out (`markStipendTransferSent`). A receipt the
  // recipient declared has its answer already — no clock either.
  let timegramaId: string | null = null;
  if (state === 'sent') {
    try {
      const deadline = new Date(Date.now() + calcDeadlineMs(input.restime ?? 'feh'));
      const tg = await run(
        exec,
        `mutation { createTimegrama(data: { ${fields(
          dateField('date', deadline),
          strField('whatami', 'stipend_payment'),
          strField('stipend_payment', paymentId),
          'done: false'
        )} }) { data { id } } }`,
        `${input.tag}:timegrama`
      );
      timegramaId = tg?.createTimegrama?.data?.id ? String(tg.createTimegrama.data.id) : null;
    } catch (e) {
      console.warn(`[${input.tag}] confirmation clock failed:`, e);
    }
  }

  return {
    paymentId,
    halukaId,
    forumId,
    timegramaId,
    equityCredit: lines.equityCredit,
    equityDebit: lines.equityDebit
  };
}
