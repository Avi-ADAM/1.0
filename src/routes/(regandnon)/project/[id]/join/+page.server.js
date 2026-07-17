import { sendToSer } from '$lib/send/sendToSer.js';

/**
 * Public join / self-nomination page (PLAN_SELF_NOMINATION §4, as a standalone
 * page rather than a modal). Reuses the public project query — the page only
 * needs identity, values and members to frame the offer form.
 */
export const load = async ({ locals, params, fetch }) => {
  const projectId = params.id;
  const tok = locals.tok;
  const isSer = tok === false;

  let projectData = null;
  try {
    const data = await sendToSer({ id: projectId }, '49GetProjectById', null, null, isSer, fetch);
    projectData = data?.data?.project?.data ?? null;
  } catch (error) {
    console.error('Error fetching project for join page:', error);
  }

  return {
    projectId,
    lang: locals.lang,
    uid: locals.uid ?? null,
    isRegisteredUser: tok !== false,
    projectData
  };
};
