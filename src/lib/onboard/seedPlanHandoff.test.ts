import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearSeedPlan,
  countStashedItems,
  peekSeedPlan,
  stashSeedPlan,
  takeSeedPlan
} from './seedPlanHandoff.js';

const plan = {
  boards: [
    { title: 'What we sell', items: [{ kind: 'product', name: 'Breakfast' }, { kind: 'mission', name: 'Order page' }] },
    { title: 'The space', items: [{ kind: 'resource', name: 'Espresso machine' }] }
  ],
  sourceUrl: 'https://cafe.example'
};

describe('seedPlanHandoff', () => {
  beforeEach(() => clearSeedPlan());

  it('carries a plan across the creation step', () => {
    stashSeedPlan(plan, 'url');
    const parked = peekSeedPlan();
    expect(parked.boards).toHaveLength(2);
    expect(parked.sourceUrl).toBe('https://cafe.example');
    expect(parked.source).toBe('url');
  });

  it('is consumed on take, so it cannot leak into the next rikma', () => {
    stashSeedPlan(plan, 'describe');
    expect(takeSeedPlan()).not.toBeNull();
    expect(takeSeedPlan()).toBeNull();
    expect(peekSeedPlan()).toBeNull();
  });

  it('stashing nothing clears whatever was parked', () => {
    stashSeedPlan(plan, 'url');
    stashSeedPlan(null);
    expect(peekSeedPlan()).toBeNull();

    stashSeedPlan(plan, 'url');
    stashSeedPlan({ boards: [] });
    expect(peekSeedPlan()).toBeNull();
  });

  it('treats corrupt storage as no plan rather than throwing', () => {
    sessionStorage.setItem('onboard.seedPlan', '{not json');
    expect(peekSeedPlan()).toBeNull();

    sessionStorage.setItem('onboard.seedPlan', JSON.stringify({ boards: 'nope' }));
    expect(peekSeedPlan()).toBeNull();
  });

  it('counts the parked rows for the pre-approval message', () => {
    expect(countStashedItems(plan)).toBe(3);
    expect(countStashedItems(null)).toBe(0);
    expect(countStashedItems({ boards: [{ title: 'x' }] })).toBe(0);
  });
});
