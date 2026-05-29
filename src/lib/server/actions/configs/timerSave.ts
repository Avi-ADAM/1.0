import type { ActionConfig } from '../types.js';
import { calcDeadlineMs } from './actionUtils.js';

function todayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const timerSaveConfig: ActionConfig = {
    key: 'timerSave',
    description: 'Save a timer and commit hours to mission, routing through approval or direct save',
    graphqlOperation: async (params, context, { strapi }) => {
        const mId = (params.missionId || params.mId)?.toString();
        const now = new Date();

        // Step 1: Mark timer as saved
        if (params.timerId && params.timerId !== '0') {
            await strapi.execute('34UpdateTimer', {
                timerId: params.timerId,
                isActive: false,
                saved: true,
                tasks: params.tasks || []
            }, context.jwt, context.fetch);
        }

        // Step 2: Fetch mission data to determine single vs multi-user flow
        const missionRes = await strapi.execute('110getMissionForTimerSave', {
            mId
        }, context.jwt, context.fetch);

        const missionData = missionRes?.data?.mesimabetahalich?.data;
        if (!missionData) throw new Error(`Mission ${mId} not found`);

        const at = missionData.attributes;
        const userCount = at.project?.data?.attributes?.user_1s?.data?.length ?? 1;
        const sessionHoursTotal: number = params.sessionHoursTotal ?? params.totalHours ?? 0;
        const newHowManyHours: number = params.howmanyhoursalready ?? (at.howmanyhoursalready ?? 0);

        // Step 3: Update mission monthly hours counter + clear activeTimer
        await strapi.execute('112updateMissionMonthlyHours', {
            id: mId,
            howmanyhoursalready: newHowManyHours,
            stname: params.stname || 'saved'
        }, context.jwt, context.fetch);

        if (userCount === 1) {
            // --- Single-user: directly write to FinnishedMission ---
            const existingFm = at.finnished_missions?.data?.[0];

            if (existingFm) {
                const newHours = (existingFm.attributes.noofhours ?? 0) + sessionHoursTotal;
                await strapi.execute('114updateFinnishedMissionHours', {
                    id: existingFm.id,
                    noofhours: newHours,
                    total: newHours * (at.perhour ?? 0)
                }, context.jwt, context.fetch);
            } else {
                await strapi.execute('113createFinnishedMissionForTimerSave', {
                    missionName: at.name,
                    noofhours: sessionHoursTotal,
                    mesimabetahalich: mId,
                    mission: at.mission?.data?.id,
                    project: at.project?.data?.id,
                    publishedAt: now.toISOString(),
                    users_permissions_user: at.users_permissions_user?.data?.id,
                    perhour: at.perhour,
                    total: sessionHoursTotal * (at.perhour ?? 0),
                    why: 'timer save'
                }, context.jwt, context.fetch);
            }

            await strapi.execute('115updateMissionTotalHoursSaved', {
                id: mId,
                totalHoursSaved: (at.totalHoursSaved ?? 0) + sessionHoursTotal
            }, context.jwt, context.fetch);

        } else {
            // --- Multi-user: create Finiapruval for approval vote ---
            const vots = [{ what: true, users_permissions_user: context.userId }];

            const finiRes = await strapi.execute('111createFiniapruvalForTimer', {
                missname: at.name,
                noofhours: sessionHoursTotal,
                mesimabetahalich: mId,
                project: at.project?.data?.id,
                publishedAt: now.toISOString(),
                users_permissions_user: at.users_permissions_user?.data?.id,
                vots,
                timer: params.timerId && params.timerId !== '0' ? params.timerId : undefined,
                month: todayDateString()
            }, context.jwt, context.fetch);

            const finiId = finiRes?.data?.createFiniapruval?.data?.id;

            if (finiId) {
                const restime = at.project?.data?.attributes?.restime ?? 'feh';
                const deadline = new Date(Date.now() + calcDeadlineMs(restime)).toISOString();
                await strapi.execute('32createTimeGrama', {
                    date: deadline,
                    whatami: 'finiapruval',
                    finiapruval: finiId
                }, context.jwt, context.fetch);
            }
        }

        return { success: true, missionId: mId };
    },

    paramSchema: {
        missionId: { type: 'string', required: true, description: 'Mission ID' },
        mId: { type: 'string', required: false, description: 'Alias for missionId' },
        timerId: { type: 'string', required: false, description: 'ID of the timer to save' },
        projectId: { type: 'string', required: true, description: 'Project ID' },
        userId: { type: 'string', required: true, description: 'User ID' },
        sessionHoursTotal: { type: 'number', required: false, description: 'Total hours from this timer session' },
        sessionHoursThisMonth: { type: 'number', required: false, description: 'Hours from this session that fall in current month' },
        howmanyhoursalready: { type: 'number', required: false, description: 'New monthly hours total (currentHours + sessionHoursThisMonth)' },
        totalHours: { type: 'number', required: false, description: 'Fallback total hours' },
        stname: { type: 'string', required: false, description: 'Status name' },
        x: { type: 'number', required: false, description: 'Legacy timer value (unused)' },
        tasks: { type: 'array', required: false, description: 'Task IDs to link to the timer' }
    },

    authRules: [
        { type: 'jwt', errorMessage: 'You must be logged in to save timers' },
        {
            type: 'projectMember',
            config: { projectIdParam: 'projectId' },
            errorMessage: 'You must be a member of this project to save timers'
        }
    ],

    notification: {
        recipients: {
            type: 'projectMembers',
            config: { projectIdParam: 'projectId', excludeSender: false }
        },
        templates: {
            title: { he: 'טיימר נשמר', en: 'Timer Saved', ar: 'تم حفظ المؤقت' },
            body: { he: 'השעות נוספו למשימה בהצלחה', en: 'Hours have been added to the mission', ar: 'تمت إضافة الساعات إلى المهمة' }
        },
        channels: ['socket', 'push'],
        metadata: { priority: 'normal', type: 'timerUpdate', url: '/lev?project={{projectId}}', originClientId: '{{originClientId}}' }
    },

    updateStrategy: {
        type: 'partialUpdate',
        config: { dataKeys: ['timers', 'missions'], updateFunction: 'refreshTimers' }
    }
};
