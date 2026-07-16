import { sendToSer } from '$lib/send/sendToSer.js';

const goneTitle = {
  title: { he: '1💗1 |  הצעה לשיתוף משאב שאיננה זמינה', en: 'not relevant old proposal' },
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
        data.title = isMaagad
          ? {
              he: `1💗1 | משאב מבוקש במאגד ביקוש: "${data.name}"`,
              en: `1💗1 | Demand-pool resource: "${data.name}"`
            }
          : isConcierge
            ? {
                he: `1💗1 | משאב מבוקש ממשאלה: "${data.name}"`,
                en: `1💗1 | Wish resource: "${data.name}"`
              }
            : {
                he: `1💗1 | הצעה לשיתוף משאב "${data.name}" בריקמה: ${data.project?.data?.attributes?.projectName}`,
                en: 'come see this proposal on'
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
