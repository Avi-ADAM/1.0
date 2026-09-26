import { describe, expect, it } from 'vitest';
import { blueprintToRikmaView } from './rikmaView.js';
import type { AssistantItem, AssistantState } from './types.js';

const row = (over: Partial<AssistantItem> & Pick<AssistantItem, 'key' | 'group' | 'label'>): AssistantItem => ({
  status: 'proposed',
  origin: 'agent',
  ...over
});

const state: AssistantState = {
  fields: {
    track: 'partnership',
    name: 'השקד',
    publicDescription: 'קפה ומאפים',
    linkToWebsite: 'javascript:alert(1)',
    vals: ['קהילה'],
    location: { lat: 32, lng: 34, hint: 'תל אביב' },
    currency: 'ILS'
  },
  items: [
    row({ key: 'i1', group: 'products', label: 'סדנה', why: 'מהשיחה עם דנה', spec: { price: 180, recipe: { missionKeys: ['i2'], resourceKeys: ['i4'] } } }),
    row({ key: 'i6', group: 'products', label: 'מגש', spec: { pricingMode: 'quote' } }),
    row({ key: 'i2', group: 'rikmaMissions', label: 'הנחיה', spec: { holder: 'me', hours: 10, ratePerHour: 100 } }),
    row({ key: 'i3', group: 'rikmaMissions', label: 'רשתות', spec: { holder: 'partner', partnerKey: 'i5', hours: 5, ratePerHour: 60 } }),
    row({ key: 'i4', group: 'rikmaResources', label: 'תנור', spec: { holder: 'partner', partnerKey: 'i5', price: 1000 } }),
    row({ key: 'i5', group: 'partners', label: 'דנה', spec: { email: 'dana@x.co' } }),
    row({ key: 'i7', group: 'rikmaMissions', label: 'צילום', spec: { hours: 4 } }),
    row({ key: 'i8', group: 'products', label: 'ישן', status: 'dropped', droppedFrom: 'proposed' })
  ]
};

describe('blueprintToRikmaView', () => {
  const view = blueprintToRikmaView(state);

  it('shows what a stranger may see and nothing else', () => {
    const text = JSON.stringify(view);
    expect(text).not.toContain('dana@x.co');
    expect(text).not.toContain('מהשיחה עם דנה');
    expect(text).not.toContain('"i1"');
    expect(text).not.toContain('ישן');
    expect(view.linkToWebsite).toBeUndefined();
    expect(view).toMatchObject({ name: 'השקד', place: 'תל אביב', currency: 'ILS', vals: ['קהילה'] });
  });

  it('products first, with price or "on request" and what makes them', () => {
    expect(view.products).toEqual([
      { label: 'סדנה', price: 180, onRequest: false, madeOf: ['הנחיה', 'תנור'] },
      { label: 'מגש', onRequest: true, madeOf: [] }
    ]);
  });

  it('names who brings each row, and what each partner brings', () => {
    expect(view.missions.map((m) => [m.label, m.holder])).toEqual([
      ['הנחיה', { kind: 'me' }],
      ['רשתות', { kind: 'partner', name: 'דנה' }],
      ['צילום', { kind: 'open' }]
    ]);
    expect(view.partners).toEqual([{ name: 'דנה', brings: ['רשתות', 'תנור'] }]);
  });

  it('illustrates the split by the value each side brings', () => {
    // me: 10×100 = 1000 · דנה: 5×60 + 1000 = 1300
    expect(view.split).toEqual([
      { who: { kind: 'partner', name: 'דנה' }, value: 1300, pct: 56.5 },
      { who: { kind: 'me' }, value: 1000, pct: 43.5 }
    ]);
  });

  it('no numbers → no split', () => {
    expect(blueprintToRikmaView({ fields: { name: 'x' }, items: [row({ key: 'a', group: 'rikmaMissions', label: 'm' })] }).split).toEqual([]);
  });
});
