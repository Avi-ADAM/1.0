/**
 * Site Share — configuration & feature flags.
 *
 * Defaults live here for the first implementation (R0/R1). They are intended to
 * migrate to env vars / a Strapi settings entity later (see PLAN §2.1, §3.1).
 *
 * IMPORTANT: every flag defaults to OFF, so with this file unchanged the site
 * takes no share and the existing revenue-split behaviour is unaffected.
 */

import type { SiteShareConfig } from './types.js';

/** Feature flags per injection path (PLAN §9). */
export const SITE_SHARE_FLAGS = {
  /** R1 — inject the site share into the manual moach revenue split. */
  manualSplit: true,
  /** R3 — inject the site share into the concierge → sale path. */
  concierge: false,
  /**
   * R4 — cross-rikma Strapi fields (isSiteShare, recive_project, source_tosplit,
   * adjustment fields) per src/generated/SITE_SHARE_TRANSFER_SPEC.md §1/§7.
   * While OFF: createHaluka sends no new fields, the lev query omits
   * `siteShareHalukas`, and the proposal card shows no 1💗1 row — zero regression
   * on a Strapi that lacks the fields. Flip ON once the backend ships them.
   * ON since 1.0b shipped the haluka/tosplit cross-rikma fields (2026-06).
   */
  crossRikmaFields: true
} as const;

/** The platform / "main rikma" project id (PLAN §2.1). Optional override — when empty,
 * the project is resolved at runtime via the isPlatform flag. */
export const SITE_SHARE_PLATFORM_PROJECT_ID = '1';

/** Optional override to pin a specific treasury recipient user (PLAN §2.2). When
 * empty, the recipient is the platform project's first member (`user_1s[0]`),
 * resolved at runtime. Kept for the env-override path in `platformProject.ts`. */
export const SITE_SHARE_TREASURY_USER_ID = '';

/**
 * Suggested percentages. Placeholder defaults — the exact numbers are a config
 * parameter, not hard policy (PLAN §3.1).
 */
export const DEFAULT_SITE_SHARE_CONFIG: SiteShareConfig = {
  pctProvider: 0.03,
  pctCustomer: 0.02,
  min: null,
  max: null
};
