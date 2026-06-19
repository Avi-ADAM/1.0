/**
 * Platform ("main rikma" / 1💗1) identity — one global record for the whole app.
 *
 * The site-share service line shown on the haluka proposal card brands itself
 * with the real main-rikma identity (logo + name) and links to its public page
 * `/project/<projectId>`. That identity is the same for every card, so we resolve
 * it **once** (on `/lev` init) and read it from this store instead of threading it
 * through every processed item.
 *
 * Resolution is live today — `isPlatform` already exists in Strapi (see
 * getPlatformProject.ts / qid 205). Only the per-proposal *amount* waits on the
 * cross-rikma fields behind `SITE_SHARE_FLAGS.crossRikmaFields`
 * (src/generated/SITE_SHARE_TRANSFER_SPEC.md §7).
 */

import { writable, get } from 'svelte/store';
import { executeAction } from '$lib/client/actionClient';

export interface PlatformIdentity {
  /** true only when a platform project exists with a treasury member. */
  configured: boolean;
  projectId: string | null;
  projectName: string;
  /** Project logo url, '' when none. */
  logoUrl: string;
  /** The treasury recipient (platform project's first member). */
  treasuryUserId: string | null;
}

const EMPTY: PlatformIdentity = {
  configured: false,
  projectId: null,
  projectName: '',
  logoUrl: '',
  treasuryUserId: null
};

export const platformStore = writable<PlatformIdentity>({ ...EMPTY });

let resolved = false;

/**
 * Resolve the platform identity once per session. Safe to call repeatedly — only
 * the first call hits the network. Never throws: on any failure the store stays
 * at its empty (unconfigured) default so the card simply shows no platform row.
 */
export async function resolvePlatformIdentity(): Promise<PlatformIdentity> {
  if (resolved) return get(platformStore);
  resolved = true;
  try {
    const res = await executeAction('getPlatformProject', {});
    const d = (res?.success ? res.data : null) as Partial<PlatformIdentity> | null;
    if (d && d.configured) {
      const next: PlatformIdentity = {
        configured: true,
        projectId: d.projectId ?? null,
        projectName: d.projectName ?? '',
        logoUrl: d.logoUrl ?? '',
        treasuryUserId: d.treasuryUserId ?? null
      };
      platformStore.set(next);
      return next;
    }
  } catch (err) {
    console.warn('[platformStore] Failed to resolve platform identity', err);
    resolved = false; // allow a later retry
  }
  return get(platformStore);
}
