/**
 * The claim callback (docs/inprogress/PLAN_GROWTH_AGENT.md §10.2).
 *
 * `growthPrepareOnboarding` stores the assistant-session id of the draft it
 * prepared. When that session is claimed (a signup via the agent link, or the
 * receive link for an existing account) or a rikma is created from it, the
 * assistant code calls this, and the business moves on by itself:
 * claimed → onboardingStarted, rikma created → joined.
 *
 * Best-effort by design: it never throws into the owner's path. A session
 * that no prospect prepared (almost all of them) finds nothing and returns.
 */

import { applyOwnerEvent, type OwnerEvent } from '$lib/growth/prospect';
import { growthRepository } from './repo';

export async function noteOwnerEvent(sessionId: string | null | undefined, event: OwnerEvent): Promise<string | null> {
  if (!sessionId) return null;
  try {
    const repo = growthRepository();
    if (!repo) return null;
    const sid = String(sessionId);
    const match = (await repo.list()).find((p) => p.onboarding?.sessionId === sid);
    if (!match) return null;
    const at = new Date().toISOString();
    const next = await repo.update(match.id, (p) => applyOwnerEvent(p, event, at));
    return next?.id ?? null;
  } catch (e) {
    console.warn('[growth] owner event not recorded:', e);
    return null;
  }
}
