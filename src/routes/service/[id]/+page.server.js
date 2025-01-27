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
    toc = tok;
  } else {
    toc = import.meta.env.VITE_ADMINMONTHER;
  }
  que = `{ 
    matanot (id:${mId}) {data{attributes{ name pic{data{attributes{url}}} price quant kindOf desc publishedAt
           archived startDate finnishDate
    projectcreates {data{ id attributes{ projectName
     user_1s{data{id}} restime timeToP profilePic {data{ attributes{url  }}}
      open_missions{data{id attributes{ sqadualed
           archived
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
        }}}
          }}}
        }}}
  }
          `;
  alld = new Promise((resolve) => {
    SendTo(que, toc)
      .then((data) => {
        console.log(data);
        if (data.data.matanot.data != null) {
          const datar = data.data.matanot.data.attributes;
          console.log(datar);
          if (datar.archived != true) {
            const langd = datar//langAdjast(datar, lang);
            data = langd;
            data.archived = false;
            data = data;
            console.log(datar.projectcreates.data)
            data.title = {
              he: `1💗1 | שירות "${datar.name}" בריקמה: ${datar.projectcreates.data[0].attributes.projectName}`,
              en: `1💗1 | come see this service "${datar.name}" on freeMates:"${datar.projectcreates.data[0].attributes.projectName}"`
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
