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

    // 4a. Activate BOM for complex matanot (pricingMode !== 'fixed')
    const firstMatanot = spData.matanots?.data?.[0];
    const pricingMode = firstMatanot?.attributes?.pricingMode;

    if (pricingMode && pricingMode !== 'fixed' && firstMatanot) {
        const now = new Date().toISOString();
        const matanot = firstMatanot.attributes;
        const recipeMissions: any[] = matanot.matanot_recipe_missions?.data ?? [];
        const recipeResources: any[] = matanot.matanot_recipe_resources?.data ?? [];

        for (const rm of recipeMissions) {
            const attrs = rm.attributes;
            const existingMesima = attrs.mesimabetahalich?.data;
            const pendm = attrs.pendm?.data;
            let mesimaId: string | null = existingMesima?.id ? String(existingMesima.id) : null;

            if (!mesimaId && attrs.mode !== 'consumeExisting') {
                try {
                    // Assign to the seller (rishon on pendm) who committed to doing this mission,
                    // not the client (buyer) who ordered the product.
                    const sellerId = pendm?.attributes?.rishon?.data?.id
                        ? String(pendm.attributes.rishon.data.id)
                        : context.userId;
                    const mesData: Record<string, unknown> = {
                        project: projectId,
                        name: pendm?.attributes?.name || attrs.notes || `${matanot.name} - משימה`,
                        descrip: pendm?.attributes?.descrip || '',
                        hoursassinged: Number(attrs.hoursPerUnit) || 0,
                        perhour: Number(attrs.ratePerHour) || 0,
                        users_permissions_user: sellerId,
                        publishedAt: now,
                    };
                    const missionId = pendm?.attributes?.mission?.data?.id;
                    if (missionId) mesData.mission = String(missionId);

                    const mesRes = await strapi.execute('139createMesimabetahalich', { data: mesData }, context.jwt, context.fetch);
                    mesimaId = mesRes?.data?.createMesimabetahalich?.data?.id
                        ? String(mesRes.data.createMesimabetahalich.data.id)
                        : null;
                } catch (err) {
                    console.warn('[createSheirutFromPending] createMesimabetahalich failed:', err);
                }
            }

            if (mesimaId) {
                try {
                    await strapi.execute('140createAct', {
                        data: {
                            project: projectId,
                            shem: `יש לך מוצר ליצור - ${matanot.name}`,
                            des: `נדרשת לבצע משימה "${pendm?.attributes?.name || attrs.notes || ''}" עבור ${matanot.name}`,
                            isAssigned: true,
                            my: sellerId,
                            vali: sellerId,
                            mesimabetahaliches: mesimaId,
                            publishedAt: now,
                        }
                    }, context.jwt, context.fetch);
                } catch (err) {
                    console.warn('[createSheirutFromPending] createAct reminder failed:', err);
                }
            }
        }

        for (const rr of recipeResources) {
            const attrs = rr.attributes;
            if (attrs.mode === 'consumeExisting' || attrs.mashabetahalich?.data?.id) {
                // consumeExisting mashabetahalich: handled in M5.5 (reservedQuantity + MaapCycle flow)
                continue;
            }
            const pmash = attrs.pmash?.data;
            if (!pmash?.id) continue;

            try {
                await strapi.execute('141createMaap', {
                    data: {
                        project: projectId,
                        name: pmash.attributes?.name || `${matanot.name} - משאב`,
                        pmash: String(pmash.id),
                        archived: false,
                        publishedAt: now,
                    }
                }, context.jwt, context.fetch);
            } catch (err) {
                console.warn('[createSheirutFromPending] createMaap failed:', err);
            }
        }
    }

    // 4b. Update Pending Request
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
