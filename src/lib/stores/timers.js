import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { sendToSer } from '$lib/send/sendToSer.js';
import { writable, get } from 'svelte/store';
import { socketClient } from '$lib/stores/socketClient';

let currentUid = null;
let currentFetch = null;
let fetchTimeout = null; // Add a variable to hold the timeout ID
let timerUnsubscribe = null; // For unsubscribing from notifications

// ===== Edit Lock System =====
// Prevents remote socket updates from overwriting locally-edited timers
const editLocks = new Map(); // missionId -> timestamp

/**
 * Lock a timer to prevent remote updates while editing locally.
 * @param {string|number} missionId
 */
export function lockTimerForEdit(missionId) {
    console.log('[Timers] Locking timer for edit:', missionId);
    editLocks.set(String(missionId), Date.now());
}

/**
 * Unlock a timer, allowing remote updates again.
 * Optionally triggers an immediate refresh to sync with server.
 * @param {string|number} missionId
 * @param {{ refresh?: boolean }} options
 */
export function unlockTimerForEdit(missionId, options = {}) {
    console.log('[Timers] Unlocking timer for edit:', missionId);
    editLocks.delete(String(missionId));

    // After unlocking, optionally refresh to get latest server state
    if (options.refresh && currentUid && currentFetch) {
        setTimeout(() => {
            fetchTimers(currentUid, currentFetch, { isRemoteUpdate: true });
        }, 500);
    }
}

/**
 * Check if a timer is currently locked for local editing.
 * Locks auto-expire after 60 seconds as a safety net.
 * @param {string|number} missionId
 * @returns {boolean}
 */
export function isTimerLocked(missionId) {
    const lockTime = editLocks.get(String(missionId));
    if (!lockTime) return false;
    // Auto-expire lock after 60 seconds (safety net)
    if (Date.now() - lockTime > 60000) {
        editLocks.delete(String(missionId));
        return false;
    }
    return true;
}

/**
 * Initialize timer updates listener using the new socketClient.
 * This replaces the old WebSocket-based timer updates.
 * 
 * @param {string} id - User ID
 * @param {Function} fetch - Fetch function for making HTTP requests
 * @returns {Function} Unsubscribe function to stop listening
 */
export function initialWebSocketForTimer(id, fetch) {
    currentUid = id;
    currentFetch = fetch;

    // Clean up any existing subscription
    if (timerUnsubscribe) {
        timerUnsubscribe();
        timerUnsubscribe = null;
    }

    console.log('[Timers] Initializing timer updates listener for user:', id);

    // Subscribe to notifications from the new socketClient
    timerUnsubscribe = socketClient.onNotification((notification) => {
        console.log('[Timers] Received notification:', notification);

        // Check if this is a timer-related notification
        const meta = notification.metadata || {};
        const notificationType = meta.type;

        if (notificationType === 'timerUpdate') {
            console.log('[Timers] Timer update notification received');

            // Debounce the fetchTimers call to prevent multiple rapid fetches
            if (fetchTimeout) {
                clearTimeout(fetchTimeout);
            }

            fetchTimeout = setTimeout(() => {
                if (currentUid && currentFetch) {
                    console.log('[Timers] Refreshing timers after notification');
                    fetchTimers(currentUid, currentFetch, { isRemoteUpdate: true });
                } else {
                    console.error('[Timers] Cannot reload timers: uid or fetch not available.');
                }
                fetchTimeout = null;
            }, 300);
        }
    });

    // Return unsubscribe function for cleanup
    return () => {
        if (timerUnsubscribe) {
            timerUnsubscribe();
            timerUnsubscribe = null;
        }
        if (fetchTimeout) {
            clearTimeout(fetchTimeout);
            fetchTimeout = null;
        }
    };
}

/**
 * Clean up timer listener.
 * Call this when unmounting components that use timers.
 */
export function cleanupTimerListener() {
    if (timerUnsubscribe) {
        timerUnsubscribe();
        timerUnsubscribe = null;
    }
    if (fetchTimeout) {
        clearTimeout(fetchTimeout);
        fetchTimeout = null;
    }
    currentUid = null;
    currentFetch = null;
}


// Initialize timers with data from localStorage or empty array
const storedTimers = browser ? localStorage.getItem('timers') : null;
export const timers = writable([]);//JSON.parse(storedTimers) || 

// Only subscribe to changes and update localStorage in the browser
if (browser) {
    timers.subscribe(value => {
        localStorage.setItem('timers', JSON.stringify(value));
    });
}

/**
 * Smart merge: updates timers store while respecting edit locks.
 * Locked timers keep their current local state.
 * Unlocked timers get updated from the server (source of truth).
 * New timers are added, removed timers are removed (unless locked).
 * 
 * @param {Array} newTimers - Fresh timer data from server
 */
function mergeTimers(newTimers) {
    const currentTimers = get(timers);

    // Build a map of new timers by mId for O(1) lookup
    const newTimerMap = new Map(newTimers.map(t => [String(t.mId), t]));
    const currentTimerMap = new Map(currentTimers.map(t => [String(t.mId), t]));

    const merged = [];

    // Process all new timers (update existing or add new)
    for (const newTimer of newTimers) {
        const mId = String(newTimer.mId);
        const existing = currentTimerMap.get(mId);

        if (existing && isTimerLocked(mId)) {
            // Timer is locked for editing - keep the local version
            console.log('[Timers] Skipping locked timer:', mId);
            merged.push(existing);
        } else {
            // Not locked - use server data (source of truth)
            merged.push(newTimer);
        }
    }

    // Keep locked timers that might have been removed from server
    // (edge case: timer removed while user is editing it)
    for (const current of currentTimers) {
        const mId = String(current.mId);
        if (!newTimerMap.has(mId) && isTimerLocked(mId)) {
            console.log('[Timers] Keeping locked timer not in server:', mId);
            merged.push(current);
        }
    }

    timers.set(merged);
}

/**
 * Fetches all active timers for the current user and stores them in the "timers" store.
 * @param {string} uid - The user ID to fetch the timers for.
 * @param {Function} fetch - Fetch function
 * @param {{ isRemoteUpdate?: boolean }} options - Options
 */
export async function fetchTimers(uid, fetch, options = {}) {
    const { isRemoteUpdate = false } = options;

    // Ensure a user ID is provided
    if (!uid) {
        console.error('[Timers] User ID is missing. Redirecting to login...');
        if (browser) {
            goto('/login?from=timers');
        }
        return;
    }

    await sendToSer({ id: uid }, '8getMissionsOnProgress', 0, 0, false, fetch) // Use the built-in fetch
        .then((res) => {
            if (
                res &&
                res.data.usersPermissionsUser &&
                res.data.usersPermissionsUser.data &&
                res.data.usersPermissionsUser.data.attributes &&
                res.data.usersPermissionsUser.data.attributes.mesimabetahaliches
            ) {
                let newTimers = res.data.usersPermissionsUser.data.attributes.mesimabetahaliches.data.map(
                    (t) => {
                        // NO ACTIVE TIMER
                        let totalMilliseconds = 0;
                        let isActive = false; // Add an isActive flag

                        if (t.attributes.activeTimer && t.attributes.activeTimer.data && t.attributes.activeTimer.data.attributes) {
                            isActive = t.attributes.activeTimer.data.attributes.isActive;
                            totalMilliseconds = t.attributes.activeTimer.data.attributes.totalHours || 0; // Initialize

                            // Iterate through past timers and add their durations
                            if (t.attributes.activeTimer.data.attributes.timers) {
                                t.attributes.activeTimer.data.attributes.timers.forEach((timer) => {
                                    if (timer.start && timer.stop) {
                                        totalMilliseconds +=
                                            new Date(timer.stop).getTime() - new Date(timer.start).getTime();
                                    }
                                });
                            }
                        }


                        const url = t.attributes.project?.data?.attributes?.profilePic?.data?.attributes?.url;
                        const fullUrl = url

                        return {
                            ...t,
                            //timer related:
                            zman: totalMilliseconds, // Total elapsed time in milliseconds
                            running: isActive,      // Use the isActive flag

                            //rest of data:
                            missionName: t.attributes.name,
                            projectName: t.attributes.project?.data?.attributes?.projectName || 'No Project',
                            src: t.attributes.project?.data?.attributes?.profilePic.data.attributes.url,
                            projectId: t.attributes.project.data.id,
                            mId: t.id,
                            hoursAssigned: t.attributes.hoursassinged || 0,
                        };

                    }
                );

                // Use smart merge for remote updates, full replace for initial load
                if (isRemoteUpdate) {
                    mergeTimers(newTimers);
                } else {
                    updateTimers(newTimers);
                }
            } else {
                console.error('Invalid API response:', res);
                updateTimers([]); // Ensure timers is an empty array on error
            }
        })
        .catch((error) => {
            console.error('Error fetching timers:', error);
            updateTimers([]); //[]; //  Ensure timers is an empty array on error
        });
}


// Function to update timers
export const updateTimers = (newTimers) => {
    timers.set(newTimers);
};

// Function to get timers from localStorage
export const getStoredTimers = () => {
    if (!browser) return [];
    const stored = localStorage.getItem('timers');
    return JSON.parse(stored) || [];
};

