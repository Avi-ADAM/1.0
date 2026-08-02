/**
 * Shared Strapi steps when a resource-share Askm is fully approved
 * (finalizeAskmAcceptance solo/allVoted, or solo-member createMashaabimRequest).
 */

import { cycleWindowIso, normalizeCycleSize } from '$lib/recurring/recurringPlan.js';

type StrapiExecutor = {
  execute: (
    queryId: string,
    variables: Record<string, unknown>,
    userJwt?: string,
    fetchFn?: typeof globalThis.fetch
  ) => Promise<unknown>;
};

type AcceptContext = {
  jwt?: string;
  fetch?: typeof globalThis.fetch;
  userId: string | number;
};

export type RunResourceAskmAcceptanceParams = {
  askmId: string;
  openMashaabimId: string;
  projectId: string;
  spId: string;
  missionName: string;
  /** User who offered the resource (SP owner / askm requester). */
  acceptedUserId: string;
  existingMemberIds: string[];
  existingVotes?: unknown[];
  /** When Askm was created with archived=true + vots already set. */
  skipAskmArchive?: boolean;
};

function normalizeVotes(existingVotes: unknown[]) {
  return existingVotes.map((v: any) => ({
    what: v.what ?? true,
    users_permissions_user:
      v.users_permissions_user?.data?.id ??
      v.users_permissions_user?.id ??
      v.users_permissions_user,
  }));
}

/**
 * When the approved resource is a recurring expense, spin up the mashabetahalich
 * engine on approval: create it active, assign the responsible user, configure it
 * from the resource's final (possibly negotiated) terms, and turn the freshly
 * created acceptance Maap into cycle #1.
 *
 * The terms come from whichever record the rikma actually used: a Pmash in a
 * multi-member rikma, or the OpenMashaabim itself in a solo one — a solo creator
 * can publish a recurring need to the community too, and it must get the same
 * engine when someone takes it on. No-op for non-recurring resources, including
 * ones negotiated from recurring → false (both lookups require recurring: true).
 */
export async function activateRecurringEngine(
  strapi: StrapiExecutor,
  context: AcceptContext,
  args: {
    projectId: string;
    resourceName: string;
    acceptedUserId: string;
    maapId?: string;
    /** Solo-rikma fallback source when no recurring Pmash matches. */
    openMashaabimId?: string;
  }
): Promise<void> {
  const { projectId, resourceName, acceptedUserId, maapId, openMashaabimId } = args;
  if (!resourceName) return;

  const res: any = await strapi.execute(
    'mrGetPmashRecurringTerms',
    { pid: projectId, name: resourceName },
    context.jwt,
    context.fetch
  );
  let pmash = res?.data?.pmashes?.data?.[0] ?? null;
  let termsFromPmash = Boolean(pmash);

  if (!pmash && openMashaabimId) {
    const omRes: any = await strapi.execute(
      'mrGetOpenMashaabimRecurringTerms',
      { id: String(openMashaabimId) },
      context.jwt,
      context.fetch
    );
    const om = omRes?.data?.openMashaabim?.data;
    // Read by id, so filter on recurring here rather than in the query.
    if (om?.attributes?.recurring === true) {
      pmash = om;
      termsFromPmash = false;
    }
  }

  if (!pmash) return; // not recurring (or negotiated off) → nothing to do

  const pm = pmash.attributes ?? {};
  const kindOf = pm.kindOf === 'yearly' ? 'yearly' : 'monthly';
  const unit: 'month' | 'year' = kindOf === 'yearly' ? 'year' : 'month';
  const negEasy = Number(pm.easy) || 0;
  const negPrice = Number(pm.price) || 0;
  const pricePerUnit = negEasy > 0 ? negEasy : negPrice;
  const cycleSize = normalizeCycleSize(pm.cycleSize);
  const mashaabimId = pm.mashaabim?.data?.id;
  const now = new Date();

  const createRes: any = await strapi.execute(
    'mrCreateMashabetahalich',
    {
      data: {
        name: resourceName,
        project: projectId,
        users_permissions_user: acceptedUserId,
        // Only a real Pmash may be linked — Mashabetahalich has no
        // open_mashaabim relation, so the solo path simply carries none.
        ...(termsFromPmash ? { pmash: pmash.id } : {}),
        ...(mashaabimId ? { mashaabim: mashaabimId } : {}),
        kindOf,
        unit,
        status_mashab: 'active',
        recurring: true,
        cycleSize,
        pricePerUnit,
        ...(pm.sqadualed ? { start: pm.sqadualed } : { start: now.toISOString() }),
        ...(pm.sqadualedf ? { end: pm.sqadualedf } : {}),
        finnished: false,
        publishedAt: now.toISOString(),
      },
    },
    context.jwt,
    context.fetch
  );
  const mashId = createRes?.data?.createMashabetahalich?.data?.id;
  if (!mashId || !maapId) return;

  const startAnchor = pm.sqadualed ? new Date(pm.sqadualed) : now;
  const { cycleStart, cycleEnd } = cycleWindowIso(unit, startAnchor, cycleSize, now);
  // Turn the acceptance Maap into cycle #1. Leave quantityDelivered unset (null):
  // the responsible user must still report the actual spend for this first month
  // before the rest of the project can approve it. pricePerUnit (on the engine)
  // is the planned preview only.
  await strapi.execute(
    'mrUpdateCycleMaap',
    {
      id: maapId,
      data: {
        mashabetahalich: mashId,
        cycleIndex: 1,
        cycleStart,
        cycleEnd,
        publishedAt: now.toISOString(),
      },
    },
    context.jwt,
    context.fetch
  );

  // Attach a Timegrama (deadline) to cycle #1 so it auto-approves once the
  // governance window elapses, and a counter-offer can reset the clock.
  try {
    const restimeRes: any = await strapi.execute(
      'mrGetProjectRestime',
      { pid: projectId },
      context.jwt,
      context.fetch
    );
    const restime: string =
      restimeRes?.data?.project?.data?.attributes?.restime ?? 'feh';
    const RESTIME_HOURS: Record<string, number> = { feh: 48, sth: 72, nsh: 96, sevend: 168 };
    const deadline = new Date(now.getTime() + (RESTIME_HOURS[restime] ?? 48) * 3600000);
    const tgRes: any = await strapi.execute(
      'mrCreateCycleTimegrama',
      { date: deadline.toISOString(), maapId },
      context.jwt,
      context.fetch
    );
    const tgId = tgRes?.data?.createTimegrama?.data?.id;
    if (tgId) {
      await strapi.execute(
        'mrLinkMaapTimegrama',
        { id: maapId, timegrama: tgId },
        context.jwt,
        context.fetch
      );
    }
  } catch (e) {
    console.error('activateRecurringEngine: failed to attach timegrama', e);
  }
}

export async function runResourceAskmAcceptance(
  strapi: StrapiExecutor,
  context: AcceptContext,
  params: RunResourceAskmAcceptanceParams
): Promise<void> {
  const {
    askmId,
    openMashaabimId,
    projectId,
    spId,
    missionName,
    acceptedUserId,
    existingMemberIds,
    existingVotes = [],
    skipAskmArchive = false,
  } = params;

  const now = new Date();
  const jwt = context.jwt;
  const fetchFn = context.fetch;
  const newnew = !existingMemberIds.map(String).includes(String(acceptedUserId));

  // If the candidate negotiated parallel terms, flow the latest proposed round
  // onto the (about-to-be-archived) open resource so the Maap + downstream
  // materialization use the agreed values rather than the rikma baseline.
  // Best-effort: a plain "agree" (no rounds) keeps the baseline terms.
  try {
    const roundsRes: any = await strapi.execute(
      'getAskmNegoRounds',
      { id: String(askmId) },
      jwt,
      fetchFn
    );
    const rounds = roundsRes?.data?.askm?.data?.attributes?.nego_mashes?.data ?? [];
    const latest = rounds[0]?.attributes; // sorted ordern:desc → [0] is the latest round
    if (latest) {
      const data: Record<string, any> = {};
      if (latest.name != null) data.name = latest.name;
      if (latest.descrip != null) data.descrip = latest.descrip;
      if (latest.spnot != null) data.spnot = latest.spnot;
      if (latest.easy != null) data.easy = latest.easy;
      if (latest.hm != null) data.hm = latest.hm;
      if (latest.price != null) data.price = latest.price;
      if (latest.kindOf != null) data.kindOf = latest.kindOf;
      if (latest.sqadualed != null) data.sqadualed = latest.sqadualed;
      if (latest.sqadualedf != null) data.sqadualedf = latest.sqadualedf;
      if (latest.linkto != null) data.linkto = latest.linkto;
      if (Object.keys(data).length > 0) {
        await strapi.execute(
          'applyRoundToOpenMashaabim',
          { id: String(openMashaabimId), data },
          jwt,
          fetchFn
        );
      }
    }
  } catch {
    /* negotiated terms are best-effort; baseline materialization still works */
  }

  const maapRes: any = await strapi.execute(
    '141createMaap',
    {
      data: {
        project: projectId,
        name: missionName,
        sp: spId,
        publishedAt: now.toISOString(),
        open_mashaabim: openMashaabimId,
      },
    },
    jwt,
    fetchFn
  );
  const maapId = maapRes?.data?.createMaap?.data?.id;

  const archiveRes: any = await strapi.execute(
    '131archiveOpenMashaabim',
    { id: openMashaabimId },
    jwt,
    fetchFn
  );

  // Archive the other (losing) candidates' askms on this open resource so their
  // offers can no longer be voted on. Mirrors the mission-side sibling-archive.
  const siblingAskms: any[] =
    archiveRes?.data?.updateOpenMashaabim?.data?.attributes?.askms?.data ?? [];
  for (const sib of siblingAskms) {
    if (String(sib.id) === String(askmId)) continue;
    try {
      await strapi.execute('131bArchiveAskm', { id: String(sib.id) }, jwt, fetchFn);
    } catch (e) {
      console.error('runResourceAskmAcceptance: failed to archive sibling askm', sib.id, e);
    }
  }

  // Recurring expense? Activate the draft engine and make this Maap cycle #1.
  // The open resource was just archived, but the lookup reads it by id, so a
  // solo rikma's recurring OpenMashaabim still yields its terms.
  await activateRecurringEngine(strapi, context, {
    projectId,
    resourceName: missionName,
    acceptedUserId,
    maapId,
    openMashaabimId,
  });

  if (newnew) {
    await strapi.execute(
      '75createWelcomeTop',
      { userId: acceptedUserId, projectId, publishedAt: now.toISOString() },
      jwt,
      fetchFn
    );
    const newMemberIds = [...existingMemberIds.map(String), String(acceptedUserId)];
    await strapi.execute(
      '74addUserToProject',
      { projectId, userIds: newMemberIds },
      jwt,
      fetchFn
    );
  }

  if (!skipAskmArchive) {
    const existingVots = normalizeVotes(existingVotes);
    const allVots = [
      ...existingVots,
      { what: true, users_permissions_user: String(context.userId) },
    ];
    await strapi.execute(
      '132archiveAskmWithVotes',
      { id: askmId, vots: allVots },
      jwt,
      fetchFn
    );
  }
}

export async function resolveOpenMashaabimName(
  strapi: StrapiExecutor,
  context: AcceptContext,
  openMashaabimId: string,
  providedName?: string
): Promise<string> {
  const trimmed = providedName?.trim();
  if (trimmed) return trimmed;

  const res: any = await strapi.execute(
    '50GetOpenMashaabimById',
    { id: openMashaabimId },
    context.jwt,
    context.fetch
  );
  return res?.data?.openMashaabim?.data?.attributes?.name ?? 'משאב';
}
