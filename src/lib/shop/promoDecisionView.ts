/**
 * What a `promotion` / `promoPolicy` Decision card shows (docs/inprogress/PLAN_SHOP_PROMOTIONS.md §3.3, P3).
 *
 * Built from the lev query's decision node (`PROMO_DECISION_FIELDS` in
 * qids.js). The card's job is the consequence before the signature: the
 * version on the table, what in it goes beyond the rikma's envelope, and —
 * when the clock outlasts the start date — that the promotion would start at
 * approval and still end when agreed (D2).
 */
import {
  envelopeBreaches,
  normalizePromoPolicy,
  normalizePromoTerms,
  type Breach,
  type PromoPolicy,
  type PromoTerms
} from './promoTerms';

export interface PromoDecisionView {
  decisionId: string;
  kind: 'promotion' | 'promoPolicy';
  order: number;
  /** promotion: the version on the table. */
  standing: PromoTerms | null;
  /** promoPolicy: the envelope on the table. */
  policy: PromoPolicy | null;
  proposedById: string | null;
  proposedByName: string | null;
  why: string | null;
  isCounter: boolean;
  signedIds: string[];
  awaitingIds: string[];
  myTurn: boolean;
  breaches: Breach[];
  promotionStatus: string | null;
  /** The clock outlasts the start date: it would start at approval (D2). */
  startsLate: boolean;
}

const uid = (v: any): string => String(v?.users_permissions_user?.data?.id ?? v?.ide ?? '');

export function buildPromoDecisionView(
  decision: any,
  memberIds: string[],
  myId: string,
  opts: { now?: Date; timegramaDate?: string | null } = {}
): PromoDecisionView | null {
  const a = decision?.attributes;
  if (!a || (a.kind !== 'promotion' && a.kind !== 'promoPolicy')) return null;
  const now = opts.now ?? new Date();
  const vots: any[] = a.vots ?? [];

  let order = 1;
  let standing: PromoTerms | null = null;
  let policy: PromoPolicy | null = null;
  let proposedById: string | null = null;
  let proposedByName: string | null = null;
  let why: string | null = null;

  if (a.kind === 'promotion') {
    const proposals = (a.negopromo ?? []).filter((r: any) => r?.mode !== 'end');
    if (!proposals.length) return null;
    const top = proposals.reduce((x: any, y: any) => (Number(y.ordern) > Number(x.ordern) ? y : x));
    order = Number(top.ordern) || 1;
    // Read, not proposed: an end that passed while it waited is still the version on the table.
    const parsed = normalizePromoTerms(top, new Date(0));
    if (!parsed.ok) return null;
    standing = parsed.terms;
    proposedById = top.proposedBy?.data?.id != null ? String(top.proposedBy.data.id) : null;
    proposedByName = top.proposedBy?.data?.attributes?.username ?? null;
    why = top.why ?? null;
  } else {
    policy = normalizePromoPolicy(a.newPromoPolicy);
    if (!policy) return null;
    order = vots.reduce((mx, v) => Math.max(mx, Number(v.order) || 1), 1);
    const opener = vots.filter((v) => Number(v.order) === order).sort((x, y) => String(x.zman ?? '').localeCompare(String(y.zman ?? '')))[0];
    proposedById = opener ? uid(opener) : null;
    why = a.archWhy ?? null;
  }

  const signedIds = [...new Set(vots.filter((v) => Number(v.order) === order && v.what !== false).map(uid).filter(Boolean))];
  const awaitingIds = memberIds.filter((m) => !signedIds.includes(m));
  const promo = a.promotion?.data?.attributes;
  const projectPolicy = normalizePromoPolicy(promo?.project?.data?.attributes?.promoPolicy);
  const breaches = standing ? envelopeBreaches(standing, projectPolicy, { now }) : [];
  const deadline = opts.timegramaDate ? Date.parse(opts.timegramaDate) : NaN;

  return {
    decisionId: String(decision.id),
    kind: a.kind,
    order,
    standing,
    policy,
    proposedById,
    proposedByName,
    why,
    isCounter: order > 1,
    signedIds,
    awaitingIds,
    myTurn: memberIds.includes(String(myId)) && !signedIds.includes(String(myId)),
    breaches,
    promotionStatus: promo?.status ?? null,
    startsLate: !!standing?.startsAt && Number.isFinite(deadline) && deadline > Date.parse(standing.startsAt)
  };
}
