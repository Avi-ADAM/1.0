import { sendToSer } from '$lib/send/sendToSer.js';
import { computeCoverage } from '$lib/revenue/computeCoverage';

/**
 * Public support / home page (PLAN_VOLUNTEER_RIKMA §3).
 *
 * The coverage math runs here, server-side, and only its aggregates travel to
 * the client — raw sales / halukas / finished-mission rows never leave the
 * server, so the public page can be shared freely (an amuta's homepage)
 * without exposing per-member money data.
 *
 * The page is gated by `project.supportPage` (§7): `off` (or null-legacy) is
 * unpublished, `members` is for identified site users, `public` is for anyone.
 * A rikma member always sees it (to preview / toggle), with a banner noting the
 * live gate.
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
  const uid = locals.uid ? String(locals.uid) : null;
  const isRegisteredUser = tok !== false;
  depends(`project-support:${projectId}`);

  const projectData = await fetchSupportData(projectId, tok, fetch);

  const attrs = projectData?.attributes;
  const gate = attrs?.supportPage ?? 'off';
  const memberIds = (attrs?.user_1s?.data ?? []).map((m) => String(m.id));
  const isMember = uid ? memberIds.includes(uid) : false;

  // Gate: members always see it (preview/toggle); visitors per supportPage.
  const canView =
    isMember ||
    gate === 'public' ||
    (gate === 'members' && isRegisteredUser);

  if (!projectData || !attrs) {
    return { projectId, lang: locals.lang, isRegisteredUser, gate, isMember, available: false, projectData: null, coverage: null };
  }

  if (!canView) {
    // Don't ship the full project payload to someone who may not view it —
    // just enough for a friendly "not available" screen + login prompt.
    return {
      projectId,
      lang: locals.lang,
      isRegisteredUser,
      gate,
      isMember: false,
      available: false,
      projectData: {
        id: projectData.id,
        attributes: {
          projectName: attrs.projectName,
          profilePic: attrs.profilePic ?? null
        }
      },
      coverage: null
    };
  }

  const coverage = computeCoverage({
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

  // The member list, trimmed to what the donation dialog needs (id + name).
  const members = (attrs.user_1s?.data ?? []).map((m) => ({
    id: String(m.id),
    username: m.attributes?.username ?? ''
  }));

  return {
    projectId,
    lang: locals.lang,
    isRegisteredUser,
    uid,
    gate,
    isMember,
    available: true,
    members,
    projectData,
    coverage
  };
};
