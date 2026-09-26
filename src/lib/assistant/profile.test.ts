import { describe, expect, it } from 'vitest';
import { markProfileApplied, mergeAnalysis, planProfileApply, profileItems } from './profile.js';
import { applyOps } from './applyOps.js';

const snapshot = {
  skills: [{ id: '1', name: 'עיצוב' }, { id: '2', name: 'פיגמה' }],
  roles: [],
  methods: [{ id: '9', name: 'מרחוק' }],
  vallues: [],
  resources: [{ id: '40', name: 'מצלמה' }]
};

describe('profile as a list', () => {
  it('seeds what is on the profile as applied, and merges an analysis without duplicates', () => {
    const base = { items: profileItems(snapshot) };
    expect(base.items.map((i) => [i.key, i.group, i.status])).toEqual([
      ['p1', 'skills', 'applied'],
      ['p2', 'skills', 'applied'],
      ['p3', 'methods', 'applied'],
      ['p4', 'resources', 'applied']
    ]);
    const merged = mergeAnalysis(base, {
      matched: { skills: [{ input: 'figma', existingId: '2', existingLabel: 'פיגמה' }], vallues: [{ input: 'יושרה', existingId: '7' }] },
      newItems: { skills: [{ input: 'UX writing' }, { input: 'עיצוב ' }] },
      proposed_sps: [{ name: 'מצלמה' }, { name: 'רחפן', descrip: 'DJI' }]
    });
    expect(merged.items.slice(4).map((i) => [i.key, i.group, i.label, i.existingId ?? null])).toEqual([
      ['c5', 'skills', 'UX writing', null],
      ['c6', 'vallues', 'יושרה', '7'],
      ['c7', 'resources', 'רחפן', null]
    ]);
  });

  it('plans the whole new list per changed relation, removals included; untouched groups are not written', () => {
    let state = mergeAnalysis({ items: profileItems(snapshot) }, { newItems: { skills: [{ input: 'UX writing' }] }, matched: { vallues: [{ input: 'x', existingId: '7' }] } });
    state = applyOps(state, [{ op: 'drop', key: 'p1' }], { kind: 'profile', origin: 'manual' }).state;
    const plan = planProfileApply(state);
    expect(plan.relations.skills).toEqual({ ids: ['2'], newNames: [{ key: 'c5', name: 'UX writing' }] });
    expect(plan.relations.vallues).toEqual({ ids: ['7'], newNames: [] });
    expect(plan.relations.methods).toBeUndefined();
    expect(plan.removed).toEqual(['p1']);
    expect(plan.applying.sort()).toEqual(['c5', 'c6']);

    const after = markProfileApplied(state, plan, { c5: '55' });
    const byKey = Object.fromEntries(after.items.map((i) => [i.key, i]));
    expect(byKey.c5).toMatchObject({ status: 'applied', existingId: '55' });
    expect(byKey.c6).toMatchObject({ status: 'applied', existingId: '7' });
    expect(byKey.p1).toMatchObject({ status: 'dropped', droppedFrom: 'proposed' });
    // Nothing left to write.
    expect(planProfileApply(after)).toEqual({ relations: {}, newResources: [], removed: [], applying: [] });
  });

  it('a new resource becomes an sp; a resource is never removed from here', () => {
    let state = mergeAnalysis({ items: profileItems(snapshot) }, { proposed_sps: [{ name: 'רחפן', descrip: 'DJI' }] });
    state = applyOps(state, [{ op: 'drop', key: 'p4' }], { kind: 'profile', origin: 'manual' }).state;
    const plan = planProfileApply(state);
    expect(plan.newResources).toEqual([{ key: 'c5', name: 'רחפן', descrip: 'DJI' }]);
    expect(plan.removed).toEqual([]);
  });
});
