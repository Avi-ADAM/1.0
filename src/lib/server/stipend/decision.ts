/**
 * Opening and reading a stipend Decision (docs/PLAN_STIPEND.md §5).
 *
 * No new voting model: a stipend proposal is a `Decision` with a new `kind` and
 * a new round component (`negostip`), exactly as `archiveObject` did. What
 * differs between the two kinds is only *who signs*:
 *
 *   - `stipendPledge`  — bilateral: the funder and the recipient. Nobody else's
 *     percentage moves, so nobody else is asked.
 *   - `stipendProgram` — rikma-wide: it raises the rikma's total, which dilutes
 *     every member, so every member signs.
 *
 * Every round carries the **whole** set of terms. That is what makes a counter
 * a counter-*offer* — "not at ₪50, but I'll do ₪30" — instead of a refusal.
 */

import { calcDeadlineMs } from '$lib/server/actions/configs/actionUtils.js';
import {
  dateField,
  enumField,
  fields,
  gqlStr,
  numField,
  run,
  strField,
  type Exec
} from '$lib/server/archive/gql.js';
import { normalizeTerms } from '$lib/stipend/computeStipendEquity.js';
import type { PartialStipendTerms, StipendTerms } from '$lib/stipend/types.js';

export type StipendDecisionKind = 'stipendProgram' | 'stipendPledge';

const MODES = ['equity', 'advance', 'gift'] as const;
const SCOPES = ['allMissions', 'selectedMissions', 'singleMission'] as const;
const RECOURSES = ['nonRecourse', 'personal'] as const;
const KINDS = ['stipendProgram', 'stipendPledge'] as const;

export interface StipendRound extends StipendTerms {
  ordern: number;
  why?: string | null;
  proposedById?: string | null;
  zman?: string | null;
}

/** Serialise one `desision.negostipend` round for an inline mutation. */
export function roundFragment(
  round: PartialStipendTerms & { ordern?: number; why?: string | null },
  proposedBy: string,
  zman: string
): string {
  const t = normalizeTerms(round);
  return `{ ${fields(
    numField('ordern', round.ordern ?? 1),
    strField('why', round.why),
    strField('proposedBy', proposedBy),
    dateField('zman', zman),
    enumField('mode', t.mode, MODES),
    numField('costShare', t.costShare),
    numField('equityMultiplier', t.equityMultiplier),
    numField('stipendRate', t.stipendRate),
    numField('monthlyCap', t.monthlyCap),
    numField('totalCap', t.totalCap),
    numField('noticeCycles', t.noticeCycles),
    numField('revenueTrigger', t.revenueTrigger),
    enumField('recourse', t.recourse, RECOURSES),
    enumField('scope', t.scope, SCOPES),
    dateField('start', t.start),
    dateField('end', t.end),
    numField('cycleSize', t.cycleSize)
  )} }`;
}

export interface Vot {
  userId: string;
  order: number;
  what: boolean;
  zman?: string;
}

export function votsFragment(vots: Vot[]): string {
  return vots
    .map(
      (v) =>
        `{ ${fields(
          `what: ${v.what !== false}`,
          strField('users_permissions_user', v.userId),
          numField('order', v.order ?? 1),
          numField('ide', parseInt(String(v.userId), 10)),
          dateField('zman', v.zman ?? new Date().toISOString())
        )} }`
    )
    .join(', ');
}

export interface OpenStipendDecisionInput {
  kind: StipendDecisionKind;
  projectId: string;
  projectRestime?: string | null;
  decisionName: string;
  terms: PartialStipendTerms;
  why?: string | null;
  /** Who opened it — proposing is agreeing, so they sign round 1 in the same write. */
  initiatorId: string;
  funderId?: string | null;
  recipientId?: string | null;
  /** Existing rows the proposal amends, when it is a re-negotiation. */
  programId?: string | null;
  pledgeId?: string | null;
}

export interface OpenStipendDecisionResult {
  decisionId: string;
  timegramaId: string | null;
  deadline: string;
}

export async function openStipendDecision(
  exec: Exec,
  input: OpenStipendDecisionInput
): Promise<OpenStipendDecisionResult> {
  const now = new Date();
  const nowISO = now.toISOString();
  const deadline = new Date(now.getTime() + calcDeadlineMs(input.projectRestime ?? 'feh'));

  const data = fields(
    enumField('kind', input.kind, KINDS),
    strField('decisionName', input.decisionName),
    strField('archWhy', input.why),
    input.funderId ? strField('stipFunder', input.funderId) : null,
    input.recipientId ? strField('stipRecipient', input.recipientId) : null,
    input.programId ? strField('stipendProgram', input.programId) : null,
    input.pledgeId ? strField('stipendPledge', input.pledgeId) : null,
    `projects: [${gqlStr(input.projectId)}]`,
    dateField('publishedAt', nowISO),
    `negostip: [${roundFragment({ ...input.terms, ordern: 1, why: input.why }, input.initiatorId, nowISO)}]`,
    `vots: [${votsFragment([{ userId: input.initiatorId, order: 1, what: true, zman: nowISO }])}]`
  );

  const created = await run(
    exec,
    `mutation { createDecision(data: { ${data} }) { data { id } } }`,
    'openStipendDecision'
  );
  const decisionId = created?.createDecision?.data?.id;
  if (!decisionId) throw new Error('Failed to open the stipend decision');

  // Silence-as-consent clock. Losing it costs the automatic maturation, never
  // the proposal itself — an explicit vote still resolves it.
  let timegramaId: string | null = null;
  try {
    const tg = await run(
      exec,
      `mutation { createTimegrama(data: { ${fields(
        dateField('date', deadline),
        strField('whatami', 'decision'),
        strField('decision', String(decisionId)),
        'done: false'
      )} }) { data { id } } }`,
      'openStipendDecision:timegrama'
    );
    timegramaId = tg?.createTimegrama?.data?.id ? String(tg.createTimegrama.data.id) : null;
  } catch (e) {
    console.warn('[stipend] timegrama creation failed — proposal will not mature on silence:', e);
  }

  return { decisionId: String(decisionId), timegramaId, deadline: deadline.toISOString() };
}

/** Add a counter round and restart the clock (a counter resets restime). */
export async function addStipendRound(
  exec: Exec,
  input: {
    decisionId: string;
    rounds: StipendRound[];
    vots: Vot[];
    terms: PartialStipendTerms;
    why?: string | null;
    proposedById: string;
    ordern: number;
    projectRestime?: string | null;
    oldTimegramaId?: string | null;
  }
): Promise<{ ordern: number; timegramaId: string | null; deadline: string }> {
  const now = new Date();
  const nowISO = now.toISOString();
  const deadline = new Date(now.getTime() + calcDeadlineMs(input.projectRestime ?? 'feh'));

  const rounds = [
    ...input.rounds.map((r) =>
      roundFragment({ ...r, ordern: r.ordern, why: r.why }, r.proposedById ?? '', r.zman ?? nowISO)
    ),
    roundFragment({ ...input.terms, ordern: input.ordern, why: input.why }, input.proposedById, nowISO)
  ];
  // Proposing the new version is signing it — the counter-proposer never has to
  // vote on their own counter.
  const vots = [
    ...input.vots,
    { userId: input.proposedById, order: input.ordern, what: true, zman: nowISO }
  ];

  await run(
    exec,
    `mutation { updateDecision(id: ${gqlStr(input.decisionId)}, data: {
      negostip: [${rounds.join(', ')}],
      vots: [${votsFragment(vots)}]
    }) { data { id } } }`,
    'addStipendRound'
  );

  if (input.oldTimegramaId) {
    await run(
      exec,
      `mutation { updateTimegrama(id: ${gqlStr(input.oldTimegramaId)}, data: { done: true }) { data { id } } }`,
      'addStipendRound:closeClock'
    ).catch((e) => console.warn('[stipend] closing the old clock failed (non-fatal):', e));
  }

  let timegramaId: string | null = null;
  try {
    const tg = await run(
      exec,
      `mutation { createTimegrama(data: { ${fields(
        dateField('date', deadline),
        strField('whatami', 'decision'),
        strField('decision', String(input.decisionId)),
        'done: false'
      )} }) { data { id } } }`,
      'addStipendRound:timegrama'
    );
    timegramaId = tg?.createTimegrama?.data?.id ? String(tg.createTimegrama.data.id) : null;
  } catch (e) {
    console.warn('[stipend] new clock creation failed:', e);
  }

  return { ordern: input.ordern, timegramaId, deadline: deadline.toISOString() };
}

export async function closeStipendDecision(
  exec: Exec,
  decisionId: string,
  timegramaId?: string | null
): Promise<void> {
  await run(
    exec,
    `mutation { updateDecision(id: ${gqlStr(decisionId)}, data: { archived: true }) { data { id } } }`,
    'closeStipendDecision'
  );
  if (timegramaId) {
    await run(
      exec,
      `mutation { updateTimegrama(id: ${gqlStr(timegramaId)}, data: { done: true }) { data { id } } }`,
      'closeStipendDecision:timegrama'
    ).catch((e) => console.warn('[stipend] marking timegrama done failed (non-fatal):', e));
  }
}
