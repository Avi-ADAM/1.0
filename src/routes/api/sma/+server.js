import { render } from 'svelty-email';

import MailExept from '$lib/components/mail/mail.svelte';
import MailNoReg from '$lib/components/mail/nonreg.svelte';

let head = {"he":"התקבלת לריקמה חדשה ויש לך משימה לביצוע", "en": "you are no a member of new FreeMates and have a mission to do"}
export async function POST({ request, fetch }) {
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
    const emailHtml = render({
      template: MailExept,
      props: {
        previewText:head,
        user: user, 
        lang: lango , 
        projectName: projectName, 
        projectSrc: projectSrc, 
        missionName: missionName 
      }
    });
    console.log(emailHtml)
    let emailData = {emailHtml:emailHtml,
      email:email,
      previewText:head[lango],
      emailText:head[lango] }
                  fetch('/api/sendMail', {
                  method: 'POST',  
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(emailData),
                })
                  .then((response) => response)
                  .then((data) => {
                    console.log('Success:', data);            
                  })
                  .catch((error) => {
                    console.error('Error:', error);
                  });
 
  } else if (kind == "nonreg") {
    console.log("Form submitted no ");
    const link = data.link
    let pre = {"he":"הרשמה ל1💗1","en":"registration to 1💗1"}
    const emailHtml = render({
      template: MailNoReg,
      props: {
        previewText:pre,
         user: user,
          lang: lango,
           link:link 
      }
    });
    let emailData = {emailHtml:emailHtml,
      email:email,
      previewText:pre[lango],
      emailText:pre[lango] }
                  fetch('/api/sendMail', {
                  method: 'POST',  
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(emailData),
                })
                  .then((response) => response)
                  .then((data) => {
                    console.log('Success:', data);            
                  })
                  .catch((error) => {
                    console.error('Error:', error);
                  });
  }

  }
