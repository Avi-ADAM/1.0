import { describe, expect, it } from 'vitest';
import { axisKeyOf as serverAxisKeyOf } from '$lib/server/apiPublic/shop';
import {
  axisKeyOf,
  buildMatrix,
  combinationsOf,
  galleryIds,
  movePicture,
  normaliseAxes,
  parseVariantTerms,
  planVariantSave,
  slugOf,
  validateVariants,
  type EditorAxis,
  type EditorVariant
} from './variantEditor';

const axes: EditorAxis[] = [
  { optionId: '1', key: 'height', name: 'גובה', values: [{ value: '65', label: '65', hex: null }, { value: '75', label: '75', hex: null }] },
  { optionId: null, key: 'finish', name: 'גימור', values: [{ value: 'טבעי', label: 'טבעי', hex: null }, { value: 'כהה', label: 'כהה', hex: null }] }
];

function variant(over: Partial<EditorVariant> = {}): EditorVariant {
  const optionValues = over.optionValues ?? [
    { key: 'height', value: '65', label: '65' },
    { key: 'finish', value: 'טבעי', label: 'טבעי' }
  ];
  return {
    id: '10',
    axisKey: axisKeyOf(optionValues),
    optionValues,
    name: '65 / טבעי',
    sku: 'STL-65-NAT',
    price: 480,
    compareAtPrice: null,
    quant: 4,
    active: true,
    position: 0,
    picIds: [],
    ...over
  };
}

describe('identifiers', () => {
  it('slugs any alphabet, never the axisKey syntax', () => {
    expect(slugOf('  Size ')).toBe('size');
    expect(slugOf('גובה מושב')).toBe('גובה-מושב');
    expect(slugOf('a|b:c=d')).toBe('a-b-c-d');
  });

  it('axisKey matches the API reader byte for byte', () => {
    const pairs = [
      { key: 'Size', value: 'M' },
      { key: 'color', value: 'Red' }
    ];
    expect(axisKeyOf(pairs)).toBe('|color:red|size:m|');
    expect(axisKeyOf(pairs)).toBe(serverAxisKeyOf(pairs));
  });
});

describe('normaliseAxes', () => {
  it('derives keys, merges M and m, drops empties', () => {
    const { axes: out, errors } = normaliseAxes([
      { name: 'Size', values: [{ value: '', label: 'M', hex: null }, { value: 'm', label: 'm', hex: null }, { value: '', label: ' ', hex: null }] }
    ]);
    expect(errors).toEqual([]);
    expect(out[0].key).toBe('size');
    expect(out[0].values).toEqual([{ value: 'm', label: 'M', hex: null }]);
  });

  it('refuses a nameless axis, a duplicate, an axis with no values, a fourth axis', () => {
    expect(normaliseAxes([{ name: '', values: [] }]).errors).toContain('axisName');
    expect(normaliseAxes([{ name: 'a', values: [{ value: 'x', label: 'x', hex: null }] }, { name: 'A', values: [] }]).errors).toContain('axisDuplicate');
    expect(normaliseAxes([{ name: 'a', values: [] }]).errors).toContain('axisNoValues');
    const four = ['a', 'b', 'c', 'd'].map((n) => ({ name: n, values: [{ value: 'x', label: 'x', hex: null }] }));
    expect(normaliseAxes(four).errors).toContain('tooManyAxes');
  });

  it('keeps a valid swatch colour only', () => {
    const { axes: out } = normaliseAxes([{ name: 'c', values: [{ value: 'r', label: 'r', hex: '#c33' }, { value: 'b', label: 'b', hex: 'blue' }] }]);
    expect(out[0].values.map((v) => v.hex)).toEqual(['#c33', null]);
  });
});

describe('the matrix', () => {
  it('is every combination, in the axes order', () => {
    const combos = combinationsOf(axes);
    expect(combos).toHaveLength(4);
    expect(combos[0].map((p) => p.value)).toEqual(['65', 'טבעי']);
  });

  it('keeps what the seller set on an existing combination and adds the rest', () => {
    const old = variant({ name: '65 / טבעי' });
    const m = buildMatrix({ axes, existing: [old], productId: '1842' });
    expect(m.added).toBe(3);
    expect(m.retired).toBe(0);
    const kept = m.variants.find((v) => v.id === '10')!;
    expect(kept.price).toBe(480);
    expect(kept.quant).toBe(4);
    const fresh = m.variants.find((v) => v.id === null)!;
    expect(fresh).toMatchObject({ price: null, quant: 0, active: true });
    expect(fresh.sku.startsWith('P1842-')).toBe(true);
  });

  it('never drops a variant: a combination that is gone is switched off and kept', () => {
    const gone = variant({
      id: '11',
      optionValues: [{ key: 'height', value: '95', label: '95' }, { key: 'finish', value: 'כהה', label: 'כהה' }]
    });
    gone.axisKey = axisKeyOf(gone.optionValues);
    const m = buildMatrix({ axes, existing: [gone], productId: '1' });
    expect(m.retired).toBe(1);
    expect(m.variants.find((v) => v.id === '11')).toMatchObject({ active: false });
  });

  it('follows a renamed label unless the seller named the variant', () => {
    const renamed: EditorAxis[] = [{ ...axes[0], values: [{ value: '65', label: '65 ס״מ', hex: null }] }, { ...axes[1], values: [axes[1].values[0]] }];
    const auto = buildMatrix({ axes: renamed, existing: [variant()], productId: '1' }).variants[0];
    expect(auto.name).toBe('65 ס״מ / טבעי');
    const own = buildMatrix({ axes: renamed, existing: [variant({ name: 'הקלאסי' })], productId: '1' }).variants[0];
    expect(own.name).toBe('הקלאסי');
  });
});

describe('validateVariants', () => {
  it('refuses a duplicate SKU, one taken elsewhere in the rikma, a duplicate combination', () => {
    const a = variant();
    const b = variant({ id: '12', sku: 'stl-65-nat' });
    const issues = validateVariants([a, b], ['OTHER-1']);
    expect(issues).toContainEqual({ index: 1, code: 'skuDuplicate' });
    expect(issues).toContainEqual({ index: 1, code: 'variantDuplicate' });
    expect(validateVariants([variant({ sku: 'other-1' })], ['OTHER-1'])).toContainEqual({ index: 0, code: 'skuTaken' });
  });

  it('allows unlimited stock, refuses a negative count or price', () => {
    expect(validateVariants([variant({ quant: -1 })])).toEqual([]);
    expect(validateVariants([variant({ quant: -2 })])).toContainEqual({ index: 0, code: 'stockInvalid' });
    expect(validateVariants([variant({ price: -5 })])).toContainEqual({ index: 0, code: 'priceInvalid' });
    expect(validateVariants([variant({ sku: ' ' })])).toContainEqual({ index: 0, code: 'skuMissing' });
  });
});

describe('planVariantSave — a price is a term, stock is not', () => {
  const existing = [variant()];

  it('applies stock, visibility and pictures at once on a rikma product', () => {
    const plan = planVariantSave({
      existing,
      desired: [variant({ quant: 9, active: false, picIds: ['5'] })],
      productPrice: 500,
      sovereign: false
    });
    expect(plan.terms).toEqual([]);
    expect(plan.updates).toEqual([{ id: '10', patch: { quant: 9, active: false, picIds: ['5'] } }]);
  });

  it('sends a moved price and a new variant to the partners', () => {
    const fresh = variant({ id: null, sku: 'NEW-1', optionValues: [{ key: 'height', value: '75', label: '75' }] });
    fresh.axisKey = axisKeyOf(fresh.optionValues);
    const plan = planVariantSave({
      existing,
      desired: [variant({ price: 520, quant: 2 }), fresh],
      productPrice: 500,
      sovereign: false
    });
    expect(plan.creates).toEqual([]);
    expect(plan.updates).toEqual([{ id: '10', patch: { quant: 2 } }]);
    expect(plan.terms).toEqual([
      { kind: 'price', id: '10', name: '65 / טבעי', from: 480, to: 520 },
      expect.objectContaining({ kind: 'create', sku: 'NEW-1', axisKey: '|height:75|' })
    ]);
  });

  it('writes a price spelled out that changes nothing a buyer pays', () => {
    const plan = planVariantSave({
      existing: [variant({ price: null })],
      desired: [variant({ price: 500 })],
      productPrice: 500,
      sovereign: false
    });
    expect(plan.terms).toEqual([]);
    expect(plan.updates).toEqual([{ id: '10', patch: { price: 500 } }]);
  });

  it('a personal product (or a rikma of one) is sovereign', () => {
    const fresh = variant({ id: null, sku: 'NEW-1' });
    const plan = planVariantSave({ existing, desired: [variant({ price: 520 }), fresh], productPrice: 500, sovereign: true });
    expect(plan.terms).toEqual([]);
    expect(plan.creates).toHaveLength(1);
    expect(plan.updates[0].patch.price).toBe(520);
  });
});

describe('parseVariantTerms', () => {
  it('rebuilds each entry and drops what it cannot trust', () => {
    const out = parseVariantTerms(
      JSON.stringify([
        { kind: 'price', id: 10, name: 'x', from: 480, to: 520 },
        { kind: 'price', id: 11, to: -1 },
        { kind: 'create', sku: 'A', optionValues: [{ key: 'Size', value: 'M', label: 'M' }], quant: 3 },
        { kind: 'create', sku: '', optionValues: [{ key: 'size', value: 'l' }] },
        { kind: 'delete', id: 3 }
      ])
    );
    expect(out).toEqual([
      { kind: 'price', id: '10', name: 'x', from: 480, to: 520 },
      expect.objectContaining({ kind: 'create', sku: 'A', axisKey: '|size:m|', quant: 3, name: 'M' })
    ]);
    expect(parseVariantTerms('not json')).toEqual([]);
  });
});

describe('gallery', () => {
  it('keeps order, drops repeats, stops at twelve', () => {
    expect(galleryIds(['3', 3, null, '4'])).toEqual(['3', '4']);
    expect(galleryIds(Array.from({ length: 20 }, (_, i) => i + 1))).toHaveLength(12);
  });

  it('moves a picture, and index 0 is the cover', () => {
    expect(movePicture(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
    expect(movePicture(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
  });
});
