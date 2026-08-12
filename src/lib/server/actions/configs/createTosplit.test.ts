import { describe, it, expect } from 'vitest';
import { createTosplitConfig } from './createTosplit';
import { approveHalukaConfig } from './approveHaluka';

/**
 * A split proposal carries two lists: `hervachti` (who earned what — the
 * substance of the proposal) and `halukas` (the transfers needed to get the
 * money where it belongs). Those transfers can legitimately be zero: in a
 * one-member rikma the sole member already holds every shekel and owes it to
 * nobody, so a correct proposal has an empty `halukas`.
 *
 * Requiring at least one transfer left solo rikmas unable to ever close a
 * split — every sale stayed "pending distribution" forever
 * (docs/QA_SOLO_RIKMA_2026-08.md B1).
 */
const validate = (value: unknown) =>
  (createTosplitConfig.paramSchema!.data as any).validate(value) as boolean;

const base = {
  publishedAt: '2026-08-12T08:49:52.667Z',
  project: '82',
  vots: [{ what: true, users_permissions_user: '256' }],
  hervachti: [
    { users_permissions_user: 256, amount: 500, mekabel: false, noten: false, nirsham: false }
  ],
  sales: [104]
};

describe('createTosplit — parameter validation', () => {
  it('accepts a balanced proposal with no transfers (solo rikma)', () => {
    expect(validate({ ...base, halukas: [] })).toBe(true);
  });

  it('accepts a proposal that does move money', () => {
    expect(validate({ ...base, halukas: ['7', '8'] })).toBe(true);
  });

  it('rejects a proposal with no hervachti — nothing to approve', () => {
    expect(validate({ ...base, halukas: [], hervachti: [] })).toBe(false);
  });

  it('rejects a missing halukas key, which means the caller never built one', () => {
    const { ...noHalukas } = base;
    expect(validate(noHalukas)).toBe(false);
  });

  it('still requires project, publishedAt and the creator vote', () => {
    expect(validate({ ...base, halukas: [], project: undefined })).toBe(false);
    expect(validate({ ...base, halukas: [], publishedAt: undefined })).toBe(false);
    expect(validate({ ...base, halukas: [], vots: [] })).toBe(false);
  });

  it('rejects non-objects', () => {
    expect(validate(null)).toBe(false);
    expect(validate('halukas')).toBe(false);
  });
});

describe('approveHaluka — finalizing a split', () => {
  const schema = approveHalukaConfig.paramSchema as any;

  it('accepts an empty halukot list — the balanced case has no transfers to mark', () => {
    expect(schema.halukot.validate([])).toBe(true);
    expect(schema.halukot.validate(['12'])).toBe(true);
    expect(schema.halukot.validate('12')).toBe(false);
  });

  it('requires a projectId so membership is always checked', () => {
    // `jwt` alone would let any signed-in user finalize any tosplit by id.
    expect(schema.projectId.required).toBe(true);
    expect(
      approveHalukaConfig.authRules?.some(
        (r: any) => r.type === 'projectMember' && r.config?.projectIdParam === 'projectId'
      )
    ).toBe(true);
  });
});
