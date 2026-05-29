/**
 * Action Configuration: Update Mission Timer State (legacy timer fields)
 *
 * Handles two operations on Mesimabetahalich legacy timer fields:
 *
 *  • SAVE mode  (hoursdon provided): persist cumulative hours + clear stname/timer fields.
 *    Corresponds to the old save() function in missionInProgress.svelte.
 *    Uses QIDS `11saveTimer` which also nulls the activeTimer relation.
 *
 *  • CLEAR mode (hoursdon absent / null): clear stname/timer fields only, do NOT change
 *    howmanyhoursalready. Corresponds to handleClearClick() in missionInProgress.svelte.
 *    Uses QIDS `10stopTimer`.
 *
 * Note: These are legacy operations on the old-style timer fields embedded directly on
 * Mesimabetahalich (stname, timer, howmanyhoursalready). The new TimerDialogs component
 * uses a separate ActiveTimer relation instead. This action keeps the legacy fields in sync.
 *
 * Client sends: { mId, projectId, hoursdon? }
 *   hoursdon = new cumulative hours value (for save), absent = clear only.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const updateMissionTimerStateHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { mId, projectId, hoursdon } = params;

  const isSaveMode = hoursdon !== undefined && hoursdon !== null;

  if (isSaveMode) {
    // SAVE: update howmanyhoursalready + clear legacy timer fields
    await strapi.execute(
      '11saveTimer',
      {
        mId: String(mId),
        stname: '0',
        x: 0,
        howmanyhoursalready: Number(hoursdon),
      },
      context.jwt,
      context.fetch,
    );
  } else {
    // CLEAR: just reset stname and timer without touching hours
    await strapi.execute(
      '10stopTimer',
      {
        mId: String(mId),
        stname: '0',
        x: 0,
      },
      context.jwt,
      context.fetch,
    );
  }

  return {
    data: { mId, mode: isSaveMode ? 'save' : 'clear' },
    updateStrategy: { type: 'none' },
  };
};

export const updateMissionTimerStateConfig: ActionConfig = {
  key: 'updateMissionTimerState',
  description:
    'Save or clear legacy timer fields on Mesimabetahalich. Save mode (hoursdon provided): persists cumulative hours. Clear mode: resets stname/timer only.',
  graphqlOperation: updateMissionTimerStateHandler,

  paramSchema: {
    mId: { type: 'string', required: true, description: 'Mesimabetahalich ID' },
    projectId: { type: 'string', required: true, description: 'Project ID (for auth)' },
    hoursdon: {
      type: 'number',
      required: false,
      description: 'Cumulative hours (save mode). Omit for clear-only mode.',
    },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to update mission timer',
    },
  ],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: { projectIdParam: 'projectId', excludeSender: true },
    },
    templates: {
      title: { he: 'עדכון טיימר משימה', en: 'Mission timer updated' },
      body: { he: 'הטיימר של המשימה עודכן', en: 'Mission timer was updated' },
    },
    channels: ['socket'],
    metadata: { type: 'timerState', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
