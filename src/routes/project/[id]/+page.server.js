import { SendTo } from '$lib/send/sendTo.svelte';

async function awaitapi(projectId, lang, tok) {
  let que, toc;
  if (tok != false) {
    que = `{
      project (id:${projectId}) {
        data {
          attributes {
            projectName
            user_1s {
              data {
                id
                attributes {
                  username
                  profilePic {
                    data {
                      attributes {
                        url
                      }
                    }
                  }
                }
              }
            }
            linkToWebsite
            restime
            sheiruts(filters:{isApruved:{eq: true} }){
              data {
                id
                attributes {
                  name
                  descrip
                  equaliSplited
                  oneTime
                  isApruved
                }
              }
            }
            githublink
            fblink
            discordlink
            twiterlink
            vallues {
              data {
                attributes {
                  valueName ${lang == 'he' ? 'localizations{data{attributes{ valueName }}}' : ''}
                }
              }
            }
            publicDescription
            profilePic {
              data {
                attributes {
                  url
                  formats
                }
              }
            }
            open_missions (filters:{archived:{eq: false} }) {
              data {
                id
                attributes {
                  name
                }
              }
            }
          }
        }
      }
    }`;
    toc = tok;
  } else {
    // For unauthenticated users, fetch only public data
    que = `{
      project (id:${projectId}) {
        data {
          attributes {
            projectName
            user_1s {
              data {
                id
                attributes {
                  username
                  profilePic {
                    data {
                      attributes {
                        url
                      }
                    }
                  }
                }
              }
            }
            linkToWebsite
            sheiruts(filters:{isApruved:{eq: true} }){
              data {
                id
                attributes {
                  name
                  descrip
                  equaliSplited
                  oneTime
                  isApruved
                }
              }
            }
            githublink
            fblink
            discordlink
            twiterlink
            vallues {
              data {
                attributes {
                  valueName ${lang == 'he' ? 'localizations{data{attributes{ valueName }}}' : ''}
                }
              }
            }
            publicDescription
            profilePic {
              data {
                attributes {
                  url
                  formats
                }
              }
            }
            open_missions (filters:{archived:{eq: false} }) {
              data {
                id
                attributes {
                  name
                }
              }
            }
          }
        }
      }
    }`;
    toc = import.meta.env.VITE_ADMINMONTHER; // Use admin token for public access
  }

  let projectData = null;
  try {
    console.log("TRAYIOs")
    const data = await SendTo(que, toc);
    console.log(data)
    if (data.data.project.data != null) {
      projectData = data.data.project.data;
      console.log(projectData)
    }
  } catch (error) {
    console.error("Error fetching project data:", error);
    projectData = null;
  }
  return projectData;
}

export const load = async ({ locals, params }) => {
  const projectId = params.id;
  const lang = locals.lang;
  const tok = locals.tok;
  const uid = locals.uid;
console.log(projectId)
  let isRegisteredUser = tok != false;
console.log(isRegisteredUser)
  return {
    projectId,
    lang,
    tok: tok == false ? false : true,
    projectData: await awaitapi(projectId, lang, tok),
    isRegisteredUser,
  };
};
