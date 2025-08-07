import { sendToSer } from '$lib/send/sendToSer.js';
import { langAdjast } from '$lib/func/langAdjast.svelte';
export async function load({ locals, params, fetch }) {
  const mId = params.id;
  const lang = locals.lang;
  const tok = locals.tok;
  const uid = locals.uid
  let que, alld
  let error;
  let bdata = []
  let fullfild = false
  let archived = false
  const isSer = tok === false;
  alld = new Promise(async (resolve) => {
    try {
      const res = await sendToSer({ id: mId }, '42MatanotById', null, null, isSer, fetch);
      const datar = res?.data?.matanot?.data?.attributes;
      if (datar) {
        if (datar.archived != true) {
          const data = datar;
          data.archived = false;
          data.title = {
            he: `1💗1 | שירות "${datar.name}" בריקמה: ${datar.projectcreates.data[0].attributes.projectName}`,
            en: `1💗1 | come see this service "${datar.name}" on freeMates:"${datar.projectcreates.data[0].attributes.projectName}"`
          };
          data.fullfild = true;
          resolve(data);
        } else {
          archived = true;
          resolve({ archived: true, fullfild: true });
        }
      } else {
        resolve({ archived: true, fullfild: true });
      }
    } catch (e) {
      console.log(e);
      resolve(null);
    }
  });
  return {
    uid,
    lang,
    mId,
    tok: tok == false ? false : true,
    archived,
      alld,
      fullfild
  };
}
