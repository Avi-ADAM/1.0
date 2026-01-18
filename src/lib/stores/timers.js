import { browser } from '$app/environment';
import { sendToSer } from '$lib/send/sendToSer.js';
import { writable, get } from 'svelte/store';
import { socketClient } from '$lib/stores/socketClient';

let currentUid = null;
let currentFetch = null;
let fetchTimeout = null; // Add a variable to hold the timeout ID
let timerUnsubscribe = null; // For unsubscribing from notifications

/**
 * Initialize timer updates listener using the new socketClient.
 * This replaces the old WebSocket-based timer updates.
 * 
 * @param {string} id - User ID
 * @param {string} token - JWT token (no longer used, kept for backwards compatibility)
 * @param {Function} fetch - Fetch function for making HTTP requests
 * @returns {Function} Unsubscribe function to stop listening
 */
export function initialWebSocketForTimer(id, token, fetch) {
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
                    fetchTimers(currentUid, currentFetch);
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
 * Fetches all active timers for the current user and stores them in the "timers" store.
 * @param {string} uid - The user ID to fetch the timers for.
 */
export async function fetchTimers(uid, fetch) {
    // Ensure a user ID is provided

    if (!uid) {
        console.error('User ID is missing from the route parameters.');
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
                let timers = res.data.usersPermissionsUser.data.attributes.mesimabetahaliches.data.map(
                    (t) => {
                        // NO ACTIVE TIMER
                        let totalMilliseconds = 0;
                        let isActive = false; // Add an isActive flag

                        if (t.attributes.activeTimer) {
                            isActive = t.attributes.activeTimer.isActive;
                            totalMilliseconds = t.attributes.activeTimer.totalHours || 0; // Initialize

                            // Iterate through past timers and add their durations
                            if (t.attributes.activeTimer.timers) {
                                t.attributes.activeTimer.timers.forEach((timer) => {
                                    if (timer.start && timer.stop) {
                                        totalMilliseconds +=
                                            new Date(timer.stop).getTime() - new Date(timer.start).getTime();
                                    }
                                });
                            }
                        }


                        const url = t.attributes.project?.data?.attributes?.profilePic?.data?.attributes?.url;
                        const fullUrl =  url

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

                updateTimers(timers);
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
