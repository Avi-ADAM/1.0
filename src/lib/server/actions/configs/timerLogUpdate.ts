/**
 * Timer Log Update Action Configuration
 * 
 * This action updates timer segments (logs) or tasks for an existing timer.
 * It is dedicated to editing actions rather than stopping/starting.
 */

import type { ActionConfig } from '../types.js';

export const timerLogUpdateConfig: ActionConfig = {
    key: 'timerLogUpdate',
    description: 'Update timer logs or tasks',
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
            description: 'Project ID for authorization'
        },
        userId: {
            type: 'string',
            required: true,
            description: 'User ID for tracking'
        },
        totalHours: {
            type: 'number',
            required: false,
            description: 'Updated total accumulated hours'
        },
        isActive: {
            type: 'boolean',
            required: false,
            description: 'Toggle timer active state'
        },
        timers: {
            type: 'array',
            required: false,
            description: 'Array of timer segments'
        },
        tasks: {
            type: 'array',
            required: false,
            description: 'Array of task IDs assigned to this timer'
        }
    },

    authRules: [
        {
            type: 'jwt',
            errorMessage: 'You must be logged in to update timers'
        },
        {
            type: 'projectMember',
            config: {
                projectIdParam: 'projectId'
            },
            errorMessage: 'You must be a member of this project to update its timers'
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
                he: 'יומן זמן עודכן',
                en: 'Timer Log Updated',
                ar: 'تم تحديث سجل المؤقت'
            },
            body: {
                he: 'עריכת זמנים עודכנה בהצלחה',
                en: 'Timer intervals or tasks have been updated',
                ar: 'تم تحديث فترات المؤقت או המשימות בהצלחה'
            }
        },
        channels: ['socket'],
        metadata: {
            priority: 'low',
            type: 'timerEdit',
            url: '/lev?project={{projectId}}'
        }
    },

    updateStrategy: {
        type: 'partialUpdate',
        config: {
            dataKeys: ['timers', 'acts'],
            updateFunction: 'refreshTimers'
        }
    }
};
