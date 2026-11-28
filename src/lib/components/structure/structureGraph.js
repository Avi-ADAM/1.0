/**
 * The shape of /structure's map: which boxes exist, where they sit, which
 * arrows join them, and the two stories that walk across it.
 *
 * Pure data, so a test can hold the stories to the boxes and the translations
 * to the keys without rendering anything.
 *
 * Coordinates are in a 100 × VIEW_H box, measured from the START edge (left in
 * LTR, right in RTL). Boxes are placed with `inset-inline-start`, so they
 * mirror by themselves; the arrows are one SVG flipped with `scaleX(-1)` under
 * RTL, so they land on the same boxes in both directions.
 *
 * The layout reads top to bottom, because that is the only direction that
 * fits a phone: the two ways in at the top (founder at the start side,
 * customer at the end side), the rikma in the middle, what it is made of below
 * it, and the split at the foot, with one arrow running back up to the rikma
 * because the circle does not end there.
 */

/** Height of the drawing box; the width is 100. */
export const VIEW_H = 122;

/** Half a box's height, in the same units. */
export const HALF_H = 6;

/**
 * @typedef {{
 *   key: string,
 *   icon: import('$lib/celim/icons/entityIcons').EntityIconKind,
 *   x: number,
 *   y: number,
 *   w: number,
 *   entry?: boolean,
 *   people?: ('a' | 'b')[]
 * }} MapNode
 */

/**
 * `people` carries the partnership itself onto the map: partner A takes the
 * mission, partner B brings the resource, and both colours meet again in the
 * contribution and in the split - two people, no boss, each paid by what they
 * gave.
 * @type {MapNode[]}
 */
export const NODES = [
  { key: 'founder', icon: 'opportunity', x: 20, y: 8, w: 26, entry: true },
  { key: 'customer', icon: 'person', x: 80, y: 8, w: 26, entry: true },
  { key: 'dream', icon: 'wish', x: 20, y: 26, w: 26 },
  { key: 'wish', icon: 'concierge', x: 80, y: 26, w: 26 },
  { key: 'rikma', icon: 'rikma', x: 50, y: 46, w: 36 },
  { key: 'mission', icon: 'mission', x: 19, y: 68, w: 26, entry: true, people: ['a'] },
  { key: 'resource', icon: 'resource', x: 50, y: 68, w: 26, people: ['b'] },
  { key: 'product', icon: 'product', x: 81, y: 68, w: 26 },
  { key: 'contribution', icon: 'offerings', x: 33, y: 90, w: 28, people: ['a', 'b'] },
  { key: 'sale', icon: 'money', x: 81, y: 90, w: 26 },
  { key: 'split', icon: 'split', x: 50, y: 110, w: 30, people: ['a', 'b'] }
];

/** The consent frame drawn around everything after the two ways in. */
export const CONSENT_FRAME = { x: 3, y: 16.5, w: 94, h: 102 };

/**
 * A vertical S-curve from the bottom of one box to the top of the next.
 * @param {number} fx  start x
 * @param {number} fy  centre y of the upper box
 * @param {number} tx  end x
 * @param {number} ty  centre y of the lower box
 */
function down(fx, fy, tx, ty) {
  const y1 = fy + HALF_H;
  const y2 = ty - HALF_H - 0.8; // room for the arrowhead
  const mid = (y1 + y2) / 2;
  return `M ${fx} ${y1} C ${fx} ${mid}, ${tx} ${mid}, ${tx} ${y2}`;
}

/** @typedef {{ key: string, from: string, to: string, d: string }} MapEdge */

/** @type {MapEdge[]} */
export const EDGES = [
  { key: 'customerWish', from: 'customer', to: 'wish', d: down(80, 8, 80, 26) },
  { key: 'founderDream', from: 'founder', to: 'dream', d: down(20, 8, 20, 26) },
  { key: 'wishRikma', from: 'wish', to: 'rikma', d: down(80, 26, 60, 46) },
  { key: 'dreamRikma', from: 'dream', to: 'rikma', d: down(20, 26, 40, 46) },
  { key: 'rikmaMission', from: 'rikma', to: 'mission', d: down(42, 46, 19, 68) },
  { key: 'rikmaResource', from: 'rikma', to: 'resource', d: down(50, 46, 50, 68) },
  { key: 'rikmaProduct', from: 'rikma', to: 'product', d: down(58, 46, 81, 68) },
  { key: 'missionContribution', from: 'mission', to: 'contribution', d: down(19, 68, 29, 90) },
  { key: 'resourceContribution', from: 'resource', to: 'contribution', d: down(50, 68, 37, 90) },
  { key: 'productSale', from: 'product', to: 'sale', d: down(81, 68, 81, 90) },
  // The customer pays: runs down the end-side margin, outside the boxes.
  {
    key: 'customerSale',
    from: 'customer',
    to: 'sale',
    d: 'M 93 8 C 99 8, 99 8, 99 14 L 99 84 C 99 90, 99 90, 95 90'
  },
  { key: 'saleSplit', from: 'sale', to: 'split', d: down(81, 90, 57, 110) },
  { key: 'contributionSplit', from: 'contribution', to: 'split', d: down(33, 90, 43, 110) },
  // The circle closes: the split goes back to the rikma's partners, and the
  // rikma goes on to the next request. Runs up the start-side margin.
  {
    key: 'splitRikma',
    from: 'split',
    to: 'rikma',
    d: 'M 35 110 C 1 110, 1 110, 1 102 L 1 54 C 1 46, 1 46, 31 46'
  }
];

/**
 * @typedef {{ text: string, nodes: string[], edges: string[], consent?: boolean }} MapStep
 */

/** Steps three to seven are the same whichever way you came in. @type {MapStep[]} */
const SHARED = [
  { text: 's3', nodes: ['rikma', 'mission', 'resource'], edges: ['rikmaMission', 'rikmaResource'] },
  {
    text: 's4',
    nodes: ['mission', 'resource', 'contribution'],
    edges: ['missionContribution', 'resourceContribution']
  },
  {
    text: 's5',
    nodes: ['rikma', 'product', 'customer', 'sale'],
    edges: ['rikmaProduct', 'productSale', 'customerSale']
  },
  {
    text: 's6',
    nodes: ['sale', 'contribution', 'split'],
    edges: ['saleSplit', 'contributionSplit']
  },
  { text: 's7', nodes: ['split', 'rikma'], edges: ['splitRikma'], consent: true }
];

/** @type {Record<'request' | 'dream', MapStep[]>} */
export const STORIES = {
  request: [
    { text: 'request1', nodes: ['customer', 'wish'], edges: ['customerWish'] },
    { text: 'request2', nodes: ['wish', 'rikma'], edges: ['wishRikma'] },
    ...SHARED
  ],
  dream: [
    { text: 'dream1', nodes: ['founder', 'dream'], edges: ['founderDream'] },
    { text: 'dream2', nodes: ['dream', 'rikma'], edges: ['dreamRikma'] },
    ...SHARED
  ]
};

/**
 * The four ways in, at the foot of the page.
 * @type {{ key: string, icon: import('$lib/celim/icons/entityIcons').EntityIconKind, href: string }[]}
 */
export const DOORS = [
  { key: 'customer', icon: 'concierge', href: '/made-for-you' },
  { key: 'founder', icon: 'opportunity', href: '/vision' },
  { key: 'partner', icon: 'mission', href: '/demand' },
  { key: 'supplier', icon: 'offerings', href: '/join/supplier' }
];
