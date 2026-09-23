/**
 * Swapping a shift between two members (docs/PLAN_SHIFTS.md §1.2, §7 step 3).
 *
 * A swap is the counter to a place in the roster: not "I refuse", but "you
 * take my Tuesday — and, if you like, I take your Thursday". It is bilateral:
 * only the two members sign, nobody else is affected. It rides a `Decision`
 * (`kind: 'shiftSwap'`); the terms of the standing round live on the decision,
 * and each signature is a `vots` row whose `order` is the round.
 *
 * Silence is consent here too — but only where the silent side has already
 * consented. The roster may never place someone who did not declare (§1.1),
 * and a swap must not become the back door around that rule: silence completes
 * a swap only when the member who has not answered declared they can make the
 * shift they would receive, and it does not take them past their agreed
 * maximum. Otherwise the swap waits for an explicit "yes", and at the deadline
 * it lapses — the roster simply stays as it was.
 *
 * Pure: the server hands in what it read.
 */

import type { AssignmentLike, AssignmentState, Declaration, ShiftLike } from './types.js';

export interface SwapTerms {
  /** The proposer's place, going to the other member. */
  giveId: string;
  /** The other member's place, coming back to the proposer. Null = "just take mine". */
  takeId: string | null;
}

export interface SwapParties {
  /** Who opened the swap. */
  fromUserId: string;
  /** Who was asked. */
  toUserId: string;
}

export interface SwapWorld {
  shifts: ShiftLike[];
  assignments: AssignmentLike[];
  declarations: Declaration[];
  /** The mission's agreed commitments — who may take its shifts at all, and their maximum. */
  commitments: Array<{ userId: string; max?: number | null }>;
  /** The cycle the places belong to, for counting against the maximum. */
  cycle?: { start: string; end: string } | null;
}

export type SwapProblem =
  | 'samePerson'
  | 'giveMissing'
  | 'giveNotYours'
  | 'takeMissing'
  | 'takeNotTheirs'
  | 'notComing'
  | 'started'
  | 'notOnMission'
  | 'sameShift'
  | 'clash'
  | 'alreadyThere';

export type SwapCheck = { ok: true } | { ok: false; problem: SwapProblem };

const LIVE: ReadonlySet<AssignmentState> = new Set(['draft', 'confirmed']);
const WILLING = new Set(['want', 'can', 'ifNeeded']);

const ms = (iso: string) => new Date(iso).getTime();
const overlaps = (a: ShiftLike, b: ShiftLike) => ms(a.start) < ms(b.end) && ms(b.start) < ms(a.end);

function place(world: SwapWorld, id: string | null) {
  if (!id) return null;
  const a = world.assignments.find((x) => String(x.id) === String(id));
  if (!a) return null;
  const shift = world.shifts.find((s) => String(s.id) === String(a.shiftId)) ?? null;
  return { a, shift };
}

/** The places a member holds after the swap would be applied — the ones they keep plus the one they receive. */
function heldAfter(world: SwapWorld, uid: string, drop: string | null, receive: ShiftLike | null): ShiftLike[] {
  const kept = world.assignments
    .filter((a) => String(a.userId) === uid && a.rank === 1 && LIVE.has(a.state) && String(a.id) !== String(drop))
    .map((a) => world.shifts.find((s) => String(s.id) === String(a.shiftId)))
    .filter((s): s is ShiftLike => !!s);
  return receive ? [...kept, receive] : kept;
}

/**
 * Can these terms stand? Checked when proposed, when countered, and again at
 * the moment of applying — the roster may have moved in between.
 */
export function checkSwap(terms: SwapTerms, parties: SwapParties, world: SwapWorld, now: Date | string): SwapCheck {
  const t = new Date(now).getTime();
  const from = String(parties.fromUserId);
  const to = String(parties.toUserId);
  if (from === to) return { ok: false, problem: 'samePerson' };
  const onMission = new Set(world.commitments.map((c) => String(c.userId)));
  if (!onMission.has(from) || !onMission.has(to)) return { ok: false, problem: 'notOnMission' };

  const give = place(world, terms.giveId);
  if (!give?.shift) return { ok: false, problem: 'giveMissing' };
  if (String(give.a.userId) !== from) return { ok: false, problem: 'giveNotYours' };
  const take = terms.takeId ? place(world, terms.takeId) : null;
  if (terms.takeId && !take?.shift) return { ok: false, problem: 'takeMissing' };
  if (take && String(take.a.userId) !== to) return { ok: false, problem: 'takeNotTheirs' };

  for (const p of [give, take]) {
    if (!p) continue;
    if (p.a.rank !== 1 || !LIVE.has(p.a.state)) return { ok: false, problem: 'notComing' };
    if (ms(p.shift!.start) <= t) return { ok: false, problem: 'started' };
  }
  if (take && String(take.shift!.id) === String(give.shift.id)) return { ok: false, problem: 'sameShift' };

  // Nobody ends up in the same shift twice, or in two shifts at once.
  const comingTo = (uid: string, s: ShiftLike, except: string | null) =>
    world.assignments.some(
      (a) => String(a.userId) === uid && a.rank === 1 && LIVE.has(a.state) && String(a.shiftId) === String(s.id) && String(a.id) !== String(except)
    );
  if (comingTo(to, give.shift, take?.a.id ?? null)) return { ok: false, problem: 'alreadyThere' };
  if (take && comingTo(from, take.shift!, give.a.id ?? null)) return { ok: false, problem: 'alreadyThere' };

  const clashes = (held: ShiftLike[], s: ShiftLike | null) =>
    !!s && held.some((h) => String(h.id) !== String(s.id) && overlaps(h, s));
  const toHeld = heldAfter(world, to, take?.a.id ?? null, null);
  const fromHeld = heldAfter(world, from, give.a.id ?? null, null);
  if (clashes(toHeld, give.shift) || clashes(fromHeld, take?.shift ?? null)) return { ok: false, problem: 'clash' };

  return { ok: true };
}

/**
 * May silence complete these terms for `answerer`? Only when what they would
 * receive is a shift they declared they can make, and receiving it does not
 * take them past their agreed maximum for the cycle. Receiving nothing — a
 * counter that drops the exchange — needs no declaration: giving a place away
 * was their own proposal.
 */
export function silenceMayComplete(terms: SwapTerms, parties: SwapParties, answerer: string, world: SwapWorld): boolean {
  const uid = String(answerer);
  const isTo = uid === String(parties.toUserId);
  const incoming = place(world, isTo ? terms.giveId : terms.takeId);
  const outgoing = place(world, isTo ? terms.takeId : terms.giveId);
  if (!incoming) return true;
  if (!incoming.shift) return false;

  const d = world.declarations.find((x) => String(x.userId) === uid && String(x.shiftId) === String(incoming.shift!.id));
  if (!d || !WILLING.has(d.stance)) return false;

  const max = world.commitments.find((c) => String(c.userId) === uid)?.max;
  if (max == null) return true;
  const inCycle = (s: ShiftLike) => !world.cycle || (s.start >= world.cycle.start && s.start < world.cycle.end);
  const after = heldAfter(world, uid, outgoing?.a.id ?? null, incoming.shift).filter(inCycle).length;
  return after <= max;
}

export interface SwapSignature {
  userId: string;
  /** The round this signature belongs to (`vots.order`). */
  order: number;
}

/**
 * Whose answer the swap waits on. The standing round is the highest `order`;
 * whoever of the two has not signed it is the one to answer. Both signed =
 * agreed. A counter opens a new round signed only by the one who countered.
 */
export function swapTurn(
  parties: SwapParties,
  signatures: SwapSignature[]
): { round: number; waitingOn: string | null; agreed: boolean } {
  const round = signatures.reduce((m, s) => Math.max(m, s.order), 0);
  const signed = new Set(signatures.filter((s) => s.order === round).map((s) => String(s.userId)));
  const from = String(parties.fromUserId);
  const to = String(parties.toUserId);
  if (signed.has(from) && signed.has(to)) return { round, waitingOn: null, agreed: true };
  // Round 0 (nothing signed) cannot happen for a stored swap; treat it as waiting on the proposer.
  return { round, waitingOn: signed.has(from) ? to : from, agreed: false };
}

/**
 * When the swap stops waiting. Never past the roster's own close while the
 * draft is open (§1.3), and never past the start of either shift — after that
 * there is nothing left to swap.
 */
export function swapDeadline(
  now: Date | string,
  restimeHours: number,
  bounds: Array<string | null | undefined>
): string {
  const t = new Date(now).getTime();
  const candidates = [t + restimeHours * 3_600_000, ...bounds.filter((b): b is string => !!b).map(ms).filter((x) => x > t)];
  return new Date(Math.min(...candidates)).toISOString();
}

export interface SwapOp {
  /** Release this row (`releaseReason: 'swap'`). */
  release: string[];
  /** Create these rank-1 rows (`source: 'swap'`, `reason: 'swapped'`). */
  create: Array<{ shiftId: string; userId: string; state: AssignmentState; coveredForId: string }>;
}

/**
 * The writes that carry out agreed terms. History is kept: the old rows are
 * released, not rewritten, and each new row points at the one it replaces. A
 * backup place the receiver held on the same shift steps aside — they are now
 * coming, not waiting.
 */
export function swapOps(terms: SwapTerms, parties: SwapParties, world: SwapWorld): SwapOp {
  const give = place(world, terms.giveId)!;
  const take = terms.takeId ? place(world, terms.takeId) : null;
  const from = String(parties.fromUserId);
  const to = String(parties.toUserId);
  const release = [String(give.a.id)];
  const create: SwapOp['create'] = [
    { shiftId: String(give.a.shiftId), userId: to, state: give.a.state, coveredForId: String(give.a.id) }
  ];
  if (take) {
    release.push(String(take.a.id));
    create.push({ shiftId: String(take.a.shiftId), userId: from, state: take.a.state, coveredForId: String(take.a.id) });
  }
  for (const c of create) {
    const backup = world.assignments.find(
      (a) => String(a.userId) === c.userId && String(a.shiftId) === c.shiftId && a.rank > 1 && a.state !== 'released'
    );
    if (backup?.id) release.push(String(backup.id));
  }
  return { release, create };
}
