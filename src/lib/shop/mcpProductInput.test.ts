import { describe, expect, it } from 'vitest';
import { axisDraftsOf, buildVariantRows, resolveOptionValues } from './mcpProductInput';
import type { EditorAxis } from './variantEditor';

const size: EditorAxis = {
  optionId: '1',
  key: 'size',
  name: 'Size',
  values: [
    { value: 's', label: 'S', hex: null },
    { value: 'm', label: 'M', hex: null },
    { value: 'l', label: 'L', hex: null }
  ]
};
const color: EditorAxis = {
  optionId: '2',
  key: 'color',
  name: 'Colour',
  values: [
    { value: 'red', label: 'Red', hex: '#d22' },
    { value: 'blue', label: 'Blue', hex: '#22d' }
  ]
};

const stored = {
  id: '61',
  axisKey: '|size:m|',
  optionValues: [{ key: 'size', value: 'm', label: 'M' }],
  name: 'M',
  sku: 'TS-M',
  price: null,
  compareAtPrice: null,
  unlimited: false,
  quant: 3,
  active: true,
  position: 0,
  picIds: ['900'],
  pictures: []
};
const product = { id: '5', axes: [{ ...size, values: [size.values[1]] }], variants: [stored] } as any;

describe('resolveOptionValues', () => {
  it('reads keys or names, values or labels', () => {
    expect(resolveOptionValues({ Size: 'M', colour: 'red' }, [size, color]).pairs).toEqual([
      { key: 'size', value: 'm' },
      { key: 'color', value: 'red' }
    ]);
    expect(resolveOptionValues([{ key: 'color', value: 'Blue' }], [size, color]).pairs).toEqual([{ key: 'color', value: 'blue' }]);
  });
  it('says which axis or value is missing and what to do', () => {
    expect(resolveOptionValues({ material: 'wool' }, [size]).error).toMatch(/upsertProductOptions/);
    expect(resolveOptionValues({ size: 'XXL' }, [size]).error).toMatch(/not a value of "Size"/);
  });
});

describe('buildVariantRows', () => {
  it('updates the stored variant with the same options, moving only what was named', () => {
    const out = buildVariantRows({ product, rikmaAxes: [size, color], inputs: [{ optionValues: { size: 'M' }, quant: 10 }] });
    expect(out.errors).toEqual([]);
    expect(out.rows[0]).toMatchObject({ id: '61', sku: 'TS-M', quant: 10, unlimited: false, picIds: ['900'], active: true });
  });
  it('-1 is unlimited', () => {
    const out = buildVariantRows({ product, rikmaAxes: [size], inputs: [{ variantId: '61', quant: -1 }] });
    expect(out.rows[0]).toMatchObject({ id: '61', unlimited: true, optionValues: [{ key: 'size', value: 'm' }] });
  });
  it('a new combination is a new row with a suggested SKU, and passes the whole rikma axes', () => {
    const out = buildVariantRows({ product, rikmaAxes: [size, color], inputs: [{ optionValues: { size: 'L', color: 'Red' }, price: 120 }] });
    expect(out.rows[0]).toMatchObject({ id: null, price: 120, quant: 0, position: 1 });
    expect(out.rows[0].sku).toBe('P5-L-RED');
    // The rikma's whole axis, not the product's one-value subset — writing it back never drops S or L.
    expect(out.axes.find((a) => a.key === 'size')?.values.length).toBe(3);
    expect(out.axes.map((a) => a.key).sort()).toEqual(['color', 'size']);
  });
  it('refuses an unknown variant id, a new row without options, and the same row twice', () => {
    const out = buildVariantRows({
      product,
      rikmaAxes: [size],
      inputs: [{ variantId: '999' }, { quant: 2 }, { variantId: '61' }, { optionValues: { size: 'M' } }]
    });
    expect(out.errors.map((e) => e.index)).toEqual([0, 1, 3]);
    expect(out.rows).toHaveLength(1);
  });
});

describe('axisDraftsOf', () => {
  it('accepts plain labels or {label, value, hex}', () => {
    expect(axisDraftsOf([{ name: 'Colour', values: ['Red', { label: 'Navy', value: 'navy', hex: '#001' }] }])).toEqual([
      {
        key: undefined,
        name: 'Colour',
        values: [
          { label: 'Red', value: undefined, hex: null },
          { label: 'Navy', value: 'navy', hex: '#001' }
        ]
      }
    ]);
  });
});
