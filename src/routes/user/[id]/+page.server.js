import { SendTo } from '$lib/send/sendTo.svelte';
import { langAdjast } from '$lib/func/langAdjast.svelte';

async function awaitapi(userId, lang, tok) {
  let que, toc;
  if (tok != false) {
    que = `{
      usersPermissionsUser (id:${userId}) {
        data {
          id
          attributes {
            fblink
            twiterlink
            discordlink
            githublink
            bio
            username
            finnished_missions {
              data {
                attributes {
                  missionName
                }
              }
            }
            profilePic {
              data {
                attributes {
                  url
                  formats
                }
              }
            }
            projects_1s {
              data {
                id
                attributes {
                  projectName
                }
              }
            }
            sps (filters: {archived:{eq: false }}) {
              data {
                id
                attributes {
                  name
                  panui
                }
              }
            }
            skills {
              data {
                id
                attributes {
                  skillName 
 localizations{data{attributes{skillName}}}
                }
              }
            }
            tafkidims {
              data {
                id
                attributes {
                  roleDescription  localizations{data{attributes{roleDescription}}}
                }
              }
            }
            vallues {
              data {
                id
                attributes {
                  valueName  localizations{data{attributes{valueName}}}
                }
              }
            }
            work_ways {
              data {
                id
                attributes {
                  workWayName  localizations{data{attributes{workWayName}}}
                }
              }
            }
          }
        }
      }
    }`;
    toc = tok;
  } else {
    que = `{
      usersPermissionsUser (id:${userId}) {
        data {
          id
          attributes {
            fblink
            twiterlink
            discordlink
            githublink
            bio
            username
            finnished_missions {
              data {
                attributes {
                  missionName
                }
              }
            }
            profilePic {
              data {
                attributes {
                  url
                  formats
                }
              }
            }
            projects_1s {
              data {
                id
                attributes {
                  projectName
                }
              }
            }
            sps (filters: {archived:{eq: false }}) {
              data {
                id
                attributes {
                  name
                  panui
                }
              }
            }
            skills {
              data {
                id
                attributes {
                  skillName  localizations{data{attributes{skillName}}}
                }
              }
            }
            tafkidims {
              data {
                id
                attributes {
                  roleDescription  localizations{data{attributes{roleDescription}}}
                }
              }
            }
            vallues {
              data {
                id
                attributes {
                  valueName  localizations{data{attributes{valueName}}}
                }
              }
            }
            work_ways {
              data {
                id
                attributes {
                  workWayName  localizations{data{attributes{workWayName}}}
                }
              }
            }
          }
        }
      }
    }`;
    toc = import.meta.env.VITE_ADMINMONTHER;
  }

  let userData = null;
  try {
    const data = await SendTo(que, toc);
    console.log(data);
    if (data.data.usersPermissionsUser.data != null) {
      let datar = data.data.usersPermissionsUser.data;
      userData = datar;
      console.log(userData);
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    userData = null;
  }
  return userData;
}

export const load = async ({ locals, params }) => {
  const userId = params.id;
  const lang = locals.lang;
  const tok = locals.tok;
  const uid = locals.uid;

  let isRegisteredUser = tok != false;
  console.log(isRegisteredUser);
  return {
    userId,
    lang,
    tok: tok == false ? false : true,
    userData: await awaitapi(userId, lang, tok),
    isRegisteredUser,
  };
};
