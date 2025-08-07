import { sendToSer } from '$lib/send/sendToSer.js';

export async function load({ locals, params, fetch }) {
  const mId = params.id;
  const lang = locals.lang;
  const tok = locals.tok;
  const uid = locals.uid;
  let alld;
  let error;
  let bdata = [];
  let fullfild = false;
  let archived = false;
  const isSer = tok === false;
  try {
    const res = await sendToSer({ mId }, '40OpenMashaabimById', null, null, isSer, fetch);
    const data = res?.data?.openMashaabim?.data?.attributes;
    if (data) {
      if (data.archived !== true) {
        data.archived = false;
        data.title = {
          he: `1💗1 | הצעה לשיתוף משאב \n              "${data.name}" \n              בריקמה: \n              ${data.project.data.attributes.projectName}`,
          en: 'come see this proposal on    '
        };
        data.fullfild = true;
        alld = data;
      } else {
        alld = { title: { he: '1💗1 |  הצעה לשיתוף משאב שאיננה זמינה', en: 'not relevant old proposal' }, archived: true };
      }
    } else {
      alld = { title: { he: '1💗1 |  הצעה לשיתוף משאב שאיננה זמינה', en: 'not relevant old proposal' }, archived: true };
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