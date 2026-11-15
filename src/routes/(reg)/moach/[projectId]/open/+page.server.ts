import { sendToSer } from '$lib/send/sendToSer.js';
import type { PageServerLoad } from './$types';

export interface LapsedOffer {
  askId: string;
  missionName: string;
  takerId: string;
  takerName: string;
}

/**
 * "Open for partners" board — every open mission and needed resource of the
 * rikma in one place.
 *
 * Reuses `getProjectMissions` (the same query the create/progress pages load)
 * so the board costs nothing new on the backend and always agrees with them.
 *
 * Also the assigned offers that lapsed (the invited member did not answer in
 * time) and can still come back: nobody else has applied since. The layout has
 * already refused anyone who is not a member of the rikma.
 */
export const load: PageServerLoad = async ({ params, fetch }) => {
  const { projectId } = params;

  const [res, lapsedRes] = (await Promise.all([
    sendToSer({ pid: projectId }, 'getProjectMissions', 0, 0, false, fetch),
    // Best-effort: a Strapi without Ask.lapsedAt yet must not break the board.
    sendToSer({ pid: projectId }, 'projectLapsedAsks', 0, 0, false, fetch).catch(() => null)
  ])) as any[];
  const attrs = res?.data?.project?.data?.attributes ?? null;

  const lapsedOffers: LapsedOffer[] = (lapsedRes?.data?.asks?.data ?? [])
    .filter((a: any) => {
      const om = a?.attributes?.open_mission?.data;
      if (!om || om.attributes?.isRishon === true) return false;
      return !(om.attributes?.asks?.data ?? []).some((x: any) => String(x?.id) !== String(a.id));
    })
    .map((a: any) => ({
      askId: String(a.id),
      missionName: a.attributes.open_mission.data.attributes?.name ?? '',
      takerId: String(a.attributes.users_permissions_user?.data?.id ?? ''),
      takerName: a.attributes.users_permissions_user?.data?.attributes?.username ?? ''
    }))
    .filter((o: LapsedOffer) => o.takerId);

  return {
    projectMissionsData: attrs,
    lapsedOffers
  };
};
