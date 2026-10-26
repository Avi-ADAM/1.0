/**
 * Invites that wait on a vote (docs/inprogress/PLAN_INVITE_PARTNER_TO_MISSION.md, P2).
 *
 * In a rikma with more than one member a new mission is a `pendm` and a new
 * resource a `pmash`: nothing is open until the rikma agrees. Inviting someone
 * to it before then would be acting for the rikma, so the invite is stored on
 * the proposal (`pendingInvites`) and sent only when it matures into an open
 * mission / resource — by an explicit vote (voteOnPendm / voteOnPmash) or by
 * restime silence (timegrama pend / pendM). Each of those four calls
 * `firePendingInvites` right after the open entity exists.
 *
 * Both halves are best-effort and never throw. A failed store must not undo the
 * proposal, and a failed send must not fail the vote — which also covers the
 * window in which the app is deployed before the Strapi field exists.
 */

import type { MatchDeps } from '$lib/server/matching/engine';
import {
  inviteToOpenMission,
  inviteToOpenResource,
  type MissionInviteOutcome
} from './missionInvite.js';

export type PendingKind = 'pendm' | 'pmash';

export interface PendingInvite {
  email: string;
  invitedBy: string;
  at: string;
  /** The inviter's language, so the email reads the way they wrote it. */
  lang?: string;
}

const QIDS: Record<PendingKind, { read: string; write: string }> = {
  pendm: { read: '461pendmPendingInvites', write: '462setPendmPendingInvites' },
  pmash: { read: '463pmashPendingInvites', write: '464setPmashPendingInvites' }
};

type Strapi = Pick<MatchDeps['strapi'], 'execute'>;

/**
 * Store an invite on a proposal that is about to be voted on. Runs with the
 * service token (no jwt): the field is server-only. Returns whether it landed.
 */
export async function storePendingInvite(
  kind: PendingKind,
  proposalId: string,
  invite: PendingInvite,
  strapi: Strapi
): Promise<boolean> {
  try {
    const res = await strapi.execute(QIDS[kind].write, { id: String(proposalId), invites: [invite] });
    if (res?.errors?.length) throw new Error(res.errors[0]?.message ?? 'store failed');
    return true;
  } catch (err) {
    console.error(`[pendingInvites] could not store the invite on ${kind} ${proposalId}:`, err);
    return false;
  }
}

/** Only well-formed entries, one per address — a proposal is never invited to twice. */
export function readPendingInvites(raw: unknown): PendingInvite[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: PendingInvite[] = [];
  for (const row of raw) {
    const email = typeof row?.email === 'string' ? row.email.trim().toLowerCase() : '';
    const invitedBy = row?.invitedBy != null ? String(row.invitedBy) : '';
    if (!email || !invitedBy || seen.has(email)) continue;
    seen.add(email);
    out.push({
      email,
      invitedBy,
      at: typeof row.at === 'string' ? row.at : '',
      ...(typeof row.lang === 'string' ? { lang: row.lang } : {})
    });
  }
  return out;
}

/**
 * Send the invites a matured proposal was carrying, now that the open mission
 * (pendm) or open resource (pmash) exists. Never throws; returns one outcome per
 * invite sent, or an empty list when there was nothing (or nothing readable).
 */
export async function firePendingInvites(
  args: { kind: PendingKind; proposalId: string; openEntityId: string },
  deps: MatchDeps,
  send: { mission: typeof inviteToOpenMission; resource: typeof inviteToOpenResource } = {
    mission: inviteToOpenMission,
    resource: inviteToOpenResource
  }
): Promise<MissionInviteOutcome[]> {
  let attrs: any;
  try {
    // Service token: the vote may have been cast by any member, and the
    // invitee's address is not theirs to read.
    const res = await deps.strapi.execute(QIDS[args.kind].read, { id: String(args.proposalId) });
    attrs = res?.data?.[args.kind]?.data?.attributes;
  } catch (err) {
    console.error(`[pendingInvites] could not read ${args.kind} ${args.proposalId}:`, err);
    return [];
  }

  const invites = readPendingInvites(attrs?.pendingInvites);
  if (!invites.length) return [];

  const projectId = String(attrs?.project?.data?.id ?? '');
  const projectName = String(attrs?.project?.data?.attributes?.projectName ?? '');
  const name = String(attrs?.name ?? '');
  if (!projectId) return [];

  const outcomes: MissionInviteOutcome[] = [];
  for (const inv of invites) {
    const base = { projectId, projectName, inviterId: inv.invitedBy, email: inv.email };
    const d = { ...deps, lang: inv.lang ?? deps.lang };
    // inviteToOpen* never throw; the guard is for an injected sender that does.
    try {
      outcomes.push(
        args.kind === 'pendm'
          ? await send.mission({ ...base, openMissionId: String(args.openEntityId), missionName: name }, d)
          : await send.resource({ ...base, openMashaabimId: String(args.openEntityId), resourceName: name }, d)
      );
    } catch (err) {
      console.error('[pendingInvites] an invite failed; the vote stands:', err);
    }
  }
  return outcomes;
}
