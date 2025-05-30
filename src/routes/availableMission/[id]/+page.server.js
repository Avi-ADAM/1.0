import { SendTo } from '$lib/send/sendTo.svelte';
import { langAdjast } from '$lib/func/langAdjast.svelte';

async function awaitapi(mId,lang,tok) {
  let que, toc
    if (tok != false) {
      que = `{  openMission (id:${mId}) {data{attributes{ sqadualed
      archived
            acts{data{attributes{shem}}}

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
que = `{  openMission (id:${mId}) {data{attributes{ sqadualed
      archived
      acts{data{attributes{shem}}}
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
    toc = import.meta.env.VITE_ADMINMONTHER;
  }
 let alld = []
 await SendTo(que, toc)
      .then((data) => {
        console.log(data);
        if (data.data.openMission.data != null) {
          let datar = data.data.openMission.data;
          const langd = langAdjast(datar, lang);
          datar = langd;
          console.log(datar);
          alld = datar;
          alld = alld;
          alld.title = {
            he: `1💗1 | הצעה למשימה "${alld.attributes.name}" בריקמה: ${alld.attributes.project.data.attributes.projectName}`,
            en: `1💗1 | come see this mission "${alld.attributes.name}" on freeMates:"${alld.attributes.project.data.attributes.projectName}"`
          };

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
  console.log(tok);
  const uid = locals.uid
  let que, alld
  let error;
  let bdata = []
  let fullfild = false
  let toc;
  let archived = false
  if (tok != false) {
    toc = tok;
  } else {
    toc = import.meta.env.VITE_ADMINMONTHER;
  }
  
  return {
    uid,
    lang,
    mId,
    tok: tok == false ? false : true,
      alld: await awaitapi(mId,lang,toc),
      fullfild
  };
}

