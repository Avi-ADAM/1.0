/**
 * The "Promotions" tab of the sales screen (docs/inprogress/PLAN_SHOP_PROMOTIONS.md P5) — pure.
 *
 *   PromoDraft      — what the three-step wizard holds (what · on what · when),
 *                     in the shape of its inputs: numbers that may be empty,
 *                     dates as the `<input type="date">` gives them.
 *   draftProblems   — what keeps the draft from being sent, per step.
 *   draftToTerms    — the terms `proposePromotion` takes.
 *   previewDraft    — before sending, the same question the server will ask:
 *                     does it go out now (nobody else's income, or inside the
 *                     envelope), or is it a vote — and what in it is beyond.
 *   groupPromotions — the tab's list: running, coming, on the table, ended.
 *
 * The server decides; the preview only says in advance what it will decide.
 */
import type { PromotionKind, PromotionScope, PromotionStatus } from './promotions';
import {
  earliestStart,
  envelopeBreaches,
  listPricesOf,
  normalizePromoTerms,
  promoIneligible,
  promoNeedsRikma,
  shelfInScope,
  type Breach,
  type PromoPolicy,
  type PromoTerms,
  type ShelfProduct
} from './promoTerms';

export type ItemMode = 'pct' | 'price' | 'off';
export type ThresholdMode = 'pct' | 'off';

export interface PromoDraft {
  kind: PromotionKind;
  name: string;
  /** item */
  itemMode: ItemMode;
  value: number | null;
  /** bundle: `qty` for `price` */
  qty: number | null;
  price: number | null;
  /** bxgy: buy `buy`, `get` more at `getPct`% off */
  buy: number | null;
  get: number | null;
  getPct: number | null;
  /** threshold: over `minSubtotal`, `value` off (₪ or %) */
  thresholdMode: ThresholdMode;
  minSubtotal: number | null;
  /** On what: the whole store, or the products picked. */
  all: boolean;
  products: string[];
  /** `YYYY-MM-DD`, local. An empty start = as soon as it is approved. */
  startsOn: string;
  endsOn: string;
  capUnits: number | null;
  why: string;
}

export function emptyDraft(kind: PromotionKind = 'item'): PromoDraft {
  return {
    kind,
    name: '',
    itemMode: 'pct',
    value: null,
    qty: 3,
    price: null,
    buy: 1,
    get: 1,
    getPct: 50,
    thresholdMode: 'off',
    minSubtotal: null,
    all: kind === 'store' || kind === 'threshold',
    products: [],
    startsOn: '',
    endsOn: '',
    capUnits: null,
    why: ''
  };
}

/** A store-wide sale and a spend-and-save reach the whole store by their nature. */
export const kindIsStoreWide = (kind: PromotionKind) => kind === 'store' || kind === 'threshold';

export type DraftProblem =
  | 'value'
  | 'pctRange'
  | 'bundle'
  | 'bxgy'
  | 'minSubtotal'
  | 'noProducts'
  | 'noEnd'
  | 'endPassed'
  | 'endBeforeStart';

export const WIZARD_STEPS = ['what', 'scope', 'when'] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

const pos = (n: number | null) => n != null && Number.isFinite(n) && n > 0;
const whole = (n: number | null) => pos(n) && Number.isInteger(n);

/** A local calendar day as an instant: its start, or its last second. */
export function dayToIso(day: string, edge: 'start' | 'end'): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day ?? '');
  if (!m) return null;
  const d = edge === 'start' ? new Date(+m[1], +m[2] - 1, +m[3], 0, 0, 0) : new Date(+m[1], +m[2] - 1, +m[3], 23, 59, 59);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** An instant as the local day a date input shows. */
export function isoToDay(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function ruleOf(d: PromoDraft): Record<string, number | boolean> {
  switch (d.kind) {
    case 'item':
      return { [d.itemMode]: d.value ?? 0 };
    case 'store':
      return { pct: d.value ?? 0 };
    case 'bundle':
      return { qty: d.qty ?? 0, price: d.price ?? 0, repeat: true };
    case 'bxgy':
      return { buy: d.buy ?? 0, get: d.get ?? 0, getPct: d.getPct ?? 0, cheapestFree: true };
    case 'threshold':
      return { minSubtotal: d.minSubtotal ?? 0, [d.thresholdMode]: d.value ?? 0 };
  }
}

function scopeOf(d: PromoDraft): PromotionScope {
  return d.all || kindIsStoreWide(d.kind) ? { all: true } : { products: [...d.products] };
}

/** What keeps each step from moving on. */
export function draftProblems(d: PromoDraft, now: Date): Record<WizardStep, DraftProblem[]> {
  const what: DraftProblem[] = [];
  const pctLike = (d.kind === 'item' && d.itemMode === 'pct') || d.kind === 'store' || (d.kind === 'threshold' && d.thresholdMode === 'pct');
  if (d.kind === 'item' || d.kind === 'store' || d.kind === 'threshold') {
    if (!pos(d.value)) what.push('value');
    else if (pctLike && (d.value as number) >= 100) what.push('pctRange');
  }
  if (d.kind === 'bundle' && !(whole(d.qty) && (d.qty as number) >= 2 && pos(d.price))) what.push('bundle');
  if (d.kind === 'bxgy' && !(whole(d.buy) && whole(d.get) && pos(d.getPct) && (d.getPct as number) <= 100)) what.push('bxgy');
  if (d.kind === 'threshold' && !pos(d.minSubtotal)) what.push('minSubtotal');

  const scope: DraftProblem[] = [];
  if (!d.all && !kindIsStoreWide(d.kind) && d.products.length === 0) scope.push('noProducts');

  const when: DraftProblem[] = [];
  const start = d.startsOn ? dayToIso(d.startsOn, 'start') : null;
  const end = dayToIso(d.endsOn, 'end');
  if (!end) when.push('noEnd');
  else if (Date.parse(end) <= now.getTime()) when.push('endPassed');
  else if (start && Date.parse(end) <= Date.parse(start)) when.push('endBeforeStart');

  return { what, scope, when };
}

export const draftReady = (d: PromoDraft, now: Date) => Object.values(draftProblems(d, now)).every((p) => p.length === 0);

/** The terms `proposePromotion` takes. */
export function draftToTerms(d: PromoDraft): Record<string, unknown> {
  return {
    kind: d.kind,
    name: d.name.trim() || null,
    scope: scopeOf(d),
    rule: ruleOf(d),
    startsAt: d.startsOn ? dayToIso(d.startsOn, 'start') : null,
    endsAt: dayToIso(d.endsOn, 'end'),
    capUnits: whole(d.capUnits) ? d.capUnits : null,
    capOrders: null,
    perOrderMax: null
  };
}

export interface DraftPreview {
  terms: PromoTerms | null;
  /** The products the promotion reaches — eligible ones only. */
  reaches: ShelfProduct[];
  /** Picked by name but out of a promotion's reach (pool, quote, wish deal). */
  blocked: ShelfProduct[];
  /** false = it goes out at once (the rikma is told); true = a vote. */
  needsVote: boolean;
  breaches: Breach[];
  /** With a vote, the earliest it can start: after the rikma's clock (D2). */
  earliest: string | null;
  /** The start date falls before the vote can end — it would start at approval. */
  startsLate: boolean;
}

export function previewDraft(
  d: PromoDraft,
  ctx: { shelf: readonly ShelfProduct[]; policy: PromoPolicy | null; memberIds: readonly string[]; me: string; restimeMs: number; now: Date }
): DraftPreview {
  const parsed = normalizePromoTerms(draftToTerms(d), ctx.now);
  const scope = scopeOf(d);
  const inScope = shelfInScope(scope, ctx.shelf);
  const reaches = inScope.filter((p) => !promoIneligible(p));
  const blocked = inScope.filter((p) => promoIneligible(p));
  if (!parsed.ok) return { terms: null, reaches, blocked, needsVote: false, breaches: [], earliest: null, startsLate: false };
  const terms = parsed.terms;
  const needsRikma = promoNeedsRikma(terms.scope, reaches, ctx.me, ctx.memberIds);
  // A role list is checked on the server, against the roles the proposer holds there.
  const breaches = needsRikma
    ? envelopeBreaches(terms, ctx.policy, { now: ctx.now, listPrices: listPricesOf(reaches) }).filter((b) => b.field !== 'who')
    : [];
  const needsVote = needsRikma && breaches.length > 0;
  const earliest = needsVote ? earliestStart(ctx.now, ctx.restimeMs) : null;
  const startsLate = !!earliest && !!terms.startsAt && Date.parse(terms.startsAt) < Date.parse(earliest);
  return { terms, reaches, blocked, needsVote, breaches, earliest, startsLate };
}

export interface ListedPromotion {
  id: string;
  status: PromotionStatus;
  decisionId: string | null;
  decisionArchived: boolean;
  endsAt: string | null;
}

/** The tab's sections, in the order a member reads them. */
export function groupPromotions<T extends ListedPromotion>(rows: readonly T[]) {
  const by = (s: PromotionStatus[]) => rows.filter((r) => s.includes(r.status));
  const ending = (a: T, b: T) => Date.parse(a.endsAt ?? '') - Date.parse(b.endsAt ?? '');
  return {
    live: by(['active', 'paused']).sort(ending),
    upcoming: by(['scheduled']).sort(ending),
    // A running promotion with another version on the table is listed where it runs, and flagged.
    proposals: by(['proposed']),
    ended: by(['ended'])
  };
}

/** A running promotion with an open vote on another version of it. */
export const hasOpenCounter = (r: ListedPromotion) => r.status !== 'proposed' && !!r.decisionId && !r.decisionArchived;
