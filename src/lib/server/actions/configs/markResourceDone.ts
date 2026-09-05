/**
 * Action Configuration: Mark a recurring resource as done (close the engine)
 *
 * A recurring expense (mashabetahalich with recurring=true) keeps opening a new
 * monthly cycle until its end date passes or the responsible user marks it done.
 * This action closes the engine: status_mashab → 'closed' and finnished → true,
 * so /api/monthi stops opening new cycles and the card is archived.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { bestEffort, releaseBookings } from '$lib/server/resources/bookingStore.js';
import { execFromContext } from '$lib/server/archive/exec.js';

const markResourceDoneHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { mashabetahalichId, spId, projectId } = params;

  await strapi.execute(
    'mrUpdateMashabetahalich',
    { id: mashabetahalichId, data: { status_mashab: 'closed', finnished: true } },
    context.jwt,
    context.fetch
  );

  // Closing the engine used to be the whole story, and that is the bug: the
  // resource stayed `panui: false` forever, so a projector lent once was never
  // offered to anyone again. Releasing the bookings recomputes availability
  // from the ledger, which is what actually hands the resource back.
  const released = await bestEffort('markResourceDone', () =>
    spId
      ? releaseBookings(execFromContext(context), { spId, projectId: projectId ?? null })
      : Promise.resolve([])
  );

  return {
    data: { mashabetahalichId, closed: true, released: released ?? [] },
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
    spId: {
      type: 'string',
      required: false,
      description: 'The held resource, so its bookings are released and it becomes available again',
    },
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
