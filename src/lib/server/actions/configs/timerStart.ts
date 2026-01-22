/**
 * Timer Start Action Configuration
 * 
 * This action starts or resumes a timer for a mission.
 * It notifies relevant users via WebSocket when a timer is started.
 * 
 * Requirements: Timer management via unified action system
 */

import type { ActionConfig } from '../types.js';

export const timerStartConfig: ActionConfig = {
    key: 'timerStart',
    description: 'Start or resume a timer for a mission',
    graphqlOperation: '33CreateTimer', // For new timers or '34UpdateTimer' for resume

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
