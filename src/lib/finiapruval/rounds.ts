/**
 * Negotiation rounds on a finish approval (`Finiapruval`) — QA_CONCIERGE_E2E C-15.
 *
 * A finish approval is a claim — "I worked N hours" / "this mission is done" —
 * that every member of the rikma signs. Until now a member could only sign it or
 * object, and an objection was a veto: the clock simply stopped and the claim
 * sat there forever. There is no absolute "no" on this platform: the answer to a
 * claim you disagree with is a **counter** — the version you would sign — and the
 * claim goes back and forth until everyone signs the same one (or the rikma's
 * restime runs out and the last version on the table matures).
 *
 * No new Strapi field is needed:
 *  - the **round** is `vots.order` (null on every vote that predates this = 0);
 *  - the **standing version** is the approval's own `noofhours`;
 *  - a counter is a *yes* vote at the next round (proposing a version is agreeing
 *    to it), whose `why` carries what changed, so the history reads from the votes.
 *
 * Pure on purpose — the server (`closeFiniapruval`, `counterFiniapruval`, the
 * timegrama that matures a silent claim) and the lev card all read the same
 * rules from here, so they cannot drift apart.
 */

export interface RoundVot {
  what?: boolean | null;
  why?: string | null;
  order?: number | null;
  ide?: number | null;
  zman?: string | null;
  /** Strapi shape: `{ data: { id } }`; or a bare id on a vote we built ourselves. */
  users_permissions_user?: unknown;
  /** Already-flattened id, when the caller has one. */
  userId?: string | number | null;
}

/** Who cast a vote, whichever shape it arrived in. */
export function voterId(v: RoundVot): string | null {
  const u: any = v.userId ?? v.users_permissions_user;
  if (u == null) return null;
  if (typeof u === 'object') {
    const id = u.data?.id ?? u.id;
    return id != null ? String(id) : null;
  }
  return String(u);
}

/** The round a vote was cast in. A vote from before rounds existed is round 0. */
export function roundOf(v: RoundVot): number {
  const n = Number(v.order);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** The round the claim is on now: the highest any vote has reached. */
export function standingOrder(vots: RoundVot[] | null | undefined): number {
  return (vots ?? []).reduce((max, v) => Math.max(max, roundOf(v)), 0);
}

/**
 * The votes that count: those of the standing round, one per member (a member who
 * somehow voted twice is read by their latest). Votes on older versions are
 * history — they never count toward, or against, the version now on the table.
 */
export function standingVotes(vots: RoundVot[] | null | undefined): RoundVot[] {
  const list = vots ?? [];
  const standing = standingOrder(list);
  const byVoter = new Map<string, RoundVot>();
  list.forEach((v, i) => {
    if (roundOf(v) !== standing) return;
    byVoter.set(voterId(v) ?? `anonymous-${i}`, v);
  });
  return [...byVoter.values()];
}

/** Has this member already signed the version on the table? */
export function hasSigned(vots: RoundVot[] | null | undefined, userId: string | number): boolean {
  return standingVotes(vots).some((v) => voterId(v) === String(userId) && v.what === true);
}

/** Has this member answered at all on the version on the table (yes or the legacy no)? */
export function hasAnswered(vots: RoundVot[] | null | undefined, userId: string | number): boolean {
  return standingVotes(vots).some((v) => voterId(v) === String(userId) && typeof v.what === 'boolean');
}

/**
 * Is the version on the table signed by every member? A legacy "no" at the
 * standing round blocks it exactly as before — it is answered by a counter on top
 * (which moves the claim to a newer round), never by silence.
 */
export function allSigned(vots: RoundVot[] | null | undefined, memberIds: Array<string | number>): boolean {
  const standing = standingVotes(vots);
  if (standing.some((v) => v.what === false)) return false;
  const yes = new Set(standing.filter((v) => v.what === true).map(voterId));
  return memberIds.length > 0 && memberIds.every((id) => yes.has(String(id)));
}

// ── what a counter says ──────────────────────────────────────────────────────

const TAG = '⇄';

const trim = (n: number) => String(Number(n.toFixed(4)));

export interface Counter {
  from: number;
  to: number;
  note: string;
}

/** The `why` of a counter vote: readable as it is, parseable for the card. */
export function encodeCounter({ from, to, note }: Counter): string {
  return `${TAG} ${trim(from)}→${trim(to)} | ${note.trim()}`;
}

export function parseCounter(why: string | null | undefined): Counter | null {
  const m = /^⇄ (-?[\d.]+)→(-?[\d.]+) \| ([\s\S]*)$/.exec(String(why ?? ''));
  if (!m) return null;
  return { from: Number(m[1]), to: Number(m[2]), note: m[3] };
}

export interface CounterEntry extends Counter {
  round: number;
  userId: string | null;
}

/** Every counter made so far, oldest first — the negotiation as the card tells it. */
export function counterHistory(vots: RoundVot[] | null | undefined): CounterEntry[] {
  return (vots ?? [])
    .map((v) => {
      const c = parseCounter(v.why);
      return c ? { ...c, round: roundOf(v), userId: voterId(v) } : null;
    })
    .filter((e): e is CounterEntry => e !== null)
    .sort((a, b) => a.round - b.round);
}

/** Largest number of hours a counter may name — a typo guard, not a policy. */
export const MAX_COUNTER_HOURS = 1000;

/** Shortest reason a counter must carry: a bare number is a veto in disguise. */
export const MIN_COUNTER_NOTE = 8;

export type CounterRefusal = 'hours' | 'same' | 'note';

/** Why a proposed counter cannot be made (null when it can). */
export function refuseCounter(current: number, hours: unknown, note: unknown): CounterRefusal | null {
  const n = Number(hours);
  if (hours === '' || hours == null || !Number.isFinite(n) || n < 0 || n > MAX_COUNTER_HOURS) return 'hours';
  if (Math.abs(n - Number(current)) < 1e-6) return 'same';
  if (String(note ?? '').trim().length < MIN_COUNTER_NOTE) return 'note';
  return null;
}
