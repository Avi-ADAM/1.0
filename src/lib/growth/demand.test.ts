import { describe, expect, it } from 'vitest';
import { demandFor, demandGaps, placeReaches, sameCategory, summarizeDemand, wishFromNode, type DemandWish } from './demand';
import { priority } from './insights';
import type { ProspectSummary } from './types';

const NOW = Date.parse('2026-11-24T10:00:00.000Z');
const day = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

function node(id: number, a: Record<string, any>) {
  return { id: String(id), attributes: { createdAt: day(1), ...a } };
}
const cats = (...names: string[]) => ({ data: names.map((name) => ({ attributes: { name } })) });

function summary(over: Partial<ProspectSummary>): ProspectSummary {
  return {
    id: 'p',
    name: 'Biz',
    website: null,
    hasEmail: false,
    hasPhone: false,
    city: null,
    region: null,
    country: null,
    category: null,
    stage: 'discovered',
    furthest: 'discovered',
    stageChangedAt: day(1),
    followUpAt: null,
    nextAction: null,
    createdAt: day(1),
    updatedAt: day(1),
    sourceKinds: [],
    researchStatus: null,
    researchConfidence: null,
    verifiedClaims: 0,
    totalClaims: 0,
    complementary: [],
    profileApproved: false,
    hasProfile: false,
    hasOutreach: false,
    outreachApproved: false,
    hasOnboardingLink: false,
    lastActivity: null,
    ...over
  };
}

describe('wishFromNode', () => {
  it('keeps only what a count needs', () => {
    const w = wishFromNode(
      node(1, {
        name: 'Private wedding of Dana',
        longDes: 'secret',
        categories: cats('Catering'),
        sub_category: 'Kosher catering',
        location_hint: 'Haifa',
        lat: 32.8,
        ratson_proposals: { data: [{ id: '9' }] }
      })
    )!;
    expect(w).toEqual({ id: '1', createdAt: day(1), categories: ['Catering', 'Kosher catering'], place: 'Haifa', online: false, proposals: 1 });
    expect(JSON.stringify(w)).not.toMatch(/Dana|secret|32\.8/);
  });

  it('skips opted-out and uncategorised wishes; online has no place', () => {
    expect(wishFromNode(node(1, { categories: cats('Catering'), aggregation_opt_out: true }))).toBeNull();
    expect(wishFromNode(node(2, { categories: cats() }))).toBeNull();
    expect(wishFromNode(node(3, { categories: cats('Design'), isOnline: true, location_hint: 'Haifa' }))!.place).toBeNull();
    expect(wishFromNode(node(4, { categories: cats('Venue'), location: [{ location_hint: 'Sharon' }] }))!.place).toBe('Sharon');
  });
});

describe('summarizeDemand', () => {
  const wishes: DemandWish[] = [
    { id: '1', createdAt: day(2), categories: ['Catering'], place: 'Haifa', online: false, proposals: 0 },
    { id: '2', createdAt: day(3), categories: ['catering'], place: 'haifa', online: false, proposals: 2 },
    { id: '3', createdAt: day(4), categories: ['Venue'], place: null, online: true, proposals: 0 },
    { id: '4', createdAt: day(400), categories: ['Venue'], place: null, online: true, proposals: 0 }
  ];

  it('counts per category × place, unanswered first, old wishes out', () => {
    const s = summarizeDemand(wishes, NOW);
    expect(s.wishes).toBe(3);
    expect(s.unanswered).toBe(2);
    expect(s.cells).toEqual([
      { category: 'Catering', place: 'Haifa', open: 2, unanswered: 1 },
      { category: 'Venue', place: null, open: 1, unanswered: 1 }
    ]);
  });

  it('matches loosely by category and place', () => {
    expect(sameCategory('Catering', 'catering services')).toBe(true);
    expect(sameCategory('IT', 'Fitness')).toBe(false);
    expect(placeReaches(null, { city: 'Eilat', region: null })).toBe(true);
    expect(placeReaches('Haifa', { city: 'Haifa', region: null })).toBe(true);
    expect(placeReaches('Haifa', { city: 'Eilat', region: 'South' })).toBe(false);
  });

  it('a gap is demand the active network cannot answer', () => {
    const s = summarizeDemand(wishes, NOW);
    const caterer = summary({ id: 'c', category: 'Catering', city: 'Haifa', stage: 'activeProvider' });
    expect(demandGaps([], s).map((g) => g.category)).toEqual(['Catering', 'Venue']);
    expect(demandGaps([caterer], s).find((g) => g.category === 'Catering')?.active).toBe(1);
    const two = [caterer, { ...caterer, id: 'c2' }];
    expect(demandGaps(two, s).map((g) => g.category)).toEqual(['Venue']);
    expect(demandGaps([], null)).toEqual([]);
  });

  it('raises the priority of a business customers are asking for, with the reason', () => {
    const s = summarizeDemand(wishes, NOW);
    const p = summary({ category: 'Catering', city: 'Haifa' });
    expect(demandFor(p, s)).toEqual({ open: 2, unanswered: 1 });
    const without = priority(p, [p]);
    const withDemand = priority(p, [p], s);
    expect(withDemand.score).toBeGreaterThan(without.score);
    expect(withDemand.reasons).toContainEqual({ key: 'demand', value: 2 });
    expect(priority(summary({ category: 'Catering', city: 'Eilat' }), [], s).reasons.some((r) => r.key === 'demand')).toBe(false);
  });
});
