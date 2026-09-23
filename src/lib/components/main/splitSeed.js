/**
 * The sample rikma both halves of the homepage's split block start from: the
 * comparison card that is always on screen, and the full calculator it opens
 * (`SplitCalculator.svelte`). One source, so the percentages the card promises
 * are exactly the ones the calculator shows when it opens.
 *
 * נתוני הפתיחה הם רקמה אחת שלמה ועקבית — ייבוא ומכירה אונליין: מי בנה את
 * אתר המכירות, מי סגר את הספק והמכס, מה נקנה בכסף, ומה נמכר בסוף. `k` הוא
 * מפתח תרגום ולא טקסט, כדי שהשורות יישארו קריאות בכל שפה.
 */

/* Two lists, not one: PALETTE fills the share bar and the dot, INK writes
   the partner's name. A bar only has to be told apart from its neighbour,
   a name has to be read - and #e0a800 / #3aa7a0 measure 2.0:1 and 2.9:1 as
   text on the card. Same hues, one step deeper, all >=4.5:1 on the fill. */
export const PALETTE = ['#ff0092', '#e0a800', '#3aa7a0', '#8b5cf6'];
export const INK = ['#b80069', '#8a6a15', '#0f766e', '#6d28d9'];

export const SEED_PARTNERS = [
  {
    k: 'p1',
    tasks: [
      { k: 'p1t1', h: 50, m: 0, rate: 100 },
      { k: 'p1t2', h: 22, m: 30, rate: 100 },
      { k: 'p1t3', h: 14, m: 20, rate: 100 }
    ],
    costs: [{ k: 'p1c1', amount: 1200 }]
  },
  {
    k: 'p2',
    tasks: [
      { k: 'p2t1', h: 20, m: 0, rate: 100 },
      { k: 'p2t2', h: 15, m: 25, rate: 100 }
    ],
    costs: [{ k: 'p2c1', amount: 1800 }]
  },
  {
    k: 'p3',
    tasks: [
      { k: 'p3t1', h: 18, m: 40, rate: 90 },
      { k: 'p3t2', h: 9, m: 15, rate: 90 }
    ],
    costs: [{ k: 'p3c1', amount: 450 }]
  },
  {
    k: 'p4',
    tasks: [{ k: 'p4t1', h: 6, m: 30, rate: 120 }],
    costs: [{ k: 'p4c1', amount: 900 }]
  }
];

export const SEED_SALES = [
  { k: 's1', price: 89, qty: 120 },
  { k: 's2', price: 149, qty: 45 },
  { k: 's3', price: 25, qty: 60 }
];

/** @param {unknown} v */
export const num = (v) => (Number.isFinite(+v) && +v > 0 ? +v : 0);

/** דקות ולא עשרוני: 15:25 זה 15.4167 שעות, וזה מה שהטיימר באמת מדד. */
export const taskValue = (/** @type {{h:number,m:number,rate:number}} */ task) =>
  (num(task.h) + num(task.m) / 60) * num(task.rate);

/** What one partner put in: tasks at their rate, plus money and equipment. */
export const valueOf = (
  /** @type {{tasks:{h:number,m:number,rate:number}[],costs:{amount:number}[]}} */ p
) =>
  p.tasks.reduce((sum, task) => sum + taskValue(task), 0) +
  p.costs.reduce((sum, cost) => sum + num(cost.amount), 0);

/**
 * Each of the first `count` seed partners' share of the whole, in percent.
 * The same formula the system runs: what you gave over what everyone gave.
 * @param {number} count
 * @returns {{ k: string, share: number }[]}
 */
export function seedShares(count = SEED_PARTNERS.length) {
  const partners = SEED_PARTNERS.slice(0, count);
  const values = partners.map(valueOf);
  const total = values.reduce((a, b) => a + b, 0);
  return partners.map((p, i) => ({ k: p.k, share: total > 0 ? (values[i] / total) * 100 : 0 }));
}
