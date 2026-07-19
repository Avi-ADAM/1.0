/**
 * Process lifecycle helpers — pure functions used by the detailed process page
 * (moach/[projectId]/processes/[processId]) and the per-object pages.
 *
 * All inputs are Strapi v4 entities ({ id, attributes }) or component arrays as
 * returned by the `processLifecycleData` qid. No network calls are made here.
 */

export interface NormalizedVote {
  id: string;
  what: boolean | null;
  why: string;
  zman: string | null;
  order: number;
  userId: string;
  username: string;
  profilePicUrl: string | null;
}

export interface VoteRound {
  order: number;
  votes: NormalizedVote[];
}

export interface TimerMonthGroup {
  /** `YYYY-MM`, or `''` for timers without a start date */
  month: string;
  totalHours: number;
  timers: any[];
}

function asArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

/** Resolves a Strapi media url (relative paths get the VITE_URL base). */
export function mediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const base = import.meta.env.VITE_URL || '';
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${cleanBase}${url.startsWith('/') ? url : `/${url}`}`;
}

/**
 * Normalizes a ComponentProjectsVots / ComponentProjectsPendmnego array into a
 * flat list. Both components share what/why/order/zman/users_permissions_user.
 */
export function normalizeVotes(vots: any[] | null | undefined): NormalizedVote[] {
  return asArray(vots).map((vote: any) => {
    const user = vote?.users_permissions_user?.data;
    return {
      id: String(vote?.id ?? ''),
      what: typeof vote?.what === 'boolean' ? vote.what : null,
      why: vote?.why ?? '',
      zman: vote?.zman ?? null,
      order: Number(vote?.order ?? 0) || 0,
      userId: String(user?.id ?? ''),
      username: user?.attributes?.username ?? '',
      profilePicUrl: user?.attributes?.profilePic?.data?.attributes?.url ?? null
    };
  });
}

/**
 * Groups votes into negotiation rounds by their `order` component field
 * (order = round index; missing/null order counts as round 0). Rounds are
 * sorted ascending so the display reads first round → latest round.
 */
export function groupVotesByRound(vots: any[] | null | undefined): VoteRound[] {
  const byOrder = new Map<number, NormalizedVote[]>();
  for (const vote of normalizeVotes(vots)) {
    const list = byOrder.get(vote.order);
    if (list) list.push(vote);
    else byOrder.set(vote.order, [vote]);
  }
  return [...byOrder.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([order, votes]) => ({ order, votes }));
}

/**
 * Groups timer entities by the month of their `start` (YYYY-MM), newest month
 * first; timers inside a month are sorted newest first. Timers without a start
 * date land in a final `''` group.
 */
export function groupTimersByMonth(timers: any[] | null | undefined): TimerMonthGroup[] {
  const byMonth = new Map<string, any[]>();
  for (const timer of asArray(timers)) {
    const start = (timer as any)?.attributes?.start;
    const month = typeof start === 'string' && start.length >= 7 ? start.slice(0, 7) : '';
    const list = byMonth.get(month);
    if (list) list.push(timer);
    else byMonth.set(month, [timer]);
  }
  return [...byMonth.entries()]
    .sort((a, b) => {
      if (a[0] === '') return 1;
      if (b[0] === '') return -1;
      return b[0].localeCompare(a[0]);
    })
    .map(([month, list]) => ({
      month,
      totalHours: list.reduce(
        (sum, timer: any) => sum + (Number(timer?.attributes?.totalHours) || 0),
        0
      ),
      timers: [...list].sort((a: any, b: any) =>
        String(b?.attributes?.start ?? '').localeCompare(String(a?.attributes?.start ?? ''))
      )
    }));
}

/**
 * Normalizes a mesimabetahalich `monter` component array (per-month assigned /
 * done hours), sorted by monthStart descending (latest month first).
 */
export function normalizeMonter(monter: any[] | null | undefined) {
  return asArray(monter)
    .map((entry: any) => ({
      id: String(entry?.id ?? ''),
      monthStart: entry?.monthStart ?? null,
      hours: Number(entry?.hours) || 0,
      hoursDone: Number(entry?.hoursDone) || 0,
      isDone: entry?.isDone === true,
      finnishedMissionId: entry?.finnished_mission?.data?.id
        ? String(entry.finnished_mission.data.id)
        : null
    }))
    .sort((a, b) => String(b.monthStart ?? '').localeCompare(String(a.monthStart ?? '')));
}

/**
 * A sale is counted in balances/tosplits only when **effective** — the money
 * holder self-reported (`self`), the bilateral saleClaim matured (`confirmed`)
 * or the sale predates the consent flow (null legacy). `open` means the claim
 * is still awaiting the holder's consent. (See PLAN_sale_holder_consent.)
 */
export function saleEffective(attrs: any): boolean {
  const status = attrs?.holderStatus ?? null;
  return status === 'self' || status === 'confirmed' || status == null;
}

export interface SaleChain {
  /** `matanot-<id>` for product chains, `sale-<id>` for stand-alone sales */
  id: string;
  matanot: any | null;
  recipeMissions: any[];
  recipeResources: any[];
  sales: any[];
}

/**
 * Reconstructs sale lifecycle chains: one chain per product (matanot) holding
 * its recipe missions/resources (each pointing into a mission/resource chain
 * via pendm / mesimabetahalich / pmash) and its sale records; sales without a
 * product (donations, site-share income, ad-hoc records) each form a
 * stand-alone chain. A complex-product sale is itself a process made of many
 * missions and resources — this is the seam that ties them together.
 */
export function reconstructSaleChains(
  matanots: any[] | null | undefined,
  sales: any[] | null | undefined
): SaleChain[] {
  const chains: SaleChain[] = [];
  const chainByMatanotId = new Map<string, SaleChain>();

  for (const matanot of asArray(matanots)) {
    if (!(matanot as any)?.id) continue;
    const chain: SaleChain = {
      id: `matanot-${(matanot as any).id}`,
      matanot,
      recipeMissions: asArray((matanot as any)?.attributes?.matanot_recipe_missions?.data),
      recipeResources: asArray((matanot as any)?.attributes?.matanot_recipe_resources?.data),
      sales: []
    };
    chains.push(chain);
    chainByMatanotId.set(String((matanot as any).id), chain);
  }

  for (const sale of asArray(sales)) {
    if (!(sale as any)?.id) continue;
    const matanotId = String((sale as any)?.attributes?.matanot?.data?.id ?? '');
    const chain = matanotId ? chainByMatanotId.get(matanotId) : undefined;
    if (chain) {
      chain.sales.push(sale);
    } else {
      chains.push({
        id: `sale-${(sale as any).id}`,
        matanot: null,
        recipeMissions: [],
        recipeResources: [],
        sales: [sale]
      });
    }
  }

  return chains;
}

/**
 * Resolves the chain a process-page ref points at.
 *
 * Accepted refs:
 *  - mission chain ids as produced by reconstructMissionChains:
 *    `pendm-<id>`, `om-<id>`, `bm-<id>`
 *  - resource chain ids: plain numeric open_mashaabim id
 *  - sale chain ids: `matanot-<id>` (product) / `sale-<id>` (stand-alone sale)
 *  - entity refs for anything inside a chain: `ask-<id>`, `act-<id>`,
 *    `fini-<id>`, `fm-<id>`, `askm-<id>`, `maap-<id>`, `pmash-<id>`,
 *    `rikmash-<id>`, `mash-<id>` (open_mashaabim)
 *
 * A prefixed chain id may not exist verbatim (e.g. `om-12` when open_mission
 * 12 was merged into the `pendm-…` chain, or `sale-7` when sale 7 belongs to
 * a product chain), so entity search is the fallback for every prefixed ref,
 * not only the non-chain ones.
 */
export function findChainByRef(
  missionChains: any[],
  resourceChains: any[],
  ref: string | null | undefined,
  saleChains: any[] = []
): { chain: any; kind: 'mission' | 'resource' | 'sale' } | null {
  if (!ref) return null;
  const direct =
    missionChains.find((chain) => String(chain.id) === ref) ??
    null;
  if (direct) return { chain: direct, kind: 'mission' };

  const directResource = resourceChains.find((chain) => String(chain.id) === ref) ?? null;
  if (directResource) return { chain: directResource, kind: 'resource' };

  const directSale = saleChains.find((chain) => String(chain.id) === ref) ?? null;
  if (directSale) return { chain: directSale, kind: 'sale' };

  const dash = ref.indexOf('-');
  if (dash <= 0) return null;
  const prefix = ref.slice(0, dash);
  const id = ref.slice(dash + 1);
  if (!id) return null;

  const missionMatchers: Record<string, (chain: any) => boolean> = {
    pendm: (chain) => String(chain.pendm?.id ?? '') === id,
    om: (chain) => String(chain.openMission?.id ?? '') === id,
    bm: (chain) => String(chain.mesimabetahalich?.id ?? '') === id,
    ask: (chain) =>
      asArray(chain.openMission?.attributes?.asks?.data).some(
        (ask: any) => String(ask?.id ?? '') === id
      ),
    act: (chain) => asArray(chain.acts).some((act: any) => String(act?.id ?? '') === id),
    fini: (chain) =>
      asArray(chain.finiapruvals).some((fini: any) => String(fini?.id ?? '') === id),
    fm: (chain) => String(chain.finnishedMissionId ?? '') === id
  };
  const missionMatcher = missionMatchers[prefix];
  if (missionMatcher) {
    const chain = missionChains.find(missionMatcher);
    return chain ? { chain, kind: 'mission' } : null;
  }

  const resourceMatchers: Record<string, (chain: any) => boolean> = {
    mash: (chain) => String(chain.openMashaabim?.id ?? '') === id,
    pmash: (chain) => String(chain.pmash?.id ?? '') === id,
    askm: (chain) =>
      asArray(chain.askms).some((askm: any) => String(askm?.id ?? '') === id),
    maap: (chain) => String(chain.maap?.id ?? '') === id,
    rikmash: (chain) =>
      asArray(chain.rikmashes).some((rikmash: any) => String(rikmash?.id ?? '') === id)
  };
  const resourceMatcher = resourceMatchers[prefix];
  if (resourceMatcher) {
    const chain = resourceChains.find(resourceMatcher);
    return chain ? { chain, kind: 'resource' } : null;
  }

  const saleMatchers: Record<string, (chain: any) => boolean> = {
    matanot: (chain) => String(chain.matanot?.id ?? '') === id,
    sale: (chain) => asArray(chain.sales).some((sale: any) => String(sale?.id ?? '') === id)
  };
  const saleMatcher = saleMatchers[prefix];
  if (saleMatcher) {
    const chain = saleChains.find(saleMatcher);
    return chain ? { chain, kind: 'sale' } : null;
  }

  return null;
}

/**
 * All chains belonging to a partof-based process id (the id space used by the
 * processes tab / ProcessBoard). An entity belongs to the process when its
 * `partofs` relation contains the id.
 */
export function chainsForPartof(
  missionChains: any[],
  resourceChains: any[],
  partofId: string,
  saleChains: any[] = []
): { missionChains: any[]; resourceChains: any[]; saleChains: any[] } {
  const hasPartof = (entity: any) =>
    asArray(entity?.attributes?.partofs?.data).some(
      (partof: any) => String(partof?.id ?? '') === partofId
    );
  return {
    missionChains: missionChains.filter(
      (chain) => hasPartof(chain.openMission) || hasPartof(chain.mesimabetahalich)
    ),
    resourceChains: resourceChains.filter((chain) => hasPartof(chain.openMashaabim)),
    saleChains: saleChains.filter((chain) => hasPartof(chain.matanot))
  };
}
