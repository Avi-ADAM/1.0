/**
 * Flatten rich-text HTML (as authored in the wish/mission RichText editor) to a
 * single line of plain text — for compact contexts (cards, list previews, meta
 * tags) where tags would otherwise show literally. For full display use the
 * `RichText` component instead; this is a lossy, safe-for-text fallback.
 */
export function stripHtml(html?: string | null): string {
  if (!html) return '';
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    // Turn block-level closers into spaces so words don't run together.
    .replace(/<\/(p|div|br|li|h[1-6]|tr)\s*\/?>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    // Decode the handful of entities a rich-text editor commonly emits.
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
