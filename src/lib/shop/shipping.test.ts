import { describe, expect, it } from 'vitest';
import {
  configProblems,
  lowestFreeOver,
  methodFee,
  nextDispatchOf,
  normalizeShippingConfig,
  orderShippingOf,
  placeKeys,
  quoteShipping,
  readOrderShipping,
  zoneFor,
  type QuoteItem
} from './shipping';

const config = normalizeShippingConfig({
  enabled: true,
  handlingDays: 1,
  zones: [
    {
      id: 'center',
      name: 'גוש דן',
      cities: ['תל אביב - יפו', 'רמת גן'],
      methods: [
        { id: 'courier', name: 'שליח עד הבית', fee: 30, perItem: 5, freeOver: 300, etaMinDays: 1, etaMaxDays: 2 },
        { id: 'express', name: 'שליח באותו יום', fee: 60, minSubtotal: 100 }
      ]
    },
    {
      id: 'north',
      name: 'הצפון',
      districts: ['חיפה', 'עכו'],
      methods: [{ id: 'tue', name: 'משלוח שבועי', fee: 40, days: [2] }]
    },
    {
      id: 'abroad',
      name: 'חו"ל',
      countries: ['US', 'GB'],
      methods: [
        { id: 'post', name: 'דואר רשום', fee: 0, perKg: 50, tiersBy: 'weight', tiers: [{ from: 0, fee: 80 }, { from: 2, fee: 140 }], maxWeightKg: 10 }
      ]
    },
    { id: 'rest', name: 'שאר הארץ', countries: ['IL'], methods: [{ id: 'post', name: 'דואר', fee: 45 }] }
  ],
  pickupPoints: [{ id: 'studio', name: 'בסטודיו', city: 'יפו', address: 'יפת 1', hours: 'א׳–ה׳ 10–18' }],
  products: [
    { productId: '9', kinds: ['pickup'] },
    { productId: '8', surcharge: 25 },
    { productId: '7', kinds: ['digital'] }
  ]
});

const item = (over: Partial<QuoteItem> = {}): QuoteItem => ({
  productId: '1',
  variantId: null,
  quantity: 1,
  unitPrice: 100,
  weightGrams: 500,
  productKinds: [],
  ...over
});

const NOW = new Date('2026-10-19T09:00:00Z'); // a Monday

describe('normalizeShippingConfig', () => {
  it('reads garbage as an empty, disabled config', () => {
    for (const raw of [null, 'x', 42, [], '{bad']) {
      const c = normalizeShippingConfig(raw);
      expect(c.enabled).toBe(false);
      expect(c.zones).toEqual([]);
    }
  });

  it('keeps sane ids, repairs duplicates, and drops what is out of range', () => {
    const c = normalizeShippingConfig({
      zones: [
        { id: 'a', name: ' A ', countries: ['il', 'Israel'], methods: [{ id: 'm', fee: -5, days: [9, 2, 2] }, { id: 'm', fee: '12.345' }] },
        { id: 'a', name: 'B', everywhere: true, methods: [] }
      ]
    });
    expect(c.zones.map((z) => z.id)).toEqual(['a', 'z2']);
    expect(c.zones[0].countries).toEqual(['IL']);
    expect(c.zones[0].methods.map((m) => [m.id, m.fee])).toEqual([['m', 0], ['m2', 12.35]]);
    expect(c.zones[0].methods[0].days).toEqual([2]);
  });

  it('reads a JSON string as Strapi may hand it back', () => {
    expect(normalizeShippingConfig(JSON.stringify({ enabled: true })).enabled).toBe(true);
  });

  it('drops a product row that says nothing', () => {
    const c = normalizeShippingConfig({ products: [{ productId: '5' }, { productId: 'x', surcharge: 3 }] });
    expect(c.products).toEqual([]);
  });
});

describe('zones', () => {
  it('compares place names the way people spell them', () => {
    expect(placeKeys('תל אביב - יפו')).toEqual(['תל אביב יפו', 'תל אביב']);
    expect(zoneFor(config, { city: 'תל-אביב' })?.id).toBe('center');
    expect(zoneFor(config, { city: 'תל אביב יפו' })?.id).toBe('center');
  });

  it('matches a district the server resolved, and the first zone wins', () => {
    expect(zoneFor(config, { city: 'נהריה', district: 'עכו' })?.id).toBe('north');
    expect(zoneFor(config, { city: 'באר שבע', district: 'באר שבע' })?.id).toBe('rest');
  });

  it('matches countries, and a missing country is Israel', () => {
    expect(zoneFor(config, { country: 'us', city: 'Boston' })?.id).toBe('abroad');
    expect(zoneFor(config, { country: 'FR', city: 'Paris' })).toBeNull();
    expect(zoneFor(config, { city: 'אילת' })?.id).toBe('rest');
  });

  it('matches postal prefixes', () => {
    const c = normalizeShippingConfig({ zones: [{ name: 'z', postalPrefixes: ['61'], methods: [{ name: 'm' }] }] });
    expect(zoneFor(c, { zip: '6100000' })).not.toBeNull();
    expect(zoneFor(c, { zip: '5200000' })).toBeNull();
  });
});

describe('methodFee', () => {
  const m = config.zones[0].methods[0];
  it('adds per extra unit and surcharges, and waives the base over the threshold', () => {
    expect(methodFee(m, { subtotal: 100, units: 3, weightKg: 1, surcharge: 0 })).toEqual({ fee: 40, free: false });
    expect(methodFee(m, { subtotal: 300, units: 3, weightKg: 1, surcharge: 25 })).toEqual({ fee: 25, free: true });
  });

  it('prices by weight tier plus per started kg, and is not offered over the cap', () => {
    const post = config.zones[2].methods[0];
    expect(methodFee(post, { subtotal: 0, units: 1, weightKg: 0.4, surcharge: 0 })?.fee).toBe(130);
    expect(methodFee(post, { subtotal: 0, units: 1, weightKg: 2.5, surcharge: 0 })?.fee).toBe(290);
    expect(methodFee(post, { subtotal: 0, units: 1, weightKg: 11, surcharge: 0 })).toBeNull();
  });

  it('is not offered under its minimum order', () => {
    const express = config.zones[0].methods[1];
    expect(methodFee(express, { subtotal: 99, units: 1, weightKg: 0, surcharge: 0 })).toBeNull();
  });
});

describe('quoteShipping', () => {
  it('asks for an address before it can price delivery, and still offers pickup', () => {
    const q = quoteShipping(config, [item()], null, NOW);
    expect(q.needsAddress).toBe(true);
    expect(q.options.map((o) => o.id)).toEqual(['p:studio']);
  });

  it('prices the zone methods cheapest first, then pickup', () => {
    const q = quoteShipping(config, [item({ quantity: 2 })], { city: 'רמת גן' }, NOW);
    expect(q.zone?.id).toBe('center');
    expect(q.options.map((o) => [o.id, o.fee])).toEqual([
      ['m:center:courier', 35],
      ['m:center:express', 60],
      ['p:studio', 0]
    ]);
    expect(q.options[0].freeOverRemaining).toBe(100);
  });

  it('a pickup-only product removes delivery and says why', () => {
    const q = quoteShipping(config, [item(), item({ productId: '9' })], { city: 'רמת גן' }, NOW);
    expect(q.options.map((o) => o.kind)).toEqual(['pickup']);
    expect(q.noDeliveryProducts).toEqual(['9']);
  });

  it('a surcharge is per unit of that product, and survives free shipping', () => {
    const q = quoteShipping(config, [item({ productId: '8', quantity: 2, unitPrice: 200 })], { city: 'רמת גן' }, NOW);
    expect(q.options[0]).toMatchObject({ id: 'm:center:courier', fee: 50, free: true });
  });

  it('a digital cart is delivered digitally and needs no address', () => {
    const q = quoteShipping(config, [item({ productId: '7' })], null, NOW);
    expect(q.options.map((o) => o.kind)).toEqual(['digital']);
    expect(q.needsAddress).toBe(false);
  });

  it('outside every zone: pickup, else "we will be in touch"', () => {
    const q = quoteShipping(config, [item()], { country: 'FR', city: 'Paris' }, NOW);
    expect(q.outsideZones).toBe(true);
    expect(q.options.map((o) => o.kind)).toEqual(['pickup']);
    const noPickup = normalizeShippingConfig({ ...config, pickupPoints: [] });
    expect(quoteShipping(noPickup, [item()], { country: 'FR' }, NOW).options.map((o) => o.kind)).toEqual(['contact']);
  });

  it('honours the product’s own delivery kinds when the tab has no override', () => {
    const q = quoteShipping(config, [item({ productKinds: ['pickup', 'contact'] })], { city: 'רמת גן' }, NOW);
    expect(q.options.map((o) => o.kind)).toEqual(['pickup']);
  });

  it('flags unknown weight only when a method prices by weight', () => {
    expect(quoteShipping(config, [item({ weightGrams: null })], { city: 'רמת גן' }, NOW).weightUnknown).toBe(false);
    expect(quoteShipping(config, [item({ weightGrams: null })], { country: 'US' }, NOW).weightUnknown).toBe(true);
  });

  it('gives the next dispatch day after the handling time', () => {
    const q = quoteShipping(config, [item()], { city: 'חיפה', district: 'חיפה' }, NOW);
    expect(q.options[0].nextDispatch).toBe('2026-10-20'); // Tuesday, one working day after Monday
  });
});

describe('small helpers', () => {
  it('nextDispatchOf skips Friday and Saturday as working days', () => {
    expect(nextDispatchOf([0], 1, new Date('2026-10-22T10:00:00Z'))).toBe('2026-10-25'); // Thu +1 → Sun
    expect(nextDispatchOf([], 1, NOW)).toBeNull();
  });

  it('nextDispatchOf counts from the shop’s day, not UTC’s', () => {
    // 01:30 on Tuesday in Israel is still Monday in UTC — Monday's run has gone.
    expect(nextDispatchOf([1], 0, new Date('2026-10-19T22:30:00Z'))).toBe('2026-10-26');
  });

  it('lowestFreeOver reads every zone', () => {
    expect(lowestFreeOver(config)).toBe(300);
  });

  it('configProblems names what blocks a save', () => {
    const c = normalizeShippingConfig({ enabled: true, zones: [{ id: 'x', methods: [{ id: 'y' }] }] });
    expect(configProblems(c).map((p) => p.kind)).toEqual(['zoneName', 'zoneEmpty', 'methodName']);
    expect(configProblems(config)).toEqual([]);
  });

  it('an order’s shipping round-trips through its stored JSON', () => {
    const q = quoteShipping(config, [item()], { city: 'רמת גן' }, NOW);
    const stored = orderShippingOf(q.options[0], q.options[0].id, 30);
    expect(readOrderShipping(JSON.parse(JSON.stringify(stored)))).toEqual(stored);
    expect(readOrderShipping({})).toBeNull();
  });
});
