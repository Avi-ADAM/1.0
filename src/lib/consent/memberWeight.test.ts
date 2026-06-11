import { describe, it, expect } from 'vitest';
import {
  computeMemberWeights, totalWeight, positiveWeightMembers, shareBps
} from './memberWeight';

describe('computeMemberWeights — what counts toward voting weight', () => {
  it('sums FinnishedMission totals per contributor', () => {
    const w = computeMemberWeights([
      { contributor: 'avi',  total: 100 },
      { contributor: 'avi',  total: 50  },
      { contributor: 'dana', total: 200 }
    ]);
    expect(w.get('avi')).toBe(15000n);   // 150 ILS in agorot
    expect(w.get('dana')).toBe(20000n);  // 200 ILS in agorot
  });

  it('combines mission totals with resource (Rikmash) totals', () => {
    const w = computeMemberWeights([
      { contributor: 'avi',  total: 100 },     // FinnishedMission
      { contributor: 'avi',  total: '50.50' }, // Rikmash from string
      { contributor: 'dana', total: 200 }
    ]);
    expect(w.get('avi')).toBe(15050n);
    expect(w.get('dana')).toBe(20000n);
  });

  it('handles float quirks via toFixed(2)', () => {
    // 0.1 + 0.2 in float == 0.30000000000000004; toFixed keeps it sane
    const w = computeMemberWeights([
      { contributor: 'avi', total: 0.1 },
      { contributor: 'avi', total: 0.2 }
    ]);
    expect(w.get('avi')).toBe(30n);  // 0.30 ILS = 30 agorot
  });

  it('returns empty map for empty input', () => {
    expect(computeMemberWeights([])).toEqual(new Map());
  });

  it('skips items without contributor', () => {
    const w = computeMemberWeights([
      { contributor: '', total: 100 },
      { contributor: 'avi', total: 50 }
    ]);
    expect(w.get('avi')).toBe(5000n);
    expect(w.size).toBe(1);
  });
});

describe('totalWeight', () => {
  it('sums everyone\'s weight', () => {
    const w = computeMemberWeights([
      { contributor: 'avi',  total: 100 },
      { contributor: 'dana', total: 200 }
    ]);
    expect(totalWeight(w)).toBe(30000n);
  });

  it('is zero for empty map', () => {
    expect(totalWeight(new Map())).toBe(0n);
  });
});

describe('positiveWeightMembers — who can effectively vote', () => {
  it('returns only members with weight > 0', () => {
    // Simulates the current central rikma state: 2 contributing of 10.
    const w = new Map<string, bigint>([
      ['founder-A', 5000n],
      ['founder-B', 3000n],
      ['committed-1', 0n],
      ['committed-2', 0n]
    ]);
    expect(positiveWeightMembers(w).sort()).toEqual(['founder-A', 'founder-B']);
  });
});

describe('shareBps — basis points share', () => {
  it('returns 0 for zero-weight member', () => {
    const w = new Map<string, bigint>([['avi', 5000n], ['committed', 0n]]);
    expect(shareBps('committed', w)).toBe(0);
  });

  it('computes correct share', () => {
    const w = new Map<string, bigint>([['avi', 6000n], ['dana', 4000n]]);
    expect(shareBps('avi', w)).toBe(6000);  // 60.00%
    expect(shareBps('dana', w)).toBe(4000);
  });

  it('handles single-member case', () => {
    const w = new Map<string, bigint>([['avi', 100n]]);
    expect(shareBps('avi', w)).toBe(10000);  // 100%
  });

  it('returns 0 when total is zero', () => {
    const w = new Map<string, bigint>([['avi', 0n]]);
    expect(shareBps('avi', w)).toBe(0);
  });
});
