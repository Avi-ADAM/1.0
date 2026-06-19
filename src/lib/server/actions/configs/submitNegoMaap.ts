/**
 * Action Configuration: Counter-offer on a recurring monthly cycle (Maap)
 *
 * Instead of a hard "decline", a project member can propose a different monthly
 * amount with a reason. This:
 *   1. Snapshots the previous amount into a Nego record (price → proposedPrice).
 *   2. Rewrites the cycle Maap's quantityDelivered to the proposed amount.
 *   3. Opens a new voting round (order+1) so everyone must re-approve — the
 *      proposer's own YES is cast at the new round.
 *   4. Resets the Timegrama deadline (the clock counts from now again).
 *   5. Posts the reason to the engine's chat forum.
 *   6. Notifies all project members (socket + push + email).
 *
 * Server-authoritative: the client only sends askId + projectId + newAmount +
 * reason. Everything else (current amount, vote rounds, timegrama, forum) is
 * resolved from the DB, so it can't be spoofed or run on stale state.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { calcDeadlineMs } from './actionUtils.js';

function normalizeVote(v: any): Record<string, any> {
  const uid =
    v.users_permissions_user?.data?.id ??
    v.users_permissions_user?.id ??
    v.users_permissions_user;
  const row: Record<string, any> = {
    what: Boolean(v.what),
    users_permissions_user: uid != null ? String(uid) : null,
    order: v.order ?? 0,
  };
  if (v.why) row.why = v.why;
  if (v.ide != null) row.ide = parseInt(String(v.ide), 10);
  else if (uid != null) row.ide = parseInt(String(uid), 10);
  if (v.zman) row.zman = v.zman;
  return row;
}

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { askId, projectId, newAmount, reason } = params;
  const userId = String(context.userId);
  const now = new Date();
  const nowISO = now.toISOString();
  const proposed = Number(newAmount);

  if (Number.isNaN(proposed) || proposed < 0) {
    throw new Error('submitNegoMaap: a valid non-negative newAmount is required');
  }

  // 1. Fetch the cycle Maap (server-authoritative state)
  const maapRes: any = await strapi.execute('151getMaapForVote', { id: askId }, context.jwt, context.fetch);
  const maapData = maapRes?.data?.maap?.data;
  if (!maapData) throw new Error(`Maap ${askId} not found`);
  const attrs = maapData.attributes;

  const mashab = attrs.mashabetahalich?.data;
  if (!mashab) throw new Error(`Maap ${askId} is not a recurring cycle — cannot counter-offer`);
  const mashId = String(mashab.id);
  const mashAttrs = mashab.attributes ?? {};

  // A counter-offer only makes sense once an amount has been reported.
  const oldAmount = attrs.quantityDelivered;
  if (oldAmount == null) {
    throw new Error('submitNegoMaap: nothing reported yet — cannot counter-offer');
  }

  const cycleIndex = attrs.cycleIndex ?? 1;

  // 2. New voting round: keep all prior votes, cast the proposer's YES at order+1.
  const existingVots: any[] = attrs.vots ?? [];
  const orderon: number = existingVots.reduce((mx: number, v: any) => Math.max(mx, v.order ?? 0), 0);
  const newOrder = orderon + 1;
  const carried = existingVots.map(normalizeVote);
  const proposerVote: Record<string, any> = {
    what: true,
    users_permissions_user: userId,
    order: newOrder,
    ide: parseInt(userId, 10),
    zman: nowISO,
  };
  const allVots = [...carried, proposerVote];

  // 3. Rewrite the cycle amount + votes.
  await strapi.execute(
    'mrUpdateCycleMaap',
    { id: askId, data: { quantityDelivered: proposed, vots: allVots } },
    context.jwt,
    context.fetch,
  );

  // 4. Snapshot the previous amount into a Nego record (audit trail).
  try {
    await strapi.execute(
      'mrCreateNego',
      {
        maapId: askId,
        price: Number(oldAmount),
        proposedPrice: proposed,
        des: { proposedBy: userId, reason: reason ?? '', cycleIndex, oldAmount: Number(oldAmount), newAmount: proposed },
        publishedAt: nowISO,
      },
      context.jwt,
      context.fetch,
    );
  } catch (e) {
    console.error('submitNegoMaap: failed to snapshot Nego', e);
  }

  // 5. Reset the deadline clock (counts from now again).
  const timegramaId: string | null = attrs.timegrama?.data?.id ?? null;
  if (timegramaId) {
    let restime = 'feh';
    try {
      const rr: any = await strapi.execute('mrGetProjectRestime', { pid: projectId }, context.jwt, context.fetch);
      restime = rr?.data?.project?.data?.attributes?.restime ?? 'feh';
    } catch {
      /* default restime */
    }
    const deadline = new Date(Date.now() + calcDeadlineMs(restime)).toISOString();
    await strapi.execute('mrResetTimegrama', { id: timegramaId, date: deadline }, context.jwt, context.fetch);
  }

  // 6. Post the reason to the engine's chat forum (create the forum if needed).
  try {
    let forumId: string | null = mashAttrs.forums?.data?.[0]?.id ?? null;
    const mashProjectId = mashAttrs.project?.data?.id ?? projectId;
    if (!forumId) {
      const fRes: any = await strapi.execute(
        'mrCreateForumMashab',
        { pid: mashProjectId, mashabId: mashId, da: nowISO },
        context.jwt,
        context.fetch,
      );
      forumId = fRes?.data?.createForum?.data?.id ?? null;
    }
    if (forumId) {
      const mes =
        `🔁 הצעת סכום חדשה למחזור #${cycleIndex}: ` +
        `${Number(oldAmount)} ₪ ← ${proposed} ₪` +
        (reason ? `\nסיבה: ${reason}` : '');
      await strapi.execute(
        '1chatsend',
        { fid: forumId, fidn: parseInt(forumId, 10), idL: userId, da: nowISO, mes },
        context.jwt,
        context.fetch,
      );
    }
  } catch (e) {
    console.error('submitNegoMaap: failed to post reason to forum', e);
  }

  // Amount + vote round changed → refresh so every card reflects the new round.
  return { data: { askId, newAmount: proposed, order: newOrder, consensus: false }, updateStrategy: { type: 'fullRefresh' } };
};

export const submitNegoMaapConfig: ActionConfig = {
  key: 'submitNegoMaap',
  description:
    'Counter-offer on a recurring monthly cycle Maap: propose a different amount with a reason. Snapshots the old amount into a Nego, rewrites the cycle amount, opens a new voting round (order+1) with the proposer\'s YES, resets the timegrama deadline, posts the reason to the engine chat forum, and notifies members. Server fetches all state — client sends askId + projectId + newAmount + reason.',
  graphqlOperation: handler,

  paramSchema: {
    askId: { type: 'string', required: true, description: 'ID of the cycle Maap' },
    projectId: { type: 'string', required: true, description: 'Project ID' },
    newAmount: { type: 'number', required: true, description: 'The proposed monthly amount' },
    reason: { type: 'string', required: false, description: 'Why the amount should change (posted to chat)' },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to counter-offer on a resource cycle',
    },
  ],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: { projectIdParam: 'projectId', excludeSender: true },
    },
    templates: {
      title: { he: 'הצעת סכום חדשה למשאב חודשי', en: 'New monthly amount proposed' },
      body: { he: 'חבר צוות הציע סכום אחר למחזור החודשי — נדרש אישור מחדש', en: 'A member proposed a different monthly amount — re-approval needed' },
    },
    channels: ['socket', 'push', 'email'],
    metadata: { type: 'maapNego', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
