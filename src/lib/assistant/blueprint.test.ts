import { describe, expect, it } from 'vitest';
import { blueprintToState, parseBlueprint } from './blueprint.js';

const cafe = {
  fields: {
    track: 'business',
    name: 'בית קפה השקד',
    publicDescription: 'קפה ומאפים בשכונה',
    linkToWebsite: 'https://my-cafe.co.il',
    vals: ['קהילה'],
    location: { lat: 32.08, lng: 34.78, radius: 10, hint: 'תל אביב' },
    currency: 'ils'
  },
  products: [
    { name: 'סדנת אפייה', price: 180, unlimited: true, keywords: ['סדנה', 'אפייה', 'baking workshop'], recipe: { missions: ['teach'], resources: ['oven'] } },
    { name: 'מגש אירוח', keywords: ['קייטרינג'] }
  ],
  missions: [
    { ref: 'teach', name: 'הנחיית סדנה', hours: 3, ratePerHour: 120, holder: 'me' },
    { ref: 'social', name: 'ניהול רשתות', holder: 'partner', partnerRef: 'dana', skills: ['שיווק'] }
  ],
  resources: [{ ref: 'oven', name: 'תנור', kindOf: 'total', price: 0, holder: 'me' }],
  partners: [{ ref: 'dana', name: 'דנה', email: 'Dana@Example.com' }]
};

describe('parseBlueprint', () => {
  it('accepts a full blueprint and fills empty lists', () => {
    const r = parseBlueprint({ fields: { track: 'idea', name: 'x' } });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.products).toEqual([]);
  });

  it('reports what is wrong instead of throwing', () => {
    const r = parseBlueprint({ fields: { track: 'shop', name: '' }, products: [{ name: 'a', price: -1 }] });
    expect(r.ok).toBe(false);
    if ('issues' in r) expect(r.issues.map((i) => i.path)).toEqual(expect.arrayContaining(['fields.track', 'fields.name', 'products.0.price']));
  });

  it('refuses a non-http website', () => {
    expect(parseBlueprint({ fields: { track: 'business', name: 'x', linkToWebsite: 'javascript:alert(1)' } }).ok).toBe(false);
  });
});

describe('blueprintToState', () => {
  const parsed = parseBlueprint(cafe);
  if (!parsed.ok) throw new Error('fixture must parse');
  const { state, warnings } = blueprintToState(parsed.value);
  const byLabel = (l: string) => state.items.find((it) => it.label === l)!;

  it('orders rows products → missions → resources → partners with fresh keys', () => {
    expect(state.items.map((it) => [it.key, it.group])).toEqual([
      ['i1', 'products'],
      ['i2', 'products'],
      ['i3', 'rikmaMissions'],
      ['i4', 'rikmaMissions'],
      ['i5', 'rikmaResources'],
      ['i6', 'partners']
    ]);
    expect(state.items.every((it) => it.status === 'proposed' && it.origin === 'agent')).toBe(true);
    expect(warnings).toEqual([]);
  });

  it('turns recipe refs into keys', () => {
    expect(byLabel('סדנת אפייה').spec).toMatchObject({
      price: 180,
      pricingMode: 'fixed',
      unlimited: true,
      recipe: { missionKeys: ['i3'], resourceKeys: ['i5'] }
    });
  });

  it('a product without a price is priced on request', () => {
    expect(byLabel('מגש אירוח').spec).toMatchObject({ pricingMode: 'quote', keywords: ['קייטרינג'] });
  });

  it('links a partner row by key and normalises the email', () => {
    expect(byLabel('ניהול רשתות').spec).toMatchObject({ holder: 'partner', partnerKey: 'i6', skills: ['שיווק'] });
    expect(byLabel('דנה').spec).toEqual({ email: 'dana@example.com' });
  });

  it('keeps the rikma fields, currency upper-cased', () => {
    expect(state.fields).toMatchObject({ track: 'business', name: 'בית קפה השקד', currency: 'ILS', vals: ['קהילה'] });
    expect(state.fields?.location).toEqual({ lat: 32.08, lng: 34.78, radius: 10, hint: 'תל אביב' });
  });

  it('a dangling ref becomes a warning, not a failure', () => {
    const p = parseBlueprint({
      fields: { track: 'idea', name: 'x' },
      products: [{ name: 'a', recipe: { missions: ['ghost'] } }],
      missions: [{ name: 'b', holder: 'partner', partnerRef: 'nobody' }]
    });
    if (!p.ok) throw new Error('must parse');
    const r = blueprintToState(p.value);
    expect(r.warnings.map((w) => w.where)).toEqual(['products[0].recipe.missions', 'missions[0]']);
    expect(r.state.items[0].spec?.recipe).toBeUndefined();
    expect(r.state.items[1].spec).toMatchObject({ holder: 'open' });
  });
});
