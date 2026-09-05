import { sendToSer } from '$lib/send/sendToSer.js';

/**
 * Public join / self-nomination page (PLAN_SELF_NOMINATION §4, as a standalone
 * page rather than a modal). Reuses the public project query for identity,
 * values and members, and adds the open board — what the rikma is already
 * looking for — so a visitor can take an existing mission/resource instead of
 * only inventing an offer of their own.
 */
export const load = async ({ locals, params, fetch }) => {
  const projectId = params.id;
  const tok = locals.tok;
  const isSer = tok === false;

  const [projectRes, boardRes] = await Promise.allSettled([
    sendToSer({ id: projectId }, '49GetProjectById', null, null, isSer, fetch),
    sendToSer({ id: projectId }, '311projectOpenBoardPublic', null, null, isSer, fetch)
  ]);

  if (projectRes.status === 'rejected') {
    console.error('Error fetching project for join page:', projectRes.reason);
  }
  if (boardRes.status === 'rejected') {
    console.error('Error fetching open board for join page:', boardRes.reason);
  }

  const boardAttrs =
    boardRes.status === 'fulfilled'
      ? (boardRes.value?.data?.project?.data?.attributes ?? null)
      : null;

  return {
    projectId,
    lang: locals.lang,
    uid: locals.uid ?? null,
    isRegisteredUser: tok !== false,
    projectData:
      projectRes.status === 'fulfilled' ? (projectRes.value?.data?.project?.data ?? null) : null,
    // The board is a nice-to-have: an empty list must never keep the offer
    // form off the page.
    openMissions: boardAttrs?.open_missions?.data ?? [],
    openResources: boardAttrs?.open_mashaabims?.data ?? []
  };
};
