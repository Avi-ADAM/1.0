import { describe, it, expect } from 'vitest';
import { normalizeRules, ruleStance, validateRules, withStandingRules } from './rules';

const TZ = 'Asia/Jerusalem';
// Fri 9 Oct 2026, 08:00 local (05:00Z) and 17:00 local (14:00Z); Sun 11 Oct 08:00 local.
const friMorning = { id: 'fm', start: '2026-10-09T05:00:00Z', end: '2026-10-09T09:00:00Z', need: 1 };
const friEvening = { id: 'fe', start: '2026-10-09T14:00:00Z', end: '2026-10-09T18:00:00Z', need: 1 };
const sunMorning = { id: 'sm', start: '2026-10-11T05:00:00Z', end: '2026-10-11T09:00:00Z', need: 1 };

describe('ruleStance', () => {
  it('matches by local weekday and start time; the first rule that matches wins', () => {
    const rules = [
      { days: [5], from: '06:00', to: '12:00', stance: 'can' as const },
      { days: [5], stance: 'cannot' as const }
    ];
    expect(ruleStance(friMorning, rules, TZ)).toBe('can');
    expect(ruleStance(friEvening, rules, TZ)).toBe('cannot');
    expect(ruleStance(sunMorning, rules, TZ)).toBeNull();
  });

  it('reads the weekday in the plan’s zone, not UTC', () => {
    // Sat 10 Oct 22:30Z is already Sunday 01:30 in Jerusalem.
    expect(ruleStance({ start: '2026-10-10T22:30:00Z' }, [{ days: [0], stance: 'want' }], TZ)).toBe('want');
  });
});

describe('withStandingRules', () => {
  const members = [{ userId: 'ron', rules: [{ days: [5], stance: 'cannot' as const }, { days: [0], stance: 'want' as const }], rulesAt: '2026-09-01T00:00:00Z' }];

  it('fills only the silence — an explicit answer always wins', () => {
    const explicit = [{ shiftId: 'fm', userId: 'ron', stance: 'want' as const, declaredAt: '2026-09-20T00:00:00Z' }];
    const out = withStandingRules(explicit, [friMorning, friEvening, sunMorning], members, TZ);
    expect(out.map((d) => [d.shiftId, d.stance, !!d.fromRule])).toEqual([
      ['fm', 'want', false],
      ['fe', 'cannot', true],
      ['sm', 'want', true]
    ]);
    // Saying it once, early, counts as declaring early.
    expect(out.find((d) => d.shiftId === 'sm')?.declaredAt).toBe('2026-09-01T00:00:00Z');
  });

  it('leaves the declarations untouched when nobody has rules', () => {
    const d = [{ shiftId: 'fm', userId: 'ron', stance: 'can' as const, declaredAt: 'x' }];
    expect(withStandingRules(d, [friMorning], [{ userId: 'ron' }], TZ)).toBe(d);
  });
});

describe('validateRules', () => {
  it('accepts a sane set and names every problem otherwise', () => {
    expect(validateRules([{ days: [5], stance: 'cannot' }, { days: [0, 1], from: '08:00', to: '12:00', stance: 'want' }])).toEqual([]);
    expect(validateRules([{ days: [], stance: 'can' }]).map((i) => i.code)).toEqual(['noDays']);
    expect(validateRules([{ days: [7], stance: 'can' }]).map((i) => i.code)).toEqual(['badDay']);
    expect(validateRules([{ days: [1], from: '12:00', to: '08:00', stance: 'can' }]).map((i) => i.code)).toEqual(['emptyRange']);
    expect(validateRules([{ days: [1], from: '25:00', stance: 'can' }]).map((i) => i.code)).toEqual(['badTime']);
    expect(validateRules([{ days: [1], stance: 'maybe' }]).map((i) => i.code)).toEqual(['badStance']);
    expect(validateRules(Array.from({ length: 21 }, () => ({ days: [1], stance: 'can' }))).some((i) => i.code === 'tooMany')).toBe(true);
  });

  it('normalizes to exactly what a rule is made of', () => {
    expect(normalizeRules([{ days: [5, 1, 5], from: '', stance: 'can', extra: 1 } as any])).toEqual([{ days: [1, 5], stance: 'can' }]);
  });
});
