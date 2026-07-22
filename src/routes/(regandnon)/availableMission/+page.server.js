import { sendToSer } from '$lib/send/sendToSer.js';
import { normalizeMissionCard } from '$lib/server/discovery/normalizeCards.js';
import { normalizeOpenMission } from '$lib/server/map/normalizeMapItems.js';
import { isHiddenProject } from '$lib/server/discovery/hiddenProjects.js';

// Public open-missions directory — same anonymous/service-token split as the
// other (regandnon) discovery pages (see the note in demand/+page.server.ts).
// QID 283 is a field superset of the map qid, so one query feeds both the
// cards and the embedded-map items.
export const load = async ({ locals, fetch }) => {
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

  return {
    isLoggedIn: isReg,
    missions,
    mapItems
  };
};
