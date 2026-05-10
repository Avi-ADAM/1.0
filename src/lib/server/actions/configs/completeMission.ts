import type { ActionConfig, ActionExecutionHandler } from '../types.js';

/**
 * Calculate timegrama delay based on restime
 */
function calcX(restime: string): number {
  if (restime === 'feh') return 48 * 60 * 60 * 1000;
  if (restime === 'sth') return 72 * 60 * 60 * 1000;
  if (restime === 'nsh') return 96 * 60 * 60 * 1000;
  if (restime === 'sevend') return 168 * 60 * 60 * 1000;
  return 48 * 60 * 60 * 1000;
}

function restimeLabel(restime: string): { he: string; en: string } {
  if (restime === 'feh') return { he: '48 שעות', en: '48 hours' };
  if (restime === 'sth') return { he: '72 שעות', en: '72 hours' };
  if (restime === 'nsh') return { he: '96 שעות', en: '96 hours' };
  if (restime === 'sevend') return { he: '7 ימים', en: '7 days' };
  return { he: '48 שעות', en: '48 hours' };
}

/**
 * Custom handler for completing a mission
 */
const completeMissionHandler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const { missionId, why, what, hoursdon } = params;
  const { userId, jwt, lang, fetch } = context;
  const d = new Date();
  const publishedAt = d.toISOString();

  // 1. Fetch mission details to get all required info
  const missionRes = await strapi.execute(
    '102getMesimabetahalichForFinish',
    { id: missionId },
    jwt,
    fetch
  );

  const missionData = missionRes?.data?.mesimabetahalich?.data?.attributes;
  if (!missionData) {
    throw new Error('Mission not found');
  }

  // Extract mission data
  const missionName = missionData.name;
  const missionDetails = missionData.descrip;
  const howmanyhoursalready = missionData.howmanyhoursalready ?? 0;
  const hoursassinged = missionData.hoursassinged ?? 0;
  const perhour = missionData.perhour ?? 0;
  const finalHoursdon = hoursdon !== undefined ? Number(hoursdon) : howmanyhoursalready;

  // Extract project data
  const project = missionData.project?.data;
  const projectId = project?.id;
  const projectName = project?.attributes?.projectName;
  const restime = project?.attributes?.restime;
  const profilePic = project?.attributes?.profilePic?.data?.attributes?.url ?? 'coin.png';
  const user1s = project?.attributes?.user_1s?.data || [];
  const noofpu = user1s.length;

  // Extract mission relation
  const missId = missionData.mission?.data?.id;

  // Extract mission owner
  const missionOwnerId = missionData.users_permissions_user?.data?.id;

  // Authorization check: user must be project member
  const memberIds = user1s.map((u: any) => String(u.id));
  if (!memberIds.includes(String(userId))) {
    throw new Error('User is not a member of this project');
  }

  // 2. Validation: must have why or what
  const hasWhy = why && String(why).trim().length > 0;
  const hasWhat = what && String(what).length > 0;
  if (!hasWhy && !hasWhat) {
    throw new Error('Missing required proof: please upload a file or describe completion');
  }

  // 3. Validation: timer must not be running
  const isTimerActive = missionData.activeTimer?.data?.attributes?.isActive === true;
  if (isTimerActive) {
    throw new Error('Timer is still running. Please stop and save the timer before submitting.');
  }

  // 4. Determine path based on number of project users
  let createdId: string | null = null;
  let createdType: 'finnishedMission' | 'finiapruval' | null = null;

  if (noofpu === 1) {
    // Direct completion: create FinnishedMission
    const finnishedVars: Record<string, any> = {
      missionName,
      why: why ?? '',
      noofhours: finalHoursdon,
      mesimabetahalich: missionId,
      perhour,
      total: perhour * finalHoursdon,
      project: projectId,
      descrip: missionDetails ?? '',
      users_permissions_user: userId,
      publishedAt,
      mission: missId
    };
    if (hasWhat) {
      finnishedVars.what = [what];
    }

    const finnishedRes = await strapi.execute(
      '103createFinnishedMission',
      finnishedVars,
      jwt,
      fetch
    );
    createdId = finnishedRes?.data?.createFinnishedMission?.data?.id ?? null;
    createdType = 'finnishedMission';

    // Update mesimabetahalich: set finnished=true
    await strapi.execute(
      '105updateMesimabetahalichForFinish',
      { id: missionId, finnished: true, forappruval: false },
      jwt,
      fetch
    );
  } else {
    // Multi-user: create Finiapruval with initial vote
    const vots = [
      {
        what: true,
        users_permissions_user: userId
      }
    ];

    const finiapruvalVars: Record<string, any> = {
      missname: missionName,
      why: why ?? '',
      noofhours: finalHoursdon,
      mesimabetahalich: missionId,
      project: projectId,
      publishedAt,
      users_permissions_user: userId,
      vots
    };
    if (hasWhat) {
      finiapruvalVars.what = [what];
    }

    const finiapruvalRes = await strapi.execute(
      '104createFiniapruval',
      finiapruvalVars,
      jwt,
      fetch
    );
    createdId = finiapruvalRes?.data?.createFiniapruval?.data?.id ?? null;
    createdType = 'finiapruval';

    // Update mesimabetahalich: set forappruval=true
    await strapi.execute(
      '105updateMesimabetahalichForFinish',
      { id: missionId, forappruval: true, finnished: false },
      jwt,
      fetch
    );

    // 5. Create timegrama for voting deadline
    if (createdId && restime) {
      const x = calcX(restime);
      const fd = new Date(Date.now() + x);
      await strapi.execute(
        '32createTimeGrama',
        {
          whatami: 'finiapruval',
          finiapruval: createdId,
          date: fd.toISOString()
        },
        jwt,
        fetch
      );
    }

    // 6. Notify other project users about pending approval
    if (notifier) {
      const otherIds = memberIds.filter((id: string) => id !== String(userId));
      if (otherIds.length > 0) {
        const deadline = restimeLabel(restime ?? '');
        await notifier.notify(
          {
            recipients: {
              type: 'specificUsers',
              config: { userIdsParam: 'recipients' }
            },
            templates: {
              title: {
                he: 'סיום משימה בהצלחה ממתין לאישור',
                en: 'Mission completion awaiting approval'
              },
              body: {
                he: `המשימה "${missionName}" הושלמה בפרויקט "${projectName}" וממתינה לאישורך. יש לך עד ${deadline.he} לעבור על הגשת הסיום ולאשר או לערער עליה.`,
                en: `Mission "${missionName}" in project "${projectName}" has been completed and is awaiting your approval. You have ${deadline.en} to review the submission and approve or dispute it.`
              }
            },
            channels: ['socket', 'email', 'push'],
            metadata: {
              type: 'finiappmi',
              url: `/lev?project=${projectId}`,
              missionName,
              projectName,
              priority: 'normal'
            }
          },
          { recipients: otherIds, missionId, projectId, missionName, projectName },
          finiapruvalRes,
          context
        );
      }
    }
  }

  return {
    success: true,
    data: {
      missionId,
      createdType,
      createdId,
      noofpu,
      projectId,
      hoursdon: finalHoursdon
    },
    updateStrategy: {
      type: 'partialUpdate',
      config: {
        dataKeys: ['arr1']
      }
    }
  };
};

export const completeMissionConfig: ActionConfig = {
  key: 'completeMission',
  description: 'Submit a mission for completion or approval. Single-user projects finish immediately; multi-user projects create a voting request.',
  graphqlOperation: completeMissionHandler,

  paramSchema: {
    missionId: {
      type: 'string',
      required: true,
      description: 'ID of the mesimabetahalich mission to complete'
    },
    why: {
      type: 'string',
      required: false,
      description: 'Text description of how the mission was completed'
    },
    what: {
      type: 'string',
      required: false,
      description: 'Uploaded file/media ID (proof of completion)'
    },
    hoursdon: {
      type: 'number',
      required: false,
      description: 'Hours worked (defaults to howmanyhoursalready from DB)'
    }
  },

  authRules: [
    {
      type: 'jwt',
      errorMessage: 'You must be logged in to complete missions'
    }
  ],

  updateStrategy: {
    type: 'partialUpdate',
    config: {
      dataKeys: ['arr1']
    }
  }
};
