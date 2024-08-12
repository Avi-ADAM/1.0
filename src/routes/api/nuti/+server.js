import { render } from 'svelty-email';
import PendJustCreated from '$lib/components/mail/pendJustCreated.svelte';
import nodemailer from 'nodemailer';

async function sendMail(
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
  rishon){
    const previewText = {
      "he": `הצבעה על ${kind == "finiappmi"? "אישור סיום המשימה":"ההצעה"} של ${un} בריקמה ${pn}`,
      "en":`Vote for ${un}'s ${kind == "finiappmi"?"mission complition appruval":"suggestion"} on the freeMates ${pn}`
    };
  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    secure: true,
    port: 465,
    auth: {
      user: "notifications@1lev1.com",	
      pass: import.meta.env.VITE_ZOHO,
    },
  });
  
  const emailHtml = render({
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

  const options = {
    from:"notifications@1lev1.com",
    to:email ,
    subject:previewText[lang],
    html: emailHtml
  };
  
  transporter.sendMail(options);
  transporter.verify(function(err, success) {
  if (err) {
    console.log(err)
    return 'error';
} 
else {
  console.log(success)
    return 'OK';
}
});}
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
/*const text = render({
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
  return text;*/
}


function getUnById(array, id) {
  const foundObject = array.find((obj) => obj.id === id);
  return foundObject ? foundObject.attributes.username : null;
}
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
 
  const rishon = data.rishon ?? getUnById(pu, data.rishon);
  const un = getUnById(pu, uid);
  await Promise.all(pu.map(async (element) =>{
     if (element.id != uid) {
      await sendMail(
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
