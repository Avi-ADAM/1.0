/**
 * @typedef {import('$lib/types/strapiTypes').StrapiResponse} StrapiResponse
 * @typedef {import('$lib/types/strapiTypes').StrapiEntity} StrapiEntity
 */

import { sendToSer } from '$lib/send/sendToSer.js';
import { langAdjast } from '$lib/func/langAdjast.svelte';
import { redirect } from '@sveltejs/kit';

/**
 * Fetch mission data from the API with authentication handling.
 * 
 * @param {string} mId - Mission ID to fetch
 * @param {string} lang - Language code ('he' or 'en')
 * @param {string | false} tok - Authentication token or false for server-side
 * @param {typeof globalThis.fetch} fetch - Fetch function from SvelteKit
 * @returns {Promise<any | null>} Mission data with language adjustments, or null if not found
 * 
 * @throws {import('@sveltejs/kit').Redirect} Redirects to login if authentication fails
 * 
 * @example
 * const mission = await awaitapi('123', 'he', token, fetch);
 * // Returns mission data with localized fields
 */
async function awaitapi(mId, lang, tok, fetch) {
  const isSer = tok === false;
  try {
    /** @type {StrapiResponse<{ openMission: StrapiEntity<any> }>} */
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

/**
 * SvelteKit server load function for the available mission page.
 * Fetches mission data and prepares it for the page component.
 * 
 * @param {Object} params - SvelteKit load function parameters
 * @param {Object} params.locals - Server-side locals with user data
 * @param {string} params.locals.lang - User's language preference
 * @param {string | false} params.locals.tok - Authentication token
 * @param {string} params.locals.uid - User ID
 * @param {Object} params.params - URL parameters
 * @param {string} params.params.id - Mission ID from URL
 * @param {typeof globalThis.fetch} params.fetch - SvelteKit fetch function
 * 
 * @returns {Promise<{
 *   uid: string,
 *   lang: string,
 *   mId: string,
 *   tok: boolean,
 *   alld: any | null,
 *   fullfild: boolean
 * }>} Page data for the component
 * 
 * @example
 * // In +page.svelte:
 * let { data } = $props();
 * // data.alld contains the mission information
 * // data.uid contains the user ID
 */
export async function load({ locals, params, fetch }) {
  /** @type {string} */
  const mId = params.id;
  
  /** @type {string} */
  const lang = locals.lang;
  
  /** @type {string | false} */
  const tok = locals.tok;
  console.log(tok);
  
  /** @type {string} */
  const uid = locals.uid;
  
  /** @type {boolean} */
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
