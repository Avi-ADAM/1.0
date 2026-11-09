/**
 * Changing what an existing product is made of (PLAN_PRODUCT_FORM_UNIFIED, phase 3).
 *
 * The seller's draft is diffed against the stored lines into `BomTerm`s, which
 * ride an `editObject` round next to the price (`negoarch.bom`). Pure and
 * client-safe: the form draws the same plan the server enforces.
 *
 * A term carries its own "from", so a partner signs a difference and not a
 * number they cannot place, and so the Decision stays the record of what was
 * agreed after a removed line has left the product.
 */

export type BomLineKind = 'mission' | 'resource';

/** One stored line of a product, as the price section lists it. */
export interface BomStoredLine {
  /** `m12` / `r5`: the kind and the row's id. */
  id: string;
  kind: BomLineKind;
  name: string;
  /** Hours per unit, or quantity per unit. */
  amount: number;
  /** Units per product (missions; 1 on a resource). */
  units: number;
  /** Rate per hour, or price per unit. */
  unit: number;
  /** Nobody holds it yet: on a customer's deal, it is not on the bill until someone takes it. */
  open?: boolean;
}

export interface BomAddTerm {
  kind: 'add';
  line: BomLineKind;
  name: string;
  amount: number;
  units: number;
  unit: number;
  notes: string;
  /** The resource's kind as the picker names it (see `resourceKindOf`). */
  resourceKind: string | null;
  /** Set when the line stands for something the rikma already has. */
  mesimabetahalichId: string | null;
  pmashId: string | null;
  openMashaabimId: string | null;
  /** Who takes it on. This member signs the same round, explicitly: their silence is not their yes. */
  assignedMemberId: string | null;
  /** So a partner signing the round sees who it is. Written by the server. */
  assigneeName: string | null;
  /** A resource: which of the owner's own they bring, chosen as they sign. */
  spId?: string | null;
}

/** The owner's answer to "which of yours is it": one they have, or a new one at their value. */
export interface BomResourcePick {
  index: number;
  spId?: string;
  create?: { myp: number };
}

export interface BomChangeTerm {
  kind: 'change';
  line: BomLineKind;
  /** The row's own id, without the kind prefix. */
  id: string;
  name: string;
  units: number;
  /** Someone holds the line, so a customer's bill already counts it. */
  held: boolean;
  fromAmount: number;
  toAmount: number;
  fromUnit: number;
  toUnit: number;
}

export interface BomRemoveTerm {
  kind: 'remove';
  line: BomLineKind;
  id: string;
  name: string;
  cost: number;
  held: boolean;
}

export type BomTerm = BomAddTerm | BomChangeTerm | BomRemoveTerm;

export interface BomLineDraft {
  id: string;
  amount: number | null;
  unit: number | null;
  removed: boolean;
}

export interface BomAddDraft {
  line: BomLineKind;
  name: string;
  amount: number | null;
  units: number | null;
  unit: number | null;
  notes?: string | null;
  resourceKind?: string | null;
  mesimabetahalichId?: string | null;
  pmashId?: string | null;
  openMashaabimId?: string | null;
  assignedMemberId?: string | null;
}

export interface BomDraft {
  lines: BomLineDraft[];
  add: BomAddDraft[];
}

export type BomIssue = 'bomName' | 'bomNumber' | 'bomEmpty' | 'bomTooMany';

export interface BomPlan {
  terms: BomTerm[];
  errors: BomIssue[];
}

/** A product's recipe holds at most this many lines per kind (what the readers page through). */
export const MAX_BOM_LINES = 100;

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const money = (n: number) => Math.round(n * 100) / 100;

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const idOf = (v: unknown): string | null => {
  const s = v == null ? '' : String(v).trim();
  return /^\d+$/.test(s) ? s : null;
};

const sameNumber = (a: number, b: number) => Math.abs(a - b) < 0.0005;

/** The row's id on its own: `m12` → `12`. */
export const rowIdOf = (lineId: string) => lineId.replace(/^[mr]/, '');

/** What a term's line adds to one unit of the product, once it is applied. */
export function termCost(term: BomTerm): number {
  if (term.kind === 'remove') return 0;
  if (term.kind === 'change') return money(term.toAmount * term.units * term.toUnit);
  return money(term.amount * term.units * term.unit);
}

/** What the line cost before this term. */
export function termCostBefore(term: BomChangeTerm): number {
  return money(term.fromAmount * term.units * term.fromUnit);
}

const VALID_RESOURCE_KINDOF = new Set(['monthly', 'perUnit', 'rent', 'total', 'yearly']);

/** The picker's resource kind in the collection's own enum. */
export function resourceKindOf(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (VALID_RESOURCE_KINDOF.has(raw)) return raw;
  switch (raw) {
    case 'subscription':
      return 'monthly';
    case 'good':
      return 'perUnit';
    default:
      return 'total';
  }
}

/**
 * The seller's draft against the stored lines: only what actually moved. A
 * line the draft does not mention stays as it is, and a line of another
 * product is not in `stored`, so it can never be named.
 */
export function planBomChanges(stored: BomStoredLine[], raw: unknown): BomPlan {
  const draft = (raw && typeof raw === 'object' ? raw : {}) as Partial<BomDraft>;
  const errors = new Set<BomIssue>();
  const terms: BomTerm[] = [];
  let staying = stored.length;

  for (const d of Array.isArray(draft.lines) ? draft.lines : []) {
    const line = stored.find((l) => l.id === d?.id);
    if (!line) continue;
    if (d.removed === true) {
      staying -= 1;
      terms.push({
        kind: 'remove',
        line: line.kind,
        id: rowIdOf(line.id),
        name: line.name,
        cost: money(line.amount * line.units * line.unit),
        held: line.open !== true
      });
      continue;
    }
    const amount = num(d.amount);
    const unit = num(d.unit);
    if (amount === null || unit === null || amount < 0 || unit < 0) {
      errors.add('bomNumber');
      continue;
    }
    if (sameNumber(amount, line.amount) && sameNumber(unit, line.unit)) continue;
    terms.push({
      kind: 'change',
      line: line.kind,
      id: rowIdOf(line.id),
      name: line.name,
      units: line.units,
      held: line.open !== true,
      fromAmount: line.amount,
      toAmount: amount,
      fromUnit: line.unit,
      toUnit: unit
    });
  }

  const added = Array.isArray(draft.add) ? draft.add : [];
  for (const d of added) {
    const name = text(d?.name, 120);
    if (!name) {
      errors.add('bomName');
      continue;
    }
    const amount = num(d.amount);
    const unit = num(d.unit);
    const units = num(d.units) ?? 1;
    if (amount === null || unit === null || amount < 0 || unit < 0 || units <= 0) {
      errors.add('bomNumber');
      continue;
    }
    const line: BomLineKind = d.line === 'resource' ? 'resource' : 'mission';
    const mesimabetahalichId = line === 'mission' ? idOf(d.mesimabetahalichId) : null;
    const pmashId = line === 'resource' ? idOf(d.pmashId) : null;
    const openMashaabimId = line === 'resource' ? idOf(d.openMashaabimId) : null;
    staying += 1;
    terms.push({
      kind: 'add',
      line,
      name,
      amount,
      units: line === 'mission' ? units : 1,
      unit,
      notes: text(d.notes, 2000),
      resourceKind: line === 'resource' ? text(d.resourceKind, 40) || null : null,
      mesimabetahalichId,
      pmashId,
      openMashaabimId,
      // Something the rikma already has keeps whoever holds it.
      assignedMemberId: mesimabetahalichId || pmashId || openMashaabimId ? null : idOf(d.assignedMemberId),
      assigneeName: null,
      spId: null
    });
  }

  // A product priced by its cost with nothing to cost is a price of zero.
  if (staying <= 0) errors.add('bomEmpty');
  for (const kind of ['mission', 'resource'] as const) {
    const count =
      stored.filter((l) => l.kind === kind).length +
      terms.filter((t) => t.line === kind && t.kind === 'add').length -
      terms.filter((t) => t.line === kind && t.kind === 'remove').length;
    if (count > MAX_BOM_LINES) errors.add('bomTooMany');
  }
  return { terms, errors: [...errors] };
}

/** How much the terms change one unit's cost: above 0, a customer of this product is asked for more. */
export function bomRaise(terms: BomTerm[]): number {
  let sum = 0;
  for (const t of terms) {
    if (t.kind === 'remove') sum -= t.cost;
    else if (t.kind === 'add') sum += termCost(t);
    else sum += termCost(t) - termCostBefore(t);
  }
  return money(sum);
}

/**
 * How much the terms move a live deal's bill, per unit. Only lines someone
 * holds are on it, and a new mission with an owner starts held. An open line,
 * or a resource still waiting for its owner to pick what they bring, joins the
 * bill when that candidacy matures (`$lib/server/deal/offerDeal`), so adding
 * one here would count it twice.
 */
export function bomBillDelta(terms: BomTerm[]): number {
  let sum = 0;
  for (const t of terms) {
    if (t.kind === 'add') {
      if (t.line === 'mission' && t.assignedMemberId) sum += termCost(t);
      continue;
    }
    if (!t.held) continue;
    sum += t.kind === 'remove' ? -t.cost : termCost(t) - termCostBefore(t);
  }
  return money(sum);
}

/** The members a version puts work on: each has to sign it explicitly. */
export function bomAssignees(terms: BomTerm[] | null | undefined): string[] {
  return [...new Set((terms ?? []).flatMap((t) => (t.kind === 'add' && t.assignedMemberId ? [t.assignedMemberId] : [])))];
}

/** Indexes of the new resources this member owns and has not said which of theirs they are. */
export function bomResourcesToPick(terms: BomTerm[] | null | undefined, userId: string): number[] {
  return (terms ?? []).flatMap((t, i) =>
    t.kind === 'add' && t.line === 'resource' && t.assignedMemberId === String(userId) && !t.spId ? [i] : []
  );
}

/** The version with these new lines' owners taken off: they stay, open for anyone. */
export function releaseAssignments(terms: BomTerm[], indexes: number[]): BomTerm[] {
  return terms.map((t, i) => (t.kind === 'add' && t.assignedMemberId && indexes.includes(i) ? { ...t, assignedMemberId: null, assigneeName: null, spId: null } : t));
}

/** One unit's cost once the terms are applied. */
export function bomCostAfter(stored: BomStoredLine[], terms: BomTerm[]): number {
  let total = 0;
  for (const l of stored) {
    const rowId = rowIdOf(l.id);
    const term = terms.find((t) => t.kind !== 'add' && t.line === l.kind && t.id === rowId);
    if (term?.kind === 'remove') continue;
    total += term?.kind === 'change' ? term.toAmount * l.units * term.toUnit : l.amount * l.units * l.unit;
  }
  for (const t of terms) if (t.kind === 'add') total += t.amount * t.units * t.unit;
  return money(total);
}

/** Terms back from a round's JSON. A row that does not read as a term is dropped. */
export function parseBomTerms(raw: unknown): BomTerm[] {
  let list: unknown = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  const out: BomTerm[] = [];
  for (const t of list as any[]) {
    const line: BomLineKind | null = t?.line === 'mission' || t?.line === 'resource' ? t.line : null;
    const name = text(t?.name, 120);
    if (!line || !name) continue;
    if (t.kind === 'remove') {
      const id = idOf(t.id);
      if (id) out.push({ kind: 'remove', line, id, name, cost: num(t.cost) ?? 0, held: t.held !== false });
    } else if (t.kind === 'change') {
      const id = idOf(t.id);
      const [fromAmount, toAmount, fromUnit, toUnit] = [num(t.fromAmount), num(t.toAmount), num(t.fromUnit), num(t.toUnit)];
      if (id && fromAmount !== null && toAmount !== null && fromUnit !== null && toUnit !== null) {
        out.push({ kind: 'change', line, id, name, units: num(t.units) ?? 1, held: t.held !== false, fromAmount, toAmount, fromUnit, toUnit });
      }
    } else if (t.kind === 'add') {
      const [amount, unit] = [num(t.amount), num(t.unit)];
      if (amount === null || unit === null) continue;
      out.push({
        kind: 'add',
        line,
        name,
        amount,
        units: num(t.units) ?? 1,
        unit,
        notes: text(t.notes, 2000),
        resourceKind: text(t.resourceKind, 40) || null,
        mesimabetahalichId: idOf(t.mesimabetahalichId),
        pmashId: idOf(t.pmashId),
        openMashaabimId: idOf(t.openMashaabimId),
        assignedMemberId: idOf(t.assignedMemberId),
        assigneeName: text(t.assigneeName, 120) || null,
        spId: idOf(t.spId)
      });
    }
  }
  return out;
}
