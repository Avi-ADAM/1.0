import { sendToSer } from '$lib/send/sendToSer.js';
import { langAdjast } from '$lib/func/langAdjast.svelte';
import { redirect } from '@sveltejs/kit';

async function awaitapi(mId, lang, tok, fetch) {
  const isSer = tok === false;
  try {
    const res = await sendToSer(
      { id: mId },
      '51GetOpenMissionById',
      null,
      null,
      isSer,
      fetch
    );

    // Check for authentication errors
    if (res?.error && res.error.status === 401) {
      throw redirect(302, `/login?from=availableMission/${mId}`);
    }

    if (res?.errors) {
      // Check for GraphQL authentication errors
      const authError = res.errors.find(
        (error) =>
          error.message === 'Invalid token.' ||
          error.extensions?.code === 'UNAUTHENTICATED' ||
          error.message.includes('401') ||
          error.message.includes('Unauthorized')
      );

      if (authError) {
        throw redirect(302, `/login?from=availableMission/${mId}`);
      }
    }

    const node = res?.data?.openMission?.data;
    if (node) {
      const langd = langAdjast(node, lang);
      const alld = { ...langd };
      alld.title = {
        he: `1💗1 | הצעה למשימה "${alld.attributes.name}" בריקמה: ${alld.attributes.project.data.attributes.projectName}`,
        en: `1💗1 | come see this mission "${alld.attributes.name}" on freeMates:"${alld.attributes.project.data.attributes.projectName}"`
      };
      return alld;
    }
    return null;
  } catch (error) {
    // Re-throw redirect errors
    if (error.status === 302) {
      throw error;
    }
    console.log(error);
    return null;
  }
}
export async function load({ locals, params, fetch }) {
  const mId = params.id;
  const lang = locals.lang;
  const tok = locals.tok;
  console.log(tok);
  const uid = locals.uid;
  const fullfild = false;

  return {
    uid,
    lang,
    mId,
    tok: tok == false ? false : true,
    alld: await awaitapi(mId, lang, tok, fetch),
    fullfild
  };
}
