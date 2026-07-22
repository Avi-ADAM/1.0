import { sendToSer } from '$lib/send/sendToSer.js';
import { normalizeResourceCard } from '$lib/server/discovery/normalizeCards.js';
import { normalizeOpenMashaabim } from '$lib/server/map/normalizeMapItems.js';
import { isHiddenProject } from '$lib/server/discovery/hiddenProjects.js';

// Public requested-resources directory — same anonymous/service-token split as
// the other (regandnon) discovery pages (see demand/+page.server.ts). QID 284
// is a field superset of the map qid, so one query feeds cards + map items.
export const load = async ({ locals, fetch }) => {
  const isReg = !!/** @type {any} */ (locals)?.uid;

  let resources = [];
  let mapItems = [];
  try {
    const res = await sendToSer({}, '284discoverResources', 0, 0, !isReg, fetch);
    const nodes = (res?.data?.openMashaabims?.data ?? []).filter(
      (n) => !isHiddenProject(n?.attributes?.project?.data?.id)
    );
    resources = nodes.map(normalizeResourceCard).filter((r) => r !== null);
    mapItems = nodes.map(normalizeOpenMashaabim).filter((r) => r !== null);
  } catch (error) {
    console.error('Error loading resources directory:', error);
  }

  return {
    isLoggedIn: isReg,
    resources,
    mapItems
  };
};
