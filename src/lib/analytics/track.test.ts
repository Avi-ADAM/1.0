import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const vercelTrack = vi.fn();
vi.mock('@vercel/analytics', () => ({ track: (...a: unknown[]) => vercelTrack(...a) }));

import { sanitize, track, beforeSend, loadPulse, BEFORE_SEND_GLOBAL } from './track.js';

describe('sanitize', () => {
  it('drops an event that is not on the list', () => {
    expect(sanitize('whatever', { cta: 'join' })).toBeNull();
  });

  it('keeps only allowed keys', () => {
    expect(sanitize('home_cta', { cta: 'join', email: 'a@b.c', uid: 7 })).toEqual({ cta: 'join' });
  });

  it('refuses values that could be personal data', () => {
    expect(sanitize('sign_invalid', { field: 'a@b.c' })).toEqual({});
    expect(sanitize('sign_invalid', { field: 'Baruch Cohen' })).toEqual({});
    expect(sanitize('sign_invalid', { field: 'רקמה' })).toEqual({});
    expect(sanitize('sign_invalid', { field: 'x'.repeat(33) })).toEqual({});
    expect(sanitize('sign_invalid', { field: { nested: 1 } })).toEqual({});
  });

  it('passes booleans, finite numbers and short identifiers', () => {
    expect(sanitize('sign_ok', { full: true })).toEqual({ full: true });
    expect(sanitize('agreement_out', { from: 'infobox' })).toEqual({ from: 'infobox' });
  });
});

describe('track', () => {
  beforeEach(() => vercelTrack.mockClear());
  afterEach(() => {
    delete (window as any).umami;
  });

  it('is a no-op without umami, and never throws', () => {
    expect(() => track('sign_try', { full: false })).not.toThrow();
  });

  it('sends the sanitized props to both stores', () => {
    const umamiTrack = vi.fn(() => Promise.resolve());
    (window as any).umami = { track: umamiTrack };
    track('home_cta', { cta: 'join', email: 'a@b.c' });
    expect(umamiTrack).toHaveBeenCalledWith('home_cta', { cta: 'join' });
    expect(vercelTrack).toHaveBeenCalledWith('home_cta', { cta: 'join' });
  });

  it('sends nothing for an unknown event', () => {
    const umamiTrack = vi.fn(() => Promise.resolve());
    (window as any).umami = { track: umamiTrack };
    track('nope' as any);
    expect(umamiTrack).not.toHaveBeenCalled();
    expect(vercelTrack).not.toHaveBeenCalled();
  });

  it('survives a throwing tracker', () => {
    (window as any).umami = {
      track: () => {
        throw new Error('blocked');
      }
    };
    expect(() => track('sign_ok', { full: true })).not.toThrow();
  });
});

describe('beforeSend', () => {
  it('strips query and hash from url and referrer', () => {
    const p = beforeSend('pageview', {
      url: '/signup?fp=abc&un=Dana',
      referrer: 'https://agreement.1lev1.com/hascama?name=Dana#x'
    });
    expect(p).toEqual({ url: '/signup', referrer: 'https://agreement.1lev1.com/hascama' });
  });
});

describe('loadPulse', () => {
  afterEach(() => {
    document.head.querySelectorAll('script[data-pulse]').forEach((s) => s.remove());
  });

  it('loads nothing without a website id', () => {
    loadPulse({ websiteId: '' });
    expect(document.querySelector('script[data-pulse]')).toBeNull();
  });

  it('adds one privacy-configured script', () => {
    loadPulse({ websiteId: 'w1', src: 'data:text/javascript,' });
    loadPulse({ websiteId: 'w1', src: 'data:text/javascript,' });
    const all = document.querySelectorAll('script[data-pulse]');
    expect(all).toHaveLength(1);
    const s = all[0] as HTMLScriptElement;
    expect(s.dataset.websiteId).toBe('w1');
    expect(s.dataset.excludeSearch).toBe('true');
    expect(s.dataset.excludeHash).toBe('true');
    expect(s.dataset.beforeSend).toBe(BEFORE_SEND_GLOBAL);
    expect(typeof (window as any)[BEFORE_SEND_GLOBAL]).toBe('function');
  });
});
