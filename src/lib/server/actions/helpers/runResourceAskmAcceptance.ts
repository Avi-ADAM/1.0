/**
 * Shared Strapi steps when a resource-share Askm is fully approved
 * (finalizeAskmAcceptance solo/allVoted, or solo-member createMashaabimRequest).
 */

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

/** Month bounds for the cycle containing `ref`. */
function currentCycleBounds(unit: 'month' | 'year', ref = new Date()) {
  if (unit === 'year') {
    return {
      cycleStart: new Date(ref.getFullYear(), 0, 1).toISOString(),
      cycleEnd: new Date(ref.getFullYear(), 11, 31, 23, 59, 59).toISOString(),
    };
  }
  return {
    cycleStart: new Date(ref.getFullYear(), ref.getMonth(), 1).toISOString(),
    cycleEnd: new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59).toISOString(),
  };
}

/**
 * When the approved resource is a recurring expense (the final, possibly
 * negotiated, Pmash is still flagged recurring), spin up the mashabetahalich
 * engine on approval: create it active, assign the responsible user, configure
 * it from the Pmash's final terms, and turn the freshly-created acceptance Maap
 * into cycle #1. No-op for non-recurring resources (incl. those negotiated from
 * recurring → false, since the query filters recurring: true).
 */
export async function activateRecurringEngine(
  strapi: StrapiExecutor,
  context: AcceptContext,
  args: { projectId: string; resourceName: string; acceptedUserId: string; maapId?: string }
): Promise<void> {
  const { projectId, resourceName, acceptedUserId, maapId } = args;
  if (!resourceName) return;

  const res: any = await strapi.execute(
    'mrGetPmashRecurringTerms',
    { pid: projectId, name: resourceName },
    context.jwt,
    context.fetch
  );
  const pmash = res?.data?.pmashes?.data?.[0];
  if (!pmash) return; // not recurring (or negotiated off) → nothing to do

  const pm = pmash.attributes ?? {};
  const kindOf = pm.kindOf === 'yearly' ? 'yearly' : 'monthly';
  const unit: 'month' | 'year' = kindOf === 'yearly' ? 'year' : 'month';
  const negEasy = Number(pm.easy) || 0;
  const negPrice = Number(pm.price) || 0;
  const pricePerUnit = negEasy > 0 ? negEasy : negPrice;
  const cycleSize = Number(pm.cycleSize) || 1;
  const mashaabimId = pm.mashaabim?.data?.id;
  const now = new Date();

  const createRes: any = await strapi.execute(
    'mrCreateMashabetahalich',
    {
      data: {
        name: resourceName,
        project: projectId,
        users_permissions_user: acceptedUserId,
        pmash: pmash.id,
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

  const { cycleStart, cycleEnd } = currentCycleBounds(unit);
  await strapi.execute(
    'mrUpdateCycleMaap',
    {
      id: maapId,
      data: {
        mashabetahalich: mashId,
        cycleIndex: 1,
        cycleStart,
        cycleEnd,
        quantityDelivered: pricePerUnit,
        publishedAt: now.toISOString(),
      },
    },
    context.jwt,
    context.fetch
  );
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

  await strapi.execute('131archiveOpenMashaabim', { id: openMashaabimId }, jwt, fetchFn);

  // Recurring expense? Activate the draft engine and make this Maap cycle #1.
  await activateRecurringEngine(strapi, context, {
    projectId,
    resourceName: missionName,
    acceptedUserId,
    maapId,
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
