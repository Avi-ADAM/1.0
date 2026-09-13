import { sendToSer } from '$lib/send/sendToSer.js';
import { normalizeMissionCard } from '$lib/server/discovery/normalizeCards.js';
import { normalizeOpenMission } from '$lib/server/map/normalizeMapItems.js';
import { isHiddenProject } from '$lib/server/discovery/hiddenProjects.js';
import { translateSurface, missionCardGroups } from '$lib/server/translation/surfaces.js';

// Public open-missions directory — same anonymous/service-token split as the
// other (regandnon) discovery pages (see the note in demand/+page.server.ts).
// QID 283 is a field superset of the map qid, so one query feeds both the
// cards and the embedded-map items.
export const load = async ({ locals, fetch, cookies }) => {
  const isReg = !!/** @type {any} */ (locals)?.uid;

  let missions = [];
  let mapItems = [];
  try {
    const res = await sendToSer({}, '283discoverMissions', 0, 0, !isReg, fetch);
    const nodes = (res?.data?.openMissions?.data ?? []).filter(
      (n) => !isHiddenProject(n?.attributes?.project?.data?.id)
    );
    missions = nodes.map(normalizeMissionCard).filter((m) => m !== null);
    mapItems = nodes.map(normalizeOpenMission).filter((m) => m !== null);
  } catch (error) {
    console.error('Error loading missions directory:', error);
  }

  // UGC translation (PLAN_UGC_TRANSLATION §7) — the first surface P2 turns on,
  // and the one where a wall of Hebrew costs an anonymous reader the most.
  //
  // At most ONE extra query, and only when `TRANSLATE_SURFACES` names this
  // page: no LLM call, no await on an API, and misses render the author's own
  // words. A crawler walking this route therefore cannot burn anyone's quota,
  // which is the hard rule the whole read path is built around (§4.1).
  const { translations, pending } = await translateSurface(
    'availableMission',
    missionCardGroups(missions),
    /** @type {any} */ (locals)?.lang,
    fetch,
    cookies.get('autoTranslate')
  );

  return {
    isLoggedIn: isReg,
    missions,
    mapItems,
    translations,
    pending
  };
};
