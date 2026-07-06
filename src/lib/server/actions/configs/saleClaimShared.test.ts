import { describe, it, expect } from 'vitest';
import {
  standingOrder,
  standingSaleVersion,
  bothPartiesSigned,
  normalizeVots,
  restimeToMs,
  type SaleClaim,
} from './saleClaimShared';

function claim(overrides: Partial<NonNullable<SaleClaim>> = {}): NonNullable<SaleClaim> {
  return {
    id: 'd1',
    kind: 'saleClaim',
    archived: false,
    vots: [],
    negom: [],
    saleId: 's1',
    saleUnit: 7,
    saleIn: 3500,
    saleDate: '2026-01-01T00:00:00.000Z',
    saleStartDate: null,
    saleFinishDate: null,
    holderId: 'H',
    reporterId: 'R',
    matanotId: 'm1',
    matanotQuant: 10,
    restime: 'sth',
    ...overrides,
  };
}

describe('standingOrder', () => {
  it('is round 1 with no negom (the original claim)', () => {
    expect(standingOrder(claim())).toBe(1);
  });
  it('advances one per negom precision round', () => {
    expect(standingOrder(claim({ negom: [{ hm: 5, price: 500 }] }))).toBe(2);
    expect(standingOrder(claim({ negom: [{ hm: 5 }, { hm: 4 }] }))).toBe(3);
  });
});

describe('standingSaleVersion', () => {
  it('round 1 returns the original sale values', () => {
    const v = standingSaleVersion(claim(), 1);
    expect(v).toMatchObject({ in: 3500, unit: 7 });
  });
  it('round 2 derives total from negom quantity × price', () => {
    const c = claim({ negom: [{ hm: 5, price: 500, sqadualed: '2026-02-01T00:00:00.000Z' }] });
    const v = standingSaleVersion(c, 2);
    expect(v.unit).toBe(5);
    expect(v.in).toBe(2500); // 5 × 500
    expect(v.startDate).toBe('2026-02-01T00:00:00.000Z');
  });
  it('a zero-quantity counter matures to an empty (0) sale', () => {
    const c = claim({ negom: [{ hm: 0, price: 500 }] });
    const v = standingSaleVersion(c, 2);
    expect(v.unit).toBe(0);
    expect(v.in).toBe(0);
  });
});

describe('bothPartiesSigned', () => {
  const sign = (uid: string, order: number) => ({ users_permissions_user: uid, order, what: true });

  it('false when only one party signed the standing round', () => {
    expect(bothPartiesSigned([sign('R', 1)], 1, 'H', 'R')).toBe(false);
  });
  it('true when both parties signed the same round', () => {
    expect(bothPartiesSigned([sign('R', 1), sign('H', 1)], 1, 'H', 'R')).toBe(true);
  });
  it('false when the two signatures are on different rounds', () => {
    expect(bothPartiesSigned([sign('R', 1), sign('H', 2)], 2, 'H', 'R')).toBe(false);
  });
});

describe('normalizeVots', () => {
  it('maps to ComponentProjectsVotsInput shape and drops the round id', () => {
    const out = normalizeVots([{ userId: '42', order: 1, what: true, zman: 'z' }]);
    expect(out[0]).toMatchObject({ what: true, users_permissions_user: '42', ide: 42, order: 1, zman: 'z' });
    expect(out[0]).not.toHaveProperty('id');
  });
});

describe('restimeToMs', () => {
  it('maps known restime enums', () => {
    expect(restimeToMs('feh')).toBe(48 * 3600 * 1000);
    expect(restimeToMs('sth')).toBe(72 * 3600 * 1000);
    expect(restimeToMs('sevend')).toBe(168 * 3600 * 1000);
  });
  it('defaults to 72h for unknown/null', () => {
    expect(restimeToMs(null)).toBe(72 * 3600 * 1000);
    expect(restimeToMs('???')).toBe(72 * 3600 * 1000);
  });
});
