/**
 * `descriptionHtml` — HTML we *produce*, not HTML we pass along
 * (PLAN_HEADLESS_PRODUCTS_API §5.3, §12 #8).
 *
 * `Matanot.desc` holds whatever the rich-text editor saved, and a consumer site
 * will drop the field into `innerHTML` / `dangerouslySetInnerHTML`. Anything we
 * forward verbatim is therefore an XSS sink on somebody else's origin. So the
 * output is rebuilt, tag by tag, from an allow-list:
 *
 *   - an allowed tag is re-emitted **bare** (`<p>`, `</p>`) — no attribute of
 *     the source ever survives, so `style`, `on*`, `class` cannot ride along;
 *   - `<a>` is the one exception: its `href` is kept only when it is
 *     `http:`, `https:` or `mailto:` after entity-decoding and stripping
 *     whitespace/control characters (which is how `java\tscript:` is smuggled),
 *     and it always gets `rel="noopener nofollow ugc"`;
 *   - `script`, `style`, `iframe`, `object`, `embed`, `template`, `noscript`,
 *     `svg`, `math` are dropped **with their content**; every other unknown tag
 *     is dropped and its text kept;
 *   - text between tags is escaped (`<`, `>`), so a `<` that never closes
 *     cannot open a tag in the consumer's parser.
 *
 * It is a whitelist rebuild, not a filter: the question is never "is this
 * dangerous?" but "is this one of the dozen things a description may contain?".
 */

const ALLOWED = new Set([
  'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre', 'a'
]);
const VOID = new Set(['br', 'hr']);
const DROP_WITH_CONTENT = [
  'script', 'style', 'iframe', 'object', 'embed', 'template',
  'noscript', 'svg', 'math', 'textarea', 'title'
];

const DROP_BLOCKS = new RegExp(
  `<(${DROP_WITH_CONTENT.join('|')})\\b[\\s\\S]*?(?:<\\/\\1\\s*>|$)`,
  'gi'
);
const TAG = /<[^>]*>/g;
const TAG_PARTS = /^<\s*(\/)?\s*([a-zA-Z][a-zA-Z0-9]*)\b([\s\S]*?)\/?\s*>$/;
const HREF = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i;
const SAFE_SCHEME = /^(?:https?:|mailto:)/i;

function escapeText(text: string): string {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Enough decoding to see the scheme the browser will see. */
function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);?/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&colon;/gi, ':')
    .replace(/&tab;/gi, '\t')
    .replace(/&newline;/gi, '\n')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');
}

function safeHref(attrs: string): string | null {
  const m = HREF.exec(attrs);
  if (!m) return null;
  const decoded = decodeEntities(m[1] ?? m[2] ?? m[3] ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000- \u007f-\u009f]/g, '');
  return SAFE_SCHEME.test(decoded) ? decoded : null;
}

function rebuildTag(raw: string): string {
  const m = TAG_PARTS.exec(raw);
  if (!m) return '';
  const closing = !!m[1];
  const name = m[2].toLowerCase();
  if (!ALLOWED.has(name)) return '';
  if (closing) return VOID.has(name) ? '' : `</${name}>`;
  if (name === 'a') {
    const href = safeHref(m[3] ?? '');
    return href
      ? `<a href="${escapeAttr(href)}" rel="noopener nofollow ugc">`
      : '<a>';
  }
  return `<${name}>`;
}

/**
 * The description as safe HTML, or `null` when there is nothing to show.
 * Non-string input (a JSON blob, `null`) yields `null` — never `String(obj)`.
 */
export function sanitizeDescriptionHtml(html: unknown): string | null {
  if (typeof html !== 'string' || !html.trim()) return null;

  const source = html
    .replace(/<!--[\s\S]*?(?:-->|$)/g, '')
    .replace(DROP_BLOCKS, '');

  let out = '';
  let last = 0;
  for (const match of source.matchAll(TAG)) {
    out += escapeText(source.slice(last, match.index));
    out += rebuildTag(match[0]);
    last = (match.index ?? 0) + match[0].length;
  }
  out += escapeText(source.slice(last));

  return out.trim() ? out : null;
}
