/**
 * Colour math for rikma looks: sRGB ⇄ OKLCH and WCAG 2 contrast.
 *
 * The brand colour a rikma picks is used **exactly** where it is a fill
 * (buttons, the hero band) — with white or black text, whichever reads; one of
 * the two always clears 4.5:1. Where the colour has to be *text* on the page
 * surface, its lightness is moved in OKLCH (hue and as much chroma as the gamut
 * allows are kept) until it clears the bar. The same idea LevRow uses for its
 * ink; here it is the only route a chosen colour has onto the page.
 */

export interface Oklch {
  l: number;
  c: number;
  h: number;
}

type Rgb = [number, number, number];

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function rgbToHex([r, g, b]: Rgb): string {
  const to = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const c = Math.hypot(A, B);
  const h = ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return { l: L, c, h };
}

/** Linear sRGB, possibly out of [0,1]. */
function oklchToLinear({ l, c, h }: Oklch): Rgb {
  const hr = (h * Math.PI) / 180;
  const A = c * Math.cos(hr);
  const B = c * Math.sin(hr);
  const l_ = l + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = l - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = l - 0.0894841775 * A - 1.291485548 * B;
  const L3 = l_ ** 3;
  const M3 = m_ ** 3;
  const S3 = s_ ** 3;
  return [
    4.0767416621 * L3 - 3.3077115913 * M3 + 0.2309699292 * S3,
    -1.2684380046 * L3 + 2.6097574011 * M3 - 0.3413193965 * S3,
    -0.0041960863 * L3 - 0.7034186147 * M3 + 1.70769566 * S3
  ];
}

const inGamut = (rgb: Rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/** OKLCH → hex, giving up chroma (never lightness or hue) until it fits sRGB. */
export function oklchToHex(color: Oklch): string {
  const l = Math.min(1, Math.max(0, color.l));
  let lo = 0;
  let hi = color.c;
  if (!inGamut(oklchToLinear({ l, c: hi, h: color.h }))) {
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear({ l, c: mid, h: color.h }))) lo = mid;
      else hi = mid;
    }
    hi = lo;
  }
  return rgbToHex(oklchToLinear({ l, c: hi, h: color.h }).map(toGamma) as Rgb);
}

/** WCAG 2 relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** White or black, whichever reads better on `fill`. Always ≥ 4.58:1. */
export function onFill(fill: string): '#ffffff' | '#000000' {
  return contrast(fill, '#ffffff') >= contrast(fill, '#000000') ? '#ffffff' : '#000000';
}

/**
 * The colour closest to `want` (same hue, as much of its chroma as fits) that
 * reads at `min`:1 against **every** background in `on`. Lightness walks away
 * from the backgrounds — darker on a light page, lighter on a dark one.
 */
export function readableOn(want: Oklch | string, on: string[], min = 4.5): string {
  const base = typeof want === 'string' ? hexToOklch(want) : want;
  const ok = (hex: string) => on.every((bg) => contrast(hex, bg) >= min);
  const first = oklchToHex(base);
  if (ok(first)) return first;

  const avgBg = on.reduce((s, bg) => s + luminance(bg), 0) / on.length;
  const darker = avgBg > 0.18;
  for (let step = 1; step <= 100; step++) {
    const l = darker ? base.l - step * 0.01 : base.l + step * 0.01;
    if (l < 0 || l > 1) break;
    const hex = oklchToHex({ ...base, l });
    if (ok(hex)) return hex;
  }
  return darker ? '#000000' : '#ffffff';
}
