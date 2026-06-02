/**
 * Platform project / treasury resolution (server-side). See PLAN §2.
 *
 * Resolves the "main rikma" project id and treasury user id from env, falling
 * back to the static config constants. Server-only so percentages / ids are not
 * forced into the public bundle once env wiring lands.
 */

import {
  SITE_SHARE_PLATFORM_PROJECT_ID,
  SITE_SHARE_TREASURY_USER_ID
} from '$lib/revenue/config.js';

function fromEnv(name: string): string {
  try {
    // process.env is available in the Node/SvelteKit server runtime.
    const v = typeof process !== 'undefined' ? process.env?.[name] : undefined;
    return (v ?? '').toString().trim();
  } catch {
    return '';
  }
}

/** The platform / main-rikma project id, or '' when not configured. */
export function getPlatformProjectId(): string {
  return fromEnv('PLATFORM_PROJECT_ID') || SITE_SHARE_PLATFORM_PROJECT_ID || '';
}

/** The treasury user id that receives the site-share Haluka, or '' when unset. */
export function getTreasuryUserId(): string {
  return fromEnv('PLATFORM_TREASURY_USER_ID') || SITE_SHARE_TREASURY_USER_ID || '';
}

/** True only when both ids are present — the interlock for any injection. */
export function isPlatformConfigured(): boolean {
  return Boolean(getPlatformProjectId() && getTreasuryUserId());
}
