import { qids } from '../../api/send/qids.js';

export async function load({ locals, fetch }) {
  const tok = locals.tok;
  const uid = locals.uid;
  const lang = locals.lang;

  let products = [];
  let projects = [];
  let projectUsersMap = {};

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
    projectUsersMap
  };
}
