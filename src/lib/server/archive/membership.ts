/**
 * When archiving an object also ends a membership (PLAN_OBJECT_ARCHIVAL).
 *
 * Someone can join a rikma to do exactly one thing. If that one thing is
 * cancelled while nothing has accrued, there is nothing left tying them to the
 * rikma — and quietly leaving them on the member list would be a lie: they
 * would keep counting toward every future quorum, in a rikma they have no
 * stake in.
 *
 * So the archival flow states the consequence up front and, when it matures,
 * ends the membership too. The 0-hours condition is what makes this safe: a
 * member with logged hours, a FinnishedMission, a sale or a haluka has accrued
 * value in the rikma, and *that* is a tie — such a member is never removed by
 * this path.
 */

import { gqlStr, run, type Exec } from './gql.js';
import type { ArchiveTarget, TargetKind } from './targets.js';

export interface MembershipAssessment {
  /** The rikma this is about. */
  projectId: string;
  /** Whose membership is in question. */
  userId: string;
  /** True when the object being archived is this member's last tie. */
  isLastTie: boolean;
  /** Why it is not the last tie — surfaced in the card so it reads as a fact. */
  otherMissions: number;
  otherResources: number;
  finnishedMissions: number;
  sales: number;
  halukas: number;
  openOffers: number;
  /** A rikma may not be emptied — the last member always stays. */
  isOnlyMember: boolean;
}

/** Nothing to assess: no rikma, no owner, or value already accrued. */
export const NO_MEMBERSHIP_EFFECT: MembershipAssessment = {
  projectId: '',
  userId: '',
  isLastTie: false,
  otherMissions: 0,
  otherResources: 0,
  finnishedMissions: 0,
  sales: 0,
  halukas: 0,
  openOffers: 0,
  isOnlyMember: false,
};

const IN_PROGRESS_KINDS: readonly TargetKind[] = ['missionInProgress', 'resourceInProgress'];

/** `lifecycle` is new, so live rows are the NULL ones plus the explicit states. */
const LIVE = `{ or: [{ lifecycle: { null: true } }, { lifecycle: { notIn: ["archived", "released"] } }] }`;

function total(node: any): number {
  return Number(node?.meta?.pagination?.total ?? 0);
}

/**
 * Does this member have anything else in this rikma?
 *
 * Counts every kind of tie in one document: other live commitments, accrued
 * work, money, distributions, and offers still waiting for them.
 */
export async function assessMembership(
  exec: Exec,
  target: ArchiveTarget,
  userId: string,
): Promise<MembershipAssessment> {
  // Only an in-progress commitment can be someone's reason for being here.
  if (!IN_PROGRESS_KINDS.includes(target.kind)) return NO_MEMBERSHIP_EFFECT;
  if (!target.projectId || !target.ownerId) return NO_MEMBERSHIP_EFFECT;

  // Hours logged, or work already finished, is a stake in the rikma — the
  // member stays regardless of what happens to this one object.
  if (target.hoursAlready > 0 || target.finnishedMissionIds.length > 0) {
    return NO_MEMBERSHIP_EFFECT;
  }
  if (!target.memberIds.includes(target.ownerId)) return NO_MEMBERSHIP_EFFECT;

  const pid = gqlStr(target.projectId);
  const uid = gqlStr(target.ownerId);
  const self = gqlStr(target.id);
  const one = 'pagination: { limit: 1 }';
  const meta = 'meta { pagination { total } }';

  // The object being archived must not count itself as a remaining tie.
  const notSelf = (kind: TargetKind) =>
    target.kind === kind ? `{ id: { ne: ${self} } }` : '';

  const query = `{
    otherMissions: mesimabetahaliches(filters: { and: [
      { project: { id: { eq: ${pid} } } },
      { users_permissions_user: { id: { eq: ${uid} } } },
      { finnished: { ne: true } },
      ${LIVE}
      ${notSelf('missionInProgress') ? `, ${notSelf('missionInProgress')}` : ''}
    ] }, ${one}) { ${meta} }

    otherResources: mashabetahaliches(filters: { and: [
      { project: { id: { eq: ${pid} } } },
      { users_permissions_user: { id: { eq: ${uid} } } },
      { finnished: { ne: true } },
      ${LIVE}
      ${notSelf('resourceInProgress') ? `, ${notSelf('resourceInProgress')}` : ''}
    ] }, ${one}) { ${meta} }

    finnishedMissions: finnishedMissions(filters: { and: [
      { project: { id: { eq: ${pid} } } },
      { users_permissions_user: { id: { eq: ${uid} } } }
    ] }, ${one}) { ${meta} }

    sales: sales(filters: { and: [
      { project: { id: { eq: ${pid} } } },
      { users_permissions_user: { id: { eq: ${uid} } } }
    ] }, ${one}) { ${meta} }

    halukas: halukas(filters: { and: [
      { project: { id: { eq: ${pid} } } },
      { or: [
        { userrecive: { id: { eq: ${uid} } } },
        { usersend: { id: { eq: ${uid} } } }
      ] }
    ] }, ${one}) { ${meta} }

    openAsks: asks(filters: { and: [
      { project: { id: { eq: ${pid} } } },
      { users_permissions_user: { id: { eq: ${uid} } } },
      { archived: { ne: true } }
    ] }, ${one}) { ${meta} }

    openAskms: askms(filters: { and: [
      { project: { id: { eq: ${pid} } } },
      { users_permissions_user: { id: { eq: ${uid} } } },
      { archived: { ne: true } }
    ] }, ${one}) { ${meta} }
  }`;

  const data = await run(exec, query, 'assessMembership');

  const otherMissions = total(data?.otherMissions);
  const otherResources = total(data?.otherResources);
  const finnishedMissions = total(data?.finnishedMissions);
  const sales = total(data?.sales);
  const halukas = total(data?.halukas);
  const openOffers = total(data?.openAsks) + total(data?.openAskms);
  const isOnlyMember = target.memberIds.length <= 1;

  const anythingElse =
    otherMissions + otherResources + finnishedMissions + sales + halukas + openOffers;

  return {
    projectId: target.projectId,
    userId: target.ownerId,
    isLastTie: anythingElse === 0 && !isOnlyMember,
    otherMissions,
    otherResources,
    finnishedMissions,
    sales,
    halukas,
    openOffers,
    isOnlyMember,
  };
}

/**
 * Take the member off the rikma's list.
 *
 * Membership is a many-to-many, so this rewrites `user_1s` without them —
 * their history (finished work, past decisions, forum messages) is untouched
 * and still points at the rikma.
 */
export async function endMembership(
  exec: Exec,
  projectId: string,
  userId: string,
): Promise<{ removed: boolean; remainingMemberIds: string[] }> {
  const current = await run(
    exec,
    `{ project(id: ${gqlStr(projectId)}) { data { id attributes {
      user_1s { data { id } }
    } } } }`,
    'endMembership:read',
  );

  const memberIds: string[] = (current?.project?.data?.attributes?.user_1s?.data ?? []).map(
    (u: any) => String(u.id),
  );
  const remaining = memberIds.filter((id) => id !== String(userId));

  // Never empty a rikma, and never write a no-op list.
  if (remaining.length === memberIds.length) {
    return { removed: false, remainingMemberIds: memberIds };
  }
  if (remaining.length === 0) {
    console.warn(`[archive] refusing to remove the last member of project ${projectId}`);
    return { removed: false, remainingMemberIds: memberIds };
  }

  await run(
    exec,
    `mutation { updateProject(id: ${gqlStr(projectId)}, data: {
      user_1s: [${remaining.map((id) => gqlStr(id)).join(', ')}]
    }) { data { id } } }`,
    'endMembership:write',
  );

  return { removed: true, remainingMemberIds: remaining };
}
