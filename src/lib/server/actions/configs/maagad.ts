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
 *
 * Every maagad write (pool, member, offer, the activation pend) goes out under
 * the service token: those qids are serviceAdmin-only in qidsAccess.js, so the
 * checks in these handlers are the only way to change a status or a count.
 * Reads still use the caller's jwt.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import {
  canConfirm,
  resolveTierPrice,
  shouldExpire,
  type OfferState,
  type OfferStatus
} from '../../maagad/offerStateMachine.js';
import { ensurePersonalRikmaFor } from './ensurePersonalRikma.js';
import { clusterWishes, type ClusterWish } from '../../maagad/clustering.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import {
  departureTerms,
  isPoolableProduct,
  linesFromMatanot,
  tierPriceAt,
  type DepartureTerms
} from '$lib/pooling/departure';
import { loadDeparture, lockMs, settleDeparture } from '$lib/server/pooling/settleDeparture';

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

/**
 * Everyone whose pool screen shows this change: the members still in it, and the
 * suppliers whose offers sit on it. Realtime only — a refresh signal, never a notice,
 * so it says nothing about who did what (§2.1).
 */
function poolPartyIds(maagadNode: any): string[] {
  const ids = new Set<string>();
  for (const m of maagadNode?.attributes?.members?.data ?? []) {
    if (m?.attributes?.status_member === 'left') continue;
    const uid = m?.attributes?.user?.data?.id;
    if (uid != null) ids.add(String(uid));
  }
  for (const o of maagadNode?.attributes?.offers?.data ?? []) {
    const uid = o?.attributes?.proposer_user?.data?.id;
    if (uid != null) ids.add(String(uid));
  }
  return [...ids];
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
      undefined,
      context.fetch
    );
  }
}

// ── departures: an offer made out of a rikma's product (PLAN_POOL_PRODUCT §4) ──

/**
 * Load the product, check the caller may offer it, and derive the departure's
 * terms from its BOM. The price is never the client's: `unitPrice` and
 * `priceTiers` sent with a product are ignored (§2).
 */
async function departureFromProduct(
  strapi: any,
  context: any,
  matanotId: string,
  proposerProjectId: string | null,
  min: number,
  max: number | null
): Promise<{ projectId: string; terms: DepartureTerms; productName: string }> {
  // Service token: 443 is serviceAdmin-only; the membership check is below.
  const res = await strapi.execute('443matanotForPoolOffer', { id: matanotId }, undefined, context.fetch);
  const node = res?.data?.matanot?.data;
  if (!node) throw new Error(`product ${matanotId} not found`);
  const a = node.attributes ?? {};
  if (a.pricingMode !== 'estimated') {
    throw new Error('only a composed product (with missions and resources) can open a departure');
  }
  if (!isPoolableProduct(a)) throw new Error('this product is not open for sale yet');
  const mine = (a.projectcreates?.data ?? []).filter((p: any) =>
    (p?.attributes?.user_1s?.data ?? []).some((u: any) => String(u?.id) === String(context.userId))
  );
  const rikma = proposerProjectId
    ? mine.find((p: any) => String(p.id) === String(proposerProjectId))
    : mine[0];
  if (!rikma) throw new Error('only a member of the rikma that makes this product can offer it');

  const terms = departureTerms(linesFromMatanot(a), Number(a.marginPct) || 0, min, max);
  return { projectId: String(rikma.id), terms, productName: String(a.name ?? '') };
}

async function assertProjectMember(strapi: any, context: any, projectId: string) {
  const res = await strapi.execute(
    '65checkProjectMembership',
    { uid: String(context.userId), projectId },
    context.jwt,
    context.fetch
  );
  const projects = res?.data?.usersPermissionsUser?.data?.attributes?.projects_1s?.data ?? [];
  if (projects.length === 0) throw new Error('only a member of the rikma can make an offer in its name');
}

/** The price everyone pays at the offer's current size, or null for a plain offer. */
function departurePriceNow(oa: any, signedCount: number): number | null {
  if (!oa?.matanot?.data?.id) return null;
  const min = Number(oa.min_participants) || 1;
  return tierPriceAt(Array.isArray(oa.price_tiers) ? oa.price_tiers : null, Math.max(signedCount, min));
}

/**
 * An activated departure stays open to joining and leaving until its lock: until
 * then nothing is closed, and the deals follow the size (PLAN_POOL_PRODUCT §4.1).
 */
function openUntilLock(oa: any, nowMs = Date.now()): boolean {
  if (!oa?.matanot?.data?.id || oa.status_offer !== 'activated') return false;
  const lock = lockMs(oa);
  return lock == null || lock > nowMs;
}

/**
 * After a join or an exit: re-price the departure from what is stored now, let
 * lapsed consents go, and tell what moved (§4.2). The signature already stands,
 * so a failure here only delays the price — the hourly cron settles it.
 * Returns the parties whose screens the move touched.
 */
async function resettleDeparture(util: any, context: any, offerId: string, oa: any): Promise<string[]> {
  if (!oa?.matanot?.data?.id) return [];
  try {
    const fresh = await loadDeparture(util.strapi, context, offerId);
    const settled = fresh ? await settleDeparture(fresh, context, util) : null;
    return settled?.partyIds ?? [];
  } catch (e) {
    console.error('[maagad] departure settlement failed (the cron will retry)', offerId, e);
    return [];
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
    categoryIds = null,
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
      // The clustering gate needs a shared category to fold later wishes in.
      categories: Array.isArray(categoryIds) && categoryIds.length ? categoryIds.map(String) : null,
      publishedAt: nowIso()
    },
    undefined,
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
    undefined,
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
      undefined,
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
      undefined,
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

  return { data: { maagadId, memberId, partyIds: poolPartyIds(maagadNode) } };
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
    throw new Error('you signed an offer here - cancel the signature first (unsignMaagadOffer)');
  }
  if (st === 'left') return { data: { maagadId, left: true } };

  await strapi.execute(
    '226updateMaagadMember',
    { id: existing.id, status_member: 'left', leftAt: nowIso() },
    undefined,
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
    // A departure of a rikma's product (PLAN_POOL_PRODUCT §4): the price is
    // derived from its BOM, and unitPrice / priceTiers are ignored.
    matanotId = null,
    // Track C: when there is no existing pool, the offer creates its wrapper.
    newMaagad = null
  } = params as Record<string, any>;

  const min = Number(minParticipants);
  if (!Number.isInteger(min) || min < 2) throw new Error('min_participants must be an integer ≥ 2');
  const max = maxParticipants != null ? Number(maxParticipants) : null;
  if (max != null && max < min) throw new Error('max_participants must be ≥ min_participants');
  if (!signDeadline || new Date(signDeadline).getTime() <= Date.now()) {
    throw new Error('sign_deadline must be in the future');
  }
  if (!RECURRENCES.has(recurrence)) throw new Error(`invalid recurrence: ${recurrence}`);

  // Checked before anything is written, so a refused product leaves no pool behind.
  const departure = matanotId
    ? await departureFromProduct(strapi, context, String(matanotId), proposerProjectId, min, max)
    : null;
  // A plain offer in a rikma's name: the deals land in that rikma at activation,
  // so only one of its members may make it (a departure was checked above).
  if (!departure && proposerProjectId) {
    await assertProjectMember(strapi, context, String(proposerProjectId));
  }
  const offerTitle = String(title ?? '').trim() || departure?.productName || '';
  if (!offerTitle) throw new Error('title is required');
  const price = departure ? departure.terms.priceCurrent : Number(unitPrice);
  if (!Number.isFinite(price) || price < 0) throw new Error('unitPrice must be a non-negative number');

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
      undefined,
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
      proposer_project: departure ? departure.projectId : proposerProjectId,
      title: offerTitle,
      description,
      unit_price: price,
      currency: currencyId,
      price_tiers: departure ? null : priceTiers,
      min_participants: min,
      max_participants: max,
      sign_deadline: signDeadline,
      options,
      recurrence,
      cycle_terms: cycleTerms,
      cancellation_terms: cancellationTerms,
      publishedAt: nowIso()
    },
    undefined,
    context.fetch
  );
  const offerId = offerRes?.data?.createMaagadOffer?.data?.id;
  if (!offerId) throw new Error('failed to create offer');

  // The departure's derived terms, through the service-only qid (§4). The full
  // curve rides in price_tiers so resolveTierPrice reads priceAt(n) exactly.
  if (departure) {
    await strapi.execute(
      '445setMaagadOfferPricing',
      {
        id: offerId,
        matanot: String(matanotId),
        unit_price: departure.terms.priceCurrent,
        price_tiers: departure.terms.tiers,
        price_current: departure.terms.priceCurrent,
        price_envelope: departure.terms.envelope,
        price_lock_at: signDeadline
      },
      undefined,
      context.fetch
    );
  }

  // Pool now carries a live offer.
  if (maagadNode && ['forming', 'visible', 'dormant'].includes(maagadNode.attributes?.status_maagad)) {
    await strapi.execute(
      '230updateMaagad',
      { id: targetMaagadId, status_maagad: 'offered' },
      undefined,
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
    data: {
      maagadId: targetMaagadId,
      offerId,
      partyIds: poolPartyIds(maagadNode),
      ...(departure
        ? { priceCurrent: departure.terms.priceCurrent, priceEnvelope: departure.terms.envelope }
        : {})
    },
    notifyUserIds
  };
};

// ── signMaagadOffer (§7.1) ──────────────────────────────────────────────────

const signMaagadOfferHandler: ActionExecutionHandler = async (params, context, util) => {
  const { strapi } = util;
  const { maagadId, offerId, options = null, visibility = 'anonymous' } = params as Record<string, any>;
  if (!maagadId) throw new Error('maagadId is required');
  if (!offerId) throw new Error('offerId is required');

  const maagadNode = await fetchMaagad(strapi, context, maagadId);
  const offer = (maagadNode.attributes?.offers?.data ?? []).find(
    (o: any) => String(o.id) === String(offerId)
  );
  if (!offer) throw new Error(`Offer ${offerId} not found on maagad ${maagadId}`);
  const oa = offer.attributes ?? {};
  // A departure already under way still takes participants until its lock (A6).
  const lateJoin = openUntilLock(oa);
  if (oa.status_offer !== 'open' && oa.status_offer !== 'quorum_reached' && !lateJoin) {
    throw new Error(`offer is ${oa.status_offer} - signing is closed`);
  }
  if (!lateJoin && oa.sign_deadline && new Date(oa.sign_deadline).getTime() <= Date.now()) {
    throw new Error('sign_deadline has passed');
  }
  const currentCount = Number(oa.signed_count) || 0;
  if (oa.max_participants != null && currentCount >= oa.max_participants) {
    throw new Error('offer is full');
  }
  const proposerProjectId = oa.proposer_project?.data?.id ? String(oa.proposer_project.data.id) : null;
  if (lateJoin && !proposerProjectId) throw new Error('this departure has no rikma to hold the deal');

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
      `you already signed offer ${signedOn} - unsign it first, or sign both deliberately from separate memberships (not supported yet)`
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
      undefined,
      context.fetch
    );
    member = { id: created?.data?.createMaagadMember?.data?.id, attributes: {} };
  }

  const newCount = currentCount + 1;

  // Joining after activation: her deal is minted now, at the price of the size
  // she makes; the settlement below re-prices everyone's deal to match (§4.1).
  let sheirutpendId: string | null = null;
  if (lateJoin) {
    const price = departurePriceNow(oa, newCount) ?? (Number(oa.unit_price) || 0);
    const pendRes = await strapi.execute(
      '235crMaagadSheirutpend',
      {
        project: proposerProjectId,
        userId: String(context.userId),
        maagadOffer: offerId,
        price,
        quant: 1,
        total: price
      },
      undefined,
      context.fetch
    );
    sheirutpendId = pendRes?.data?.createSheirutpend?.data?.id ?? null;
    if (!sheirutpendId) throw new Error('failed to create the deal for this departure');
  }

  await strapi.execute(
    '226updateMaagadMember',
    {
      id: member.id,
      status_member: lateJoin ? 'active' : 'signed',
      signed_offer: offerId,
      options,
      signedAt: nowIso(),
      ...(sheirutpendId ? { sheirutpend: sheirutpendId } : {})
    },
    undefined,
    context.fetch
  );

  // A departure: she joins under the ceiling she saw — her personal consent
  // boundary, not a price (PLAN_POOL_PRODUCT §1ב, §4). Service-only qid 446.
  if (oa.matanot?.data?.id && oa.price_envelope != null) {
    await strapi.execute(
      '446setMaagadMemberEnvelope',
      { id: member.id, envelope_at_sign: Number(oa.price_envelope) },
      undefined,
      context.fetch
    );
  }

  const quorum = newCount >= Number(oa.min_participants || Infinity);
  await strapi.execute(
    '228updateMaagadOffer',
    {
      id: offerId,
      signed_count: newCount,
      status_offer: lateJoin ? 'activated' : quorum ? 'quorum_reached' : 'open'
    },
    undefined,
    context.fetch
  );
  const moved = await resettleDeparture(util, context, String(offerId), oa);

  // Quorum! The proposer confirms the final number (§7.2) — notify them.
  // A late join is not news to them: the quorum was confirmed long ago.
  const notifyUserIds =
    quorum && !lateJoin && oa.proposer_user?.data?.id ? [oa.proposer_user.data.id] : [];

  return {
    data: {
      maagadId,
      offerId,
      signedCount: newCount,
      quorumReached: quorum,
      ...(lateJoin ? { sheirutpendId } : {}),
      partyIds: [...new Set([...poolPartyIds(maagadNode), ...moved])]
    },
    notifyUserIds
  };
};

// ── unsignMaagadOffer (§7.3 — cancel before activation) ─────────────────────

const unsignMaagadOfferHandler: ActionExecutionHandler = async (params, context, util) => {
  const { strapi } = util;
  const { maagadId, offerId } = params as Record<string, any>;
  if (!maagadId) throw new Error('maagadId is required');
  if (!offerId) throw new Error('offerId is required');

  const maagadNode = await fetchMaagad(strapi, context, maagadId);
  const offer = (maagadNode.attributes?.offers?.data ?? []).find(
    (o: any) => String(o.id) === String(offerId)
  );
  if (!offer) throw new Error(`Offer ${offerId} not found on maagad ${maagadId}`);
  const oa = offer.attributes ?? {};
  // A departure is not closed until its lock: leaving stays free after the
  // activation too (§1ב, B6a). Past the lock, or for a plain offer, the
  // cancellation terms govern.
  const afterActivation = oa.status_offer === 'activated';
  if (afterActivation && !openUntilLock(oa)) {
    throw new Error('offer already activated - exit is governed by its cancellation terms');
  }

  const member = await fetchMyMember(strapi, context, maagadId);
  const signedOn = member?.attributes?.signed_offer?.data?.id;
  if (!member || String(signedOn) !== String(offerId)) {
    return { data: { maagadId, offerId, unsigned: false } };
  }

  // Her deal goes with her. The refund of anything she paid ahead is P4's
  // settlement of advances; nothing here charges her.
  const pend = member.attributes?.sheirutpend?.data;
  if (afterActivation && pend?.id && !pend.attributes?.archived) {
    await strapi.execute('450archiveDeparturePend', { id: String(pend.id) }, undefined, context.fetch);
  }

  await strapi.execute(
    '226updateMaagadMember',
    { id: member.id, status_member: 'interested', signed_offer: null, signedAt: null },
    undefined,
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
    undefined,
    context.fetch
  );
  // What her exit does to everyone else's price (and their "not for me" window).
  const moved = await resettleDeparture(util, context, String(offerId), oa);

  return {
    data: {
      maagadId,
      offerId,
      unsigned: true,
      signedCount: newCount,
      partyIds: [...new Set([...poolPartyIds(maagadNode), ...moved])]
    }
  };
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
  let proposerProjectId = oa.proposer_project?.data?.id
    ? String(oa.proposer_project.data.id)
    : null;

  // Solo supplier without a rikma (PLAN_USER_OFFERINGS §3.5): the deal
  // machinery needs a project, so get-or-create the confirming supplier's home
  // rikma (a regular one-member project, open to partners) and persist it on
  // the offer. Confirm is proposer-only (checked by the handler), so
  // context.userId IS the proposer.
  if (!proposerProjectId) {
    const proposerUserId = oa.proposer_user?.data?.id
      ? String(oa.proposer_user.data.id)
      : null;
    if (proposerUserId && proposerUserId === String(context.userId)) {
      try {
        const home = await ensurePersonalRikmaFor(
          {
            userId: context.userId,
            jwt: context.jwt,
            fetch: context.fetch
          },
          strapi
        );
        proposerProjectId = home.projectId;
        await strapi.execute(
          '267setMaagadOfferProposerProject',
          { id: offerId, project: proposerProjectId },
          undefined,
          context.fetch
        );
      } catch (e) {
        console.error('[activateOffer] home-rikma creation for solo supplier failed', e);
      }
    }
  }

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
    undefined,
    context.fetch
  );
  await strapi.execute(
    '230updateMaagad',
    { id: maagadId, status_maagad: 'active' },
    undefined,
    context.fetch
  );

  const activatedUserIds: string[] = [];
  let dealsCreated = 0;
  for (const m of signedMembers) {
    const uid = m?.attributes?.user?.data?.id;

    // Atomic activation (§7.2): a live per-member deal on the supplier's rikma.
    // proposerProjectId is always set for the confirming proposer (a solo
    // supplier gets their home rikma above); it can still be null only when
    // activation is triggered by someone other than the proposer.
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
            total: finalPrice
          },
          undefined,
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
      undefined,
      context.fetch
    );
    if (uid) activatedUserIds.push(String(uid));
  }
  return { activatedUserIds, dealsCreated, finalPrice, proposerProjectId };
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

  const { activatedUserIds, dealsCreated, finalPrice, proposerProjectId } = await activateOffer(
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
      finalPrice,
      proposerProjectId,
      partyIds: poolPartyIds(maagadNode)
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
  const maagadIds = new Set<string>();
  const partyIds = new Set<string>();
  const nowMs = Date.now();

  for (const offer of offers) {
    const oa = offer.attributes ?? {};
    if (!shouldExpire(offerStateFrom(oa), nowMs)) continue;

    await strapi.execute(
      '228updateMaagadOffer',
      { id: offer.id, status_offer: 'expired' },
      undefined,
      context.fetch
    );
    // Signers of this offer revert to interested (their conditional deal, once
    // it exists, is archived by the same milestone that creates it).
    for (const sm of oa.signed_members?.data ?? []) {
      await strapi.execute(
        '226updateMaagadMember',
        { id: sm.id, status_member: 'interested', signed_offer: null, signedAt: null },
        undefined,
        context.fetch
      );
    }
    expired.push(String(offer.id));
    if (oa.maagad?.data?.id != null) maagadIds.add(String(oa.maagad.data.id));
    for (const uid of [oa.proposer_user?.data?.id, ...(oa.signed_members?.data ?? []).map((sm: any) => sm?.attributes?.user?.data?.id)]) {
      if (uid != null) partyIds.add(String(uid));
    }
  }

  return {
    data: {
      expiredCount: expired.length,
      expiredOfferIds: expired,
      maagadIds: [...maagadIds],
      partyIds: [...partyIds]
    }
  };
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

  const created: Array<{ maagadId: string; size: number; invitedUserIds: string[] }> = [];

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
        categories: cluster.categoryIds.length ? cluster.categoryIds : null,
        publishedAt: nowIso()
      },
      undefined,
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
          undefined,
          context.fetch
        );
      }
    }
    created.push({ maagadId, size: cluster.members.length, invitedUserIds: [...invitedUserIds] });
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
      categoryIds: { type: 'array', required: false, description: "The wish's category ids" },
      visibility: { type: 'string', required: false, description: 'anonymous | first_name | full' }
    },
    authRules: [jwtRule],
    realtime: {
      scopes: (_p, r, ctx) => scopeList([scope('maagad', r?.data?.maagadId), scope('user', ctx.userId)]),
      audience: 'self'
    }
  },
  {
    key: 'joinMaagad',
    description: 'Soft, reversible join to a demand pool (interested - not a commitment)',
    graphqlOperation: joinMaagadHandler,
    paramSchema: {
      maagadId: { type: 'string', required: true, description: 'Pool to join' },
      ratsonId: { type: 'string', required: false, description: 'Own wish to link' },
      visibility: { type: 'string', required: false, description: 'anonymous | first_name | full' }
    },
    authRules: [jwtRule],
    realtime: {
      scopes: (p) => scopeList([scope('maagad', p.maagadId)]),
      audience: 'parties',
      partiesFrom: (_p, r) => r?.data?.partyIds ?? []
    }
  },
  {
    key: 'leaveMaagad',
    description: 'Silent, free leave from a demand pool (blocked while signed)',
    graphqlOperation: leaveMaagadHandler,
    paramSchema: {
      maagadId: { type: 'string', required: true, description: 'Pool to leave' }
    },
    authRules: [jwtRule],
    realtime: {
      // Leaving is silent (§2.1): only the leaver's own screens follow.
      scopes: (p) => scopeList([scope('maagad', p.maagadId)]),
      audience: 'self'
    }
  },
  {
    key: 'createMaagadOffer',
    description: 'Supplier threshold offer on a pool (or a new supplier-initiated pool, Track C)',
    graphqlOperation: createMaagadOfferHandler,
    paramSchema: {
      maagadId: { type: 'string', required: false, description: 'Existing pool (omit with newMaagad for Track C)' },
      newMaagad: { type: 'object', required: false, description: 'Wrapper pool for a supplier-initiated offer: {name, scope, lat, lng, radius, frequency}' },
      title: { type: 'string', required: false, description: "What exactly is offered (defaults to the product's name for a departure)" },
      description: { type: 'string', required: false, description: 'Details of the offer' },
      matanotId: { type: 'string', required: false, description: "A rikma's composed product: the offer is a departure of it, priced from its BOM (PLAN_POOL_PRODUCT §4); unitPrice/priceTiers are then ignored" },
      unitPrice: { type: 'number', required: false, description: 'Price per consumer (basket/seat/subscription) - required unless matanotId is given' },
      currencyId: { type: 'string', required: false, description: 'Matbea id' },
      priceTiers: { type: 'array', required: false, description: '[{min, price}] - the reached tier is billed to everyone' },
      minParticipants: { type: 'number', required: true, description: 'Quorum (≥2) - below it no deal happens' },
      maxParticipants: { type: 'number', required: false, description: 'Capacity' },
      signDeadline: { type: 'string', required: true, description: 'ISO datetime - signatures collected until then' },
      options: { type: 'array', required: false, description: 'Personal options [{key, choices, priceDelta}]' },
      recurrence: { type: 'string', required: false, description: 'one_time | weekly | biweekly | monthly' },
      cycleTerms: { type: 'object', required: false, description: 'Recurring terms (exit notice etc.)' },
      cancellationTerms: { type: 'string', required: false, description: 'Cancellation terms - part of the signed contract' },
      proposerProjectId: { type: 'string', required: false, description: 'Offering rikma (project) id' }
    },
    authRules: [jwtRule],
    notification: {
      recipients: { type: 'specificUsers', config: { userIdsParam: 'notifyUserIds', excludeSender: true } },
      templates: {
        title: { he: 'הצעה חדשה במאגד שלך', en: 'New offer on your demand pool', ar: 'عرض جديد في تجمع الطلب الخاص بك' },
        body: { he: 'ספק הגיש הצעה לביקוש שהצטרפת אליו - כל חתימה היא אישית', en: 'A supplier made an offer on a demand you joined - every signature is personal', ar: 'قدّم مزوّد عرضًا على طلب انضممت إليه - كل توقيع شخصي' }
      },
      // Addressed to each member: an offer they may sign before its deadline.
      intent: 'personal',
      metadata: { type: 'maagad', url: 'maagad' }
    },
    realtime: {
      scopes: (p, r) => scopeList([scope('maagad', r?.data?.maagadId ?? p.maagadId)]),
      audience: 'parties',
      partiesFrom: (_p, r) => r?.data?.partyIds ?? []
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
        body: { he: 'מספיק חתומים - אשר סופית כדי להפעיל את העסקאות', en: 'Enough signatures - confirm to activate the deals', ar: 'توقيعات كافية - أكّد لتفعيل الصفقات' }
      },
      // Addressed to the supplier: the quorum is in, and only they can confirm it.
      intent: 'personal',
      metadata: { type: 'maagad', url: 'maagad' }
    },
    realtime: {
      scopes: (p) => scopeList([scope('maagad', p.maagadId)]),
      audience: 'parties',
      partiesFrom: (_p, r) => r?.data?.partyIds ?? []
    }
  },
  {
    key: 'unsignMaagadOffer',
    description: 'Withdraw a signature before activation, or from a departure before its lock (quietly reverts to interested)',
    graphqlOperation: unsignMaagadOfferHandler,
    paramSchema: {
      maagadId: { type: 'string', required: true, description: 'The pool' },
      offerId: { type: 'string', required: true, description: 'The offer to unsign' }
    },
    authRules: [jwtRule],
    realtime: {
      scopes: (p) => scopeList([scope('maagad', p.maagadId)]),
      audience: 'parties',
      partiesFrom: (_p, r) => r?.data?.partyIds ?? []
    }
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
        body: { he: 'ההצעה שחתמת עליה הופעלה - העסקה שלך יוצאת לפועל', en: 'The offer you signed is activated - your deal is going ahead', ar: 'العرض الذي وقّعت عليه مُفعّل - صفقتك تمضي قُدُمًا' }
      },
      // The result for every signer: the deal goes ahead.
      intent: 'outcome',
      metadata: { type: 'maagad', url: 'maagad' }
    },
    realtime: {
      // The deals are minted in the supplier's rikma; the pool's people see it go active.
      scopes: (p, r) => scopeList([scope('maagad', p.maagadId), scope('project', r?.data?.proposerProjectId)]),
      partiesFrom: (_p, r) => r?.data?.partyIds ?? []
    }
  },
  {
    key: 'expireMaagadOffers',
    description: 'Batch: expire offers past their deadline; signers revert to interested (cron)',
    graphqlOperation: expireMaagadOffersHandler,
    paramSchema: {},
    authRules: [jwtRule],
    realtime: {
      scopes: (_p, r) => scopeList((r?.data?.maagadIds ?? []).map((id: string) => scope('maagad', id))),
      audience: 'parties',
      partiesFrom: (_p, r) => r?.data?.partyIds ?? []
    }
  },
  {
    key: 'clusterRatsons',
    description: 'Auto-aggregation job: cluster open wishes into demand pools with suggested members',
    graphqlOperation: clusterRatsonsHandler,
    paramSchema: {
      simThreshold: { type: 'number', required: false, description: 'Override similarity threshold (0-1)' },
      minClusterSize: { type: 'number', required: false, description: 'Override minimum cluster size (default 3)' }
    },
    authRules: [jwtRule],
    realtime: {
      scopes: (_p, r) => scopeList((r?.data?.pools ?? []).map((x: { maagadId: string }) => scope('maagad', x.maagadId))),
      audience: 'parties',
      partiesFrom: (_p, r) => (r?.data?.pools ?? []).flatMap((x: { invitedUserIds: string[] }) => x.invitedUserIds)
    }
  }
];
