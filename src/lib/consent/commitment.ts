// State-commitment verification (PLAN_rikma_as_state_machine §7).
//
// The verifier's contract, quoting the plan: after signature verification,
// check the event's declared commitments against a local replay —
//   parentStateRoots  — replaying each parent's ancestor closure yields it
//   stateRoot         — replaying closure + this event yields it
//   delta             — deltaCheck against the recomputed transition
//   quorum            — verifyQuorum over the referenced evidence
// "אירוע ש-state-root שלו לא תואם → דחייה, בדיוק כמו חתימה שגויה."
//
// Two modes:
//   'available' — verify everything that CAN be verified locally. Provably
//                 false commitments (root/delta/quorum mismatch) reject; things
//                 we lack data for (missing ancestors, weighted rules without
//                 weights, policy-required-but-absent quorum) become warnings.
//                 This is the migration posture: Phase-0 events and partial
//                 local DAGs keep flowing.
//   'strict'    — everything unverifiable is a rejection. Phase 3 enforcement.

import type { ConsentEvent } from './event';
import { project } from './projection';
import { computeStateRoot } from './stateRoot';
import { checkDeltas } from './deltaCheck';
import { verifyQuorum, type QuorumContext } from './quorum';
import { quorumRequirement } from './policy';

export type EventLookup = (
  id: string
) => ConsentEvent | undefined | Promise<ConsentEvent | undefined>;

export type CommitmentOptions = {
  /** Resolves an event by id — IDB on the client, the mirror store on the server. */
  getEvent: EventLookup;
  mode?: 'available' | 'strict';
  projectId?: string | null;
  /** Per-member weights in agorot for weighted-* quorum rules (D-13). */
  memberWeights?: Map<string, bigint>;
};

export type CommitmentResult =
  | { ok: true; checked: string[]; warnings: string[]; reason?: undefined }
  | { ok: false; reason: string };

/** True when the event carries any Phase 1.5 commitment field. */
export function hasCommitments(ev: ConsentEvent): boolean {
  return (
    ev.stateRoot !== undefined ||
    ev.parentStateRoots !== undefined ||
    ev.delta !== undefined ||
    ev.quorum !== undefined ||
    // A snapshot's predicate IS a commitment (the attested root) — it must
    // never slip past verification just because the optional fields are bare.
    ev.action === 'snapshot.commit'
  );
}

// BFS over `parents` links. Returns every reachable ancestor; ids that can't
// be resolved are collected into `missing` instead of throwing.
async function ancestorClosure(
  roots: string[],
  getEvent: EventLookup,
  missing: string[]
): Promise<Map<string, ConsentEvent>> {
  const out = new Map<string, ConsentEvent>();
  const queue = [...roots];
  const seen = new Set<string>(roots);
  while (queue.length) {
    const id = queue.shift()!;
    if (out.has(id)) continue;
    const ev = await getEvent(id);
    if (!ev) {
      missing.push(id);
      continue;
    }
    out.set(id, ev);
    for (const p of ev.parents) {
      if (!seen.has(p)) {
        seen.add(p);
        queue.push(p);
      }
    }
  }
  return out;
}

// A member leaving on their own accord is sovereign — no quorum needed to
// exit a cooperative (policy.ts note on project.leave).
function isSovereignSelfAction(ev: ConsentEvent): boolean {
  if (ev.action !== 'project.leave') return false;
  const target = (ev.predicate as { member?: unknown } | undefined)?.member;
  return target === undefined || target === ev.actor;
}

export async function verifyCommitments(
  ev: ConsentEvent,
  opts: CommitmentOptions
): Promise<CommitmentResult> {
  const mode = opts.mode ?? 'available';
  const checked: string[] = [];
  const warnings: string[] = [];

  const requirement = quorumRequirement(ev.action);
  const quorumRequired = requirement.required && !isSovereignSelfAction(ev);

  if (!hasCommitments(ev)) {
    // Phase-0 event. The only thing to say about it is whether policy WANTED
    // a quorum here.
    if (quorumRequired) {
      if (mode === 'strict') return { ok: false, reason: `quorum_required:${ev.action}` };
      warnings.push(`quorum_required_but_absent:${ev.action}`);
    }
    return { ok: true, checked, warnings };
  }

  // ── replay foundation ────────────────────────────────────────────────────
  const missing: string[] = [];
  const closure = await ancestorClosure(ev.parents, opts.getEvent, missing);

  if (missing.length > 0) {
    if (mode === 'strict') return { ok: false, reason: `missing_ancestor:${missing[0]}` };
    // Can't replay → none of the replay-based checks can run.
    warnings.push(...missing.map((m) => `missing_ancestor:${m}`));
    return { ok: true, checked, warnings };
  }

  const ancestors = [...closure.values()];
  const projectId = opts.projectId ?? null;

  // ── parentStateRoots: one root per parent, each over that parent's own
  //    ancestor closure (plan §2 — "אם 1 הורה — אחד; אם merge — N") ─────────
  if (ev.parentStateRoots !== undefined) {
    if (ev.parentStateRoots.length !== ev.parents.length) {
      return { ok: false, reason: 'parent_roots_arity' };
    }
    for (let i = 0; i < ev.parents.length; i++) {
      const subMissing: string[] = [];
      const sub = await ancestorClosure([ev.parents[i]], opts.getEvent, subMissing);
      // closure already resolved every ancestor; a sub-closure can't miss.
      const root = await computeStateRoot(project([...sub.values()], projectId));
      if (root !== ev.parentStateRoots[i]) {
        return { ok: false, reason: `parent_root_mismatch:${ev.parents[i]}` };
      }
    }
    checked.push('parentStateRoots');
  }

  const before = project(ancestors, projectId);
  const after = project([...ancestors, ev], projectId);

  // ── stateRoot: the state after applying this event ───────────────────────
  if (ev.stateRoot !== undefined) {
    const root = await computeStateRoot(after);
    if (root !== ev.stateRoot) return { ok: false, reason: 'state_root_mismatch' };
    checked.push('stateRoot');
  }

  // ── delta: declared changes match the recomputed transition ──────────────
  if (ev.delta !== undefined) {
    const d = checkDeltas(before, after, ev.delta);
    if (!d.ok) return { ok: false, reason: `delta:${d.reason}` };
    warnings.push(...d.unchecked.map((u) => `delta_unchecked:${u}`));
    checked.push('delta');
  }

  // ── snapshot.commit: the ATTESTED root must also be true (§5.1) — clients
  //    will trust it as a sync starting point, so recompute it now ──────────
  if (ev.action === 'snapshot.commit') {
    const p = ev.predicate as { upTo?: unknown; stateRoot?: unknown } | undefined;
    if (typeof p?.upTo !== 'string' || typeof p?.stateRoot !== 'string') {
      return { ok: false, reason: 'snapshot_bad_predicate' };
    }
    if (!closure.has(p.upTo)) {
      // The attested coverage point must be an ancestor of the snapshot event.
      return { ok: false, reason: `snapshot_upTo_not_ancestor:${p.upTo}` };
    }
    const covered = await ancestorClosure([p.upTo], opts.getEvent, []);
    const attestedRoot = await computeStateRoot(project([...covered.values()], projectId));
    if (attestedRoot !== p.stateRoot) {
      return { ok: false, reason: 'snapshot_root_mismatch' };
    }
    checked.push('snapshotRoot');
  }

  // ── quorum: the witness that the decision passed ─────────────────────────
  if (quorumRequired && ev.quorum === undefined) {
    if (mode === 'strict') return { ok: false, reason: `quorum_required:${ev.action}` };
    warnings.push(`quorum_required_but_absent:${ev.action}`);
  }

  if (ev.quorum !== undefined) {
    const evidence = new Map<string, ConsentEvent>();
    let unresolved: string | null = null;
    for (const id of ev.quorum.evidence) {
      const e = closure.get(id) ?? (await opts.getEvent(id));
      if (!e) {
        unresolved = id;
        break;
      }
      evidence.set(id, e);
    }

    if (unresolved !== null) {
      if (mode === 'strict') return { ok: false, reason: `missing_evidence:${unresolved}` };
      warnings.push(`missing_evidence:${unresolved}`);
    } else {
      const rule = ev.quorum.rule;
      const needsWeights =
        rule.kind === 'weighted-unanimous-positive' || rule.kind === 'weighted-threshold';
      if (needsWeights && !opts.memberWeights) {
        // Weights live outside the chain (D-13: Strapi FinnishedMission +
        // Rikmash totals) — a verifier without them can't judge the rule.
        if (mode === 'strict') return { ok: false, reason: 'missing_weights' };
        warnings.push('quorum_unverified:missing_weights');
      } else {
        const ctx: QuorumContext = {
          eligibleMembers: before.members,
          events: evidence,
          voteAction: requirement.voteAction ?? `${ev.action}.vote`,
          memberWeights: opts.memberWeights
        };
        const q = verifyQuorum(ev.quorum, ctx);
        if (!q.ok) return { ok: false, reason: `quorum:${q.reason}` };
        checked.push('quorum');
      }
    }
  }

  return { ok: true, checked, warnings };
}
