import { describe, it, expect } from 'vitest';
import { homeCtaOf } from './homeCta.js';

function el(html: string) {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host.querySelector('[data-hit]') ?? host.firstElementChild;
}

describe('homeCtaOf', () => {
  it('names every consent route "join"', () => {
    expect(homeCtaOf(el('<a href="/hascama">x</a>'))).toBe('join');
    expect(homeCtaOf(el('<a href="/convention?from=%2Fconcierge">x</a>'))).toBe('join');
    expect(homeCtaOf(el('<a href="/aitifaqia">x</a>'))).toBe('join');
  });

  it('prefers data-cta, and finds the control from a child', () => {
    expect(homeCtaOf(el('<button data-cta="demo"><span data-hit>x</span></button>'))).toBe('demo');
  });

  it('labels the rest by destination, first segment only', () => {
    expect(homeCtaOf(el('<a href="/login">x</a>'))).toBe('login');
    expect(homeCtaOf(el('<a href="/project/1/support">x</a>'))).toBe('project');
    expect(homeCtaOf(el('<a href="#pricing">x</a>'))).toBe('anchor');
    expect(homeCtaOf(el('<a href="https://agreement.1lev1.com/love">x</a>'))).toBe('external');
    expect(homeCtaOf(el('<a href="/">x</a>'))).toBe('home');
    expect(homeCtaOf(el('<button>x</button>'))).toBe('button');
  });

  it('ignores clicks on plain content', () => {
    expect(homeCtaOf(el('<p>text</p>'))).toBeNull();
    expect(homeCtaOf(null)).toBeNull();
  });
});
