import { describe, expect, it } from 'vitest';
import { detailChanges, galleryOfNode, isRecipeDeal, isRecipeLocked, locationOf, productAxesOf, recipeOfNode, sameLocation, toEditorProduct } from './productEditor';

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

describe('locationOf', () => {
  it('nothing set is null, whatever the picker carries beside it', () => {
    expect(locationOf({ location_mode: 'unspecified', isOnline: false, lat: null, lng: null, radius: 15, location_hint: '' })).toBeNull();
    expect(locationOf(null)).toBeNull();
  });

  it('a radius with no point means nothing, and an unknown mode is unspecified', () => {
    expect(locationOf({ location_mode: 'moon', location_hint: 'חיפה', radius: 15 })).toEqual({
      location_mode: 'unspecified',
      lat: null,
      lng: null,
      radius: null,
      location_hint: 'חיפה'
    });
  });

  it('the picker opening on a stored place is not a change', () => {
    const stored = { location_mode: 'onsite', lat: 32, lng: 34, radius: 12, location_hint: 'חיפה' };
    expect(sameLocation({ ...stored, isOnline: false }, stored)).toBe(true);
    expect(sameLocation({ ...stored, radius: 20 }, stored)).toBe(false);
    expect(sameLocation({ location_mode: 'unspecified', radius: 15, location_hint: '' }, null)).toBe(true);
  });
});

describe('recipeOfNode', () => {
  const node = {
    attributes: {
      matanot_recipe_missions: {
        data: [
          { id: 1, attributes: { hoursPerUnit: 2, unitsPerProduct: 3, ratePerHour: 50, pendm: { data: { attributes: { name: 'הצעה' } } }, mesimabetahalich: { data: { id: 9, attributes: { name: 'בעבודה' } } } } },
          { id: 2, attributes: { hoursPerUnit: 1, ratePerHour: 40, pendm: { data: { attributes: { name: 'פתוחה' } } } } }
        ]
      },
      matanot_recipe_resources: {
        data: [
          { id: 3, attributes: { quantityPerUnit: 2, pricePerUnit: 10, pmash: { data: { attributes: { name: 'חימר' } } }, assignedMember: { data: { id: 7 } } } },
          { id: 4, attributes: { archived: true, quantityPerUnit: 1, pricePerUnit: 99 } }
        ]
      }
    }
  };

  it('prices each line for one unit and leaves out an archived resource', () => {
    expect(recipeOfNode(node)).toEqual([
      { id: 'm1', kind: 'mission', name: 'בעבודה', amount: 2, units: 3, unit: 50, cost: 300, open: false, linkedId: '9' },
      { id: 'm2', kind: 'mission', name: 'פתוחה', amount: 1, units: 1, unit: 40, cost: 40, open: true, linkedId: null },
      { id: 'r3', kind: 'resource', name: 'חימר', amount: 2, units: 1, unit: 10, cost: 20, open: false, linkedId: null }
    ]);
  });

  it('a recipe nobody could read is not one to rewrite', () => {
    expect(isRecipeLocked(node)).toBe(false);
    expect(isRecipeLocked(null)).toBe(true);
  });

  it('a wish product is known by its origin or its wish', () => {
    expect(isRecipeDeal('project', node)).toBe(false);
    expect(isRecipeDeal('wish', node)).toBe(true);
    expect(isRecipeDeal('project', { attributes: { ratson: { data: { id: 3 } } } })).toBe(true);
  });

  it('no extras read means an empty recipe', () => {
    expect(recipeOfNode(null)).toEqual([]);
  });
});
