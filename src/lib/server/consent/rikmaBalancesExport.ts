/**
 * Strapi side of the per-rikma balance (see $lib/consent/rikmaBalances): reads
 * a rikma's splits over v4 REST with the service token — the same access the
 * genesis export already uses — and turns them into SplitRows.
 *
 * Read-only and advisory, like the export it feeds: the comparison panel and
 * a genesis proposer read it; the signatures are what the Space rests on.
 */

import type { SplitRow } from '$lib/consent/rikmaBalances';

const PAGE_SIZE = 100;
/** A rikma with more splits than this is a different conversation. */
const MAX_PAGES = 50;

type RestRelation<T> = { data?: T | null };
type RestRow<A> = { id: string | number; attributes?: A };

type TosplitAttrs = {
  finished?: boolean | null;
  hervachti?: Array<{
    amount?: number | null;
    noten?: boolean | null;
    mekabel?: boolean | null;
    users_permissions_user?: RestRelation<RestRow<unknown>>;
  } | null> | null;
  halukas?: RestRelation<Array<RestRow<{ confirmed?: boolean | null }>>>;
};

/** One page of `/api/tosplits` → SplitRows. Pure. */
export function splitRowsFromRest(body: unknown): SplitRow[] {
  const rows = (body as { data?: Array<RestRow<TosplitAttrs>> })?.data ?? [];
  return rows.map((row) => {
    const a = row.attributes ?? {};
    return {
      finished: a.finished ?? null,
      entries: (a.hervachti ?? [])
        .filter((e): e is NonNullable<typeof e> => e != null)
        .map((e) => ({
          member: e.users_permissions_user?.data?.id != null ? String(e.users_permissions_user.data.id) : '',
          amount: e.amount ?? null,
          noten: e.noten ?? null,
          mekabel: e.mekabel ?? null
        })),
      halukasConfirmed: (a.halukas?.data ?? []).map((h) => h.attributes?.confirmed === true)
    };
  });
}

export function tosplitsQuery(projectId: string, page: number): string {
  return (
    `filters[project][id][$eq]=${encodeURIComponent(projectId)}` +
    '&fields[0]=finished' +
    '&populate[hervachti][fields][0]=amount' +
    '&populate[hervachti][fields][1]=noten' +
    '&populate[hervachti][fields][2]=mekabel' +
    // a relation needs one real field to populate; only its id is read
    '&populate[hervachti][populate][users_permissions_user][fields][0]=username' +
    '&populate[halukas][fields][0]=confirmed' +
    `&pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}`
  );
}

/** Every split of the rikma, page by page. Throws on a Strapi error. */
export async function fetchRikmaSplitRows(
  projectId: string,
  get: (pathAndQuery: string) => Promise<unknown>
): Promise<SplitRow[]> {
  const out: SplitRow[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const body = await get(`/api/tosplits?${tosplitsQuery(projectId, page)}`);
    out.push(...splitRowsFromRest(body));
    const pageCount = (body as { meta?: { pagination?: { pageCount?: number } } })?.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) break;
  }
  return out;
}
