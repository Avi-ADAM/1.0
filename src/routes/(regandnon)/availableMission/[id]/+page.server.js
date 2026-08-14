/**
 * @typedef {import('$lib/types/strapiTypes').StrapiResponse} StrapiResponse
 * @typedef {import('$lib/types/strapiTypes').StrapiEntity} StrapiEntity
 */

import { sendToSer } from '$lib/send/sendToSer.js';
import { langAdjast } from '$lib/func/langAdjast.svelte';
import { isAuthFailure } from '$lib/server/session.js';

/**
 * One read of the mission, either as the visitor (JWT) or as the service.
 * @param {string} mId
 * @param {boolean} isSer
 * @param {typeof globalThis.fetch} fetch
 */
async function readMission(mId, isSer, fetch) {
  /** @type {StrapiResponse<{ openMission: StrapiEntity<any> }>} */
  const res = await sendToSer({ id: mId }, '51GetOpenMissionById', null, null, isSer, fetch);
  return res;
}

/**
 * Fetch mission data, degrading gracefully when the visitor's session is dead.
 *
 * The page is public, so a stale cookie must never hide it (and must never
 * bubble up as a 500): if the JWT read fails on auth, the same read is retried
 * with the service token and the page renders its signed-out state, with
 * `authExpired` telling the component to offer sign-in.
 *
 * @param {string} mId - Mission ID to fetch
 * @param {string} lang - Language code ('he' or 'en')
 * @param {string | false} tok - Authentication token or false for server-side
 * @param {typeof globalThis.fetch} fetch - Fetch function from SvelteKit
 * @returns {Promise<{ alld: any | null, authExpired: boolean, loadError: 'auth'|'notfound'|'server'|null }>}
 *
 * @example
 * const { alld, authExpired } = await awaitapi('123', 'he', token, fetch);
 */
async function awaitapi(mId, lang, tok, fetch) {
  let isSer = tok === false;
  let authExpired = false;
  /** @type {any} */
  let res = null;

  try {
    res = await readMission(mId, isSer, fetch);
    if (!isSer && isAuthFailure(res)) {
      authExpired = true;
      res = null;
    }
  } catch (error) {
    if (!isSer && isAuthFailure(null, error)) {
      authExpired = true;
    } else {
      console.error(`[availableMission/${mId}] mission read failed:`, error);
      return { alld: null, authExpired: false, loadError: 'server' };
    }
    res = null;
  }

  // The visitor's token is dead — read the public view with the service token
  // instead of failing. They still see the mission; they just see it as a guest.
  if (authExpired) {
    isSer = true;
    try {
      res = await readMission(mId, true, fetch);
    } catch (error) {
      console.error(`[availableMission/${mId}] public fallback read failed:`, error);
      return { alld: null, authExpired: true, loadError: 'auth' };
    }
  }

  try {
    const node = res?.data?.openMission?.data;
    if (node) {
      const langd = langAdjast(node, lang);
      const alld = { ...langd };
      const projectName = alld.attributes.project?.data?.attributes?.projectName;

      // Source identity (PLAN_HUB_LEV_DEMAND_SYNC round 2): a need can come
      // from a rikma (project), a wish (concierge / ratson) or a demand pool
      // (maagad). The maagad relation is read best-effort in its own query so
      // the page keeps working until the relation is live in Strapi.
      if (!alld.attributes.project?.data) {
        try {
          const mres = await sendToSer({ id: mId }, 'getOpenMissionMaagad', 0, 0, isSer, fetch);
          const maagadNode = mres?.data?.openMission?.data?.attributes?.maagad?.data;
          if (maagadNode?.id) {
            alld.maagadInfo = {
              id: String(maagadNode.id),
              name: maagadNode.attributes?.name ?? ''
            };
          }
        } catch (e) {
          // Relation not deployed yet / read failed — rikma & wish paths still render.
        }
      }
      const isMaagad = alld.attributes.source === 'maagad' || !!alld.maagadInfo;
      const isConcierge =
        !isMaagad &&
        (alld.attributes.source === 'concierge' || !alld.attributes.project?.data);
      // Resolved on the client with $t — the server has no per-request locale.
      alld.titleKey = isMaagad
        ? 'pages.availMission.titles.maagad'
        : isConcierge
          ? 'pages.availMission.titles.wish'
          : 'pages.availMission.titles.project';
      alld.titleParams = { name: alld.attributes.name, projectName };
      return { alld, authExpired, loadError: null };
    }
    // No node: either the mission is gone, or the read came back with errors.
    return {
      alld: null,
      authExpired,
      loadError: res?.errors ? 'server' : 'notfound'
    };
  } catch (error) {
    console.error(`[availableMission/${mId}] failed to shape mission data:`, error);
    return { alld: null, authExpired, loadError: 'server' };
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
 * @param {boolean} [params.locals.sessionExpired] - hooks.server.js found (and cleared) a dead JWT cookie
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
 *   authExpired: boolean,
 *   loadError: 'auth'|'notfound'|'server'|null,
 *   sessionExpired: boolean,
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
  // Never log the raw JWT — a signed-in flag is all this trace ever needed.
  console.log('[availableMission] signed in:', tok !== false);

  /** @type {string} */
  const uid = locals.uid;

  /** @type {boolean} */
  const fullfild = false;

  const { alld, authExpired, loadError } = await awaitapi(mId, lang, tok, fetch);

  return {
    uid,
    lang,
    mId,
    // A cookie we could not use is not a session: render the guest view, and
    // let `authExpired` explain why and offer the way back in.
    tok: tok !== false && !authExpired,
    alld,
    authExpired,
    loadError,
    // Set once, on the request that found the dead cookie (hooks.server.js).
    sessionExpired: locals.sessionExpired === true || authExpired,
    fullfild
  };
}
