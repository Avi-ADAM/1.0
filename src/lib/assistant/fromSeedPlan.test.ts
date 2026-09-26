import { describe, expect, it } from 'vitest';
import { boardItemsToBlueprint, seedPlanToBlueprint, type SeedBoardLike } from './fromSeedPlan.js';
import { blueprintToState } from './blueprint.js';

const cafe = { name: 'בית קפה השקד', desc: 'קפה ומאפים בשכונה', vals: ['קהילה', ''] };

// Model output, so deliberately not type-clean (a number among the skills).
const boards = [
  {
    title: 'מה אנחנו מוכרים',
    items: [
      { kind: 'product', name: 'סדנת אפייה', descrip: 'שלוש שעות', rationale: 'באתר: 180 ₪', price: 180, kindOf: 'total', quantity: 12 },
      { kind: 'product', name: 'מגש אירוח', price: null, kindOf: 'weird' },
      { kind: 'product', name: 'סדנת אפייה', price: 999 }
    ]
  },
  {
    title: 'להקים את המטבח',
    items: [
      { kind: 'mission', name: 'ניהול רשתות', skills: ['שיווק', 7], nhours: 10, valph: 0 },
      { kind: 'resource', name: 'תנור', kindOf: 'rent', price: 300, quantity: 1 },
      { kind: 'act', name: 'לצלם את המנות' },
      { kind: 'note', name: 'לבדוק רישוי' }
    ]
  }
] as unknown as SeedBoardLike[];

describe('seedPlanToBlueprint', () => {
  it('turns seed rows into a business blueprint, products first', () => {
    const bp = seedPlanToBlueprint(cafe, boards, { sourceUrl: 'https://my-cafe.co.il' })!;
    expect(bp.fields).toMatchObject({
      track: 'business',
      name: 'בית קפה השקד',
      publicDescription: 'קפה ומאפים בשכונה',
      linkToWebsite: 'https://my-cafe.co.il',
      vals: ['קהילה']
    });
    expect(bp.products.map((p) => p.name)).toEqual(['סדנת אפייה', 'מגש אירוח']);
    expect(bp.products[0]).toMatchObject({ price: 180, pricingMode: 'fixed', kindOf: 'total', quant: 12, why: 'באתר: 180 ₪' });
    // No price stated → price on request; an unknown kindOf is dropped, not guessed.
    expect(bp.products[1]).toMatchObject({ pricingMode: 'quote' });
    expect(bp.products[1].kindOf).toBeUndefined();
    expect(bp.products[1].price).toBeUndefined();
  });

  it("defaults holders to the owner and keeps only positive numbers", () => {
    const bp = seedPlanToBlueprint(cafe, boards)!;
    expect(bp.missions).toHaveLength(1);
    expect(bp.missions[0]).toMatchObject({ name: 'ניהול רשתות', holder: 'me', hours: 10, skills: ['שיווק'] });
    expect(bp.missions[0].ratePerHour).toBeUndefined();
    expect(bp.resources[0]).toMatchObject({ name: 'תנור', holder: 'me', kindOf: 'rent', price: 300, quantity: 1 });
  });

  it('leaves acts and notes out', () => {
    const bp = seedPlanToBlueprint(cafe, boards)!;
    const names = [...bp.products, ...bp.missions, ...bp.resources].map((r) => r.name);
    expect(names).not.toContain('לצלם את המנות');
    expect(names).not.toContain('לבדוק רישוי');
  });

  it('returns null when there is nothing to review', () => {
    expect(seedPlanToBlueprint({ name: '' }, boards)).toBeNull();
    expect(seedPlanToBlueprint(cafe, [])).toBeNull();
    expect(seedPlanToBlueprint(cafe, [{ items: [{ kind: 'act', name: 'x' }] }])).toBeNull();
  });

  it('drops a bad website instead of failing the draft', () => {
    const bp = seedPlanToBlueprint(cafe, boards, { sourceUrl: 'javascript:alert(1)' })!;
    expect(bp).not.toBeNull();
    expect(bp.fields.linkToWebsite).toBeUndefined();
  });

  it('feeds blueprintToState without warnings', () => {
    const { state, warnings } = blueprintToState(seedPlanToBlueprint(cafe, boards)!, { origin: 'extract' });
    expect(warnings).toEqual([]);
    expect(state.items.map((i) => i.group)).toEqual(['products', 'products', 'rikmaMissions', 'rikmaResources']);
    expect(state.items.every((i) => i.origin === 'extract' && i.status === 'proposed')).toBe(true);
  });
});

describe('keywords and categories', () => {
  it('ride from a seed row, and from a board row, onto the product', () => {
    const row = { kind: 'product', name: 'מגש בוקר', keywords: ['בראנץ׳', 'אירוח'], categories: ['אוכל', 'אירועים', 'מתנות', 'עודף'] };
    const bp = seedPlanToBlueprint(cafe, [{ items: [row] }])!;
    expect(bp.products[0]).toMatchObject({ keywords: ['בראנץ׳', 'אירוח'], categories: ['אוכל', 'אירועים', 'מתנות'] });

    const fromBoard = boardItemsToBlueprint(
      [{ id: 7, attributes: { kind: 'product', name: 'מגש בוקר', status: 'proposed', spec: { keywords: ['אירוח'], categories: ['אוכל'] } } }],
      { name: 'השקד' }
    )!;
    expect(fromBoard.blueprint.products[0]).toMatchObject({ keywords: ['אירוח'], categories: ['אוכל'] });
    const { state } = blueprintToState(fromBoard.blueprint);
    expect(state.items[0].spec).toMatchObject({ keywords: ['אירוח'], categories: ['אוכל'] });
  });
});
