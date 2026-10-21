import { describe, expect, it } from 'vitest';
import { detailChanges, galleryOfNode, productAxesOf, toEditorProduct } from './productEditor';

const pic = (id: number, url = `https://x/${id}.jpg`) => ({ id, attributes: { url, formats: { small: { url: `${url}?s` } } } });

describe('toEditorProduct', () => {
  const node = {
    id: 10,
    attributes: {
      name: 'סדנה',
      price: 280,
      origin: 'project',
      pic: { data: pic(1) },
      pics: { data: [pic(1), pic(2)] },
      options: { data: [{ id: 5, attributes: { key: 'size', name: 'מידה', position: 0, values: [{ value: 'M', label: 'M' }] } }] },
      variants: {
        data: [
          { id: 78, attributes: { sku: 'B', optionValues: [{ key: 'size', value: 'l', label: 'L' }], quant: -1, position: 1, pics: { data: [] } } },
          { id: 77, attributes: { sku: 'A', optionValues: '[{"key":"size","value":"m","label":"M"}]', quant: 3, unlimited: true, position: 0, pics: { data: [pic(2)] } } }
        ]
      },
      archive_decisions: { data: [{ id: 600 }] },
      projectcreates: { data: [{ id: 57, attributes: { user_1s: { data: [{ id: 7 }, { id: 8 }] } } }] }
    }
  };

  it('maps the row: gallery cover first, variants in order, axes the variants use', () => {
    const p = toEditorProduct(node)!;
    expect(p.gallery.map((g) => g.id)).toEqual(['1', '2']);
    expect(p.gallery[0].thumb).toBe('https://x/1.jpg?s');
    expect(p.variants.map((v) => v.id)).toEqual(['77', '78']);
    expect(p.variants[0]).toMatchObject({ axisKey: '|size:m|', unlimited: true, quant: 0, picIds: ['2'] });
    expect(p.axes).toEqual([{ optionId: '5', key: 'size', name: 'מידה', values: [{ value: 'm', label: 'M', hex: null }, { value: 'l', label: 'L', hex: null }] }]);
    expect(p).toMatchObject({ sovereign: false, members: 2, openDecisionId: '600' });
  });

  it('a legacy -1 with no flag is unlimited; a flagged count of -1 is one unit waiting', () => {
    const legacy = toEditorProduct(node)!.variants[1];
    expect(legacy).toMatchObject({ unlimited: true, quant: 0 });
    const flagged = toEditorProduct({
      ...node,
      attributes: { ...node.attributes, variants: { data: [{ id: 78, attributes: { sku: 'B', optionValues: [], quant: -1, unlimited: false } }] } }
    })!.variants[0];
    expect(flagged).toMatchObject({ unlimited: false, quant: -1 });
  });

  it('a personal product, or a rikma of one, is sovereign', () => {
    expect(toEditorProduct({ ...node, attributes: { ...node.attributes, origin: 'personal' } })!.sovereign).toBe(true);
    expect(
      toEditorProduct({ ...node, attributes: { ...node.attributes, projectcreates: { data: [{ id: 57, attributes: { user_1s: { data: [{ id: 7 }] } } }] } } })!.sovereign
    ).toBe(true);
  });

  it('gallery dedupes and stops at twelve', () => {
    expect(galleryOfNode({ data: pic(1) }, { data: Array.from({ length: 20 }, (_, i) => pic(i + 1)) })).toHaveLength(12);
  });

  it('an axis no option row names still shows', () => {
    expect(productAxesOf([], [{ optionValues: [{ key: 'color', value: 'red', label: 'אדום' }] } as any])[0]).toMatchObject({ key: 'color', values: [{ value: 'red' }] });
  });
});

describe('detailChanges', () => {
  const product = {
    name: 'ספל',
    descrip: '<p>ספל קרמיקה</p>',
    kindOf: 'total' as const,
    startDate: null,
    endDate: null
  };

  it('nothing moved is nothing', () => {
    expect(detailChanges({ name: 'ספל', descrip: '<p>ספל קרמיקה</p>', kindOf: 'total', startDate: '', endDate: '' }, product)).toEqual({});
  });

  it('re-serialised markup is not an edit', () => {
    expect(detailChanges({ descrip: 'ספל   קרמיקה' }, product)).toEqual({});
    expect(detailChanges({ descrip: '<p></p>' }, { ...product, descrip: '' })).toEqual({});
  });

  it('a blank name keeps the old one', () => {
    expect(detailChanges({ name: '  ' }, product)).toEqual({});
  });

  it('a monthly product carries its period, in round field names', () => {
    expect(detailChanges({ kindOf: 'monthly', startDate: '2026-11-01', endDate: '' }, product)).toEqual({
      kindOf: 'monthly',
      sqadualed: '2026-11-01T00:00:00.000Z'
    });
  });

  it('a period means nothing on a per-unit product', () => {
    expect(detailChanges({ kindOf: 'total', startDate: '2026-11-01' }, product)).toEqual({});
  });

  it('an unknown kind reads as per unit', () => {
    expect(detailChanges({ kindOf: 'weekly' }, { ...product, kindOf: 'monthly' })).toEqual({ kindOf: 'total' });
  });
});
