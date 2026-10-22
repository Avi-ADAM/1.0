/**
 * Consent to an automation rule — the `fulfillmentRule` Decision
 * (docs/inprogress/PLAN_SHOP_OPERATIONS.md §2.3, A2).
 *
 * A rule that lands work on someone else is a bilateral proposal: the author
 * and every holder it lands on. It matures like every commitment on the site —
 * silence within the rikma's `restime` is consent, and a counter-proposal
 * (editing the rule: "only up to 10 deliveries a day") opens a new round and
 * restarts the clock. There is no bare "no".
 *
 * The rounds ride the Decision's `vots`: `order` is the round, the person who
 * opened it votes `what: true`, and everyone asked gets a row with
 * `what: null` — "asked, has not answered". When the clock runs out, everyone
 * asked in the standing round who still holds the work agrees. A holder who
 * joined the role after the round opened was never asked, so their silence is
 * not consent: they agree as part of taking the role, explicitly.
 *
 * Pure; the writes live in `$lib/server/fulfillment/consent.ts`.
 */
import { consentStateOf, type ConsentState } from './plan';

export interface RuleVote {
  userId: string;
  /** true = agreed · null = asked, no answer yet. (false is never written — no absolute no.) */
  what: boolean | null;
  order: number;
  why: string | null;
  zman: string | null;
}

const uidOf = (v: any): string | null => {
  const raw = v?.users_permissions_user?.data?.id ?? v?.users_permissions_user?.id ?? v?.users_permissions_user ?? v?.ide;
  return raw == null || raw === '' ? null : String(raw);
};

/** Decision `vots` (read shape or write shape) → RuleVote[]. */
export function readRuleVotes(raw: unknown): RuleVote[] {
  if (!Array.isArray(raw)) return [];
  const out: RuleVote[] = [];
  for (const v of raw) {
    const userId = uidOf(v);
    if (!userId) continue;
    out.push({
      userId,
      what: v?.what === true ? true : v?.what === false ? false : null,
      order: Number(v?.order ?? 0) || 0,
      why: typeof v?.why === 'string' && v.why ? v.why : null,
      zman: typeof v?.zman === 'string' && v.zman ? v.zman : null
    });
  }
  return out;
}

/** The standing round — a counter moved everyone to a new one. */
export function roundOf(votes: RuleVote[]): number {
  return votes.reduce((mx, v) => Math.max(mx, v.order), 0);
}

/** Who was asked in a round (everyone with a row in it). */
export function askedIn(votes: RuleVote[], round: number): string[] {
  return [...new Set(votes.filter((v) => v.order === round).map((v) => v.userId))];
}

/** Who said yes in a round. */
export function agreedIn(votes: RuleVote[], round: number): string[] {
  return [...new Set(votes.filter((v) => v.order === round && v.what === true).map((v) => v.userId))];
}

/**
 * A new round: everything before it is kept as history, the person opening it
 * says yes, and every target is asked.
 */
export function openRound(votes: RuleVote[], openerId: string, targets: string[], nowIso: string, why?: string | null): RuleVote[] {
  const round = roundOf(votes) + 1;
  const rows: RuleVote[] = [{ userId: openerId, what: true, order: round, why: why ?? null, zman: nowIso }];
  for (const t of new Set(targets)) if (t !== openerId) rows.push({ userId: t, what: null, order: round, why: null, zman: null });
  return [...votes, ...rows];
}

/** An answer in the standing round (replaces the person's row in it). */
export function answerRound(votes: RuleVote[], userId: string, nowIso: string, why?: string | null): RuleVote[] {
  const round = roundOf(votes);
  const kept = votes.filter((v) => !(v.order === round && v.userId === userId));
  return [...kept, { userId, what: true, order: round, why: why ?? null, zman: nowIso }];
}

/**
 * The standing round waits for me, and someone else opened it — a counter to
 * my rule. Who opened it and why (their row is the round's first yes), or null
 * when I am not asked or already answered.
 */
export function roundAskingMe(votes: RuleVote[], userId: string): { openerId: string; why: string | null } | null {
  const round = roundOf(votes);
  if (round === 0) return null;
  const rows = votes.filter((v) => v.order === round);
  if (!rows.some((v) => v.userId === userId && v.what === null)) return null;
  const opener = rows
    .filter((v) => v.what === true && v.userId !== userId)
    .sort((a, b) => (a.zman ?? '').localeCompare(b.zman ?? ''))[0];
  return opener ? { openerId: opener.userId, why: opener.why } : null;
}

/** RuleVote[] → the Decision `vots` component input. */
export function votsInput(votes: RuleVote[]): Array<Record<string, unknown>> {
  return votes.map((v) => {
    const row: Record<string, unknown> = {
      what: v.what,
      order: v.order,
      users_permissions_user: v.userId,
      ide: Number.parseInt(v.userId, 10) || null
    };
    if (v.why) row.why = v.why;
    if (v.zman) row.zman = v.zman;
    return row;
  });
}

/**
 * What the run-out clock decides (§2.3): everyone asked in the standing round
 * who is still a target agrees, and the author's own yes stands. A paused rule
 * stays paused — silence never switches back on what someone stopped.
 */
export function matureRule(input: {
  proposerId: string | null;
  targets: string[];
  consentedBy: string[];
  votes: RuleVote[];
  paused: boolean;
}): { consentedBy: string[]; consentState: ConsentState; agreedBySilence: string[] } {
  const round = roundOf(input.votes);
  const targets = new Set(input.targets);
  const objected = new Set(input.votes.filter((v) => v.order === round && v.what === false).map((v) => v.userId));
  const asked = askedIn(input.votes, round).filter((u) => targets.has(u) && !objected.has(u));
  const before = new Set(input.consentedBy);
  const agreedBySilence = asked.filter((u) => !before.has(u));
  const consentedBy = [...new Set([...input.consentedBy, ...asked])];
  const consentState: ConsentState = input.paused
    ? 'paused'
    : consentStateOf(input.proposerId ?? '', input.targets, consentedBy);
  return { consentedBy, consentState, agreedBySilence };
}

/**
 * Everyone asked in the standing round has said yes — no need to wait for the
 * clock. `mustAgree` narrows or widens who counts; by default, everyone the
 * round asked (the targets, and the author when it is a counter-proposal).
 */
export function roundComplete(votes: RuleVote[], mustAgree?: string[]): boolean {
  const round = roundOf(votes);
  if (round === 0) return false;
  const yes = new Set(agreedIn(votes, round));
  const list = mustAgree ?? askedIn(votes, round);
  return list.length > 0 && list.every((t) => yes.has(t));
}
