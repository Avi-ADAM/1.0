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
  manualSplit: false,
  /** R3 — inject the site share into the concierge → sale path. */
  concierge: false
} as const;

/**
 * The platform's treasury user id (the recipient of the site-share Haluka).
 * Empty string disables injection even when a flag is on — a deliberate
 * safety interlock until a real treasury user is provisioned (PLAN §2.2 option A).
 */
export const SITE_SHARE_TREASURY_USER_ID = '';

/** The platform / "main rikma" project id (PLAN §2.1). */
export const SITE_SHARE_PLATFORM_PROJECT_ID = '';

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
