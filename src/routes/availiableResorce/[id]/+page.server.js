import { SendTo } from '$lib/send/sendTo.svelte';

async function awaitapi(que,toc,lang) {  
 let alld = []
 await SendTo(que, toc)
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
            alld = data
        } else {
          data = {title: {he: '1💗1 |  הצעה לשיתוף משאב שאיננה זמינה', en: 'not relevant old proposal'}, archived: true};
                      alld = data;
        }
      } else {
        data = {title: {he: '1💗1 |  הצעה לשיתוף משאב שאיננה זמינה', en: 'not relevant old proposal'}, archived: true};
        alld = data;
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
    console.log("loged in")
  } else {
    toc = import.meta.env.VITE_ADMINMONTHER;
        console.log('not loged in');

  }
  
  return {
    uid,
    lang,
    mId,
    tok: tok == false ? false : true,
      alld: await awaitapi(que,toc,lang),
      fullfild
  };
}