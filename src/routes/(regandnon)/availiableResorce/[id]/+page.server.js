import { sendToSer } from '$lib/send/sendToSer.js';

// The page resolves these with $t — the server has no per-request locale of
// its own to render them in.
const goneTitle = {
  titleKey: 'pages.availResource.titles.gone',
  titleParams: {},
  archived: true
};

async function awaitapi(mId, lang, tok, fetch) {
  const isSer = tok === false;
  try {
    const res = await sendToSer({ id: mId }, '50GetOpenMashaabimById', null, null, isSer, fetch);
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
        return data;
      }
      return goneTitle;
    }
    return goneTitle;
  } catch (error) {
    console.log(error);
    return goneTitle;
  }
}

export async function load({ locals, params, fetch }) {
  const mId = params.id;
  const lang = locals.lang;
  const tok = locals.tok;
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
