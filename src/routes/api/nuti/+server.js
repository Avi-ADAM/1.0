import { render } from 'svelte-email';
import PendJustCreated from '$lib/components/mail/pendJustCreated.svelte';
import sendgrid from '@sendgrid/mail';

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
    "he": `הצבעה על ההצעה של ${un} בריקמה ${pn}`,
    "en": `Vote for ${un}'s suggestion on freeMates ${pn}`
  };
  let emailHtml = await render({
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
}
export async function POST({ request }) {
  const data = await request.json();
  //  console.log("Form submitted a"); kind
  const pn = data.pn;
  const pl = data.pl;
  const pid = data.pid;
  const uid = data.uid;
  const kind = data.kind;
  const name = data.name;
  const pu = data.pu;
  const restime = data.restime;
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
 
  return new Response();
}
