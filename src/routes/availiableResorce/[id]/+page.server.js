import { SendTo } from '$lib/send/sendTo.svelte';
import { langAdjast } from '$lib/func/langAdjast.svelte';
export async function load({ locals, params }) {
  const mId = params.id;
  const lang = locals.lang;
  const tok = locals.tok;
  const uid = locals.uid;
  let que = `{ openMashaabim (id:${mId}) { data {id attributes{ archived price descrip spnot kindOf
        sqadualedf sqadualed linkto createdAt hm name easy 
        declinedsps {data{ id }} 
        users {data{ id }} 
        mashaabim{data{id}}
        project {data{ id attributes{ restime projectName user_1s{data{id}} 
            restime timeToP profilePic {data{ attributes{url  }}}
          }}}
      }}}
        }`;
  let alld;
  let error;
  let bdata = [];
  let fullfild = false;
  let toc;
  let archived = false;
  if (tok != false) {
    toc = tok;
  } else {
    toc = import.meta.env.VITE_ADMINMONTHER;
  }
  alld = new Promise((resolve) => {
    SendTo(que, toc)
      .then((data) => {
        console.log(data);
        if (data.data.openMashaabim.data != null) {
          const datar = data.data.openMashaabim.data.attributes;
          console.log(datar);
          if (datar.archived != true) {
            data = datar
            data.archived = false;
            data.title = {
              he: `1💗1 | הצעה לשיתוף משאב 
              "${data.name}" 
              בריקמה: 
              ${data.project.data.attributes.projectName}`,
              en: 'come see this proposal on    '
            };
            data.fullfild = true;
          } else {
            data = { archived: true , title: {"he":"","en":""}};
            archived = true;
            data.fullfild = true;
            data = data
          }
        } else {
          data = null;
          console.log(fullfild);
        }
        return resolve(data);
      })
      .catch((error) => {
        //errorno=3
        console.log("errorno=3",error);
        return resolve(null);
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
