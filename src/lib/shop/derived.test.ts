import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveProductFields, type DeriveVariant } from './derived';

const variants: DeriveVariant[] = [
  { price: 480, quant: 4, active: true, position: 0, optionValues: [{ key: 'height', value: '65', label: '65' }, { key: 'finish', value: 'nat', label: 'טבעי' }] },
  { price: null, quant: 2, active: true, position: 1, optionValues: [{ key: 'height', value: '75', label: '75' }, { key: 'finish', value: 'nat', label: 'טבעי' }] },
  { price: 900, quant: 50, active: false, position: 2, optionValues: [{ key: 'height', value: '95', label: '95' }] }
];
const options = [
  { key: 'finish', name: 'גימור', position: 1 },
  { key: 'height', name: 'גובה', position: 0 }
];

const cases: Array<[string, Parameters<typeof deriveProductFields>]> = [
  ['a plain product', [{ price: 120, quant: 7 }, [], null]],
  ['a plain product without a stock count', [{ price: 120, quant: null }, [], null]],
  ['a quote product', [{ price: null, quant: 3 }, [], null]],
  ['variants', [{ price: 500, quant: 99 }, variants, options]],
  ['an unlimited variant', [{ price: 500 }, [...variants, { price: 10, quant: -1, active: true, optionValues: '[]' }], options]],
  ['every variant off', [{ price: 500, quant: 9 }, [{ ...variants[2] }], options]]
];

describe('deriveProductFields', () => {
  it('a plain product mirrors its own price and stock', () => {
    expect(deriveProductFields({ price: 120, quant: 7 }, [])).toEqual({
      hasVariants: false,
      priceMin: 120,
      priceMax: 120,
      stockTotal: 7,
      variantAxes: null
    });
    expect(deriveProductFields({ price: 120, quant: null }, []).stockTotal).toBe(-1);
  });

  it('counts only active variants, a variant without a price costs the product price', () => {
    const d = deriveProductFields({ price: 500, quant: 99 }, variants, options);
    expect(d).toMatchObject({ hasVariants: true, priceMin: 480, priceMax: 500, stockTotal: 6 });
    expect(d.variantAxes).toEqual([
      { key: 'height', name: 'גובה', values: [{ value: '65', label: '65' }, { value: '75', label: '75' }] },
      { key: 'finish', name: 'גימור', values: [{ value: 'nat', label: 'טבעי' }] }
    ]);
  });

  it('one unlimited variant makes the product unlimited', () => {
    expect(deriveProductFields(...cases[4][1]).stockTotal).toBe(-1);
  });

  it('a product whose variants are all off stays sold by variant, with nothing to sell', () => {
    expect(deriveProductFields(...cases[5][1])).toMatchObject({ hasVariants: true, stockTotal: 0, priceMin: null });
  });

  // The Strapi lifecycle carries the same function in plain JS. When the
  // sibling `1.0b` checkout is here, hold the two equal.
  const here = dirname(fileURLToPath(import.meta.url));
  const strapiCopy = resolve(here, '../../../../1.0b/src/api/product-variant/content-types/product-variant/derive.js');
  it.skipIf(!existsSync(strapiCopy))('agrees with the 1.0b lifecycle copy', () => {
    const { deriveProductFields: strapiDerive } = createRequire(import.meta.url)(strapiCopy);
    for (const [, args] of cases) expect(strapiDerive(...args)).toEqual(deriveProductFields(...args));
  });
});
