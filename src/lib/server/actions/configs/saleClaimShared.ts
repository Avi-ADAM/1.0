/**
 * Shared logic for the bilateral saleClaim Decision (PLAN_sale_holder_consent).
 *
 * A saleClaim rides the Decision model but its consensus rule is different from
 * every other kind: exactly two parties (reporter + claimed holder), and the
 * "version on the table" advances through negom precision rounds.
 *
 * Round numbering:
 *   - round 1  = the original claim (values live on the Sale itself; no negom).
 *   - round N  = negom[N-2]  (a counter appended one precision entry, order+1).
 * So the standing round = negom.length + 1, and both a vote and a counter carry
 * `order` = the round they pertain to.
 */

export type SaleClaimVote = { userId: string; order: number; what: boolean; zman?: string };
export type NegomRound = {
  hm?: number | null;
  price?: number | null;
  kindOf?: string | null;
  sqadualed?: string | null;
  sqadualedf?: string | null;
  notes?: string | null;
  name?: string | null;
  descrip?: string | null;
  spnot?: string | null;
};

export type SaleClaim = {
  id: string;
  kind: string;
  archived: boolean;
  vots: SaleClaimVote[];
  negom: NegomRound[];
  timegramaId?: string;
  timegramaDate?: string;
  saleId: string;
  saleUnit?: number | null;
  saleIn?: number | null;
  saleDate?: string | null;
  saleStartDate?: string | null;
  saleFinishDate?: string | null;
  saleNote?: string | null;
  holderId: string;
  reporterId: string;
  matanotId?: string;
  matanotQuant?: number | null;
  restime?: string | null;
} | null;

/** Load and normalize a saleClaim Decision via the getSaleClaimDecision qid. */
export async function fetchSaleClaim(strapi: any, context: any, decisionId: string): Promise<SaleClaim> {
  const res = await strapi.execute('getSaleClaimDecision', { eid: decisionId }, context.jwt, context.fetch);
  const d = res?.data?.decision?.data;
  if (!d) return null;
  const a = d.attributes ?? {};
  const sale = a.sale?.data;
  const sa = sale?.attributes ?? {};
  const num = (x: any) => (x == null ? null : Number(x));

  return {
    id: String(d.id),
    kind: a.kind ?? '',
    archived: !!a.archived,
    vots: (a.vots ?? []).map((v: any) => ({
      userId: String(v.users_permissions_user?.data?.id ?? v.ide ?? ''),
      order: Number(v.order ?? 0),
      what: v.what ?? false,
      zman: v.zman,
    })),
    negom: (a.negom ?? []).map((n: any) => ({
      hm: num(n.hm),
      price: num(n.price),
      kindOf: n.kindOf ?? null,
      sqadualed: n.sqadualed ?? null,
      sqadualedf: n.sqadualedf ?? null,
      notes: n.notes ?? null,
      name: n.name ?? null,
      descrip: n.descrip ?? null,
      spnot: n.spnot ?? null,
    })),
    timegramaId: a.timegrama?.data?.id ? String(a.timegrama.data.id) : undefined,
    timegramaDate: a.timegrama?.data?.attributes?.date,
    saleId: sale?.id ? String(sale.id) : '',
    saleUnit: num(sa.unit),
    saleIn: num(sa.in),
    saleDate: sa.date ?? null,
    saleStartDate: sa.startDate ?? null,
    saleFinishDate: sa.finishDate ?? null,
    saleNote: sa.note ?? null,
    holderId: String(sa.users_permissions_user?.data?.id ?? ''),
    reporterId: String(sa.reporter?.data?.id ?? ''),
    matanotId: sa.matanot?.data?.id ? String(sa.matanot.data.id) : undefined,
    matanotQuant: num(sa.matanot?.data?.attributes?.quant),
    restime: sale?.attributes?.project?.data?.attributes?.restime ?? null,
  };
}

/** The round currently on the table (highest precision round, min 1). */
export function standingOrder(claim: NonNullable<SaleClaim>): number {
  return (claim.negom?.length ?? 0) + 1;
}

/** Resolve the concrete Sale field values for a given round. */
export function standingSaleVersion(
  claim: NonNullable<SaleClaim>,
  order: number,
): { in: number | null; unit: number | null; date: string | null; startDate: string | null; finishDate: string | null; note: string | null } {
  if (order <= 1 || !claim.negom?.length) {
    // Original claim — values already live on the Sale.
    return {
      in: claim.saleIn ?? null,
      unit: claim.saleUnit ?? null,
      date: claim.saleDate ?? null,
      startDate: claim.saleStartDate ?? null,
      finishDate: claim.saleFinishDate ?? null,
      note: claim.saleNote ?? null,
    };
  }
  const n = claim.negom[order - 2];
  const unit = n?.hm ?? null;
  const price = n?.price ?? null;
  // Total (in) is derived from quantity × unit-price when both are present.
  const total = unit != null && price != null ? Number(unit) * Number(price) : claim.saleIn ?? null;
  return {
    in: total,
    unit,
    date: claim.saleDate ?? null, // the sale/report date is not renegotiated
    startDate: n?.sqadualed ?? claim.saleStartDate ?? null,
    finishDate: n?.sqadualedf ?? claim.saleFinishDate ?? null,
    note: n?.notes ?? claim.saleNote ?? null,
  };
}

/** True when BOTH the holder and the reporter carry a YES vote at `order`. */
export function bothPartiesSigned(
  vots: Array<{ users_permissions_user?: string; userId?: string; order?: number; what?: boolean }>,
  order: number,
  holderId: string,
  reporterId: string,
): boolean {
  const signedAt = (uid: string) =>
    vots.some(
      (v) =>
        String((v as any).users_permissions_user ?? (v as any).userId) === uid &&
        Number(v.order) === order &&
        v.what,
    );
  return signedAt(holderId) && signedAt(reporterId);
}

/** restime enum → milliseconds (mirrors $lib/func/calcX.svelte). */
export function restimeToMs(restime: string | null | undefined): number {
  switch (restime) {
    case 'feh':    return 48 * 60 * 60 * 1000;
    case 'sth':    return 72 * 60 * 60 * 1000;
    case 'nsh':    return 96 * 60 * 60 * 1000;
    case 'sevend': return 168 * 60 * 60 * 1000;
    default:       return 72 * 60 * 60 * 1000; // safe default: 72h
  }
}

/** Map query-shaped vots to ComponentProjectsVotsInput, dropping the round id. */
export function normalizeVots(vots: SaleClaimVote[]): Array<Record<string, unknown>> {
  return vots.map((v) => ({
    what: v.what ?? true,
    users_permissions_user: String(v.userId),
    ide: parseInt(String(v.userId), 10),
    zman: v.zman ?? new Date().toISOString(),
    order: Number(v.order ?? 0),
  }));
}
