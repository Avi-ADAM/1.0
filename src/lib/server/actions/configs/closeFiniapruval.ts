import type { ActionConfig } from '../types.js';

export const closeFiniapruvalConfig: ActionConfig = {
    key: 'closeFiniapruval',
    description: 'Add a vote to a finiapruval and close it when all members voted yes',
    graphqlOperation: async (params, context, { strapi }) => {
        const { finiapruvalId, timegramaId, vote, why } = params;
        const now = new Date();

        // Fetch finiapruval with all context needed for closing
        const finiRes = await strapi.execute('117getFiniapruvalForClose', {
            id: finiapruvalId
        }, context.jwt, context.fetch);

        const fini = finiRes?.data?.finiapruval?.data;
        if (!fini) throw new Error(`Finiapruval ${finiapruvalId} not found`);
        const fa = fini.attributes;

        if (fa.archived) return { success: true, alreadyArchived: true };

        // Build updated vots array (existing + new vote)
        const existingVots = fa.vots ?? [];
        const allVots = [
            ...existingVots.map((v: any) => ({
                what: v.what,
                users_permissions_user: v.users_permissions_user?.data?.id,
                ...(v.why ? { why: v.why } : {})
            })),
            {
                what: vote === true,
                users_permissions_user: context.userId,
                ...(why ? { why } : {})
            }
        ];

        const mba = fa.mesimabetahalich?.data;
        const mbaa = mba?.attributes;
        const totalUsers = mbaa?.project?.data?.attributes?.user_1s?.data?.length ?? 1;
        const yesCount = allVots.filter((v: any) => v.what === true).length;
        const hasNo = allVots.some((v: any) => v.what === false);
        const allVotedYes = !hasNo && yesCount >= totalUsers;

        if (!allVotedYes) {
            // Just record the vote, not yet closing
            await strapi.execute('118updateFiniapruvalVots', {
                id: finiapruvalId,
                vots: allVots
            }, context.jwt, context.fetch);
            return { success: true, closed: false };
        }

        // All voted yes — close based on type
        const isTimerSave: boolean = fa.isTimerSave === true;
        const noofhours: number = fa.noofhours ?? 0;
        const perhour: number = mbaa?.perhour ?? 0;

        if (isTimerSave) {
            // Timer save approval: accumulate hours into the single active FinnishedMission
            const existingFm = mbaa?.finnished_missions?.data?.[0];

            if (existingFm) {
                const newHours = (existingFm.attributes.noofhours ?? 0) + noofhours;
                await strapi.execute('114updateFinnishedMissionHours', {
                    id: existingFm.id,
                    noofhours: newHours,
                    total: newHours * perhour
                }, context.jwt, context.fetch);
            } else {
                await strapi.execute('113createFinnishedMissionForTimerSave', {
                    missionName: fa.missname,
                    noofhours,
                    mesimabetahalich: mba?.id,
                    mission: mbaa?.mission?.data?.id,
                    project: fa.project?.data?.id,
                    publishedAt: now.toISOString(),
                    users_permissions_user: fa.users_permissions_user?.data?.id,
                    perhour,
                    total: noofhours * perhour,
                    why: fa.why ?? 'timer save'
                }, context.jwt, context.fetch);
            }

            await strapi.execute('115updateMissionTotalHoursSaved', {
                id: mba?.id,
                totalHoursSaved: (mbaa?.totalHoursSaved ?? 0) + noofhours
            }, context.jwt, context.fetch);

        } else {
            // Mission completion: create final FinnishedMission and mark mission done
            const existingFms = mbaa?.finnished_missions?.data ?? [];
            const accumulatedHours = existingFms.reduce(
                (sum: number, fm: any) => sum + (fm.attributes?.noofhours ?? 0), 0
            );
            const totalHours = accumulatedHours + noofhours;

            await strapi.execute('119createFinnishedMissionFinal', {
                missionName: fa.missname,
                why: fa.why ?? '',
                noofhours: totalHours,
                mesimabetahalich: mba?.id,
                perhour,
                total: totalHours * perhour,
                project: fa.project?.data?.id,
                mission: mbaa?.mission?.data?.id,
                users_permissions_user: fa.users_permissions_user?.data?.id,
                publishedAt: now.toISOString(),
                finiapruvals: [finiapruvalId]
            }, context.jwt, context.fetch);

            await strapi.execute('105updateMesimabetahalichForFinish', {
                id: mba?.id,
                finnished: true,
                forappruval: false
            }, context.jwt, context.fetch);
        }

        // Archive finiapruval with final votes + close timegrama
        await strapi.execute('118updateFiniapruvalVots', {
            id: finiapruvalId,
            vots: allVots,
            archived: true
        }, context.jwt, context.fetch);

        if (timegramaId) {
            await strapi.execute('35updateTimeGrama', {
                id: timegramaId,
                done: true
            }, context.jwt, context.fetch);
        }

        return { success: true, closed: true, isTimerSave };
    },

    paramSchema: {
        finiapruvalId: { type: 'string', required: true, description: 'Finiapruval ID to vote on' },
        timegramaId: { type: 'string', required: false, description: 'Timegrama ID to mark done on close' },
        vote: { type: 'boolean', required: true, description: 'true = yes, false = no' },
        why: { type: 'string', required: false, description: 'Reason text (required on negative vote)' },
        projectId: { type: 'string', required: true, description: 'Project ID for auth check' }
    },

    authRules: [
        { type: 'jwt', errorMessage: 'You must be logged in to vote' },
        {
            type: 'projectMember',
            config: { projectIdParam: 'projectId' },
            errorMessage: 'You must be a member of this project to vote'
        }
    ],

    notification: {
        recipients: {
            type: 'projectMembers',
            config: { projectIdParam: 'projectId', excludeSender: false }
        },
        templates: {
            title: { he: 'הצבעה על אישור', en: 'Approval Vote', ar: 'تصويت على الموافقة' },
            body: { he: 'הצבעה חדשה התקבלה', en: 'A new vote was received', ar: 'تم استلام تصويت جديد' }
        },
        channels: ['socket', 'push'],
        metadata: { priority: 'normal', type: 'finiapruvalVote', url: '/lev?project={{projectId}}' }
    },

    updateStrategy: {
        type: 'partialUpdate',
        config: { dataKeys: ['finiapruvals', 'missions'], updateFunction: 'refreshFiniapruvals' }
    }
};
