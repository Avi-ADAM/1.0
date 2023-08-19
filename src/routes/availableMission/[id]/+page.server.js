import { SendTo } from '$lib/send/sendTo.svelte';
import { langAdjast } from '$lib/func/langAdjast.svelte';
export async function load({ locals, params }) {
  const mId = params.id;
  const lang = locals.lang;
  const tok = locals.tok;
  const uid = locals.uid
  let que, alld
  let error;
  let bdata = []
  let fullfild = false
  let toc;
  let archived = false
  if (tok != false) {
    que = `{  openMission (id:${mId}) {data{attributes{ sqadualed
             archived
             users{data{id}}
      project {data{ id attributes{ projectName timeToP profilePic {data{ attributes{url  }}}}}}
            tafkidims {data{attributes{roleDescription ${
              lang == 'he'
                ? 'localizations{data{attributes{ roleDescription }}}'
                : ''
            }}}}
            skills {data{attributes{skillName ${
              lang == 'he' ? 'localizations{data{attributes{skillName }}}' : ''
            }}}}
            descrip
            hearotMeyuchadot
            name dates
            work_ways {data{attributes{workWayName ${
              lang == 'he'
                ? 'localizations{data{attributes{workWayName }}}'
                : ''
            }}}}
            noofhours perhour   }}}
        }`;
    toc = tok;
  } else {
    que = `{  openMission (id:${mId}) {data{attributes{ descrip
      archived noofhours perhour   
      tafkidims {data{attributes{roleDescription ${
        lang == 'he' ? 'localizations{data{attributes{ roleDescription }}}' : ''
      }}}}
            skills {data{attributes{skillName ${
              lang == 'he' ? 'localizations{data{attributes{skillName }}}' : ''
            }}}}
            work_ways {data{attributes{workWayName ${
              lang == 'he'
                ? 'localizations{data{attributes{workWayName }}}'
                : ''
            }}}}
            name project {data{ id attributes{ projectName profilePic {data{ attributes{url  }}}}}}}}}}
            `;
    toc = import.meta.env.VITE_ADMINMONTHER;
  }
  alld = new Promise((resolve) => {
    SendTo(que, toc)
      .then((data) => {
        console.log(data);
        if (data.data.openMission.data != null) {
          const datar = data.data.openMission.data.attributes;
          console.log(datar);
          if (datar.archived != true) {
            const langd = langAdjast(datar, lang);
            data = langd;
            data.archived = false;
            data = data;
            data.title = {
              he: `1💗1 | הצעה למשימה "${data.name}" בריקמה: ${data.project.data.attributes.projectName}`,
              en: 'come see this mission on    '
            };
            data.fullfild = true
                                  console.log(fullfild);

          } else {
            data = { archived: true };
            data = data;
            archived = true;
            data.fullfild = true;
          }
        } else {
          data = null;
                      data.fullfild = true;
                      console.log(fullfild);
        }
        return resolve(data);
      })
      .catch((error) => {
        console.log(error);
      });
  });
  return {
    uid,
    lang,
    mId,
    tok: tok == false ? false : true,
    archived,
      alld,
      fullfild
  };
}
