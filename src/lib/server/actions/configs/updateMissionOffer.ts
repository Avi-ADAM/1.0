/**
 * Update / archive a Mission Offer — PLAN_USER_OFFERINGS §3.4 (M2).
 *
 * Owner-only edit of a mission-offer (rate, hours, price, location, active),
 * or soft-delete via `archived: true`. Archiving keeps missions_i_can_do in
 * sync: the mission is removed from the relation only when the user has no
 * other live offer on the same template.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context, util) => {
  const { strapi } = util;
  const uid = String(context.userId);
  const jwt = context.jwt as string;
  const f = context.fetch as typeof fetch;

  const offerId = String(params.offerId ?? '');
  if (!offerId) throw new Error('offerId is required');

  // ── Ownership guard ────────────────────────────────────────────────────────
  const cur = await strapi.execute('264getMissionOffer', { id: offerId }, jwt, f);
  const node = cur?.data?.missionOffer?.data;
  if (!node) throw new Error(`Mission offer ${offerId} not found`);
  const ownerId = node.attributes?.users_permissions_user?.data?.id;
  if (!ownerId || String(ownerId) !== uid) {
    throw new Error('Only the offer owner may change it');
  }
  const missionId = node.attributes?.mission?.data?.id
    ? String(node.attributes.mission.data.id)
    : null;

  // ── Update ────────────────────────────────────────────────────────────────
  const location = params.location
    ? {
        lat: params.location.lat ?? null,
        lng: params.location.lng ?? null,
        radius: params.location.radius ?? null,
        location_hint: params.location.location_hint ?? null,
        location_mode: params.location.location_mode ?? null
      }
    : undefined;

  const res = await strapi.execute(
    '260updateMissionOffer',
    {
      id: offerId,
      name: params.name ?? undefined,
      descrip: params.descrip ?? undefined,
      hours: params.hours != null ? Number(params.hours) : undefined,
      perhour: params.perhour != null ? Number(params.perhour) : undefined,
      price: params.price != null ? Number(params.price) : undefined,
      location,
      note: params.note ?? undefined,
      active: typeof params.active === 'boolean' ? params.active : undefined,
      archived: typeof params.archived === 'boolean' ? params.archived : undefined
    },
    jwt,
    f
  );
  const updated = res?.data?.updateMissionOffer?.data;
  if (!updated?.id) throw new Error('עדכון הצעת המשימה נכשל');

  // ── Archive side-effect: prune missions_i_can_do when no live offer left ──
  if (params.archived === true && missionId) {
    try {
      const list = await strapi.execute('277myMissionOffersViaUser', { uid }, jwt, f);
      const offers =
        list?.data?.usersPermissionsUser?.data?.attributes?.mission_offers?.data ?? [];
      const stillLive = offers.some(
        (o: any) =>
          String(o.id) !== offerId &&
          !o.attributes?.archived &&
          String(o.attributes?.mission?.data?.id ?? '') === missionId
      );
      if (!stillLive) {
        const curIds = await strapi.execute('262getUserMissionsICanDo', { uid }, jwt, f);
        const ids: string[] = (
          curIds?.data?.usersPermissionsUser?.data?.attributes?.missions_i_can_do?.data ?? []
        ).map((m: any) => String(m.id));
        if (ids.includes(missionId)) {
          await strapi.execute(
            '263setUserMissionsICanDo',
            { uid, missionIds: ids.filter((id) => id !== missionId) },
            jwt,
            f
          );
        }
      }
    } catch (e) {
      console.warn('[updateMissionOffer] missions_i_can_do prune failed (non-fatal):', e);
    }
  }

  return {
    data: { offerId: String(updated.id), archived: updated.attributes?.archived ?? false },
    updateStrategy: { type: 'none' as const }
  };
};

export const updateMissionOfferConfig: ActionConfig = {
  key: 'updateMissionOffer',
  description:
    'Owner-only update of a mission offer (rate/hours/price/location/active) or soft-delete via archived:true (prunes missions_i_can_do when no live offer remains for the template).',
  graphqlOperation: handler,
  paramSchema: {
    offerId: { type: 'string', required: true },
    name: { type: 'string', required: false },
    descrip: { type: 'string', required: false },
    hours: { type: 'number', required: false },
    perhour: { type: 'number', required: false },
    price: { type: 'number', required: false },
    location: { type: 'object', required: false },
    note: { type: 'string', required: false },
    active: { type: 'boolean', required: false },
    archived: { type: 'boolean', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' }
};
