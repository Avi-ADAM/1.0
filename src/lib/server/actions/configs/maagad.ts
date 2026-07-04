/**
 * Maagad (demand pool) actions — PLAN_SHARED_PURCHASE Track B/C,
 * PLAN_DISCOVERY_MAP M2.
 *
 * The no-quarrel architecture (§2 of the plan) is enforced here:
 *   - joining is soft & reversible; signing an offer is the only commitment;
 *   - no group decisions anywhere — every mutation touches only the caller's
 *     own membership (plus denormalized counters on the offer);
 *   - the pool opener gets no special role: `openMaagad` just makes them the
 *     first member.
 *
 * Offer lifecycle (open → quorum_reached → activated / expired) is decided by
 * the pure state machine in `../../maagad/offerStateMachine.ts`; the handlers
 * here only wire those decisions to Strapi.
 *
 * Activation (§7.2) is atomic: confirming quorum flips the offer + signed
 * members to active AND mints a live per-member Sheirutpend on the supplier's
 * rikma (the offer's proposer_project), priced at the tier the reached count
 * unlocked. Deals are created only at activation, so unsigning/expiring before
 * then leaves no orphan pends. Recurring fulfilment (§7.5) is still future.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import {
  canConfirm,
  resolveTierPrice,
  shouldExpire,
  type OfferState,
  type OfferStatus
} from '../../maagad/offerStateMachine.js';
import { clusterWishes, type ClusterWish } from '../../maagad/clustering.js';

const VISIBILITIES = new Set(['anonymous', 'first_name', 'full']);
const RECURRENCES = new Set(['one_time', 'weekly', 'biweekly', 'monthly']);
const SCOPES = new Set(['local', 'regional', 'global']);
/** Members (interested+) needed before a pool is surfaced to suppliers (§5.4, K=3). */
const VISIBLE_THRESHOLD = 3;
const ACTIVE_MEMBER_STATUSES = new Set(['interested', 'signed', 'active']);

function nowIso(): string {
  return new Date().toISOString();
}

async function fetchMaagad(strapi: any, context: any, maagadId: string) {
  const res = await strapi.execute(
    '229queryMaagadFull',
    { id: maagadId },
    context.jwt,
    context.fetch
  );
  const node = res?.data?.maagad?.data;
  if (!node) throw new Error(`Maagad ${maagadId} not found`);
  return node;
}

async function fetchMyMember(strapi: any, context: any, maagadId: string) {
  const res = await strapi.execute(
    '231queryMyMaagadMember',
    { maagadId, userId: context.userId },
    context.jwt,
    context.fetch
  );
  return res?.data?.maagadMembers?.data?.[0] ?? null;
}

function activeMemberCount(maagadNode: any): number {
  return (maagadNode.attributes?.members?.data ?? []).filter((m: any) =>
    ACTIVE_MEMBER_STATUSES.has(m?.attributes?.status_member)
  ).length;
}

/** forming → visible once the pool has enough interest to be worth showing. */
async function maybePromoteToVisible(
  strapi: any,
  context: any,
  maagadId: string,
  maagadNode: any,
  newCount: number
) {
  if (
    maagadNode.attributes?.status_maagad === 'forming' &&
    newCount >= VISIBLE_THRESHOLD
  ) {
    await strapi.execute(
      '230updateMaagad',
      { id: maagadId, status_maagad: 'visible' },
      context.jwt,
      context.fetch
    );
  }
}

// ── openMaagad ──────────────────────────────────────────────────────────────

const openMaagadHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    name,
    canonicalDesc = null,
    scope = 'local',
    lat = null,
    lng = null,
    radius = null,
    frequency = null,
    ratsonId = null,
    visibility = 'anonymous'
  } = params as Record<string, any>;

  if (!name || !String(name).trim()) throw new Error('name is required');
  if (!SCOPES.has(scope)) throw new Error(`invalid scope: ${scope}`);
  if (scope !== 'global' && (lat == null || lng == null)) {
    throw new Error('a local/regional maagad needs lat/lng (PLAN §10: physical demand must be located)');
  }
  const vis = VISIBILITIES.has(visibility) ? visibility : 'anonymous';

  const created = await strapi.execute(
    '224crMaagad',
    {
      name: String(name).trim(),
      canonical_desc: canonicalDesc,
      scope,
      lat,
      lng,
      radius: radius != null ? Math.round(radius) : null,
      frequency,
      status_maagad: 'forming',
      origin: 'user_opened',
      ratsons: ratsonId ? [ratsonId] : null,
      publishedAt: nowIso()
    },
    context.jwt,
    context.fetch
  );
  const maagadId = created?.data?.createMaagad?.data?.id;
  if (!maagadId) throw new Error('failed to create maagad');

  // The opener is just the first member — no role, no authority (§5).
  await strapi.execute(
    '225crMaagadMember',
    {
      maagad: maagadId,
      user: context.userId,
      ratson: ratsonId,
      status_member: 'interested',
      visibility: vis,
      joinedAt: nowIso(),
      publishedAt: nowIso()
    },
    context.jwt,
    context.fetch
  );

  return {
    data: { maagadId },
    notifyUserIds: [context.userId],
    updateStrategy: { type: 'none' as const, config: {} }
  };
};

// ── joinMaagad ──────────────────────────────────────────────────────────────

const joinMaagadHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { maagadId, ratsonId = null, visibility = 'anonymous' } = params as Record<string, any>;
  if (!maagadId) throw new Error('maagadId is required');
  const vis = VISIBILITIES.has(visibility) ? visibility : 'anonymous';

  const maagadNode = await fetchMaagad(strapi, context, maagadId);
  const status = maagadNode.attributes?.status_maagad;
  if (status === 'closed' || status === 'dormant') {
    throw new Error('this maagad is not accepting joins');
  }

  const existing = await fetchMyMember(strapi, context, maagadId);
  let memberId: string;
  if (existing) {
    const st = existing.attributes?.status_member;
    if (ACTIVE_MEMBER_STATUSES.has(st)) {
      // Already in — idempotent no-op (soft joins never error, §2.1).
      return { data: { maagadId, memberId: existing.id, already: true } };
    }
    await strapi.execute(
      '226updateMaagadMember',
      { id: existing.id, status_member: 'interested', visibility: vis },
      context.jwt,
      context.fetch
    );
    memberId = existing.id;
  } else {
    const created = await strapi.execute(
      '225crMaagadMember',
      {
        maagad: maagadId,
        user: context.userId,
        ratson: ratsonId,
        status_member: 'interested',
        visibility: vis,
        joinedAt: nowIso(),
        publishedAt: nowIso()
      },
      context.jwt,
      context.fetch
    );
    memberId = created?.data?.createMaagadMember?.data?.id;
  }

  await maybePromoteToVisible(
    strapi,
    context,
    maagadId,
    maagadNode,
    activeMemberCount(maagadNode) + (existing ? 1 : 1)
  );

  return { data: { maagadId, memberId } };
};

// ── leaveMaagad ─────────────────────────────────────────────────────────────

const leaveMaagadHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { maagadId } = params as Record<string, any>;
  if (!maagadId) throw new Error('maagadId is required');

  const existing = await fetchMyMember(strapi, context, maagadId);
  if (!existing) return { data: { maagadId, left: false } };
  const st = existing.attributes?.status_member;
  if (st === 'signed' || st === 'active') {
    // A signature is a commitment (§2.7) — it must be withdrawn explicitly.
    throw new Error('you signed an offer here — cancel the signature first (unsignMaagadOffer)');
  }
  if (st === 'left') return { data: { maagadId, left: true } };

  await strapi.execute(
    '226updateMaagadMember',
    { id: existing.id, status_member: 'left', leftAt: nowIso() },
    context.jwt,
    context.fetch
  );
  // Leaving is free and silent (§2.1) — no notifications to anyone.
  return { data: { maagadId, left: true } };
};

// ── createMaagadOffer (supplier; §6.3 + Track C §8) ─────────────────────────

const createMaagadOfferHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    maagadId = null,
    title,
    description = null,
    unitPrice,
    currencyId = null,
    priceTiers = null,
    minParticipants,
    maxParticipants = null,
    signDeadline,
    options = null,
    recurrence = 'one_time',
    cycleTerms = null,
    cancellationTerms = null,
    proposerProjectId = null,
    // Track C: when there is no existing pool, the offer creates its wrapper.
    newMaagad = null
  } = params as Record<string, any>;

  if (!title || !String(title).trim()) throw new Error('title is required');
  const min = Number(minParticipants);
  if (!Number.isInteger(min) || min < 2) throw new Error('min_participants must be an integer ≥ 2');
  const max = maxParticipants != null ? Number(maxParticipants) : null;
  if (max != null && max < min) throw new Error('max_participants must be ≥ min_participants');
  const price = Number(unitPrice);
  if (!Number.isFinite(price) || price < 0) throw new Error('unitPrice must be a non-negative number');
  if (!signDeadline || new Date(signDeadline).getTime() <= Date.now()) {
    throw new Error('sign_deadline must be in the future');
  }
  if (!RECURRENCES.has(recurrence)) throw new Error(`invalid recurrence: ${recurrence}`);

  let targetMaagadId = maagadId;
  let maagadNode: any = null;

  if (targetMaagadId) {
    maagadNode = await fetchMaagad(strapi, context, targetMaagadId);
    const st = maagadNode.attributes?.status_maagad;
    if (st === 'closed') throw new Error('this maagad is closed');
  } else {
    // §8: supplier-initiated threshold offer — same mechanism, extra entry point.
    if (!newMaagad?.name) throw new Error('either maagadId or newMaagad{name,...} is required');
    const scope = SCOPES.has(newMaagad.scope) ? newMaagad.scope : 'local';
    if (scope !== 'global' && (newMaagad.lat == null || newMaagad.lng == null)) {
      throw new Error('a local/regional supplier offer needs lat/lng');
    }
    const created = await strapi.execute(
      '224crMaagad',
      {
        name: String(newMaagad.name).trim(),
        canonical_desc: newMaagad.canonicalDesc ?? null,
        scope,
        lat: newMaagad.lat ?? null,
        lng: newMaagad.lng ?? null,
        radius: newMaagad.radius != null ? Math.round(newMaagad.radius) : null,
        frequency: newMaagad.frequency ?? null,
        status_maagad: 'visible',
        origin: 'supplier_offer',
        publishedAt: nowIso()
      },
      context.jwt,
      context.fetch
    );
    targetMaagadId = created?.data?.createMaagad?.data?.id;
    if (!targetMaagadId) throw new Error('failed to create wrapper maagad');
  }

  const offerRes = await strapi.execute(
    '227crMaagadOffer',
    {
      maagad: targetMaagadId,
      proposer_user: context.userId,
      proposer_project: proposerProjectId,
      title: String(title).trim(),
      description,
      unit_price: price,
      currency: currencyId,
      price_tiers: priceTiers,
      min_participants: min,
      max_participants: max,
      sign_deadline: signDeadline,
      options,
      recurrence,
      cycle_terms: cycleTerms,
      cancellation_terms: cancellationTerms,
      publishedAt: nowIso()
    },
    context.jwt,
    context.fetch
  );
  const offerId = offerRes?.data?.createMaagadOffer?.data?.id;
  if (!offerId) throw new Error('failed to create offer');

  // Pool now carries a live offer.
  if (maagadNode && ['forming', 'visible', 'dormant'].includes(maagadNode.attributes?.status_maagad)) {
    await strapi.execute(
      '230updateMaagad',
      { id: targetMaagadId, status_maagad: 'offered' },
      context.jwt,
      context.fetch
    );
  }

  // Every member with a live interest hears about the new offer (§6.3).
  const notifyUserIds = maagadNode
    ? (maagadNode.attributes?.members?.data ?? [])
        .filter((m: any) =>
          ['suggested', 'interested'].includes(m?.attributes?.status_member)
        )
        .map((m: any) => m?.attributes?.user?.data?.id)
        .filter(Boolean)
    : [];

  return {
    data: { maagadId: targetMaagadId, offerId },
    notifyUserIds
  };
};

// ── signMaagadOffer (§7.1) ──────────────────────────────────────────────────

const signMaagadOfferHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { maagadId, offerId, options = null, visibility = 'anonymous' } = params as Record<string, any>;
  if (!maagadId) throw new Error('maagadId is required');
  if (!offerId) throw new Error('offerId is required');

  const maagadNode = await fetchMaagad(strapi, context, maagadId);
  const offer = (maagadNode.attributes?.offers?.data ?? []).find(
    (o: any) => String(o.id) === String(offerId)
  );
  if (!offer) throw new Error(`Offer ${offerId} not found on maagad ${maagadId}`);
  const oa = offer.attributes ?? {};
  if (oa.status_offer !== 'open' && oa.status_offer !== 'quorum_reached') {
    throw new Error(`offer is ${oa.status_offer} — signing is closed`);
  }
  if (oa.sign_deadline && new Date(oa.sign_deadline).getTime() <= Date.now()) {
    throw new Error('sign_deadline has passed');
  }
  const currentCount = Number(oa.signed_count) || 0;
  if (oa.max_participants != null && currentCount >= oa.max_participants) {
    throw new Error('offer is full');
  }

  // Signing implies membership (§7.1) — create it on the fly if needed.
  let member = await fetchMyMember(strapi, context, maagadId);
  if (member?.attributes?.signed_offer?.data?.id) {
    const signedOn = String(member.attributes.signed_offer.data.id);
    if (signedOn === String(offerId)) {
      return { data: { maagadId, offerId, already: true } };
    }
    // Double-signing two different offers is allowed but explicit (§7.2.4) —
    // the UI warns; here we only block silent replacement.
    throw new Error(
      `you already signed offer ${signedOn} — unsign it first, or sign both deliberately from separate memberships (not supported yet)`
    );
  }
  if (!member) {
    const created = await strapi.execute(
      '225crMaagadMember',
      {
        maagad: maagadId,
        user: context.userId,
        status_member: 'interested',
        visibility: VISIBILITIES.has(visibility) ? visibility : 'anonymous',
        joinedAt: nowIso(),
        publishedAt: nowIso()
      },
      context.jwt,
      context.fetch
    );
    member = { id: created?.data?.createMaagadMember?.data?.id, attributes: {} };
  }

  await strapi.execute(
    '226updateMaagadMember',
    {
      id: member.id,
      status_member: 'signed',
      signed_offer: offerId,
      options,
      signedAt: nowIso()
    },
    context.jwt,
    context.fetch
  );

  const newCount = currentCount + 1;
  const quorum = newCount >= Number(oa.min_participants || Infinity);
  await strapi.execute(
    '228updateMaagadOffer',
    {
      id: offerId,
      signed_count: newCount,
      status_offer: quorum ? 'quorum_reached' : 'open'
    },
    context.jwt,
    context.fetch
  );

  // Quorum! The proposer confirms the final number (§7.2) — notify them.
  const notifyUserIds =
    quorum && oa.proposer_user?.data?.id ? [oa.proposer_user.data.id] : [];

  // NOTE (P3): the conditional Sheirutpend (`conditional=true`, guard on
  // createSheirutFromPending) is created here once the deal-flow milestone
  // lands; the membership record already carries everything needed.

  return {
    data: { maagadId, offerId, signedCount: newCount, quorumReached: quorum },
    notifyUserIds
  };
};

// ── unsignMaagadOffer (§7.3 — cancel before activation) ─────────────────────

const unsignMaagadOfferHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { maagadId, offerId } = params as Record<string, any>;
  if (!maagadId) throw new Error('maagadId is required');
  if (!offerId) throw new Error('offerId is required');

  const maagadNode = await fetchMaagad(strapi, context, maagadId);
  const offer = (maagadNode.attributes?.offers?.data ?? []).find(
    (o: any) => String(o.id) === String(offerId)
  );
  if (!offer) throw new Error(`Offer ${offerId} not found on maagad ${maagadId}`);
  const oa = offer.attributes ?? {};
  if (oa.status_offer === 'activated') {
    throw new Error('offer already activated — exit is governed by its cancellation terms');
  }

  const member = await fetchMyMember(strapi, context, maagadId);
  const signedOn = member?.attributes?.signed_offer?.data?.id;
  if (!member || String(signedOn) !== String(offerId)) {
    return { data: { maagadId, offerId, unsigned: false } };
  }

  await strapi.execute(
    '226updateMaagadMember',
    { id: member.id, status_member: 'interested', signed_offer: null, signedAt: null },
    context.jwt,
    context.fetch
  );

  const newCount = Math.max(0, (Number(oa.signed_count) || 1) - 1);
  const droppedBelowMin =
    oa.status_offer === 'quorum_reached' && newCount < Number(oa.min_participants || 0);
  await strapi.execute(
    '228updateMaagadOffer',
    {
      id: offerId,
      signed_count: newCount,
      status_offer: droppedBelowMin ? 'open' : oa.status_offer
    },
    context.jwt,
    context.fetch
  );

  return { data: { maagadId, offerId, unsigned: true, signedCount: newCount } };
};

// ── confirmMaagadQuorum + activateMaagadOffer (§7.2) ────────────────────────
// The supplier confirms the final number, then the offer + its signed members
// flip to active. (The conditional Sheirutpend + deal pipeline per member are a
// later milestone — see the file header.)

function offerStateFrom(oa: any): OfferState {
  return {
    status: (oa.status_offer as OfferStatus) ?? 'open',
    signedCount: Number(oa.signed_count) || 0,
    minParticipants: Number(oa.min_participants) || 0,
    maxParticipants: oa.max_participants != null ? Number(oa.max_participants) : null,
    signDeadline: oa.sign_deadline ?? null
  };
}

async function activateOffer(
  strapi: any,
  context: any,
  maagadId: string,
  offerId: string,
  maagadNode: any
) {
  const offer = (maagadNode.attributes?.offers?.data ?? []).find(
    (o: any) => String(o.id) === String(offerId)
  );
  const oa = offer?.attributes ?? {};
  const proposerProjectId = oa.proposer_project?.data?.id
    ? String(oa.proposer_project.data.id)
    : null;

  // Members who signed *this* offer.
  const signedMembers = (maagadNode.attributes?.members?.data ?? []).filter(
    (m: any) => String(m?.attributes?.signed_offer?.data?.id) === String(offerId)
  );

  // Final price: the tier the reached count unlocked, for everyone (§4.3).
  const finalPrice = resolveTierPrice(
    Number(oa.unit_price) || 0,
    Array.isArray(oa.price_tiers) ? oa.price_tiers : null,
    signedMembers.length
  );

  await strapi.execute(
    '228updateMaagadOffer',
    { id: offerId, status_offer: 'activated' },
    context.jwt,
    context.fetch
  );
  await strapi.execute(
    '230updateMaagad',
    { id: maagadId, status_maagad: 'active' },
    context.jwt,
    context.fetch
  );

  const activatedUserIds: string[] = [];
  let dealsCreated = 0;
  const nowStr = nowIso();
  for (const m of signedMembers) {
    const uid = m?.attributes?.user?.data?.id;

    // Atomic activation (§7.2): a live per-member deal on the supplier's rikma.
    // Requires the offer to carry a proposer_project; a solo supplier without a
    // rikma still activates (members go active) but no Sheirutpend is minted —
    // surfaced via dealsCreated so the caller can flag it.
    let sheirutpendId: string | null = null;
    if (proposerProjectId && uid) {
      try {
        const pendRes = await strapi.execute(
          '235crMaagadSheirutpend',
          {
            project: proposerProjectId,
            userId: String(uid),
            maagadOffer: offerId,
            price: finalPrice,
            quant: 1,
            total: finalPrice,
            publishedAt: nowStr
          },
          context.jwt,
          context.fetch
        );
        sheirutpendId = pendRes?.data?.createSheirutpend?.data?.id ?? null;
        if (sheirutpendId) dealsCreated++;
      } catch (e) {
        console.error('[activateOffer] failed to create Sheirutpend for member', m.id, e);
      }
    }

    await strapi.execute(
      '226updateMaagadMember',
      {
        id: m.id,
        status_member: 'active',
        ...(sheirutpendId ? { sheirutpend: sheirutpendId } : {})
      },
      context.jwt,
      context.fetch
    );
    if (uid) activatedUserIds.push(String(uid));
  }
  return { activatedUserIds, dealsCreated, finalPrice };
}

const confirmMaagadQuorumHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { maagadId, offerId } = params as Record<string, any>;
  if (!maagadId) throw new Error('maagadId is required');
  if (!offerId) throw new Error('offerId is required');

  const maagadNode = await fetchMaagad(strapi, context, maagadId);
  const offer = (maagadNode.attributes?.offers?.data ?? []).find(
    (o: any) => String(o.id) === String(offerId)
  );
  if (!offer) throw new Error(`Offer ${offerId} not found on maagad ${maagadId}`);
  const oa = offer.attributes ?? {};

  // Only the offering supplier may confirm (§7.2).
  const proposerId = oa.proposer_user?.data?.id;
  if (proposerId && String(proposerId) !== String(context.userId)) {
    throw new Error('only the offering supplier may confirm the quorum');
  }

  const check = canConfirm(offerStateFrom(oa));
  if (!check.ok) throw new Error(check.reason);

  const { activatedUserIds, dealsCreated, finalPrice } = await activateOffer(
    strapi,
    context,
    maagadId,
    offerId,
    maagadNode
  );

  return {
    data: {
      maagadId,
      offerId,
      activated: true,
      activatedCount: activatedUserIds.length,
      dealsCreated,
      finalPrice
    },
    notifyUserIds: activatedUserIds
  };
};

// ── expireMaagadOffers (§7.3 — cron / batch) ────────────────────────────────
// Pass-through-able as an /api/action call from a scheduled endpoint. Sweeps
// open/quorum_reached offers past their deadline → expired; members who signed
// only that offer fall back to interested. Silent expiry (§2.8) — one soft
// notice to the signers, nothing public.

const expireMaagadOffersHandler: ActionExecutionHandler = async (_params, context, { strapi }) => {
  const now = new Date().toISOString();
  const res = await strapi.execute(
    '232listExpiredOpenOffers',
    { now },
    context.jwt,
    context.fetch
  );
  const offers = res?.data?.maagadOffers?.data ?? [];
  const expired: string[] = [];
  const nowMs = Date.now();

  for (const offer of offers) {
    const oa = offer.attributes ?? {};
    if (!shouldExpire(offerStateFrom(oa), nowMs)) continue;

    await strapi.execute(
      '228updateMaagadOffer',
      { id: offer.id, status_offer: 'expired' },
      context.jwt,
      context.fetch
    );
    // Signers of this offer revert to interested (their conditional deal, once
    // it exists, is archived by the same milestone that creates it).
    for (const sm of oa.signed_members?.data ?? []) {
      await strapi.execute(
        '226updateMaagadMember',
        { id: sm.id, status_member: 'interested', signed_offer: null, signedAt: null },
        context.jwt,
        context.fetch
      );
    }
    expired.push(String(offer.id));
  }

  return { data: { expiredCount: expired.length, expiredOfferIds: expired } };
};

// ── clusterRatsons (§5 — auto-aggregation job) ──────────────────────────────
// Queries open, un-pooled wishes, runs the pure clustering (geo/frequency/
// category gates + similarity), and materialises a maagad per cluster with its
// members in `suggested` status (an invitation, never an auto-join — §5.5).
// Batch/cron entry point; safe to re-run (pooled wishes are filtered out by the
// `maagad: null` query).

const clusterRatsonsHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const simThreshold = params?.simThreshold;
  const minClusterSize = params?.minClusterSize;

  const res = await strapi.execute(
    '233listOpenRatsonsForClustering',
    {},
    context.jwt,
    context.fetch
  );
  const rows = res?.data?.ratsons?.data ?? [];

  // Keep the owner ids alongside the pure ClusterWish so we can invite them.
  const ownersById = new Map<string, string[]>();
  const wishes: ClusterWish[] = rows.map((r: any) => {
    const a = r.attributes ?? {};
    ownersById.set(
      String(r.id),
      (a.users_permissions_users?.data ?? []).map((u: any) => String(u.id))
    );
    return {
      id: String(r.id),
      name: a.name ?? '',
      isOnline: !!a.isOnline,
      lat: a.lat ?? null,
      lng: a.lng ?? null,
      radius: a.radius != null ? Number(a.radius) : null,
      frequency: a.frequency ?? null,
      language: a.language ?? null,
      categoryIds: (a.categories?.data ?? []).map((c: any) => String(c.id))
    };
  });

  const clusters = clusterWishes(wishes, {
    ...(typeof simThreshold === 'number' ? { simThreshold } : {}),
    ...(typeof minClusterSize === 'number' ? { minClusterSize } : {})
  });

  const created: Array<{ maagadId: string; size: number }> = [];

  for (const cluster of clusters) {
    const seed = cluster.members[0];
    const createdMaagad = await strapi.execute(
      '224crMaagad',
      {
        name: seed.name || 'ביקוש קבוצתי',
        // The plan calls for an LLM-written unified description; the seed name
        // is the initial stand-in until that is wired.
        canonical_desc: seed.name || null,
        scope: cluster.online ? 'global' : 'local',
        lat: cluster.lat,
        lng: cluster.lng,
        radius: cluster.radiusKm != null ? Math.round(cluster.radiusKm) : null,
        frequency: cluster.frequency,
        status_maagad: 'forming',
        origin: 'system_cluster',
        // Simple heuristic until real viability estimation lands.
        viability_hint: Math.max(cluster.members.length * 2, 5),
        ratsons: cluster.members.map((m) => m.id),
        publishedAt: nowIso()
      },
      context.jwt,
      context.fetch
    );
    const maagadId = createdMaagad?.data?.createMaagad?.data?.id;
    if (!maagadId) continue;

    // Invite every wish owner as `suggested` — no auto-join (§5.5, §2.1).
    const invitedUserIds = new Set<string>();
    for (const m of cluster.members) {
      for (const uid of ownersById.get(m.id) ?? []) {
        if (invitedUserIds.has(uid)) continue;
        invitedUserIds.add(uid);
        await strapi.execute(
          '225crMaagadMember',
          {
            maagad: maagadId,
            user: uid,
            ratson: m.id,
            status_member: 'suggested',
            visibility: 'anonymous',
            joinedAt: nowIso(),
            publishedAt: nowIso()
          },
          context.jwt,
          context.fetch
        );
      }
    }
    created.push({ maagadId, size: cluster.members.length });
  }

  return {
    data: {
      scanned: wishes.length,
      clustersCreated: created.length,
      pools: created
    }
  };
};

// ── Configs ─────────────────────────────────────────────────────────────────

const jwtRule = { type: 'jwt' as const, errorMessage: 'you must be logged in' };

export const maagadActions: ActionConfig[] = [
  {
    key: 'openMaagad',
    description: 'Open a demand pool manually and become its first (role-less) member',
    graphqlOperation: openMaagadHandler,
    paramSchema: {
      name: { type: 'string', required: true, description: 'Canonical demand description' },
      canonicalDesc: { type: 'string', required: false, description: 'Longer unified description' },
      scope: { type: 'string', required: false, description: 'local | regional | global' },
      lat: { type: 'number', required: false, description: 'Centroid latitude' },
      lng: { type: 'number', required: false, description: 'Centroid longitude' },
      radius: { type: 'number', required: false, description: 'Coverage radius (km)' },
      frequency: { type: 'string', required: false, description: 'one_time | weekly | monthly...' },
      ratsonId: { type: 'string', required: false, description: 'The wish this pool grew from' },
      visibility: { type: 'string', required: false, description: 'anonymous | first_name | full' }
    },
    authRules: [jwtRule]
  },
  {
    key: 'joinMaagad',
    description: 'Soft, reversible join to a demand pool (interested — not a commitment)',
    graphqlOperation: joinMaagadHandler,
    paramSchema: {
      maagadId: { type: 'string', required: true, description: 'Pool to join' },
      ratsonId: { type: 'string', required: false, description: 'Own wish to link' },
      visibility: { type: 'string', required: false, description: 'anonymous | first_name | full' }
    },
    authRules: [jwtRule]
  },
  {
    key: 'leaveMaagad',
    description: 'Silent, free leave from a demand pool (blocked while signed)',
    graphqlOperation: leaveMaagadHandler,
    paramSchema: {
      maagadId: { type: 'string', required: true, description: 'Pool to leave' }
    },
    authRules: [jwtRule]
  },
  {
    key: 'createMaagadOffer',
    description: 'Supplier threshold offer on a pool (or a new supplier-initiated pool, Track C)',
    graphqlOperation: createMaagadOfferHandler,
    paramSchema: {
      maagadId: { type: 'string', required: false, description: 'Existing pool (omit with newMaagad for Track C)' },
      newMaagad: { type: 'object', required: false, description: 'Wrapper pool for a supplier-initiated offer: {name, scope, lat, lng, radius, frequency}' },
      title: { type: 'string', required: true, description: 'What exactly is offered' },
      description: { type: 'string', required: false, description: 'Details of the offer' },
      unitPrice: { type: 'number', required: true, description: 'Price per consumer (basket/seat/subscription)' },
      currencyId: { type: 'string', required: false, description: 'Matbea id' },
      priceTiers: { type: 'array', required: false, description: '[{min, price}] — the reached tier is billed to everyone' },
      minParticipants: { type: 'number', required: true, description: 'Quorum (≥2) — below it no deal happens' },
      maxParticipants: { type: 'number', required: false, description: 'Capacity' },
      signDeadline: { type: 'string', required: true, description: 'ISO datetime — signatures collected until then' },
      options: { type: 'array', required: false, description: 'Personal options [{key, choices, priceDelta}]' },
      recurrence: { type: 'string', required: false, description: 'one_time | weekly | biweekly | monthly' },
      cycleTerms: { type: 'object', required: false, description: 'Recurring terms (exit notice etc.)' },
      cancellationTerms: { type: 'string', required: false, description: 'Cancellation terms — part of the signed contract' },
      proposerProjectId: { type: 'string', required: false, description: 'Offering rikma (project) id' }
    },
    authRules: [jwtRule],
    notification: {
      recipients: { type: 'specificUsers', config: { userIdsParam: 'notifyUserIds', excludeSender: true } },
      templates: {
        title: { he: 'הצעה חדשה במאגד שלך', en: 'New offer on your demand pool', ar: 'عرض جديد في تجمع الطلب الخاص بك' },
        body: { he: 'ספק הגיש הצעה לביקוש שהצטרפת אליו — כל חתימה היא אישית', en: 'A supplier made an offer on a demand you joined — every signature is personal', ar: 'قدّم مزوّد عرضًا على طلب انضممت إليه — كل توقيع شخصي' }
      },
      channels: ['socket', 'push'],
      metadata: { type: 'maagad', url: 'maagad' }
    }
  },
  {
    key: 'signMaagadOffer',
    description: 'Personally sign a threshold offer (the only commitment in Track B/C)',
    graphqlOperation: signMaagadOfferHandler,
    paramSchema: {
      maagadId: { type: 'string', required: true, description: 'The pool' },
      offerId: { type: 'string', required: true, description: 'The offer being signed' },
      options: { type: 'object', required: false, description: 'Personal choices out of offer.options' },
      visibility: { type: 'string', required: false, description: 'anonymous | first_name | full' }
    },
    authRules: [jwtRule],
    notification: {
      recipients: { type: 'specificUsers', config: { userIdsParam: 'notifyUserIds', excludeSender: true } },
      templates: {
        title: { he: 'ההצעה שלך הגיעה לסף!', en: 'Your offer reached its quorum!', ar: 'وصل عرضك إلى الحد الأدنى!' },
        body: { he: 'מספיק חתומים — אשר סופית כדי להפעיל את העסקאות', en: 'Enough signatures — confirm to activate the deals', ar: 'توقيعات كافية — أكّد لتفعيل الصفقات' }
      },
      channels: ['socket', 'push'],
      metadata: { type: 'maagad', url: 'maagad' }
    }
  },
  {
    key: 'unsignMaagadOffer',
    description: 'Withdraw a signature before activation (quietly reverts to interested)',
    graphqlOperation: unsignMaagadOfferHandler,
    paramSchema: {
      maagadId: { type: 'string', required: true, description: 'The pool' },
      offerId: { type: 'string', required: true, description: 'The offer to unsign' }
    },
    authRules: [jwtRule]
  },
  {
    key: 'confirmMaagadQuorum',
    description: 'Supplier confirms the quorum and activates the offer (members → active)',
    graphqlOperation: confirmMaagadQuorumHandler,
    paramSchema: {
      maagadId: { type: 'string', required: true, description: 'The pool' },
      offerId: { type: 'string', required: true, description: 'The offer to activate' }
    },
    authRules: [jwtRule],
    notification: {
      recipients: { type: 'specificUsers', config: { userIdsParam: 'notifyUserIds', excludeSender: true } },
      templates: {
        title: { he: 'יצאנו לדרך!', en: "We're a go!", ar: 'انطلقنا!' },
        body: { he: 'ההצעה שחתמת עליה הופעלה — העסקה שלך יוצאת לפועל', en: 'The offer you signed is activated — your deal is going ahead', ar: 'العرض الذي وقّعت عليه مُفعّل — صفقتك تمضي قُدُمًا' }
      },
      channels: ['socket', 'push'],
      metadata: { type: 'maagad', url: 'maagad' }
    }
  },
  {
    key: 'expireMaagadOffers',
    description: 'Batch: expire offers past their deadline; signers revert to interested (cron)',
    graphqlOperation: expireMaagadOffersHandler,
    paramSchema: {},
    authRules: [jwtRule]
  },
  {
    key: 'clusterRatsons',
    description: 'Auto-aggregation job: cluster open wishes into demand pools with suggested members',
    graphqlOperation: clusterRatsonsHandler,
    paramSchema: {
      simThreshold: { type: 'number', required: false, description: 'Override similarity threshold (0-1)' },
      minClusterSize: { type: 'number', required: false, description: 'Override minimum cluster size (default 3)' }
    },
    authRules: [jwtRule]
  }
];
