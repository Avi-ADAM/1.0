import { sendToSer } from './../send/sendToSer.js';
import { browser } from '$app/environment';

/**
 * Executes a timer action via the unified action system.
 * 
 * @param {string} actionType - 'timerStart', 'timerStop', or 'timerSave'
 * @param {Object} params - Action parameters
 * @param {Function} [fetchFn] - Optional fetch function
 * @returns {Promise<Object|null>} - The resulting data or null on failure
 */
async function executeTimerAction(actionType, params, fetchFn = null) {
  // Only execute actions from browser context
  if (!browser) return null;
  
  try {
    const useFetch = fetchFn || fetch;
    const response = await useFetch('/api/action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        actionKey: actionType,
        params
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`[Timers] ${actionType} executed successfully`, result);
      return result.data;
    } else {
      const errorText = await response.text();
      console.warn(`[Timers] Failed to execute ${actionType}:`, errorText);
      return null;
    }
  } catch (error) {
    console.error(`[Timers] Error executing ${actionType}:`, error);
    return null;
  }
}

// Function to start (or resume) the timer for a mission
/**
 * Starts a timer for tracking activities
 * @param {Object} activeTimer - The active timer object to be started
 * @param {string} missionID - The ID of the mission associated with the timer
 * @param {string} uId - User ID
 * @param {string} pId - Project ID
 * @param {number|string} [timerId=0] - Optional timer ID, defaults to 0
 * @param {boolean} [isSer=false] - Flag indicating if this is a server operation
 * @param {Function} fetch - Fetch function
 * @param {Object} [options={}] - Optional additional options
 * @returns {Promise<Object>} - The created or updated timer data
 */
export async function startTimer(activeTimer, missionID, uId, pId, fetch, timerId = 0, isSer = false, options) {
  console.log('Starting timer:', { missionID, timerId });
  
  const now = new Date().toISOString();
  const params = {
    missionId: missionID.toString(),
    projectId: pId.toString(),
    userId: uId.toString(),
    timerId: timerId.toString(),
    isActive: true
  };

  const isSaved = activeTimer?.data?.attributes?.saved === true;
  const timerExists = !!activeTimer?.data;

  // Case 1: No active timer exists OR the existing one is already saved – create a new one
  if (timerId == 0 || timerId == '0' || !timerExists || isSaved) {
    console.log("[Timers] Creating new timer (either none exists or existing is saved)");
    params.timerId = '0'; // Ensure we tell the action to create a new one
    params.start = now;
    params.timers = [{ start: now }];
    params.totalHours = 0;
  } else if (!activeTimer.data.attributes.isActive) {
    // Case 2: Resume existing unsaved timer
    console.log("[Timers] Resuming existing unsaved timer:", timerId);
    let timers = (activeTimer.data.attributes.timers || []).map(t => ({ start: t.start, stop: t.stop }));
    timers.push({ start: now });
    
    params.timers = timers;
    params.newStart = now;
  } else {
    console.log("Timer is already active");
    return activeTimer.data;
  }
  
  return await executeTimerAction('timerStart', params, fetch);
}

// Function to stop the timer
/**
 * Stops a timer for a mission
 * @param {Object} timer - The timer object to stop
 * @param {Function} fetch - Fetch function
 * @param {boolean} [isSer=false] - Flag indicating if this is a server operation
 * @param {string} [projectId=''] - Project ID
 * @param {string} [userId=''] - User ID
 * @returns {Promise<Object>} - The updated timer data
 */
export async function stopTimer(timer, fetch, isSer = false, projectId = '', userId = '') {
  console.log('Stopping timer:', timer?.id);
  
  if (timer && timer.attributes?.isActive) {
    const now = new Date().toISOString();
    let intervals = [...(timer.attributes.timers || [])];
    
    if (intervals.length > 0) {
      const lastInterval = { ...intervals[intervals.length - 1] };
      lastInterval.stop = now;
      intervals[intervals.length - 1] = lastInterval;
      
      const startTime = new Date(lastInterval.start);
      const stopTime = new Date(now);
      const duration = (stopTime.getTime() - startTime.getTime()) / 1000 / 60 / 60;
      
      let accumulatedTime = (timer.attributes.totalHours || 0) + duration;

      const params = {
        timerId: timer.id.toString(),
        projectId: projectId.toString(),
        userId: userId.toString(),
        isActive: false,
        totalHours: accumulatedTime,
        timers: intervals.map(t => ({ start: t.start, stop: t.stop }))
      };

      return await executeTimerAction('timerStop', params, fetch);
    }
  }
  return timer;
}

/**
 * Saves the timer and updates the mission with total hours
 * @param {Object} timer - The timer object (from store)
 * @param {string} missionID - Mission ID
 * @param {Function} fetch - Fetch function
 * @param {boolean} [isSer=false] - Flag indicating if this is a server operation
 * @param {Array} [tasks=null] - Optional task IDs
 * @param {string} [projectId=''] - Project ID
 * @param {string} [userId=''] - User ID
 * @returns {Promise<Object>} - Results
 */
export async function saveTimer(timer, missionID, fetch, isSer = false, tasks = null, projectId = '', userId = '') {
  try {
    if (!timer || !missionID) {
      console.error("Missing parameters for saveTimer");
      return null;
    }

    // Calculate total hours
    let sessionHours = timer.attributes?.activeTimer?.data?.attributes?.totalHours || 0;
    if (timer.attributes?.activeTimer?.data?.attributes?.timers) {
      sessionHours = calculateTotalHours(timer.attributes.activeTimer.data.attributes.timers);
    }
    
    const currentHoursAlready = timer.attributes?.howmanyhoursalready || 0;
    const totalToSave = sessionHours + currentHoursAlready;

    const params = {
      missionId: missionID.toString(),
      mId: missionID.toString(),
      timerId: timer.attributes?.activeTimer?.data?.id?.toString(),
      projectId: projectId.toString(),
      userId: userId.toString(),
      howmanyhoursalready: totalToSave,
      totalHours: sessionHours,
      stname: "saved",
      x: 0,
      tasks: tasks || []
    };

    return await executeTimerAction('timerSave', params, fetch);
  } catch (error) {
    console.error("Error in saveTimer:", error);
    return null;
  }
}

/**
 * Calculates total hours from timer intervals
 * @param {Array} timers - Array of timer segments with start and stop
 * @returns {number} - Total hours
 */
export function calculateTotalHours(timers) {
  if (!timers || !Array.isArray(timers) || timers.length === 0) {
    return 0;
  }
  
  let totalMilliseconds = 0;
  for (const entry of timers) {
    if (entry.start && entry.stop) {
      const start = new Date(entry.start).getTime();
      const stop = new Date(entry.stop).getTime();
      if (!isNaN(start) && !isNaN(stop) && stop > start) {
        totalMilliseconds += (stop - start);
      }
    }
  }
  return totalMilliseconds / 1000 / 60 / 60;
}

/**
 * Updates a timer with specific parameters (tasks or segments)
 */
export async function updateTimer(timer, whatToUpdate, params = {}, fetch) {
  if (!timer) return null;
  
  switch (whatToUpdate) {
    case 'timers': {
      const { oldLap, newLap, index } = params;
      const timers = (timer.attributes.timers || []).map((t, i) => {
        if (i === index) return { start: newLap.start, stop: newLap.stop };
        return { start: t.start, stop: t.stop };
      });

      const totalTime = (timer.attributes.totalHours || 0) -
        ((new Date(oldLap.stop).getTime() - new Date(oldLap.start).getTime()) / 1000 / 60 / 60) +
        ((new Date(newLap.stop).getTime() - new Date(newLap.start).getTime()) / 1000 / 60 / 60);

      const updateParams = {
        timerId: timer.id.toString(),
        totalHours: totalTime,
        timers: timers
      };
      
      return await executeTimerAction('timerStop', updateParams, fetch);
    }
    
    case 'tasks': {
      const paramsToUpdate = {
        timerId: timer.id.toString(),
        tasks: (params.selectedTaskIds || []).map(id => id.toString())
      };
      
      return await executeTimerAction('timerStop', paramsToUpdate, fetch);
    }
    
    default:
      console.warn(`[Timers] Unknown update type: ${whatToUpdate}`);
      return null;
  }
}

/**
 * Clears a single interval from the timer
 */
export async function handleClearSingle(index, timer, fetch, isSer = false) {
  let timers = [...(timer.attributes.activeTimer.data.attributes.timers || [])];
  
  const total = timer.attributes.activeTimer.data.attributes.totalHours || 0;
  const start = new Date(timers[index].start).getTime();
  const stop = new Date(timers[index].stop).getTime();
  const duration = (stop - start) / 1000 / 60 / 60;
  
  let newTotal = total - duration;
  timers.splice(index, 1);

  return await executeTimerAction('timerStop', {
    timerId: timer.attributes.activeTimer.data.id.toString(),
    isActive: false,
    totalHours: newTotal,
    timers: timers.map(t => ({ start: t.start, stop: t.stop }))
  }, fetch);
}

/**
 * Clears all intervals from the timer
 */
export async function handleClearAll(timer, fetch, isSer = false) {
  return await executeTimerAction('timerStop', {
    timerId: timer.attributes.activeTimer.data.id.toString(),
    isActive: false,
    totalHours: 0,
    timers: []
  }, fetch);
}

/**
 * Recalculates mission hours from historical timers
 */
export async function recalculateMissionHours(missionId, fetch) {
  try {
    const res = await sendToSer({ missionId }, '88GetMissionTimersForRecalc', null, null, false, fetch);
    const data = res?.data;

    if (!data || !data.timers) return null;

    const allTimers = data.timers.data;
    let totalSavedMilliseconds = 0;

    for (const t of allTimers) {
      const intervals = t.attributes.timers || [];
      for (const interval of intervals) {
        if (interval.start && interval.stop) {
          const start = new Date(interval.start).getTime();
          const stop = new Date(interval.stop).getTime();
          if (!isNaN(start) && !isNaN(stop) && stop > start) {
            totalSavedMilliseconds += (stop - start);
          }
        }
      }
    }

    const savedHours = totalSavedMilliseconds / 1000 / 60 / 60;

    if (data.mesimabetahalich?.data) {
      await sendToSer({
        mId: missionId,
        howmanyhoursalready: savedHours,
        stname: "recalculated",
        x: 0,
      }, '11saveTimer', null, null, false, fetch);
    }

    return { savedHours, totalHours: savedHours };
  } catch (error) {
    console.error("Error recalculating mission hours:", error);
    return null;
  }
}
