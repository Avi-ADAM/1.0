import { describe, it, expect } from 'vitest';
import {
  CLIFF_EPSILON,
  EMPLOYEE_BASE,
  PARTNERSHIPS,
  UNEMPLOYMENT_RATE,
  UNEMPLOYMENT_YEARS,
  buildAllCurves,
  buildCurve,
  curvesMax,
  employeeAt,
  employeeSalary,
  freelancerAt,
  lifetimeTotal,
  partnerAt
} from './incomeCurves.js';

const at = (points: { year: number; value: number }[], year: number) =>
  points.find((p) => Math.abs(p.year - year) < 1e-6)?.value;

describe('employee', () => {
  it('starts at the base salary and steps up only on full years', () => {
    expect(employeeSalary(0)).toBe(EMPLOYEE_BASE);
    expect(employeeSalary(0.9)).toBe(EMPLOYEE_BASE);
    expect(employeeSalary(1)).toBeGreaterThan(employeeSalary(0.9));
    expect(employeeSalary(1.5)).toBe(employeeSalary(1));
  });

  it('grows less than a third over a decade', () => {
    expect(employeeSalary(10) / employeeSalary(0)).toBeLessThan(1.3);
  });

  it('falls to unemployment pay for three months, then to nothing', () => {
    const stop = 7;
    expect(employeeAt(stop - 0.001, stop)).toBeCloseTo(employeeSalary(6), 5);
    expect(employeeAt(stop, stop)).toBeCloseTo(employeeSalary(stop) * UNEMPLOYMENT_RATE, 5);
    expect(employeeAt(stop + UNEMPLOYMENT_YEARS - 0.01, stop)).toBeGreaterThan(0);
    expect(employeeAt(stop + UNEMPLOYMENT_YEARS, stop)).toBe(0);
    expect(employeeAt(10, stop)).toBe(0);
  });
});

describe('freelancer', () => {
  it('starts below the employee and climbs past them', () => {
    expect(freelancerAt(0, 99)).toBeLessThan(employeeAt(0, 99));
    expect(freelancerAt(6, 99)).toBeGreaterThan(employeeAt(6, 99));
  });

  it('climbs monotonically while working', () => {
    for (let y = 0; y < 9.9; y += 0.25) {
      expect(freelancerAt(y + 0.1, 99)).toBeGreaterThan(freelancerAt(y, 99));
    }
  });

  it('drops to zero the day it stops — there is no cover', () => {
    expect(freelancerAt(6.999, 7)).toBeGreaterThan(0);
    expect(freelancerAt(7, 7)).toBe(0);
    expect(freelancerAt(7.1, 7)).toBe(0);
  });
});

describe('partner', () => {
  it('starts slowest of the three', () => {
    expect(partnerAt(0.5, 99)).toBeLessThan(freelancerAt(0.5, 99));
    expect(partnerAt(0.5, 99)).toBeLessThan(employeeAt(0.5, 99));
  });

  it('overtakes both by the end of the decade', () => {
    expect(partnerAt(10, 99)).toBeGreaterThan(freelancerAt(10, 99));
    expect(partnerAt(10, 99)).toBeGreaterThan(employeeAt(10, 99));
  });

  it('keeps paying after the stop instead of falling to zero', () => {
    const stop = 7;
    const atStop = partnerAt(stop, stop);
    expect(atStop).toBeGreaterThan(0);
    expect(partnerAt(10, stop)).toBeGreaterThanOrEqual(atStop);
    expect(partnerAt(10, stop)).toBeGreaterThan(employeeAt(10, stop));
    expect(partnerAt(10, stop)).toBeGreaterThan(freelancerAt(10, stop));
  });

  it('never opens a partnership that starts after the stop', () => {
    const late = PARTNERSHIPS[PARTNERSHIPS.length - 1];
    const withLate = partnerAt(10, 99);
    const withoutLate = partnerAt(10, late.startYear);
    expect(withoutLate).toBeLessThan(withLate);
  });

  it('flattens toward the accrued caps, never above them', () => {
    const stop = 7;
    const accrued = PARTNERSHIPS.filter((p) => p.startYear < stop).reduce((s, p) => s + p.cap, 0);
    expect(partnerAt(30, stop)).toBeLessThanOrEqual(accrued);
  });
});

describe('buildCurve', () => {
  it('samples both sides of the stop so the cliff is vertical', () => {
    const points = buildCurve('freelancer', { stopYear: 7, years: 10 });
    expect(at(points, 7 - CLIFF_EPSILON)).toBeGreaterThan(0);
    expect(at(points, 7)).toBe(0);
  });

  it('returns points in ascending year order, spanning the axis', () => {
    const points = buildCurve('partner', { stopYear: 7, years: 10 });
    expect(points[0].year).toBe(0);
    expect(points[points.length - 1].year).toBe(10);
    for (let i = 1; i < points.length; i++) {
      expect(points[i].year).toBeGreaterThan(points[i - 1].year);
    }
  });

  it('has no stop artefacts when nobody stops inside the span', () => {
    const points = buildCurve('employee', { stopYear: 99, years: 10 });
    expect(points.every((p) => p.value > 0)).toBe(true);
  });
});

describe('totals', () => {
  it('gives the partner the largest decade total, the employee the smallest', () => {
    const curves = buildAllCurves({ stopYear: 7, years: 10 });
    const totals = {
      employee: lifetimeTotal(curves.employee),
      freelancer: lifetimeTotal(curves.freelancer),
      partner: lifetimeTotal(curves.partner)
    };
    expect(totals.partner).toBeGreaterThan(totals.freelancer);
    expect(totals.partner).toBeGreaterThan(totals.employee);
  });

  it('curvesMax covers every plotted point', () => {
    const curves = buildAllCurves({ stopYear: 7, years: 10 });
    const max = curvesMax(curves);
    for (const points of Object.values(curves)) {
      for (const p of points) expect(p.value).toBeLessThanOrEqual(max);
    }
  });
});
