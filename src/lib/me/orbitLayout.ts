/**
 * orbitLayout — where the profile page's circles sit around the badge.
 *
 * `/me` is the member's badge (wreath, avatar, name, diamond) with everything
 * else they have orbiting it as large circles, the way the heart's coin view
 * orbits the heart. Each circle holds a whole list — skills, rikmas, products —
 * so it has to be big enough to read: a circle is a hostile text box, and one
 * under ~170px holds a title and nothing else.
 *
 * So this module answers one question for a given viewport: can every circle
 * fit around the badge at a readable size *without scrolling*? If yes it
 * returns the positions (`mode: 'orbit'`); if not it says so (`mode: 'stack'`)
 * and the page lays the circles out in a scrolling honeycomb under the badge
 * instead. Shrinking circles until they fit a short screen is the failure this
 * replaced — it is exactly how the old tiles ended up unreadable.
 *
 * The geometry: the badge stands in the middle; the circles split into two
 * side blocks, the first half on the reading-start side. Each block is a
 * hexagonal (honeycomb) lattice of 1–3 columns — whichever gives the biggest
 * circle — so neighbours sit exactly one diameter-plus-gap apart diagonally.
 *
 * Pure and DOM-free, so `orbitLayout.test.ts` can assert the packing directly.
 */

/** ProfileBadge draws in a 500×700 viewBox. */
export const BADGE_ASPECT = 5 / 7;

/** Vertical pitch of a hex lattice, as a fraction of the horizontal pitch. */
const HEX_ROW = Math.sqrt(3) / 2;

export interface OrbitOptions {
  /** The field's size in px — the whole viewport. */
  width: number;
  height: number;
  /**
   * Height kept clear at the bottom of the *centre column* only: the footer
   * bar is a pill in the middle of the screen, so the side blocks may run all
   * the way down past it while the badge has to stop above it.
   */
  reserveBottom?: number;
  /** How many circles orbit the badge. */
  count: number;
  /** Reading direction: the first circles go on the start side. */
  rtl?: boolean;
  /** Space between circles, and between a circle and the field's edge. */
  gap?: number;
  /** Below this diameter a circle cannot be read — stack instead. */
  minOrb?: number;
  /** Above this a circle stops gaining anything and starts looking empty. */
  maxOrb?: number;
}

export interface OrbitPoint {
  x: number;
  y: number;
}

export interface OrbitLayout {
  mode: 'orbit';
  /** Circle diameter, the same for every circle. */
  size: number;
  /** The badge's box — top-left corner and size. */
  center: { x: number; y: number; w: number; h: number };
  /** Each circle's centre, in input order. */
  orbs: OrbitPoint[];
}

export interface StackLayout {
  mode: 'stack';
}

interface Block {
  d: number;
  cols: number;
  rows: number;
}

/**
 * The largest circle a block of `k` circles can use inside `sideW × availH`,
 * trying 1–3 columns. With more than one column and more than one row the
 * block is a hex lattice: odd rows shift half a pitch, rows close up to
 * `√3/2` of a pitch.
 */
function bestBlock(k: number, sideW: number, availH: number, g: number): Block {
  let best: Block = { d: 0, cols: 1, rows: k };
  if (k <= 0) return best;
  for (let cols = 1; cols <= Math.min(3, k); cols++) {
    const rows = Math.ceil(k / cols);
    const hex = cols > 1 && rows > 1;
    const f = hex ? HEX_ROW : 1;
    const byWidth = hex
      ? (sideW - g * (cols - 0.5)) / (cols + 0.5)
      : (sideW - g * (cols - 1)) / cols;
    const byHeight = (availH - (rows - 1) * f * g) / (1 + (rows - 1) * f);
    const d = Math.min(byWidth, byHeight);
    if (d > best.d) best = { d, cols, rows };
  }
  return best;
}

/**
 * Lattice positions for `k` circles, top-left at (0,0), in reading order for
 * the *start* side before any mirroring. Returns the block's own size too.
 */
function latticeOf(k: number, { cols, rows }: Block, d: number, g: number) {
  const pitch = d + g;
  const hex = cols > 1 && rows > 1;
  const rowPitch = hex ? pitch * HEX_ROW : pitch;
  const pts: OrbitPoint[] = [];
  for (let r = 0; r < rows; r++) {
    const inRow = Math.min(cols, k - r * cols);
    // An incomplete row moves to the outer edge (high x is away from the
    // badge on both sides): the inner bottom corner is where the footer bar
    // sits. Whole pitches keep it on the lattice — centring by half a pitch
    // would put it straight under a circle of the shifted row above.
    const skip = cols - inRow;
    const shift = hex && r % 2 === 1 ? pitch / 2 : 0;
    for (let j = 0; j < inRow; j++) {
      pts.push({
        x: d / 2 + shift + (skip + j) * pitch,
        y: d / 2 + r * rowPitch
      });
    }
  }
  const w = (cols - 1) * pitch + d + (hex ? pitch / 2 : 0);
  const h = (rows - 1) * rowPitch + d;
  return { pts, w, h };
}

/**
 * Lay `count` circles around the badge, or say that they do not fit.
 *
 * The badge is tried at a few scales, largest first (never below 80% — it is
 * the page's centre, not a thumbnail): on a roomy screen the
 * badge keeps its full height, on a tighter one it gives up some height so the
 * circles can grow — but only as far as `maxOrb`, never past readability.
 */
export function layoutOrbit(options: OrbitOptions): OrbitLayout | StackLayout {
  const {
    width,
    height,
    count,
    reserveBottom = 0,
    rtl = true,
    minOrb = 160,
    maxOrb = 250
  } = options;
  const g = options.gap ?? Math.max(10, Math.min(20, Math.min(width, height) * 0.02));
  if (count <= 0 || width <= 0 || height <= 0) return { mode: 'stack' };

  const availH = height - 2 * g;
  // The badge stops above the footer bar; the side blocks do not have to.
  const centerH = height - reserveBottom - 2 * g;
  if (centerH <= 0) return { mode: 'stack' };
  const startCount = Math.ceil(count / 2);
  const endCount = count - startCount;

  let chosen: { d: number; w: number; h: number; start: Block; end: Block } | null = null;
  for (const scale of [1, 0.9, 0.8]) {
    let h = centerH * scale;
    let w = h * BADGE_ASPECT;
    const maxW = width * 0.34;
    if (w > maxW) {
      w = maxW;
      h = w / BADGE_ASPECT;
    }
    const sideW = (width - w) / 2 - 2 * g;
    if (sideW <= 0) continue;
    const start = bestBlock(startCount, sideW, availH, g);
    const end = bestBlock(endCount, sideW, availH, g);
    const d = Math.min(maxOrb, start.d, endCount > 0 ? end.d : Infinity);
    // Strictly larger only: on a tie the bigger badge wins.
    if (!chosen || d > chosen.d + 0.5) chosen = { d, w, h, start, end };
    if (d >= maxOrb) break;
  }
  if (!chosen || chosen.d < minOrb) return { mode: 'stack' };

  const d = Math.floor(chosen.d);
  const { w, h } = chosen;
  const cx = width / 2;
  const center = { x: cx - w / 2, y: (height - reserveBottom - h) / 2, w, h };

  /** Place one side's block centred in its half, mirrored for the left. */
  const side = (k: number, block: Block, onRight: boolean): OrbitPoint[] => {
    if (k <= 0) return [];
    const lat = latticeOf(k, block, d, g);
    const regionStart = onRight ? cx + w / 2 + g : g;
    const regionEnd = onRight ? width - g : cx - w / 2 - g;
    const left = regionStart + (regionEnd - regionStart - lat.w) / 2;
    const top = (height - lat.h) / 2;
    const pts = lat.pts.map((p) => ({
      x: onRight ? left + p.x : left + (lat.w - p.x),
      y: top + p.y
    }));
    // Reading order inside each row: right-to-left in RTL, else left-to-right.
    return pts.sort((a, b) =>
      Math.abs(a.y - b.y) > 1 ? a.y - b.y : rtl ? b.x - a.x : a.x - b.x
    );
  };

  const startOnRight = rtl;
  const orbs = [
    ...side(startCount, chosen.start, startOnRight),
    ...side(endCount, chosen.end, !startOnRight)
  ];
  return { mode: 'orbit', size: d, center, orbs };
}
