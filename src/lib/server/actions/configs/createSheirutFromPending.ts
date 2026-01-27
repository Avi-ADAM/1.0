
import type { ActionConfig, ActionExecutionHandler } from '../types';

const createSheirutFromPendingHandler: ActionExecutionHandler = async (params, context, util) => {
    const { sheirutpendId, projectId, clientId } = params;
    const { strapi } = util;

    // 1. Fetch SheirutParam
    const spRes = await strapi.execute('72getSheirutpendById', { id: sheirutpendId }, context.jwt, context.fetch);
    const spData = spRes?.data?.sheirutpend?.data?.attributes;
    const spId = spRes?.data?.sheirutpend?.data?.id;

    if (!spData) {
        throw new Error(`Sheirutpend ${sheirutpendId} not found`);
    }

    // 2. Prepare Service Data
    // Using info from request and user mappings
    const serviceData = {
        project: projectId,
        // User structure says: users_permissions_users (Relation with User).
        users_permissions_users: clientId ? [clientId] : [],

        price: spData.price,
        quant: spData.quant,
        total: spData.total,
        startDate: spData.startDate,
        finnishDate: spData.finnishDate, // From query 72 (corrected typo)

        sheirutpend: spId,

        isApruved: true, // As per instructions for the new object
        archived: false, // Service is active

        // Mapping other fields if present in pending or default
        name: spData.matanots?.data?.[0]?.attributes?.name || "Service Request",
        descrip: spData.matanots?.data?.[0]?.attributes?.desc || "Generated from pending request",

        // Defaults for missing fields
        oneTime: spData.oneTime ?? false,
        equaliSplited: spData.equaliSplited ?? false,

        // Map additional fields if available in sheirutpend
        matanot: spData.matanots?.data?.[0]?.id, // Linking the primary matanot (gift/service type)
    };

    // 3. Create Service
    // Using newly added '87createSheirut' mutation
    const createRes = await strapi.execute('87createSheirut', { data: serviceData }, context.jwt, context.fetch);

    const newServiceId = createRes?.data?.createSheirut?.data?.id;

    if (!newServiceId) {
        console.error("Failed to create Sheirut:", JSON.stringify(createRes, null, 2));
        throw new Error("Failed to create Sheirut object");
    }

    // 4. Update Pending Request
    // Mark as approved and archived, link to new service
    await strapi.execute('73updateSheirutpend', {
        id: spId,
        data: {
            appruved: true,
            archived: true,
            sheirut: newServiceId
        }
    }, context.jwt, context.fetch);

    return {
        data: { id: spId, success: true, serviceId: newServiceId, _deleted: true },
        updateStrategy: {
            type: 'partialUpdate',
            config: {
                dataKeys: ['sheiruts', 'sheirutpends'],
                updateFunction: 'refreshServices'
            }
        }
    };
};

export const createSheirutFromPendingConfig: ActionConfig = {
    key: 'createSheirutFromPending',
    description: 'Create approved service from pending request',
    graphqlOperation: createSheirutFromPendingHandler,
    paramSchema: {
        sheirutpendId: { type: 'string', required: true },
        projectId: { type: 'string', required: true },
        clientId: { type: 'string', required: false },
        recipientIds: { type: 'array', required: true }
    },
    authRules: [{ type: 'jwt', errorMessage: 'Auth required' }],
    notification: {
        recipients: {
            type: 'specificUsers',
            config: {
                userIdsParam: 'recipientIds',
                excludeSender: false
            }
        },
        templates: {
            title: {
                he: 'הבקשה אושרה!',
                en: 'Request Approved!',
                ar: 'تمت الموافقة على الطلب!'
            },
            body: {
                he: 'נוצר שירות חדש בעקבות אישור הבקשה',
                en: 'A new service was created following request approval',
                ar: 'تم إنشاء خدمة جديدة بعد الموافقة على الطلب'
            }
        },
        channels: ['socket', 'email', 'telegram', 'push'],
        metadata: {
            type: 'sheirutCreated',
            url: 'lev'
        }
    }
};
