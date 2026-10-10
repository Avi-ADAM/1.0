import { describe, it, expect } from 'vitest';
import { whenLabel, rowWhen, WHEN_KINDS, RENDERABLE_ANIS } from './cardKinds.js';
import he from '$lib/translations/he/lev.json';
import en from '$lib/translations/en/lev.json';
import ar from '$lib/translations/ar/lev.json';
import ru from '$lib/translations/ru/lev.json';
import es from '$lib/translations/es/lev.json';

const LOCALES = { he, en, ar, ru, es } as Record<string, any>;

/** A stand-in for `$t` over one lev.json: `lev.when.x` → interpolated string. */
const translator = (json: any) => (key: string, params: Record<string, string> = {}) => {
  const value = key
    .replace(/^lev\./, '')
    .split('.')
    .reduce((node, part) => node?.[part], json);
  if (typeof value !== 'string') return '';
  return value.replace(/\{\{(\w+)\}\}/g, (_, name) => params[name] ?? '');
};

const NOW = Date.parse('2026-10-08T09:00:00Z');
const item = (ani: string, at: string) => ({ ani, when: { at } });

describe('rowWhen', () => {
  it('reads `when` only when it has a moment', () => {
    expect(rowWhen({ when: { at: '2026-10-08T08:00:00Z' } })).toEqual({ at: '2026-10-08T08:00:00Z' });
    expect(rowWhen({})).toBeNull();
    expect(rowWhen({ when: {} })).toBeNull();
    expect(rowWhen(null)).toBeNull();
  });
});

describe('whenLabel', () => {
  const t = translator(he);

  it('is null without a when', () => {
    expect(whenLabel({ ani: 'pends' }, { now: NOW, locale: 'he', t })).toBeNull();
  });

  it('puts a relative phrase straight after the verb', () => {
    const w = whenLabel(item('askedcoin', '2026-10-08T08:48:00Z'), { now: NOW, locale: 'he', t })!;
    expect(w.text).toBe('נשלחה לפני 12 דק׳');
    expect(w.iso).toBe('2026-10-08T08:48:00.000Z');
  });

  it("gives an absolute date the locale's preposition", () => {
    const w = whenLabel(item('pends', '2026-09-01T10:00:00Z'), { now: NOW, locale: 'he', t })!;
    expect(w.text.startsWith('הוצעה ב־')).toBe(true);
    const e = whenLabel(item('pends', '2026-09-01T10:00:00Z'), {
      now: NOW,
      locale: 'en',
      t: translator(en)
    })!;
    expect(e.text).toBe('Proposed on Sep 1');
  });

  it('agrees the verb with the card noun', () => {
    const at = '2026-10-08T08:48:00Z';
    expect(whenLabel(item('pends', at), { now: NOW, locale: 'he', t })!.text).toMatch(/^הוצעה /);
    expect(whenLabel(item('pmashes', at), { now: NOW, locale: 'he', t })!.text).toMatch(/^הוצע /);
  });

  it('`bare` drops the verb but keeps the sentence for the tooltip', () => {
    const w = whenLabel(item('askedcoin', '2026-10-08T08:48:00Z'), {
      now: NOW,
      locale: 'he',
      t,
      bare: true
    })!;
    expect(w.text).toBe('לפני 12 דק׳');
    expect(w.sentence).toBe('נשלחה לפני 12 דק׳');
  });

  it('a kind with no sentence of its own shows the time alone', () => {
    const w = whenLabel(item('shiftLog', '2026-10-08T08:48:00Z'), { now: NOW, locale: 'he', t })!;
    expect(w.text).toBe('לפני 12 דק׳');
  });
});

describe('lev.when translations', () => {
  it('only names kinds the heart can render', () => {
    for (const ani of WHEN_KINDS) expect(RENDERABLE_ANIS).toContain(ani);
  });

  for (const [locale, json] of Object.entries(LOCALES)) {
    it(`${locale} has a {{time}} sentence for every WHEN_KIND and both prepositions`, () => {
      for (const ani of WHEN_KINDS) {
        expect(json.when?.[ani], `${locale} when.${ani}`).toMatch(/\{\{time\}\}/);
      }
      expect(json.when?.at?.weekday).toMatch(/\{\{time\}\}/);
      expect(json.when?.at?.date).toMatch(/\{\{time\}\}/);
    });
  }
});
