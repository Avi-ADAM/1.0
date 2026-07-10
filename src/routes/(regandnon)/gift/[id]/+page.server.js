import { sendToSer } from '$lib/send/sendToSer.js';
import { qids } from '../../../api/send/qids.js';

async function fetchPendingForMatanot(fetchFn, tok, uid, matId) {
  try {
    const query = qids['125userPendingForMatanot'];
    if (!query) return [];
    const endpoint = import.meta.env.VITE_URL + '/graphql';
    const res = await fetchFn(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
      body: JSON.stringify({ query, variables: { uid, matId } })
    });
    const json = await res.json();
    return json?.data?.sheirutpends?.data ?? [];
  } catch {
    return [];
  }
}

export async function load({ locals, params, fetch }) {
  const mId = params.id;
  const lang = locals.lang;
  const tok = locals.tok;
  const uid = locals.uid;
  console.log('tok', tok);
  console.log('uid', uid);
  const isSer = tok === false;

  let alld = null;
  let archived = false;
  let existingRequests = [];
  let personalSeller = null;

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

  // Personal product (PLAN_USER_OFFERINGS M3): show the owning user as the
  // seller instead of the (auto-created) home rikma. Separate tiny query so
  // 48GetServiceById stays untouched (qids are append-only).
  if (alld) {
    try {
      const metaRes = await sendToSer({ id: mId }, '266getMatanotSellerMeta', null, null, isSer, fetch);
      const meta = metaRes?.data?.matanot?.data?.attributes;
      if (meta?.origin === 'personal' && meta?.owner_user?.data) {
        const ownerNode = meta.owner_user.data;
        personalSeller = {
          id: String(ownerNode.id),
          username: ownerNode.attributes?.username ?? '',
          picUrl:
            ownerNode.attributes?.profilePic?.data?.attributes?.formats?.small?.url ||
            ownerNode.attributes?.profilePic?.data?.attributes?.url ||
            null
        };
      }
    } catch (e) {
      console.warn('seller meta load failed (non-fatal)', e);
    }
  }

  if (tok && tok !== false && uid) {
    existingRequests = await fetchPendingForMatanot(fetch, tok, String(uid), mId);
    console.log('existingRequests', existingRequests);
  }

  // Extract project users and membership from already-loaded product data
  const projectUsers = alld?.projectcreates?.data?.[0]?.attributes?.user_1s?.data ?? [];
  const isMember = uid ? projectUsers.some((u) => String(u.id) === String(uid)) : false;

  return {
    uid,
    lang,
    mId,
    tok: tok == false ? false : true,
    archived,
    alld,
    existingRequests,
    projectUsers,
    isMember,
    personalSeller
  };
}


