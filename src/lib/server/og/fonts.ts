/**
 * Fonts for the share cards (PLAN_MARKETING_GLOBAL §4, loops 1 and 4).
 *
 * Rubik is the site's display font (tailwind `font-rubik`, the Google Fonts
 * link in app.html, the Remotion promo), so the card a link unfurls into looks
 * like the page it points at. The files come from `@fontsource/rubik` (OFL),
 * one per script: Google Fonts ships the family as subsets, and satori picks
 * fonts by family *name* — two subsets registered under the same name shadow
 * each other, so each subset gets its own alias and the card's `fontFamily`
 * lists them all. Satori then falls back per glyph.
 *
 * `?inline` makes Vite embed the files as data URLs in the server bundle:
 * no filesystem paths to resolve at runtime, so the same code runs under
 * `vite dev`, adapter-node in Docker, and the Vercel adapter alike.
 */
import latin400 from '@fontsource/rubik/files/rubik-latin-400-normal.woff?inline';
import latin700 from '@fontsource/rubik/files/rubik-latin-700-normal.woff?inline';
import latinExt400 from '@fontsource/rubik/files/rubik-latin-ext-400-normal.woff?inline';
import latinExt700 from '@fontsource/rubik/files/rubik-latin-ext-700-normal.woff?inline';
import hebrew400 from '@fontsource/rubik/files/rubik-hebrew-400-normal.woff?inline';
import hebrew700 from '@fontsource/rubik/files/rubik-hebrew-700-normal.woff?inline';
import arabic400 from '@fontsource/rubik/files/rubik-arabic-400-normal.woff?inline';
import arabic700 from '@fontsource/rubik/files/rubik-arabic-700-normal.woff?inline';
import cyrillic400 from '@fontsource/rubik/files/rubik-cyrillic-400-normal.woff?inline';
import cyrillic700 from '@fontsource/rubik/files/rubik-cyrillic-700-normal.woff?inline';

export type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: 'normal';
};

/** The family list every text node in a card uses, in fallback order. */
export const OG_FONT_FAMILY = 'Rubik, RubikExt, RubikHe, RubikAr, RubikCy';

function fromDataUrl(dataUrl: string): ArrayBuffer {
  const comma = dataUrl.indexOf(',');
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const buf = Buffer.from(b64, 'base64');
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

let cache: OgFont[] | null = null;

/** Decoded once per process; satori re-parses them per render, which is cheap. */
export function ogFonts(): OgFont[] {
  if (cache) return cache;
  const entries: Array<[string, string, string]> = [
    ['Rubik', latin400, latin700],
    ['RubikExt', latinExt400, latinExt700],
    ['RubikHe', hebrew400, hebrew700],
    ['RubikAr', arabic400, arabic700],
    ['RubikCy', cyrillic400, cyrillic700]
  ];
  cache = entries.flatMap(([name, regular, bold]) => [
    { name, data: fromDataUrl(regular), weight: 400 as const, style: 'normal' as const },
    { name, data: fromDataUrl(bold), weight: 700 as const, style: 'normal' as const }
  ]);
  return cache;
}
