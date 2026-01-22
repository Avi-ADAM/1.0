/**
 * Timer Save Action Configuration
 * 
 * This action saves a timer and commits the hours to the mission.
 * It notifies relevant users via WebSocket when a timer is saved.
 * 
 * Requirements: Timer management via unified action system
 */

import type { ActionConfig } from '../types.js';

export const timerSaveConfig: ActionConfig = {
    key: 'timerSave',
    description: 'Save a timer and commit hours to mission',
    graphqlOperation: '11saveTimer',

    paramSchema: {
        missionId: {
            type: 'string',
            required: true,
            description: 'Mission ID'
        },
        mId: {
            type: 'string',
            required: false,
            description: 'Alias for missionId used in GraphQL'
        },
        timerId: {
            type: 'string',
            required: false,
            description: 'ID of the timer to save'
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
            description: 'Total hours from this session'
        },
        howmanyhoursalready: {
            type: 'number',
            required: false,
            description: 'New total hours for the mission'
        },
        x: {
            type: 'number',
            required: false,
            description: 'Timer value (usually 0 after save)'
        },
        stname: {
            type: 'string',
            required: false,
            description: 'Status name (usually "saved")'
        }
    },

    authRules: [
        {
            type: 'jwt',
            errorMessage: 'You must be logged in to save timers'
        },
        {
            type: 'projectMember',
            config: {
                projectIdParam: 'projectId'
            },
            errorMessage: 'You must be a member of this project to save timers'
        }
    ],

    notification: {
        recipients: {
            type: 'projectMembers',
            config: {
                projectIdParam: 'projectId',
                excludeSender: false
            }
        },
        templates: {
            title: {
                he: 'טיימר נשמר',
                en: 'Timer Saved',
                ar: 'تم حفظ المؤقت'
            },
            body: {
                he: 'השעות נוספו למשימה בהצלחה',
                en: 'Hours have been added to the mission',
                ar: 'تمت إضافة الساعات إلى المهمة'
            }
        },
        channels: ['socket', 'push'],
        metadata: {
            priority: 'normal',
            type: 'timerUpdate',
            url: '/lev?project={{projectId}}'
        }
    },

    updateStrategy: {
        type: 'partialUpdate',
        config: {
            dataKeys: ['timers', 'missions'],
            updateFunction: 'refreshTimers'
        }
    }
};
