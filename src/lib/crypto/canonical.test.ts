import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { canonicalize, type JsonValue } from './canonical';

describe('canonicalize', () => {
  it('orders object keys lexicographically', () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it('preserves array order', () => {
    expect(canonicalize([3, 1, 2])).toBe('[3,1,2]');
  });

  it('drops undefined values', () => {
    expect(canonicalize({ a: 1, b: undefined as unknown as JsonValue })).toBe('{"a":1}');
  });

  it('serializes primitives', () => {
    expect(canonicalize(null)).toBe('null');
    expect(canonicalize(true)).toBe('true');
    expect(canonicalize(false)).toBe('false');
    expect(canonicalize(0)).toBe('0');
    expect(canonicalize('x')).toBe('"x"');
  });

  it('throws on non-finite numbers', () => {
    expect(() => canonicalize(Infinity)).toThrow();
    expect(() => canonicalize(NaN)).toThrow();
  });

  it('is idempotent under parse/serialize', () => {
    fc.assert(
      fc.property(fc.jsonValue(), (v) => {
        const s1 = canonicalize(v as JsonValue);
        const s2 = canonicalize(JSON.parse(s1));
        return s1 === s2;
      }),
      { numRuns: 200 }
    );
  });

  it('is order-independent for object keys', () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string({ minLength: 1, maxLength: 8 }), fc.integer()),
        (obj) => {
          const keys = Object.keys(obj);
          const shuffled: Record<string, number> = {};
          for (const k of [...keys].reverse()) shuffled[k] = obj[k];
          return canonicalize(obj) === canonicalize(shuffled);
        }
      ),
      { numRuns: 100 }
    );
  });

  // SPEC_CONSENT_FORMAT §2 — the rules a second implementation must share.
  // The full set lives in spec/consent-v1/canonical.json.
  it('sorts keys by UTF-16 code units, not UTF-8 bytes', () => {
    expect(canonicalize({ '': 1, '\u{1F600}': 2 })).toBe('{"\u{1F600}":2,"":1}');
  });

  it('sorts keys after NFC normalization and refuses keys that collide under it', () => {
    expect(canonicalize({ 'é': 1, f: 2 })).toBe('{"f":2,"é":1}');
    expect(() => canonicalize({ 'é': 1, 'é': 2 })).toThrow(/duplicate key/);
  });

  it('refuses lone surrogates in strings and keys, accepts paired ones', () => {
    expect(() => canonicalize('\ud800')).toThrow(/lone surrogate/);
    expect(() => canonicalize('a\udc00')).toThrow(/lone surrogate/);
    expect(() => canonicalize({ '\ud83d': 1 })).toThrow(/lone surrogate/);
    expect(canonicalize('😀')).toBe('"\u{1F600}"');
  });
});
