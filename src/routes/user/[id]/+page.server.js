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
  };
};
