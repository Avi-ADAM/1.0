import sgMail from "@sendgrid/mail";

sgMail.setApiKey(import.meta.env.VITE_SENDGRID);
import { renderMail } from 'svelte-mail';
import MailExept from '$lib/components/mail/mail.svelte';

let head = {"he":"התקבלת לריקמה חדשה ויש לך משימה לביצוע", "en": "you are no a member of new FreeMates and have a mission to do"}
export async function POST({ request }) {
    const data = await request.json()
  //  console.log("Form submitted a"); kind
    const projectName = data.projectName
 const projectSrc = data.projectSrc
 const lango = data.lang 
   const missionName = data.missionName
    const user = data.user
    const email = data.email
    const { html, text } = await renderMail(MailExept, { data: { user: user, lang: lango, projectName: projectName, projectSrc: projectSrc, missionName: missionName } });
    let subject = head[lango]
    const msg = {
        to: email,
        from: "ehad1one@gmail.com",
        subject: subject,
        text: text,
        html: html
    };

    console.log("Form submitted",msg);
    const output = await sgMail.send(msg);
    console.log(output)
    return new Response;
}
