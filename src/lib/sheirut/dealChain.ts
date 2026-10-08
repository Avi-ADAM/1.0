/**
 * One deal, its stages — docs/inprogress/PLAN_DIRECT_OFFER.md §7.2 (P1).
 *
 * A deal lives on three pages, one per stage, and until now none of them knew
 * about the others:
 *
 *   shaping (wish)        approval (request)         carrying out (deal)
 *   /concierge/[id]  ──▶  /deals/request/[id]  ──▶   /deals/[id]
 *   Ratson                Sheirutpend                Sheirut
 *
 * The links between them are already in the data, they were just never read:
 *   Sheirut     → sheirutpend, source_proposals (the wish), matanot.ratson (a wish's composed product)
 *   Sheirutpend → sheirut, ratson_proposal.ratson, matanots[].ratson
 *   Ratson      → sheiruts, derivedComplexMatanot.sheirutpends, ratson_proposals[].sheirutpends
 *
 * Qids 428–430 read them; this module turns the answer into a chain and the chain
 * into the stage strip every one of the three pages shows. Ids and states only —
 * each stage's page decides for itself who may open it.
 *
 * A wish can yield several requests and deals (one per accepted proposal), so the
 * chain carries lists. A deal from the catalogue (/gift) has no wish stage at all.
 */

export type DealStageKey = 'wish' | 'request' | 'deal' | 'closed';

/** The page the strip is shown on. */
export type DealStageAt = { kind: 'wish' | 'request' | 'deal'; id: string };

export interface DealChain {
  wishId: string | null;
  requests: { id: string; dealId: string | null }[];
  deals: { id: string; closed: boolean }[];
}

export interface DealStageView {
  key: DealStageKey;
  /** The stage has happened (its object exists). */
  reached: boolean;
  /** The furthest stage reached — where the deal is now. */
  active: boolean;
  /** The page being viewed. */
  here: boolean;
  /** How many objects the stage has (a wish with two accepted proposals has two deals). */
  count: number;
  /** Where the stage opens; null for the page itself and for a stage not reached. */
  href: string | null;
}

const ORDER: DealStageKey[] = ['wish', 'request', 'deal', 'closed'];

const idOf = (node: any): string | null => (node?.id != null ? String(node.id) : null);
const list = (rel: any): any[] => (Array.isArray(rel?.data) ? rel.data : []);

function addRequest(chain: DealChain, node: any) {
  const id = idOf(node);
  if (!id || chain.requests.some((r) => r.id === id)) return;
  const deal = node?.attributes?.sheirut?.data ?? null;
  const dealId = idOf(deal);
  chain.requests.push({ id, dealId });
  if (dealId) addDeal(chain, deal);
}

function addDeal(chain: DealChain, node: any) {
  const id = idOf(node);
  if (!id || chain.deals.some((d) => d.id === id)) return;
  chain.deals.push({ id, closed: node?.attributes?.moneyTransfered === true });
}

/** The chain as far as the viewed page alone knows it — the fallback when 428–430 cannot be read. */
export function chainOf(at: DealStageAt): DealChain {
  return {
    wishId: at.kind === 'wish' ? at.id : null,
    requests: at.kind === 'request' ? [{ id: at.id, dealId: null }] : [],
    deals: at.kind === 'deal' ? [{ id: at.id, closed: false }] : []
  };
}

/** Qid 428's answer. */
export function chainFromSheirut(res: any): DealChain | null {
  const node = res?.sheirut?.data;
  if (!idOf(node)) return null;
  const a = node.attributes ?? {};
  const chain: DealChain = {
    wishId: idOf(list(a.source_proposals)[0]) ?? idOf(a.matanot?.data?.attributes?.ratson?.data),
    requests: [],
    deals: []
  };
  addDeal(chain, node);
  const req = idOf(a.sheirutpend?.data);
  if (req) chain.requests.push({ id: req, dealId: idOf(node) });
  return chain;
}

/** Qid 429's answer. */
export function chainFromSheirutpend(res: any): DealChain | null {
  const node = res?.sheirutpend?.data;
  if (!idOf(node)) return null;
  const a = node.attributes ?? {};
  const fromProduct = list(a.matanots)
    .map((m: any) => idOf(m?.attributes?.ratson?.data))
    .find(Boolean);
  const chain: DealChain = {
    wishId: idOf(a.ratson_proposal?.data?.attributes?.ratson?.data) ?? fromProduct ?? null,
    requests: [],
    deals: []
  };
  addRequest(chain, node);
  return chain;
}

/** Qid 430's answer. */
export function chainFromRatson(res: any): DealChain | null {
  const node = res?.ratson?.data;
  const wishId = idOf(node);
  if (!wishId) return null;
  const a = node.attributes ?? {};
  const chain: DealChain = { wishId, requests: [], deals: [] };
  for (const sp of list(a.derivedComplexMatanot?.data?.attributes?.sheirutpends)) addRequest(chain, sp);
  for (const p of list(a.ratson_proposals)) {
    for (const sp of list(p?.attributes?.sheirutpends)) addRequest(chain, sp);
  }
  for (const s of list(a.sheiruts)) addDeal(chain, s);
  return chain;
}

function hrefFor(key: DealStageKey, chain: DealChain): string | null {
  switch (key) {
    case 'wish':
      return chain.wishId ? `/concierge/${chain.wishId}` : null;
    case 'request':
      if (chain.requests.length === 1) return `/deals/request/${chain.requests[0].id}`;
      return chain.requests.length > 1 ? '/deals' : null;
    case 'deal':
    case 'closed':
      if (chain.deals.length === 1) return `/deals/${chain.deals[0].id}`;
      return chain.deals.length > 1 ? '/deals' : null;
  }
}

/**
 * The strip: shaping → approval → carrying out → closed.
 *
 * A deal is closed when it is paid — for a wish deal, when every provider
 * confirmed receiving their part (`moneyTransfered`, C-19). The wish stage is
 * left out of a deal that never had one (a catalogue order from /gift).
 */
export function dealStages(chain: DealChain, at: DealStageAt): DealStageView[] {
  const count: Record<DealStageKey, number> = {
    wish: chain.wishId ? 1 : 0,
    request: chain.requests.length,
    deal: chain.deals.length,
    closed: chain.deals.length > 0 && chain.deals.every((d) => d.closed) ? chain.deals.length : 0
  };
  // A request or a deal implies everything before it happened, even when the
  // object of an earlier stage could not be read.
  const reached = (k: DealStageKey) => ORDER.slice(ORDER.indexOf(k)).some((later) => count[later] > 0);

  const viewedDealClosed = at.kind === 'deal' && chain.deals.some((d) => d.id === at.id && d.closed);
  const hereKey: DealStageKey = viewedDealClosed ? 'closed' : at.kind;

  const keys = ORDER.filter((k) => k !== 'wish' || chain.wishId || hereKey === 'wish');
  const furthest = [...keys].reverse().find((k) => reached(k) || k === hereKey) ?? hereKey;
  // A closed deal is still the page it was: its "carrying out" stage must not link to itself.
  const self = at.kind === 'wish' ? `/concierge/${at.id}` : at.kind === 'request' ? `/deals/request/${at.id}` : `/deals/${at.id}`;

  return keys.map((key) => {
    const here = key === hereKey;
    const isReached = reached(key) || here;
    const href = here || !isReached ? null : hrefFor(key, chain);
    return {
      key,
      reached: isReached,
      active: key === furthest,
      here,
      count: count[key],
      href: href === self ? null : href
    };
  });
}
