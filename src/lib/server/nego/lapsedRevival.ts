/**
 * Restoring an assigned mission offer that lapsed.
 *
 * An assigned offer (createMission branch 2) is a mission a member proposed FOR
 * another member. That member's silence is not their yes, so when the rikma's
 * restime runs out without one, the ask clock (api/timegrama/ask.svelte) puts
 * the mission back on the open board and stamps the Ask's `lapsedAt`.
 *
 * The offer can come back to the table while nobody else has stepped in:
 *  - the member it was offered to says "I still want it": their yes is recorded
 *    at the standing round;
 *  - a member of the rikma offers it to them again: their own yes is recorded,
 *    and the invited member still has to say yes.
 * Either way the rikma gets a full new restime to approve, discuss or counter,
 * and silence then completes it. The past months stored on the OpenMission
 * (`backfill`) only travel with an offer that is `isRishon` to that very
 * member, which is why the revival restores `isRishon` and `rishon`.
 *
 * Pure: the action reads the Ask, this decides, the action writes.
 */

import { normId } from './negoGate.js';

export type RevivalRole = 'taker' | 'member';

export type RevivalRefusal =
  | 'notFound'
  | 'notLapsed'
  | 'missionTaken'
  | 'otherCandidate'
  | 'notAllowed';

export interface StoredVote {
  what: boolean;
  users_permissions_user: string | null;
  order: number;
  zman: string | null;
  ide: number | null;
}

export interface RevivalPlan {
  ok: true;
  role: RevivalRole;
  askId: string;
  openMissionId: string;
  takerId: string;
  takerName: string;
  missionName: string;
  projectId: string;
  restime: string;
  vots: StoredVote[];
}

export type RevivalDecision = RevivalPlan | { ok: false; reason: RevivalRefusal };

const toNum = (v: unknown): number | null => {
  const n = parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : null;
};

/**
 * Decide whether `viewerId` may restore the lapsed offer in `ask` (the
 * `lapsedAskForRevival` payload: `data.ask.data`), and with which votes.
 */
export function planLapsedRevival(
  ask: any,
  viewerId: string | number,
  now: Date = new Date()
): RevivalDecision {
  const a = ask?.attributes;
  if (!ask?.id || !a) return { ok: false, reason: 'notFound' };

  const om = a.open_mission?.data;
  const omA = om?.attributes;
  // Only a stamped lapse: an Ask archived because it was accepted, or because a
  // sibling won the mission, is not an offer that is waiting to come back.
  if (a.archived !== true || !a.lapsedAt || !om?.id || !omA) {
    return { ok: false, reason: 'notLapsed' };
  }
  // The mission was taken or offered to someone else since.
  if (omA.archived === true || omA.isRishon === true) return { ok: false, reason: 'missionTaken' };
  // Someone else stepped in after the lapse: their candidacy is on the table.
  const others = (omA.asks?.data ?? []).filter((x: any) => String(x?.id) !== String(ask.id));
  if (others.length > 0) return { ok: false, reason: 'otherCandidate' };

  const takerId = normId(a.users_permissions_user);
  const viewer = normId(viewerId);
  const project = a.project?.data;
  const memberIds: string[] = (project?.attributes?.user_1s?.data ?? []).map((m: any) => String(m.id));
  if (!takerId || !viewer) return { ok: false, reason: 'notAllowed' };

  let role: RevivalRole;
  if (viewer === takerId) role = 'taker';
  else if (memberIds.includes(viewer)) role = 'member';
  else return { ok: false, reason: 'notAllowed' };

  const stored: StoredVote[] = (a.vots ?? []).map((v: any) => {
    const upu = normId(v?.users_permissions_user) || null;
    return {
      what: v?.what === true,
      users_permissions_user: upu,
      order: Number(v?.order ?? 0) || 0,
      zman: v?.zman ?? null,
      ide: toNum(v?.ide) ?? toNum(upu)
    };
  });

  // The standing round: the latest negotiated version, or the baseline (0).
  const L = Number(a.negopendmissions?.data?.[0]?.attributes?.ordern ?? 0) || 0;
  const alreadyYes = stored.some(
    (v) => v.what === true && v.order >= L && v.users_permissions_user === viewer
  );
  const vots = alreadyYes
    ? stored
    : [
        ...stored,
        {
          what: true,
          users_permissions_user: viewer,
          order: L,
          zman: now.toISOString(),
          ide: toNum(viewer)
        }
      ];

  return {
    ok: true,
    role,
    askId: String(ask.id),
    openMissionId: String(om.id),
    takerId,
    takerName: a.users_permissions_user?.data?.attributes?.username ?? '',
    missionName: omA.name ?? '',
    projectId: project?.id != null ? String(project.id) : '',
    restime: project?.attributes?.restime ?? 'feh',
    vots
  };
}
