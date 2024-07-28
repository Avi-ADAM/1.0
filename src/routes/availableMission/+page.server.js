import { SendTo } from '$lib/send/sendTo.svelte';
import { langAdjast } from '$lib/func/langAdjast.svelte';

async function awaitapi(lang,tok) {
  let que, toc
    if (tok != false) {
    que = `{  openMissions {data{id attributes{ sqadualed
             archived
             users{data{id}}
      project {data{ id attributes{ projectName user_1s{data{id}} restime timeToP profilePic {data{ attributes{url  }}}}}}
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
            name dates iskvua
            work_ways {data{attributes{workWayName ${
              lang == 'he'
                ? 'localizations{data{attributes{workWayName }}}'
                : ''
            }}}}
            noofhours perhour   }}}
        }`;
    toc = tok;
  } else {
    que = `{  openMissions {data{attributes{ descrip
      archived noofhours perhour iskvua sqadualed dates
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
 let alld = []
 await SendTo(que, toc)
      .then((data) => {
        console.log(data);
        if (data.data.openMissions.data != null) {
          let datar = data.data.openMissions.data;
          const reformatArray = arr => arr.map(({id, attributes}) => ({id, ...attributes}));
          datar = reformatArray(datar);
          console.log(datar);
          alld = datar;
       //   const langd = langAdjast(datar, lang);

          alld = alld;
         /* data.title = {
            he: `1💗1 | הצעה למשימה "${data.name}" בריקמה: ${data.project.data.attributes.projectName}`,
            en: `1💗1 | come see this mission "${data.name}" on freeMates:"${data.project.data.attributes.projectName}"`
          };*/
        } else {
          data = null;
                      data.fullfild = true;
                      console.log(fullfild);
        }
        return alld;
      })
      .catch((error) => {
        console.log(error);
        alld = error;
      });
  return alld
}
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
    que = `{  openMissions {data{id attributes{ sqadualed
             archived
             users{data{id}}
      project {data{ id attributes{ projectName user_1s{data{id}} restime timeToP profilePic {data{ attributes{url  }}}}}}
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
            name dates iskvua
            work_ways {data{attributes{workWayName ${
              lang == 'he'
                ? 'localizations{data{attributes{workWayName }}}'
                : ''
            }}}}
            noofhours perhour   }}}
        }`;
    toc = tok;
  } else {
    que = `{  openMissions {data{attributes{ descrip
      archived noofhours perhour iskvua sqadualed dates
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
    uid,
    lang,
    mId,
    tok: tok == false ? false : true,
      alld: await awaitapi(lang,tok),
      fullfild
  };
}
