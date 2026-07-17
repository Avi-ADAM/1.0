import { sendToSer } from '$lib/send/sendToSer.js';
import { computeCoverage } from '$lib/revenue/computeCoverage';

/**
 * Public support / home page (PLAN_VOLUNTEER_RIKMA §3).
 *
 * The coverage math runs here, server-side, and only its aggregates travel to
 * the client — raw sales / halukas / finished-mission rows never leave the
 * server, so the public page can be shared freely (an amuta's homepage)
 * without exposing per-member money data.
 */
async function fetchSupportData(projectId, tok, fetch) {
  const isSer = tok === false;
  try {
    const data = await sendToSer(
      { id: projectId },
      '213publicSupportPage',
      null,
      null,
      isSer,
      fetch
    );
    return data?.data?.project?.data ?? null;
  } catch (error) {
    console.error('Error fetching support page data:', error);
    return null;
  }
}

export const load = async ({ locals, params, fetch, depends }) => {
  const projectId = params.id;
  const tok = locals.tok;
  depends(`project-support:${projectId}`);

  const projectData = await fetchSupportData(projectId, tok, fetch);

  let coverage = null;
  if (projectData?.attributes) {
    const attrs = projectData.attributes;
    coverage = computeCoverage({
      finishedMissions: (attrs.finnished_missions?.data ?? []).map(
        (d) => d.attributes ?? {}
      ),
      sales: (attrs.sales?.data ?? []).map((d) => ({
        in: d.attributes?.in,
        note: d.attributes?.note,
        holderStatus: d.attributes?.holderStatus,
        date: d.attributes?.date,
        hasProduct: Boolean(d.attributes?.matanot?.data)
      })),
      halukas: (attrs.halukas?.data ?? []).map((d) => d.attributes ?? {}),
      openMissions: (attrs.open_missions?.data ?? []).map((d) => ({
        id: d.id,
        name: d.attributes?.name,
        noofhours: d.attributes?.noofhours,
        perhour: d.attributes?.perhour,
        assigned: (d.attributes?.users?.data ?? []).length > 0
      }))
    });

    // The aggregates above are all the page needs — drop the raw money rows
    // so they never reach the (public) client.
    delete attrs.finnished_missions;
    delete attrs.sales;
    delete attrs.halukas;
  }

  return {
    projectId,
    lang: locals.lang,
    isRegisteredUser: tok !== false,
    projectData,
    coverage
  };
};
