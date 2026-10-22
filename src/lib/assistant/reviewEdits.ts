/**
 * The review screen's edits → the session's ops
 * (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §4.5).
 *
 * The screen holds what the owner typed as raw form values (strings and
 * checkboxes). Here they become the same `rename` / `setSpec` / `setField` ops
 * an agent sends through `setAssistantItems`, so a save from the screen and a
 * change made in the chat land in one history the agent reads back.
 *
 * Pure. A value that does not parse is left out of the ops — and reported by
 * `fieldError` so the screen can say so — rather than sent and rejected whole:
 * `applyOps` refuses a `setSpec` with one bad value in it, which would drop the
 * good edits next to it too.
 */

import { stripHtml } from '$lib/utils/stripHtml';
import {
  DEFAULT_RESTIME,
  LIMITS,
  PRODUCT_KINDOF,
  RESOURCE_KINDOF,
  RESTIMES,
  type AssistantItem
} from './types.js';

/** Longest string `isJsonSafe` lets into a spec or a field. */
const MAX_TEXT = 2000;

export type SpecKind = 'money' | 'number' | 'int' | 'list' | 'text' | 'html' | 'bool' | 'enum' | 'email';
interface SpecDef {
  kind: SpecKind;
  max?: number;
  options?: readonly string[];
  /** What a missing value means, so flipping a box back sends nothing. */
  absent?: unknown;
}

const MONEY_MAX = 100_000_000;

/** Every spec value the screen can edit, per group. */
export const SPEC_DEFS: Record<string, Record<string, SpecDef>> = {
  products: {
    price: { kind: 'money', max: MONEY_MAX },
    kindOf: { kind: 'enum', options: PRODUCT_KINDOF, absent: 'total' },
    quant: { kind: 'int', max: 1_000_000 },
    unlimited: { kind: 'bool', absent: false },
    isOnline: { kind: 'bool', absent: false },
    keywords: { kind: 'list', max: 15 },
    categories: { kind: 'list', max: 3 },
    desc: { kind: 'text' }
  },
  rikmaMissions: {
    descrip: { kind: 'html' },
    hours: { kind: 'number', max: 10_000 },
    ratePerHour: { kind: 'money', max: MONEY_MAX },
    recurring: { kind: 'bool', absent: false },
    roles: { kind: 'list', max: 6 },
    skills: { kind: 'list', max: 10 },
    workways: { kind: 'list', max: 6 },
    holder: { kind: 'enum', options: ['me', 'open', 'partner'], absent: 'open' }
  },
  rikmaResources: {
    descrip: { kind: 'html' },
    kindOf: { kind: 'enum', options: RESOURCE_KINDOF, absent: 'total' },
    price: { kind: 'money', max: MONEY_MAX },
    quantity: { kind: 'number', max: 1_000_000 },
    holder: { kind: 'enum', options: ['me', 'open', 'partner'], absent: 'open' }
  },
  partners: {
    email: { kind: 'email' }
  }
};

export type Raw = string | boolean;
export type Parsed = { ok: true; value: unknown } | { ok: false; reason: 'invalid' | 'tooLong' };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "a, b ,, c" → ['a', 'b', 'c'] */
export const splitList = (s: string): string[] =>
  s
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean);

/** A raw form value → the value a spec stores; `null` removes the key. */
export function parseValue(def: SpecDef, raw: Raw): Parsed {
  if (def.kind === 'bool') return { ok: true, value: raw === true };
  const s = String(raw ?? '').trim();
  switch (def.kind) {
    case 'money':
    case 'number':
    case 'int': {
      if (!s) return { ok: true, value: null };
      const n = Number(s.replace(',', '.'));
      if (!Number.isFinite(n) || n < 0 || (def.max !== undefined && n > def.max)) return { ok: false, reason: 'invalid' };
      if (def.kind === 'int' && (!Number.isInteger(n) || n < 1)) return { ok: false, reason: 'invalid' };
      return { ok: true, value: n };
    }
    case 'list': {
      const words = splitList(s).slice(0, def.max ?? 15);
      if (words.some((w) => w.length > 60)) return { ok: false, reason: 'tooLong' };
      return { ok: true, value: words.length ? words : null };
    }
    case 'text':
      if (s.length > MAX_TEXT) return { ok: false, reason: 'tooLong' };
      return { ok: true, value: s || null };
    case 'html':
      if (!stripHtml(s)) return { ok: true, value: null };
      if (s.length > MAX_TEXT) return { ok: false, reason: 'tooLong' };
      return { ok: true, value: s };
    case 'enum':
      return def.options?.includes(s) ? { ok: true, value: s } : { ok: false, reason: 'invalid' };
    case 'email':
      if (!s) return { ok: true, value: null };
      if (s.length > 200 || !EMAIL.test(s)) return { ok: false, reason: 'invalid' };
      return { ok: true, value: s.toLowerCase() };
    default:
      return { ok: false, reason: 'invalid' };
  }
}

/** What a stored spec value looks like in its form control. */
export function rawOf(def: SpecDef | undefined, value: unknown): Raw {
  if (def?.kind === 'bool') return value === undefined ? def.absent === true : value === true;
  if (value === undefined || value === null) return def?.kind === 'enum' ? String(def.absent ?? '') : '';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export interface RowEdit {
  label?: string;
  spec?: Record<string, Raw>;
}

/** The reason a typed value cannot be saved, or null. */
export function fieldError(group: string, field: string, raw: Raw | undefined): 'invalid' | 'tooLong' | null {
  const def = SPEC_DEFS[group]?.[field];
  if (!def || raw === undefined) return null;
  const p = parseValue(def, raw);
  return 'reason' in p ? p.reason : null;
}

/** One row's edits → `rename` + `setSpec` ops (none when nothing changed). */
export function rowOps(row: AssistantItem, edit: RowEdit | undefined): Record<string, unknown>[] {
  if (!edit) return [];
  const ops: Record<string, unknown>[] = [];
  const label = edit.label?.replace(/\s+/g, ' ').trim();
  if (label && label.length <= LIMITS.label && label !== row.label) ops.push({ op: 'rename', key: row.key, label });

  const defs = SPEC_DEFS[row.group] ?? {};
  const spec: Record<string, unknown> = {};
  for (const [field, raw] of Object.entries(edit.spec ?? {})) {
    const def = defs[field];
    if (!def) continue;
    const p = parseValue(def, raw);
    if (!p.ok) continue;
    const before = row.spec?.[field] ?? def.absent ?? null;
    const after = p.value ?? def.absent ?? null;
    if (same(before, after)) continue;
    spec[field] = p.value;
  }
  // A product's price decides how it is sold: no price is "on request".
  if (row.group === 'products' && 'price' in spec) spec.pricingMode = spec.price === null ? 'quote' : 'fixed';
  if (Object.keys(spec).length) ops.push({ op: 'setSpec', key: row.key, spec });
  return ops;
}

// ── The rikma's own fields ──────────────────────────────────────────────────

/** The editable rikma fields; location is split into its hint and online flag. */
export type FieldEdits = Partial<{
  name: string;
  publicDescription: string;
  descripFor: string;
  linkToWebsite: string;
  vals: string;
  currency: string;
  restime: string;
  place: string;
  online: boolean;
}>;

export function fieldValueError(field: keyof FieldEdits, raw: Raw | undefined): 'invalid' | 'tooLong' | null {
  if (raw === undefined) return null;
  const p = parseField(field, raw);
  return 'reason' in p ? p.reason : null;
}

function parseField(field: keyof FieldEdits, raw: Raw): Parsed {
  const s = String(raw ?? '').trim();
  switch (field) {
    case 'name':
      if (!s) return { ok: false, reason: 'invalid' };
      return s.length > 120 ? { ok: false, reason: 'tooLong' } : { ok: true, value: s };
    case 'publicDescription':
    case 'descripFor':
      return s.length > MAX_TEXT ? { ok: false, reason: 'tooLong' } : { ok: true, value: s || null };
    case 'linkToWebsite': {
      if (!s) return { ok: true, value: null };
      // Rendered as a link on the rikma page: http(s) only.
      if (s.length > 500 || !/^https?:\/\/[^\s]+$/i.test(s)) return { ok: false, reason: 'invalid' };
      try {
        new URL(s);
      } catch {
        return { ok: false, reason: 'invalid' };
      }
      return { ok: true, value: s };
    }
    case 'vals': {
      const words = splitList(s).slice(0, 8);
      if (words.some((w) => w.length > 60)) return { ok: false, reason: 'tooLong' };
      return { ok: true, value: words.length ? words : null };
    }
    case 'currency':
      if (!s) return { ok: true, value: null };
      return /^[a-z]{3}$/i.test(s) ? { ok: true, value: s.toUpperCase() } : { ok: false, reason: 'invalid' };
    case 'restime':
      return (RESTIMES as readonly string[]).includes(s) ? { ok: true, value: s } : { ok: false, reason: 'invalid' };
    case 'place':
      return s.length > 200 ? { ok: false, reason: 'tooLong' } : { ok: true, value: s || null };
    case 'online':
      return { ok: true, value: raw === true };
    default:
      return { ok: false, reason: 'invalid' };
  }
}

/** What a stored field looks like in its form control. */
export function fieldRaw(fields: Record<string, any> | undefined, field: keyof FieldEdits): Raw {
  const f = fields ?? {};
  if (field === 'place') return String(f.location?.hint ?? '');
  if (field === 'online') return f.location?.isOnline === true;
  if (field === 'restime') return String(f.restime ?? DEFAULT_RESTIME);
  const v = f[field];
  if (v === undefined || v === null) return '';
  return Array.isArray(v) ? v.join(', ') : String(v);
}

/** The owner's field edits → `setField` ops. */
export function fieldOps(fields: Record<string, any> | undefined, edits: FieldEdits): Record<string, unknown>[] {
  const f = fields ?? {};
  const ops: Record<string, unknown>[] = [];
  for (const field of ['name', 'publicDescription', 'descripFor', 'linkToWebsite', 'vals', 'currency', 'restime'] as const) {
    const raw = edits[field];
    if (raw === undefined) continue;
    const p = parseField(field, raw);
    if (!p.ok) continue;
    const before = field === 'restime' ? (f.restime ?? DEFAULT_RESTIME) : f[field];
    if (same(before, p.value)) continue;
    ops.push({ op: 'setField', field, value: p.value });
  }

  // The place and "online" live together in one location object, next to
  // coordinates the screen does not edit — those are kept as they are.
  if (edits.place !== undefined || edits.online !== undefined) {
    const loc: Record<string, unknown> = { ...(f.location ?? {}) };
    const place = parseField('place', edits.place ?? fieldRaw(f, 'place'));
    if (place.ok) {
      if (place.value) loc.hint = place.value;
      else delete loc.hint;
      if (edits.online !== undefined) {
        if (edits.online) loc.isOnline = true;
        else delete loc.isOnline;
      }
      const value = Object.keys(loc).length ? loc : null;
      if (!same(f.location ?? null, value)) ops.push({ op: 'setField', field: 'location', value });
    }
  }
  return ops;
}

// ── Numbers the screen shows next to the inputs ─────────────────────────────

const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined);

/** hours × rate = value for a mission; price × quantity for a resource. Null when a side is missing. */
export function rowValue(group: string, spec: Record<string, unknown> | undefined): { left: number; right: number; value: number } | null {
  const s = spec ?? {};
  if (group === 'rikmaMissions') {
    const h = num(s.hours);
    const r = num(s.ratePerHour);
    return h !== undefined && r !== undefined ? { left: h, right: r, value: h * r } : null;
  }
  if (group === 'rikmaResources') {
    const p = num(s.price);
    const q = num(s.quantity);
    return p !== undefined && q !== undefined && q !== 1 ? { left: p, right: q, value: p * q } : null;
  }
  return null;
}

/** The spec the row will be created with, once the pending edits apply. */
export function effectiveSpec(row: AssistantItem, edit: RowEdit | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(row.spec ?? {}) };
  const defs = SPEC_DEFS[row.group] ?? {};
  for (const [field, raw] of Object.entries(edit?.spec ?? {})) {
    const def = defs[field];
    if (!def) continue;
    const p = parseValue(def, raw);
    if (!p.ok) continue;
    if (p.value === null) delete out[field];
    else out[field] = p.value;
  }
  return out;
}

/**
 * Increment/decrement a numeric form field (hours, rate, quantity…) cleanly,
 * clamped to `[0, max]` and rounded to 2 decimal places so repeated taps never
 * drift into floating-point noise.
 */
export function stepNumber(
  currentRaw: Raw | undefined,
  currentStored: unknown,
  delta: number,
  max = 10_000
): string {
  const rawStr = currentRaw !== undefined ? String(currentRaw).trim() : '';
  let base: number;
  if (rawStr !== '') {
    const parsed = Number(rawStr.replace(',', '.'));
    base = Number.isFinite(parsed) ? parsed : 0;
  } else {
    base = typeof currentStored === 'number' && Number.isFinite(currentStored) ? currentStored : 0;
  }
  const next = Math.min(max, Math.max(0, Math.round((base + delta) * 100) / 100));
  return String(next);
}

/** Build the initial spec for a newly added draft row from its defaults + edits. */
export function addRowSpec(
  group: string,
  baseSpec: Record<string, unknown> | undefined,
  edit: RowEdit | undefined
): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = { ...(baseSpec ?? {}) };
  const defs = SPEC_DEFS[group] ?? {};
  for (const [field, raw] of Object.entries(edit?.spec ?? {})) {
    const def = defs[field];
    if (!def) continue;
    const p = parseValue(def, raw);
    if (!p.ok) continue;
    if (p.value === null) delete out[field];
    else out[field] = p.value;
  }
  if (group === 'products' && out.price !== undefined) out.pricingMode = 'fixed';
  return Object.keys(out).length ? out : undefined;
}

/**
 * Turn checkbox changes on existing draft rows into `drop` / `restore` ops when
 * saving a draft before creation (so the public preview and future claims match
 * what the user ticked). Untouched checkboxes emit nothing.
 */
export function selectionOps(
  items: readonly AssistantItem[],
  selected: Record<string, boolean>
): Record<string, unknown>[] {
  const ops: Record<string, unknown>[] = [];
  for (const row of items) {
    if (row.createdRef || row.status === 'applied') continue;
    const isTicked = !!selected[row.key];
    if (row.status === 'dropped' && isTicked) ops.push({ op: 'restore', key: row.key });
    else if (row.status !== 'dropped' && !isTicked) ops.push({ op: 'drop', key: row.key });
  }
  return ops;
}

