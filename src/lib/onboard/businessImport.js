/**
 * Business onboarding → the one review screen (PLAN_AI_SIGNUP_CONCIERGE §4.3, §4.5).
 *
 * `/api/analyze-business` now returns its draft as a rikma blueprint as well.
 * Saved as an assistant session, the member reviews the rikma with all its
 * products, missions and resources on `/moach/import/<id>` and creates them in
 * one click — instead of approving the rikma alone and then opening each
 * starter-board row in its own form.
 *
 * Returns the review path, or `null` when there is no blueprint or saving it
 * failed; the caller then keeps the old prefill-the-form path, so the member
 * never loses their analysis to this step.
 */

import { executeAction } from '$lib/client/actionClient';
import { stashSeedPlan } from '$lib/onboard/seedPlanHandoff.js';

/**
 * @param {any} analysis - the /api/analyze-business response
 * @param {string} sourceText - the address or paragraph it was drawn from
 * @returns {Promise<string|null>}
 */
export async function openBusinessImport(analysis, sourceText) {
  if (!analysis?.blueprint) return null;
  try {
    const res = await executeAction(
      'proposeRikmaBlueprint',
      { blueprint: analysis.blueprint, via: 'site', sourceText: String(sourceText ?? '').slice(0, 8000) },
      { showErrorToast: false }
    );
    const sessionId = res?.success ? res.data?.sessionId : null;
    if (!sessionId) return null;
    // The draft lives in the session now; boards parked for the old path would
    // otherwise be seeded into the next rikma this member creates by hand.
    stashSeedPlan(null);
    return `/moach/import/${sessionId}`;
  } catch {
    return null;
  }
}
