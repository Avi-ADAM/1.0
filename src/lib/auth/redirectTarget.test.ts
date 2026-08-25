import { describe, it, expect } from 'vitest';
import { DEFAULT_REDIRECT, safeRedirectTarget } from './redirectTarget.js';

describe('safeRedirectTarget', () => {
  it('keeps a path inside this app, the shape hooks and the error screens send', () => {
    expect(safeRedirectTarget('lev/123')).toBe('lev/123');
    expect(safeRedirectTarget('/onboard?step=2')).toBe('/onboard?step=2');
  });

  it('keeps an absolute url on a 1lev1 host, so a sister app gets its visitor back', () => {
    expect(safeRedirectTarget('https://meetings.1lev1.com/meeting/42?guest=true')).toBe(
      'https://meetings.1lev1.com/meeting/42?guest=true'
    );
    expect(safeRedirectTarget('https://1lev1.com/lev')).toBe('https://1lev1.com/lev');
  });

  it('refuses to hand a freshly signed-in visitor to somebody else', () => {
    expect(safeRedirectTarget('https://evil.example/login')).toBe(DEFAULT_REDIRECT);
    // Suffix look-alikes: neither of these is a 1lev1 host.
    expect(safeRedirectTarget('https://evil1lev1.com/')).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectTarget('https://1lev1.com.evil.example/')).toBe(DEFAULT_REDIRECT);
  });

  it('refuses protocol-relative urls, which read as a path but are not one', () => {
    expect(safeRedirectTarget('//evil.example')).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectTarget('/\\evil.example')).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectTarget('\\\\evil.example')).toBe(DEFAULT_REDIRECT);
  });

  it('refuses schemes that are not a web page', () => {
    expect(safeRedirectTarget('javascript:alert(1)')).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectTarget('data:text/html,<script>')).toBe(DEFAULT_REDIRECT);
  });

  it('falls back when there is nothing usable', () => {
    expect(safeRedirectTarget(null)).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectTarget('   ')).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectTarget('', '/lev')).toBe('/lev');
  });

  it('lets the sister app through on localhost, where dev runs it on another port', () => {
    expect(safeRedirectTarget('http://localhost:5555/meeting/1')).toBe(
      'http://localhost:5555/meeting/1'
    );
  });
});
