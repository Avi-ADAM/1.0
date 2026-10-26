import { describe, it, expect } from 'vitest';
import { availableUntilFrom, DEFAULT_AVAILABLE_MINUTES, MAX_AVAILABLE_MINUTES } from './toggleOnline';

const NOW = Date.UTC(2026, 9, 26, 9, 0, 0);
const minutesFromNow = (iso: string) => (Date.parse(iso) - NOW) / 60_000;

describe('availableUntilFrom', () => {
  it('defaults to an hour when no duration is given', () => {
    expect(minutesFromNow(availableUntilFrom(undefined, NOW))).toBe(DEFAULT_AVAILABLE_MINUTES);
    expect(DEFAULT_AVAILABLE_MINUTES).toBe(60);
  });

  it('uses the chosen duration', () => {
    expect(minutesFromNow(availableUntilFrom(240, NOW))).toBe(240);
  });

  it('never goes past 20 hours', () => {
    expect(MAX_AVAILABLE_MINUTES).toBe(1200);
    expect(minutesFromNow(availableUntilFrom(5000, NOW))).toBe(1200);
  });

  it('falls back to the default for nonsense, and floors tiny values', () => {
    expect(minutesFromNow(availableUntilFrom('abc', NOW))).toBe(60);
    expect(minutesFromNow(availableUntilFrom(-3, NOW))).toBe(60);
    expect(minutesFromNow(availableUntilFrom(1, NOW))).toBe(5);
  });
});
