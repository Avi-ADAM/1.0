import { redirect } from '@sveltejs/kit';
import { sendToSer } from '$lib/send/sendToSer.js';

/** A product is edited on one page, in its rikma (PLAN_PRODUCT_FORM_UNIFIED). */
export async function load({ locals, params, fetch }) {
  const mId = params.id;
  let projectId = null;

  try {
    const res = await sendToSer({ id: mId }, '48GetServiceById', null, null, locals.tok === false, fetch);
    projectId = res?.data?.matanot?.data?.attributes?.projectcreates?.data?.[0]?.id ?? null;
  } catch (e) {
    console.error('product edit load error', e);
  }

  if (projectId) redirect(307, `/moach/${projectId}/sales/manage/products/${mId}`);
  return { mId };
}
