import { SendTo } from '$lib/send/sendTo.svelte';
import { langAdjast } from '$lib/func/langAdjast.svelte';
export async function load({ locals, params }) {
  const mId = params.id;
  const lang = locals.lang;
  const tok = locals.tok;
  let que;
  let error;
  let bdata = []
  let toc;
  let archived = false
  if (tok != false) {
    que = `{  openMission (id:${mId}) {data{attributes{ sqadualed
             archived
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
  return {
    lang,
    mId,
    tok: tok == false ? false : true,
    archived,
    streamed: {
      alld: new Promise((resolve) => {
        SendTo(que, toc)
          .then((data) => {
            console.log(data)
            if (data.data.openMission.data != null) {
              const datar = data.data.openMission.data.attributes;
              console.log(datar);
              if (datar.archived != true) {
                const langd = langAdjast(datar, lang);
                data = langd;
                data.archived = false;
                data = data;
              data.title = {
                he: `הצעה למשימה בשם "${data.name}" בריקמה: ${data.project.data.attributes.projectName}, באתר 1💗1 `,
                en: 'come see this mission on 1💗1'
              };
              } else {
                data = { archived: true };
                data = data;
                archived = true;
              }
            } else {
              data = null;
            }
            return resolve(data);
          })
          .catch((error) => {
            console.log(error);
          });
      })
    }
  };
}