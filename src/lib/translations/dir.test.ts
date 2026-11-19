import { describe, expect, it } from 'vitest';
import { dirOf, RTL_LOCALES } from './dir.js';

describe('dirOf', () => {
  it('reads Hebrew and Arabic right-to-left', () => {
    expect(dirOf('he')).toBe('rtl');
    expect(dirOf('ar')).toBe('rtl');
  });

  it('reads English, Spanish and Russian left-to-right', () => {
    expect(dirOf('en')).toBe('ltr');
    expect(dirOf('es')).toBe('ltr');
    expect(dirOf('ru')).toBe('ltr');
  });

  it('ignores region and case', () => {
    expect(dirOf('he-IL')).toBe('rtl');
    expect(dirOf('AR_eg')).toBe('rtl');
    expect(dirOf('en-US')).toBe('ltr');
  });

  it('falls back to ltr for nothing', () => {
    expect(dirOf(undefined)).toBe('ltr');
    expect(dirOf(null)).toBe('ltr');
    expect(dirOf('')).toBe('ltr');
  });

  it('has exactly the two RTL locales', () => {
    expect([...RTL_LOCALES].sort()).toEqual(['ar', 'he']);
  });
});
