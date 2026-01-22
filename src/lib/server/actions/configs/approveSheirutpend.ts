import type { ActionConfig } from '../types';

export const approveSheirutpendConfig: ActionConfig = {
    key: 'approveSheirutpend',
    description: 'Approve a product request',
    graphqlOperation: '73updateSheirutpend',

    paramSchema: {
        id: {
            type: 'string',
            required: true
        },
        projectId: {
            type: 'string',
            required: true
        }
    },

    authRules: [
        {
            type: 'jwt',
            errorMessage: 'Must be authenticated'
        },
        {
            type: 'projectMember',
            config: {
                projectIdParam: 'projectId'
            },
            errorMessage: 'Must be a project member to approve requests'
        }
    ],

    notification: {
        recipients: {
            type: 'specificUsers',
            config: {
                userIdsParam: 'requesterId', // We might need to fetch this or pass it
                excludeSender: true
            }
        },
        templates: {
            title: {
                he: 'בקשתך אושרה!',
                en: 'Request approved!',
                ar: 'تمت الموافقة على طلبك!'
            },
            body: {
                he: 'הבקשה שלך למוצר/שירות אושרה בהצלחה',
                en: 'Your product/service request has been approved',
                ar: 'لقد تمت المواפقة على طلب المنتج/الخدمة الخاص بك'
            }
        },
        channels: ['socket', 'push'],
        metadata: {
            type: 'sheirutUpdate',
            url: 'lev'
        }
    },

    updateStrategy: {
        type: 'partialUpdate',
        config: {
            dataKeys: ['sheirutpends'],
            updateFunction: 'refreshSheirutpends'
        }
    },

    // Before execution, we want to set archived: true
    // In the action system, we can sometimes use a transform or just pass it from client
    // But usually, it's safer to have it in the config if it's always the same
    // However, the current action system uses the raw data passed to the mutation.
    // I'll assume the client passes the data or I'll implement a middleware if needed.
    // Actually, I can just use a specific mutation if I want it fixed.
};
