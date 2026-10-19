/**
 * The shop layer's contract — PLAN_SHOP_CUSTOMER_EXPERIENCE §5.1/§2.4/§2.5.
 *
 * Three promises are worth a red test each:
 *
 *   1. **The gallery degrades to exactly what the DTO always returned.** A row
 *      with only `pic` must produce a one-image array — not an empty one, not a
 *      duplicate of the cover.
 *   2. **A variant's price is the price the buyer pays.** The fallback to the
 *      product's price (and the `quote` product's veto over it) is the one
 *      calculation every storefront would otherwise re-implement.
 *   3. **Aggregates ignore switched-off variants** (`active: false`): a variant
 *      that is off the shelf must not add stock, must not lower the "from"
 *      price, and must never appear as the reason a product says "available".
 */

import { describe, it, expect } from 'vitest';
import {
  attributesOf,
  availabilityOf,
  axisKeyOf,
  buyingUnitOf,
  checkoutOf,
  deliveryOf,
  galleryOf,
  imageOf,
  optionAxesOf,
  optionsOf,
  priceRangeOf,
  shopText,
  stockTotalOf,
  toApiShop,
  variantsAvailabilityOf,
  variantsOf
} from './shop.js';

/** A Strapi media node, minimal. */
const media = (url: string, formats: Record<string, any> = {}) => ({
  data: { attributes: { url, formats } }
});

const PRODUCT_PRICE = 320;
const CURRENCY = 'ILS';

const variant = (
  id: string,
  attrs: Record<string, any> = {},
  matanotId = '1842'
) => ({
  id,
  attributes: {
    matanot: { data: { id: matanotId } },
    optionValues: [],
    ...attrs
  }
});

describe('galleryOf', () => {
  it('is exactly the old single-image payload when there is only `pic`', () => {
    const images = galleryOf(
      media('/uploads/one.jpg', {
        small: { url: '/uploads/one-small.jpg', width: 300, height: 300 }
      }),
      null
    );
    expect(images).toHaveLength(1);
    expect(images[0]).toMatchObject({ width: 300, height: 300 });
  });

  it('keeps the cover first and does not repeat it in the gallery', () => {
    const cover = media('/uploads/cover.jpg');
    const images = galleryOf(cover, {
      data: [
        { attributes: { url: '/uploads/cover.jpg' } },
        { attributes: { url: '/uploads/second.jpg' } }
      ]
    });
    expect(images.map((i) => i.url.endsWith('cover.jpg'))).toEqual([
      true,
      false
    ]);
    expect(images).toHaveLength(2);
  });

  it('prefers the large formats for gallery photos', () => {
    const image = imageOf(
      media('/uploads/x.jpg', { small: { url: '/uploads/x-small.jpg' } })
    );
    expect(image?.url).toContain('x-small.jpg');
    const gallery = galleryOf(
      null,
      media('/uploads/y.jpg', {
        hero: { url: '/uploads/y-hero.jpg', width: 1600, height: 1200 }
      })
    );
    expect(gallery[0]).toMatchObject({ width: 1600, height: 1200 });
  });

  it('caps the gallery', () => {
    const many = {
      data: Array.from({ length: 30 }, (_, i) => ({
        attributes: { url: `/uploads/${i}.jpg` }
      }))
    };
    expect(galleryOf(null, many)).toHaveLength(12);
  });
});

describe('axisKeyOf', () => {
  it('sorts the pairs and wraps every key — what `?option.` filters on', () => {
    expect(
      axisKeyOf([
        { key: 'size', value: 'M' },
        { key: 'color', value: 'Red' }
      ])
    ).toBe('|color:red|size:m|');
  });

  it('drops separators a value could smuggle in, and refuses an empty pair', () => {
    expect(axisKeyOf([{ key: 'size', value: 'm|color:red' }])).toBe(
      '|size:mcolorred|'
    );
    expect(axisKeyOf([])).toBe('');
    expect(axisKeyOf([{ key: 'size', value: '' }])).toBe('');
  });
});

describe('variantsOf', () => {
  const rows = [
    variant('77', {
      sku: 'KER-M-RED',
      optionValues: [
        { key: 'size', value: 'm', label: 'M' },
        { key: 'color', value: 'red', label: 'אדום' }
      ],
      price: 310,
      quant: 3,
      active: true,
      position: 2
    }),
    variant('78', {
      sku: 'KER-L-RED',
      optionValues: [{ key: 'size', value: 'l', label: 'L' }],
      price: null,
      quant: -1,
      active: true,
      position: 1
    }),
    variant('79', {
      sku: 'KER-S-RED',
      optionValues: [{ key: 'size', value: 's', label: 'S' }],
      price: 280,
      quant: 9,
      active: false,
      position: 0
    })
  ];

  it('resolves a missing variant price to the product price, and orders by position', () => {
    const variants = variantsOf(rows, {
      price: PRODUCT_PRICE,
      currency: CURRENCY
    });
    expect(variants.map((v) => v.sku)).toEqual([
      'KER-S-RED',
      'KER-L-RED',
      'KER-M-RED'
    ]);
    expect(variants.find((v) => v.sku === 'KER-L-RED')?.price).toBe(
      PRODUCT_PRICE
    );
    expect(variants.find((v) => v.sku === 'KER-M-RED')?.price).toBe(310);
  });

  it('a quote product leaves every variant without a price', () => {
    const variants = variantsOf(rows, { price: null, currency: CURRENCY });
    expect(variants.every((v) => v.price === null)).toBe(true);
  });

  it('derives a display name when the merchant did not write one', () => {
    const variants = variantsOf(rows, {
      price: PRODUCT_PRICE,
      currency: CURRENCY
    });
    expect(variants.find((v) => v.sku === 'KER-M-RED')?.name).toBe('M / אדום');
  });

  it('reads `-1` as unlimited, like every other stock field', () => {
    const variants = variantsOf(rows, {
      price: PRODUCT_PRICE,
      currency: CURRENCY
    });
    expect(variants.find((v) => v.sku === 'KER-L-RED')?.availability).toEqual({
      unlimited: true,
      quantity: null
    });
  });
});

describe('availability and the price range', () => {
  const variants = variantsOf(
    [
      variant('1', { price: 300, quant: 2, active: true }),
      variant('2', { price: 260, quant: 5, active: true }),
      variant('3', { price: 100, quant: 50, active: false }),
      variant('4', { price: 900, quant: 0, active: true })
    ],
    { price: PRODUCT_PRICE, currency: CURRENCY }
  );

  it('sums only the variants that are on the shelf', () => {
    expect(variantsAvailabilityOf(variants)).toEqual({
      unlimited: false,
      quantity: 7
    });
  });

  it('one unlimited variant makes the product unlimited', () => {
    const withUnlimited = variantsOf(
      [variant('1', { quant: 4 }), variant('2', { quant: -1 })],
      { price: PRODUCT_PRICE, currency: CURRENCY }
    );
    expect(variantsAvailabilityOf(withUnlimited)).toEqual({
      unlimited: true,
      quantity: null
    });
  });

  it('the range covers the active variants only', () => {
    expect(
      priceRangeOf({
        price: PRODUCT_PRICE,
        currency: CURRENCY,
        variants,
        variantsLoaded: true
      })
    ).toEqual({ min: 260, max: 900, currency: CURRENCY });
  });

  it('without variants it is the product price, both ends', () => {
    expect(
      priceRangeOf({
        price: PRODUCT_PRICE,
        currency: CURRENCY,
        variants: [],
        variantsLoaded: false,
        hasVariants: false
      })
    ).toEqual({ min: PRODUCT_PRICE, max: PRODUCT_PRICE, currency: CURRENCY });
  });

  it('a product known to have variants says nothing rather than understating', () => {
    expect(
      priceRangeOf({
        price: PRODUCT_PRICE,
        currency: CURRENCY,
        variants: [],
        variantsLoaded: false,
        hasVariants: true
      })
    ).toBeNull();
  });

  it('prefers the denormalized range when the variants were not loaded', () => {
    expect(
      priceRangeOf({
        price: PRODUCT_PRICE,
        currency: CURRENCY,
        variants: [],
        variantsLoaded: false,
        hasVariants: true,
        priceMin: 260,
        priceMax: 420
      })
    ).toEqual({ min: 260, max: 420, currency: CURRENCY });
  });

  it('a quote product has no range at all', () => {
    expect(
      priceRangeOf({
        price: null,
        currency: CURRENCY,
        variants: [],
        variantsLoaded: true,
        hasVariants: false
      })
    ).toBeNull();
  });

  it('a quote product stays rangeless even when the lifecycle wrote priceMin', () => {
    // The lifecycle copies `price` into `priceMin` whatever the pricing mode
    // (§2.4): a leftover price on a quote product must not leak this way.
    expect(
      priceRangeOf({
        price: null,
        currency: CURRENCY,
        variants: [],
        variantsLoaded: false,
        hasVariants: false,
        priceMin: 999,
        priceMax: 999
      })
    ).toBeNull();
  });

  it('reads the denormalized total, and never invents one', () => {
    expect(stockTotalOf({ stockTotal: -1 })).toEqual({
      unlimited: true,
      quantity: null
    });
    expect(stockTotalOf({ stockTotal: 0 })).toEqual({
      unlimited: false,
      quantity: 0
    });
    expect(stockTotalOf({})).toBeNull();
  });

  it('reads the unlimited flag once it is there — a counted -1 is a queue of one (§2.5)', () => {
    // The 0 − 1 case: a variant oversold by exactly one unit.
    expect(availabilityOf({ quant: -1, unlimited: false })).toEqual({ unlimited: false, quantity: -1 });
    expect(availabilityOf({ quant: 4, unlimited: true })).toEqual({ unlimited: true, quantity: null });
    // A row from before the flag keeps the old reading.
    expect(availabilityOf({ quant: -1 })).toEqual({ unlimited: true, quantity: null });
    expect(availabilityOf({ quant: -1, unlimited: null })).toEqual({ unlimited: true, quantity: null });
    expect(stockTotalOf({ stockTotal: -1, stockUnlimited: false })).toEqual({ unlimited: false, quantity: -1 });
    expect(stockTotalOf({ stockTotal: -1, stockUnlimited: true })).toEqual({ unlimited: true, quantity: null });
  });
});

describe('optionsOf', () => {
  it('orders the axes and their values, and keeps hex colours only when valid', () => {
    const options = optionsOf({
      data: [
        {
          id: '1',
          attributes: {
            key: 'color',
            name: 'צבע',
            position: 2,
            values: [
              { value: 'red', label: 'אדום', hex: '#c33', position: 1 },
              {
                value: 'blue',
                label: 'כחול',
                hex: 'javascript:alert(1)',
                position: 0
              }
            ]
          }
        },
        {
          id: '2',
          attributes: {
            key: 'size',
            name: 'מידה',
            position: 1,
            values: [
              { value: 'm', position: 1 },
              { value: 'l', label: 'L', position: 0 }
            ]
          }
        }
      ]
    });
    expect(options.map((o) => o.key)).toEqual(['size', 'color']);
    expect(options[0].values.map((v) => v.value)).toEqual(['l', 'm']);
    // No label ⇒ the value itself; a non-colour never travels as `hex`.
    expect(options[0].values[0]).toMatchObject({ value: 'l', label: 'L' });
    expect(options[0].values[1]).toMatchObject({ value: 'm', label: 'm' });
    expect(options[1].values[0]).toMatchObject({ value: 'blue', hex: null });
    expect(options[1].values[1].hex).toBe('#c33');
  });

  it('drops an option with no values — an axis with nothing to choose is not one', () => {
    expect(
      optionsOf({
        data: [{ id: '1', attributes: { key: 'size', values: [] } }]
      })
    ).toEqual([]);
  });
});

describe('the product-level shop fields', () => {
  it('keeps scalar attributes, drops HTML and bad keys', () => {
    expect(
      attributesOf({
        attributes: {
          material: 'חרס',
          audience: 'מבוגרים',
          seats: 12,
          vegan: true,
          'bad key': 'x',
          description: '<script>alert(1)</script>',
          nested: { a: 1 }
        }
      })
    ).toEqual({ material: 'חרס', audience: 'מבוגרים', seats: 12, vegan: true });
  });

  it('accepts only the delivery kinds it knows', () => {
    expect(
      deliveryOf({
        deliveryOptions: [
          { kind: 'pickup', note: 'בסטודיו', fee: 0, currency: 'ils' },
          { kind: 'teleport', note: 'no' },
          { kind: 'delivery', note: '<b>עד 5 ק"מ</b>', fee: '40' }
        ]
      })
    ).toEqual([
      { kind: 'pickup', note: 'בסטודיו', fee: 0, currency: 'ILS' },
      { kind: 'delivery', note: null, fee: 40, currency: null }
    ]);
  });

  it('refuses a maximum below the minimum instead of blocking every order', () => {
    expect(buyingUnitOf({ minOrder: 5, maxOrder: 2, unit: 'מקום' })).toEqual({
      unit: 'מקום',
      minOrder: 5,
      maxOrder: null,
      leadTimeHours: null
    });
  });

  it('a text field with `<` is not a text field we forward', () => {
    expect(shopText('<b>ק"ג</b>')).toBeNull();
    expect(shopText('  ק"ג  ')).toBe('ק"ג');
  });
});

describe('toApiShop — the whole block', () => {
  const base = {
    name: 'סדנת קרמיקה',
    price: PRODUCT_PRICE,
    quant: 4,
    pic: media('/uploads/cover.jpg')
  };

  it("with no shop row and no variants, it is today's product", () => {
    const shop = toApiShop(base, { price: PRODUCT_PRICE, currency: CURRENCY });
    expect(shop.images).toHaveLength(1);
    expect(shop.hasVariants).toBe(false);
    expect(shop.variants).toEqual([]);
    expect(shop.availability).toEqual(availabilityOf(base));
    expect(shop.options).toEqual([]);
    expect(shop.unit).toBeNull();
  });

  it('prefers the shop row over the product row for the fields it carries', () => {
    const shop = toApiShop(base, {
      price: PRODUCT_PRICE,
      currency: CURRENCY,
      extra: {
        stockTotal: -1,
        hasVariants: true,
        unit: 'מקום',
        externalKey: 'keramics-m',
        pics: { data: [{ attributes: { url: '/uploads/second.jpg' } }] }
      }
    });
    expect(shop.images).toHaveLength(2);
    expect(shop.hasVariants).toBe(true);
    expect(shop.availability).toEqual({ unlimited: true, quantity: null });
    expect(shop.unit).toBe('מקום');
    expect(shop.externalKey).toBe('keramics-m');
  });

  it('when the variants were loaded, they decide the availability and the range', () => {
    const shop = toApiShop(base, {
      price: PRODUCT_PRICE,
      currency: CURRENCY,
      variants: [
        variant('1', { price: 300, quant: 2 }),
        variant('2', { price: 260, quant: 0 })
      ]
    });
    expect(shop.availability).toEqual({ unlimited: false, quantity: 2 });
    expect(shop.priceRange).toEqual({ min: 260, max: 300, currency: CURRENCY });
  });
});

describe('optionAxesOf — the filter bar of GET /options', () => {
  const axes = {
    data: [
      {
        id: '1',
        attributes: {
          key: 'size',
          name: 'מידה',
          position: 1,
          values: [
            { value: 's', label: 'S', position: 1 },
            { value: 'm', label: 'M', position: 2 }
          ]
        }
      }
    ]
  };

  it('counts distinct products, not variants', () => {
    const products = [
      {
        optionValues: [
          { key: 'size', value: 'm' },
          { key: 'size', value: 'm' }
        ]
      },
      { optionValues: [{ key: 'size', value: 'm' }] }
    ];
    expect(optionAxesOf(axes, products)[0].values).toEqual([
      { value: 'm', label: 'M', products: 2 }
    ]);
  });

  it('drops a value with nothing behind it — a dead filter is a bug', () => {
    expect(
      optionAxesOf(axes, [{ optionValues: [{ key: 'size', value: 'm' }] }])[0]
        .values
    ).toEqual([{ value: 'm', label: 'M', products: 1 }]);
  });

  it('keeps a value that exists in the data but was never declared', () => {
    const products = [{ optionValues: [{ key: 'size', value: 'xl' }] }];
    expect(optionAxesOf(axes, products)[0].values).toEqual([
      { value: 'xl', label: null, products: 1 }
    ]);
  });

  it('matches case-insensitively — the save writes lower case, people do not', () => {
    const products = [{ optionValues: [{ key: 'SIZE', value: 'M' }] }];
    expect(optionAxesOf(axes, products)[0].values).toEqual([
      { value: 'm', label: 'M', products: 1 }
    ]);
  });

  it('drops an axis the merchant declared but nobody uses', () => {
    expect(optionAxesOf(axes, [])).toEqual([]);
  });
});

describe('checkout — what a storefront may sell in its own till (§3.2)', () => {
  it('sells a published fixed-price product', () => {
    expect(
      checkoutOf({ status: 'published', pricingMode: 'fixed', price: 280 })
    ).toBe(true);
  });

  it('a free fixed product is still sellable — 0 is a price', () => {
    expect(
      checkoutOf({ status: 'published', pricingMode: 'fixed', price: 0 })
    ).toBe(true);
  });

  it('never sells a price the rikma has not set', () => {
    expect(
      checkoutOf({ status: 'published', pricingMode: 'quote', price: null })
    ).toBe(false);
    expect(
      checkoutOf({ status: 'published', pricingMode: 'estimated', price: 300 })
    ).toBe(false);
    expect(
      checkoutOf({ status: 'published', pricingMode: 'fixed', price: null })
    ).toBe(false);
  });

  it('never sells a draft or an archived product', () => {
    expect(
      checkoutOf({ status: 'draft', pricingMode: 'fixed', price: 280 })
    ).toBe(false);
    expect(
      checkoutOf({ status: 'archived', pricingMode: 'fixed', price: 280 })
    ).toBe(false);
  });
});
