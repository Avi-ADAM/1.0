import { describe, it, expect } from 'vitest';
import { buildSeoFallbacks } from './seoFallback.js';

const d = {
  title: 'Home "title"',
  desc: 'Home desc',
  canonical: 'https://1lev1.com/x',
  image: 'https://img/logo.png'
};

const count = (html: string, re: RegExp) => (html.match(re) || []).length;

describe('buildSeoFallbacks', () => {
  it('emits every fallback for a page that declares nothing', () => {
    const out = buildSeoFallbacks('<meta charset="UTF-8">', d);
    expect(out).toContain('<link rel="canonical" href="https://1lev1.com/x" />');
    expect(out).toContain('<title>Home &quot;title&quot;</title>');
    expect(out).toContain('property="og:title" content="Home &quot;title&quot;"');
    expect(out).toContain('name="twitter:image" content="https://img/logo.png"');
  });

  it('never repeats a tag the page set, and shares the page text on twitter', () => {
    const head =
      '<title>Partnership | 1lev1</title>' +
      '<meta name="description" content="Page desc"/>' +
      '<meta property="og:title" content="Partnership &amp; split"/>' +
      '<meta property="og:description" content="Page og desc"/>' +
      '<link rel="canonical" href="https://1lev1.com/partnership" />';
    const out = buildSeoFallbacks(head, d);
    const whole = head + out;
    expect(count(whole, /property="og:title"/g)).toBe(1);
    expect(count(whole, /property="og:description"/g)).toBe(1);
    expect(count(whole, /<title>/g)).toBe(1);
    expect(count(whole, /rel="canonical"/g)).toBe(1);
    expect(count(whole, /name="description"/g)).toBe(1);
    expect(out).toContain('name="twitter:title" content="Partnership &amp; split"');
    expect(out).toContain('name="twitter:description" content="Page og desc"');
    expect(out).toContain('property="og:image" content="https://img/logo.png"');
    expect(out).not.toContain('Home');
  });

  it('falls back to the page <title> for og:title when only a title is set', () => {
    const out = buildSeoFallbacks('<title>Only "title"</title>', d);
    expect(out).toContain('property="og:title" content="Only &quot;title&quot;"');
  });

  it('keeps a page og:image', () => {
    const out = buildSeoFallbacks('<meta property="og:image" content="https://img/p.png">', d);
    expect(out).not.toContain('property="og:image"');
    expect(out).toContain('name="twitter:image" content="https://img/p.png"');
  });
});
