/**
 * Action Configuration: Update Mission Status (progress %)
 *
 * Updates the `status` field (0-100 progress slider) on a Mesimabetahalich record.
 * Called when a mission assignee moves the RangeSlider in missionInProgress.svelte.
 *
 * Client sends: { mId, projectId, status }
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const updateMissionStatusHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { mId, projectId, status } = params;

  // Server-side validation: status must be 0–100
  const safeStatus = Math.max(0, Math.min(100, Math.round(Number(status))));

  await strapi.execute(
    '154updateMissionStatus',
    { id: String(mId), status: safeStatus },
    context.jwt,
    context.fetch,
  );

  return {
    data: { mId, status: safeStatus },
    updateStrategy: { type: 'none' },
  };
};

export const updateMissionStatusConfig: ActionConfig = {
  key: 'updateMissionStatus',
  description: 'Update the progress status (0–100) on an in-progress mission (Mesimabetahalich).',
  graphqlOperation: updateMissionStatusHandler,

  paramSchema: {
    mId: { type: 'string', required: true, description: 'Mesimabetahalich ID' },
    projectId: { type: 'string', required: true, description: 'Project ID (for auth)' },
    status: { type: 'number', required: true, description: 'Progress percentage 0–100' },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to update mission status',
    },
  ],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: { projectIdParam: 'projectId', excludeSender: true },
    },
    templates: {
      title: { he: 'עדכון התקדמות משימה', en: 'Mission progress updated' },
      body: { he: 'אחוז התקדמות המשימה עודכן', en: 'Mission progress percentage was updated' },
    },
    channels: ['socket'],
    metadata: { type: 'missionStatus', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
