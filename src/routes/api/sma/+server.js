import sgMail from "@sendgrid/mail";

sgMail.setApiKey(import.meta.env.VITE_SENDGRID);
import { renderMail } from 'svelte-mail';
import MailExept from '$lib/components/mail/mail.svelte';
import MailNoReg from '$lib/components/mail/nonreg.svelte';

let head = {"he":"התקבלת לריקמה חדשה ויש לך משימה לביצוע", "en": "you are no a member of new FreeMates and have a mission to do"}
export async function POST({ request }) {
    const data = await request.json()
  //  console.log("Form submitted a"); kind
  
 const lango = data.lang 
 const kind = data.kind

    const user = data.user
    const email = data.email
  if (kind == "exeptedMission") {
    const projectName = data.projectName
    const projectSrc = data.projectSrc
    const missionName = data.missionName
    const { html, text } = await renderMail(MailExept, { data: { user: user, lang: lango, projectName: projectName, projectSrc: projectSrc, missionName: missionName } });
    let subject = head[lango]
    const msg = {
      to: email,
      from: "ehad1one@gmail.com",
      subject: subject,
      text: text,
      html: html
    };
    const output = await sgMail.send(msg);
    console.log("Form submitted", msg);
    console.log(output)
  } else if (kind == "nonreg") {
    console.log("Form submitted no ");
    const link = data.link
    const { html, text } = await renderMail(MailNoReg, { data: { user: user, lang: lango, link:link } });
    let subject = head[lango]
    const msg = {
      to: email,
      from: "ehad1one@gmail.com",
      subject: subject,
      text: text,
      html: html
    };
    const output = await sgMail.send(msg);
    console.log("Form submitted", msg);
    console.log(output)
  }

  }
