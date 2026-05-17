import { sendToSer } from '$lib/send/sendToSer.js';

export async function load({ locals, params, fetch }) {
  const mId = params.id;
  const lang = locals.lang;
  const tok = locals.tok;
  const uid = locals.uid;

  const isSer = tok === false;

  let alld = null;

  try {
    const res = await sendToSer({ id: mId }, '48GetServiceById', null, null, isSer, fetch);
    const dataNode = res?.data?.matanot?.data;
    const node = dataNode?.attributes || null;
    if (node) alld = { ...node, id: dataNode.id };
  } catch (e) {
    console.error('product edit load error', e);
  }

  return {
    uid,
    lang,
    mId,
    tok: tok == false ? false : true,
    alld
  };
}
