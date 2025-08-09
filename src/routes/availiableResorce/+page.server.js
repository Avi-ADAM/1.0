import { SendTo } from '$lib/send/sendTo.svelte';
export async function load({ locals, params }) {
  const mId = params.id;
  const lang = locals.lang;
  const tok = locals.tok;
  const uid = locals.uid;
  let que = `{ openMashaabims (filters:{archived: {ne:true}}) { data {id attributes{ archived price descrip spnot kindOf
        sqadualedf sqadualed  hm name easy 
                project {data{ id attributes{  projectName 
            profilePic {data{ attributes{url  }}}
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
    console.log('loged in');
  } else {
    toc = import.meta.env.VITE_ADMINMONTHER;
    console.log('not loged in');
  }
  alld = new Promise((resolve) => {
    SendTo(que, toc)
      .then((data) => {
        console.log(data);
        if (data.data.openMashaabims.data != null) {
          const datar = data.data.openMashaabims.data;
          console.log(datar);
          let senD = []
          for (let i = 0; i < datar.length; i++) {
            const element = datar[i].attributes;
            senD.push({
              name: element.name,
              projectName: element.project.data.attributes.projectName,
              id:datar[i].id,
              price:element.price,
              kindOf:element.kindOf,
              easy:element.easy
            });
          }
            data = senD;
            data.title = {
              he: `1💗1 | הצעות לשיתוף משאבים 
              בריקמות`,
              en: 'come see this proposals on    '
            };
            data.fullfild = true;
        } else {
          data = null;
          console.log(fullfild);
        }
        return resolve(data);
      })
      .catch((error) => {
        //errorno=3
        console.log('errorno=3', error);
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
