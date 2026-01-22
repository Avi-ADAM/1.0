import type { ActionConfig } from '../types';

export const rejectSheirutpendConfig: ActionConfig = {
    key: 'rejectSheirutpend',
    description: 'Reject a product request',
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
            errorMessage: 'Must be a project member to reject requests'
        }
    ],

    notification: {
        recipients: {
            type: 'specificUsers',
            config: {
                userIdsParam: 'requesterId',
                excludeSender: true
            }
        },
        templates: {
            title: {
                he: 'בקשתך נדחתה',
                en: 'Request rejected',
                ar: 'تم رفض طلبك'
            },
            body: {
                he: 'הבקשה שלך למוצר/שירות נדחתה',
                en: 'Your product/service request has been rejected',
                ar: 'تم رفض طلب المنتج/الخدمה الخاص بك'
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
    }
};
