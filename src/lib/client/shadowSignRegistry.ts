// Central shadow-sign hook for S2b actions (HANDOFF T4 step 6).
//
// executeAction calls this fire-and-forget after every successful action.
// Actions registered in s2bShadowJobs get a parallel signed ConsentEvent —
// same belt-and-suspenders Phase 1 semantics as the per-call-site
// shadowSignFromCookie wiring (addVote, createSale), but wired once here
// because these subjects' ids are only known from the action result.
//
// Never throws, never blocks the action result.

import { s2bShadowJobs } from '$lib/consent/specs/s2b';
import { shadowSignFromCookie } from './shadowSign';

export function shadowSignForAction(
  actionKey: string,
  params: Record<string, unknown>,
  resultData: unknown
): void {
  const deriver = s2bShadowJobs[actionKey];
  if (!deriver) return;
  try {
    const jobs = deriver(params ?? {}, (resultData ?? {}) as Record<string, unknown>);
    for (const job of jobs) {
      void shadowSignFromCookie(job.spec, job.params);
    }
  } catch {
    // shadow path must never disturb the action flow
  }
}
