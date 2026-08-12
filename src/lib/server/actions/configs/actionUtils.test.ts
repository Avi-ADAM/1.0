import { describe, it, expect } from 'vitest';
import { gqlString } from './actionUtils';

/**
 * A few handlers still build their mutation by interpolating values into the
 * query text. Rich-text descriptions always carry `style="text-align: right;"`,
 * and one unescaped `"` turned the whole mutation into a syntax error — which
 * is why taking a mission with a description 500'd every time
 * (docs/QA_SOLO_RIKMA_2026-08.md B2).
 */
describe('gqlString', () => {
  it('escapes the quotes that rich-text descriptions always contain', () => {
    const descrip = '<p style="text-align: right;">עיצוב לוגו לריקמה</p>';
    const literal = gqlString(descrip);

    expect(literal.startsWith('"')).toBe(true);
    expect(literal.endsWith('"')).toBe(true);
    // No bare quote survives inside the literal — that is what broke the parse.
    expect(literal.slice(1, -1)).not.toMatch(/(^|[^\\])"/);
    // And the value round-trips unchanged.
    expect(JSON.parse(literal)).toBe(descrip);
  });

  it('escapes newlines and backslashes', () => {
    expect(gqlString('a\nb')).toBe('"a\\nb"');
    expect(gqlString('c:\\path')).toBe('"c:\\\\path"');
    expect(JSON.parse(gqlString('one\ntwo\\three"four'))).toBe('one\ntwo\\three"four');
  });

  it('renders null/undefined as an empty literal rather than the words', () => {
    expect(gqlString(null)).toBe('""');
    expect(gqlString(undefined)).toBe('""');
  });

  it('stringifies non-strings instead of emitting bare tokens', () => {
    expect(gqlString(42)).toBe('"42"');
    expect(gqlString(true)).toBe('"true"');
  });

  it('produces a literal that survives a triple-quote payload', () => {
    // Block strings ("""…""") were the previous approach; a value ending in a
    // quote closes them early. This form has no such edge.
    const nasty = 'ends with a quote"';
    expect(JSON.parse(gqlString(nasty))).toBe(nasty);
    expect(JSON.parse(gqlString('has """ inside'))).toBe('has """ inside');
  });
});
