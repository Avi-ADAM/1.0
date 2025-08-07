import { sendToSer } from '$lib/send/sendToSer.js';
import { langAdjast } from '$lib/func/langAdjast.svelte';

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
  const isSer = tok === false
  try {
    const res = await sendToSer({ mId }, '39OpenMissionById', null, null, isSer, fetch);
    if (res?.data?.openMission?.data) {
      let datar = res.data.openMission.data;
      datar = langAdjast(datar, lang);
      alld = datar;
      alld.title = {
        he: `1💗1 | הצעה למשימה "${alld.attributes.name}" בריקמה: ${alld.attributes.project.data.attributes.projectName}`,
        en: `1💗1 | come see this mission "${alld.attributes.name}" on freeMates:"${alld.attributes.project.data.attributes.projectName}"`
      };
    } else {
      alld = null;
      fullfild = true;
    }
  } catch (e) {
    console.log(e);
    alld = e;
  }
  
  return {
    uid,
    lang,
    mId,
    tok: tok == false ? false : true,
      alld,
      fullfild
  };
}

