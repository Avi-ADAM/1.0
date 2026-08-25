/**
 * Action: proposeSheirut — add a service to a rikma's catalogue.
 *
 * Replaces the three raw GraphQL mutations `addSheirut.svelte` used to fire
 * from the browser (PLAN_TIMEGRAMA B6). Raw GraphQL through /api/send is
 * dev-only and 403s in production, so that flow was on borrowed time; more to
 * the point, it decided on the client who may propose a service, how long the
 * rikma has to answer, and whether the service is approved on the spot.
 *
 * Two things it fixes while moving:
 *
 * 1. **The approval flag was inverted.** The old code set `isApruved:true` when
 *    the rikma had more than one member — the exact case that needs a vote —
 *    and `false` for a solo rikma, where there is nobody to ask, leaving that
 *    service permanently unapprovable. Here: a solo rikma publishes
 *    immediately, a rikma with partners publishes when they agree (or when the
 *    clock runs out on their silence — `timegrama/sheirutpend.svelte`).
 * 2. **The proposer's vote goes where votes go.** The old client wrote the
 *    `vots` component while the `addVote` action writes `Vote` rows; a
 *    sheirutpend could end up with its signatures split across two stores.
 *    This writes the relation, the one the vote path uses.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { restimeToMs } from './saleClaimShared.js';

const proposeSheirutHandler: ActionExecutionHandler = async (params, context, util) => {
  const { projectId, name, descrip, oneTime, equaliSplited } = params;
  const { strapi } = util;
  const { jwt, fetch } = context;

  if (!projectId) throw new Error('projectId is required');
  if (!name || !String(name).trim()) throw new Error('A service needs a name');

  // The rikma, read server-side: its members decide whether a vote is needed
  // and its restime decides the deadline. Neither may come from the caller.
  const projRes = await strapi.execute(
    '304getProjectMembersAndRestime',
    { pid: String(projectId) },
    jwt,
    fetch
  );
  const project = projRes?.data?.project?.data;
  if (!project) throw new Error(`Project ${projectId} not found`);

  const memberIds: string[] = (project.attributes?.user_1s?.data ?? []).map((u: any) =>
    String(u.id)
  );
  const restime = project.attributes?.restime;
  // A rikma of one has nobody to ask. Anything larger does.
  const needsConsent = memberIds.length > 1;

  const createRes = await strapi.execute(
    '87createSheirut',
    {
      data: {
        name: String(name),
        descrip: descrip == null ? '' : String(descrip),
        project: String(projectId),
        oneTime: oneTime === true,
        equaliSplited: equaliSplited !== false,
        isApruved: !needsConsent,
        archived: false
      }
    },
    jwt,
    fetch
  );

  const sheirutId = createRes?.data?.createSheirut?.data?.id;
  if (!sheirutId) throw new Error('Failed to create the service');

  if (!needsConsent) {
    return {
      data: { sheirutId: String(sheirutId), sheirutpendId: null, timegramaId: null, approved: true },
      updateStrategy: {
        type: 'partialUpdate',
        config: { dataKeys: ['sheiruts'], updateFunction: 'refreshServices' }
      }
    };
  }

  // The proposal the rikma answers, plus the proposer's own yes.
  const pendRes = await strapi.execute(
    '296createSheirutpendProposal',
    { sheirut: String(sheirutId), project: String(projectId), userId: String(context.userId) },
    jwt,
    fetch
  );
  const sheirutpendId = pendRes?.data?.createSheirutpend?.data?.id;
  if (!sheirutpendId) throw new Error('Failed to open the service proposal');

  await strapi.execute(
    '86addVoteToSheirutpend_v2',
    {
      sheirutpend: String(sheirutpendId),
      user: String(context.userId),
      what: true,
      order: 0,
      why: ''
    },
    jwt,
    fetch
  );

  // The clock. Without it the proposal can only ever be settled by everyone
  // signing — which is what left services stranded before.
  const dueAt = new Date(Date.now() + restimeToMs(restime)).toISOString();
  const tgRes = await strapi.execute(
    '297createTimegramaForSheirutpend',
    { date: dueAt, sheirutpendId: String(sheirutpendId) },
    jwt,
    fetch
  );

  return {
    data: {
      sheirutId: String(sheirutId),
      sheirutpendId: String(sheirutpendId),
      timegramaId: tgRes?.data?.createTimegrama?.data?.id ?? null,
      dueAt,
      approved: false
    },
    updateStrategy: {
      type: 'partialUpdate',
      config: { dataKeys: ['sheiruts', 'sheirutpends'], updateFunction: 'refreshServices' }
    }
  };
};

export const proposeSheirutConfig: ActionConfig = {
  key: 'proposeSheirut',
  description: "Propose a new service for a rikma's catalogue",
  graphqlOperation: proposeSheirutHandler,

  paramSchema: {
    projectId: { type: 'string', required: true },
    name: { type: 'string', required: true },
    descrip: { type: 'string', required: false },
    oneTime: { type: 'boolean', required: false },
    equaliSplited: { type: 'boolean', required: false }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to propose a service' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: "Only a member of the rikma can add a service to its catalogue"
    }
  ],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: { projectIdParam: 'projectId', excludeSender: true }
    },
    templates: {
      title: {
        he: 'הוצע שירות חדש בריקמה',
        en: 'A new service was proposed',
        ar: 'تم اقتراح خدمة جديدة'
      },
      body: {
        he: 'חבר בריקמה הציע שירות חדש. אם לא תגיבו עד תום זמן התגובה, ההצעה תאושר מאליה.',
        en: 'A member proposed a new service. With no response before restime runs out, it is approved.',
        ar: 'اقترح أحد الأعضاء خدمة جديدة. في حال عدم الرد قبل انتهاء المهلة، تتم الموافقة عليها.'
      }
    },
    channels: ['socket', 'email', 'telegram', 'push'],
    emailTemplate: 'SimpleNuti',
    metadata: { type: 'sheirutUpdate', url: 'lev', priority: 'high' }
  }
};
