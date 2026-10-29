/**
 * Action: renewSheirutJoin — ask the rikma again, on the same request.
 *
 * An askwant whose clock ran out with no member's yes is not refused (D2 —
 * there is no absolute "no"); it just could not mature on silence, and the
 * requester was told so (`askwantLapsed`, TIMEGRAMA_REMINDERS R3). This is the
 * "ask again" that notice offers: a fresh restime on the *same* askwant, so
 * the votes already on it still count and the rikma does not get a duplicate.
 *
 * Only the requester can renew their own request — the askwant is read with
 * the service token (its qids are serviceAdmin-only), and the requester check
 * against `context.userId` is what guards it.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { restimeToMs } from './saleClaimShared.js';
import { normId } from '../../nego/negoGate';
import { scope, scopeList } from '$lib/realtime/scopes.js';

export interface RenewResult {
  askwantId: string;
  projectId: string;
  sheirutId: string;
  /** The clock was still running — nothing to renew. */
  alreadyOpen: boolean;
  dueAt: string | null;
  timegramaId: string | null;
}

const renewSheirutJoinHandler: ActionExecutionHandler = async (params, context, util) => {
  const { askwantId } = params;
  const { strapi } = util;
  if (!askwantId) throw new Error('askwantId is required');
  if (!context.userId) throw new Error('Renewing a request needs an authenticated requester');

  const read = await strapi.execute('298getAskwantForFinalize', { id: String(askwantId) }, undefined, context.fetch);
  const a = read?.data?.askwant?.data?.attributes;
  if (!a) throw new ActionError('NOT_FOUND', `Askwant ${askwantId} not found`);
  if (normId(a.users_permissions_user) !== String(context.userId)) {
    throw new ActionError('FORBIDDEN', 'Only the person who asked can renew this request');
  }
  if (a.archived === true) {
    throw new ActionError('ALREADY_RESOLVED', `Askwant ${askwantId} was already answered`);
  }
  const sheirut = a.sheirut?.data;
  if (!sheirut || sheirut.attributes?.isApruved !== true || sheirut.attributes?.archived === true) {
    throw new ActionError('NOT_READY', 'This service is not offered right now');
  }
  const project = a.project?.data;
  if (!project) throw new Error(`Askwant ${askwantId} has no project`);

  const base = { askwantId: String(askwantId), projectId: String(project.id), sheirutId: String(sheirut.id) };
  const clock = a.timegrama?.data;
  if (clock && clock.attributes?.done !== true) {
    const data: RenewResult = { ...base, alreadyOpen: true, dueAt: null, timegramaId: String(clock.id) };
    return { data, updateStrategy: { type: 'none' } };
  }

  const dueAt = new Date(Date.now() + restimeToMs(project.attributes?.restime)).toISOString();
  const tg = await strapi.execute(
    '300createTimegramaForAskwant',
    { date: dueAt, askwantId: String(askwantId) },
    undefined,
    context.fetch
  );
  const data: RenewResult = {
    ...base,
    alreadyOpen: false,
    dueAt,
    timegramaId: tg?.data?.createTimegrama?.data?.id ?? null
  };
  return { data, updateStrategy: { type: 'none' } };
};

export const renewSheirutJoinConfig: ActionConfig = {
  key: 'renewSheirutJoin',
  description: 'Ask again on a service request that closed with no answer',
  graphqlOperation: renewSheirutJoinHandler,

  paramSchema: {
    askwantId: { type: 'string', required: true }
  },

  // The requester is outside the rikma by definition; the handler's
  // requester check is the entity rule.
  authRules: [{ type: 'jwt', errorMessage: 'Must be signed in to renew a request' }],

  notification: {
    recipients: {
      type: 'projectMembers',
      // The rikma is resolved by the handler, so it is read off the result.
      config: { projectIdParam: 'data.projectId', excludeSender: true }
    },
    templates: {
      title: {
        he: 'בקשה לקבל שירות — שוב',
        en: 'A service request, asked again',
        ar: 'طلب للحصول على خدمة — مرة أخرى'
      },
      body: {
        he: 'מי שביקש לקבל אחד מהשירותים שלכם לא קיבל תשובה בזמן, וביקש שוב. בלי אישור של חבר ברקמה הבקשה לא תאושר מאליה.',
        en: 'Someone who asked to receive one of your services got no answer in time, and asked again. Without a member approving it, it will not mature on its own.',
        ar: 'من طلب الحصول على إحدى خدماتكم لم يتلقَّ ردًا في الوقت المحدد، فطلب مرة أخرى. من دون موافقة أحد الأعضاء لن تتم الموافقة تلقائيًا.'
      }
    },
    // Members hear it only when a new round actually opened.
    intent: (_params, result) => (result?.data?.alreadyOpen ? 'ambient' : 'consent'),
    emailTemplate: 'SimpleNuti',
    metadata: { type: 'sheirutUpdate', url: 'lev', priority: 'high' }
  },

  realtime: {
    scopes: (_p, r) => scopeList([scope('project', r?.data?.projectId), scope('deal', r?.data?.sheirutId)])
  }
};
