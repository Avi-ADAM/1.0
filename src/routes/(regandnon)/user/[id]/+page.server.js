import { sendToSer } from '$lib/send/sendToSer.js';
import { langAdjast } from '$lib/func/langAdjast.svelte';


async function awaitapi(userId, lang, tok, fetch) {
  const isSer = tok === false;
  let userData = null;
  try {
    const data = await sendToSer({ id: userId }, '52GetUserById', null, null, isSer, fetch);
    console.log(data);
    if (data.data.usersPermissionsUser.data != null) {
      let datar = data.data.usersPermissionsUser.data;
      userData = datar;
      console.log(userData);
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    userData = null;
  }
  return userData;
}

// Public storefront (PLAN_USER_OFFERINGS §4.5 / M7): the user's
// customer-facing offerings — products, resources offered for sale, and
// priced mission offers. Non-fatal: the page renders without it.
async function fetchStorefront(userId, tok, fetch) {
  // Always read via the service token: this is public storefront data, and
  // logged-in viewers' JWTs may lack find permission on newer collections.
  try {
    const res = await sendToSer({ uid: String(userId) }, '268getUserStorefront', null, null, true, fetch);
    const d = res?.data ?? {};
    return {
      resources: (d.sps?.data ?? []).filter(
        (s) => s.attributes?.matanot?.data && !s.attributes.matanot.data.attributes?.archived
      ),
      missionOffers: d.missionOffers?.data ?? [],
      products: (d.matanots?.data ?? []).filter((m) => !m.attributes?.sp?.data)
    };
  } catch (e) {
    console.warn('storefront load failed (non-fatal):', e);
    return { resources: [], missionOffers: [], products: [] };
  }
}

export const load = async ({ locals, params, fetch }) => {
  const userId = params.id;
  const lang = locals.lang;
  const tok = locals.tok;
  const uid = locals.uid;

  let isRegisteredUser = tok != false;
  console.log(isRegisteredUser);
  return {
    userId,
    lang,
    tok: tok == false ? false : true,
    userData: await awaitapi(userId, lang, tok, fetch),
    isRegisteredUser,
    storefront: await fetchStorefront(userId, tok, fetch),
  };
};
