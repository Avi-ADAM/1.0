import { sendToSer } from '$lib/send/sendToSer.js';
import { translateSurface, projectDetailGroups } from '$lib/server/translation/surfaces.js';

async function awaitapi(projectId, lang, tok, fetch) {
  const isSer = tok === false;

  let projectData = null;
  try {
    const data = await sendToSer({ id: projectId }, '49GetProjectById', null, null, isSer, fetch);
    if (data.data.project.data != null) {
      projectData = data.data.project.data;
    }
  } catch (error) {
    console.error("Error fetching project data:", error);
    projectData = null;
  }
  return projectData;
}

export const load = async ({ locals, params, fetch, depends, cookies }) => {
  const projectId = params.id;
  const lang = locals.lang;
  const tok = locals.tok;
  // Tag this load so a realtime vote/decision notification can re-run it
  // via invalidate(`project:${projectId}`) from the page.
  depends(`project:${projectId}`);
  let isRegisteredUser = tok != false;

  const projectData = await awaitapi(projectId, lang, tok, fetch);

  // UGC translation (PLAN_UGC_TRANSLATION §7.1) — the rikma's own page: its
  // description, and the names of its open missions and products. Mission
  // names are the same strings the directory and the mission pages already
  // buy, so on a warm cache they cost this page nothing. One extra query at
  // most, never an LLM call, and a miss renders the author's words.
  const { translations, pending } = await translateSurface(
    'projectDetail',
    projectDetailGroups(projectData ? { id: projectId, attributes: projectData.attributes } : null),
    lang,
    fetch,
    cookies.get('autoTranslate')
  );

  return {
    projectId,
    lang,
    tok: tok == false ? false : true,
    projectData,
    isRegisteredUser,
    translations,
    pending
  };
};
