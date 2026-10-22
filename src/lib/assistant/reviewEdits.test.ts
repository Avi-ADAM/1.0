import { describe, it, expect } from 'vitest';
import {
  addRowSpec,
  effectiveSpec,
  fieldOps,
  fieldRaw,
  fieldValueError,
  parseValue,
  rowOps,
  rowValue,
  selectionOps,
  SPEC_DEFS,
  stepNumber
} from './reviewEdits';
import type { AssistantItem } from './types';

const mission: AssistantItem = {
  key: 'm1',
  group: 'rikmaMissions',
  label: 'כתיבה',
  status: 'proposed',
  origin: 'agent',
  spec: { hours: 40, ratePerHour: 150, skills: ['כתיבה'], descrip: '<p>א</p>' }
};

describe('parseValue', () => {
  it('reads numbers with a decimal comma, and empty as "remove"', () => {
    expect(parseValue(SPEC_DEFS.rikmaMissions.hours, '7,5')).toEqual({ ok: true, value: 7.5 });
    expect(parseValue(SPEC_DEFS.rikmaMissions.hours, '')).toEqual({ ok: true, value: null });
    expect(parseValue(SPEC_DEFS.rikmaMissions.hours, '-1').ok).toBe(false);
    expect(parseValue(SPEC_DEFS.rikmaMissions.hours, '20000').ok).toBe(false);
    expect(parseValue(SPEC_DEFS.products.quant, '1.5').ok).toBe(false);
  });

  it('an empty rich-text body is no description', () => {
    expect(parseValue(SPEC_DEFS.rikmaMissions.descrip, '<p></p>')).toEqual({ ok: true, value: null });
  });

  it('refuses what applyOps would refuse the whole setSpec for', () => {
    expect(parseValue(SPEC_DEFS.rikmaMissions.descrip, `<p>${'x'.repeat(2001)}</p>`)).toEqual({ ok: false, reason: 'tooLong' });
    expect(parseValue(SPEC_DEFS.partners.email, 'not-an-email').ok).toBe(false);
    expect(parseValue(SPEC_DEFS.rikmaResources.kindOf, 'weekly').ok).toBe(false);
  });
});

describe('rowOps', () => {
  it('sends only what changed, in the spec\'s own types', () => {
    expect(rowOps(mission, { spec: { hours: '40', ratePerHour: '180', skills: 'כתיבה, עריכה' } })).toEqual([
      { op: 'setSpec', key: 'm1', spec: { ratePerHour: 180, skills: ['כתיבה', 'עריכה'] } }
    ]);
  });

  it('an invalid value is left out without dropping the good ones next to it', () => {
    expect(rowOps(mission, { spec: { hours: 'abc', ratePerHour: '160' } })).toEqual([
      { op: 'setSpec', key: 'm1', spec: { ratePerHour: 160 } }
    ]);
  });

  it('ticking a box back to how it was sends nothing', () => {
    expect(rowOps(mission, { spec: { recurring: false, holder: 'open' } })).toEqual([]);
  });

  it('renames only to a usable, different name', () => {
    expect(rowOps(mission, { label: '  כתיבה  ' })).toEqual([]);
    expect(rowOps(mission, { label: 'כתיבת  תסריט' })).toEqual([{ op: 'rename', key: 'm1', label: 'כתיבת תסריט' }]);
  });
});

describe('rowValue', () => {
  it('hours × rate for a mission, with the edits applied', () => {
    expect(rowValue('rikmaMissions', effectiveSpec(mission, { spec: { hours: '10' } }))).toEqual({ left: 10, right: 150, value: 1500 });
    expect(rowValue('rikmaMissions', { hours: 10 })).toBeNull();
  });

  it('price × quantity for a resource, only when there is more than one', () => {
    expect(rowValue('rikmaResources', { price: 100, quantity: 3 })).toEqual({ left: 100, right: 3, value: 300 });
    expect(rowValue('rikmaResources', { price: 100, quantity: 1 })).toBeNull();
  });
});

describe('fieldOps', () => {
  const fields = { name: 'א', restime: 'feh', location: { lat: 32, lng: 34, hint: 'יפו' } };

  it('changes the place without losing the map point', () => {
    expect(fieldOps(fields, { place: 'חיפה', online: true })).toEqual([
      { op: 'setField', field: 'location', value: { lat: 32, lng: 34, hint: 'חיפה', isOnline: true } }
    ]);
  });

  it('a default consent clock stays unsent', () => {
    expect(fieldOps({}, { restime: 'feh' })).toEqual([]);
    expect(fieldRaw({}, 'restime')).toBe('feh');
  });

  it('a website must be http(s); an emptied one is removed', () => {
    expect(fieldValueError('linkToWebsite', 'javascript:alert(1)')).toBe('invalid');
    expect(fieldOps(fields, { linkToWebsite: 'javascript:alert(1)' })).toEqual([]);
    expect(fieldOps({ linkToWebsite: 'https://a.b' }, { linkToWebsite: '' })).toEqual([
      { op: 'setField', field: 'linkToWebsite', value: null }
    ]);
  });

  it('values are a list, currency a code, and a name is never emptied', () => {
    expect(fieldOps(fields, { vals: 'כנות, הקשבה', currency: 'usd', name: '  ' })).toEqual([
      { op: 'setField', field: 'vals', value: ['כנות', 'הקשבה'] },
      { op: 'setField', field: 'currency', value: 'USD' }
    ]);
  });
});

describe('stepNumber, addRowSpec & selectionOps', () => {
  it('increments and decrements hours cleanly without going negative or drifting', () => {
    expect(stepNumber(undefined, undefined, 1)).toBe('1');
    expect(stepNumber(undefined, 10, -1)).toBe('9');
    expect(stepNumber('0', 10, -5)).toBe('0');
    expect(stepNumber('1,5', undefined, 0.5)).toBe('2');
    expect(stepNumber('9999', undefined, 5, 10_000)).toBe('10000');
  });

  it('builds specs for newly added rows and turns checkbox flips into drop/restore ops', () => {
    expect(addRowSpec('products', { kindOf: 'total' }, { spec: { price: '250', isOnline: true } })).toEqual({
      kindOf: 'total',
      price: 250,
      pricingMode: 'fixed',
      isOnline: true
    });

    const items: AssistantItem[] = [
      { key: 'i1', group: 'products', label: 'א', status: 'proposed', origin: 'agent' },
      { key: 'i2', group: 'products', label: 'ב', status: 'dropped', origin: 'agent' },
      { key: 'i3', group: 'products', label: 'ג', status: 'applied', origin: 'agent', createdRef: { type: 'matanot', id: '1' } }
    ];
    expect(selectionOps(items, { i1: false, i2: true, i3: false })).toEqual([
      { op: 'drop', key: 'i1' },
      { op: 'restore', key: 'i2' }
    ]);
  });
});
