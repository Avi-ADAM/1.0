import { describe, it, expect } from 'vitest';
import { DEFAULT_THEME, THEME_NAMES, normalizeTheme } from './themeParam.js';

describe('normalizeTheme', () => {
  it('accepts the canonical names', () => {
    for (const name of THEME_NAMES) expect(normalizeTheme(name)).toBe(name);
  });

  it('accepts the spellings a shared link is likely to use', () => {
    expect(normalizeTheme('professional')).toBe('business');
    expect(normalizeTheme('proffesional')).toBe('business');
    expect(normalizeTheme('pro')).toBe('business');
    expect(normalizeTheme('default')).toBe('personal');
  });

  it('is forgiving about case and stray whitespace', () => {
    expect(normalizeTheme('  Business ')).toBe('business');
    expect(normalizeTheme('PROFESSIONAL')).toBe('business');
  });

  it('returns undefined rather than guessing', () => {
    for (const raw of ['', 'busines', 'dark', 'personal ish', null, undefined, 42, {}]) {
      expect(normalizeTheme(raw)).toBeUndefined();
    }
  });

  it('does not leak Object.prototype members', () => {
    // A bare `ALIASES[key]` lookup would hand these back as truthy functions
    // and they would end up in classList / the theme cookie.
    for (const raw of ['constructor', 'toString', 'hasOwnProperty', '__proto__']) {
      expect(normalizeTheme(raw)).toBeUndefined();
    }
  });

  it('defaults to the regular look', () => {
    expect(DEFAULT_THEME).toBe('personal');
  });
});
