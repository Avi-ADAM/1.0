/**
 * Create Personal Matanot — PLAN_USER_OFFERINGS §3.3 (M3).
 *
 * A user creates a fixed-price product without opening a rikma first. Three
 * hosting modes (the create-product flow's rikma choice):
 *  - default          → the home rikma (ensurePersonalRikmaFor), with
 *                       origin='personal' + owner_user so /gift shows the user.
 *  - projectId        → an existing rikma the caller is a member of
 *                       (same behaviour as creating from that rikma's moach).
 *  - newRikmaName     → a fresh named rikma is created first (crWeaveFull,
 *                       caller = sole member) and hosts the product.
 * All modes ride the existing /gift → sheirutpend sale flow untouched;
 * single-member consensus matures immediately.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { screenLabel } from '../../vocab/moderation.js';
import { ensurePersonalRikmaFor } from './ensurePersonalRikma.js';

const KINDS = ['total', 'monthly', 'yearly', 'daily', 'unlimited'] as const;

const handler: ActionExecutionHandler = async (params, context, util) => {
  const { strapi } = util;
  const ctx = {
    userId: context.userId as string,
    jwt: context.jwt as string,
    fetch: context.fetch as typeof fetch
  };

  const name = String(params.name ?? '').trim();
  if (!name) throw new Error('name is required');
  const price = Number(params.price);
  if (!price || price <= 0) throw new Error('נדרש מחיר גדול מאפס');
  const kindOf = KINDS.includes(params.kindOf) ? params.kindOf : 'total';

  // Inline moderation — same non-bypassable screen as the vocab pipeline.
  const verdict = screenLabel(name, { checkLength: false });
  if (verdict.flagged) {
    throw new Error(`השם לא עבר בדיקת תוכן (${verdict.reasons.join(', ')})`);
  }

  // ── Resolve the hosting rikma (see header) ────────────────────────────────
  let hostProjectId: string;
  let origin: 'personal' | 'project' = 'personal';
  const requestedProjectId = params.projectId ? String(params.projectId) : null;
  const newRikmaName = params.newRikmaName ? String(params.newRikmaName).trim() : null;

  if (requestedProjectId) {
    const pRes = await strapi.execute(
      '274getProjectMembers',
      { pid: requestedProjectId },
      ctx.jwt,
      ctx.fetch
    );
    const members = pRes?.data?.project?.data?.attributes?.user_1s?.data ?? [];
    const isMember = members.some((m: any) => String(m.id) === String(ctx.userId));
    if (!isMember) throw new Error('רק חבר ריקמה יכול ליצור בה מוצר');
    hostProjectId = requestedProjectId;
    origin = 'project';
  } else if (newRikmaName) {
    const rikmaVerdict = screenLabel(newRikmaName, { checkLength: false });
    if (rikmaVerdict.flagged) {
      throw new Error(`שם הריקמה לא עבר בדיקת תוכן (${rikmaVerdict.reasons.join(', ')})`);
    }
    const wRes = await strapi.execute(
      'crWeaveFull',
      {
        members: [String(ctx.userId)],
        projectName: newRikmaName,
        publicDescription: null,
        descripFor: null,
        linkToWebsite: null,
        vallues: [],
        restime: 'sth',
        timeToP: null,
        profilePic: null,
        isOt: false,
        publishedAt: new Date().toISOString()
      },
      ctx.jwt,
      ctx.fetch
    );
    const project = wRes?.data?.createProject?.data;
    if (!project?.id) throw new Error('יצירת הריקמה נכשלה');
    hostProjectId = String(project.id);
    origin = 'project';
  } else {
    const home = await ensurePersonalRikmaFor(ctx, strapi);
    hostProjectId = home.projectId;
  }

  const location = params.location
    ? {
        lat: params.location.lat ?? null,
        lng: params.location.lng ?? null,
        radius: params.location.radius ?? null,
        location_hint: params.location.location_hint ?? null,
        location_mode: params.location.location_mode ?? null
      }
    : null;

  const mRes =
    origin === 'personal'
      ? await strapi.execute(
          '253createPersonalMatanotFromSp',
          {
            projectcreates: hostProjectId,
            ownerUser: String(ctx.userId),
            name,
            desc: params.descrip ?? '',
            price,
            quant: params.quant != null ? Number(params.quant) : null,
            kindOf,
            pic: params.picId ? String(params.picId) : null,
            location,
            publishedAt: new Date().toISOString()
          },
          ctx.jwt,
          ctx.fetch
        )
      : await strapi.execute(
          '136createMatanot',
          {
            projectcreates: hostProjectId,
            name,
            desc: params.descrip ?? '',
            price,
            quant: params.quant != null ? Number(params.quant) : null,
            kindOf,
            pic: params.picId ? String(params.picId) : null,
            location,
            status_of_voting: 'active',
            publishedAt: new Date().toISOString()
          },
          ctx.jwt,
          ctx.fetch
        );
  const matanotId = mRes?.data?.createMatanot?.data?.id;
  if (!matanotId) throw new Error('יצירת המוצר נכשלה');

  return {
    data: { matanotId: String(matanotId), projectId: hostProjectId, origin },
    updateStrategy: { type: 'none' as const }
  };
};

export const createPersonalMatanotConfig: ActionConfig = {
  key: 'createPersonalMatanot',
  description:
    'Create a personal fixed-price product (Matanot origin=personal, owner_user) hosted on the caller home rikma; the regular /gift sale flow applies unchanged.',
  graphqlOperation: handler,
  paramSchema: {
    name: { type: 'string', required: true },
    descrip: { type: 'string', required: false, description: 'Description (stored in desc)' },
    price: { type: 'number', required: true },
    quant: { type: 'number', required: false, description: 'Available quantity' },
    kindOf: { type: 'string', required: false, description: "total|monthly|yearly|daily|unlimited (default 'total')" },
    picId: { type: 'string', required: false, description: 'Uploaded image id' },
    location: { type: 'object', required: false, description: 'ComponentNewLocation shape' },
    projectId: { type: 'string', required: false, description: 'Host on this existing rikma (caller must be a member)' },
    newRikmaName: { type: 'string', required: false, description: 'Create a fresh rikma with this name to host the product' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' }
};
