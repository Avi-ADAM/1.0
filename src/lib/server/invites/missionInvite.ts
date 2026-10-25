/**
 * Invite a new partner to a mission from the mission form
 * (docs/inprogress/PLAN_INVITE_PARTNER_TO_MISSION.md, phase 1).
 *
 * An invite is never an assignment: the mission is created open, and the
 * invitee offers themselves through the ordinary candidacy flow, which the
 * rikma approves. This module only produces the link the inviter shares and,
 * when an email was given, hands it to the existing partner-invite engine
 * (registered → an `invited` match-suggestion on their lev page + email;
 * unregistered → an email to the public join page).
 *
 * Phase 1 covers a solo rikma, where the open mission exists the moment it is
 * created. A multi-member rikma votes first, so its invite has to wait for the
 * vote to mature (phase 2).
 */

import {
  invitePartnerToOpenEntities,
  type MatchDeps,
  type PartnerInviteResult
} from '$lib/server/matching/engine';

const SITE_ORIGIN = 'https://www.1lev1.com';
const MAX_EMAIL_LENGTH = 254;
// Deliberately loose: the mail system is the real validator. This only stops
// obvious typos and anything that could not be an address at all.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type MissionInviteResult = PartnerInviteResult | 'linkOnly';

export interface MissionInviteOutcome {
  result: MissionInviteResult;
  /** The link to send by hand (WhatsApp, SMS…). Present for every result. */
  link: string;
  /** Set when the address belongs to an existing user. */
  registered?: boolean;
  retryAfterSeconds?: number;
}

/**
 * The public join page of the rikma, carrying which mission the person was
 * invited to (`m`) and who invited them (`inv`). The join page works without
 * either parameter, so the link stays valid if they are ever dropped.
 */
export function missionInviteLink(projectId: string, openMissionId: string, inviterId: string): string {
  const q = new URLSearchParams({ m: String(openMissionId), inv: String(inviterId) });
  return `${SITE_ORIGIN}/project/${encodeURIComponent(String(projectId))}/join?${q.toString()}`;
}

/**
 * `undefined` → no email (a link-only invite). Throws on something that is
 * clearly not an address, so the mission is not created with a lost invite.
 */
export function normalizeInviteEmail(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw !== 'string') throw new Error('Invalid invite email');
  const email = raw.trim().toLowerCase();
  if (!email) return undefined;
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_SHAPE.test(email)) {
    throw new Error('Invalid invite email');
  }
  return email;
}

/**
 * Invite to an open mission that already exists. Never throws: the mission is
 * already created, and an invite that fails must not turn that into an error —
 * the inviter still gets the link.
 */
export async function inviteToOpenMission(
  args: {
    projectId: string;
    projectName: string;
    openMissionId: string;
    missionName: string;
    inviterId: string;
    email?: string;
  },
  deps: MatchDeps,
  invite: typeof invitePartnerToOpenEntities = invitePartnerToOpenEntities
): Promise<MissionInviteOutcome> {
  const link = missionInviteLink(args.projectId, args.openMissionId, args.inviterId);
  if (!args.email) return { result: 'linkOnly', link };

  try {
    const out = await invite(
      args.email,
      { openMissions: [{ id: String(args.openMissionId), name: args.missionName }], openMashaabims: [] },
      args.projectName,
      { ...deps, invitedBy: String(args.inviterId), projectId: String(args.projectId) }
    );
    return {
      result: out.result,
      link,
      ...(out.userId ? { registered: true } : {}),
      ...(out.retryAfterSeconds ? { retryAfterSeconds: out.retryAfterSeconds } : {})
    };
  } catch (err) {
    console.error('[missionInvite] invite failed; the link still works:', err);
    return { result: 'failed', link };
  }
}
