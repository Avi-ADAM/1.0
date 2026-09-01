import { sendToSer } from '$lib/send/sendToSer.js';
import type { PageServerLoad } from './$types';

/**
 * One in-progress mission, loaded server-side so the page has a real title and
 * a filled first paint. The board (`../+page.server.ts`) loads the whole rikma;
 * this loads only the mission the member opened.
 *
 * Its timers come with it: the page shows both the monthly ledger and the
 * session-by-session log, and both read the same `timers { start stop }`
 * components — one query, not two, and no client round-trip before the hours
 * are on screen.
 */
export const load: PageServerLoad = async ({ params, fetch }) => {
  const { missionId } = params;

  const [mission, timers] = await Promise.all([
    sendToSer({ id: missionId }, 'getMissionInProgress', null, null, false, fetch)
      .then((res: any) => res?.data?.mesimabetahalich?.data ?? null)
      .catch((e) => {
        console.error('[progress/mission] Failed to load mission', e);
        return null;
      }),
    sendToSer({ mid: missionId }, 'missionTimerSessions', null, null, false, fetch)
      .then((res: any) => res?.data?.timers?.data ?? [])
      .catch((e) => {
        console.error('[progress/mission] Failed to load timers', e);
        return [];
      })
  ]);

  return { mission, timers };
};
