/**
 * The single SMTP transport for the whole server process.
 *
 * Two rules this module exists to enforce, both learned the hard way:
 *
 * 1. **One pooled connection, paced.** A fresh `createTransport` per email
 *    opens (and abandons) a new SMTP connection every time. Zoho reads that
 *    churn as "Unusual sending activity" and answers `550 5.4.6`, blocking the
 *    entire notifications@ account — not just the offending message.
 *
 * 2. **Never leave a send un-awaited.** `transporter.sendMail(...)` returns a
 *    promise. Dropped on the floor, an SMTP refusal becomes an unhandled
 *    rejection, and Node 22 escalates that to an uncaught exception that kills
 *    the server. One bad recipient took the whole site down. Use
 *    `sendMailSafe`, which resolves to a result object and never rejects.
 */

import nodemailer from 'nodemailer';
import { ZOHO } from '$env/static/private';

const FROM = 'notifications@1lev1.com';

let transporter;

export function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      secure: true,
      port: 465,
      auth: { user: FROM, pass: ZOHO },
      pool: true,
      maxConnections: 1,
      maxMessages: 50,
      // At most 20 messages per minute — queued by nodemailer, not refused.
      rateDelta: 60000,
      rateLimit: 20
    });
  }
  return transporter;
}

/**
 * Send one email. Resolves to `{ ok: true }` or `{ ok: false, error }` — it
 * never rejects and never throws, so a caller looping over recipients cannot
 * be interrupted (or crash the process) because one address was refused.
 *
 * @param {{ to: string, subject?: string, html?: string, text?: string }} options
 * @returns {Promise<{ ok: boolean, error?: unknown }>}
 */
export async function sendMailSafe({ to, subject, html, text }) {
  if (!to) return { ok: false, error: 'missing recipient' };
  try {
    await getTransporter().sendMail({ from: FROM, to, subject, html, text });
    return { ok: true };
  } catch (error) {
    console.error(
      'sendMailSafe: failed to send to',
      to,
      /** @type {any} */ (error)?.responseCode ?? '',
      /** @type {any} */ (error)?.message ?? error
    );
    return { ok: false, error };
  }
}
