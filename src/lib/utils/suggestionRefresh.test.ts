import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  REFRESH_INTERVAL_MS,
  readLastRefresh,
  shouldRefreshSuggestions,
  writeLastRefresh
} from './suggestionRefresh';

const now = Date.parse('2026-10-08T12:00:00Z');
const base = { hasCaps: true, hasRecords: true, lastRunMs: now - 60_000, nowMs: now };

describe('shouldRefreshSuggestions', () => {
  it('never runs for a user matching cannot work with', () => {
    expect(shouldRefreshSuggestions({ ...base, hasCaps: false, hasRecords: false, lastRunMs: null })).toBe(false);
  });

  it('runs at once while nothing is stored, however recent the last run', () => {
    expect(shouldRefreshSuggestions({ ...base, hasRecords: false })).toBe(true);
  });

  it('runs for a user with suggestions who was never refreshed here — the missed fan-out case', () => {
    expect(shouldRefreshSuggestions({ ...base, lastRunMs: null })).toBe(true);
  });

  it('is throttled inside the interval and due again after it', () => {
    expect(shouldRefreshSuggestions({ ...base, lastRunMs: now - REFRESH_INTERVAL_MS + 1 })).toBe(false);
    expect(shouldRefreshSuggestions({ ...base, lastRunMs: now - REFRESH_INTERVAL_MS })).toBe(true);
  });

  it('treats a timestamp from the future as never-ran', () => {
    expect(shouldRefreshSuggestions({ ...base, lastRunMs: now + 3_600_000 })).toBe(true);
  });
});

describe('last-refresh storage', () => {
  // A Map-backed stub: Node 22's own global localStorage can shadow the DOM one here.
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v))
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('round-trips per user', () => {
    writeLastRefresh(258, now);
    expect(readLastRefresh(258)).toBe(now);
    expect(readLastRefresh(256)).toBeNull();
  });

  it('never throws when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      }
    });
    expect(() => writeLastRefresh(258, now)).not.toThrow();
    expect(readLastRefresh(258)).toBeNull();
  });

  it('reads garbage as unknown', () => {
    localStorage.setItem('lev.suggestionsRefreshedAt.258', 'yesterday');
    expect(readLastRefresh(258)).toBeNull();
  });
});
