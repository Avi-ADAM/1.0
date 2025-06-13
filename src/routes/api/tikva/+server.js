import { json } from '@sveltejs/kit';
import { startTimer, stopTimer, handleClearSingle, handleClearAll } from '$lib/func/timers.svelte';

// POST handler for starting/stopping/managing timers
export async function POST({ request, fetch }) {
    try {
        const data = await request.json();
        const { action, activeTimer, missionId, userId, projectId, timerId } = data;

        switch (action) {
            case 'start':
                const startedTimer = await startTimer(
                    activeTimer,
                    missionId,
                    userId,
                    projectId,
                    timerId || 0,
                    true,
                    fetch
                );
                return json({ success: true, data: startedTimer });

            case 'stop':
                const stoppedTimer = await stopTimer(activeTimer, fetch, true);
                return json({ success: true, data: stoppedTimer });

            case 'clearSingle':
                const { index } = data;
                const updatedTimer = await handleClearSingle(index, activeTimer, fetch, true);
                return json({ success: true, data: updatedTimer });

            case 'clearAll':
                const clearedTimer = await handleClearAll(activeTimer, fetch, true);
                return json({ success: true, data: clearedTimer });

            default:
                return json({ success: false, error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Timer API Error:', error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
}

// GET handler for fetching user's timers
export async function GET({ url }) {
    try {
        const userId = url.searchParams.get('userId');
        
        if (!userId) {
            return json({ success: false, error: 'User ID is required' }, { status: 400 });
        }

        const query = `
            query GetMissionsOnProgress($id: ID!) {
                usersPermissionsUser(id: $id) {
                    data {
                        attributes {
                            mesimabetahaliches(filters: { finnished: { ne: true }, forappruval: { ne: true } }) {
                                data {
                                    id
                                    attributes {
                                        name
                                        howmanyhoursalready
                                        activeTimer {
                                            data {
                                                id
                                                attributes {
                                                    start
                                                    totalTime
                                                    isActive
                                                    timers {
                                                        start
                                                        stop
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const response = await fetch('/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                variables: { id: userId }
            })
        });

        const result = await response.json();
        return json({ success: true, data: result.data });

    } catch (error) {
        console.error('Timer API Error:', error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
}