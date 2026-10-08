/**
 * A wish's description is rich text (HTML, `RichText`). Forms edit it as words, and a
 * page that shows what *someone else* wrote shows it as words too — nothing a provider
 * types runs in a customer's page (PLAN_DIRECT_OFFER §5.1).
 */

/** HTML → the words, paragraphs kept as blank lines. */
export function plainText(html: string | null | undefined): string {
  return String(html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The words → the paragraphs RichText renders: escaped, one <p> per paragraph. */
export function paragraphsHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((para) => escape(para).replace(/\n/g, '<br>'))
    .filter((para) => para.trim() !== '')
    .map((para) => `<p>${para}</p>`)
    .join('');
}
