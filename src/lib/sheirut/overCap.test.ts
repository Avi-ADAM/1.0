import { describe, expect, it } from 'vitest';
import { isHeldForCustomer, splitAtCap } from './overCap';

describe('splitAtCap', () => {
  it('files everything that fits under the ceiling', () => {
    expect(splitAtCap({ cap: 600, approved: 100, hours: 5, rate: 100 })).toEqual({
      inHours: 5,
      overHours: 0,
      headroom: 500,
      overValue: 0
    });
  });

  it('holds the hours above the ceiling', () => {
    const s = splitAtCap({ cap: 600, approved: 400, hours: 5, rate: 100 });
    expect(s.inHours).toBe(2);
    expect(s.overHours).toBe(3);
    expect(s.overValue).toBe(300);
    expect(s.headroom).toBe(200);
  });

  it('holds everything once the ceiling is reached', () => {
    const s = splitAtCap({ cap: 600, approved: 600, hours: 1.5, rate: 100 });
    expect(s.inHours).toBe(0);
    expect(s.overHours).toBe(1.5);
  });

  it('rounds what fits down to whole minutes, never over the ceiling', () => {
    // 50 ₪ of headroom at 70 ₪/h = 42.857 minutes → 42 fit
    const s = splitAtCap({ cap: 50, approved: 0, hours: 1, rate: 70 });
    expect(Math.round(s.inHours * 60)).toBe(42);
    expect(s.inHours * 70).toBeLessThanOrEqual(50);
    expect(Math.round(s.overHours * 60)).toBe(18);
  });

  it('treats a clock’s seconds as noise, not a claim', () => {
    // a minute at 30 ₪/h is 0.5 ₪ above the ceiling — files whole
    const s = splitAtCap({ cap: 1000, approved: 1000, hours: 0.016667, rate: 30 });
    expect(s.overHours).toBe(0);
    expect(s.inHours).toBeCloseTo(0.016667, 5);
  });

  it('never holds work valued at nothing', () => {
    expect(splitAtCap({ cap: 0, approved: 0, hours: 3, rate: 0 }).overHours).toBe(0);
  });

  it('reads junk as zero', () => {
    expect(splitAtCap({ cap: NaN, approved: -5, hours: 2, rate: 10 } as any)).toMatchObject({
      inHours: 0,
      overHours: 2
    });
  });
});

describe('isHeldForCustomer', () => {
  it('is held when the rikma is done and nobody objects', () => {
    expect(isHeldForCustomer({ archived: false, clockDone: true, standing: [{ what: true }] })).toBe(true);
  });
  it('is held when every member signed, clock or not', () => {
    expect(isHeldForCustomer({ archived: false, clockDone: null, allMembersSigned: true, standing: [{ what: true }] })).toBe(true);
  });
  it('is not held while the rikma still decides', () => {
    expect(isHeldForCustomer({ archived: false, clockDone: false, allMembersSigned: false, standing: [{ what: true }] })).toBe(false);
    expect(isHeldForCustomer({ archived: false, clockDone: null, standing: [{ what: true }] })).toBe(false);
  });
  it('is not held when the standing version is disputed', () => {
    expect(isHeldForCustomer({ archived: false, clockDone: true, standing: [{ what: false }] })).toBe(false);
  });
  it('is not held once closed', () => {
    expect(isHeldForCustomer({ archived: true, clockDone: true, standing: [] })).toBe(false);
  });
});
