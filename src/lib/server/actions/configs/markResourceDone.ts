/**
 * Action Configuration: Mark a recurring resource as done (close the engine)
 *
 * A recurring expense (mashabetahalich with recurring=true) keeps opening a new
 * monthly cycle until its end date passes or the responsible user marks it done.
 * This action closes the engine: status_mashab → 'closed' and finnished → true,
 * so /api/monthi stops opening new cycles and the card is archived.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const markResourceDoneHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { mashabetahalichId } = params;

  await strapi.execute(
    'mrUpdateMashabetahalich',
    { id: mashabetahalichId, data: { status_mashab: 'closed', finnished: true } },
    context.jwt,
    context.fetch
  );

  return {
    data: { mashabetahalichId, closed: true },
    updateStrategy: { type: 'fullRefresh' },
  };
};

export const markResourceDoneConfig: ActionConfig = {
  key: 'markResourceDone',
  description: 'Close a recurring resource engine (mashabetahalich): stops monthly cycles and archives it',
  graphqlOperation: markResourceDoneHandler,

  paramSchema: {
    mashabetahalichId: { type: 'string', required: true, description: 'ID of the mashabetahalich engine to close' },
    projectId: { type: 'string', required: true, description: 'Project ID (auth check)' },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to close a recurring resource',
    },
  ],

  notification: {
    recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId', excludeSender: true } },
    templates: {
      title: { he: 'משאב חודשי הסתיים', en: 'Recurring resource closed', ar: 'تم إغلاق المورد المتكرر' },
      body: { he: 'משאב חודשי סומן כהושלם ונארכב', en: 'A recurring resource was marked done and archived', ar: '' },
    },
    channels: ['socket'],
    metadata: { type: 'resourceDone', url: '/lev?project={{projectId}}' },
  },

  updateStrategy: { type: 'fullRefresh' },
};
