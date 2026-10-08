/**
 * Action: proposeRikmaIdentity — a new address and/or look for the rikma's
 * public page (docs/inprogress/PLAN_RIKMA_SUBDOMAINS.md S0/S1).
 *
 * The address and the look speak for every member, so they ride the same road
 * as the rikma's name and description (updateProjectDetails): a rikma of one
 * changes them directly; any larger rikma gets a `Decision` — `kind: 'address'`
 * or `'look'` — with the proposer's yes already on it and a restime clock, so
 * the change happens on everyone's yes or on the rikma's silence. Both of those
 * routes end in `applyIdentityDecision`, which validates everything again.
 *
 * Validation here is so the member hears "taken" now, not when the clock ends.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types';
import { calcDeadlineMs } from './actionUtils.js';
import {
  IdentityError,
  applyRikmaIdentity,
  prepareLook,
  readIdentity,
  slugAvailability,
  type Run
} from '$lib/server/rikmaIdentity/identity.js';
import { sameLook, type RikmaLook } from '$lib/rikmaLook/look.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const wantsSlug = typeof params.slug === 'string' && params.slug.trim() !== '';
  const wantsLook = params.clearLook === true || (params.look !== undefined && params.look !== null);
  if (!wantsSlug && !wantsLook) throw new Error('Nothing to propose');

  // Lookups across rikmas run as the service (another rikma's address is not
  // the member's to read row by row); the write runs as the member.
  const read: Run = (qid, vars) => strapi.execute(qid, vars, undefined, context.fetch);
  const write: Run = (qid, vars) => strapi.execute(qid, vars, context.jwt, context.fetch);

  const current = await readIdentity(read, projectId);
  if (!current) {
    throw new IdentityError(
      'unavailable',
      'Rikma addresses are not available yet on this server (the schema is not deployed)'
    );
  }

  let slug: string | undefined;
  if (wantsSlug) {
    const avail = await slugAvailability(read, params.slug, projectId);
    if (avail.ok === false) throw new IdentityError(`slug:${avail.reason}`, `The address is not available (${avail.reason})`);
    if (avail.slug !== current.slug) slug = avail.slug;
  }

  let look: RikmaLook | null | undefined;
  if (wantsLook) {
    const next = params.clearLook === true ? null : await prepareLook(read, params.look);
    if (!sameLook(next, current.look)) look = next;
  }

  if (slug === undefined && look === undefined) {
    return {
      success: true,
      data: { applied: false, unchanged: true, decisions: [] },
      updateStrategy: { type: 'none' as const }
    };
  }

  const base = await strapi.execute('getProjectBaseInfo', { pid: projectId }, context.jwt, context.fetch);
  const attrs = base?.data?.project?.data?.attributes;
  if (!attrs) throw new Error('Project not found');
  const memberCount: number = attrs.user_1s?.data?.length ?? 1;

  // A rikma of one: nobody else to ask.
  if (memberCount <= 1) {
    const applied = await applyRikmaIdentity({ read, write }, projectId, {
      ...(slug !== undefined ? { slug } : {}),
      ...(look !== undefined ? { look } : {})
    });
    return {
      success: true,
      data: { applied: true, slug: applied.slug, hasLook: !!applied.look, decisions: [] },
      updateStrategy: { type: 'fullRefresh' as const }
    };
  }

  const now = new Date().toISOString();
  const deadline = new Date(Date.now() + calcDeadlineMs(attrs.restime ?? 'feh')).toISOString();
  const vots = [{ what: true, users_permissions_user: String(context.userId) }];
  const specs: Array<{ kind: 'address' | 'look'; extra: Record<string, unknown> }> = [];
  if (slug !== undefined) specs.push({ kind: 'address', extra: { newSlug: slug } });
  if (look !== undefined) specs.push({ kind: 'look', extra: { newLook: look } });

  const decisions: Array<{ kind: string; id: string }> = [];
  for (const { kind, extra } of specs) {
    const res = await strapi.execute(
      'rikmaCreateIdentityDecision',
      { projectIds: [projectId], publishedAt: now, decisionName: kind, kind, vots, ...extra },
      context.jwt,
      context.fetch
    );
    const id = res?.data?.createDecision?.data?.id;
    if (!id) throw new Error(`Could not open the ${kind} proposal: ${JSON.stringify(res?.errors ?? 'no answer')}`);
    await strapi.execute(
      '32createTimeGrama',
      { whatami: 'decision', decision: id, date: deadline },
      context.jwt,
      context.fetch
    );
    decisions.push({ kind, id: String(id) });
  }

  return {
    success: true,
    data: { applied: false, decisions, deadline },
    updateStrategy: { type: 'none' as const }
  };
};

export const proposeRikmaIdentityConfig: ActionConfig = {
  key: 'proposeRikmaIdentity',
  description:
    "Propose a new public address (/r/<slug>) and/or public-page look for a rikma. Applied directly in a one-member rikma; otherwise opens an 'address' / 'look' Decision that matures on consent or restime silence.",
  graphqlOperation: handler,

  paramSchema: {
    projectId: { type: 'string', required: true },
    slug: { type: 'string', required: false },
    look: { type: 'object', required: false },
    clearLook: { type: 'boolean', required: false }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a member of the rikma'
    }
  ],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: { projectIdParam: 'projectId', excludeSender: true }
    },
    templates: {
      title: {
        he: 'הצעה לכתובת או למראה של הרקמה',
        en: "A proposal for the rikma's address or look",
        ar: 'اقتراح لعنوان الريكما أو مظهرها'
      },
      body: {
        he: 'אחד החברים הציע לשנות את הכתובת או את מראה הדף הציבורי — אפשר לראות ולאשר בלב',
        en: 'A member proposed a new address or look for the public page — see it and approve in your heart',
        ar: 'اقترح أحد الأعضاء عنوانًا أو مظهرًا جديدًا للصفحة العامة — شاهده ووافق عليه في القلب'
      }
    },
    channels: ['socket'],
    metadata: { type: 'base', url: 'lev' }
  },

  updateStrategy: { type: 'none' }
};
