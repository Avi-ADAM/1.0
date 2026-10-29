/**
 * Rich text a model wrote, made safe to put in a form field.
 *
 * `/api/analyze-business` asks the model for a structured, rich `details`
 * (headings, lists, emphasis). Its input is a stranger's free text, so the
 * reply is untrusted: a description can ask the model to "add a <script>" and
 * the field is later rendered as HTML. This keeps only the tags the editor
 * (`RichText`, tiptap) can show, strips every attribute except a plain
 * http(s)/mailto `href` on a link, and drops whole the elements whose content
 * is never text (`script`, `style`, …). Everything else keeps its words and
 * loses its tag.
 *
 * Pure and string-based so the endpoint and its tests share it; it does not
 * try to be a general sanitizer — the allowed set is tiny on purpose.
 */

const ALLOWED = new Set([
  'h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'u', 's', 'a', 'br', 'blockquote'
]);

/** Elements whose content is code or chrome, never prose — removed with what is inside. */
const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|template|noscript|svg|math|head|title)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

const SAFE_HREF = /^(https?:\/\/|mailto:)[^\s"'<>`]+$/i;

function hrefOf(attrs: string): string | null {
  const m = /\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
  const v = (m?.[2] ?? m?.[3] ?? m?.[4] ?? '').trim();
  return SAFE_HREF.test(v) ? v : null;
}

export function keepRichHtml(html: string, max = 8000): string {
  if (typeof html !== 'string' || !html.trim()) return '';
  let out = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(DROP_WITH_CONTENT, '')
    // A stray opening tag of a dropped element with no close: drop to the end of the tag.
    .replace(/<(script|style|iframe|object|embed)\b[^>]*>/gi, '');

  out = out.replace(/<\s*(\/?)\s*([a-z][a-z0-9]*)\b([^>]*)>/gi, (_m, close: string, rawTag: string, attrs: string) => {
    let tag = rawTag.toLowerCase();
    // The editor has no h1 here — the rikma's name is the page title.
    if (tag === 'h1') tag = 'h2';
    if (tag === 'h4' || tag === 'h5' || tag === 'h6') tag = 'h3';
    if (tag === 'b') tag = 'strong';
    if (tag === 'i') tag = 'em';
    if (!ALLOWED.has(tag)) return '';
    if (close) return tag === 'br' ? '' : `</${tag}>`;
    if (tag === 'a') {
      const href = hrefOf(attrs);
      return href ? `<a href="${href}" rel="noopener noreferrer">` : '<a>';
    }
    return tag === 'br' ? '<br>' : `<${tag}>`;
  });

  // A lone "<" left by the model ("2 < 3") must not open a tag downstream.
  out = out.replace(/<(?!\/?(h2|h3|p|ul|ol|li|strong|em|u|s|a|br|blockquote)\b)/gi, '&lt;').trim();
  if (out.length <= max) return out;
  // Cut at the last closed block so the editor never gets half a tag.
  const cut = out.slice(0, max);
  const end = Math.max(
    ...['</p>', '</ul>', '</ol>', '</blockquote>'].map((e) => {
      const i = cut.lastIndexOf(e);
      return i < 0 ? -1 : i + e.length;
    })
  );
  return end > 0 ? cut.slice(0, end) : cut.replace(/<[^>]*$/, '');
}

/** Plain text with paragraphs → `<p>` blocks, for a model that ignored the HTML request. */
export function textToParagraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`)
    .join('');
}
