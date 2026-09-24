import { describe, expect, it } from 'vitest';
import {
  leftoverBoards,
  missionParams,
  planMaterialization,
  productParams,
  resourceParams,
  rikmaParams,
  LEFTOVER_BOARD_ROWS
} from './materializePlan.js';
import type { AssistantItem, AssistantState } from './types.js';

const it_ = (over: Partial<AssistantItem> & Pick<AssistantItem, 'key' | 'group' | 'label'>): AssistantItem => ({
  status: 'proposed',
  origin: 'agent',
  ...over
});

const state: AssistantState = {
  fields: { track: 'business', name: 'השקד', location: { lat: 32, lng: 34.8, radius: 5, hint: 'ת"א' }, currency: 'ILS' },
  items: [
    it_({ key: 'i1', group: 'products', label: 'סדנה', spec: { price: 180, unlimited: true, keywords: ['אפייה', 'workshop'], recipe: { missionKeys: ['i3'], resourceKeys: ['i5'] } } }),
    it_({ key: 'i2', group: 'products', label: 'מגש', spec: { pricingMode: 'quote' } }),
    it_({ key: 'i3', group: 'rikmaMissions', label: 'הנחיה', spec: { hours: 3, ratePerHour: 120, holder: 'me' } }),
    it_({ key: 'i4', group: 'rikmaMissions', label: 'רשתות', spec: { holder: 'partner', partnerKey: 'i6' } }),
    it_({ key: 'i5', group: 'rikmaResources', label: 'תנור', spec: { holder: 'me', quantity: 1 } }),
    it_({ key: 'i6', group: 'partners', label: 'דנה', spec: { email: 'd@x.co' } }),
    it_({ key: 'i7', group: 'rikmaResources', label: 'רכב', status: 'dropped', droppedFrom: 'proposed' }),
    it_({ key: 'i8', group: 'products', label: 'ישן', createdRef: { type: 'matanot', id: '9' } })
  ]
};

describe('planMaterialization', () => {
  it('creates the rikma first, then standalone rows, products, invites', () => {
    const plan = planMaterialization(state, ['i1', 'i2', 'i3', 'i4', 'i5', 'i6'], false);
    expect(plan.steps).toEqual([
      { type: 'createRikma' },
      { type: 'mission', key: 'i4' },
      { type: 'product', key: 'i1', missionKeys: ['i3'], resourceKeys: ['i5'] },
      { type: 'product', key: 'i2', missionKeys: [], resourceKeys: [] },
      { type: 'invite', key: 'i6', missionKeys: ['i4'], resourceKeys: [] }
    ]);
    expect(plan.skipped).toEqual([
      { key: 'i3', reason: 'inRecipe' },
      { key: 'i5', reason: 'inRecipe' }
    ]);
  });

  it('never creates a dropped or already-created row, and says why', () => {
    const plan = planMaterialization(state, ['i7', 'i8', 'nope'], true);
    expect(plan.skipped).toEqual([
      { key: 'i7', reason: 'dropped' },
      { key: 'i8', reason: 'created' },
      { key: 'nope', reason: 'unknown' }
    ]);
  });

  it('rows that were not ticked (and not dropped) become proposals, not losses', () => {
    const plan = planMaterialization(state, ['i2'], true);
    expect(plan.steps.at(-1)).toEqual({ type: 'seedLeftovers', keys: ['i1', 'i3', 'i4', 'i5'] });
    expect(plan.steps[0]).toEqual({ type: 'product', key: 'i2', missionKeys: [], resourceKeys: [] });
  });

  it('a recipe mission is standalone when its product was not ticked', () => {
    const plan = planMaterialization(state, ['i3'], true);
    expect(plan.steps[0]).toEqual({ type: 'mission', key: 'i3' });
  });

  it('with an existing rikma there is no createRikma step', () => {
    expect(planMaterialization(state, ['i2'], true).steps.some((s) => s.type === 'createRikma')).toBe(false);
  });

  it('nothing ticked and nothing left over → nothing to do', () => {
    const empty: AssistantState = { items: [it_({ key: 'i1', group: 'products', label: 'x', status: 'dropped' })] };
    expect(planMaterialization(empty, [], false).steps).toEqual([]);
  });
});

describe('params — exactly what the existing actions receive', () => {
  const ctx = { projectId: '77', userId: '5', memberCount: 1, vocab: { i4: { skillIds: ['s1'] } } };
  const byKey = (k: string) => state.items.find((x) => x.key === k)!;

  it('createWeave gets the fields, the default consent clock and split values', () => {
    expect(rikmaParams(state, { ids: ['1'], newNames: ['חדש'] })).toEqual({
      projectName: 'השקד',
      publicDescription: null,
      descripFor: null,
      linkToWebsite: null,
      restime: 'feh',
      timeToP: 'already',
      currency: 'ILS',
      vallueIds: ['1'],
      newVallueNames: ['חדש']
    });
  });

  it('a mission I hold is assigned to me; a partner mission stays open with resolved vocab', () => {
    expect(missionParams(byKey('i3'), ctx)).toMatchObject({ assignedUserId: '5', nhours: 3, valph: 120 });
    const partner = missionParams(byKey('i4'), ctx);
    expect(partner).toMatchObject({ projectId: '77', missionName: 'רשתות', skillIds: ['s1'] });
    expect(partner).not.toHaveProperty('assignedUserId');
  });

  it('a resource is self-assigned only in a one-member rikma, as the form does', () => {
    expect(resourceParams(byKey('i5'), ctx)).toMatchObject({ isAssigned: true, hm: 1, kindOf: 'total' });
    expect(resourceParams(byKey('i5'), { ...ctx, memberCount: 3 })).not.toHaveProperty('isAssigned');
  });

  it('a product with a recipe is estimated, with BOM lines and discovery keywords', () => {
    const p = productParams(byKey('i1'), { missions: [byKey('i3')], resources: [byKey('i5')] }, state, ctx);
    expect(p).toMatchObject({
      pricingMode: 'estimated',
      estimatedPrice: 180,
      kindOf: 'unlimited',
      unlimitedM: true,
      discoveryKeywords: 'אפייה, workshop',
      lat: 32,
      lng: 34.8,
      radius: 5,
      location_hint: 'ת"א'
    });
    expect(p).not.toHaveProperty('fixedPrice');
    expect(p.recipeMissions).toEqual([
      { name: 'הנחיה', hoursPerUnit: 3, unitsPerProduct: 1, ratePerHour: 120, notes: '', mode: 'createNew', assignedMemberId: '5' }
    ]);
  });

  it('a simple product with a price is fixed; without one it is quote', () => {
    const fixed = productParams(it_({ key: 'x', group: 'products', label: 'a', spec: { price: 50 } }), { missions: [], resources: [] }, state, ctx);
    expect(fixed).toMatchObject({ pricingMode: 'fixed', fixedPrice: 50, kindOf: 'total', quant: 1 });
    const quote = productParams(byKey('i2'), { missions: [], resources: [] }, state, ctx);
    expect(quote).toMatchObject({ pricingMode: 'quote' });
    expect(quote).not.toHaveProperty('discoveryKeywords');
  });
});

describe('leftoverBoards', () => {
  it('chunks rows into boards of the size seedPlanBoards keeps, and reports overflow', () => {
    const many: AssistantState = {
      items: Array.from({ length: 27 }, (_, i) => it_({ key: `i${i + 1}`, group: 'rikmaMissions', label: `m${i + 1}` }))
    };
    const { plan, overflow } = leftoverBoards(many, many.items.map((x) => x.key), 'עוד רעיונות');
    expect(plan.boards).toHaveLength(4);
    expect((plan.boards[0].items as unknown[]).length).toBe(LEFTOVER_BOARD_ROWS);
    expect(plan.boards.map((b) => b.title)).toEqual(['עוד רעיונות', 'עוד רעיונות (2)', 'עוד רעיונות (3)', 'עוד רעיונות (4)']);
    expect(overflow).toEqual(['i25', 'i26', 'i27']);
  });

  it('writes flat planning rows the boards understand', () => {
    const { plan } = leftoverBoards(state, ['i2', 'i3'], 'x');
    expect(plan.boards[0].items).toEqual([
      expect.objectContaining({ kind: 'product', name: 'מגש', imp: 'nice', price: null }),
      expect.objectContaining({ kind: 'mission', name: 'הנחיה', nhours: 3, valph: 120 })
    ]);
  });
});
