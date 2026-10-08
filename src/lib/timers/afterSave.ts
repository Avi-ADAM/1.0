/**
 * What the client's `$timers` store looks like once a timer has been saved.
 *
 * `timerSave` answers `{ success, missionId, filed }` — no timer — and on the
 * server it has already marked the timer `saved` and taken it off the mission
 * (`activeTimer: null`). The store used to keep the old entry until a refresh
 * that might never come (the refresh only runs once the socket listener has
 * been set up, and a failed one used to empty the store), so the very next
 * "finish mission" on the same page found the saved intervals, called them
 * unsaved, and offered to save them again.
 */

type StoreTimer = {
  mId: string | number;
  running?: boolean;
  zman?: number;
  attributes?: { activeTimer?: { data?: any; [k: string]: unknown } | null; [k: string]: unknown };
  [k: string]: unknown;
};

/** The timer as `activeTimer.data.attributes` carries it. */
type ActiveTimerAttrs = {
  saved?: boolean | null;
  totalHours?: number | null;
  timers?: unknown[] | null;
} | null | undefined;

/**
 * Logged time on the mission's current timer that has not been saved yet —
 * the gate in front of "finish mission".
 */
export function hasUnsavedTime(attrs: ActiveTimerAttrs): boolean {
  if (!attrs || attrs.saved === true) return false;
  return (attrs.timers?.length ?? 0) > 0 || (Number(attrs.totalHours) || 0) > 0;
}

/**
 * The store with this mission's saved timer taken off it, the way the server
 * now has it. Every other mission is returned untouched (same object).
 */
export function withoutSavedTimer<T extends StoreTimer>(list: T[], missionId: string | number): T[] {
  return list.map((x) =>
    String(x.mId) === String(missionId)
      ? {
          ...x,
          running: false,
          zman: 0,
          attributes: {
            ...x.attributes,
            activeTimer: { ...(x.attributes?.activeTimer ?? {}), data: null, isActive: false }
          }
        }
      : x
  );
}
