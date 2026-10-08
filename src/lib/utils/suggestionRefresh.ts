/**
 * When the lev page re-runs `refreshMySuggestions` for the viewer.
 *
 * Suggestions are written by events (a mission was created, a profile
 * changed). An event that fails — the 'missionCreated' fan-out timed out on
 * 2026-10-07 — is never retried, so the visit is the safety net: a user with
 * capabilities rescans the open missions/resources at most once per
 * `REFRESH_INTERVAL_MS`, and right away while they have nothing stored at all.
 * The scan only adds rows it has not created before, so a rerun is cheap.
 */

export const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

const KEY_PREFIX = 'lev.suggestionsRefreshedAt.';

export interface RefreshInput {
  /** The user offers something matching can work with (skills, roles, resources). */
  hasCaps: boolean;
  /** At least one stored suggestion came back. */
  hasRecords: boolean;
  /** When this browser last ran the refresh for this user, or null. */
  lastRunMs: number | null;
  nowMs: number;
}

export function shouldRefreshSuggestions({ hasCaps, hasRecords, lastRunMs, nowMs }: RefreshInput): boolean {
  if (!hasCaps) return false;
  if (!hasRecords) return true;
  if (lastRunMs == null || !Number.isFinite(lastRunMs)) return true;
  // A clock that went backwards reads as "never ran", not "ran in the future".
  if (lastRunMs > nowMs) return true;
  return nowMs - lastRunMs >= REFRESH_INTERVAL_MS;
}

/** Last refresh time for this user in this browser; null when unknown or unreadable. */
export function readLastRefresh(userId: string | number): number | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + userId);
    const n = raw == null ? NaN : Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function writeLastRefresh(userId: string | number, nowMs: number): void {
  try {
    localStorage.setItem(KEY_PREFIX + userId, String(nowMs));
  } catch {
    // private mode / blocked storage: the next visit simply refreshes again
  }
}
