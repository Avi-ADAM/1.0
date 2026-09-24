/**
 * Properties the whole "two surfaces, one list" design rests on:
 *
 *  - keys stay unique whatever ops arrive, so an op can never be ambiguous;
 *  - `revertChanges` is an exact undo of any batch, so "undo last" never loses
 *    or invents anything;
 *  - an op on a key that does not exist changes nothing — a hallucinated key
 *    is reported, not guessed at;
 *  - locked rows (a supplier answered, or the thing already exists) keep their
 *    label and spec whatever the chat says.
 */

import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { applyOps, revertChanges } from './applyOps.js';
import { RIKMA_GROUPS, type AssistantItem, type AssistantState } from './types.js';

const label = fc.constantFrom('Cake', 'cake', 'Oven', 'Teach', 'עוגה', 'תנור', 'Delivery', '  Cake ');
const group = fc.constantFrom(...RIKMA_GROUPS);
const key = fc.constantFrom('i1', 'i2', 'i3', 'i4', 'i5', 'i9', 'zz');

const op = fc.oneof(
  fc.record({ op: fc.constantFrom('keep', 'drop', 'restore'), key }),
  fc.record({ op: fc.constant('add'), group, label }),
  fc.record({ op: fc.constant('rename'), key, label }),
  fc.record({ op: fc.constant('setSpec'), key, spec: fc.record({ price: fc.integer({ min: 0, max: 500 }) }) }),
  fc.record({
    op: fc.constant('link'),
    productKey: key,
    missionKeys: fc.array(key, { maxLength: 3 }),
    resourceKeys: fc.array(key, { maxLength: 2 })
  }),
  fc.record({ op: fc.constant('setField'), field: fc.constantFrom('name', 'currency', 'nope'), value: fc.string({ maxLength: 8 }) })
);

const baseItem = (i: number, g: AssistantItem['group'], locked: boolean): AssistantItem => ({
  key: `i${i}`,
  group: g,
  label: `seed ${i}`,
  status: 'proposed',
  origin: 'extract',
  ...(locked ? { createdRef: { type: 'matanot', id: String(i) } } : {})
});

const state: fc.Arbitrary<AssistantState> = fc
  .array(fc.tuple(group, fc.boolean()), { maxLength: 5 })
  .map((rows) => ({ items: rows.map(([g, locked], i) => baseItem(i + 1, g, locked)) }));

describe('applyOps properties', () => {
  it('keys stay unique', () => {
    fc.assert(
      fc.property(state, fc.array(op, { maxLength: 25 }), (s, ops) => {
        const keys = applyOps(s, ops, { kind: 'rikma' }).state.items.map((it) => it.key);
        expect(new Set(keys).size).toBe(keys.length);
      })
    );
  });

  it('revertChanges is an exact undo', () => {
    fc.assert(
      fc.property(state, fc.array(op, { maxLength: 25 }), (s, ops) => {
        const r = applyOps(s, ops, { kind: 'rikma' });
        expect(revertChanges(r.state, r.changes)).toEqual(s);
      })
    );
  });

  it('the input state is never mutated', () => {
    fc.assert(
      fc.property(state, fc.array(op, { maxLength: 25 }), (s, ops) => {
        const snapshot = structuredClone(s);
        applyOps(s, ops, { kind: 'rikma' });
        expect(s).toEqual(snapshot);
      })
    );
  });

  it('every op is either applied or rejected — none silently vanish', () => {
    fc.assert(
      fc.property(state, fc.array(op, { maxLength: 25 }), (s, ops) => {
        const r = applyOps(s, ops, { kind: 'rikma' });
        expect(r.applied.length + r.rejected.length).toBe(ops.length);
      })
    );
  });

  it('locked rows keep their label and spec', () => {
    fc.assert(
      fc.property(state, fc.array(op, { maxLength: 25 }), (s, ops) => {
        const after = applyOps(s, ops, { kind: 'rikma' }).state;
        for (const before of s.items.filter((it) => it.createdRef)) {
          const now = after.items.find((it) => it.key === before.key)!;
          expect(now.label).toBe(before.label);
          expect(now.spec).toEqual(before.spec);
          expect(now.status).not.toBe('dropped');
        }
      })
    );
  });
});
