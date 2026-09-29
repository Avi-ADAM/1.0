import { describe, expect, it } from 'vitest';
import { extendedIdOf, extendedRowOf, extendedSignatureFits, type ExtendedSignatureRow } from './extendedSignature';

const minted = Date.parse('2026-09-29T10:00:00Z');
const now = Date.parse('2026-09-29T10:20:00Z');
const row = (over: Partial<ExtendedSignatureRow> = {}): ExtendedSignatureRow => ({
  email: 'dana@example.com',
  fullAgreement: true,
  createdAt: '2026-09-29T10:15:00.000Z',
  userId: null,
  sessionIds: [],
  ...over
});
const fits = (r: ExtendedSignatureRow | null, email = 'dana@example.com') =>
  extendedSignatureFits(r, { email, notBefore: minted, now });

describe('extendedSignatureFits', () => {
  it('accepts a fresh, unclaimed extended signature with the same email', () => {
    expect(fits(row())).toBe(true);
    expect(fits(row(), '  Dana@Example.COM ')).toBe(true);
  });

  it('refuses the short agreement', () => {
    expect(fits(row({ fullAgreement: false }))).toBe(false);
    expect(fits(row({ fullAgreement: null }))).toBe(false);
  });

  it('refuses another email', () => {
    expect(fits(row(), 'someone@example.com')).toBe(false);
    expect(fits(row({ email: null }))).toBe(false);
  });

  it('refuses a row signed before this link existed, or in the future', () => {
    expect(fits(row({ createdAt: '2026-09-29T09:59:59.000Z' }))).toBe(false);
    expect(fits(row({ createdAt: '2026-09-29T11:00:00.000Z' }))).toBe(false);
    expect(fits(row({ createdAt: null }))).toBe(false);
  });

  it('refuses a row an account or a prepared session already holds', () => {
    expect(fits(row({ userId: '7' }))).toBe(false);
    expect(fits(row({ sessionIds: ['3'] }))).toBe(false);
  });

  it('refuses nothing found', () => {
    expect(fits(null)).toBe(false);
  });
});

describe('extendedRowOf', () => {
  it('reads the qid result', () => {
    const r = extendedRowOf({
      data: {
        chezin: {
          data: {
            id: '12',
            attributes: {
              email: 'dana@example.com',
              fullAgreement: true,
              createdAt: '2026-09-29T10:15:00.000Z',
              users_permissions_user: { data: null },
              assistant_sessions: { data: [{ id: 4 }] }
            }
          }
        }
      }
    });
    expect(r).toEqual(row({ sessionIds: ['4'] }));
  });

  it('is null for a missing row', () => {
    expect(extendedRowOf({ data: { chezin: { data: null } } })).toBeNull();
    expect(extendedRowOf(null)).toBeNull();
  });
});

describe('extendedIdOf', () => {
  it('takes digits only', () => {
    expect(extendedIdOf('123')).toBe('123');
    expect(extendedIdOf(45)).toBe('45');
    expect(extendedIdOf('12 OR 1=1')).toBeNull();
    expect(extendedIdOf('')).toBeNull();
    expect(extendedIdOf(undefined)).toBeNull();
  });
});
