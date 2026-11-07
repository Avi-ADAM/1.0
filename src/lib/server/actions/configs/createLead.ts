/**
 * Create Lead (docs/inprogress/PLAN_LEADS.md §2, §3, §5) — someone reached the
 * rikma and may become its customer. The first stage of a sale.
 *
 * Order of work, and what may fail:
 *  1. validate (consent is required unless a member records it by hand);
 *  2. same `externalId` in this rikma ⇒ that lead, `duplicated: 'externalId'`;
 *  3. same phone or email as a lead still in play ⇒ no new lead: an `inbound`
 *     entry on that one, `duplicated: 'sameContact'` (a paused lead comes back
 *     through `followUpAt`, so it surfaces as needing attention);
 *  4. write the lead — the ONLY step whose failure fails the request (§1.6);
 *  5. best-effort, each reported in `warnings`: the `inbound` log entry and
 *     the follow-up task (`createTask`, `externalId: lead:<id>`), assigned by
 *     the rikma's lead settings.
 *
 * Notification: the task already reaches role holders when the rikma names
 * lead roles. Otherwise nobody would hear of an unassigned lead (an empty
 * recipient list is nobody — N4), so this action tells the members itself;
 * a returning contact tells the lead's owner, or the members if it has none.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { validateLeadPayload } from '$lib/leads/validate';
import { dedupeKeyOf } from '$lib/leads/dedupe';
import { resolveLeadSettings } from '$lib/leads/settings';
import { leadTaskExternalId } from '$lib/leads/taskSync';
import {
  contactHash,
  findLeadByExternalId,
  findSameContact,
  leadStore,
  recordActivity,
  updateLead
} from '$lib/server/leads/store';

/** The word in front of the task's name, in the language of whoever opened it. */
const TASK_PREFIX: Record<string, string> = {
  he: 'ליד',
  en: 'Lead',
  ar: 'عميل محتمل',
  ru: 'Лид',
  es: 'Contacto'
};
const TASK_DESCRIPTION: Record<string, string> = {
  he: 'פנייה חדשה לרקמה. הפרטים, היומן והצעד הבא בעמוד הליד.',
  en: 'A new enquiry to the rikma. Details, log and next step are on the lead page.',
  ar: 'استفسار جديد للريكما. التفاصيل والسجل والخطوة التالية في صفحة العميل.',
  ru: 'Новое обращение в рикму. Детали, журнал и следующий шаг — на странице лида.',
  es: 'Una nueva consulta a la rikma. Los datos, el registro y el siguiente paso están en la página del contacto.'
};

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const source = params.source ?? 'api';
  const v = validateLeadPayload(
    { ...params, source },
    { requireConsent: source !== 'manual' }
  );
  if (v.ok === false) {
    const refusal = v as Extract<typeof v, { ok: false }>;
    throw new ActionError(refusal.code, refusal.message, { field: refusal.field });
  }
  const lead = v.value;
  const store = leadStore(strapi, context.fetch);
  const now = new Date().toISOString();

  if (lead.productId) {
    const p = await store.run('rikmaApiProduct', { pid: projectId, productId: lead.productId });
    if (!p?.data?.matanots?.data?.[0]?.id) throw new ActionError('NOT_FOUND', 'No such product in this rikma');
  }

  const settingsRes = await store.run('leadProjectSettings', { pid: projectId });
  const project = settingsRes?.data?.project?.data;
  if (!project?.id) throw new ActionError('NOT_FOUND', 'No such rikma');
  const settings = resolveLeadSettings(project.attributes?.leadSettings);
  const memberIds: string[] = (project.attributes?.user_1s?.data ?? []).map((u: any) => String(u.id));

  // 2. A retry of a lead already received.
  if (lead.externalId) {
    const existing = await findLeadByExternalId(store, projectId, lead.externalId);
    if (existing) {
      return {
        leadId: existing.id,
        externalId: lead.externalId,
        status: existing.status,
        taskId: existing.actId,
        duplicated: true,
        reason: 'externalId',
        warnings: [],
        notifyUserIds: []
      };
    }
  }

  // 3. The same person writing again.
  const same = await findSameContact(store, projectId, lead.email, lead.phone);
  if (same.open) {
    const warnings: string[] = [];
    try {
      await recordActivity(store, {
        leadId: same.open.id,
        kind: 'inbound',
        direction: 'in',
        body: [lead.sourceLabel, lead.message].filter(Boolean).join('\n') || null,
        actorId: source === 'manual' ? context.userId : null,
        at: now
      });
    } catch (e) {
      console.warn('[createLead] inbound activity failed for lead', same.open.id, e);
      warnings.push('ACTIVITY_NOT_RECORDED');
    }
    try {
      await updateLead(store, same.open.id, {
        lastActivityAt: now,
        // A paused lead that writes again is due now — needsAttention surfaces it.
        ...(same.open.status === 'paused' ? { followUpAt: now } : {})
      });
    } catch (e) {
      console.warn('[createLead] could not touch lead', same.open.id, e);
      warnings.push('LEAD_NOT_TOUCHED');
    }
    return {
      leadId: same.open.id,
      externalId: lead.externalId,
      status: same.open.status,
      taskId: same.open.actId,
      duplicated: true,
      reason: 'sameContact',
      warnings,
      notifyUserIds: same.open.ownerId ? [same.open.ownerId] : memberIds
    };
  }

  // 4. The lead itself — nothing after this may fail the request.
  const data: Record<string, unknown> = {
    project: projectId,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    organization: lead.organization,
    city: lead.city,
    address: lead.address,
    message: lead.message,
    details: lead.details,
    status: 'new',
    source: lead.source,
    sourceLabel: lead.sourceLabel,
    sourceUrl: lead.sourceUrl,
    utm: lead.utm,
    externalId: lead.externalId,
    consentText: lead.consentText,
    consentAt: lead.consentAt,
    lang: lead.lang,
    lastActivityAt: now,
    dedupeKey: dedupeKeyOf(lead.email, lead.phone, contactHash)
  };
  if (lead.productId) data.products = [lead.productId];
  if (params.sourceKeyId) data.sourceKey = String(params.sourceKeyId);
  if (same.previousWon) data.previousLead = same.previousWon.id;
  for (const k of Object.keys(data)) if (data[k] == null) delete data[k];

  const created = await store.run('leadCreate', { data });
  const leadId = created?.data?.createLead?.data?.id;
  if (!leadId) throw new Error('createLead: no lead returned');

  // 5. Best effort from here.
  const warnings: string[] = [];
  try {
    await recordActivity(store, {
      leadId: String(leadId),
      kind: 'inbound',
      direction: 'in',
      body: lead.sourceLabel,
      actorId: source === 'manual' ? context.userId : null,
      at: now
    });
  } catch (e) {
    console.warn('[createLead] inbound activity failed for lead', leadId, e);
    warnings.push('ACTIVITY_NOT_RECORDED');
  }

  let taskId: string | null = null;
  const byRole = settings.leadRoleIds.length > 0;
  // A caller that already opened the work and told the team (the demo form,
  // L6) records the lead without a second task or a second notice.
  if (params.openTask === false) {
    return {
      leadId: String(leadId),
      externalId: lead.externalId,
      status: 'new',
      taskId: null,
      duplicated: false,
      warnings,
      notifyUserIds: []
    };
  }
  try {
    const lang = TASK_PREFIX[context.lang] ? context.lang : 'he';
    const { actionService } = await import('../index.js');
    const task = await actionService.executeAction(
      'createTask',
      {
        projectId,
        name: `${TASK_PREFIX[lang]}: ${lead.name}${lead.organization ? ` — ${lead.organization}` : ''}`,
        description: TASK_DESCRIPTION[lang],
        link: `/moach/${projectId}/sales/manage/leads/${leadId}`,
        hashivut: 'yellow',
        dateS: now,
        dateF: new Date(Date.parse(now) + settings.leadResponseHours * 3600_000).toISOString(),
        externalId: leadTaskExternalId(leadId),
        source: 'api',
        ...(byRole
          ? { isAssigned: false, tafkidims: settings.leadRoleIds }
          : settings.leadMissionId
            ? { isAssigned: true, missionId: settings.leadMissionId }
            : { isAssigned: false })
      },
      context
    );
    taskId = task.success && task.data?.id != null ? String(task.data.id) : null;
    if (!taskId) throw new Error(task.error?.message ?? 'createTask returned no id');
    await updateLead(store, String(leadId), { act: taskId });
  } catch (e) {
    console.warn('[createLead] follow-up task failed for lead', leadId, e);
    warnings.push(taskId ? 'TASK_NOT_LINKED' : 'TASK_NOT_CREATED');
  }

  return {
    leadId: String(leadId),
    externalId: lead.externalId,
    status: 'new',
    taskId,
    duplicated: false,
    warnings,
    // Role holders hear through the task; otherwise the members hear here.
    notifyUserIds: byRole && taskId ? [] : memberIds
  };
};

const optionalString = (description: string) => ({ type: 'string' as const, required: false, description });

export const createLeadConfig: ActionConfig = {
  key: 'createLead',
  description: 'Record a lead — someone who reached the rikma — and open its follow-up task',
  graphqlOperation: handler,

  paramSchema: {
    projectId: { type: 'string', required: true, description: 'The rikma' },
    name: { type: 'string', required: true, description: 'Who reached out' },
    email: optionalString('Email (email or phone is required)'),
    phone: optionalString('Phone (email or phone is required)'),
    organization: optionalString('Company / building / organisation'),
    city: optionalString('City'),
    address: optionalString('Address'),
    message: optionalString('What they wrote (≤4000 chars)'),
    details: { type: 'object', required: false, description: 'Flat source fields, primitives only (≤30 keys, ≤4KB)' },
    productId: optionalString('A product of this rikma they asked about'),
    externalId: optionalString('Id in the system that sent it — idempotency key per rikma'),
    source: optionalString("api · form · shop · quote · manual · bot · demo · import (default 'api')"),
    sourceKeyId: optionalString('The API key that brought it (set by the API endpoint, L2)'),
    sourceLabel: optionalString('Which form or page, in words'),
    sourceUrl: optionalString('The page it was sent from'),
    utm: { type: 'object', required: false, description: 'utm source/medium/campaign/term/content' },
    consent: { type: 'object', required: false, description: '{ text, at } — required unless source is manual' },
    lang: optionalString("The person's language"),
    openTask: {
      type: 'boolean',
      required: false,
      description: 'false: record the lead only — the caller already opened the work and told the team (the demo form)'
    }
  },

  access: ['user', 'serviceAdmin', 'apiKey'],

  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in to record a lead' },
    {
      type: 'or',
      config: {
        rules: [
          {
            type: 'projectMember',
            config: { projectIdParam: 'projectId' },
            errorMessage: 'Leads belong to the rikma — only its members record them'
          },
          // "Ask about this product" on a public page (L4): the server endpoint
          // marks the context; it is always a shop lead about a named product.
          {
            type: 'custom',
            config: {
              checkFunction: async (_userId: string, params: Record<string, any>, context: any) => ({
                authorized: context?.intake === 'publicProduct' && params.source === 'shop' && !!params.productId,
                reason: 'Only a product page may file a lead for a visitor'
              })
            }
          }
        ]
      },
      errorMessage: 'Leads belong to the rikma — only its members record them'
    }
  ],

  notification: {
    recipients: {
      type: 'specificUsers',
      config: { userIdsParam: 'notifyUserIds', projectIdParam: 'projectId', excludeSender: true }
    },
    templates: {
      title: {
        he: 'פנייה לרקמה: {{name}}',
        en: 'An enquiry to the rikma: {{name}}',
        ar: 'استفسار للريكما: {{name}}',
        ru: 'Обращение в рикму: {{name}}',
        es: 'Una consulta a la rikma: {{name}}'
      },
      body: {
        he: '{{name}} מחכה שיחזרו אליו',
        en: '{{name}} is waiting to hear back',
        ar: '{{name}} ينتظر الرد',
        ru: '{{name}} ждёт ответа',
        es: '{{name}} espera una respuesta'
      }
    },
    intent: 'review',
    metadata: {
      priority: 'normal',
      url: '/moach/{{projectId}}/sales'
    }
  },

  realtime: {
    scopes: (p, r) => scopeList([scope('project', p.projectId), scope('act', r?.taskId)])
  }
};
