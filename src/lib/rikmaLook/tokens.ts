/**
 * `RikmaLook` → CSS custom properties (docs/inprogress/PLAN_RIKMA_SUBDOMAINS.md §5.2).
 *
 * The only producer of CSS from a look. The public pages (`RikmaPage`, `/join`,
 * `/support`) paint their gold, their pink and their dark backdrop from a
 * handful of `--pp-*` properties whose defaults, set by `RikmaSkin`, are
 * byte-for-byte the colours those pages have always had. A look overrides
 * them on the one wrapper element — so it is a layer over the real pages,
 * never a second design.
 *
 * Every value here is built from numbers and closed lists — a colour we parsed
 * and re-serialised, a radius from a table, a font stack from a table — so
 * nothing a member typed is ever concatenated into a style.
 *
 * The pages are dark in every appearance (personal or business, light or
 * dark), so the readable shades are derived against that backdrop: the gold
 * stand-in is both a fill and text on these pages, and must read as text.
 */

import { contrast, hexToOklch, hexToRgb, oklchToHex, onFill, readableOn } from './color.js';
import type { Corners, Font, RikmaLook } from './look.js';

export interface SkinColors {
  /** Gold — headings, borders, the first door, the main buttons. */
  gold: string;
  /** A lighter gold for small text on the dark page (chips). */
  goldSoft: string;
  /** The two darker stops of a gold button's gradient. */
  gold2: string;
  gold3: string;
  /** Text on a gold fill. */
  onGold: string;
  /** Pink — the second door, second headings, the pink buttons. */
  barbi: string;
  /** A lighter pink for small text on the dark page (chips). */
  barbiSoft: string;
  barbi2: string;
  onBarbi: string;
  /** The page's backdrop gradient. */
  bg1: string;
  bg2: string;
  bg3: string;
}

/** What the pages have always painted. The defaults in `RikmaSkin` are these. */
export const CLASSIC_SKIN: SkinColors = {
  gold: '#ffd700',
  goldSoft: '#ffe36e',
  gold2: '#d4af37',
  gold3: '#b8860b',
  onGold: '#000000',
  barbi: '#ff00ae',
  barbiSoft: '#ff8ad8',
  barbi2: '#be185d',
  onBarbi: '#ffffff',
  bg1: '#1a0515',
  bg2: '#2c0b1e',
  bg3: '#120f26'
};

/** Font families. Each also falls back per glyph — Arabic or Cyrillic a face lacks still renders. */
export const FONT_STACKS: Record<Font, string> = {
  default: 'inherit',
  rubik: "'Rubik', system-ui, sans-serif",
  heebo: "'Heebo', 'Rubik', system-ui, sans-serif",
  assistant: "'Assistant', 'Rubik', system-ui, sans-serif",
  noto: "'Noto Sans Hebrew', 'Noto Sans Arabic', 'Noto Sans', system-ui, sans-serif",
  frank: "'Frank Ruhl Libre', 'Noto Serif Hebrew', Georgia, serif",
  secular: "'Secular One', 'Rubik', system-ui, sans-serif"
};

/** Google Fonts family query for each face (Rubik is already loaded by app.html). */
export const FONT_FAMILIES: Record<Font, string | null> = {
  default: null,
  rubik: null,
  heebo: 'Heebo:wght@400;500;700;800',
  assistant: 'Assistant:wght@400;600;800',
  noto: 'Noto+Sans+Hebrew:wght@400;700&family=Noto+Sans+Arabic:wght@400;700&family=Noto+Sans:wght@400;700',
  frank: 'Frank+Ruhl+Libre:wght@400;700;900',
  secular: 'Secular+One'
};

/** One stylesheet URL for the faces a look uses, or null when none needs loading. */
export function fontHref(look: RikmaLook | null): string | null {
  if (!look) return null;
  const families = [...new Set([look.style.font, look.style.headingFont])]
    .map((f) => FONT_FAMILIES[f])
    .filter(Boolean);
  return families.length
    ? `https://fonts.googleapis.com/css2?family=${families.join('&family=')}&display=swap`
    : null;
}

/** Panel / door radius. `round` is what the pages have always used, so it sets nothing. */
const RADIUS: Record<Corners, string | null> = {
  round: null,
  soft: '0.6rem',
  sharp: '0.15rem'
};

/** A `rgba(255,255,255,a)` glass panel laid over `bg`, as an opaque colour. */
export function glassOver(bg: string, a = 0.06): string {
  const [r, g, b] = hexToRgb(bg);
  const mix = (v: number) => v + (1 - v) * a;
  const to = (v: number) =>
    Math.round(mix(v) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** Every surface text sits on: the three backdrop stops and a glass panel over the lightest. */
export const surfacesOf = (s: SkinColors) => [s.bg1, s.bg2, s.bg3, glassOver(s.bg2, 0.08)];

/** A fill and the darker stops that keep `on` readable across the whole gradient. */
function fillStops(fill: string) {
  const on = onFill(fill);
  const { l, c, h } = hexToOklch(fill);
  const step = on === '#000000' ? -1 : 1;
  return {
    on,
    stop2: readableOn({ l: l + step * 0.07, c, h }, [on], 4.5),
    stop3: readableOn({ l: l + step * 0.14, c, h }, [on], 4.5)
  };
}

/** The skin's colours. A look with no colour of its own keeps the platform's. */
export function skinColors(look: RikmaLook | null): SkinColors {
  const hue = look?.style.hue ?? null;
  const hue2 = look?.style.hue2 ?? null;
  if (!hue && !hue2) return CLASSIC_SKIN;

  // A rikma colour tints the dark backdrop too — barely, so white text keeps
  // well above 7:1 — or the page would still read as the platform's gold-on-plum.
  let bg = { bg1: CLASSIC_SKIN.bg1, bg2: CLASSIC_SKIN.bg2, bg3: CLASSIC_SKIN.bg3 };
  if (hue) {
    const a = hexToOklch(hue);
    const b = hexToOklch(hue2 ?? hue);
    const ca = Math.min(a.c, 0.16) * 0.45;
    const cb = Math.min(b.c, 0.16) * 0.45;
    bg = {
      bg1: oklchToHex({ l: 0.17, c: ca, h: a.h }),
      bg2: oklchToHex({ l: 0.21, c: ca, h: a.h }),
      bg3: oklchToHex({ l: 0.16, c: cb, h: b.h })
    };
  }
  const surfaces = surfacesOf({ ...CLASSIC_SKIN, ...bg });

  let gold = CLASSIC_SKIN;
  if (hue) {
    const g = readableOn(hue, surfaces, 4.5);
    const o = hexToOklch(g);
    const stops = fillStops(g);
    gold = {
      ...gold,
      gold: g,
      goldSoft: readableOn({ l: Math.min(0.95, o.l + 0.08), c: o.c * 0.75, h: o.h }, surfaces, 4.5),
      gold2: stops.stop2,
      gold3: stops.stop3,
      onGold: stops.on
    };
  }

  let pink = CLASSIC_SKIN;
  if (hue2) {
    const p = readableOn(hue2, surfaces, 4.5);
    const o = hexToOklch(p);
    const stops = fillStops(p);
    pink = {
      ...pink,
      barbi: p,
      barbiSoft: readableOn({ l: Math.min(0.95, o.l + 0.1), c: o.c * 0.7, h: o.h }, surfaces, 4.5),
      barbi2: stops.stop2,
      onBarbi: stops.on
    };
  }

  return {
    gold: gold.gold,
    goldSoft: gold.goldSoft,
    gold2: gold.gold2,
    gold3: gold.gold3,
    onGold: gold.onGold,
    barbi: pink.barbi,
    barbiSoft: pink.barbiSoft,
    barbi2: pink.barbi2,
    onBarbi: pink.onBarbi,
    ...bg
  };
}

/** `#rrggbb` → `r g b`, the form `rgb(var(--x) / a)` needs. */
const channels = (hex: string) =>
  hexToRgb(hex)
    .map((v) => Math.round(v * 255))
    .join(' ');

/**
 * The `style` attribute for `RikmaSkin`'s wrapper, or '' without a look — then
 * the wrapper's own defaults (today's colours) apply.
 *
 * Besides the `--pp-*` set, a rikma colour also re-points the app's own
 * `--gold` / `--barbi-pink` (and their channel forms, which Tailwind's
 * `text-gold`, `from-gold`, `bg-barbi/20` read) inside the wrapper, so shared
 * components on the page — a `Tile`, a chip — follow it too.
 */
export function skinVars(look: RikmaLook | null): string {
  if (!look) return '';
  const s = skinColors(look);
  const parts: string[] = [];
  if (look.style.hue) {
    parts.push(
      `--pp-gold:${channels(s.gold)}`,
      `--pp-gold-soft:${channels(s.goldSoft)}`,
      `--pp-gold-2:${channels(s.gold2)}`,
      `--pp-gold-3:${channels(s.gold3)}`,
      `--pp-on-gold:${channels(s.onGold)}`,
      `--pp-bg1:${s.bg1}`,
      `--pp-bg2:${s.bg2}`,
      `--pp-bg3:${s.bg3}`,
      `--gold-rgb:${channels(s.gold)}`,
      `--gold:${s.gold}`,
      `--gold-l:${s.goldSoft}`
    );
  }
  if (look.style.hue2) {
    parts.push(
      `--pp-barbi:${channels(s.barbi)}`,
      `--pp-barbi-soft:${channels(s.barbiSoft)}`,
      `--pp-barbi-2:${channels(s.barbi2)}`,
      `--pp-on-barbi:${channels(s.onBarbi)}`,
      `--barbi-pink-rgb:${channels(s.barbi)}`,
      `--barbi-pink:${s.barbi}`
    );
  }
  const radius = RADIUS[look.style.corners];
  if (radius) parts.push(`--pp-radius:${radius}`);
  if (look.style.font !== 'default') parts.push(`--pp-font:${FONT_STACKS[look.style.font]}`);
  if (look.style.headingFont !== 'default') {
    parts.push(`--pp-heading-font:${FONT_STACKS[look.style.headingFont]}`);
  }
  return parts.join(';');
}

/** For the editor: how the chosen colour reads as text before we adjust it. */
export function rawTextContrast(hex: string): number {
  return Math.min(...surfacesOf(CLASSIC_SKIN).map((bg) => contrast(hex, bg)));
}
