// Delta validators (PLAN_rikma_as_state_machine §3, §7).
//
// An event may declare `delta: Delta[]` — the concrete changes it claims to
// make. The verifier recomputes the before/after ProjectState by replaying the
// DAG and checks the declaration against reality:
//
//   soundness    — every declared delta must be true of the transition.
//   completeness — the value-bearing parts of the state (balances, membership)
//                  must not change WITHOUT a covering declaration. Bookkeeping
//                  state (rounds, tosplit votes, snapshots, asOf) may change
//                  undeclared.
//
// A failed check is treated exactly like a bad signature at ingest: the event
// is rejected (plan §7 — "אירוע ש-state-root שלו לא תואם → דחייה").

import type { Delta } from './event';
import type { ProjectState } from './projection';
import { canonicalize, type JsonValue } from '$lib/crypto/canonical';

export type DeltaCheckResult =
  | { ok: true; unchecked: string[]; reason?: undefined }   // unchecked = kinds/paths we could not model yet
  | { ok: false; reason: string };

/** Basis points of a member's balance out of the total. 0 when total <= 0. */
export function shareBps(state: ProjectState, member: string): number {
  let total = 0n;
  for (const v of state.balances.values()) total += v;
  if (total <= 0n) return 0;
  const bal = state.balances.get(member) ?? 0n;
  return Number((bal * 10_000n) / total);
}

function parseAmount(s: string): bigint | null {
  try {
    return BigInt(s);
  } catch {
    return null;
  }
}

type PathValue = { known: true; value: JsonValue } | { known: false };

// Resolve a `value.set` path against the modeled state. Paths we don't model
// yet resolve to unknown and are reported (not failed) — the state machine
// grows paths over time and old verifiers must not reject newer events.
function resolvePath(state: ProjectState, path: string): PathValue {
  const parts = path.split('/');
  if (parts[0] === 'balances' && parts.length === 2) {
    const v = state.balances.get(parts[1]);
    return { known: true, value: v === undefined ? null : v.toString() };
  }
  if (parts[0] === 'members' && parts.length === 2) {
    return { known: true, value: state.members.has(parts[1]) };
  }
  if (parts[0] === 'tosplits' && parts.length === 3 && parts[2] === 'approved') {
    const t = state.tosplits.get(parts[1]);
    return { known: true, value: t ? t.approved : null };
  }
  return { known: false };
}

function sameJson(a: unknown, b: unknown): boolean {
  try {
    return canonicalize(a as JsonValue) === canonicalize(b as JsonValue);
  } catch {
    return false;
  }
}

export function checkDeltas(
  before: ProjectState,
  after: ProjectState,
  deltas: Delta[]
): DeltaCheckResult {
  const unchecked: string[] = [];

  // ── soundness: each declared delta holds ───────────────────────────────
  for (const d of deltas) {
    switch (d.kind) {
      case 'member.add': {
        if (before.members.has(d.member)) return fail(d, `already_member:${d.member}`);
        if (!after.members.has(d.member)) return fail(d, `not_added:${d.member}`);
        break;
      }
      case 'member.remove': {
        if (!before.members.has(d.member)) return fail(d, `not_member:${d.member}`);
        if (after.members.has(d.member)) return fail(d, `not_removed:${d.member}`);
        break;
      }
      case 'hervachti.add': {
        const amount = parseAmount(d.amount);
        if (amount === null) return fail(d, `bad_amount:${d.amount}`);
        const diff = (after.balances.get(d.member) ?? 0n) - (before.balances.get(d.member) ?? 0n);
        if (diff !== amount) return fail(d, `amount_mismatch:${diff}!=${amount}`);
        break;
      }
      case 'hervachti.move': {
        const amount = parseAmount(d.amount);
        if (amount === null) return fail(d, `bad_amount:${d.amount}`);
        const fromDiff = (after.balances.get(d.from) ?? 0n) - (before.balances.get(d.from) ?? 0n);
        const toDiff = (after.balances.get(d.to) ?? 0n) - (before.balances.get(d.to) ?? 0n);
        if (fromDiff !== -amount) return fail(d, `from_mismatch:${fromDiff}!=-${amount}`);
        if (toDiff !== amount) return fail(d, `to_mismatch:${toDiff}!=${amount}`);
        break;
      }
      case 'share.bump': {
        const oldBps = shareBps(before, d.member);
        const newBps = shareBps(after, d.member);
        if (oldBps !== d.oldBps) return fail(d, `old_bps:${oldBps}!=${d.oldBps}`);
        if (newBps !== d.newBps) return fail(d, `new_bps:${newBps}!=${d.newBps}`);
        break;
      }
      case 'value.set': {
        const b = resolvePath(before, d.path);
        const a = resolvePath(after, d.path);
        if (!b.known || !a.known) {
          unchecked.push(`value.set:${d.path}`);
          break;
        }
        if (!sameJson(b.value, d.before)) return fail(d, `before_mismatch:${d.path}`);
        if (!sameJson(a.value, d.after)) return fail(d, `after_mismatch:${d.path}`);
        break;
      }
      case 'consensus.reach': {
        const wantApprove = d.decision === 'approve';
        const round = after.rounds.get(d.subject);
        if (round?.closed) {
          if (round.closed.decision !== d.decision) {
            return fail(d, `round_decision:${round.closed.decision}!=${d.decision}`);
          }
          break;
        }
        const [type, ...rest] = d.subject.split(':');
        if (type === 'tosplit') {
          const t = after.tosplits.get(rest.join(':'));
          if (!t) return fail(d, `unknown_tosplit:${d.subject}`);
          if (t.approved !== wantApprove) return fail(d, `approved:${t.approved}!=${wantApprove}`);
          break;
        }
        unchecked.push(`consensus.reach:${d.subject}`);
        break;
      }
      case 'round.advance': {
        const from = before.rounds.get(d.subject)?.current ?? 0;
        const to = after.rounds.get(d.subject)?.current ?? 0;
        if (from !== d.from) return fail(d, `from_round:${from}!=${d.from}`);
        if (to !== d.to) return fail(d, `to_round:${to}!=${d.to}`);
        break;
      }
      default: {
        // Future kinds: don't reject what we can't model, report it.
        unchecked.push(`unknown_kind:${(d as { kind: string }).kind}`);
      }
    }
  }

  // ── completeness: undeclared balance / membership changes ───────────────
  const coveredBalances = new Set<string>();
  const coveredMembers = new Set<string>();
  for (const d of deltas) {
    if (d.kind === 'hervachti.add') coveredBalances.add(d.member);
    if (d.kind === 'hervachti.move') { coveredBalances.add(d.from); coveredBalances.add(d.to); }
    if (d.kind === 'value.set' && d.path.startsWith('balances/')) {
      coveredBalances.add(d.path.slice('balances/'.length));
    }
    if (d.kind === 'member.add' || d.kind === 'member.remove') coveredMembers.add(d.member);
    if (d.kind === 'value.set' && d.path.startsWith('members/')) {
      coveredMembers.add(d.path.slice('members/'.length));
    }
  }

  for (const member of new Set([...before.balances.keys(), ...after.balances.keys()])) {
    const b = before.balances.get(member) ?? 0n;
    const a = after.balances.get(member) ?? 0n;
    if (a !== b && !coveredBalances.has(member)) {
      return { ok: false, reason: `undeclared_balance_change:${member}` };
    }
  }
  for (const member of new Set([...before.members, ...after.members])) {
    if (before.members.has(member) !== after.members.has(member) && !coveredMembers.has(member)) {
      return { ok: false, reason: `undeclared_membership_change:${member}` };
    }
  }

  return { ok: true, unchecked };
}

function fail(d: Delta, detail: string): DeltaCheckResult {
  return { ok: false, reason: `${d.kind}:${detail}` };
}
