/**
 * Start / stop a mission timer.
 *
 * The optimistic-update dance around `startTimer` / `stopTimer` (write the new
 * running segment into the store *before* the round-trip, revert on failure)
 * used to live inside `components/timers/timer.svelte`. It is not view logic —
 * the business theme renders the very same timers as a list rather than as a
 * dial, and a second hand-written copy of this would be a second place for the
 * revert to drift out of sync with the server.
 *
 * The dialogs are NOT here: what a view does once a stop succeeded (open the
 * save dialog, take an edit lock) is the view's own business.
 */

import { get } from 'svelte/store';
import { startTimer, stopTimer } from '$lib/func/timers.js';
import { timers, updateTimers } from '$lib/stores/timers';

/**
 * Rewrite one timer's running state (and optionally its active-timer payload)
 * in the global store, leaving every other timer untouched.
 *
 * @param {string|number} missionId
 * @param {boolean} running
 * @param {any} [data] the fresh `activeTimer.data` from the server, when there is one
 */
export function applyTimerState(missionId, running, data = null) {
  updateTimers(
    get(timers).map((t) =>
      t.mId === missionId
        ? {
            ...t,
            running,
            attributes: {
              ...t.attributes,
              activeTimer: {
                ...t.attributes?.activeTimer,
                data: data || t.attributes?.activeTimer?.data,
                isActive: running
              }
            }
          }
        : t
    )
  );
}

/**
 * @param {any} timer a row from the `timers` store
 * @param {string|number} uid
 * @returns {Promise<boolean>} whether the server accepted the start
 */
export async function startMissionTimer(timer, uid) {
  if (!timer) return false;

  const now = new Date().toISOString();

  // Captured BEFORE the optimistic write: the API decides what to do from the
  // state it is handed, and handing it the state we just faked would make it
  // think the timer is already running.
  const activeTimer = timer.attributes?.activeTimer;
  const currentData = activeTimer?.data;
  const missionId = timer.mId;
  const projectId = timer.projectId;
  // A saved timer starts a fresh row rather than reopening the saved one.
  const timerId = currentData?.attributes?.saved ? 0 : currentData?.id || 0;

  const optimisticData = {
    ...currentData,
    id: currentData?.id,
    attributes: {
      ...currentData?.attributes,
      isActive: true,
      timers: [...(currentData?.attributes?.timers || []), { start: now, stop: null }]
    }
  };

  applyTimerState(missionId, true, optimisticData);

  try {
    const res = await startTimer(
      activeTimer,
      String(missionId),
      String(uid),
      String(projectId),
      fetch,
      timerId,
      false
    );
    if (res) applyTimerState(missionId, true, res);
    return true;
  } catch (e) {
    console.error('Start failed', e);
    applyTimerState(missionId, false);
    return false;
  }
}

/**
 * @param {any} timer a row from the `timers` store
 * @param {string|number} uid
 * @returns {Promise<boolean>} whether the server accepted the stop
 */
export async function stopMissionTimer(timer, uid) {
  if (!timer) return false;

  const timerData = timer.attributes?.activeTimer?.data;
  const missionId = timer.mId;
  const projectId = timer.projectId;

  applyTimerState(missionId, false);

  try {
    const res = await stopTimer(timerData, fetch, false, String(projectId), String(uid));
    if (res) {
      applyTimerState(missionId, false, res);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Stop failed', e);
    applyTimerState(missionId, true); // revert
    return false;
  }
}
