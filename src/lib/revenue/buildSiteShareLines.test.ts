import { describe, expect, it } from 'vitest';
import { buildSiteShareLines } from './buildSiteShareLines';

const base = {
  payerRole: 'provider' as const,
  baseAmount: 1000,
  treasuryUserId: '999',
  payerUserId: '1',
  projectId: '42',
  matbea: '2',
  config: { pctProvider: 0.03 }
};

describe('buildSiteShareLines', () => {
  it('returns null when the flag is disabled', () => {
    expect(buildSiteShareLines({ ...base, enabled: false })).toBeNull();
  });

  it('returns null when no treasury user is configured', () => {
    expect(buildSiteShareLines({ ...base, enabled: true, treasuryUserId: '' })).toBeNull();
    expect(buildSiteShareLines({ ...base, enabled: true, treasuryUserId: null })).toBeNull();
  });

  it('returns null when the payer is the treasury (no self-transfer)', () => {
    expect(buildSiteShareLines({ ...base, enabled: true, payerUserId: '999' })).toBeNull();
  });

  it('returns null when the computed amount is zero', () => {
    expect(buildSiteShareLines({ ...base, enabled: true, baseAmount: 0 })).toBeNull();
  });

  it('builds a Haluka + Hervachti line for the platform', () => {
    const lines = buildSiteShareLines({ ...base, enabled: true });
    expect(lines).not.toBeNull();
    expect(lines!.siteAmount).toBe(30);

    expect(lines!.halukaData).toMatchObject({
      project: '42',
      usersend: '1',
      userrecive: '999',
      amount: 30,
      matbea: '2',
      confirmed: false,
      proposedAmount: 30
    });

    expect(lines!.hervachtiEntry).toEqual({
      users_permissions_user: 999,
      amount: 30,
      mekabel: true,
      noten: false,
      nirsham: false
    });
  });

  it('defaults the currency to "2" to match the manual-split flow', () => {
    const lines = buildSiteShareLines({ ...base, enabled: true, matbea: undefined });
    expect(lines!.halukaData.matbea).toBe('2');
  });
});
