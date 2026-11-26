import { describe, expect, it } from 'vitest';
import { buildExhibitMail, ExhibitMailThrottle } from './visitorMail';

describe('buildExhibitMail', () => {
  const url = 'https://www.1lev1.com/preview/rikma/k?ref=exhibit&lang=he#t=abc';

  it('names the idea and carries the link, in the visitor language and direction', () => {
    const m = buildExhibitMail({ name: 'נועם', lang: 'he', idea: 'ציור קיר', url });
    expect(m.subject).toContain('ציור קיר');
    expect(m.html).toContain('dir="rtl"');
    expect(m.html).toContain('href="https://www.1lev1.com/preview/rikma/k?ref=exhibit&amp;lang=he#t=abc"');
    expect(m.text).toContain(url);
    expect(m.text).toContain('נועם');
    const en = buildExhibitMail({ name: null, lang: 'en', idea: 'Mural', url });
    expect(en.html).toContain('dir="ltr"');
    expect(en.text.startsWith('Hello,')).toBe(true);
  });

  it('an unknown language falls back to Hebrew; a typed idea cannot break the subject or the markup', () => {
    const m = buildExhibitMail({ name: '<b>x</b>', lang: 'fr', idea: 'a\r\nBcc: evil@x.co <script>', url });
    expect(m.subject).not.toMatch(/[\r\n]/);
    expect(m.html).not.toContain('<script>');
    expect(m.html).not.toContain('<b>x</b>');
    expect(m.html).toContain('lang="he"');
  });
});

describe('ExhibitMailThrottle', () => {
  it('one mail per draft and address, and a few per address a day', () => {
    const t = new ExhibitMailThrottle(2, 1000);
    expect(t.take('1', 'A@b.co', 0)).toBe(true);
    expect(t.take('1', 'a@b.co', 1)).toBe(false);
    expect(t.take('2', 'a@b.co', 2)).toBe(true);
    expect(t.take('3', 'a@b.co', 3)).toBe(false);
    expect(t.take('3', 'a@b.co', 2000)).toBe(true);
  });
});
