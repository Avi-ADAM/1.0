/**
 * Timer Stop Action Configuration
 * 
 * This action stops a timer for a mission.
 * It notifies relevant users via WebSocket when a timer is stopped.
 * 
 * Requirements: Timer management via unified action system
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { gqlStr, run } from '$lib/server/archive/gql.js';

const TIMER_FIELDS = `start totalHours rate timers{start stop} acts{data{id}} isActive saved saveText saveLinks
  saveFiles{data{id attributes{url name mime size}}}`;

/**
 * A saved timer is closed for good — its hours are already on their way to the
 * rikma at the rate stamped on it. The one way a Stop still reaches one is a tab
 * that missed the moment the server closed it: an approved hourly-value change
 * cuts the running timer at T and hands the member a new one at the new rate
 * (src/lib/server/timers/flushRateChange.ts). That tab still holds the old
 * timer with its last interval open, and its Stop used to close that interval
 * at *now* — writing every minute worked after T back onto the old-rate timer,
 * next to the new timer that was counting the same minutes.
 *
 * So the Stop reads first and leaves a saved timer as it is; the `timer:`
 * publish below makes the tab re-read and find the new one. An unreadable timer
 * is stopped as before — a stop is idempotent, and blocking it on a flaky read
 * would leave a clock running.
 */
const timerStopHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
    const timerId = String(params.timerId ?? '');
    let current: any = null;
    try {
        const data = await run(
            execFromContext(context),
            `{ timer(id: ${gqlStr(timerId)}) { data { id attributes { ${TIMER_FIELDS} } } } }`,
            'timerStop:read',
        );
        current = data?.timer?.data ?? null;
    } catch (e) {
        console.warn('[timerStop] could not read the timer first (stopping anyway):', e);
    }

    if (current?.attributes?.saved === true) {
        console.log('[timerStop] timer already saved — leaving its intervals as they are', { timerId });
        return { data: { updateTimer: { data: current } }, alreadySaved: true };
    }

    return strapi.execute('34UpdateTimer', params, context.jwt, context.fetch);
};

export const timerStopConfig: ActionConfig = {
    key: 'timerStop',
    description: 'Stop a timer for a mission',
    graphqlOperation: timerStopHandler,

    paramSchema: {
        timerId: {
            type: 'string',
            required: true,
            description: 'ID of the timer to update'
        },
        projectId: {
            type: 'string',
            required: true,
            description: 'Project ID'
        },
        userId: {
            type: 'string',
            required: true,
            description: 'User ID'
        },
        totalHours: {
            type: 'number',
            required: false,
            description: 'Total accumulated hours'
        },
        isActive: {
            type: 'boolean',
            required: false,
            description: 'Is timer active'
        },
        saved: {
            type: 'boolean',
            required: false,
            description: 'Is timer saved'
        },
        newStart: {
            type: 'string',
            required: false,
            description: 'New start time'
        },
        timers: {
            type: 'array',
            required: false,
            description: 'Array of timer segments'
        },
        tasks: {
            type: 'array',
            required: false,
            description: 'Array of task IDs'
        }
    },

    authRules: [
        {
            type: 'jwt',
            errorMessage: 'You must be logged in to stop timers'
        },
        {
            type: 'projectMember',
            config: {
                projectIdParam: 'projectId'
            },
            errorMessage: 'You must be a member of this project to stop timers'
        }
    ],

    notification: {
        recipients: {
            type: 'specificUsers',
            config: {
                userIdsParam: 'userId',
                excludeSender: false
            }
        },
        templates: {
            title: {
                he: 'טיימר נעצר',
                en: 'Timer Stopped',
                ar: 'توقف المؤقت'
            },
            body: {
                he: 'הטיימר למשימה הופסק',
                en: 'Timer for mission has been stopped',
                ar: 'تم إيقاف المؤقت للمهمة'
            }
        },
        intent: 'ambient',
        metadata: {
            priority: 'normal',
            type: 'timerUpdate',
            url: '/lev?project={{projectId}}',
            originClientId: '{{originClientId}}'
        }
    },

    updateStrategy: {
        type: 'partialUpdate',
        config: {
            dataKeys: ['timers'],
            updateFunction: 'refreshTimers'
        }
    },

    realtime: {
        scopes: (_p, _r, ctx) =>
            scopeList([scope('timer', ctx.userId)]),
        audience: 'self',
    },
};
