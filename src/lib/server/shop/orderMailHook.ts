// src/lib/server/shop/orderMailHook.ts
//
// The real wiring of `runOrderMail`: the shared SMTP transport, the kill switch
// and the process-wide cap. Kept apart from `orderMail.ts` so the logic there is
// tested without an environment or a mail server. `ActionService` imports this
// lazily after an order action succeeded (fire-and-forget, like the webhooks).

import { env } from '$env/dynamic/private';
import { sendMailSafe } from '$lib/server/mailer.js';
import type { ActionContext } from '$lib/server/actions/types.js';
import { ORDER_MAIL_ACTIONS, MailThrottle, runOrderMail, type MailDeps } from './orderMail.js';

type Strapi = { execute: (qid: string, vars: any, jwt?: any, fetchFn?: any) => Promise<any> };

/** One cap for the whole process — the API runs as one. */
const throttle = new MailThrottle();

/** On unless `ORDER_MAILS_ENABLED=false` — read per call, so a deploy-time switch needs no restart of a cached value. */
const enabled = () => (env.ORDER_MAILS_ENABLED ?? process.env.ORDER_MAILS_ENABLED) !== 'false';

const deps: MailDeps = { enabled, send: (mail) => sendMailSafe(mail), throttle };

/** Entry point called by ActionService after a successful order action. */
export async function onOrderMail(opts: {
  actionKey: string;
  params: Record<string, any>;
  result: any;
  context: ActionContext;
  strapi: Strapi;
}): Promise<void> {
  if (!ORDER_MAIL_ACTIONS.has(opts.actionKey)) return;
  await runOrderMail(
    {
      actionKey: opts.actionKey,
      params: opts.params,
      result: opts.result,
      fetchFn: opts.context.fetch ?? globalThis.fetch,
      strapi: opts.strapi
    },
    deps
  );
}
