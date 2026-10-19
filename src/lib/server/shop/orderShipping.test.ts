import { describe, expect, it } from 'vitest';
import { shippingRecordFrom } from './orderShipping';
import { normalizeShippingConfig, quoteShipping } from '$lib/shop/shipping';
import { findLocality, localityOf, searchLocalities } from '$lib/server/places/israel';

const config = normalizeShippingConfig({
  enabled: true,
  zones: [{ id: 'center', name: 'מרכז', cities: ['רמת גן'], methods: [{ id: 'courier', name: 'שליח', fee: 30 }] }],
  pickupPoints: [{ id: 'studio', name: 'סטודיו' }]
});
const quote = quoteShipping(
  config,
  [{ productId: '1', variantId: null, quantity: 1, unitPrice: 50, weightGrams: null, productKinds: [] }],
  { city: 'רמת גן' }
);

describe('shippingRecordFrom', () => {
  it('records the chosen option with the zone, and no note when the fee agrees', () => {
    const r = shippingRecordFrom(quote, { preference: 'delivery', optionId: 'm:center:courier', fee: 30 });
    expect(r.note).toBeNull();
    expect(r.record).toMatchObject({ optionId: 'm:center:courier', zoneId: 'center', fee: 30, quotedFee: 30 });
  });

  it('a fee that moved is a note, not a refusal', () => {
    const r = shippingRecordFrom(quote, { preference: 'delivery', optionId: 'm:center:courier', fee: 20 });
    expect(r.note).toContain('(20)');
    expect(r.record.fee).toBe(20);
  });

  it('an option that is no longer offered is a note too', () => {
    const r = shippingRecordFrom(quote, { preference: 'delivery', optionId: 'm:north:post', fee: 20 });
    expect(r.note).toContain('m:north:post');
    expect(r.record.zoneId).toBeNull();
  });

  it('an older storefront without an option id gets the first option of its kind', () => {
    const r = shippingRecordFrom(quote, { preference: 'pickup', optionId: null, fee: null });
    expect(r.record).toMatchObject({ optionId: 'p:studio', pickupPointName: 'סטודיו' });
  });
});

describe('places', () => {
  const list = [
    { סמל_ישוב: '5000', שם_ישוב: 'תל אביב - יפו ', שם_ישוב_לועזי: 'TEL AVIV - YAFO', שם_נפה: 'תל אביב' },
    { סמל_ישוב: '8600', שם_ישוב: 'רמת גן', שם_ישוב_לועזי: 'RAMAT GAN', שם_נפה: 'רמת גן' },
    { סמל_ישוב: '0', שם_ישוב: 'לא רשום', שם_ישוב_לועזי: '', שם_נפה: '' }
  ]
    .map(localityOf)
    .filter((l) => !!l);

  it('reads the CBS rows, dropping the placeholder', () => {
    expect(list.map((l) => l!.name)).toEqual(['תל אביב - יפו', 'רמת גן']);
    expect(list[0]!.nameEn).toBe('Tel Aviv - Yafo');
  });

  it('finds a locality by the name people use, in Hebrew or English', () => {
    expect(findLocality(list as any, 'תל-אביב')?.district).toBe('תל אביב');
    expect(searchLocalities(list as any, 'ramat').map((l) => l.code)).toEqual(['8600']);
  });
});
