/**
 * Plain-text excerpt of a tiptap/`descrip` HTML string, for card summaries.
 *
 * The server-side discovery normalizers do the same thing before the payload
 * leaves the server (`src/lib/server/discovery/normalizeCards.ts`); this is the
 * client-side twin, for views that render raw Strapi nodes (the moach board,
 * which reuses the getProjectMissions payload rather than a normalized one).
 *
 * Strings that are literally 'null'/'undefined' happen in this data — old rows
 * stored the words — so they are treated as empty.
 */
export function htmlExcerpt(html: unknown, max = 220): string {
  if (typeof html !== 'string') return '';
  const raw = html.trim();
  if (!raw || raw === 'null' || raw === 'undefined') return '';
  const text = raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
