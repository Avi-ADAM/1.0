/**
 * Action: requestSheirutJoin — ask to receive a rikma's service.
 *
 * Replaces the two raw GraphQL mutations `sheirutShow.svelte` fired from the
 * browser (PLAN_TIMEGRAMA B6): raw GraphQL through /api/send is dev-only and
 * 403s in production, and the old code read the requester's id from
 * `document.cookie` — a value the browser is free to rewrite. Here the
 * requester is `context.userId`, taken from the session, so nobody can file a
 * request in someone else's name.
 *
 * The request is deliberately open-ended on the rikma's side. Per D2 it does
 * **not** mature on silence alone: taking on a customer is the rikma's
 * decision, so `timegrama/askwant.svelte` requires at least one member's yes.
 * The clock is still attached, because without it the request would sit
 * unanswered forever with nothing to end it.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { restimeToMs } from './saleClaimShared.js';

const requestSheirutJoinHandler: ActionExecutionHandler = async (params, context, util) => {
  const { projectId, sheirutId } = params;
  const { strapi } = util;
  const { jwt, fetch } = context;

  if (!projectId) throw new Error('projectId is required');
  if (!sheirutId) throw new Error('sheirutId is required');
  if (!context.userId) throw new Error('A service request needs an authenticated requester');

  const projRes = await strapi.execute(
    '304getProjectMembersAndRestime',
    { pid: String(projectId) },
    jwt,
    fetch
  );
  const project = projRes?.data?.project?.data;
  if (!project) throw new Error(`Project ${projectId} not found`);

  const askRes = await strapi.execute(
    '299createAskwant',
    {
      sheirut: String(sheirutId),
      project: String(projectId),
      userId: String(context.userId)
    },
    jwt,
    fetch
  );
  const askwantId = askRes?.data?.createAskwant?.data?.id;
  if (!askwantId) throw new Error('Failed to file the service request');

  const dueAt = new Date(Date.now() + restimeToMs(project.attributes?.restime)).toISOString();
  const tgRes = await strapi.execute(
    '300createTimegramaForAskwant',
    { date: dueAt, askwantId: String(askwantId) },
    jwt,
    fetch
  );

  return {
    data: {
      askwantId: String(askwantId),
      sheirutId: String(sheirutId),
      timegramaId: tgRes?.data?.createTimegrama?.data?.id ?? null,
      dueAt
    },
    updateStrategy: {
      type: 'partialUpdate',
      config: { dataKeys: ['askwants'], updateFunction: 'refreshServices' }
    }
  };
};

export const requestSheirutJoinConfig: ActionConfig = {
  key: 'requestSheirutJoin',
  description: "Ask to receive one of a rikma's services",
  graphqlOperation: requestSheirutJoinHandler,

  paramSchema: {
    projectId: { type: 'string', required: true },
    sheirutId: { type: 'string', required: true }
  },

  // Anyone signed in may ask — the requester is outside the rikma by
  // definition, so a projectMember rule would refuse exactly the people this
  // is for. The rikma's answer is the gate, not the asking.
  authRules: [{ type: 'jwt', errorMessage: 'Must be signed in to request a service' }],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: { projectIdParam: 'projectId', excludeSender: true }
    },
    templates: {
      title: {
        he: 'בקשה לקבל שירות מהריקמה',
        en: 'Someone asked to receive a service',
        ar: 'طلب أحدهم الحصول على خدمة'
      },
      body: {
        he: 'התקבלה בקשה לקבל אחד מהשירותים שלכם. בלי אישור של חבר בריקמה הבקשה לא תאושר מאליה.',
        en: 'A request to receive one of your services arrived. Without a member approving it, it will not mature on its own.',
        ar: 'وصل طلب للحصول على إحدى خدماتكم. من دون موافقة أحد الأعضاء لن تتم الموافقة تلقائيًا.'
      }
    },
    channels: ['socket', 'email', 'telegram', 'push'],
    emailTemplate: 'SimpleNuti',
    metadata: { type: 'sheirutUpdate', url: 'lev', priority: 'high' }
  }
};
