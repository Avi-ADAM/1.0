/*import { render } from 'svelte-email';
import PendJustCreated from '$lib/components/mail/pendJustCreated.svelte';
import sendgrid from '@sendgrid/mail';

async function renderEmail(un,username,pl,pn,kind,rishon,name,lang,restime) {
 let html = await render({
    template: PendJustCreated,
    props: {
      un: un,
      username: username,
      pl: pl,
      pn: pn,
      kind: kind,
      rishon: rishon,
      name: name,
      lang: lang,
      restime: restime ?? 'feh'
    }
  });
  return html;
}
async function renderText(
  un,
  username,
  pl,
  pn,
  kind,
  rishon,
  name,
  lang,
  restime
) {
let text = await render({
    template: PendJustCreated,
    props: {
      un: un,
      username: username,
      pl: pl,
      pn: pn,
      kind: kind,
      rishon: rishon,
      name: name,
      lang: lang,
      restime: restime ?? 'feh'
    },
    options: {
      plainText: true
    }
  });
  return text;
}
sendgrid.setApiKey(import.meta.env.VITE_SENDGRID);

async function nutifiPusers(
  restime,
  pid,
  pl,
  pn,
  un,
  kind,
  name,
  email,
  username,
  lang,
  rishon
) {
  //by mail
  const previewText = {
        "he": `הצבעה על ${kind == "finiappmi"? "אישור סיום המשימה":"ההצעה"} של ${un} בריקמה ${pn}`,
        "en":`Vote for ${un}'s ${kind == "finiappmi"?"mission complition appruval":"suggestion"} on the freeMates ${pn}`
      };
        
  const emailHtml = await renderEmail(
    un,
    username,
    pl,
    pn,
    kind,
    rishon,
    name,
    lang,
    restime
  );

  const text = await renderText(
    un,
    username,
    pl,
    pn,
    kind,
    rishon,
    name,
    lang,
    restime
  );
  

  const options = {
    from: 'ehad1one@gmail.com',
    to: email,
    subject: previewText[lang],
    html: emailHtml,
    text: text
  };

  sendgrid.send(options);
  //by push
}
function getUnById(array, id) {
  const foundObject = array.find((obj) => obj.id === id);
  return foundObject ? foundObject.attributes.username : null;
}*/
export async function POST({ request }) {
  const data = await request.json();
    console.log("Form submitted a"); 
  const pn = data.pn;
  const pl = data.pl;
  const pid = data.pid;
  const uid = data.uid;
  const kind = data.kind;
  const name = data.name;
  const pu = data.pu;
  const restime = data.restime;
  /*
  const rishon = data.rishon ?? getUnById(pu, data.rishon);
  const un = getUnById(pu, uid);
  await Promise.all(pu.map(async (element) =>{
     if (element.id != uid) {
      await nutifiPusers(
         restime,
         pid,
         pl,
         pn,
         un,
         kind,
         name,
         element.attributes.email,
         element.attributes.username,
         element.attributes.lang != null ? element.attributes.lang : 'he',
         rishon
       );
     }
  }))
 */
  return new Response();
}
