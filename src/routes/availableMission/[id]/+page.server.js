import { sendToSer } from '$lib/send/sendToSer.js';
import { langAdjast } from '$lib/func/langAdjast.svelte';

async function awaitapi(mId, lang, tok, fetch) {
  const isSer = tok === false;
  try {
    const res = await sendToSer({ id: mId }, '51GetOpenMissionById', null, null, isSer, fetch);
    const node = res?.data?.openMission?.data;
    if (node) {
      const langd = langAdjast(node, lang);
      const alld = { ...langd };
      alld.title = {
        he: `1💗1 | הצעה למשימה "${alld.attributes.name}" בריקמה: ${alld.attributes.project.data.attributes.projectName}`,
        en: `1💗1 | come see this mission "${alld.attributes.name}" on freeMates:"${alld.attributes.project.data.attributes.projectName}"`
      };
      return alld;
    }
    return null;
  } catch (error) {
    console.log(error);
    return null;
  }
}
export async function load({ locals, params, fetch }) {
  const mId = params.id;
  const lang = locals.lang;
  const tok = locals.tok;
  console.log(tok);
  const uid = locals.uid
  let que, alld
  let error;
  let bdata = []
  let fullfild = false
  let archived = false
  
  return {
    uid,
    lang,
    mId,
    tok: tok == false ? false : true,
      alld: await awaitapi(mId,lang,tok,fetch),
      fullfild
  };
}

