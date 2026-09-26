/**
 * External search providers for the concierge
 * (docs/inprogress/PLAN_CONCIERGE_EXTERNAL_SOURCES.md §4.1).
 *
 * One interface, many engines: Gemini grounding is an implementation, not the
 * architecture. Every provider works against a search *API* — none of them
 * fetches the result pages themselves (§3.2: no scraping).
 */

export type ExternalProviderId = 'gemini' | 'tavily' | 'brave';

/**
 * What leaves the platform for one need — and nothing else (§7). Built only
 * by `buildQueries`, which is tested to carry no other field.
 */
export interface ExternalQuery {
  /** Our plan-row key (`m:2`); never sent to the provider. */
  key: string;
  /** The need, normalised — "צלם אירועים". */
  need: string;
  /** Settlement / region level only — "חיפה". Never a street or a point. */
  locationLabel: string | null;
  /** he / en / ru / ar / es */
  language: string;
  kind: 'mission' | 'resource' | 'product';
}

/** A result as a provider returned it, before `normalizeResults` trims it. */
export interface RawExternalResult {
  url: string;
  title?: string | null;
  snippet?: string | null;
  price?: number | string | null;
  currency?: string | null;
  locationLabel?: string | null;
}

export interface ExternalSearchProvider {
  id: ExternalProviderId;
  /** Is it configured (has a key)? */
  available(): boolean;
  search(q: ExternalQuery): Promise<RawExternalResult[]>;
}

/**
 * The provider to use: the preferred one when it is available, else the first
 * available in the given order. null ⇒ the feature is silently off.
 */
export function resolveExternalProvider(
  providers: ExternalSearchProvider[],
  preferred: string | null = null
): ExternalSearchProvider | null {
  if (preferred) {
    const hit = providers.find((p) => p.id === preferred && p.available());
    if (hit) return hit;
  }
  return providers.find((p) => p.available()) ?? null;
}
