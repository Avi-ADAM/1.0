/**
 * Link Act To Mission
 *
 * Closes the "publish an unplaced act as a mission" loop: the member opened the
 * mission form from an act (`/moach/[projectId]/create?action=createmission&
 * fromAct=…`), filled it in and published. `createMission` produced exactly one
 * of three entities depending on the rikma's size and whether an assignee was
 * named — a `pendm` (proposal awaiting a vote), an `openMission`, or a
 * `mesimabetahalich` — and each lands in a different relation on `Act`.
 *
 * Deliberately a separate action rather than a branch inside `createMission`:
 * the mission must be created whether or not it came from an act, and a
 * failure to link must not roll back a mission the rikma is now voting on.
 * The caller treats this as best-effort and says so.
 *
 * See `src/lib/acts/publishAsMission.ts` for the client half.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

/** What `createMission` reports → the `Act` relation that holds it. */
const RELATION_BY_TYPE: Record<string, 'pendm' | 'openMission' | 'mesimabetahaliches'> = {
  pendm: 'pendm',
  openMission: 'openMission',
  mesimabetahalich: 'mesimabetahaliches'
};

const linkActToMissionHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const actId = String(params.actId);
  const projectId = String(params.projectId);
  const missionId = String(params.missionId);
  const missionType = String(params.missionType);

  const relation = RELATION_BY_TYPE[missionType];
  if (!relation) {
    throw new Error(
      `Unknown missionType "${missionType}" - expected pendm, openMission or mesimabetahalich`
    );
  }

  // The `projectMember` rule below proves the caller belongs to `projectId`.
  // It cannot prove this act does: without this check a member of project A
  // could file someone else's act, in project B, under a mission of their own.
  const actRes = await strapi.execute('getAct', { id: actId }, context.jwt, context.fetch);
  const act = actRes?.data?.act?.data;
  if (!act) throw new Error(`Act ${actId} not found`);

  const actProjectId = act?.attributes?.project?.data?.id;
  if (String(actProjectId ?? '') !== projectId) {
    throw new Error(`Act ${actId} does not belong to project ${projectId}`);
  }

  // Only the matching variable is supplied. A GraphQL input-object field whose
  // variable was not provided is dropped from the coerced input, so the other
  // two relations keep whatever they held instead of being nulled.
  const variables: Record<string, unknown> = { id: actId };
  if (relation === 'mesimabetahaliches') {
    variables.mesimabetahaliches = [missionId];
  } else {
    variables[relation] = missionId;
  }

  const result = await strapi.execute(
    '294linkActToMission',
    variables,
    context.jwt,
    context.fetch
  );

  const updated = result?.data?.updateAct?.data;
  if (!updated) throw new Error(`Failed to link act ${actId} to ${missionType} ${missionId}`);

  return {
    ...updated,
    actId,
    missionId,
    missionType,
    actName: updated?.attributes?.shem ?? act?.attributes?.shem ?? ''
  };
};

export const linkActToMissionAction: ActionConfig = {
  key: 'linkActToMission',
  description: 'Attach an act (task) to the mission that was just published from it',
  graphqlOperation: linkActToMissionHandler,

  paramSchema: {
    actId: {
      type: 'string',
      required: true,
      description: 'ID of the act (Act) to link'
    },
    projectId: {
      type: 'string',
      required: true,
      description: 'ID of the project the act belongs to (authorization + notifications)'
    },
    missionId: {
      type: 'string',
      required: true,
      description: 'ID of the entity createMission produced'
    },
    missionType: {
      type: 'string',
      required: true,
      description: 'One of: pendm | openMission | mesimabetahalich'
    }
  },

  // Members only. Not offered to API keys: an external agent has no way to
  // know which act a mission it created was meant to replace.
  access: ['user', 'serviceAdmin'],

  authRules: [
    {
      type: 'jwt',
      errorMessage: 'You must be logged in to link a task to a mission'
    },
    {
      type: 'projectMember',
      config: {
        projectIdParam: 'projectId'
      },
      errorMessage: 'You must be a member of this project to link a task to a mission'
    }
  ],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: {
        projectIdParam: 'projectId',
        excludeSender: true
      }
    },
    templates: {
      // `LanguageStrings` carries he/en/ar only — the notification layer falls
      // back to en for the other locales.
      title: {
        he: 'מטלה פורסמה כמשימה',
        en: 'A task was published as a mission',
        ar: 'تم نشر مهمة صغيرة كمهمة'
      },
      body: {
        he: 'המטלה "{{actName}}" הפכה למשימה שאפשר להצטרף אליה',
        en: 'The task "{{actName}}" became a mission members can join',
        ar: 'أصبحت المهمة "{{actName}}" مهمة يمكن الانضمام إليها'
      }
    },
    channels: ['socket', 'push'],
    metadata: {
      priority: 'normal',
      url: '/moach/{{projectId}}/acts'
    }
  },

  updateStrategy: {
    type: 'partialUpdate',
    config: {
      dataKeys: ['tasks']
    }
  }
};
