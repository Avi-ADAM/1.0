import { qids } from '../../api/send/qids.js';

export async function load({ locals, fetch }) {
  const tok = locals.tok;
  const uid = locals.uid;
  const lang = locals.lang;

  let products = [];
  let projects = [];
  let projectUsersMap = {};
  let openSaleClaims = []; // PLAN_sale_holder_consent — my open claims as reporter

  if (tok && tok !== false && uid) {
    try {
      const endpoint = import.meta.env.VITE_URL + '/graphql';
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

      const projectsData =
        json?.data?.usersPermissionsUser?.data?.attributes?.projects_1s?.data ?? [];

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
  }

  return {
    tok: tok == false ? false : true,
    uid,
    lang,
    products,
    projects,
    projectUsersMap,
    openSaleClaims
  };
}
