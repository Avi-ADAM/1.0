import { sendToSer } from '$lib/send/sendToSer.js';
import { normalizeProjectCard } from '$lib/server/discovery/normalizeCards.js';
import { isHiddenProject } from '$lib/server/discovery/hiddenProjects.js';

// Public projects directory — same anonymous/service-token split as the other
// (regandnon) discovery pages (see the note in demand/+page.server.ts).
export const load = async ({ locals, fetch }) => {
  const isReg = !!/** @type {any} */ (locals)?.uid;

  let projects = [];
  try {
    const res = await sendToSer({}, '281discoverProjects', 0, 0, !isReg, fetch);
    projects = (res?.data?.projects?.data ?? [])
      .map(normalizeProjectCard)
      .filter((p) => p !== null && !isHiddenProject(p.id));
  } catch (error) {
    console.error('Error loading projects directory:', error);
  }

  return {
    isLoggedIn: isReg,
    projects
  };
};
