/**
 * Timer Start Action Configuration
 * 
 * This action starts or resumes a timer for a mission.
 * It notifies relevant users via WebSocket when a timer is started.
 * 
 * Requirements: Timer management via unified action system
 */

import type { ActionConfig } from '../types.js';
import { touchDormancy } from '$lib/server/archive/dormancyClock.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { run } from '$lib/server/archive/gql.js';

/**
 * The mission's hourly value right now — stamped onto the timer at creation so
 * these hours keep their price when the mission's value is renegotiated later
 * (src/lib/timers/rate.ts). Read server-side and never taken from the client:
 * the rate is what the hours are worth, not something the browser may assert.
 */
async function currentMissionRate(context: any, missionId: string): Promise<number | null> {
    try {
        const data = await run(
            execFromContext(context),
            `{ mesimabetahalich(id: "${missionId}") { data { attributes { perhour } } } }`,
            'timerStart:rate',
        );
        const v = data?.mesimabetahalich?.data?.attributes?.perhour;
        return v == null ? null : Number(v);
    } catch (e) {
        // A missing stamp reads as legacy and prices at the mission's value on
        // close — the behaviour before stamps existed. Losing the timer over it
        // would be far worse.
        console.warn('[timerStart] could not read the mission rate (non-fatal):', e);
        return null;
    }
}

export const timerStartConfig: ActionConfig = {
    key: 'timerStart',
    description: 'Start or resume a timer for a mission',
    graphqlOperation: async (params, context, { strapi }) => {
        // Starting a timer is the loudest signal of activity there is — push
        // the dormancy deadline out (PLAN_OBJECT_ARCHIVAL).
        if (params.missionId) {
            await touchDormancy(execFromContext(context), String(params.missionId)).catch(() => null);
        }
        if (params.timerId && params.timerId !== '0') {
            // Resume/Update existing timer
            return strapi.execute('34UpdateTimer', params, context.jwt, context.fetch);
        } else {
            // Create new timer
            const rate = await currentMissionRate(context, String(params.missionId));
            return strapi.execute('33CreateTimer', { ...params, rate }, context.jwt, context.fetch);
        }
    },

    paramSchema: {
        missionId: {
            type: 'string',
            required: true,
            description: 'Mission ID'
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
        timerId: {
            type: 'string',
            required: false,
            description: 'Timer ID (for update)'
        },
        start: {
            type: 'string',
            required: false,
            description: 'Start time (for create)'
        },
        newStart: {
            type: 'string',
            required: false,
            description: 'New start time (for update)'
        },
        isActive: {
            type: 'boolean',
            required: false,
            description: 'Is timer active'
        },
        timers: {
            type: 'array',
            required: false,
            description: 'Timer segments array'
        },
        totalHours: {
            type: 'number',
            required: false,
            description: 'Total hours'
        },
        rate: {
            type: 'number',
            required: false,
            description: 'Hourly value stamped on the timer — resolved server-side, ignored from the client'
        }
    },

    authRules: [
        {
            type: 'jwt',
            errorMessage: 'You must be logged in to start timers'
        },
        {
            type: 'projectMember',
            config: {
                projectIdParam: 'projectId'
            },
            errorMessage: 'You must be a member of this project to start timers'
        }
    ],

    notification: {
        recipients: {
            type: 'specificUsers',
            config: {
                userIdsParam: 'userId', // Notify the user who started the timer
                excludeSender: false
            }
        },
        templates: {
            title: {
                he: 'טיימר התחיל',
                en: 'Timer Started',
                ar: 'بدأ المؤقت'
            },
            body: {
                he: 'הטיימר למשימה הופעל בהצלחה',
                en: 'Timer for mission started successfully',
                ar: 'بدأ المؤقت للمهمة بنجاح'
            }
        },
        channels: ['socket'],
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
    }
};
