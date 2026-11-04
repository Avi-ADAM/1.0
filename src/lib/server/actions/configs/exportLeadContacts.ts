/**
 * Export Lead Contacts (docs/inprogress/PLAN_LEADS.md §4.1, L5) — the phone
 * and email of the rikma's leads, for a CSV a member asked for explicitly.
 *
 * The file leaves the platform, so it is never silent: every lead whose
 * details went out gets a line in its log saying who took them and when
 * (open question 4 — "every member, or after a second member's yes?" — is
 * answered here with "every member, and on the record"). Spam and
 * anonymized leads are not exported.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { CONTACTS_EXPORTED } from '$lib/leads/merge';
import { leadStore, recordActivity } from '$lib/server/leads/store';

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** At most this many log writes in flight — Strapi is one box. */
const LOG_CONCURRENCY = 5;

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const store = leadStore(strapi, context.fetch);
  const res = await store.run('leadContactsForExport', { pid: projectId });
  const contacts = ((res?.data?.leads?.data ?? []) as any[])
    .map((row) => ({
      leadId: String(row.id),
      phone: str(row?.attributes?.phone),
      email: str(row?.attributes?.email)
    }))
    .filter((c) => c.phone || c.email);

  const now = new Date().toISOString();
  let logged = 0;
  for (let i = 0; i < contacts.length; i += LOG_CONCURRENCY) {
    const batch = contacts.slice(i, i + LOG_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((c) =>
        recordActivity(store, { leadId: c.leadId, kind: 'system', body: CONTACTS_EXPORTED, actorId: context.userId, at: now })
      )
    );
    logged += results.filter((r) => r.status === 'fulfilled').length;
  }
  // Never the person — only how many (§6: no contact details in logs).
  console.log(`[leads] contacts exported project=${projectId} by=${context.userId} count=${contacts.length} logged=${logged}`);

  return { contacts, logged };
};

export const exportLeadContactsConfig: ActionConfig = {
  key: 'exportLeadContacts',
  description: "The rikma's lead contact details for a CSV — every export is written in each lead's log",
  graphqlOperation: handler,

  paramSchema: {
    projectId: { type: 'string', required: true, description: 'The rikma' }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: "Only the rikma's members work its leads"
    }
  ],

  // It writes the log lines; the open screens re-read them.
  realtime: {
    scopes: (p) => scopeList([scope('project', p.projectId)])
  }
};
