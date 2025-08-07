import { sendToSer } from '$lib/send/sendToSer.js';

async function awaitapi(projectId, lang, tok) {
  let projectData = null;
  try {
    const isSer = tok === false;
    const data = await sendToSer({ pid: projectId }, '41ProjectById', null, null, isSer, fetch);
    if (data?.data?.project?.data) {
      projectData = data.data.project.data;
    }
  } catch (error) {
    console.error("Error fetching project data:", error);
    projectData = null;
  }
  return projectData;
}

export const load = async ({ locals, params, fetch }) => {
  const projectId = params.id;
  const lang = locals.lang;
  const tok = locals.tok;
  const uid = locals.uid;
console.log(projectId)
  let isRegisteredUser = tok != false;
console.log(isRegisteredUser)
  return {
    projectId,
    lang,
    tok: tok == false ? false : true,
    projectData: await awaitapi(projectId, lang, tok),
    isRegisteredUser,
  };
};
