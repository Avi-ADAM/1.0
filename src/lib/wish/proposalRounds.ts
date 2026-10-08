/**
 * Negotiating a wish proposal — QA_CONCIERGE_E2E C-9.
 *
 * A provider who answers a wish (invited by the wisher, or volunteering from the
 * community feed) puts a **version** on the table: how many hours, at what price.
 * Until now that version could only be accepted as it stood — "negotiate" was a
 * button that said "soon", and the community path crashed outright. There is no
 * absolute "no" on this platform: the answer to terms you cannot take is the
 * version you could — a counter, with the reason — and it goes back and forth
 * between the wisher and the provider until both have signed the same one.
 *
 * No Strapi field is added: a proposal already carries
 *  - the **standing version** in its own `covered_missions` / `covered_resources`
 *    (`hours`/`quantity` and `price`) — the same place both accept paths read;
 *  - a **log of signatures** in `ratson_willingness_entry`, whose rows already hold
 *    a user, the hours and the amount they stand behind, and a `note`.
 * Every entry is one party signing the version on the table: `agree: false` is a
 * counter (`willingHours`/`willingAmount` are the version they propose, `note`
 * the reason), `agree: true` is an approval of what stands.
 *
 * Pure on purpose — the server (the counter, both accept paths) and the cards read
 * the same turn rules from here.
 */

import { signedUnderOtherTerms } from './termsDigest';

export interface WillingnessEntry {
  /** Strapi shape `{ data: { id } }`, a bare id, or a populated `{ id }`. */
  user?: unknown;
  agree?: boolean | null;
  note?: string | null;
  submittedAt?: string | null;
  willingHours?: number | null;
  willingAmount?: number | null;
  item_kind?: string | null;
  item_idx?: number | null;
  /** The wish's terms when this was signed (`$lib/wish/termsDigest`); absent on older entries. */
  termsDigest?: string | null;
}

/** The two parties of a proposal. */
export type Party = 'wisher' | 'provider';

export interface Version {
  /** Hours (a task) or quantity (a resource) — what the provider commits to. */
  amount: number | null;
  /** What it costs. */
  price: number | null;
}

export interface ProposalRef {
  /** Who volunteered or was invited — the proposal's `proposer_users`. */
  proposerIds: string[];
  /** The wish's owners. */
  wisherIds: string[];
  /**
   * Whether the provider opened the proposal (a community volunteer, who offered
   * on the published need) or the wisher did (she authored the slot and invited).
   * Decides who has implicitly signed the first version.
   */
  openedBy: Party;
}

/**
 * The two shapes of proposal whose terms are negotiated, and the only two the accept
 * paths can close:
 *  - `invite`: the wisher authored a slot and invited a provider (kind
 *    `existing_project` / `partial`; `covered_*` carries the slot's recipe-line id);
 *  - `volunteer`: a community member took a need the wish published
 *    (`open_mission` set).
 * Everything else is something else: a product proposal (a matanot or a project
 * behind it) is priced by quote on its service request, and a plain self-offer
 * (`custom_offer` with no open mission) names a need by *position*, which nothing
 * can close yet — neither is negotiated here.
 */
export type ProposalPath = 'invite' | 'volunteer';

export function proposalPath(p: {
  kind?: string | null;
  hasMatanot: boolean;
  hasProject: boolean;
  hasOpenMission: boolean;
}): ProposalPath | null {
  if (p.hasMatanot || p.hasProject) return null;
  if (p.hasOpenMission) return 'volunteer';
  if (p.kind === 'existing_project' || p.kind === 'partial') return 'invite';
  return null;
}

/** Who an entry's author is, whichever shape the user arrived in. */
export function entryUserId(e: WillingnessEntry): string | null {
  const u: any = e.user;
  if (u == null) return null;
  if (typeof u === 'object') {
    const id = u.data?.id ?? u.id;
    return id != null ? String(id) : null;
  }
  return String(u);
}

/** The party a user is in this proposal, or null for a stranger. */
export function partyOf(ref: ProposalRef, userId: string | number): Party | null {
  const id = String(userId);
  if (ref.wisherIds.map(String).includes(id)) return 'wisher';
  if (ref.proposerIds.map(String).includes(id)) return 'provider';
  return null;
}

const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : v == null || v === '' ? NaN : Number(v);
  return Number.isFinite(n) ? n : null;
};

const same = (a: number | null, b: number | null) =>
  a === b || (a != null && b != null && Math.abs(a - b) < 1e-6);

export const sameVersion = (a: Version, b: Version) => same(a.amount, b.amount) && same(a.price, b.price);

/** The version an entry stands behind. */
export const entryVersion = (e: WillingnessEntry): Version => ({
  amount: num(e.willingHours),
  price: num(e.willingAmount)
});

export interface Round {
  /** 1 for the first counter, 2 for the next… */
  round: number;
  by: Party;
  userId: string | null;
  /** The version this counter put on the table. */
  version: Version;
  note: string;
  at: string | null;
}

/**
 * Every entry whose author is one of the two parties, oldest first (array order —
 * the component keeps the order it was written in; `submittedAt` only breaks a
 * tie). An entry nobody can account for — a stranger — signs nothing.
 */
function signatures(ref: ProposalRef, entries: WillingnessEntry[] | null | undefined) {
  return (entries ?? [])
    .map((e, i) => ({ e, i }))
    .sort((a, b) => {
      const ta = a.e.submittedAt ? Date.parse(a.e.submittedAt) : NaN;
      const tb = b.e.submittedAt ? Date.parse(b.e.submittedAt) : NaN;
      return Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb ? ta - tb : a.i - b.i;
    })
    .map(({ e }) => {
      const userId = entryUserId(e);
      const by = userId ? partyOf(ref, userId) : null;
      return by
        ? {
            by,
            userId,
            // `agree: false` is "not this one — here is mine": a counter. `true` (what
            // acceptWishOffer has always written) is signing what is on the table.
            counter: e.agree === false,
            version: entryVersion(e),
            note: (e.note ?? '').trim(),
            at: e.submittedAt ?? null,
            digest: e.termsDigest ?? null
          }
        : null;
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);
}

export interface Standing {
  /** The version on the table now — the proposal's own `covered_*`. */
  version: Version;
  /** Who last signed it. */
  signedBy: Party;
  /** Number of counters so far (0 = the version as first put). */
  round: number;
  /** Every counter, oldest first — the negotiation as the card tells it. */
  counters: Round[];
  /**
   * The wisher changed the wish's terms (description, place, dates) after the last
   * signature — PLAN_DIRECT_OFFER §4.3. That is her new version: she signed it by
   * making it, and it is the provider's move.
   */
  termsChanged: boolean;
}

/**
 * Where the negotiation stands. `current` is the version the proposal carries now
 * (a counter rewrites it, so it is always the version on the table). Whoever wrote
 * the last entry signed it last; with no entries it is whoever opened the proposal.
 *
 * `termsDigest` is the wish's terms now (`Ratson.terms_digest`). When the last
 * signature was made under other terms, the wisher has moved since, whoever signed
 * last. Left out, or on entries from before the digests, nothing changes.
 */
export function standing(
  ref: ProposalRef,
  entries: WillingnessEntry[] | null | undefined,
  current: Version,
  termsDigest?: string | null
): Standing {
  let signedBy: Party = ref.openedBy;
  let lastDigest: string | null = null;
  const counters: Round[] = [];
  for (const s of signatures(ref, entries)) {
    if (s.counter) {
      counters.push({ round: counters.length + 1, by: s.by, userId: s.userId, version: s.version, note: s.note, at: s.at });
    }
    signedBy = s.by;
    lastDigest = s.digest;
  }
  const termsChanged = signedUnderOtherTerms(lastDigest, termsDigest);
  if (termsChanged) signedBy = 'wisher';
  return { version: current, signedBy, round: counters.length, counters, termsChanged };
}

export const otherParty = (p: Party): Party => (p === 'wisher' ? 'provider' : 'wisher');

/**
 * Is it this party's move? Yours only when the other side signed last — you answer
 * what they put on the table. Whoever signed last waits.
 */
export function isTurnOf(party: Party, s: Standing): boolean {
  return s.signedBy !== party;
}

export const MAX_AMOUNT = 100000;
export const MIN_NOTE = 8;

export type CounterRefusal = 'amount' | 'price' | 'same' | 'note';

/** Why a proposed counter cannot be made (null when it can). */
export function refuseCounter(
  current: Version,
  proposed: { amount?: unknown; price?: unknown },
  note: unknown
): CounterRefusal | null {
  const amount = proposed.amount === undefined ? current.amount : num(proposed.amount);
  const price = proposed.price === undefined ? current.price : num(proposed.price);
  if (amount != null && (amount < 0 || amount > MAX_AMOUNT)) return 'amount';
  if (proposed.amount !== undefined && amount == null) return 'amount';
  if (price != null && (price < 0 || price > MAX_AMOUNT)) return 'price';
  if (proposed.price !== undefined && price == null) return 'price';
  if (sameVersion({ amount, price }, current)) return 'same';
  if (String(note ?? '').trim().length < MIN_NOTE) return 'note';
  return null;
}

/** Resolve a counter's two numbers against the standing version (omitted = unchanged). */
export function resolveVersion(current: Version, proposed: { amount?: unknown; price?: unknown }): Version {
  return {
    amount: proposed.amount === undefined ? current.amount : num(proposed.amount),
    price: proposed.price === undefined ? current.price : num(proposed.price)
  };
}
