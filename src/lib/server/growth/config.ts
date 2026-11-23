/**
 * Lev Growth Agent configuration (docs/inprogress/PLAN_GROWTH_AGENT.md §8).
 *
 *   GROWTH_STATE_DIR     where the prospect store lives. Unset ⇒ the module is
 *                        OFF and says so; it never pretends to keep records in
 *                        a container that may vanish (same rule as
 *                        TRANSLATE_STATE_DIR).
 *   GROWTH_PROJECT_ID    the rikma whose members operate it. Defaults to the
 *                        central rikma (DEMO_CENTRAL_PROJECT_ID, else '1').
 *   GROWTH_OPERATOR_IDS  optional comma list that narrows it further to named
 *                        members of that rikma. It can never widen it.
 */

import { env } from '$env/dynamic/private';
import { DEFAULT_CENTRAL_PROJECT_ID } from '$lib/server/siteReport';

export function growthStateDir(): string {
  return String(env.GROWTH_STATE_DIR ?? '').trim();
}

export function growthProjectId(): string {
  return String(env.GROWTH_PROJECT_ID || env.DEMO_CENTRAL_PROJECT_ID || DEFAULT_CENTRAL_PROJECT_ID).trim();
}

export function growthOperatorIds(): string[] {
  return String(env.GROWTH_OPERATOR_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
