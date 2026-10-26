/**
 * What the "Promotions" tab of the sales screen reads (docs/inprogress/PLAN_SHOP_PROMOTIONS.md P5).
 *
 * Called from a `sales/manage/*` loader after the moach layout's membership
 * check, so it reads with the service token, like the shipping tab. Every
 * write still goes through the promotion actions with the member's own JWT.
 *
 * A rikma whose `promotion` collection cannot be read (the grants are not in
 * yet) gets `ready: false`, and the tab says so instead of erroring.
 */
import { calcDeadlineMs } from '$lib/server/actions/configs/actionUtils.js';
import { gqlStr, run } from '$lib/server/archive/gql.js';
import type { PromoPolicy, ShelfProduct } from '$lib/shop/promoTerms';
import { promoAdminExec } from './pricing';
import { fetchManagePromotions, fetchPromoProject, fetchShelf, type PromotionRow } from './store';

/** How far back ended promotions stay on the tab. */
const ENDED_SHOWN_DAYS = 30;

export interface PromoSetup {
  ready: boolean;
  policy: PromoPolicy | null;
  /** An envelope proposal still on the table — its vote page. */
  policyDecisionId: string | null;
  currency: string;
  /** The rikma's consent clock: how long a vote takes when nobody answers. */
  restimeMs: number;
  memberIds: string[];
  shelf: ShelfProduct[];
  promotions: PromotionRow[];
}

const notReady = (): PromoSetup => ({
  ready: false,
  policy: null,
  policyDecisionId: null,
  currency: 'ILS',
  restimeMs: 0,
  memberIds: [],
  shelf: [],
  promotions: []
});

export async function loadPromoSetup(projectId: string, now = new Date()): Promise<PromoSetup> {
  const exec = promoAdminExec();
  try {
    const since = new Date(now.getTime() - ENDED_SHOWN_DAYS * 24 * 3600_000);
    const [project, shelf, promotions, policyDecision] = await Promise.all([
      fetchPromoProject(exec, projectId),
      fetchShelf(exec, projectId),
      fetchManagePromotions(exec, projectId, since),
      run(
        exec,
        `{ decisions(filters: { projects: { id: { eq: ${gqlStr(projectId)} } }, kind: { eq: "promoPolicy" }, archived: { eq: false } }, sort: "id:desc", pagination: { limit: 1 }) { data { id } } }`,
        'promo:policy-open'
      ).catch(() => null)
    ]);
    if (!project) return notReady();
    return {
      ready: true,
      policy: project.policy,
      policyDecisionId: policyDecision?.decisions?.data?.[0]?.id ? String(policyDecision.decisions.data[0].id) : null,
      currency: project.currencyCode || 'ILS',
      restimeMs: calcDeadlineMs(project.restime ?? 'feh'),
      memberIds: project.memberIds,
      shelf: shelf.filter((p) => !p.archived),
      promotions
    };
  } catch (e) {
    console.warn('[promotions] manage setup unavailable:', (e as Error)?.message ?? e);
    return notReady();
  }
}
