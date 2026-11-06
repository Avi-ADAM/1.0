// A2b P3 — the browser half of lazy settings signing. Once per page session
// per rikma, after the replica first syncs: ask the server which settings
// Decisions took effect, and sign what the chain is missing
// (planLazySettingsSigns). Fire-and-forget like every shadow signature: a
// failure is a gap the next session closes, never a page error.

import type { ConsentEvent } from '$lib/consent/event';
import { planLazySettingsSigns, type MaturedSettingRow } from '$lib/consent/specs/projectAmend';
import { shadowSignFromCookie } from './shadowSign';

const started = new Set<string>();

/** Number of signatures attempted (0 when skipped). */
export async function signMaturedSettings(
  projectId: string,
  events: Iterable<ConsentEvent>,
  fetchFn: typeof fetch = fetch
): Promise<number> {
  if (started.has(projectId)) return 0;
  started.add(projectId);
  try {
    const res = await fetchFn(`/api/consent/settings/${projectId}`, { credentials: 'include' });
    if (!res.ok) return 0;
    const body = (await res.json()) as { matured?: MaturedSettingRow[] };
    const jobs = planLazySettingsSigns(body.matured ?? [], events, projectId, Date.now());
    // In order: a Decision's timeout before its amend.
    for (const job of jobs) await shadowSignFromCookie(job.spec, job.params);
    return jobs.length;
  } catch {
    return 0;
  }
}

/** Tests only. */
export function _resetMaturedSettings(): void {
  started.clear();
}
