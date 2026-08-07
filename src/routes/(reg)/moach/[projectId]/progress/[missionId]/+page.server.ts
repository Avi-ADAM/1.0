import { sendToSer } from '$lib/send/sendToSer.js';
import type { PageServerLoad } from './$types';

/**
 * One in-progress mission, loaded server-side so the page has a real title and
 * a filled first paint. The board (`../+page.server.ts`) loads the whole rikma;
 * this loads only the mission the member opened.
 */
export const load: PageServerLoad = async ({ params, fetch }) => {
  const { missionId } = params;

  try {
    const res: any = await sendToSer({ id: missionId }, 'getMissionInProgress', null, null, false, fetch);
    return { mission: res?.data?.mesimabetahalich?.data ?? null };
  } catch (e) {
    console.error('[progress/mission] Failed to load mission', e);
    return { mission: null };
  }
};
