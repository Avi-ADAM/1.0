/**
 * Create Mission Offer — PLAN_USER_OFFERINGS §3.4 (M2).
 *
 * A user's priced offer to perform a mission: "what I can do, for how much
 * and where". Authored client-side with the standard mission form
 * (prPr/mission.svelte, specMode) so it carries hours, rate and location.
 *
 * Template linkage: an offer should point at a Mission catalog template so
 * discovery (skills/roles matching, concierge grounding) works. If the client
 * didn't recognise a template (no missionId), we look one up by exact name
 * and otherwise mint a minimal template (name + descrip) via the same
 * mutation `createMissionTemplate` uses.
 *
 * Side-effect: keeps `user.missions_i_can_do` in sync (append on create) so
 * every existing matching path over that relation keeps working.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { screenLabel } from '../../vocab/moderation.js';

const handler: ActionExecutionHandler = async (params, context, util) => {
  const { strapi } = util;
  const uid = String(context.userId);
  const jwt = context.jwt as string;
  const f = context.fetch as typeof fetch;

  const name = String(params.name ?? '').trim();
  if (!name) throw new Error('name is required');

  // Inline moderation — same non-bypassable screen as the vocab pipeline.
  const verdict = screenLabel(name, { checkLength: false });
  if (verdict.flagged) {
    throw new Error(`השם לא עבר בדיקת תוכן (${verdict.reasons.join(', ')})`);
  }

  // ── 1. Resolve the mission template ──────────────────────────────────────
  let missionId: string | null = params.missionId ? String(params.missionId) : null;
  if (!missionId) {
    const found = await strapi.execute('261findMissionByName', { name }, jwt, f);
    missionId = found?.data?.missions?.data?.[0]?.id
      ? String(found.data.missions.data[0].id)
      : null;
  }
  if (!missionId) {
    // Mint a minimal catalog template ("template by name only",
    // PLAN_CONCIERGE §0.1) — same mutation createMissionTemplate rides.
    const created = await strapi.execute(
      '21createMission',
      {
        missionName: name,
        descrip: params.descrip ?? null,
        skills: [],
        tafkidims: [],
        publishedAt: new Date().toISOString()
      },
      jwt,
      f
    );
    missionId = created?.data?.createMission?.data?.id
      ? String(created.data.createMission.data.id)
      : null;
    if (!missionId) throw new Error('Failed to create mission template');
  }

  // ── 2. Create the offer ───────────────────────────────────────────────────
  const location = params.location
    ? {
        lat: params.location.lat ?? null,
        lng: params.location.lng ?? null,
        radius: params.location.radius ?? null,
        location_hint: params.location.location_hint ?? null,
        location_mode: params.location.location_mode ?? null
      }
    : null;

  const oRes = await strapi.execute(
    '259createMissionOffer',
    {
      uid,
      mission: missionId,
      name,
      descrip: params.descrip ?? null,
      hours: params.hours != null ? Number(params.hours) : null,
      perhour: params.perhour != null ? Number(params.perhour) : null,
      price: params.price != null ? Number(params.price) : null,
      location,
      note: params.note ?? null,
      publishedAt: new Date().toISOString()
    },
    jwt,
    f
  );
  const offerId = oRes?.data?.createMissionOffer?.data?.id;
  if (!offerId) throw new Error('יצירת הצעת המשימה נכשלה');

  // ── 3. Sync missions_i_can_do (append) ────────────────────────────────────
  try {
    const cur = await strapi.execute('262getUserMissionsICanDo', { uid }, jwt, f);
    const ids: string[] = (
      cur?.data?.usersPermissionsUser?.data?.attributes?.missions_i_can_do?.data ?? []
    ).map((m: any) => String(m.id));
    if (!ids.includes(missionId)) {
      await strapi.execute(
        '263setUserMissionsICanDo',
        { uid, missionIds: [...ids, missionId] },
        jwt,
        f
      );
    }
  } catch (e) {
    console.warn('[createMissionOffer] missions_i_can_do sync failed (non-fatal):', e);
  }

  return {
    data: { offerId: String(offerId), missionId },
    updateStrategy: { type: 'none' as const }
  };
};

export const createMissionOfferConfig: ActionConfig = {
  key: 'createMissionOffer',
  description:
    'Create a priced mission offer ("what I can do"): links/mints a Mission catalog template, creates the mission-offer (hours, rate/price, location), and appends to user.missions_i_can_do.',
  graphqlOperation: handler,
  paramSchema: {
    name: { type: 'string', required: true, description: 'Mission name (template name)' },
    descrip: { type: 'string', required: false },
    hours: { type: 'number', required: false, description: 'Typical/minimum scope in hours' },
    perhour: { type: 'number', required: false, description: 'Rate per hour' },
    price: { type: 'number', required: false, description: 'Fixed price (alternative to perhour)' },
    missionId: { type: 'string', required: false, description: 'Existing Mission template id' },
    location: { type: 'object', required: false, description: 'ComponentNewLocation shape' },
    note: { type: 'string', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' }
};
