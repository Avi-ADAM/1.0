/**
 * "Work at your place" — which lines of a plan the customer approves the *who* of
 * (docs/inprogress/PLAN_DEAL_PRICING_TRACKS.md §3.4).
 *
 * On a fixed price, who does each part is the rikma's business: she bought an outcome
 * (P3). But a part that comes into her home, touches her children or her papers is a
 * question of trust, not of money, and that holds at any price, 0 included. She marks
 * such a line (`MatanotRecipeMission/Resource.atCustomer`), and whoever takes it needs
 * her yes — or her request for someone else, which is a counter, never a "no". On an
 * at-cost deal she signs every candidacy anyway, so the mark changes nothing there.
 *
 * Fail-safe in the same direction as the track: off, nothing is read and nothing is
 * marked; a failed read marks every line asked about — her signature is asked for rather
 * than lost.
 */
import { pricingTracksEnabled } from '$lib/sheirut/pricingTracksFlag';
import type { QidRunner } from '$lib/server/sheirut/dealDue';

export type LineKind = 'mission' | 'resource';

/** `mission:<id>` / `resource:<id>` — recipe missions and resources have separate ids. */
export const lineKey = (kind: LineKind, id: string | number) => `${kind}:${id}`;

/** The marked lines among those asked about. */
export async function loadAtCustomer(run: QidRunner, lines: Array<{ kind: LineKind; id: string }>): Promise<Set<string>> {
  const out = new Set<string>();
  if (!pricingTracksEnabled() || lines.length === 0) return out;
  const mids = lines.filter((l) => l.kind === 'mission').map((l) => String(l.id));
  const rids = lines.filter((l) => l.kind === 'resource').map((l) => String(l.id));
  try {
    // An id no line has keeps an empty list from matching every row.
    const res = await run('478recipeLinesAtCustomer', { mids: mids.length ? mids : ['0'], rids: rids.length ? rids : ['0'] });
    if (res?.errors?.length) throw new Error(JSON.stringify(res.errors).slice(0, 300));
    const data = res?.data ?? res;
    for (const n of data?.matanotRecipeMissions?.data ?? []) if (n?.attributes?.atCustomer === true) out.add(lineKey('mission', n.id));
    for (const n of data?.matanotRecipeResources?.data ?? []) if (n?.attributes?.atCustomer === true) out.add(lineKey('resource', n.id));
  } catch (e) {
    console.warn('[atCustomer] reading the marks failed (every line asked about needs her yes):', e);
    for (const l of lines) out.add(lineKey(l.kind, l.id));
  }
  return out;
}

export async function lineAtCustomer(run: QidRunner, kind: LineKind, id: string): Promise<boolean> {
  return (await loadAtCustomer(run, [{ kind, id }])).has(lineKey(kind, id));
}

export async function writeAtCustomer(run: QidRunner, kind: LineKind, id: string, atCustomer: boolean): Promise<void> {
  const res = await run(kind === 'mission' ? '479setRecipeMissionAtCustomer' : '480setRecipeResourceAtCustomer', {
    id: String(id),
    atCustomer
  });
  if (res?.errors?.length) throw new Error(`Could not mark the part: ${JSON.stringify(res.errors).slice(0, 300)}`);
}
