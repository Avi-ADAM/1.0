/**
 * Opening and reading an archive/edit Decision (PLAN_OBJECT_ARCHIVAL).
 *
 * No new voting model and no new pending collection: the flow rides the
 * existing `Decision` (project super-principle). What is new is the round
 * shape — `negoarch` — where each round carries a `mode`, so a negotiation can
 * turn "remove this" into "keep it, but change these details" without leaving
 * the same Decision, the same votes and the same clock.
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
  type Exec,
} from './gql.js';
import { TARGET_META, type ArchiveTarget, type TargetKind } from './targets.js';
import type { ArchiveScope, HoursOutcome, RoundMode, StandingRound } from './apply.js';

export type DecisionKind = 'archiveObject' | 'editObject';
export type ArchiveSource = 'user' | 'dormancy';

const MODES: readonly RoundMode[] = ['archive', 'keep'];
const OUTCOMES: readonly HoursOutcome[] = ['credit', 'waive', 'transfer', 'endOfCycle'];
const SCOPES: readonly ArchiveScope[] = ['archive', 'release'];
const SOURCES: readonly ArchiveSource[] = ['user', 'dormancy'];
const KINDS: readonly DecisionKind[] = ['archiveObject', 'editObject'];
const TARGETS: readonly TargetKind[] = [
  'openMission',
  'missionInProgress',
  'openResource',
  'resourceInProgress',
  'matanot',
];

export interface Vot {
  userId: string;
  order: number;
  what: boolean;
  zman?: string;
}

/** One `desision.negoarch` entry, serialised for an inline mutation. */
export function roundFragment(round: StandingRound, proposedBy: string, zman: string): string {
  return `{ ${fields(
    numField('ordern', round.ordern ?? 1),
    enumField('mode', round.mode, MODES),
    strField('why', round.why),
    strField('proposedBy', proposedBy),
    dateField('zman', zman),
    strField('name', round.name),
    strField('descrip', round.descrip),
    numField('hm', round.hm),
    numField('price', round.price),
    round.kindOf ? `kindOf: ${round.kindOf}` : null,
    dateField('sqadualed', round.sqadualed),
    dateField('sqadualedf', round.sqadualedf),
    enumField('hoursOutcome', round.hoursOutcome, OUTCOMES),
    numField('hoursToCredit', round.hoursToCredit),
    round.transferToId ? strField('transferTo', round.transferToId) : null,
    dateField('effectiveFrom', round.effectiveFrom),
  )} }`;
}

/** Serialise votes as `ComponentProjectsVotsInput` entries. */
export function votsFragment(vots: Vot[]): string {
  return vots
    .map(
      (v) =>
        `{ ${fields(
          `what: ${v.what !== false}`,
          strField('users_permissions_user', v.userId),
          numField('order', v.order ?? 1),
          numField('ide', parseInt(String(v.userId), 10)),
          dateField('zman', v.zman ?? new Date().toISOString()),
        )} }`,
    )
    .join(', ');
}

export interface OpenDecisionInput {
  kind: DecisionKind;
  target: ArchiveTarget;
  round: StandingRound;
  scope: ArchiveScope;
  source: ArchiveSource;
  why?: string | null;
  /** Who opened it. A dormancy-opened proposal still needs a signer. */
  initiatorId: string;
  decisionName: string;
  /**
   * Set when approving this would also end someone's membership of the rikma
   * (their only commitment, nothing accrued). Stored on the Decision so the
   * card can say so before anyone signs — the consequence must never be a
   * surprise discovered after the fact.
   */
  endsMembership?: boolean;
  memberId?: string | null;
}

export interface OpenDecisionResult {
  decisionId: string;
  timegramaId: string | null;
  deadline: string;
}

/**
 * Open the proposal: Decision + round 1 + the initiator's signature on it +
 * the silence clock. Proposing IS agreeing, so the initiator's vote is part of
 * the same write — a proposal nobody signed would mature into nothing.
 */
export async function openObjectChangeDecision(
  exec: Exec,
  input: OpenDecisionInput,
): Promise<OpenDecisionResult> {
  const { kind, target, round, scope, source, why, initiatorId, decisionName } = input;
  const { endsMembership, memberId } = input;
  const now = new Date();
  const nowISO = now.toISOString();
  const deadline = new Date(now.getTime() + calcDeadlineMs(target.projectRestime ?? 'feh'));

  const targetRelation = TARGET_META[target.kind].decisionField;

  const data = fields(
    enumField('kind', kind, KINDS),
    enumField('targetKind', target.kind, TARGETS),
    enumField('archScope', scope, SCOPES),
    enumField('archSource', source, SOURCES),
    strField('decisionName', decisionName),
    strField('archWhy', why),
    strField(targetRelation, target.id),
    endsMembership ? 'archEndsMembership: true' : null,
    endsMembership && memberId ? strField('archMember', memberId) : null,
    target.projectId ? `projects: [${gqlStr(target.projectId)}]` : null,
    dateField('publishedAt', nowISO),
    `negoarch: [${roundFragment({ ...round, ordern: 1 }, initiatorId, nowISO)}]`,
    `vots: [${votsFragment([{ userId: initiatorId, order: 1, what: true, zman: nowISO }])}]`,
  );

  const created = await run(
    exec,
    `mutation { createDecision(data: { ${data} }) { data { id } } }`,
    'openDecision',
  );
  const decisionId = created?.createDecision?.data?.id;
  if (!decisionId) throw new Error('Failed to open the archive decision');

  // Silence-as-consent clock. A failure here must not lose the decision — it
  // would just never mature on its own, which the vote path still resolves.
  let timegramaId: string | null = null;
  try {
    const tg = await run(
      exec,
      `mutation { createTimegrama(data: { ${fields(
        dateField('date', deadline),
        strField('whatami', 'decision'),
        strField('decision', String(decisionId)),
        'done: false',
      )} }) { data { id } } }`,
      'openDecision:timegrama',
    );
    timegramaId = tg?.createTimegrama?.data?.id ? String(tg.createTimegrama.data.id) : null;
  } catch (e) {
    console.warn('[archive] timegrama creation failed — decision will not mature on silence:', e);
  }

  return { decisionId: String(decisionId), timegramaId, deadline: deadline.toISOString() };
}

/** Close a decision once its standing version has been applied. */
export async function closeDecision(
  exec: Exec,
  decisionId: string,
  timegramaId?: string | null,
): Promise<void> {
  await run(
    exec,
    `mutation { updateDecision(id: ${gqlStr(decisionId)}, data: { archived: true }) { data { id } } }`,
    'closeDecision',
  );
  if (timegramaId) {
    await run(
      exec,
      `mutation { updateTimegrama(id: ${gqlStr(timegramaId)}, data: { done: true }) { data { id } } }`,
      'closeDecision:timegrama',
    ).catch((e) => console.warn('[archive] marking timegrama done failed (non-fatal):', e));
  }
}
