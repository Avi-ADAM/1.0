import { describe, expect, it } from 'vitest';
import { applyOps, lockReason, nextKey, normalizeLabel, revertChanges } from './applyOps.js';
import type { AssistantItem, AssistantState } from './types.js';

const item = (over: Partial<AssistantItem> & Pick<AssistantItem, 'key' | 'group' | 'label'>): AssistantItem => ({
  status: 'proposed',
  origin: 'extract',
  ...over
});

const profile: AssistantState = {
  items: [
    item({ key: 'i1', group: 'skills', label: 'Figma', existingId: '11' }),
    item({ key: 'i2', group: 'roles', label: 'מרצה', existingId: '22' }),
    item({ key: 'i3', group: 'skills', label: 'UX', status: 'applied', origin: 'profile', existingId: '33' })
  ]
};

describe('keep / drop / restore', () => {
  it('keep marks a proposal as kept and leaves an applied item alone', () => {
    const { state, applied } = applyOps(profile, [{ op: 'keep', key: 'i1' }, { op: 'keep', key: 'i3' }], { kind: 'profile' });
    expect(applied).toHaveLength(2);
    expect(state.items[0].status).toBe('kept');
    expect(state.items[2].status).toBe('applied');
  });

  it('drop remembers what the item was, and restore puts it back exactly', () => {
    const dropped = applyOps(profile, [{ op: 'drop', key: 'i3' }], { kind: 'profile' }).state;
    expect(dropped.items[2]).toMatchObject({ status: 'dropped', droppedFrom: 'applied' });
    const restored = applyOps(dropped, [{ op: 'restore', key: 'i3' }], { kind: 'profile' }).state;
    expect(restored.items[2]).toEqual(profile.items[2]);
  });

  it('keep on a dropped item that was on the profile brings it back as applied', () => {
    const dropped = applyOps(profile, [{ op: 'drop', key: 'i3' }], { kind: 'profile' }).state;
    const kept = applyOps(dropped, [{ op: 'keep', key: 'i3' }], { kind: 'profile' }).state;
    expect(kept.items[2].status).toBe('applied');
    expect(kept.items[2].droppedFrom).toBeUndefined();
  });

  it('restore of something that was not dropped is rejected', () => {
    const r = applyOps(profile, [{ op: 'restore', key: 'i1' }], { kind: 'profile' });
    expect(r.rejected).toEqual([{ op: { op: 'restore', key: 'i1' }, reason: 'notDropped' }]);
  });

  it('an unknown key is rejected, never invented', () => {
    const r = applyOps(profile, [{ op: 'keep', key: 'i99' }], { kind: 'profile' });
    expect(r.rejected[0].reason).toBe('unknownKey');
    expect(r.state.items).toEqual(profile.items);
    expect(r.changes).toEqual([]);
  });
});

describe('add', () => {
  it('adds a new kept item with the next key and the caller as origin', () => {
    const r = applyOps(profile, [{ op: 'add', group: 'skills', label: '  User   Research ', why: 'said so' }], {
      kind: 'profile',
      origin: 'revision'
    });
    expect(r.state.items.at(-1)).toEqual({
      key: 'i4',
      group: 'skills',
      label: 'User Research',
      status: 'kept',
      origin: 'revision',
      why: 'said so'
    });
  });

  it('adding what is already there means "yes, that one" — no duplicate', () => {
    const r = applyOps(profile, [{ op: 'add', group: 'skills', label: 'figma' }], { kind: 'profile' });
    expect(r.state.items).toHaveLength(3);
    expect(r.state.items[0].status).toBe('kept');
  });

  it('adding a dropped item back restores it', () => {
    const dropped = applyOps(profile, [{ op: 'drop', key: 'i2' }], { kind: 'profile' }).state;
    const r = applyOps(dropped, [{ op: 'add', group: 'roles', label: 'מרצה' }], { kind: 'profile' });
    expect(r.state.items[1].status).toBe('kept');
    expect(r.state.items).toHaveLength(3);
  });

  it('refuses a group that does not belong to the session kind', () => {
    const r = applyOps(profile, [{ op: 'add', group: 'products', label: 'Workshop' }], { kind: 'profile' });
    expect(r.rejected[0].reason).toBe('wrongGroup');
  });

  it('refuses empty and oversized labels', () => {
    const r = applyOps(
      profile,
      [
        { op: 'add', group: 'skills', label: '   ' },
        { op: 'add', group: 'skills', label: 'x'.repeat(201) }
      ],
      { kind: 'profile' }
    );
    expect(r.rejected.map((x) => x.reason)).toEqual(['invalidLabel', 'invalidLabel']);
  });

  it('refuses a spec that is not plain JSON data', () => {
    const r = applyOps(
      { items: [] },
      [{ op: 'add', group: 'products', label: 'A', spec: { price: Number.NaN } }],
      { kind: 'rikma' }
    );
    expect(r.rejected[0].reason).toBe('invalidValue');
  });
});

describe('rename / setSpec', () => {
  it('a real rename drops the vocabulary match; a cosmetic one keeps it', () => {
    const a = applyOps(profile, [{ op: 'rename', key: 'i1', label: 'FIGMA' }], { kind: 'profile' }).state;
    expect(a.items[0]).toMatchObject({ label: 'FIGMA', existingId: '11' });
    const b = applyOps(profile, [{ op: 'rename', key: 'i1', label: 'Sketch' }], { kind: 'profile' }).state;
    expect(b.items[0].existingId).toBeUndefined();
  });

  it('setSpec merges, and null removes a key', () => {
    const s: AssistantState = { items: [item({ key: 'p1', group: 'products', label: 'Cake', spec: { price: 100, kindOf: 'total' } })] };
    const r = applyOps(s, [{ op: 'setSpec', key: 'p1', spec: { price: 180, kindOf: null } }], { kind: 'rikma' });
    expect(r.state.items[0].spec).toEqual({ price: 180 });
  });
});

describe('locks — what the chat may not change', () => {
  it('a wish row a supplier already answered cannot be dropped, renamed or respecced', () => {
    const s: AssistantState = {
      items: [item({ key: 'w1', group: 'wishMissions', label: 'צלם', committed: { proposalId: '7' } })]
    };
    const r = applyOps(
      s,
      [
        { op: 'drop', key: 'w1' },
        { op: 'rename', key: 'w1', label: 'x' },
        { op: 'setSpec', key: 'w1', spec: { hoursEst: 2 } },
        { op: 'keep', key: 'w1' }
      ],
      { kind: 'wish' }
    );
    expect(r.rejected.map((x) => x.reason)).toEqual(['committed', 'committed', 'committed']);
    expect(r.applied).toEqual([{ op: 'keep', key: 'w1' }]);
  });

  it('a rikma row that already exists is edited on the site, not here', () => {
    const created = item({ key: 'p1', group: 'products', label: 'A', createdRef: { type: 'matanot', id: '5' } });
    const existing = item({ key: 'p2', group: 'products', label: 'B', status: 'applied', origin: 'project' });
    expect(lockReason(created, 'rikma')).toBe('created');
    expect(lockReason(existing, 'rikma')).toBe('created');
    // …but an applied PROFILE item is the member's own and may be removed.
    expect(lockReason(existing, 'profile')).toBeNull();
  });
});

describe('link (product recipe)', () => {
  const rikma: AssistantState = {
    items: [
      item({ key: 'p1', group: 'products', label: 'Workshop' }),
      item({ key: 'm1', group: 'rikmaMissions', label: 'Teach' }),
      item({ key: 'r1', group: 'rikmaResources', label: 'Oven' })
    ]
  };

  it('sets the recipe from keys of the right groups, deduplicated', () => {
    const r = applyOps(rikma, [{ op: 'link', productKey: 'p1', missionKeys: ['m1', 'm1'], resourceKeys: ['r1'] }], {
      kind: 'rikma'
    });
    expect(r.state.items[0].spec).toEqual({ recipe: { missionKeys: ['m1'], resourceKeys: ['r1'] } });
  });

  it('refuses a key from the wrong group', () => {
    const r = applyOps(rikma, [{ op: 'link', productKey: 'p1', missionKeys: ['r1'] }], { kind: 'rikma' });
    expect(r.rejected[0].reason).toBe('unknownKey');
  });

  it('an empty link clears the recipe', () => {
    const linked = applyOps(rikma, [{ op: 'link', productKey: 'p1', missionKeys: ['m1'] }], { kind: 'rikma' }).state;
    const cleared = applyOps(linked, [{ op: 'link', productKey: 'p1' }], { kind: 'rikma' }).state;
    expect(cleared.items[0].spec).toBeUndefined();
  });

  it('only exists for rikma sessions', () => {
    const r = applyOps(rikma, [{ op: 'link', productKey: 'p1' }], { kind: 'wish' });
    expect(r.rejected[0].reason).toBe('wrongKind');
  });
});

describe('setField', () => {
  it('sets allowed fields per kind and refuses others', () => {
    const r = applyOps(
      { items: [] },
      [
        { op: 'setField', field: 'name', value: 'השקד' },
        { op: 'setField', field: 'title', value: 'x' }
      ],
      { kind: 'rikma' }
    );
    expect(r.state.fields).toEqual({ name: 'השקד' });
    expect(r.rejected[0].reason).toBe('unknownField');
  });

  it('a profile has no fields', () => {
    const r = applyOps(profile, [{ op: 'setField', field: 'name', value: 'x' }], { kind: 'profile' });
    expect(r.rejected[0].reason).toBe('unknownField');
  });
});

describe('malformed input', () => {
  it('rejects non-ops and anything past the per-call cap', () => {
    const ops: unknown[] = [null, 'keep', { op: 'explode' }, ...Array.from({ length: 60 }, () => ({ op: 'keep', key: 'i1' }))];
    const r = applyOps(profile, ops, { kind: 'profile' });
    expect(r.rejected.slice(0, 3).map((x) => x.reason)).toEqual(['invalidOp', 'invalidOp', 'invalidOp']);
    expect(r.rejected.filter((x) => x.reason === 'tooManyOps')).toHaveLength(3);
  });
});

describe('changes and undo', () => {
  it('records the net change and revertChanges undoes it exactly', () => {
    const r = applyOps(
      profile,
      [
        { op: 'keep', key: 'i1' },
        { op: 'drop', key: 'i2' },
        { op: 'add', group: 'methods', label: 'remote' }
      ],
      { kind: 'profile' }
    );
    expect(r.changes.map((c) => (c.kind === 'item' ? c.key : c.field))).toEqual(['i1', 'i2', 'i4']);
    expect(revertChanges(r.state, r.changes)).toEqual(profile);
  });

  it('ops that cancel out record no change', () => {
    const r = applyOps(profile, [{ op: 'drop', key: 'i1' }, { op: 'restore', key: 'i1' }], { kind: 'profile' });
    expect(r.changes).toEqual([]);
  });
});

describe('helpers', () => {
  it('nextKey is one past the highest numeric suffix', () => {
    expect(nextKey([])).toBe('i1');
    expect(nextKey([item({ key: 'p7', group: 'products', label: 'x' }), item({ key: 'i3', group: 'products', label: 'y' })])).toBe('i8');
  });

  it('normalizeLabel ignores case, spacing and punctuation', () => {
    expect(normalizeLabel('  Logo  Design! ')).toBe(normalizeLabel('logo design'));
    expect(normalizeLabel('עיצוב "לוגו"')).toBe(normalizeLabel('עיצוב לוגו'));
  });
});
