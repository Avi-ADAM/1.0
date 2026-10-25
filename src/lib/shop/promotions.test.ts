import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  moneyToMinorUnits,
  priceCart,
  promoPriceOf,
  type ActivePromotion,
  type CartLine
} from './promotions';

const NOW = '2026-11-01T12:00:00.000Z';
const noFloor = () => null;

function promo(value: Record<string, unknown>): ActivePromotion {
  return value as unknown as ActivePromotion;
}

const line = (
  value: Partial<CartLine> &
    Pick<CartLine, 'productId' | 'quantity' | 'unitPrice'>
): CartLine => ({
  variantId: null,
  ...value
});

const all = { all: true };

describe('priceCart — promotion examples', () => {
  it('chooses the best one row promotion and respects the BOM floor', () => {
    const quote = priceCart(
      [line({ productId: 'cup', quantity: 1, unitPrice: 110 })],
      [
        promo({
          id: 'pct',
          kind: 'item',
          scope: all,
          rule: { pct: 20 },
          status: 'active'
        }),
        promo({
          id: 'fixed',
          kind: 'item',
          scope: all,
          rule: { price: 89 },
          status: 'active'
        }),
        promo({
          id: 'ignored',
          kind: 'item',
          scope: all,
          rule: { pct: 90 },
          status: 'scheduled'
        })
      ],
      { now: NOW, floorOf: () => 90 }
    );

    expect(quote.lines[0]).toMatchObject({
      listPrice: 110,
      unitPrice: 90,
      lineTotal: 90,
      discount: 20,
      promotionId: 'fixed'
    });
    expect(quote.applied).toEqual([
      { promotionId: 'fixed', name: null, kind: 'item', discount: 20 }
    ]);
    expect(quote.total).toBe(90);
  });

  it('supports item price/off rules, scope exclusions, and half-open time windows', () => {
    const products = [
      line({
        productId: 'tea',
        quantity: 1,
        unitPrice: 25,
        categoryIds: ['drinks']
      }),
      line({
        productId: 'coffee',
        quantity: 1,
        unitPrice: 40,
        categoryIds: ['drinks']
      })
    ];
    const quote = priceCart(
      products,
      [
        promo({
          id: 'category',
          kind: 'store',
          scope: { categories: ['drinks'], exclude: ['coffee'] },
          rule: { pct: 10 },
          status: 'active',
          startsAt: '2026-11-01T12:00:00.000Z',
          endsAt: '2026-11-02T00:00:00.000Z'
        }),
        promo({
          id: 'ended',
          kind: 'item',
          scope: all,
          rule: { off: 20 },
          status: 'active',
          endsAt: NOW
        }),
        promo({
          id: 'future',
          kind: 'item',
          scope: all,
          rule: { price: 1 },
          status: 'active',
          startsAt: '2026-11-02T00:00:00.000Z'
        })
      ],
      { now: NOW, floorOf: noFloor }
    );

    expect(
      quote.lines.map(({ productId, lineTotal }) => [productId, lineTotal])
    ).toEqual([
      ['coffee', 40],
      ['tea', 22.5]
    ]);
    expect(quote.applied.map(({ promotionId }) => promotionId)).toEqual([
      'category'
    ]);
  });

  it('prices a mix-and-match bundle and allocates its reduction proportionally', () => {
    const quote = priceCart(
      [
        line({ lineId: 'mugs', productId: 'mugs', quantity: 3, unitPrice: 20 }),
        line({
          lineId: 'bowls',
          productId: 'bowls',
          quantity: 2,
          unitPrice: 45
        })
      ],
      [
        promo({
          id: 'five-for-100',
          name: '5 for 100',
          kind: 'bundle',
          scope: all,
          rule: { qty: 5, price: 100, repeat: true }
        })
      ],
      { now: NOW, floorOf: noFloor }
    );

    expect(quote.total).toBe(100);
    expect(
      quote.lines.map((row) => [
        row.productId,
        row.lineTotal,
        row.discount,
        row.promotionId
      ])
    ).toEqual([
      ['bowls', 60, 30, 'five-for-100'],
      ['mugs', 40, 20, 'five-for-100']
    ]);
    expect(quote.applied).toEqual([
      {
        promotionId: 'five-for-100',
        name: '5 for 100',
        kind: 'bundle',
        discount: 50
      }
    ]);
  });

  it('repeats complete bundles, leaves the remainder at list price, and hints toward the next one', () => {
    const quote = priceCart(
      [line({ productId: 'shirt', quantity: 5, unitPrice: 20 })],
      [
        promo({
          id: 'two-for-10',
          kind: 'bundle',
          scope: all,
          rule: { qty: 2, price: 10, repeat: true }
        })
      ],
      { now: NOW, floorOf: noFloor }
    );

    expect(quote.subtotal).toBe(40);
    expect(quote.total).toBe(40);
    expect(quote.lines[0].lineTotal).toBe(40);
    expect(quote.hints).toEqual([
      {
        kind: 'bundle',
        promotionId: 'two-for-10',
        missingQuantity: 1,
        bundleQuantity: 2,
        bundlePrice: 10
      }
    ]);
  });

  it('does not apply a bundle to a partial group, and does not raise a bundle price above list', () => {
    const partial = priceCart(
      [line({ productId: 'socks', quantity: 2, unitPrice: 10 })],
      [
        promo({
          id: 'three',
          kind: 'bundle',
          scope: all,
          rule: { qty: 3, price: 1, repeat: true }
        })
      ],
      { now: NOW, floorOf: noFloor }
    );
    const dearerOffer = priceCart(
      [line({ productId: 'socks', quantity: 3, unitPrice: 10 })],
      [
        promo({
          id: 'dearer',
          kind: 'bundle',
          scope: all,
          rule: { qty: 3, price: 50, repeat: true }
        })
      ],
      { now: NOW, floorOf: noFloor }
    );

    expect(partial).toMatchObject({
      total: 20,
      applied: [],
      hints: [{ kind: 'bundle', missingQuantity: 1 }]
    });
    expect(dearerOffer.total).toBe(30);
    expect(dearerOffer.applied).toEqual([]);
  });

  it('caps a bundle at the sum of its per-unit floors', () => {
    const quote = priceCart(
      [line({ productId: 'jar', quantity: 2, unitPrice: 100 })],
      [
        promo({
          id: 'loss-leader',
          kind: 'bundle',
          scope: all,
          rule: { qty: 2, price: 50, repeat: true }
        })
      ],
      { now: NOW, floorOf: () => 60 }
    );

    expect(quote.total).toBe(120);
    expect(quote.lines[0].unitPrice).toBe(60);
    expect(quote.lines[0].discount).toBe(80);
  });

  it('applies BXGY to the cheapest reward unit and spreads the saving across its rows', () => {
    const quote = priceCart(
      [
        line({ productId: 'lamp', quantity: 1, unitPrice: 100 }),
        line({ productId: 'shade', quantity: 1, unitPrice: 50 })
      ],
      [
        promo({
          id: 'bogo',
          kind: 'bxgy',
          scope: all,
          rule: { buy: 1, get: 1, getPct: 100, cheapestFree: true }
        })
      ],
      { now: NOW, floorOf: noFloor }
    );

    expect(quote.total).toBe(100);
    expect(
      quote.lines.map((row) => [row.productId, row.lineTotal, row.discount])
    ).toEqual([
      ['lamp', 66.67, 33.33],
      ['shade', 33.33, 16.67]
    ]);
    expect(quote.applied).toEqual([
      { promotionId: 'bogo', name: null, kind: 'bxgy', discount: 50 }
    ]);
  });

  it('chooses the cheapest eligible reward across the full cart, not just a top-priced prefix', () => {
    const quote = priceCart(
      [
        line({ productId: 'a-high', quantity: 1, unitPrice: 100 }),
        line({ productId: 'middle', quantity: 1, unitPrice: 50 }),
        line({ productId: 'z-low', quantity: 1, unitPrice: 25 })
      ],
      [
        promo({
          id: 'bogo',
          kind: 'bxgy',
          scope: all,
          rule: { buy: 1, get: 1, getPct: 100, cheapestFree: true }
        })
      ],
      { now: NOW, floorOf: noFloor }
    );

    expect(quote.total).toBe(150);
    expect(
      quote.lines.map((row) => [row.productId, row.lineTotal, row.promotionId])
    ).toEqual([
      ['a-high', 80, 'bogo'],
      ['middle', 50, null],
      ['z-low', 20, 'bogo']
    ]);
  });

  it('applies one best threshold after row promotions and keeps the floor', () => {
    const quote = priceCart(
      [
        line({ productId: 'a', quantity: 1, unitPrice: 200 }),
        line({ productId: 'b', quantity: 1, unitPrice: 200 })
      ],
      [
        promo({
          id: 'item',
          kind: 'item',
          scope: { products: ['a'] },
          rule: { pct: 50 },
          status: 'active'
        }),
        promo({
          id: 'threshold-30',
          kind: 'threshold',
          scope: all,
          rule: { minSubtotal: 300, off: 30 },
          status: 'active'
        }),
        promo({
          id: 'threshold-10',
          kind: 'threshold',
          scope: all,
          rule: { minSubtotal: 300, pct: 10 },
          status: 'active'
        })
      ],
      { now: NOW, floorOf: (row) => (row.productId === 'a' ? 90 : 180) }
    );

    expect(quote.subtotal).toBe(300);
    expect(quote.thresholdDiscount).toBe(30);
    expect(quote.total).toBe(270);
    expect(
      quote.lines.map((row) => [
        row.productId,
        row.lineTotal,
        row.thresholdPromotionId
      ])
    ).toEqual([
      ['a', 90, 'threshold-10'],
      ['b', 180, 'threshold-10']
    ]);
    expect(quote.applied).toEqual([
      { promotionId: 'item', name: null, kind: 'item', discount: 100 },
      {
        promotionId: 'threshold-10',
        name: null,
        kind: 'threshold',
        discount: 30
      }
    ]);
  });

  it('returns progress hints for unmet thresholds, based on post-row-promotion subtotal', () => {
    const quote = priceCart(
      [line({ productId: 'a', quantity: 1, unitPrice: 80 })],
      [
        promo({
          id: 'threshold',
          kind: 'threshold',
          scope: all,
          rule: { minSubtotal: 100, off: 15 }
        })
      ],
      { now: NOW, floorOf: noFloor }
    );

    expect(quote.hints).toEqual([
      {
        kind: 'threshold',
        promotionId: 'threshold',
        amountRemaining: 20,
        minSubtotal: 100
      }
    ]);
    expect(quote.thresholdDiscount).toBe(0);
    expect(quote.total).toBe(80);
  });

  it('returns a standalone price only for active item/store promotions', () => {
    const product = { id: 'coat', price: 100, categoryIds: ['winter'] };
    const variant = { id: 'large', price: 120 };
    const promos = [
      promo({
        id: 'bundle',
        kind: 'bundle',
        scope: all,
        rule: { qty: 2, price: 100, repeat: true }
      }),
      promo({
        id: 'winter',
        kind: 'store',
        scope: { categories: ['winter'] },
        rule: { pct: 20 }
      }),
      promo({
        id: 'fixed',
        kind: 'item',
        scope: { variants: ['large'] },
        rule: { price: 89 },
        endsAt: '2026-11-03T00:00:00.000Z'
      })
    ];

    expect(promoPriceOf(product, variant, promos, NOW, () => 90)).toEqual({
      price: 90,
      listPrice: 120,
      promotion: {
        id: 'fixed',
        name: null,
        kind: 'item',
        endsAt: '2026-11-03T00:00:00.000Z'
      }
    });
    expect(promoPriceOf(product, null, [promos[0]], NOW)).toBeNull();
    expect(
      promoPriceOf({ id: 'quote', price: null }, null, promos, NOW)
    ).toBeNull();
  });

  it('keeps cent arithmetic exact, including proportional rounding', () => {
    expect(moneyToMinorUnits(1.005)).toBe(101);
    const percentageQuote = priceCart(
      [line({ productId: 'penny', quantity: 3, unitPrice: 0.01 })],
      [promo({ id: 'half', kind: 'item', scope: all, rule: { pct: 50 } })],
      { now: NOW, floorOf: noFloor }
    );
    expect(percentageQuote.lines[0].lineTotal).toBe(0.01);
    expect(percentageQuote.lines[0].discount).toBe(0.02);
    const quote = priceCart(
      [
        line({ productId: 'a', quantity: 1, unitPrice: 10 }),
        line({ productId: 'b', quantity: 1, unitPrice: 10 })
      ],
      [
        promo({
          id: 'five-off',
          kind: 'threshold',
          scope: all,
          rule: { minSubtotal: 20, off: 0.01 }
        })
      ],
      { now: NOW, floorOf: noFloor }
    );
    expect(quote.total).toBe(19.99);
    expect(
      quote.lines.reduce(
        (sum, row) => sum + moneyToMinorUnits(row.lineTotal),
        0
      )
    ).toBe(1999);
  });

  it('rejects malformed cart rows and ignores ambiguous duplicate promotion IDs', () => {
    expect(() =>
      priceCart([line({ productId: 'x', quantity: 1.5, unitPrice: 10 })], [], {
        now: NOW,
        floorOf: noFloor
      })
    ).toThrow(/quantity/);
    const quote = priceCart(
      [line({ productId: 'x', quantity: 1, unitPrice: 100 })],
      [
        promo({ id: 'same', kind: 'item', scope: all, rule: { pct: 10 } }),
        promo({ id: 'same', kind: 'item', scope: all, rule: { pct: 90 } })
      ],
      { now: NOW, floorOf: noFloor }
    );
    expect(quote.total).toBe(100);
  });
});

describe('priceCart — invariants', () => {
  type RuleSpec =
    | {
        kind: 'item';
        rule: { pct: number } | { price: number } | { off: number };
      }
    | { kind: 'store'; rule: { pct: number } }
    | { kind: 'bundle'; rule: { qty: number; price: number; repeat: boolean } }
    | {
        kind: 'bxgy';
        rule: {
          buy: number;
          get: number;
          getPct: number;
          cheapestFree: boolean;
        };
      }
    | {
        kind: 'threshold';
        rule:
          | { minSubtotal: number; off: number }
          | { minSubtotal: number; pct: number };
      };

  const ruleArb: fc.Arbitrary<RuleSpec> = fc.oneof(
    fc.record({
      kind: fc.constant<'item'>('item'),
      rule: fc.record({ pct: fc.integer({ min: 0, max: 100 }) })
    }),
    fc.record({
      kind: fc.constant<'item'>('item'),
      rule: fc.record({
        price: fc.integer({ min: 0, max: 50000 }).map((c) => c / 100)
      })
    }),
    fc.record({
      kind: fc.constant<'item'>('item'),
      rule: fc.record({
        off: fc.integer({ min: 0, max: 50000 }).map((c) => c / 100)
      })
    }),
    fc.record({
      kind: fc.constant<'store'>('store'),
      rule: fc.record({ pct: fc.integer({ min: 0, max: 100 }) })
    }),
    fc.record({
      kind: fc.constant<'bundle'>('bundle'),
      rule: fc.record({
        qty: fc.integer({ min: 1, max: 6 }),
        price: fc.integer({ min: 0, max: 20000 }).map((c) => c / 100),
        repeat: fc.boolean()
      })
    }),
    fc.record({
      kind: fc.constant<'bxgy'>('bxgy'),
      rule: fc.record({
        buy: fc.integer({ min: 1, max: 3 }),
        get: fc.integer({ min: 1, max: 3 }),
        getPct: fc.integer({ min: 0, max: 100 }),
        cheapestFree: fc.boolean()
      })
    }),
    fc.record({
      kind: fc.constant<'threshold'>('threshold'),
      rule: fc.record({
        minSubtotal: fc.integer({ min: 0, max: 50000 }).map((c) => c / 100),
        off: fc.integer({ min: 0, max: 5000 }).map((c) => c / 100)
      })
    }),
    fc.record({
      kind: fc.constant<'threshold'>('threshold'),
      rule: fc.record({
        minSubtotal: fc.integer({ min: 0, max: 50000 }).map((c) => c / 100),
        pct: fc.integer({ min: 0, max: 100 })
      })
    })
  );

  const scenarioArb = fc
    .record({
      lineSpecs: fc.array(
        fc.record({
          quantity: fc.integer({ min: 1, max: 8 }),
          priceCents: fc.integer({ min: 0, max: 50000 }),
          floorCents: fc.integer({ min: 0, max: 50000 })
        }),
        { minLength: 1, maxLength: 6 }
      ),
      rules: fc.array(ruleArb, { maxLength: 6 })
    })
    .map(({ lineSpecs, rules }) => {
      const floors = new Map<string, number>();
      const lines = lineSpecs.map((spec, index) => {
        const productId = `product-${index}`;
        const unitPrice = spec.priceCents / 100;
        const floor = Math.min(spec.floorCents, spec.priceCents) / 100;
        floors.set(productId, floor);
        return line({
          lineId: `line-${index}`,
          productId,
          variantId: index % 2 ? `variant-${index}` : null,
          categoryIds: [`category-${index % 3}`],
          quantity: spec.quantity,
          unitPrice
        });
      });
      const promos = rules.map((spec, index) =>
        promo({
          id: `promotion-${index}`,
          kind: spec.kind,
          rule: spec.rule,
          scope: all,
          status: 'active',
          startsAt: '2026-10-01T00:00:00.000Z',
          endsAt: '2026-12-01T00:00:00.000Z'
        })
      );
      return { lines, floors, promos };
    });

  it('always reconciles line totals, applied discounts, and the floor/list bounds', () => {
    fc.assert(
      fc.property(scenarioArb, ({ lines, floors, promos }) => {
        const quote = priceCart(lines, promos, {
          now: NOW,
          floorOf: (row) => floors.get(row.productId) ?? null
        });
        const listSubtotalCents = lines.reduce(
          (sum, row) => sum + moneyToMinorUnits(row.unitPrice) * row.quantity,
          0
        );
        const lineTotalCents = quote.lines.reduce(
          (sum, row) => sum + moneyToMinorUnits(row.lineTotal),
          0
        );
        const appliedCents = quote.applied.reduce(
          (sum, item) => sum + moneyToMinorUnits(item.discount),
          0
        );

        expect(lineTotalCents).toBe(moneyToMinorUnits(quote.total));
        expect(
          moneyToMinorUnits(quote.subtotal) -
            moneyToMinorUnits(quote.thresholdDiscount)
        ).toBe(lineTotalCents);
        expect(listSubtotalCents - lineTotalCents).toBe(appliedCents);
        for (const row of quote.lines) {
          const floor = floors.get(row.productId) ?? 0;
          expect(row.lineTotal + 1e-8).toBeGreaterThanOrEqual(
            floor * row.quantity
          );
          expect(row.lineTotal).toBeLessThanOrEqual(
            row.listPrice * row.quantity + 1e-8
          );
          expect(row.unitPrice).toBeLessThanOrEqual(row.listPrice + 1e-8);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('is independent of cart-line and promotion input ordering', () => {
    fc.assert(
      fc.property(scenarioArb, ({ lines, floors, promos }) => {
        const ctx = {
          now: NOW,
          floorOf: (row: { productId: string }) =>
            floors.get(row.productId) ?? null
        };
        expect(
          priceCart([...lines].reverse(), [...promos].reverse(), ctx)
        ).toEqual(priceCart(lines, promos, ctx));
      }),
      { numRuns: 150 }
    );
  });

  it('adding a cart row cannot raise an existing item/store-priced row', () => {
    const simplePromotionArb = fc.array(
      fc.oneof(
        fc
          .integer({ min: 0, max: 100 })
          .map((pct) => ({ kind: 'item' as const, rule: { pct } })),
        fc.integer({ min: 0, max: 50000 }).map((cents) => ({
          kind: 'item' as const,
          rule: { price: cents / 100 }
        })),
        fc.integer({ min: 0, max: 50000 }).map((cents) => ({
          kind: 'item' as const,
          rule: { off: cents / 100 }
        })),
        fc
          .integer({ min: 0, max: 100 })
          .map((pct) => ({ kind: 'store' as const, rule: { pct } }))
      ),
      { maxLength: 5 }
    );
    fc.assert(
      fc.property(
        scenarioArb,
        simplePromotionArb,
        ({ lines, floors }, rules) => {
          const promos = rules.map((spec, index) =>
            promo({
              id: `p-${index}`,
              kind: spec.kind,
              rule: spec.rule,
              scope: all,
              status: 'active'
            })
          );
          const extra = line({
            lineId: 'extra',
            productId: 'z-extra',
            quantity: 1,
            unitPrice: 123.45
          });
          const ctx = {
            now: NOW,
            floorOf: (row: { productId: string }) =>
              floors.get(row.productId) ?? null
          };
          const before = priceCart(lines, promos, ctx);
          const after = priceCart([...lines, extra], promos, ctx);
          for (const oldLine of before.lines) {
            const same = after.lines.find(
              (candidate) => candidate.lineId === oldLine.lineId
            );
            expect(same?.unitPrice).toBeLessThanOrEqual(
              oldLine.unitPrice + 1e-8
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
