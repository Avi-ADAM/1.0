/**
 * computeSiteShare — the single source of truth for the site's suggested share.
 *
 * Pure & deterministic, so it can be called from both the server (action layer)
 * and the client (split UI), and unit-tested in isolation. See PLAN §3.2.
 */

import type { SiteShareConfig, SiteShareInput, SiteShareResult } from './types.js';
import { DEFAULT_SITE_SHARE_CONFIG } from './config.js';

/** Round to 2 decimals without floating-point dust. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function clamp(value: number, min?: number | null, max?: number | null): number {
  let out = value;
  if (typeof min === 'number' && Number.isFinite(min)) out = Math.max(out, min);
  if (typeof max === 'number' && Number.isFinite(max)) out = Math.min(out, max);
  return out;
}

/**
 * Compute the suggested amount the site receives for a single transaction.
 *
 * The amount is *suggested* — the payer may later pay less or more (PLAN §4).
 * Returns 0 for a non-positive base, so callers can safely skip empty lines.
 */
export function computeSiteShare(input: SiteShareInput): SiteShareResult {
  const cfg: SiteShareConfig = { ...DEFAULT_SITE_SHARE_CONFIG, ...(input.config ?? {}) };

  const isProvider = input.payerRole === 'provider';
  const basis = isProvider ? 'provider_earnings' : 'transaction_value';

  // Guard the percentage into [0, 1].
  const rawPct = isProvider ? cfg.pctProvider : cfg.pctCustomer;
  const suggestedPct = clamp(Number(rawPct) || 0, 0, 1);

  const base = Number(input.baseAmount);
  let siteAmount = 0;
  if (Number.isFinite(base) && base > 0) {
    siteAmount = round2(clamp(base * suggestedPct, cfg.min, cfg.max));
    if (siteAmount < 0) siteAmount = 0;
  }

  const line = isProvider
    ? {
        he: 'שירות ניהול ושותפות של 1lev1 (חלק מהרווח)',
        en: '1lev1 management & partnership service (share of earnings)'
      }
    : {
        he: 'שירות התאמה ומציאת ספקים של 1lev1',
        en: '1lev1 matching & sourcing service'
      };

  return {
    siteAmount,
    basis,
    suggestedPct,
    matbea: input.matbea,
    line
  };
}
