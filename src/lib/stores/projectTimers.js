import { writable } from 'svelte/store';
import { sendToSer } from '$lib/send/sendToSer.js';

/**
 * Store for project timers
 * Structure: { projectId: { data: [...], loading: false, lastFetch: timestamp } }
 */
export const projectTimersStore = writable({});

/**
 * Fetch timers for a specific project and store them
 * @param {string} projectId - The project ID
 * @param {Function} fetch - Fetch function
 * @returns {Promise<void>}
 */
export async function fetchProjectTimers(projectId, fetch) {
    if (!projectId) {
        console.error('[ProjectTimers] Project ID is missing');
        return;
    }

    // Set loading state
    projectTimersStore.update(store => ({
        ...store,
        [projectId]: {
            ...store[projectId],
            loading: true
        }
    }));

    try {
        const result = await sendToSer(
            { id: projectId },
            '38getProjectTimers',
            null,
            null,
            false,
            fetch
        );

        if (result?.data?.project?.data?.attributes) {
            // Extract the timers data from the nested structure
            const projectAttributes = result.data.project.data.attributes;
            
            projectTimersStore.update(store => ({
                ...store,
                [projectId]: {
                    data: projectAttributes,
                    loading: false,
                    lastFetch: Date.now()
                }
            }));
        } else {
            console.error('[ProjectTimers] Invalid response:', result);
            projectTimersStore.update(store => ({
                ...store,
                [projectId]: {
                    data: null,
                    loading: false,
                    lastFetch: Date.now()
                }
            }));
        }
    } catch (error) {
        console.error('[ProjectTimers] Error fetching project timers:', error);
        projectTimersStore.update(store => ({
            ...store,
            [projectId]: {
                data: null,
                loading: false,
                lastFetch: Date.now(),
                error: error.message
            }
        }));
    }
}

/**
 * Get timers for a specific project from the store
 * @param {object} store - The current store state
 * @param {string} projectId - The project ID
 * @returns {object|null} The project timers data
 */
export function getProjectTimers(store, projectId) {
    return store[projectId]?.data || null;
}

/**
 * Check if a user has an active timer in a specific project
 * @param {object} store - The current store state
 * @param {string} projectId - The project ID
 * @param {string} userId - The user ID
 * @returns {boolean} True if user has active timer
 */
export function hasActiveTimer(store, projectId, userId) {
    const projectData = store[projectId];
    if (!projectData?.data) return false;

    // The query returns timers array directly
    const timers = projectData.data.timers?.data || [];
    
    return timers.some(timer => {
        const timerAttrs = timer.attributes;
        const missionUserId = timerAttrs?.mesimabetahalich?.data?.attributes?.users_permissions_user?.data?.id;
        
        return missionUserId == userId && timerAttrs?.isActive === true;
    });
}

/**
 * Clear timers for a specific project
 * @param {string} projectId - The project ID
 */
export function clearProjectTimers(projectId) {
    projectTimersStore.update(store => {
        const newStore = { ...store };
        delete newStore[projectId];
        return newStore;
    });
}
