/**
 * GET /api/cron/signup-nudge            (x-cron-secret header or ?key=<CRON_SECRET>)
 * GET /api/cron/signup-nudge?dry=1      who would be mailed, without claiming or sending
 *
 * The thank-you mail for signatures that stopped before an account
 * ($lib/server/signupNudge/cron.ts). Reports only, until SIGNUP_NUDGE_SEND=true
 * is set on the server. Fails closed: it mails people.
 */
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { checkCron } from '$lib/server/cronAuth.js';
import { sendToSer } from '$lib/send/sendToSer.js';
import { sendMailSafe } from '$lib/server/mailer.js';
import { SITE_ORIGIN } from '$lib/rikmaAddress/rikmaUrl.js';
import { runSignupNudge } from '$lib/server/signupNudge/cron';

export const GET: RequestHandler = async ({ request, url, fetch }) => {
  const auth = checkCron(request, url, { required: true });
  if (!auth.ok) return json({ error: auth.error }, { status: auth.status });

  const report = await runSignupNudge({
    run: (qid, vars) => sendToSer(vars, qid, 0, 0, true, fetch),
    dry: url.searchParams.get('dry') === '1' || env.SIGNUP_NUDGE_SEND !== 'true',
    // Links in a mail must point at the public site, not at whatever host the scheduler called.
    origin: SITE_ORIGIN,
    send: (to, mail) => sendMailSafe({ to, subject: mail.subject, html: mail.html, text: mail.text })
  });
  return json(report);
};
