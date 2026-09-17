/**
 * The rikma's code license (PLAN_CODE_RIKMA §2.2) — the single source of truth
 * for which values exist and what a proposed change may carry.
 *
 * `Project.codeLicense` is a Strapi enum, and the silence-consent maturation in
 * `routes/api/timegrama/decision.svelte` writes it as an *unquoted* GraphQL
 * literal. So a value read back from a Decision is never trusted: it goes
 * through `normalizeLicenseChange` first, and anything outside the list is
 * dropped rather than interpolated.
 *
 * `null` = legacy = `none` — every rikma created before S1 has no license set.
 */

export const CODE_LICENSES = [
  'none',
  'mit',
  'apache',
  'rikma',
  'rikmaDelayed',
  'rikmaShared',
  'rikmaSharedDelayed'
] as const;
export type CodeLicense = (typeof CODE_LICENSES)[number];

/** BSL's customary change date; a rikma can pick anything in the range below. */
export const DEFAULT_OPEN_YEARS = 4;
export const MIN_OPEN_YEARS = 1;
export const MAX_OPEN_YEARS = 10;

export function isCodeLicense(v: unknown): v is CodeLicense {
  return typeof v === 'string' && (CODE_LICENSES as readonly string[]).includes(v);
}

/** Legacy rows (null / unknown) read as `none`. */
export function effectiveLicense(v: unknown): CodeLicense {
  return isCodeLicense(v) ? v : 'none';
}

/** Restrictive licenses: commercial / production use needs the rikma's consent. */
export function isRikmaLicense(v: unknown): boolean {
  const l = effectiveLicense(v);
  return l === 'rikma' || l === 'rikmaDelayed';
}

/**
 * "Create with us" (PLAN_CODE_RIKMA §2.1.1): the code is the rikma's tool, not
 * its product, so nothing is for sale. The UI shows an invitation to the join
 * page's two tracks (missions / resources) — never a prohibition. The
 * competing-service clause lives only in the legal text.
 */
export function isSharedLicense(v: unknown): boolean {
  const l = effectiveLicense(v);
  return l === 'rikmaShared' || l === 'rikmaSharedDelayed';
}

/** Licenses that open to MIT/Apache after `openYears` (BSL / FSL shape). */
export function isDelayedLicense(v: unknown): boolean {
  const l = effectiveLicense(v);
  return l === 'rikmaDelayed' || l === 'rikmaSharedDelayed';
}

export interface LicenseTerms {
  license: CodeLicense;
  /** Only meaningful for the delayed licenses; always null otherwise. */
  openYears: number | null;
}

/**
 * Validate a proposed license + years pair. Returns null for anything that
 * is not a real license, so callers can refuse instead of guessing.
 * `openYears` is clamped into range for the delayed licenses and cleared for the rest.
 */
export function normalizeLicenseChange(license: unknown, openYears?: unknown): LicenseTerms | null {
  if (!isCodeLicense(license)) return null;
  if (!isDelayedLicense(license)) return { license, openYears: null };
  const n = Math.round(Number(openYears));
  const years = Number.isFinite(n) && n > 0 ? n : DEFAULT_OPEN_YEARS;
  return {
    license,
    openYears: Math.min(MAX_OPEN_YEARS, Math.max(MIN_OPEN_YEARS, years))
  };
}

/** Does `next` differ from what the rikma has now? Legacy null equals `none`. */
export function licenseChanged(
  current: { license: unknown; openYears?: unknown },
  next: LicenseTerms
): boolean {
  const cur = normalizeLicenseChange(effectiveLicense(current.license), current.openYears);
  if (!cur) return true;
  return cur.license !== next.license || cur.openYears !== next.openYears;
}
