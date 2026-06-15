/**
 * Site Share — type definitions.
 *
 * See docs/PLAN_SITE_SHARE.md. The site (the "main rikma" / platform project)
 * participates in transactions as a service provider and receives a *suggested*
 * share, woven into the existing Tosplit/Haluka/Hervachti mechanism.
 *
 * Product decision (PLAN §3.0): the basis is role-based —
 *  - a provider/seller pays a % of their *earnings*  (basis 'provider_earnings')
 *  - a customer/buyer pays a % of their *spend*       (basis 'transaction_value')
 */

export type PayerRole = 'provider' | 'customer';

export type SiteShareBasis = 'provider_earnings' | 'transaction_value';

export interface SiteShareConfig {
  /** % of a provider's earnings (0..1), e.g. 0.03 = 3% */
  pctProvider: number;
  /** % of a customer's spend (0..1), e.g. 0.02 = 2% */
  pctCustomer: number;
  /** Optional floor on the suggested amount (in matbea units). null = no floor. */
  min?: number | null;
  /** Optional cap on the suggested amount. null = no cap. */
  max?: number | null;
}

export interface SiteShareInput {
  payerRole: PayerRole;
  /** provider → their earnings; customer → their spend. */
  baseAmount: number;
  /** Currency id (matbea). Carried through to the result. */
  matbea?: string;
  /** Per-call override of the default config. */
  config?: Partial<SiteShareConfig>;
}

export interface SiteShareResult {
  /** The suggested amount the site receives, rounded to 2 decimals. */
  siteAmount: number;
  basis: SiteShareBasis;
  /** The effective percentage that was applied. */
  suggestedPct: number;
  matbea?: string;
  /** Human-readable line, framed as a service (not a commission). */
  line: { he: string; en: string };
}
