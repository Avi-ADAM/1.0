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
        case 'createResource':
          return { success: true, data: { id: String(++n) } };
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

    expect(calls.map((c) => c.key)).toEqual(['createWeave', 'createMission', 'createComplexMatanot', 'createComplexMatanot']);
    expect(calls[0].params).toMatchObject({ projectName: 'השקד', vallueIds: ['9'], newVallueNames: ['חדש'] });
    expect(calls[1].params).toMatchObject({ projectId: '77', missionName: 'רשתות', skillIds: ['s1'] });
    // The recipe mission rides inside the product, assigned to the founder.
    expect(calls[2].params).toMatchObject({ name: 'סדנה', pricingMode: 'estimated', recipeMissions: [expect.objectContaining({ name: 'הנחיה', assignedMemberId: '5' })] });

    // A new rikma has one member: nobody asked Strapi, and the partner mission is open.
    expect(deps.memberCount).not.toHaveBeenCalled();
    expect(deps.invitePartner).toHaveBeenCalledWith('dana@x.co', { openMissions: [{ id: '101', name: 'רשתות' }], openMashaabims: [] }, 'השקד');

    expect(out.projectId).toBe('77');
    expect(out.failed).toEqual([]);
    expect(out.invites).toEqual([{ key: 'i5', result: 'invited' }]);
    expect(out.state.items.every((it) => it.status === 'applied')).toBe(true);
    expect(out.state.items.find((it) => it.key === 'i2')!.createdRef).toEqual({ type: 'bom', id: '102' });
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
