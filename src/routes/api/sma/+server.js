import { render } from 'svelty-email';

import MailExept from '$lib/components/mail/mail.svelte';
import MailNoReg from '$lib/components/mail/nonreg.svelte';

const getPreviewText = (lang, projectName, missionName) => {
	if (lang === 'he') {
		return `התקבלת לריקמה ויש לך משימה חדשה ב${projectName}: ${missionName}`;
	}
	return `You've been accepted to a FreeMate and have a new mission in ${projectName}: ${missionName}`;
};

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
	const preview = getPreviewText(lango, projectName, missionName);
	const { html, text } = await render(MailExept,{
		previewText: preview,
		user: user,
		lang: lango ,
		projectName: projectName,
		projectSrc: projectSrc,
		missionName: missionName
	  }
	);
	let emailData = {emailHtml: html,
	  email:email,
	  previewText: preview,
	  emailText: text }
                  await fetch('/api/sendMail', {
                  method: 'POST',  
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(emailData),
                })
                  .then((response) => {
                    if (!response.ok) {
                      console.error('Error sending mail:', response.statusText);
                    }
                    return response;
                  })
                  .catch((error) => {
                    console.error('Error:', error);
                  });
 
  } else if (kind == "nonreg") {
    console.log("Form submitted no ");
    const link = data.link
    let pre = {"he":"הרשמה ל1💗1","en":"registration to 1💗1"}
    const { html, text } = await render(MailNoReg, {
        previewText:pre[lango],
         user: user,
          lang: lango,
           link:link
    });
    let emailData = {emailHtml: html,
      email:email,
      previewText:pre[lango],
      emailText: text }
                  await fetch('/api/sendMail', {
                  method: 'POST',  
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(emailData),
                })
                  .then((response) => {
                    if (!response.ok) {
                      console.error('Error sending mail:', response.statusText);
                    }
                    return response;
                  })
                  .catch((error) => {
                    console.error('Error:', error);
                  });
  }
    return new Response(JSON.stringify({ success: true }), {
      status: 200
    });
  }
