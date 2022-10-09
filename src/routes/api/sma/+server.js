import sgMail from "@sendgrid/mail";

sgMail.setApiKey(import.meta.env.VITE_SENDGRID);
import { renderMail } from 'svelte-mail';
import MailExept from '$lib/components/mail/mail.svelte';

const msgk = { "he": "המשימה שלך אושרה פה אחד והנך עכשיו חלק מריקמת:", "en": "your mission was appruved Unanimously, you are now part of the FreeMates:" }
const msg2 = { "he": "לחיצה כדי להתחיל את המשימה: ", "en": "start your new mission: " }
let head = {"he":"התקבלת לריקמה חדשה ויש לך משימה לביצוע", "en": "you are no a member of new FreeMates and have a mission to do"}
let lang = "he"
export async function GET({ request }) {
    const data = await request.json()
    
    const userName = data.name
    const { html, text } = await renderMail(MailExept, { data: { user: userName, msgk: msgk[lang], msg2: msg2[lang]  } });
    let subject = head[lang]
    const msg = {
        to: "aviadam.segel@gmail.com",
        from: "ehad1one@gmail.com",
        subject: subject,
        text: text,
        html: html,
    };
    console.log("Form submitted");
    const output = await sgMail.send(msg);
    
        return new Response;

}
