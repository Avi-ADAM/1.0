/**
 * Timer Stop Action Configuration
 * 
 * This action stops a timer for a mission.
 * It notifies relevant users via WebSocket when a timer is stopped.
 * 
 * Requirements: Timer management via unified action system
 */

import type { ActionConfig } from '../types.js';

export const timerStopConfig: ActionConfig = {
    key: 'timerStop',
    description: 'Stop a timer for a mission',
    graphqlOperation: '34UpdateTimer',

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
        channels: ['socket'],
        metadata: {
            priority: 'normal',
            type: 'timerUpdate',
            url: '/lev?project={{projectId}}'
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
