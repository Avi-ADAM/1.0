import { sendToSer } from '$lib/send/sendToSer.js';

export async function load({ locals, params, fetch }) {
  const mId = params.id;
  const lang = locals.lang;
  const tok = locals.tok;
  const uid = locals.uid;

  const isSer = tok === false;

  let alld = null;
  let archived = false;

  try {
    const res = await sendToSer({ id: mId }, '48GetServiceById', null, null, isSer, fetch);
    const dataNode = res?.data?.matanot?.data;
    const node = dataNode?.attributes || null;
    if (node) {
      archived = node.archived === true;
      const title = {
        he: `1💗1 | מוצר "${node.name}" בריקמה: ${node.projectcreates?.data?.[0]?.attributes?.projectName || ''}`,
        en: `1💗1 | product "${node.name}" on freeMates: ${node.projectcreates?.data?.[0]?.attributes?.projectName || ''}`
      };
      alld = { ...node, id: dataNode.id, title };
    }
  } catch (e) {
    console.error('product load error', e);
  }

  return {
    uid,
    lang,
    mId,
    tok: tok == false ? false : true,
    archived,
    alld
  };
}


