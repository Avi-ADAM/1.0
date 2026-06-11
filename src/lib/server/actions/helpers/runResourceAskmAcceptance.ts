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
 * If a DRAFT recurring engine was created for this resource at proposal time
 * (createResource, multi-member branch), activate it on approval: status →
 * active, assign the responsible user, and turn the freshly-created acceptance
 * Maap into cycle #1 (links it to the engine + sets the cycle window/amount).
 * No-op for non-recurring resources.
 */
export async function activateRecurringEngine(
  strapi: StrapiExecutor,
  context: AcceptContext,
  args: { projectId: string; resourceName: string; acceptedUserId: string; maapId?: string }
): Promise<void> {
  const { projectId, resourceName, acceptedUserId, maapId } = args;
  if (!resourceName) return;

  const res: any = await strapi.execute(
    'mrGetDraftMashForProject',
    { pid: projectId, name: resourceName },
    context.jwt,
    context.fetch
  );
  const draft = res?.data?.mashabetahaliches?.data?.[0];
  if (!draft) return;

  const attrs = draft.attributes ?? {};
  const unit: 'month' | 'year' = attrs.kindOf === 'yearly' ? 'year' : 'month';
  const pricePerUnit = attrs.pricePerUnit ?? 0;
  const now = new Date();

  await strapi.execute(
    'mrUpdateMashabetahalich',
    { id: draft.id, data: { status_mashab: 'active', users_permissions_user: acceptedUserId } },
    context.jwt,
    context.fetch
  );

  if (maapId) {
    const { cycleStart, cycleEnd } = currentCycleBounds(unit);
    await strapi.execute(
      'mrUpdateCycleMaap',
      {
        id: maapId,
        data: {
          mashabetahalich: draft.id,
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
