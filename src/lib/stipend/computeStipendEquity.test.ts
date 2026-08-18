import { describe, it, expect } from 'vitest';
import {
  computeStipendEquity,
  computeStipendDilution,
  computeRecipientTradeoff,
  consensusScope,
  effectiveStipendPolicy,
  normalizeTerms,
  validateStipendTerms
} from './computeStipendEquity.js';

// The worked example the plan uses throughout §1: 200 hours at ₪200/h market
// (mission value ₪40,000) with a ₪50/h stipend → P = ₪10,000.
const P = 10_000;
const MISSION_VALUE = 40_000;

describe('computeStipendEquity — the three routes as special cases', () => {
  it('B (α=1, k=1): only the difference lands, rikma total unchanged', () => {
    const lines = computeStipendEquity(P, { mode: 'equity', costShare: 1, equityMultiplier: 1 });
    expect(lines.equityCredit).toBe(10_000);
    expect(lines.equityDebit).toBe(10_000);
    expect(lines.netChange).toBe(0);
    expect(MISSION_VALUE - lines.equityDebit).toBe(30_000);
  });

  it('A1 (α=0, k=1): the rikma carries the cost, total grows by P', () => {
    const lines = computeStipendEquity(P, { mode: 'equity', costShare: 0, equityMultiplier: 1 });
    expect(lines.equityCredit).toBe(10_000);
    expect(lines.equityDebit).toBe(0);
    expect(lines.netChange).toBe(10_000);
    expect(MISSION_VALUE - lines.equityDebit).toBe(40_000);
  });

  it('the middle (α=0.5): half the cost is shared', () => {
    const lines = computeStipendEquity(P, { mode: 'equity', costShare: 0.5, equityMultiplier: 1 });
    expect(lines.equityDebit).toBe(5_000);
    expect(lines.netChange).toBe(5_000);
    expect(MISSION_VALUE - lines.equityDebit).toBe(35_000);
  });

  it('a gift never touches equity', () => {
    const lines = computeStipendEquity(P, { mode: 'gift', costShare: 0, equityMultiplier: 3 });
    expect(lines).toEqual({ equityCredit: 0, equityDebit: 0, netChange: 0 });
  });

  // `advance` was removed as a choice (src/lib/stipend/ADVANCE_MODE.md). Rows
  // written while it existed must keep the behaviour they always had — which
  // was the gift's, exactly: zeros. Reading them as `equity` would hand out
  // percentages nobody agreed to.
  it('reads a legacy advance row as the gift it always behaved like', () => {
    const lines = computeStipendEquity(P, {
      mode: 'advance' as unknown as 'gift',
      costShare: 0,
      equityMultiplier: 3
    });
    expect(lines).toEqual({ equityCredit: 0, equityDebit: 0, netChange: 0 });
  });

  it('a risk premium k>1 grows the rikma even at α=1', () => {
    const lines = computeStipendEquity(P, { mode: 'equity', costShare: 1, equityMultiplier: 1.5 });
    expect(lines.equityCredit).toBe(15_000);
    expect(lines.netChange).toBe(5_000);
  });

  it('is linear in the amount — two half payments equal one whole', () => {
    const terms = { mode: 'equity' as const, costShare: 0.25, equityMultiplier: 1.2 };
    const whole = computeStipendEquity(P, terms);
    const half = computeStipendEquity(P / 2, terms);
    expect(half.netChange * 2).toBeCloseTo(whole.netChange, 6);
  });
});

describe('normalizeTerms', () => {
  it('clamps α into [0,1] and k to at least 1', () => {
    const t = normalizeTerms({ costShare: 4, equityMultiplier: 0.2 });
    expect(t.costShare).toBe(1);
    expect(t.equityMultiplier).toBe(1);
    expect(normalizeTerms({ costShare: -3 }).costShare).toBe(0);
  });

  it('falls back to equity for an unknown mode', () => {
    expect(normalizeTerms({ mode: 'whatever' as any }).mode).toBe('equity');
  });
});

describe('consensusScope — derived from (k − α), never chosen', () => {
  it('is bilateral exactly while the rikma total does not move', () => {
    expect(consensusScope({ mode: 'equity', costShare: 1, equityMultiplier: 1 })).toBe('bilateral');
    expect(consensusScope({ mode: 'gift', costShare: 0, equityMultiplier: 5 })).toBe('bilateral');
  });

  it('turns rikma-wide the moment anyone else is diluted', () => {
    expect(consensusScope({ mode: 'equity', costShare: 0, equityMultiplier: 1 })).toBe('rikma');
    expect(consensusScope({ mode: 'equity', costShare: 0.9, equityMultiplier: 1 })).toBe('rikma');
    expect(consensusScope({ mode: 'equity', costShare: 1, equityMultiplier: 1.1 })).toBe('rikma');
  });
});

describe('effectiveStipendPolicy — null is legacy, and legacy cannot dilute', () => {
  it('reads an unset policy as bilateral', () => {
    expect(effectiveStipendPolicy(null)).toBe('bilateral');
    expect(effectiveStipendPolicy(undefined)).toBe('bilateral');
    expect(effectiveStipendPolicy('collective')).toBe('collective');
  });
});

describe('validateStipendTerms', () => {
  const base = { mode: 'equity' as const, costShare: 1, equityMultiplier: 1, stipendRate: 50 };

  it('accepts a plain bilateral pledge under the legacy policy', () => {
    const v = validateStipendTerms({ terms: base, marketRate: 200, policy: null });
    expect(v.ok).toBe(true);
    expect(v.scope).toBe('bilateral');
  });

  it('refuses a rate above the mission market rate (negative equity)', () => {
    const v = validateStipendTerms({ terms: { ...base, stipendRate: 250 }, marketRate: 200 });
    expect(v.ok).toBe(false);
    expect(v.errors).toContain('rateAboveMarket');
  });

  it('refuses a diluting pledge in a bilateral-only rikma', () => {
    const v = validateStipendTerms({
      terms: { ...base, costShare: 0 },
      marketRate: 200,
      policy: 'bilateral'
    });
    expect(v.errors).toContain('policyBilateralOnly');
    expect(v.scope).toBe('rikma');
  });

  it('allows the same pledge where the rikma chose collective', () => {
    const v = validateStipendTerms({
      terms: { ...base, costShare: 0 },
      marketRate: 200,
      policy: 'collective'
    });
    expect(v.ok).toBe(true);
  });

  // An approved program *is* the rikma agreeing to be diluted, bounded by its
  // cap. Without this the vote bought nothing: every pledge under the program
  // still failed on the policy the program was approved to authorise.
  it('lets an active program authorise a diluting pledge in a bilateral rikma', () => {
    const v = validateStipendTerms({
      terms: { ...base, costShare: 0 },
      marketRate: 200,
      policy: 'bilateral',
      envelope: { costShare: 0, remainingCap: 10_000, active: true }
    });
    expect(v.errors).not.toContain('policyBilateralOnly');
    expect(v.ok).toBe(true);
  });

  it('does not let a program still on the table authorise it', () => {
    const v = validateStipendTerms({
      terms: { ...base, costShare: 0 },
      marketRate: 200,
      policy: 'bilateral',
      envelope: { costShare: 0, remainingCap: 10_000, active: false }
    });
    expect(v.errors).toContain('policyBilateralOnly');
  });

  it('refuses everything where the policy is off', () => {
    const v = validateStipendTerms({ terms: base, marketRate: 200, policy: 'off' });
    expect(v.errors).toContain('policyOff');
  });

  it('holds a pledge inside its program envelope', () => {
    const v = validateStipendTerms({
      terms: { ...base, stipendRate: 80, costShare: 0 },
      marketRate: 200,
      policy: 'collective',
      envelope: { stipendRate: 50, costShare: 0.5, remainingCap: 10_000 }
    });
    expect(v.errors).toContain('outsideEnvelopeRate');
    expect(v.errors).toContain('outsideEnvelopeCostShare');
  });

  it('reports an exhausted program budget', () => {
    const v = validateStipendTerms({
      terms: base,
      marketRate: 200,
      envelope: { remainingCap: 0 }
    });
    expect(v.errors).toContain('programExhausted');
  });

  it('refuses equity on a mission with no market rate', () => {
    const v = validateStipendTerms({ terms: base, marketRate: 0 });
    expect(v.errors).toContain('noMarketRate');
  });
});

describe('computeStipendDilution — the number on the ballot', () => {
  it('leaves everyone untouched when (k − α) = 0', () => {
    const d = computeStipendDilution({
      myTotal: 18_000,
      rikmaTotal: 100_000,
      budget: 60_000,
      terms: { mode: 'equity', costShare: 1, equityMultiplier: 1 }
    });
    expect(d.currentPct).toBe(18);
    expect(d.projectedPct).toBe(18);
    expect(d.deltaPoints).toBe(0);
  });

  it('reproduces the plan card: 18% → 16.2% on a ₪60,000 solidarity budget', () => {
    const d = computeStipendDilution({
      myTotal: 18_000,
      rikmaTotal: 100_000,
      budget: 60_000,
      terms: { mode: 'equity', costShare: 0, equityMultiplier: 1 }
    });
    expect(d.projectedRikmaTotal).toBe(160_000);
    expect(d.projectedPct).toBe(11.25);
    expect(d.deltaPoints).toBe(6.75);
  });

  it('survives a rikma with no accrued value (0/0 is 0%, not NaN)', () => {
    const d = computeStipendDilution({
      myTotal: 0,
      rikmaTotal: 0,
      budget: 0,
      terms: { mode: 'equity', costShare: 0 }
    });
    expect(d.currentPct).toBe(0);
    expect(d.projectedPct).toBe(0);
  });
});

describe('computeRecipientTradeoff — what the signer gives up', () => {
  it('B: the recipient alone pays, so their share drops', () => {
    const r = computeRecipientTradeoff({
      missionValue: MISSION_VALUE,
      stipendTotal: P,
      rikmaTotalWithout: 60_000,
      terms: { mode: 'equity', costShare: 1, equityMultiplier: 1 }
    });
    expect(r.sharePctWithout).toBe(40);
    // 30,000 / (60,000 + 30,000 + 10,000)
    expect(r.sharePctWith).toBe(30);
    expect(r.cash).toBe(P);
    expect(r.equityGivenUp).toBe(P);
  });

  it('A1: the rikma carries it, so the recipient keeps their value', () => {
    const r = computeRecipientTradeoff({
      missionValue: MISSION_VALUE,
      stipendTotal: P,
      rikmaTotalWithout: 60_000,
      terms: { mode: 'equity', costShare: 0, equityMultiplier: 1 }
    });
    expect(r.equityGivenUp).toBe(0);
    // 40,000 / (60,000 + 40,000 + 10,000) — diluted with everyone, not instead of them
    expect(r.sharePctWith).toBeCloseTo(36.36, 1);
  });

  it('gift: cash with no equity consequence at all', () => {
    const r = computeRecipientTradeoff({
      missionValue: MISSION_VALUE,
      stipendTotal: P,
      rikmaTotalWithout: 60_000,
      terms: { mode: 'gift', costShare: 1 }
    });
    expect(r.sharePctWith).toBe(r.sharePctWithout);
    expect(r.cash).toBe(P);
  });
});
