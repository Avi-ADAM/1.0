import { describe, expect, it, vi } from 'vitest';
import { runMaterialization, type MaterializeDeps } from './materialize.js';
import type { AssistantItem, AssistantState } from '$lib/assistant/types.js';

const row = (over: Partial<AssistantItem> & Pick<AssistantItem, 'key' | 'group' | 'label'>): AssistantItem => ({
  status: 'proposed',
  origin: 'agent',
  ...over
});

const blueprint: AssistantState = {
  fields: { track: 'partnership', name: 'השקד', vals: ['קהילה', 'חדש'] },
  items: [
    row({ key: 'i1', group: 'products', label: 'סדנה', spec: { price: 180, recipe: { missionKeys: ['i2'], resourceKeys: [] } } }),
    row({ key: 'i2', group: 'rikmaMissions', label: 'הנחיה', spec: { holder: 'me', hours: 3 } }),
    row({ key: 'i3', group: 'rikmaMissions', label: 'רשתות', spec: { holder: 'partner', partnerKey: 'i5', skills: ['שיווק'] } }),
    row({ key: 'i4', group: 'products', label: 'מגש' }),
    row({ key: 'i5', group: 'partners', label: 'דנה', spec: { email: 'dana@x.co' } })
  ]
};

function fakeDeps(over: Partial<MaterializeDeps> = {}) {
  const calls: { key: string; params: Record<string, unknown> }[] = [];
  const saves: { projectId: string | null; created: string[] }[] = [];
  let n = 100;
  const deps: MaterializeDeps = {
    runAction: vi.fn(async (key, params) => {
      calls.push({ key, params });
      switch (key) {
        case 'createWeave':
          return { success: true, data: { projectId: '77' } };
        case 'createMission':
          return {
            success: true,
            data: { createdEntityId: String(++n), createdEntityType: params.assignedUserId ? 'mesimabetahalich' : 'openMission' }
          };
        case 'createComplexMatanot':
          return { success: true, data: { success: true, matanotId: String(++n) } };
        case 'createResource': {
          // A recurring resource the only member brings runs at once (engineOn 'now').
          const id = String(++n);
          return params.recurring && params.isAssigned
            ? { success: true, data: { id, mashabetahalichId: `mb${id}`, recurring: true } }
            : { success: true, data: { id } };
        }
        case 'seedPlanBoards':
          return { success: true, data: { boardCount: 1 } };
        default:
          return { success: false, error: { message: 'unexpected' } };
      }
    }),
    resolveVallues: vi.fn(async (names) => ({ ids: names.includes('קהילה') ? ['9'] : [], newNames: names.filter((x) => x !== 'קהילה') })),
    resolveMissionVocab: vi.fn(async (item) => (item.key === 'i3' ? { skillIds: ['s1'] } : undefined)),
    memberCount: vi.fn(async () => 3),
    projectName: vi.fn(async () => 'רקמה קיימת'),
    invitePartner: vi.fn(async () => ({ result: 'invited', created: 1 })),
    saveProgress: vi.fn(async (state, projectId) => {
      saves.push({ projectId, created: state.items.filter((it) => it.createdRef).map((it) => it.key) });
    }),
    leftoverTitle: 'עוד מהייבוא',
    lang: 'he',
    ...over
  };
  return { deps, calls, saves };
}

describe('runMaterialization — a new rikma', () => {
  it('creates the rikma, then rows, then invites the partner to what they bring', async () => {
    const { deps, calls } = fakeDeps();
    const out = await runMaterialization(blueprint, ['i1', 'i2', 'i3', 'i4', 'i5'], { projectId: null, userId: '5' }, deps);

    expect(calls.map((c) => c.key)).toEqual(['createWeave', 'createMission', 'createMission', 'createComplexMatanot', 'createComplexMatanot']);
    expect(calls[0].params).toMatchObject({ projectName: 'השקד', vallueIds: ['9'], newVallueNames: ['חדש'] });
    expect(calls[1].params).toMatchObject({ projectId: '77', missionName: 'רשתות', skillIds: ['s1'] });
    // One member: the recipe mission is created as the founder's own mission in
    // progress, and the product's line links to it — no vote.
    expect(calls[2].params).toMatchObject({ missionName: 'הנחיה', assignedUserId: '5' });
    expect(calls[3].params).toMatchObject({
      name: 'סדנה',
      pricingMode: 'estimated',
      recipeMissions: [expect.objectContaining({ name: 'הנחיה', mode: 'consumeExisting', mesimabetahalichId: '102', assignedMemberId: '5' })]
    });

    // A new rikma has one member: nobody asked Strapi, and the partner mission is open.
    expect(deps.memberCount).not.toHaveBeenCalled();
    expect(deps.invitePartner).toHaveBeenCalledWith('dana@x.co', { openMissions: [{ id: '101', name: 'רשתות' }], openMashaabims: [] }, 'השקד');

    expect(out.projectId).toBe('77');
    expect(out.failed).toEqual([]);
    expect(out.invites).toEqual([{ key: 'i5', result: 'invited' }]);
    expect(out.state.items.every((it) => it.status === 'applied')).toBe(true);
    expect(out.state.items.find((it) => it.key === 'i2')!.createdRef).toEqual({ type: 'mesimabetahalich', id: '102' });
  });

  it('saves progress after the rikma and after every step', async () => {
    const { deps, saves } = fakeDeps();
    await runMaterialization(blueprint, ['i4'], { projectId: null, userId: '5' }, deps);
    expect(saves[0]).toEqual({ projectId: '77', created: [] });
    expect(saves.at(-1)!.created).toEqual(['i4']);
  });

  it('stops when the rikma cannot be created — nothing else can land', async () => {
    const { deps, calls } = fakeDeps({
      runAction: vi.fn(async () => ({ success: false, error: { message: 'boom' } }))
    });
    const out = await runMaterialization(blueprint, ['i4'], { projectId: null, userId: '5' }, deps);
    expect(calls).toEqual([]);
    expect(out.failed).toEqual([{ key: 'rikma', message: 'boom' }]);
    expect(out.projectId).toBeNull();
  });
});

describe('runMaterialization — an existing rikma', () => {
  it('asks the member count once and does not invite to rows that went to a vote', async () => {
    const { deps } = fakeDeps({
      runAction: vi.fn(async (key) =>
        key === 'createMission'
          ? { success: true, data: { createdEntityId: '300', createdEntityType: 'pendm' } }
          : { success: true, data: { boardCount: 1 } }
      )
    });
    const out = await runMaterialization(blueprint, ['i3', 'i5'], { projectId: '12', userId: '5' }, deps);
    expect(deps.memberCount).toHaveBeenCalledTimes(1);
    expect(deps.invitePartner).not.toHaveBeenCalled();
    expect(out.invites).toEqual([{ key: 'i5', result: 'pendingVote' }]);
  });

  it('one failing row does not stop the others', async () => {
    const { deps } = fakeDeps({
      runAction: vi.fn(async (key, params) =>
        params.name === 'סדנה'
          ? { success: false, error: { message: 'no' } }
          : key === 'createComplexMatanot'
            ? { success: true, data: { matanotId: '55' } }
            : { success: true, data: { boardCount: 1 } }
      )
    });
    const out = await runMaterialization(blueprint, ['i1', 'i4'], { projectId: '12', userId: '5' }, deps);
    expect(out.failed).toEqual([{ key: 'i1', message: 'no' }]);
    expect(out.created).toEqual([{ key: 'i4', type: 'matanot', id: '55' }]);
    // The failed product's recipe row was not marked as created.
    expect(out.state.items.find((it) => it.key === 'i2')!.createdRef).toBeUndefined();
  });

  it('a re-run after success creates nothing twice', async () => {
    const { deps } = fakeDeps();
    const first = await runMaterialization(blueprint, ['i4'], { projectId: '12', userId: '5' }, deps);
    const { deps: again, calls } = fakeDeps();
    await runMaterialization(first.state, ['i4'], { projectId: '12', userId: '5' }, again);
    expect(calls.filter((c) => c.key === 'createComplexMatanot')).toEqual([]);
  });

  it('keeps unticked rows as planning proposals', async () => {
    const { deps, calls } = fakeDeps();
    const out = await runMaterialization(blueprint, ['i4'], { projectId: '12', userId: '5' }, deps);
    const seed = calls.find((c) => c.key === 'seedPlanBoards')!;
    expect(seed.params).toMatchObject({ projectId: '12', lang: 'he' });
    expect((seed.params.plan as any).boards[0].items.map((r: any) => r.name)).toEqual(['סדנה', 'הנחיה', 'רשתות']);
    expect(out.proposals).toEqual({ boards: 1, overflow: [] });
  });

  it('never mutates the state it was given', async () => {
    const snapshot = structuredClone(blueprint);
    const { deps } = fakeDeps();
    await runMaterialization(blueprint, ['i1', 'i3', 'i4', 'i5'], { projectId: null, userId: '5' }, deps);
    expect(blueprint).toEqual(snapshot);
  });
});

describe('runMaterialization — a product made of missions and resources', () => {
  // The night grocery of the 2026-09-29 test: its recipe rows came back as votes.
  const grocery: AssistantState = {
    fields: { track: 'business', name: 'מכולת הלילה' },
    items: [
      row({ key: 'p', group: 'products', label: 'סל לילה', spec: { price: 150, recipe: { missionKeys: ['m1', 'm2'], resourceKeys: ['r1', 'r2'] } } }),
      row({ key: 'm1', group: 'rikmaMissions', label: 'הזמנות מספקים', spec: { holder: 'me', hours: 20, recurring: true } }),
      row({ key: 'm2', group: 'rikmaMissions', label: 'משמרות לילה', spec: { holder: 'open', hours: 120, recurring: true } }),
      row({ key: 'r1', group: 'rikmaResources', label: 'שכירות החנות', spec: { holder: 'me', kindOf: 'monthly', price: 6000 } }),
      row({ key: 'r2', group: 'rikmaResources', label: 'מקרר תצוגה', spec: { holder: 'open', kindOf: 'total', price: 3000 } })
    ]
  };
  const all = ['p', 'm1', 'm2', 'r1', 'r2'];

  it('one member: the rows are created as they are and the product links to them', async () => {
    const { deps, calls } = fakeDeps();
    const out = await runMaterialization(grocery, all, { projectId: null, userId: '5' }, deps);

    expect(calls.map((c) => c.key)).toEqual(['createWeave', 'createMission', 'createMission', 'createResource', 'createResource', 'createComplexMatanot']);
    // The same params a standalone row gets: mine in progress, open otherwise, recurring kept.
    expect(calls[1].params).toMatchObject({ missionName: 'הזמנות מספקים', assignedUserId: '5', iskvua: true });
    expect(calls[2].params).toMatchObject({ missionName: 'משמרות לילה', iskvua: true });
    expect(calls[2].params).not.toHaveProperty('assignedUserId');
    expect(calls[3].params).toMatchObject({ name: 'שכירות החנות', kindOf: 'monthly', price: 6000, recurring: true, isAssigned: true });
    expect(calls[3].params.startDate).toEqual(expect.any(String));
    expect(calls[4].params).toMatchObject({ name: 'מקרר תצוגה', kindOf: 'total' });
    expect(calls[4].params).not.toHaveProperty('isAssigned');

    expect(calls[5].params).toMatchObject({
      recipeMissions: [
        expect.objectContaining({ mode: 'consumeExisting', mesimabetahalichId: '101' }),
        expect.objectContaining({ mode: 'consumeExisting', openMissionId: '102' })
      ],
      recipeResources: [
        expect.objectContaining({ mode: 'consumeExisting', mashabetahalichId: 'mb103', kindOf: 'monthly' }),
        expect.objectContaining({ mode: 'consumeExisting', openMashaabimId: '104' })
      ]
    });

    const ref = (k: string) => out.state.items.find((it) => it.key === k)!.createdRef;
    expect(ref('m1')).toEqual({ type: 'mesimabetahalich', id: '101' });
    expect(ref('m2')).toEqual({ type: 'openMission', id: '102' });
    expect(ref('r1')).toEqual({ type: 'mashabetahalich', id: 'mb103' });
    expect(ref('r2')).toEqual({ type: 'openMashaabim', id: '104' });
    expect(ref('p')).toEqual({ type: 'matanot', id: '105' });
    expect(out.failed).toEqual([]);
  });

  it('an existing one-member rikma behaves the same', async () => {
    const { deps, calls } = fakeDeps({ memberCount: vi.fn(async () => 1) });
    await runMaterialization(grocery, all, { projectId: '90', userId: '5' }, deps);
    expect(calls.map((c) => c.key)).toEqual(['createMission', 'createMission', 'createResource', 'createResource', 'createComplexMatanot']);
  });

  it('more members: the rows are proposed inside the product, voted on with it', async () => {
    const { deps, calls } = fakeDeps(); // memberCount 3
    const out = await runMaterialization(grocery, all, { projectId: '12', userId: '5' }, deps);

    expect(calls.map((c) => c.key)).toEqual(['createComplexMatanot']);
    expect(calls[0].params).toMatchObject({
      recipeMissions: [
        expect.objectContaining({ mode: 'createNew', iskvua: true, assignedMemberId: '5' }),
        expect.objectContaining({ mode: 'createNew', iskvua: true, assignedMemberId: null })
      ],
      recipeResources: [
        expect.objectContaining({ mode: 'createNew', kindOf: 'monthly', pricePerUnit: 6000, recurring: true }),
        expect.objectContaining({ mode: 'createNew', kindOf: 'total' })
      ]
    });
    expect(out.state.items.filter((it) => it.createdRef?.type === 'bom').map((it) => it.key)).toEqual(['m1', 'm2', 'r1', 'r2']);
  });

  it('one member: a row that fails holds the product back, and a re-run finishes it', async () => {
    const failing = fakeDeps({
      runAction: vi.fn(async (key, params) => {
        if (key === 'createResource' && params.name === 'מקרר תצוגה') return { success: false, error: { message: 'strapi down' } };
        if (key === 'createMission') return { success: true, data: { createdEntityId: String(params.missionName).length, createdEntityType: 'openMission' } };
        if (key === 'createResource') return { success: true, data: { id: '7' } };
        return { success: true, data: { matanotId: '55' } };
      })
    });
    const first = await runMaterialization(grocery, all, { projectId: '90', userId: '5' }, { ...failing.deps, memberCount: vi.fn(async () => 1) });
    expect(first.failed).toEqual([
      { key: 'r2', message: 'strapi down' },
      { key: 'p', message: 'Part of its recipe could not be created' }
    ]);
    expect((failing.deps.runAction as any).mock.calls.some(([k]: [string]) => k === 'createComplexMatanot')).toBe(false);

    const again = fakeDeps({ memberCount: vi.fn(async () => 1) });
    const second = await runMaterialization(first.state, all, { projectId: '90', userId: '5' }, again.deps);
    // Only the missing row, then the product — nothing twice.
    expect(again.calls.map((c) => c.key)).toEqual(['createResource', 'createComplexMatanot']);
    expect(second.failed).toEqual([]);
  });
});

describe('runMaterialization — how the concierge will find a product', () => {
  const shop: AssistantState = {
    fields: { track: 'business', name: 'השקד' },
    items: [
      row({ key: 'i1', group: 'products', label: 'מגש בוקר', spec: { price: 90, keywords: ['בראנץ׳', 'הפתעה ליום הולדת'], categories: ['אוכל', 'אירועים'] } }),
      row({ key: 'i2', group: 'products', label: 'עוגה' })
    ]
  };

  it('sends the keywords and the resolved Category ids with the product', async () => {
    const resolveCategories = vi.fn(async (names: string[]) => names.map((n) => (n === 'אוכל' ? '3' : '8')));
    const { deps, calls } = fakeDeps({ resolveCategories });
    await runMaterialization(shop, ['i1', 'i2'], { projectId: '12', userId: '5' }, deps);

    expect(resolveCategories).toHaveBeenCalledTimes(1);
    expect(calls[0].params).toMatchObject({ discoveryKeywords: 'בראנץ׳, הפתעה ליום הולדת', categoryIds: ['3', '8'] });
    expect(calls[1].params).not.toHaveProperty('categoryIds');
  });

  it('a failing category lookup costs the categories, not the product', async () => {
    const { deps, calls } = fakeDeps({ resolveCategories: vi.fn(async () => Promise.reject(new Error('down'))) });
    const out = await runMaterialization(shop, ['i1'], { projectId: '12', userId: '5' }, deps);
    expect(out.failed).toEqual([]);
    expect(calls[0].params).not.toHaveProperty('categoryIds');
  });
});
