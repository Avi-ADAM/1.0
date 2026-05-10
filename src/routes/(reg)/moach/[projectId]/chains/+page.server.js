import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function load({ params, cookies, fetch }) {
  const projectId = params.projectId;
  const token = cookies.get('tok') || cookies.get('jwt');
  
  if (!token) {
    throw error(401, 'Unauthorized');
  }

  const query = `
    query GetChainsExtra($id: ID!) {
      project(id: $id) {
        data {
          attributes {
            open_mashaabims(filters: { archived: { ne: true } }) {
              data { id attributes { name descrip spnot createdAt price easy hm kindOf partofs { data { id } } } }
            }
            extraArchiveBmi: mesimabetahaliches(filters: { finnished: { eq: true } }) {
              data {
                id
                attributes {
                  name status iskvua finnished howmanyhoursalready perhour hoursassinged createdAt start dates
                  hearotMeyuchadot descrip admaticedai privatlinks publicklinks
                  monter { monthStart hours isDone hoursDone }
                  forums { data { id } }
                  open_missions { data { id } }
                  finiapruvals { data { id attributes { missname archived } } }
                  tafkidims { data { id attributes { roleDescription localizations { data { attributes { roleDescription } } } } } }
                  acts { data { id attributes { shem dateS hashivut naasa des dateF myIshur valiIshur status
                    my { data { id attributes { username profilePic { data { attributes { url } } } } } }
                    vali { data { id } }
                    mesimabetahaliches { data { id } }
                  } } }
                  users_permissions_user { data { id attributes { username profilePic { data { attributes { url } } } } } }
                }
              }
            }
            extraArchivePm: pendms(filters: { archived: { eq: true } }) {
              data { id attributes { name descrip noofhours perhour createdAt } }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(`${env.VITE_URL || 'http://127.0.0.1:1337'}/graphql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables: { id: projectId } })
    });
    
    const json = await res.json();
    return {
      chainsServerData: json?.data?.project?.data?.attributes || null
    };
  } catch (err) {
    console.error('Failed to load chains server data:', err);
    return { chainsServerData: null };
  }
}
