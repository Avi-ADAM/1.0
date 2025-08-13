import { sendToSer } from '$lib/send/sendToSer.js';

async function awaitapi(mId, lang, tok, fetch) {  
  const isSer = tok === false;
  try {
    const res = await sendToSer({ id: mId }, '50GetOpenMashaabimById', null, null, isSer, fetch);
    const node = res?.data?.openMashaabim?.data?.attributes;
    if (node) {
      if (node.archived !== true) {
        const data = { ...node };
        data.archived = false;
        data.title = {
          he: `1💗1 | הצעה לשיתוף משאב "${data.name}" בריקמה: ${data.project?.data?.attributes?.projectName}`,
          en: 'come see this proposal on'
        };
        data.fullfild = true;
        return data;
      } else {
        return { title: { he: '1💗1 |  הצעה לשיתוף משאב שאיננה זמינה', en: 'not relevant old proposal' }, archived: true };
      }
    } else {
      return { title: { he: '1💗1 |  הצעה לשיתוף משאב שאיננה זמינה', en: 'not relevant old proposal' }, archived: true };
    }
  } catch (error) {
    console.log(error);
    return { title: { he: '1💗1 |  הצעה לשיתוף משאב שאיננה זמינה', en: 'not relevant old proposal' }, archived: true };
  }
}
export async function load({ locals, params, fetch }) {
  const mId = params.id;
  const lang = locals.lang;
  const tok = locals.tok;
  const uid = locals.uid;
  let que = ``;
  let alld;
  let error;
  let bdata = [];
  let fullfild = false;
  let toc;
  let archived = false;
  if (tok != false) {
    console.log("loged in")
  } else {
        console.log('not loged in');
  }
  
  return {
    uid,
    lang,
    mId,
    tok: tok == false ? false : true,
      alld: await awaitapi(mId,lang,tok,fetch),
      fullfild
  };
}