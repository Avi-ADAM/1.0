/**
 * Apply an assistant's ops to a session state — the only way a list changes
 * (docs/PLAN_AI_SIGNUP_CONCIERGE.md §3.2).
 *
 * The model, the outside agent and the site's chips all speak in ops; none of
 * them ever sends back a rewritten list. That is what keeps a hallucinated or
 * hostile answer contained: an op naming a key that does not exist is
 * rejected and reported, never "creatively" applied, and nothing here can
 * touch anything outside the session.
 *
 * Pure and immutable: the input state is never mutated.
 */

import {
  FIELDS_BY_KIND,
  GROUPS_BY_KIND,
  LIMITS,
  type AssistantItem,
  type AssistantKind,
  type AssistantOp,
  type AssistantState,
  type ItemOrigin,
  type StateChange
} from './types.js';

export type RejectReason =
  | 'invalidOp'
  | 'tooManyOps'
  | 'unknownKey'
  | 'wrongGroup'
  | 'wrongKind'
  | 'invalidLabel'
  | 'notDropped'
  | 'committed'
  | 'created'
  | 'unknownField'
  | 'invalidValue'
  | 'tooManyItems';

export interface RejectedOp {
  op: unknown;
  reason: RejectReason;
}

export interface ApplyOptions {
  kind: AssistantKind;
  /** Who is adding: 'agent' (MCP), 'revision' (our model), 'manual' (a chip on the site). */
  origin?: ItemOrigin;
}

export interface ApplyResult {
  state: AssistantState;
  applied: AssistantOp[];
  rejected: RejectedOp[];
  /** Net before/after of everything the ops touched — stored on the revision for undo. */
  changes: StateChange[];
}

/** Case-, space- and punctuation-insensitive form, for "is this the same item". */
export function normalizeLabel(label: string): string {
  return label
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s‏‎]+/g, ' ')
    .replace(/["'`׳״.,;:!?()[\]{}]/g, '')
    .trim();
}

/** A trimmed, length-checked label, or null when there is nothing usable. */
function cleanLabel(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.replace(/\s+/g, ' ').trim();
  if (!s || s.length > LIMITS.label) return null;
  return s;
}

function cleanWhy(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const s = raw.replace(/\s+/g, ' ').trim();
  return s ? s.slice(0, LIMITS.why) : undefined;
}

/**
 * Plain JSON data only — no functions, class instances, NaN or giant strings —
 * and not deeper than a spec ever needs. Everything here ends up in a Strapi
 * JSON column and, later, in action params.
 */
export function isJsonSafe(value: unknown, depth = 0): boolean {
  if (depth > 5) return false;
  if (value === null) return true;
  switch (typeof value) {
    case 'string':
      return value.length <= 2000;
    case 'number':
      return Number.isFinite(value);
    case 'boolean':
      return true;
    case 'object': {
      if (Array.isArray(value)) {
        return value.length <= 60 && value.every((v) => isJsonSafe(v, depth + 1));
      }
      const proto = Object.getPrototypeOf(value);
      if (proto !== Object.prototype && proto !== null) return false;
      const entries = Object.entries(value as Record<string, unknown>);
      return entries.length <= 40 && entries.every(([, v]) => isJsonSafe(v, depth + 1));
    }
    default:
      return false;
  }
}

function isPlainSpec(spec: unknown): spec is Record<string, unknown> {
  return (
    !!spec &&
    typeof spec === 'object' &&
    !Array.isArray(spec) &&
    Object.keys(spec).length <= LIMITS.specKeys &&
    isJsonSafe(spec)
  );
}

/** Merge a spec patch; a `null` value removes that key. */
function mergeSpec(
  base: Record<string, unknown> | undefined,
  patch: Record<string, unknown>
): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = { ...(base ?? {}) };
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete out[k];
    else out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Why an item cannot be changed from the chat, if it cannot.
 *
 * - a wish row a supplier already answered: changing it lands on that
 *   supplier, so it is a conversation on the site, not an edit (§7.2);
 * - a rikma row that already exists (created by materialize, or seeded from
 *   the rikma itself): editing a real mission or product goes through its own
 *   consent flow on the site (§0.1).
 */
export function lockReason(item: AssistantItem, kind: AssistantKind): 'committed' | 'created' | null {
  if (item.committed) return 'committed';
  if (item.createdRef) return 'created';
  if (kind === 'rikma' && item.status === 'applied') return 'created';
  return null;
}

/** Next free key: one past the highest numeric suffix in use. Deterministic. */
export function nextKey(items: readonly AssistantItem[]): string {
  let max = 0;
  for (const it of items) {
    const m = /(\d+)$/.exec(it.key);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `i${max + 1}`;
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function applyOps(
  state: AssistantState,
  ops: readonly unknown[],
  options: ApplyOptions
): ApplyResult {
  const { kind } = options;
  const origin: ItemOrigin = options.origin ?? 'agent';
  const allowedGroups = GROUPS_BY_KIND[kind];
  const allowedFields = FIELDS_BY_KIND[kind];

  const items: AssistantItem[] = state.items.map((it) => ({ ...it }));
  const fields: Record<string, unknown> = { ...(state.fields ?? {}) };

  const applied: AssistantOp[] = [];
  const rejected: RejectedOp[] = [];

  const indexOf = (key: unknown) =>
    typeof key === 'string' ? items.findIndex((it) => it.key === key) : -1;

  const reject = (op: unknown, reason: RejectReason) => rejected.push({ op, reason });

  ops.forEach((raw, i) => {
    if (i >= LIMITS.opsPerCall) return reject(raw, 'tooManyOps');
    if (!raw || typeof raw !== 'object' || typeof (raw as any).op !== 'string') {
      return reject(raw, 'invalidOp');
    }
    const op = raw as AssistantOp;

    switch (op.op) {
      case 'keep':
      case 'drop':
      case 'restore': {
        const idx = indexOf(op.key);
        if (idx < 0) return reject(op, 'unknownKey');
        const it = items[idx];
        if (op.op === 'keep') {
          if (it.status === 'dropped') {
            it.status = it.droppedFrom === 'applied' ? 'applied' : 'kept';
            delete it.droppedFrom;
          } else if (it.status === 'proposed') {
            it.status = 'kept';
          }
          return applied.push(op);
        }
        if (op.op === 'drop') {
          const lock = lockReason(it, kind);
          if (lock) return reject(op, lock);
          if (it.status !== 'dropped') {
            it.droppedFrom = it.status;
            it.status = 'dropped';
          }
          return applied.push(op);
        }
        if (it.status !== 'dropped') return reject(op, 'notDropped');
        it.status = it.droppedFrom ?? 'proposed';
        delete it.droppedFrom;
        return applied.push(op);
      }

      case 'add': {
        if (!allowedGroups.includes(op.group)) return reject(op, 'wrongGroup');
        const label = cleanLabel(op.label);
        if (!label) return reject(op, 'invalidLabel');
        if (op.spec !== undefined && !isPlainSpec(op.spec)) return reject(op, 'invalidValue');

        // Asking for something that is already on the list means "yes, that
        // one" — not a second copy of it.
        const norm = normalizeLabel(label);
        const dup = items.find((it) => it.group === op.group && normalizeLabel(it.label) === norm);
        if (dup) {
          if (dup.status === 'dropped') {
            dup.status = dup.droppedFrom === 'applied' ? 'applied' : 'kept';
            delete dup.droppedFrom;
          } else if (dup.status === 'proposed') {
            dup.status = 'kept';
          }
          if (op.spec && !lockReason(dup, kind)) dup.spec = mergeSpec(dup.spec, op.spec);
          return applied.push(op);
        }

        if (items.length >= LIMITS.items) return reject(op, 'tooManyItems');
        const item: AssistantItem = {
          key: nextKey(items),
          group: op.group,
          label,
          status: 'kept',
          origin
        };
        const why = cleanWhy(op.why);
        if (why) item.why = why;
        const spec = op.spec ? mergeSpec(undefined, op.spec) : undefined;
        if (spec) item.spec = spec;
        items.push(item);
        return applied.push(op);
      }

      case 'rename': {
        const idx = indexOf(op.key);
        if (idx < 0) return reject(op, 'unknownKey');
        const it = items[idx];
        const lock = lockReason(it, kind);
        if (lock) return reject(op, lock);
        const label = cleanLabel(op.label);
        if (!label) return reject(op, 'invalidLabel');
        // A different name is a different thing: the vocabulary match that was
        // made for the old name no longer holds.
        if (normalizeLabel(label) !== normalizeLabel(it.label)) delete it.existingId;
        it.label = label;
        return applied.push(op);
      }

      case 'setSpec': {
        const idx = indexOf(op.key);
        if (idx < 0) return reject(op, 'unknownKey');
        const it = items[idx];
        const lock = lockReason(it, kind);
        if (lock) return reject(op, lock);
        if (!isPlainSpec(op.spec)) return reject(op, 'invalidValue');
        const spec = mergeSpec(it.spec, op.spec);
        if (spec) it.spec = spec;
        else delete it.spec;
        return applied.push(op);
      }

      case 'link': {
        if (kind !== 'rikma') return reject(op, 'wrongKind');
        const pIdx = indexOf(op.productKey);
        if (pIdx < 0) return reject(op, 'unknownKey');
        const product = items[pIdx];
        if (product.group !== 'products') return reject(op, 'wrongGroup');
        const lock = lockReason(product, kind);
        if (lock) return reject(op, lock);

        const check = (keys: unknown, group: AssistantItem['group']): string[] | null => {
          if (keys === undefined) return [];
          if (!Array.isArray(keys)) return null;
          const out: string[] = [];
          for (const k of keys) {
            const j = indexOf(k);
            if (j < 0 || items[j].group !== group) return null;
            if (!out.includes(k as string)) out.push(k as string);
          }
          return out;
        };
        const missionKeys = check(op.missionKeys, 'rikmaMissions');
        const resourceKeys = check(op.resourceKeys, 'rikmaResources');
        if (!missionKeys || !resourceKeys) return reject(op, 'unknownKey');

        const recipe =
          missionKeys.length || resourceKeys.length ? { missionKeys, resourceKeys } : null;
        const spec = mergeSpec(product.spec, { recipe });
        if (spec) product.spec = spec;
        else delete product.spec;
        return applied.push(op);
      }

      case 'setField': {
        if (typeof op.field !== 'string' || !allowedFields.includes(op.field)) {
          return reject(op, 'unknownField');
        }
        if (op.value !== null && !isJsonSafe(op.value)) return reject(op, 'invalidValue');
        if (op.value === null || op.value === undefined) delete fields[op.field];
        else fields[op.field] = op.value;
        return applied.push(op);
      }

      default:
        return reject(raw, 'invalidOp');
    }
  });

  const next: AssistantState = { ...state, items };
  if (Object.keys(fields).length) next.fields = fields;
  else delete next.fields;

  return { state: next, applied, rejected, changes: diffStates(state, next) };
}

/** Net item/field changes between two states, in a stable order. */
export function diffStates(before: AssistantState, after: AssistantState): StateChange[] {
  const changes: StateChange[] = [];
  const beforeByKey = new Map(before.items.map((it) => [it.key, it]));
  const afterByKey = new Map(after.items.map((it) => [it.key, it]));

  for (const it of after.items) {
    const prev = beforeByKey.get(it.key) ?? null;
    if (!same(prev, it)) changes.push({ kind: 'item', key: it.key, before: prev, after: it });
  }
  for (const it of before.items) {
    if (!afterByKey.has(it.key)) changes.push({ kind: 'item', key: it.key, before: it, after: null });
  }

  const bf = before.fields ?? {};
  const af = after.fields ?? {};
  for (const field of new Set([...Object.keys(bf), ...Object.keys(af)])) {
    if (!same(bf[field], af[field])) {
      changes.push({ kind: 'field', field, before: bf[field], after: af[field] });
    }
  }
  return changes;
}

/**
 * Undo: put every changed item and field back to its `before`.
 * Used for "undo last" — the revision stores exactly these changes.
 */
export function revertChanges(state: AssistantState, changes: readonly StateChange[]): AssistantState {
  let items = state.items.map((it) => ({ ...it }));
  const fields: Record<string, unknown> = { ...(state.fields ?? {}) };

  for (const ch of changes) {
    if (ch.kind === 'field') {
      if (ch.before === undefined) delete fields[ch.field];
      else fields[ch.field] = ch.before;
      continue;
    }
    const idx = items.findIndex((it) => it.key === ch.key);
    if (ch.before === null) {
      if (idx >= 0) items = items.filter((_, i) => i !== idx);
    } else if (idx >= 0) {
      items[idx] = { ...ch.before };
    } else {
      items.push({ ...ch.before });
    }
  }

  const out: AssistantState = { ...state, items };
  if (Object.keys(fields).length) out.fields = fields;
  else delete out.fields;
  return out;
}
