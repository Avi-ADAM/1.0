/**
 * Which currency a stored number is in (docs/PLAN_MULTI_CURRENCY.md D-C2, D-C7).
 *
 * Every `amount` on a rikma row is in the rikma's currency. The rikma's
 * currency is `Project.currencyCode`, and null there is legacy — every rikma
 * that existed before this field counted in shekels.
 */

import { DEFAULT_CURRENCY, normalizeCode, type CurrencyCode } from './currencies.js';

/** Strapi's Matbea row `2` is the shekel every legacy writer hard-coded (`matbea: '2'`). */
const LEGACY_MATBEA: Record<string, CurrencyCode> = { '2': 'ILS' };

type ProjectLike =
  | { currencyCode?: string | null; attributes?: { currencyCode?: string | null } | null }
  | null
  | undefined;

/** The rikma's accounting currency. Accepts a flat project or a GraphQL `{ attributes }` entity. */
export function rikmaCurrency(project: ProjectLike): CurrencyCode {
  const raw = project?.currencyCode ?? project?.attributes?.currencyCode;
  return normalizeCode(raw) ?? DEFAULT_CURRENCY;
}

type MatbeaLike =
  | { id?: string | number | null; code?: string | null; attributes?: { code?: string | null } | null; data?: MatbeaLike }
  | null
  | undefined;

/** A legacy `matbea` relation → an ISO code, or null when it names nothing we know. */
export function matbeaCode(matbea: MatbeaLike): CurrencyCode | null {
  if (!matbea) return null;
  if (matbea.data !== undefined) return matbeaCode(matbea.data);
  const direct = normalizeCode(matbea.code ?? matbea.attributes?.code);
  if (direct) return direct;
  return matbea.id != null ? (LEGACY_MATBEA[String(matbea.id)] ?? null) : null;
}
