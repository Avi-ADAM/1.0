/**
 * Where an agreement signature came from.
 *
 * The agreement stands on its own: someone who arrived from a search or from
 * consensus.1lev1.com signed it and may want nothing else from the site. Only a
 * signature made on the way into the site gets the "continue your signup" mail,
 * and the query that picks them (`chezinsAwaitingNudge`) repeats that list. A
 * signature with no source, every one made before this existed, gets no mail.
 */
export const SIGNATURE_SOURCES = ['main', 'agreement_from_main', 'agreement_direct', 'sister'] as const;
export type SignatureSource = (typeof SIGNATURE_SOURCES)[number];

const LANGS = ['he', 'en', 'ar', 'ru', 'es'];

export function normalizeSource(value: unknown): SignatureSource | null {
  return (SIGNATURE_SOURCES as readonly unknown[]).includes(value) ? (value as SignatureSource) : null;
}

export function normalizeLang(value: unknown): string | null {
  return typeof value === 'string' && LANGS.includes(value) ? value : null;
}
