/**
 * Signing and countering an archive/edit proposal
 * (PLAN_OBJECT_ARCHIVAL — phase 2).
 *
 * Two moves, one shape. Both write a vote at a round number, because the
 * question is never "yes or no" — it is "which version of this do you stand
 * behind". Signing joins the standing round; countering opens the next one and
 * signs *that*, since proposing is agreeing.
 *
 * There is no third move that ends the conversation: disagreement is expressed
 * by countering with `mode: 'keep'`, which turns a removal proposal into an
 * edit proposal on the very same Decision.
 */

import { calcDeadlineMs } from '$lib/server/actions/configs/actionUtils.js';
import { applyObjectChange, type ApplyResult, type StandingRound } from './apply.js';
import { closeDecision, roundFragment, votsFragment } from './decision.js';
import { dateField, fields, gqlStr, run, strField, type Exec } from './gql.js';
import {
  fetchObjectChangeDecision,
  hasConsensus,
  isMyTurn,
  signersOf,
  standingOrder,
  standingRound,
  type ArchRound,
  type ObjectChangeDecision,
} from './read.js';
import { fetchTarget } from './targets.js';
import { assertStandingRound } from '$lib/server/nego/candidacyVote.js';

export interface VoteOutcome {
  decisionId: string;
  order: number;
  consensus: boolean;
  applied?: ApplyResult;
  /** Members (and any extra signers) still owing an answer on the standing round. */
  awaiting: string[];
}

/**
 * People outside the rikma whose signature a version may need — a deal's customer when the
 * version raises what she pays (QA_CONCIERGE_E2E C-14, `$lib/server/sheirut/dealEdit`).
 * The caller supplies them; this module knows nothing about deals.
 *
 * Their silence is never their yes. The members keep their own rule: once the clock of the
 * version on the table ran out, their silence is theirs, and the extra signature is the
 * last one missing.
 */
export interface ExtraSigners {
  ids: string[];
  /** Whether this version needs them at all. */
  needed: (round: ArchRound) => boolean;
  /** Runs after any version of this decision is applied (the deal follows the new terms). */
  onApplied?: (round: ArchRound) => Promise<unknown>;
}

export type ExtraSignersFor = (decision: ObjectChangeDecision) => Promise<ExtraSigners | null>;

/** The members' clock on the version on the table ran out (a counter resets it). */
function clockRanOut(decision: ObjectChangeDecision, now = Date.now()): boolean {
  const t = decision.timegramaDate ? Date.parse(decision.timegramaDate) : NaN;
  return Number.isFinite(t) && t <= now;
}

/** Persist the Decision's full vote list (the component is replace-only). */
async function writeVots(exec: Exec, decisionId: string, vots: Array<{ userId: string; order: number; what: boolean; zman?: string | null }>) {
  await run(
    exec,
    `mutation { updateDecision(id: ${gqlStr(decisionId)}, data: { vots: [${votsFragment(
      vots.map((v) => ({ userId: v.userId, order: v.order, what: v.what, zman: v.zman ?? undefined })),
    )}] }) { data { id } } }`,
    'writeVots',
  );
}

/**
 * Sign the standing round. On unanimity the standing version is applied and
 * the Decision closes; otherwise the vote is simply recorded and the clock
 * keeps running.
 */
export async function signObjectChange(
  exec: Exec,
  decisionId: string,
  userId: string,
  extraFor?: ExtraSignersFor,
  /** The round the signer was shown (a notice); ROUND_MOVED if a counter replaced it since. */
  expectRound?: unknown,
): Promise<VoteOutcome> {
  const decision = await fetchObjectChangeDecision(exec, decisionId);
  if (!decision) throw new Error(`Archive decision ${decisionId} not found`);
  if (decision.archived) throw new Error('This proposal is already resolved');

  const extra = extraFor ? await extraFor(decision) : null;
  const uid = String(userId);
  if (!decision.memberIds.includes(uid) && !extra?.ids.includes(uid)) {
    throw new Error('Only a member of the rikma may sign this proposal');
  }

  const order = standingOrder(decision);
  assertStandingRound(expectRound, order);
  if (signersOf(decision, order).includes(uid)) {
    throw new Error('You already stand behind the current version');
  }

  // Votes from earlier rounds are kept: they are the record of how the
  // conversation got here, and dropping them would erase the negotiation.
  const vots = [
    ...decision.vots,
    { userId: uid, order, what: true, zman: new Date().toISOString() },
  ];
  await writeVots(exec, decisionId, vots);

  const signed = new Set([...signersOf(decision, order), uid]);
  const round = standingRound(decision);
  const needed = extra && extra.needed(round) ? extra.ids : [];
  const membersSigned = decision.memberIds.every((id) => signed.has(id));
  // Only when someone outside the rikma has to sign does an expired clock count here: the
  // members' silence already matured, and the timegrama left the version open for them.
  const membersOk = membersSigned || (needed.length > 0 && clockRanOut(decision));
  const consensus = membersOk && needed.every((id) => signed.has(id));
  const awaiting = [
    ...(membersOk ? [] : decision.memberIds.filter((id) => !signed.has(id))),
    ...needed.filter((id) => !signed.has(id)),
  ];

  if (!consensus) return { decisionId, order, consensus: false, awaiting };

  const applied = await applyStandingVersion(exec, decision);
  if (extra?.onApplied) {
    await extra.onApplied(round).catch((e) => console.error('[archive] applied, but the follow-up failed:', e));
  }
  return { decisionId, order, consensus: true, applied, awaiting: [] };
}

/**
 * Apply whatever version is currently on the table and close the Decision.
 * Shared by the unanimity path and the silence path so the two cannot differ.
 */
export async function applyStandingVersion(
  exec: Exec,
  decision: ObjectChangeDecision,
): Promise<ApplyResult> {
  const round = standingRound(decision);
  const target = await fetchTarget(exec, decision.targetKind, decision.targetId);
  if (!target) throw new Error(`${decision.targetKind} ${decision.targetId} not found`);

  const applied = await applyObjectChange(exec, {
    target,
    round,
    // A `keep` round leaves the object alive, so the archive/release
    // distinction only matters when it is actually leaving.
    scope: round.mode === 'keep' ? 'archive' : decision.scope,
    why: round.why ?? decision.why,
    // The standing round's author is the one whose version is being applied, so
    // the counter rounds it sends to pending candidates are signed by them.
    actorId: round.proposedById,
  });

  await closeDecision(exec, decision.id, decision.timegramaId);
  return applied;
}

export interface CounterInput {
  decisionId: string;
  userId: string;
  round: Omit<StandingRound, 'ordern'>;
  /** Extra signers may counter too — a customer puts her own hours / rate on the table. */
  extraFor?: ExtraSignersFor;
}

/**
 * Counter with a different version. This is the move that replaces "no":
 * `mode: 'keep'` says "don't remove it — change it to this instead", and
 * `mode: 'archive'` refines the removal terms (different hours settlement,
 * a different effective date).
 *
 * Resets the silence clock, because the rikma is being asked something new.
 */
export async function counterObjectChange(
  exec: Exec,
  { decisionId, userId, round, extraFor }: CounterInput,
): Promise<{
  decisionId: string;
  order: number;
  deadline: string | null;
  /** The version now on the table, and who besides the members has to sign it. */
  standing: StandingRound;
  extra: ExtraSigners | null;
  decision: ObjectChangeDecision;
}> {
  const decision = await fetchObjectChangeDecision(exec, decisionId);
  if (!decision) throw new Error(`Archive decision ${decisionId} not found`);
  if (decision.archived) throw new Error('This proposal is already resolved');

  const extra = extraFor ? await extraFor(decision) : null;
  const uid = String(userId);
  if (!decision.memberIds.includes(uid) && !extra?.ids.includes(uid)) {
    throw new Error('Only a member of the rikma may counter this proposal');
  }

  const current = standingOrder(decision);
  if (signersOf(decision, current).includes(uid)) {
    throw new Error("It's not your turn - you already stand behind the current version");
  }

  const newOrder = current + 1;
  const nowISO = new Date().toISOString();
  const previous = standingRound(decision);

  // Unspecified fields inherit the standing version rather than resetting to
  // null: a counter about the hours should not silently wipe the agreed dates.
  const merged: StandingRound = {
    ordern: newOrder,
    mode: round.mode,
    why: round.why ?? null,
    name: round.name ?? previous.name ?? null,
    descrip: round.descrip ?? previous.descrip ?? null,
    hm: round.hm ?? previous.hm ?? null,
    price: round.price ?? previous.price ?? null,
    kindOf: round.kindOf ?? previous.kindOf ?? null,
    sqadualed: round.sqadualed ?? previous.sqadualed ?? null,
    sqadualedf: round.sqadualedf ?? previous.sqadualedf ?? null,
    hoursOutcome: round.hoursOutcome ?? previous.hoursOutcome ?? null,
    hoursToCredit: round.hoursToCredit ?? previous.hoursToCredit ?? null,
    transferToId: round.transferToId ?? previous.transferToId ?? null,
    effectiveFrom: round.effectiveFrom ?? previous.effectiveFrom ?? null,
  };

  const negoarch = [
    ...decision.rounds.map((r) => roundFragment(r, r.proposedById ?? uid, r.zman ?? nowISO)),
    roundFragment(merged, uid, nowISO),
  ].join(', ');

  // Proposing is agreeing: the counter carries its author's signature.
  const vots = votsFragment([
    ...decision.vots.map((v) => ({ userId: v.userId, order: v.order, what: v.what, zman: v.zman ?? undefined })),
    { userId: uid, order: newOrder, what: true, zman: nowISO },
  ]);

  await run(
    exec,
    `mutation { updateDecision(id: ${gqlStr(decisionId)}, data: {
      negoarch: [${negoarch}],
      vots: [${vots}]
    }) { data { id } } }`,
    'counter',
  );

  const deadline = await resetClock(exec, decision);
  return { decisionId, order: newOrder, deadline, standing: merged, extra, decision };
}

/**
 * Close the old timegrama and open a fresh one: a new question deserves a
 * full restime, and leaving the old clock running would mature a version
 * nobody is looking at any more.
 */
async function resetClock(exec: Exec, decision: ObjectChangeDecision): Promise<string | null> {
  const deadline = new Date(Date.now() + calcDeadlineMs(decision.projectRestime ?? 'feh'));

  if (decision.timegramaId) {
    await run(
      exec,
      `mutation { updateTimegrama(id: ${gqlStr(decision.timegramaId)}, data: {
        ${fields(dateField('date', deadline), 'done: false')}
      }) { data { id } } }`,
      'counter:clock',
    ).catch((e) => console.warn('[archive] resetting the clock failed (non-fatal):', e));
    return deadline.toISOString();
  }

  try {
    await run(
      exec,
      `mutation { createTimegrama(data: { ${fields(
        dateField('date', deadline),
        strField('whatami', 'decision'),
        strField('decision', decision.id),
        'done: false',
      )} }) { data { id } } }`,
      'counter:clock:create',
    );
    return deadline.toISOString();
  } catch (e) {
    console.warn('[archive] creating a clock failed (non-fatal):', e);
    return null;
  }
}

export { hasConsensus, standingOrder, standingRound, isMyTurn };
