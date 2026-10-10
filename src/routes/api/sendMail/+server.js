import { sendMailSafe } from '$lib/server/mailer.js';
import { rejectUnlessInternal } from '$lib/server/internalOnly.js';

// Callers disagree on the shape: svelty-email's render() returns { html, text },
// and some routes forward the whole object while others forward just `html`.
// Accept both — passing a string through `.html` used to send an empty body.
function normalizeBody(emailHtml, emailText) {
  if (typeof emailHtml === 'string') return { html: emailHtml, text: emailText };
  return { html: emailHtml?.html, text: emailHtml?.text ?? emailText };
}

// Any recipient, any HTML, sent as notifications@ — so only this server may
// ask. Every caller is server code on the SvelteKit fetch ($lib/server/internalOnly.js).
export async function POST({ request }) {
  const refused = rejectUnlessInternal(request, 'api/sendMail');
  if (refused) return refused;

  const data = await request.json();
  const email = data.email;
  const previewText = data.previewText;
  const { html, text } = normalizeBody(data.emailHtml, data.emailText);

  if (!email) return new Response('Missing recipient', { status: 400 });

  // sendMailSafe awaits the SMTP exchange and swallows the rejection: an
  // un-awaited send leaves a rejected promise with no handler, which Node 22
  // turns into an uncaught exception that kills the whole server.
  const result = await sendMailSafe({ to: email, subject: previewText, html, text });

  return result.ok
    ? new Response('Success to send mail', { status: 200 })
    : new Response('Failed to send mail', { status: 502 });
}
