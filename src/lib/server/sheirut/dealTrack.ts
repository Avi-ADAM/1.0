/**
 * The pricing track a deal was signed under, as the server reads it to decide who signs
 * (docs/inprogress/PLAN_DEAL_PRICING_TRACKS.md P3).
 *
 * `atCost`: the customer is a party to everything that changes what she pays, so she
 * co-signs whoever takes an open part (C-19), every raise of a part (C-14) and the hours
 * above a part's ceiling (§3.2). `fixed`: she bought one outcome at one price; who does
 * what inside it, and for how many hours, is the rikma's own business (§3).
 *
 * Fail-safe in one direction only: off, unread, unknown or failed all read as `atCost`
 * — the track in which nothing is charged to her without her signature. A Strapi error
 * can therefore cost a provider a signature, never cost her money.
 */
import { effectivePricingTrack, type PricingTrack } from '$lib/sheirut/pricingTrack';
import { pricingTracksEnabled } from '$lib/sheirut/pricingTracksFlag';
import type { QidRunner } from './dealDue.js';

/** By sheirut id. Every id asked for is in the answer. */
export async function loadDealTracks(run: QidRunner, sheirutIds: readonly string[]): Promise<Record<string, PricingTrack>> {
  const ids = [...new Set(sheirutIds.map(String).filter(Boolean))];
  const out: Record<string, PricingTrack> = Object.fromEntries(ids.map((id) => [id, 'atCost' as PricingTrack]));
  // Off, nothing ever wrote a track — and a backend without the field is never asked.
  if (!pricingTracksEnabled() || ids.length === 0) return out;
  try {
    const res = await run('472sheirutPricingTracks', { ids });
    if (res?.errors?.length) throw new Error(JSON.stringify(res.errors).slice(0, 300));
    for (const s of (res?.data ?? res)?.sheiruts?.data ?? []) {
      if (String(s?.id) in out) out[String(s.id)] = effectivePricingTrack(s?.attributes?.pricingTrack);
    }
  } catch (e) {
    console.warn('[dealTrack] reading the deal tracks failed (read as atCost):', e);
  }
  return out;
}

export async function loadDealTrack(run: QidRunner, sheirutId: string): Promise<PricingTrack> {
  return (await loadDealTracks(run, [sheirutId]))[String(sheirutId)] ?? 'atCost';
}
