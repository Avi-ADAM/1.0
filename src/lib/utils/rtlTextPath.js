// Helpers for rendering RTL (Hebrew/Arabic) text on an SVG <textPath>.
//
// WebKit (desktop Safari and every browser on iOS/iPadOS, since they are all
// WebKit under the hood) does NOT apply the Unicode bidirectional algorithm to
// text placed on an SVG <textPath>. RTL strings are therefore laid out in
// logical order and appear reversed. Chromium and Gecko reorder correctly,
// which is why curved names look fine everywhere except on iPhone/Safari.
//
// The practical workaround for this long-standing WebKit bug is to pre-reorder
// the RTL text into visual order ourselves and render it left-to-right, but
// ONLY on WebKit — on the browsers that already reorder correctly we must leave
// the logical string untouched, otherwise we would double-reverse it.

// Hebrew + Arabic blocks and their presentation forms.
const RTL_CHARS =
  /[֐-׿؀-ۿݐ-ݿיִ-ﭏﭐ-﷿ﹰ-﻿]/;
// Characters that form left-to-right runs which must keep their order even
// inside RTL text (latin letters, digits, and common identifier punctuation).
const LTR_RUN = /[A-Za-z0-9@#._/\\+-]/;

/** Does the string contain any RTL (Hebrew/Arabic) character? */
export function hasRtl(text) {
  return typeof text === 'string' && RTL_CHARS.test(text);
}

/**
 * True on WebKit-based browsers (Safari on any platform, and all iOS/iPadOS
 * browsers), which is where the <textPath> bidi bug lives. Returns false during
 * SSR (no navigator) so the server render keeps the logical string.
 *
 * The check mirrors the existing convention in this codebase: WebKit user
 * agents contain "Safari" but not "Chrome" (Chromium-based browsers add
 * "Chrome"/"Chromium"; iOS Chrome/Firefox report "CriOS"/"FxiOS" and still lack
 * "Chrome", so they are correctly treated as WebKit).
 */
export function isWebkitTextPathBidiBug() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1;
}

/**
 * Reorder a mostly-RTL string into visual (left-to-right) order so it can be
 * rendered without relying on the browser's bidi handling. Reverses the string
 * as a whole (correct for pure Hebrew/Arabic, including spaces and punctuation
 * between words) while preserving the internal order of embedded LTR runs such
 * as latin words or numbers.
 */
export function toVisualRtl(text) {
  if (typeof text !== 'string' || text.length === 0) return text;
  const chars = [...text].reverse();
  for (let i = 0; i < chars.length; ) {
    if (LTR_RUN.test(chars[i])) {
      let j = i;
      while (j < chars.length && LTR_RUN.test(chars[j])) j++;
      // The reverse above flipped this LTR run too; flip it back in place.
      const restored = chars.slice(i, j).reverse();
      for (let k = i; k < j; k++) chars[k] = restored[k - i];
      i = j;
    } else {
      i++;
    }
  }
  return chars.join('');
}
