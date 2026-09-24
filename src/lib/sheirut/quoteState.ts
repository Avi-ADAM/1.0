/**
 * Price quotes on a service request (Sheirutpend) — pure, no I/O.
 * docs/PLAN_CONCIERGE_LOCAL_PROVIDERS.md §6.
 *
 * A request can arrive with a price (the product's, or what the customer typed
 * on /gift) or with none at all — `price: null`, "priced by quote": a grocery
 * basket's price depends on what is in it, and the customer is not expected to
 * know it. Either side may then put a different version on the table; each
 * version is a `sheirutnego` round, mirrored onto the Sheirutpend so the Sheirut
 * it becomes (and the payment after it) carries the agreed numbers.
 *
 * Rules (CLAUDE.md "Consent & decisions"):
 *   - Whoever put the current version on the table waits; the other side
 *     answers: approve · chat · counter. No hard "no" is added here.
 *   - An open price cannot be approved — the seller must name one first.
 *   - Silence is consent: once a round exists, the last version matures after
 *     the rikma's restime unless someone objected to it.
 */

export type QuoteSide = 'customer' | 'provider';

export interface QuoteRound {
  /** 1-based; the original request is round 0. */
  order: number;
  price: number | null;
  quant: number | null;
  byUserId: string;
  side: QuoteSide;
  createdAt: string | null;
}

export interface QuoteState {
  rounds: QuoteRound[];
  /** The current round — 0 while the original request stands. */
  order: number;
  price: number | null;
  quant: number;
  total: number | null;
  /** No price on the table yet: only a quote can move this forward. */
  openPrice: boolean;
  /** Who put the current version on the table. */
  lastSide: QuoteSide;
  /** Who must answer it. */
  turn: QuoteSide;
  /**
   * The customer signed the seller's current version (her yes at its order).
   * The deal still needs the rikma — every member, as for any request — but it
   * is no longer hers to answer.
   */
  acceptedByCustomer: boolean;
}

export interface QuoteVote {
  what: boolean;
  order: number;
  userId: string | null;
}

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};

const idOf = (rel: any): string | null => {
  const id = rel?.data?.id ?? rel?.id ?? rel;
  return id === null || id === undefined || typeof id === 'object' ? null : String(id);
};

/** price × quantity, or null while the price is open. */
export function totalOf(price: number | null, quant: number | null): number | null {
  if (price === null) return null;
  return Math.round(price * (quant ?? 1) * 100) / 100;
}

/**
 * The quote state of a Sheirutpend from its row: `price`/`quant` and the
 * customer (`users_permissions_user`), its `sheirutnegos` rounds, and the
 * rikma's member ids. Rounds by someone who is neither side are ignored.
 */
export function buildQuoteState(attrs: any, memberIds: Array<string | number>): QuoteState {
  const members = new Set(memberIds.map(String));
  const customerId = idOf(attrs?.users_permissions_user);

  const rounds: QuoteRound[] = (attrs?.sheirutnegos?.data ?? [])
    .map((n: any) => ({
      id: Number(n?.id),
      a: n?.attributes ?? {}
    }))
    .sort((x: any, y: any) => {
      const tx = x.a.createdAt ? Date.parse(x.a.createdAt) : 0;
      const ty = y.a.createdAt ? Date.parse(y.a.createdAt) : 0;
      return tx - ty || x.id - y.id;
    })
    .map((n: any) => {
      const byUserId = idOf(n.a.users_permissions_user) ?? '';
      const side: QuoteSide | null =
        byUserId && byUserId === customerId ? 'customer' : members.has(byUserId) ? 'provider' : null;
      return side
        ? { price: num(n.a.price), quant: num(n.a.quant), byUserId, side, createdAt: n.a.createdAt ?? null }
        : null;
    })
    .filter((r: any): r is Omit<QuoteRound, 'order'> => r !== null)
    .map((r: Omit<QuoteRound, 'order'>, i: number) => ({ ...r, order: i + 1 }));

  const last = rounds[rounds.length - 1];
  const order = last ? last.order : 0;
  const acceptedByCustomer =
    !!last &&
    last.side === 'provider' &&
    votesOf(attrs).some((v) => v.what && v.order === order && v.userId === customerId);
  const price = last ? last.price : num(attrs?.price);
  const quant = (last ? last.quant : num(attrs?.quant)) ?? 1;
  const lastSide: QuoteSide = last ? last.side : 'customer';

  return {
    rounds,
    order,
    price,
    quant,
    total: totalOf(price, quant),
    openPrice: price === null,
    lastSide,
    turn: lastSide === 'customer' || acceptedByCustomer ? 'provider' : 'customer',
    acceptedByCustomer
  };
}

/** The request's votes (the `votes` relation `addVote` writes). */
export function votesOf(attrs: any): QuoteVote[] {
  return (attrs?.votes?.data ?? []).map((v: any) => ({
    what: v?.attributes?.what === true,
    order: Number(v?.attributes?.order ?? 0),
    userId: idOf(v?.attributes?.users_permissions_user)
  }));
}

/** Which side a user speaks for on this request, or null. */
export function sideOf(
  userId: string | number,
  customerId: string | number | null,
  memberIds: Array<string | number>
): QuoteSide | null {
  const u = String(userId);
  if (customerId !== null && String(customerId) === u) return 'customer';
  return memberIds.map(String).includes(u) ? 'provider' : null;
}

/** The rikma may approve the version on the table: it is theirs to answer and has a price. */
export function providerCanApprove(state: QuoteState): boolean {
  return state.turn === 'provider' && !state.openPrice;
}

/** The customer may accept the version on the table: the seller's, with a price. */
export function customerCanAccept(state: QuoteState): boolean {
  return state.turn === 'customer' && !state.openPrice && !state.acceptedByCustomer;
}

export type SilenceOutcome =
  | { action: 'mature' }
  | { action: 'close'; why: string };

/**
 * What the rikma's clock does when restime runs out on a quoted request.
 * The original request alone never matures on silence (a shop is not bound by
 * an order it never looked at); once either side has put a version on the
 * table, that version stands unless someone objected to it.
 */
export function silenceOutcome(state: QuoteState, votes: QuoteVote[]): SilenceOutcome {
  if (state.rounds.length === 0) return { action: 'close', why: 'no quote round — nothing to mature' };
  if (state.openPrice) return { action: 'close', why: 'no price on the table' };
  const objected = votes.some((v) => v.order === state.order && v.what === false);
  if (objected) return { action: 'close', why: `round ${state.order} has an objection` };
  return { action: 'mature' };
}

/**
 * The price a new request opens with. A fixed-price product opens at its price;
 * a product priced by quote (or with no price) opens at the customer's budget
 * if she named one, else open — she is not expected to know what a basket costs.
 */
export function openingPrice(p: {
  price: number | null | undefined;
  pricingMode?: string | null;
  budget?: number | null;
}): number | null {
  if (p.pricingMode !== 'quote' && typeof p.price === 'number' && Number.isFinite(p.price)) return p.price;
  return typeof p.budget === 'number' && p.budget > 0 ? p.budget : null;
}

/** Plain text of a rich-text body, clipped — for a chat line. */
export function plainExcerpt(html: string | null | undefined, max = 1500): string {
  const plain = String(html ?? '')
    .replace(/<\/(p|div|li|h\d)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n\n+/g, '\n')
    .trim();
  return plain.length > max ? `${plain.slice(0, max - 1)}…` : plain;
}
