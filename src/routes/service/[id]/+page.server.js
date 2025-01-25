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
    que = `{  sheirut (id:${mId}) {data{attributes{ sqadualed
             archived isApruved
      project {data{ id attributes{ projectName user_1s{data{id}} restime timeToP profilePic {data{ attributes{url  }}}}}}
            descrip
            name dates 
       }}}
        }`;
    toc = tok;
  } else {
    que = `{ 
      matanot (id:${mId}) {data{attributes{ name  price quant kindOf
             archived
      projectcreate {data{ id attributes{ projectName openMission{data{id attributes{ sqadualed
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
            noofhours perhour 
          }}  
          profilePic {data{ attributes{url  }}}}}}
           
       }}}
    }
            `;
    toc = import.meta.env.VITE_ADMINMONTHER;
  }
  alld = new Promise((resolve) => {
    SendTo(que, toc)
      .then((data) => {
        console.log(data);
        if (data.data.sheirut.data != null) {
          const datar = data.data.sheirut.data.attributes;
          console.log(datar);
          if (datar.archived != true) {
            const langd = langAdjast(datar, lang);
            data = langd;
            data.archived = false;
            data = data;
            data.title = {
              he: `1💗1 | שירות "${datar.name}" בריקמה: ${datar.project.data.attributes.projectName}`,
              en: `1💗1 | come see this service "${datar.name}" on freeMates:"${datar.project.data.attributes.projectName}"`
            };
            data.fullfild = true;
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
