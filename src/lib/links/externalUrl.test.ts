import { describe, expect, it } from 'vitest';
import { EXTERNAL_URL_MAX, normalizeExternalUrl } from './externalUrl';

describe('normalizeExternalUrl', () => {
  it('keeps a full http(s) address', () => {
    expect(normalizeExternalUrl('https://shop.example.co.il/p/12?x=1')).toBe('https://shop.example.co.il/p/12?x=1');
    expect(normalizeExternalUrl('http://shop.example.com')).toBe('http://shop.example.com/');
  });

  it('adds https:// to a bare domain, the shape linkToWebsite is often saved in', () => {
    expect(normalizeExternalUrl('rikma.example.org')).toBe('https://rikma.example.org/');
    expect(normalizeExternalUrl('  my-cafe.co.il/menu ')).toBe('https://my-cafe.co.il/menu');
    expect(normalizeExternalUrl('www.example.com:8080/a')).toBe('https://www.example.com:8080/a');
    expect(normalizeExternalUrl('//cdn.example.com/x')).toBe('https://cdn.example.com/x');
  });

  it('accepts an internationalised domain', () => {
    expect(normalizeExternalUrl('קפה.co.il')).toMatch(/^https:\/\/xn--/);
  });

  it('refuses anything that is not a web address', () => {
    for (const bad of [
      'javascript:alert(1)',
      'JavaScript:alert(1)',
      'data:text/html,<b>x</b>',
      'mailto:a@b.c',
      'ftp://files.example.com',
      'not a url',
      'shop',
      '/relative/path',
      '',
      '   ',
      null,
      undefined,
      42
    ]) {
      expect(normalizeExternalUrl(bad), String(bad)).toBeNull();
    }
  });

  it('refuses an address with credentials in it', () => {
    expect(normalizeExternalUrl('https://bank.example.com@evil.example/')).toBeNull();
    expect(normalizeExternalUrl('https://u:p@shop.example.com')).toBeNull();
  });

  it('refuses a host with no dot (an intranet name, a typo)', () => {
    expect(normalizeExternalUrl('https://shop/')).toBeNull();
  });

  it('refuses an over-long address', () => {
    expect(normalizeExternalUrl('https://a.example.com/' + 'x'.repeat(EXTERNAL_URL_MAX))).toBeNull();
  });
});
