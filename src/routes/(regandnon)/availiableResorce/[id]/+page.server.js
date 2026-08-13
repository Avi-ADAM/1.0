import { sendToSer } from '$lib/send/sendToSer.js';
import { isAuthFailure } from '$lib/server/session.js';

// The page resolves these with $t — the server has no per-request locale of
// its own to render them in.
const goneTitle = {
  titleKey: 'pages.availResource.titles.gone',
  titleParams: {},
  archived: true
};

async function awaitapi(mId, lang, tok, fetch) {
  let isSer = tok === false;
  // Reported back to the page: the visitor arrived with auth cookies we could
  // not use. Without this the read below fails and the resource is announced as
  // "gone" — a wrong answer to a stale session on a public page.
  let authExpired = false;
  try {
    let res = await sendToSer({ id: mId }, '50GetOpenMashaabimById', null, null, isSer, fetch)
      .catch((error) => {
        if (!isSer && isAuthFailure(null, error)) return null;
        throw error;
      });

    if (!isSer && (res === null || isAuthFailure(res))) {
      // The visitor's token is dead — read the public view as the service.
      authExpired = true;
      isSer = true;
      res = await sendToSer({ id: mId }, '50GetOpenMashaabimById', null, null, true, fetch);
    }

    const node = res?.data?.openMashaabim?.data?.attributes;
    if (node) {
      if (node.archived !== true) {
        const data = { ...node };
        data.archived = false;

        // Source identity (PLAN_HUB_LEV_DEMAND_SYNC round 2): a needed
        // resource can come from a rikma (project), a wish (concierge) or a
        // demand pool (maagad). The maagad relation is read best-effort in its
        // own query so the page keeps working until it's live in Strapi.
        if (!data.project?.data) {
          try {
            const mres = await sendToSer({ id: mId }, 'getOpenMashaabimMaagad', 0, 0, isSer, fetch);
            const maagadNode = mres?.data?.openMashaabim?.data?.attributes?.maagad?.data;
            if (maagadNode?.id) {
              data.maagadInfo = {
                id: String(maagadNode.id),
                name: maagadNode.attributes?.name ?? ''
              };
            }
          } catch (e) {
            // Relation not deployed yet — rikma & wish paths still render.
          }
        }
        const isMaagad = data.source === 'maagad' || !!data.maagadInfo;
        const isConcierge = !isMaagad && (data.source === 'concierge' || !data.project?.data);
        data.titleKey = isMaagad
          ? 'pages.availResource.titles.maagad'
          : isConcierge
            ? 'pages.availResource.titles.wish'
            : 'pages.availResource.titles.project';
        data.titleParams = {
          name: data.name,
          projectName: data.project?.data?.attributes?.projectName ?? ''
        };
        data.fullfild = true;
        return { alld: data, authExpired };
      }
      return { alld: goneTitle, authExpired };
    }
    return { alld: goneTitle, authExpired };
  } catch (error) {
    console.error(`[availiableResorce/${mId}] resource read failed:`, error);
    return { alld: goneTitle, authExpired };
  }
}

export async function load({ locals, params, fetch }) {
  const mId = params.id;
  const lang = locals.lang;
  const tok = locals.tok;
  const uid = locals.uid;
  const fullfild = false;

  const { alld, authExpired } = await awaitapi(mId, lang, tok, fetch);

  return {
    uid,
    lang,
    mId,
    // Cookies we could not use are not a session — render the guest view and
    // let `authExpired` explain why (see the banner on the page).
    tok: tok !== false && !authExpired,
    alld,
    authExpired,
    sessionExpired: locals.sessionExpired === true || authExpired,
    fullfild
  };
}
