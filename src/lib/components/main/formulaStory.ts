/**
 * formulaStory.ts — the data and the clock behind the homepage's
 * `FormulaStory.svelte`, with no DOM in it.
 *
 * The animation says one thing: every contribution is **a quantity times an
 * agreed value**, and all of them land in the same pile. An oven is 1 × its
 * price, rent is months × the monthly rent, work is hours × the hourly rate.
 * The pile is the rikma's value, and a partner's part of the pile is their part
 * of every sale.
 *
 * An "example" is therefore only a skin: icons and numbers over a fixed motion.
 * Captions never name the bakery, so a new example costs one translated label
 * (its chip) and nothing else.
 *
 * Everything on screen is derived from a single `time` in ms, so the component
 * can scrub, jump to a step, or render a still frame (reduced motion, SSR,
 * no-JS) without a second code path.
 */

export type RowKind = 'once' | 'monthly' | 'hours';
export type IconName =
  | 'oven'
  | 'home'
  | 'bolt'
  | 'clock'
  | 'box'
  | 'calendar'
  | 'laptop'
  | 'cloud'
  | 'table';

export interface Row {
  /** 0..2 — which of the three partners brings it. */
  partner: number;
  kind: RowKind;
  icon: IconName;
  qty: number;
  rate: number;
}

export interface Example {
  id: string;
  /** Rows in the order they land. The **last** row is the negotiated one. */
  rows: Row[];
  /** The hourly rate goes proposal → counter → agreed (= last row's rate). */
  nego: [number, number];
  /** The price goes rikma's ask → customer's counter → agreed (= sale). */
  priceNego: [number, number];
  sale: number;
}

/** One cube in the pile is this much value. */
export const CUBE_VALUE = 500;

const BAKERY_ROWS: Row[] = [
  { partner: 0, kind: 'once', icon: 'oven', qty: 1, rate: 8500 },
  { partner: 0, kind: 'hours', icon: 'clock', qty: 40, rate: 100 },
  { partner: 1, kind: 'monthly', icon: 'home', qty: 3, rate: 2000 },
  { partner: 1, kind: 'monthly', icon: 'bolt', qty: 3, rate: 500 },
  { partner: 2, kind: 'hours', icon: 'clock', qty: 50, rate: 100 }
];

/** The icon a row falls back to when no concrete example is shown. */
export const KIND_ICON: Record<RowKind, IconName> = {
  once: 'box',
  monthly: 'calendar',
  hours: 'clock'
};

export const EXAMPLES: Example[] = [
  { id: 'bakery', rows: BAKERY_ROWS, nego: [110, 90], priceNego: [1100, 900], sale: 1000 },
  {
    // A laptop, an office, servers, and two people writing code: 40 / 35 / 25.
    id: 'studio',
    rows: [
      { partner: 0, kind: 'once', icon: 'laptop', qty: 1, rate: 4500 },
      { partner: 0, kind: 'hours', icon: 'clock', qty: 50, rate: 150 },
      { partner: 1, kind: 'monthly', icon: 'home', qty: 3, rate: 2500 },
      { partner: 1, kind: 'monthly', icon: 'cloud', qty: 3, rate: 1000 },
      { partner: 2, kind: 'hours', icon: 'clock', qty: 50, rate: 150 }
    ],
    nego: [180, 130],
    priceNego: [2400, 1800],
    sale: 2000
  },
  {
    // A treatment table, a rented room with its bills, and two therapists: 44 / 32 / 24.
    id: 'clinic',
    rows: [
      { partner: 0, kind: 'once', icon: 'table', qty: 1, rate: 5000 },
      { partner: 0, kind: 'hours', icon: 'clock', qty: 30, rate: 200 },
      { partner: 1, kind: 'monthly', icon: 'home', qty: 4, rate: 1500 },
      { partner: 1, kind: 'monthly', icon: 'bolt', qty: 4, rate: 500 },
      { partner: 2, kind: 'hours', icon: 'clock', qty: 30, rate: 200 }
    ],
    nego: [240, 180],
    priceNego: [600, 450],
    sale: 500
  },
  {
    // "Just the formula": the same motion with the concrete objects taken away.
    id: 'formula',
    rows: BAKERY_ROWS.map((row) => ({ ...row, icon: KIND_ICON[row.kind] })),
    nego: [110, 90],
    priceNego: [1100, 900],
    sale: 1000
  }
];

/* --- the arithmetic ------------------------------------------------------ */

export const rowValue = (row: Row) => row.qty * row.rate;

export function totals(example: Example) {
  const perPartner = [0, 0, 0];
  for (const row of example.rows) perPartner[row.partner] += rowValue(row);
  const total = perPartner.reduce((sum, value) => sum + value, 0);
  const shares = perPartner.map((value) => (total ? value / total : 0));
  return {
    perPartner,
    total,
    shares,
    payouts: shares.map((share) => Math.round(share * example.sale))
  };
}

/* --- the clock ----------------------------------------------------------- */

/** 0 salary · 1 contributions · 2 ping-pong · 3 value → shares · 4 customer. */
export const SCENE_MS = [3600, 9200, 6800, 5200, 7600];
export const SCENE_COUNT = SCENE_MS.length;
export const SCENE_START = SCENE_MS.map((_, i) =>
  SCENE_MS.slice(0, i).reduce((sum, ms) => sum + ms, 0)
);
export const TOTAL_MS = SCENE_MS.reduce((sum, ms) => sum + ms, 0);

/**
 * Story-ms per real ms. Everything above is written at the pace that reads
 * well to someone who already knows the model; a first-time viewer needs
 * longer on every beat, so the whole clock runs slower rather than each
 * number being retuned. 0.62 puts the story at about 52 seconds.
 */
export const PLAYBACK_RATE = 0.62;

/** How long one contributed row owns the equation line in scene 1. */
export const ROW_MS = 2300;
/** In scene 2 the agreed row's cubes start falling this far in. */
export const NEGO_DROP_AT = 4400;

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
/** Progress of `time` through [from, to], clamped to 0..1. */
export const span = (time: number, from: number, to: number) =>
  clamp01((time - from) / (to - from));
export const easeOut = (p: number) => 1 - (1 - p) ** 3;
export const easeIn = (p: number) => p * p;
export const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
export const lerp = (from: number, to: number, p: number) => from + (to - from) * p;

export function sceneAt(time: number) {
  const t = Math.min(Math.max(time, 0), TOTAL_MS);
  let index = SCENE_COUNT - 1;
  for (let i = 0; i < SCENE_COUNT; i++) {
    if (t < SCENE_START[i] + SCENE_MS[i]) {
      index = i;
      break;
    }
  }
  return { index, local: t - SCENE_START[index] };
}

/** Absolute time at which row `i` of the example takes the equation line. */
export function rowStart(example: Example, i: number) {
  return i < example.rows.length - 1
    ? SCENE_START[1] + i * ROW_MS
    : SCENE_START[2] + NEGO_DROP_AT - 500;
}

/* --- the pile ------------------------------------------------------------ */

export const PILE = { cols: 10, cell: 24, size: 20, left: 60, bottom: 316 };

export interface Cube {
  partner: number;
  row: number;
  /** Top-left corner of the cube's resting slot. */
  x: number;
  y: number;
  /** Absolute ms at which it starts to fall. */
  t0: number;
}

export const CUBE_FALL_MS = 520;

/**
 * Every cube with its slot and its moment. Slots fill bottom-up in row order,
 * so each partner's colour stays one block. A `monthly` row drops in one burst
 * per month — that is what makes rent read as "again every month" rather than
 * as a purchase.
 */
export function buildCubes(example: Example): Cube[] {
  const cubes: Cube[] = [];
  let slot = 0;
  example.rows.forEach((row, rowIndex) => {
    const count = Math.round(rowValue(row) / CUBE_VALUE);
    const start = rowStart(example, rowIndex) + 500;
    for (let j = 0; j < count; j++) {
      let offset: number;
      if (row.kind === 'monthly') {
        const perMonth = count / row.qty;
        const month = Math.floor(j / perMonth);
        offset = month * (1150 / row.qty) + (j % perMonth) * 45;
      } else {
        offset = (j / count) * 1000;
      }
      const col = slot % PILE.cols;
      const line = Math.floor(slot / PILE.cols);
      cubes.push({
        partner: row.partner,
        row: rowIndex,
        x: PILE.left + col * PILE.cell + (PILE.cell - PILE.size) / 2,
        y: PILE.bottom - (line + 1) * PILE.cell + (PILE.cell - PILE.size) / 2,
        t0: start + offset
      });
      slot++;
    }
  });
  return cubes;
}

/* --- the ring ------------------------------------------------------------ */

export interface Arc {
  partner: number;
  share: number;
  /** Start and length as fractions of the full turn, starting at 12 o'clock. */
  from: number;
  length: number;
  /** Mid-angle in radians, for placing the percentage beside the arc. */
  mid: number;
}

export function buildArcs(example: Example): Arc[] {
  const { shares } = totals(example);
  let from = 0;
  return shares.map((share, partner) => {
    const arc = {
      partner,
      share,
      from,
      length: share,
      mid: (from + share / 2) * Math.PI * 2 - Math.PI / 2
    };
    from += share;
    return arc;
  });
}
