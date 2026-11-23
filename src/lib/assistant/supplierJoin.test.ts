import { describe, it, expect } from 'vitest';
import { parseBlueprint } from './blueprint.js';
import { areaToLocation, withServiceArea, previewProducts, sitePath, SupplierJoinSchema } from './supplierJoin.js';

const draft = {
  fields: { track: 'idea', name: 'צילום אירועים דנה' },
  products: [{ name: 'צילום חתונה', price: 6000, currency: 'ILS' }, { name: 'מגנטים' }]
};

describe('areaToLocation', () => {
  it('keeps a drawn point with its radius and hint', () => {
    expect(areaToLocation({ lat: 32.79, lng: 35.53, radius: 30, hint: 'טבריה' })).toEqual({
      lat: 32.79,
      lng: 35.53,
      radius: 30,
      hint: 'טבריה'
    });
  });

  it('an online-only area is online, with no point', () => {
    expect(areaToLocation({ isOnline: true, lat: null, lng: null })).toEqual({ isOnline: true });
  });

  it('says nothing for an area that has neither', () => {
    expect(areaToLocation({ lat: null, lng: null, radius: 15 })).toBeUndefined();
    expect(areaToLocation(undefined)).toBeUndefined();
  });
});

describe('withServiceArea', () => {
  it('puts the area on the rikma and the draft on the business track', () => {
    const out = withServiceArea(draft, { lat: 32.79, lng: 35.53, radius: 30 });
    expect(out.fields).toMatchObject({ track: 'business', name: 'צילום אירועים דנה', location: { lat: 32.79, lng: 35.53, radius: 30 } });
    expect(draft.fields.track).toBe('idea'); // a copy
  });

  it('the result is still a valid blueprint', () => {
    const out = withServiceArea(draft, { lat: 32.79, lng: 35.53, radius: 30 });
    const bp = parseBlueprint(out);
    expect('issues' in bp).toBe(false);
  });

  it('leaves an analysed location alone when nothing was drawn', () => {
    const withLoc = { ...draft, fields: { ...draft.fields, location: { isOnline: true } } };
    expect(withServiceArea(withLoc, { lat: null, lng: null }).fields).toMatchObject({ location: { isOnline: true } });
  });
});

describe('previewProducts', () => {
  it('names and prices only, capped', () => {
    expect(previewProducts(draft)).toEqual([{ name: 'צילום חתונה', price: 6000, currency: 'ILS' }, { name: 'מגנטים' }]);
    expect(previewProducts(draft, 1)).toHaveLength(1);
    expect(previewProducts(null)).toEqual([]);
    expect(previewProducts({ products: [null, { price: 3 }] })).toEqual([]);
  });
});

describe('sitePath', () => {
  it('turns the absolute www link into a same-site path', () => {
    expect(sitePath('https://www.1lev1.com/preview/rikma/studio/abc.def')).toBe('/preview/rikma/studio/abc.def');
    expect(sitePath('https://www.1lev1.com/hascama?agent=x')).toBe('/hascama?agent=x');
    expect(sitePath(undefined)).toBeUndefined();
    expect(sitePath('not a url')).toBeUndefined();
  });
});

describe('SupplierJoinSchema', () => {
  it('needs a name, an email and a draft', () => {
    expect(SupplierJoinSchema.safeParse({ name: 'דנה', email: 'D@x.co', blueprint: draft }).success).toBe(true);
    expect(SupplierJoinSchema.safeParse({ name: '', email: 'd@x.co', blueprint: draft }).success).toBe(false);
    expect(SupplierJoinSchema.safeParse({ name: 'דנה', email: 'nope', blueprint: draft }).success).toBe(false);
    expect(SupplierJoinSchema.safeParse({ name: 'דנה', email: 'd@x.co' }).success).toBe(false);
  });
});
