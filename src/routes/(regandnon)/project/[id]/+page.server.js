import { sendToSer } from '$lib/send/sendToSer.js';

async function awaitapi(projectId, lang, tok, fetch) {
  let que, toc;
  const isSer = tok === false;

  let projectData = null;
  try {
    console.log("TRAYIOs")
    const data = await sendToSer({ id: projectId }, '49GetProjectById', null, null, isSer, fetch);
    console.log(data)
    if (data.data.project.data != null) {
      projectData = data.data.project.data;
      console.log(projectData)
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
    projectData: await awaitapi(projectId, lang, tok, fetch),
    isRegisteredUser,
  };
};
