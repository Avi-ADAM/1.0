import { qids } from '../../api/send/qids.js';
import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';

export async function load({ locals, fetch }) {
  const uid = locals.uid;
  const tok = locals.tok;
  const lang = locals.lang;

  let products = [];
  let projects = [];
  let projectUsersMap = {};
  let openSaleClaims = []; // PLAN_sale_holder_consent — my open claims as reporter
  let username = '';
  let profilePic = '';

  try {
    const endpoint = STRAPI_GRAPHQL;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tok}`
      },
      body: JSON.stringify({
        query: qids['saleCenterUserProducts'],
        variables: { uid: String(uid) }
      })
    });
    const json = await res.json();

    const userAttrs = json?.data?.usersPermissionsUser?.data?.attributes ?? {};
    username = userAttrs.username || '';
    profilePic = userAttrs.profilePic?.data?.attributes?.url || '';

    const projectsData = userAttrs.projects_1s?.data ?? [];

    const projectsMap = new Map();

    projectsData.forEach((project) => {
      projectsMap.set(project.id, {
        id: project.id,
        name: project.attributes.projectName,
        profilePic: project.attributes.profilePic
      });

      projectUsersMap[project.id] = project.attributes.user_1s?.data ?? [];

      const matanotofs = project.attributes?.matanotofs?.data ?? [];
      matanotofs.forEach((product) => {
        product.attributes.projectcreates = {
          data: [
            {
              id: project.id,
              attributes: {
                projectName: project.attributes.projectName,
                profilePic: project.attributes.profilePic
              }
            }
          ]
        };
        products.push(product);
      });

      // Open saleClaim decisions where I'm the reporter — surface whether
      // it's my turn (waiting on the holder) or the holder's turn to
      // respond (PLAN_sale_holder_consent).
      const decisions = project.attributes?.decisions?.data ?? [];
      decisions.forEach((d) => {
        const sale = d.attributes?.sale?.data;
        const reporterId = String(sale?.attributes?.reporter?.data?.id ?? '');
        if (!sale || reporterId !== String(uid)) return;
        const standingOrder = (d.attributes?.negom?.length ?? 0) + 1;
        const vots = d.attributes?.vots ?? [];
        const iSigned = vots.some(
          (v) =>
            String(v?.users_permissions_user?.data?.id ?? '') === String(uid) &&
            Number(v.order) === standingOrder &&
            v.what
        );
        openSaleClaims.push({
          decisionId: d.id,
          saleId: sale.id,
          projectId: project.id,
          projectName: project.attributes.projectName,
          holderName: sale.attributes?.users_permissions_user?.data?.attributes?.username ?? '',
          productName: sale.attributes?.matanot?.data?.attributes?.name ?? '',
          myTurn: !iSigned
        });
      });
    });

    projects = Array.from(projectsMap.values());
  } catch (e) {
    console.error('sales-center load error', e);
  }

  // Recurring sales (PLAN_RECURRING_SALES): my pending monthly report cycles
  // as the money-holder — one card per cycle, settled by reporting the actual
  // amount that came in this month.
  let pendingCycles = [];
  try {
    const res = await fetch(STRAPI_GRAPHQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tok}`
      },
      body: JSON.stringify({
        query: qids['saleCenterPendingCycles'],
        variables: { uid: String(uid) }
      })
    });
    const json = await res.json();
    pendingCycles = (json?.data?.sales?.data ?? []).map((s) => {
      const at = s.attributes ?? {};
      return {
        id: s.id,
        cycleStart: at.cycleStart,
        cycleEnd: at.cycleEnd,
        note: at.note ?? '',
        customerAmount: at.customerAmount ?? null,
        customerReportedAt: at.customerReportedAt ?? null,
        customerName: at.customer?.data?.attributes?.username ?? '',
        productName: at.matanot?.data?.attributes?.name ?? '',
        projectName: at.project?.data?.attributes?.projectName ?? '',
        engineId: at.recurringSource?.data?.id ?? null,
        expectedAmount: at.recurringSource?.data?.attributes?.in ?? null
      };
    });
  } catch (e) {
    console.error('sales-center pending cycles load error', e);
  }

  return {
    uid,
    lang,
    products,
    projects,
    projectUsersMap,
    openSaleClaims,
    pendingCycles,
    user: {
      username,
      profilePic
    }
  };
}
