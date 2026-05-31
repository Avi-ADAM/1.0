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

  await strapi.execute(
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

  await strapi.execute('131archiveOpenMashaabim', { id: openMashaabimId }, jwt, fetchFn);

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
