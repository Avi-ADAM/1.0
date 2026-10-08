import { describe, it, expect } from 'vitest';
import { formatDeadline, resolveNoticeText, resolveTerm, type Translate } from './render';

const plain = (s: string) => s.replace(/[\u2068\u2069]/g, '');

// A translate that shows the key and what it was given.
const t: Translate = (key, params) =>
  params ? `${key}(${Object.entries(params).map(([k, v]) => `${k}=${v}`).join(',')})` : key;

describe('resolveNoticeText', () => {
  it('passes a person’s own words through untouched', () => {
    expect(resolveNoticeText({ text: 'Two more pipes' }, t, 'he')).toBe('Two more pipes');
  });

  it('resolves a nested label before the sentence that holds it', () => {
    const s = resolveNoticeText(
      { key: 'notices.lev.decision', params: { rikma: 'Gefen', what: { key: 'lev.list.decision.name' } } },
      t,
      'en'
    );
    expect(plain(s)).toBe('notices.lev.decision(rikma=Gefen,what=lev.list.decision.name)');
  });

  it('trims and isolates people’s words, so a Latin name cannot pull Hebrew punctuation across it', () => {
    const s = resolveNoticeText({ key: 'k', params: { who: 'Asus ', item: { text: ' Logo' } } }, t, 'he');
    expect(s).toBe('k(who=\u2068Asus\u2069,item=\u2068Logo\u2069)');
  });

  it('formats numbers for the reader', () => {
    expect(resolveNoticeText({ key: 'k', params: { count: 1500 } }, t, 'en')).toBe('k(count=1,500)');
  });

  it('is empty for nothing', () => {
    expect(resolveNoticeText(null, t, 'he')).toBe('');
  });
});

describe('resolveTerm', () => {
  it('a figure the list view has goes through its key; the others through notices.term', () => {
    expect(resolveTerm({ kind: 'hours', value: 6 }, t, 'en')).toBe('lev.list.fact.hours(value=6)');
    expect(resolveTerm({ kind: 'raise', value: 200 }, t, 'en')).toBe('notices.term.raise(value=200)');
  });
});

describe('formatDeadline', () => {
  const now = Date.parse('2026-10-05T10:00:00.000Z');
  it('is empty without a deadline or with a broken one', () => {
    expect(formatDeadline(null, 'he', now)).toBe('');
    expect(formatDeadline('soon', 'he', now)).toBe('');
  });
  it('gives the weekday and time within the week, the date beyond', () => {
    const near = formatDeadline('2026-10-06T14:00:00.000Z', 'en', now);
    const far = formatDeadline('2026-11-20T14:00:00.000Z', 'en', now);
    expect(near).toMatch(/\d{2}:\d{2}|\d{1,2}:\d{2}/);
    expect(far).toMatch(/Nov/);
  });
});
