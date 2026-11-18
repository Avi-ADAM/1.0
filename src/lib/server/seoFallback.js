/**
 * Site-wide head fallbacks, emitted only for what the page left undeclared.
 *
 * app.html used to carry the fallbacks as literal tags after the page's own
 * head, on the theory that "the first tag wins". It does for Google, but the
 * Facebook scraper (which also feeds WhatsApp's link previews) takes the LAST
 * og:title / og:description it meets — so every page that set its own share
 * card still previewed as the homepage. A head must carry each tag once.
 *
 * Twitter's title/description follow the page's og/title when the page has
 * them, so a page that declares only og:* does not get the homepage's text on
 * X either.
 */

/** @param {string} s */
const attr = (s) => s.replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, '&amp;').replace(/"/g, '&quot;');

/**
 * Value of the first meta tag with `key="name"` in the head, or null.
 * @param {string} head
 * @param {'property'|'name'} key
 * @param {string} name
 */
export function readMeta(head, key, name) {
  const tagRe = /<meta\b[^>]*>/gi;
  const keyRe = new RegExp(`\\b${key}\\s*=\\s*["']${name.replace(/[.:]/g, '\\$&')}["']`, 'i');
  for (const m of head.matchAll(tagRe)) {
    if (!keyRe.test(m[0])) continue;
    const c = m[0].match(/\bcontent\s*=\s*"([^"]*)"|\bcontent\s*=\s*'([^']*)'/i);
    return c ? (c[1] ?? c[2] ?? '') : '';
  }
  return null;
}

/** @param {string} head */
function readTitle(head) {
  const m = head.match(/<title\b[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim() : null;
}

/** @param {string} head */
const hasCanonical = (head) => /<link\b[^>]*\brel\s*=\s*["']canonical["']/i.test(head);

/**
 * @param {string} head  the rendered head so far (everything before the slot)
 * @param {{ title: string, desc: string, canonical: string, image: string }} d
 *   site defaults; already plain text (escaped here)
 * @returns {string} the tags to put in the fallback slot
 */
export function buildSeoFallbacks(head, d) {
  const out = [];
  const pageTitle = readTitle(head);
  const pageDesc = readMeta(head, 'name', 'description');
  const ogTitle = readMeta(head, 'property', 'og:title');
  const ogDesc = readMeta(head, 'property', 'og:description');
  const ogImage = readMeta(head, 'property', 'og:image');

  if (!hasCanonical(head)) out.push(`<link rel="canonical" href="${attr(d.canonical)}" />`);
  if (pageTitle == null) out.push(`<title>${attr(d.title)}</title>`);
  if (pageDesc == null) out.push(`<meta name="description" content="${attr(d.desc)}">`);

  // Raw page values are already HTML-escaped (attribute content); the title is
  // text content, so only its quotes need escaping to sit in an attribute.
  const shareTitle = ogTitle ?? (pageTitle != null ? attr(pageTitle) : attr(d.title));
  const shareDesc = ogDesc ?? pageDesc ?? attr(d.desc);
  const shareImage = ogImage ?? attr(d.image);

  if (ogTitle == null) out.push(`<meta property="og:title" content="${shareTitle}" />`);
  if (ogDesc == null) out.push(`<meta property="og:description" content="${shareDesc}" />`);
  if (ogImage == null) out.push(`<meta property="og:image" content="${shareImage}" />`);
  if (readMeta(head, 'name', 'twitter:title') == null)
    out.push(`<meta name="twitter:title" content="${shareTitle}">`);
  if (readMeta(head, 'name', 'twitter:description') == null)
    out.push(`<meta name="twitter:description" content="${shareDesc}">`);
  if (readMeta(head, 'name', 'twitter:image') == null)
    out.push(`<meta name="twitter:image" content="${shareImage}">`);

  return out.map((t) => `    ${t}`).join('\n');
}
