/**
 * The picture of a rikma that the concierge opened for a wish.
 *
 * `materializeWish` creates the rikma without anyone choosing it a face, and a
 * rikma with no `profilePic` was exactly what crashed every timer view
 * (QA_CONCIERGE_E2E C-11). The customer may pick a picture; when they do not,
 * this builds one — the concierge medal over the one or two words that say what
 * the rikma is *for*, so a member's list of rikmas reads at a glance instead of
 * being a column of identical placeholders.
 *
 * Pure on purpose: the medal arrives as `medalHref` (a data URI in production)
 * so the layout can be tested and looked at without the server.
 */

/** Words that say nothing about the product — never the face of a rikma. */
const STOP_WORDS = new Set([
  // he
  'של', 'עם', 'את', 'על', 'אל', 'או', 'גם', 'לי', 'לנו', 'שלי', 'שלנו', 'כמו', 'בלי',
  // en
  'a', 'an', 'the', 'of', 'for', 'to', 'and', 'or', 'with', 'my', 'our', 'in', 'on', 'at',
  // es
  'un', 'una', 'el', 'la', 'los', 'las', 'de', 'del', 'para', 'con', 'y', 'mi',
  // ru
  'и', 'для', 'на', 'в', 'с', 'мой', 'моя', 'моё'
]);

/** Where a wish title stops naming the thing and starts explaining it. */
const TITLE_SPLIT = /[:：\-–—|/·•,،;.!?\n]/;

export const AVATAR_FALLBACK_WORD = 'קונסיירז׳';

/** Longest three-word phrase (spaces included) that is still allowed on the picture. */
const THREE_WORDS_MAX = 15;

/**
 * One or two words that name the product: the first two meaningful words of the
 * title's lead clause. "פינת עבודה ביתית: שולחן עץ בהתאמה אישית (בדיקה)" →
 * "פינת עבודה".
 */
export function avatarWords(title: string | null | undefined): string {
  const lead = String(title ?? '')
    .replace(/[(（\[][^)）\]]*[)）\]]/g, ' ') // (parenthetical notes)
    .split(TITLE_SPLIT)
    .map((part) => part.trim())
    .find((part) => part.length > 0);
  if (!lead) return AVATAR_FALLBACK_WORD;

  const words = lead
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w.toLowerCase()));
  if (words.length === 0) return AVATAR_FALLBACK_WORD;

  // A word or two — but "מסיבת יום" cut out of "מסיבת יום הולדת" says nothing,
  // so a third word rides along when the whole phrase still fits on one line.
  const third = words.slice(0, 3).join(' ');
  const taken = words.length >= 3 && third.length <= THREE_WORDS_MAX ? words.slice(0, 3) : words.slice(0, 2);

  // A very long single word is not a face: cut it rather than shrink to dust.
  return taken.map((w) => (w.length > 16 ? `${w.slice(0, 15)}…` : w)).join(' ');
}

const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const RTL = /[֐-ࣿ]/;

/** The picture, as an SVG document. */
export function buildRikmaAvatarSvg(opts: { words: string; medalHref: string }): string {
  const words = xmlEscape(opts.words.trim() || AVATAR_FALLBACK_WORD);
  const rtl = RTL.test(opts.words);
  // Stay inside the circle an avatar is cropped to: the text may be at most
  // ~330 units wide, so a longer phrase gets a smaller type rather than a clip.
  const size = Math.max(26, Math.min(56, Math.floor(330 / (Math.max(opts.words.length, 4) * 0.56))));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="${words}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="75%">
      <stop offset="0" stop-color="#2a2016"/>
      <stop offset="1" stop-color="#060606"/>
    </radialGradient>
    <clipPath id="medal"><circle cx="256" cy="212" r="148"/></clipPath>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <circle cx="256" cy="212" r="154" fill="none" stroke="#d4af37" stroke-opacity=".55" stroke-width="2"/>
  <image href="${opts.medalHref}" x="108" y="64" width="296" height="296" clip-path="url(#medal)" preserveAspectRatio="xMidYMid slice"/>
  <text x="256" y="430" text-anchor="middle" direction="${rtl ? 'rtl' : 'ltr'}" font-family="Heebo, 'Arial Hebrew', Arial, 'Noto Sans Hebrew', sans-serif" font-size="${size}" font-weight="700" fill="#f0d27a">${words}</text>
</svg>
`;
}
