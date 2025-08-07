import { sendToSer } from '$lib/send/sendToSer.js';
import { langAdjast } from '$lib/func/langAdjast.svelte';

async function awaitapi(userId, lang, tok) {
  let userData = null;
  try {
    const isSer = tok === false;
    const data = await sendToSer({ uid: userId }, '43UserById', null, null, isSer, fetch);
    if (data?.data?.usersPermissionsUser?.data) {
      userData = data.data.usersPermissionsUser.data;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    userData = null;
  }
  return userData;
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
    userData: await awaitapi(userId, lang, tok),
    isRegisteredUser,
  };
};
