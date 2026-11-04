/**
 * A demo request is a lead of the central rikma (docs/inprogress/PLAN_LEADS.md
 * L6, PLAN_DEMO_SIGNUP). `/api/demo` keeps doing what it did — the
 * `demo-request` row, the two follow-up tasks, the Telegram ping — and also
 * records the person as a `lead` with `source: demo`, so the central rikma
 * sees them in "in progress" with a log, a stage and a next step, the same
 * way any rikma sees its own enquiries.
 *
 * Best effort, like every step after saving the demo-request row: a failure
 * here is a warning, never a lost request. The lead opens no task of its own
 * (`openTask: false`) and notifies nobody — the demo's two tasks and the
 * Telegram line already did.
 *
 * The consent recorded is exactly what happened: the person asked for a
 * personal demo and left these details to be contacted about it.
 */

import { centralRikmaId, demoHostId } from './centralRikmaTasks.js';
import { adminToken } from '$lib/server/adminToken.js';

export const DEMO_CONSENT_TEXT = 'Asked for a personal demo on 1lev1.com and left these details to be contacted about it';

export interface DemoLeadInput {
  name: string;
  email: string | null;
  phone: string | null;
  track: string;
  timeMode: string;
  preferredTime: string | null;
  goal: string | null;
  lang: string;
  page: string | null;
  source: string;
  demoRequestId: number | string | null;
}

/** The `createLead` params for a demo request — pure, so the mapping is tested. */
export function demoLeadParams(projectId: string, d: DemoLeadInput, now: Date = new Date()): Record<string, unknown> {
  const details: Record<string, string | number> = { track: d.track, timeMode: d.timeMode };
  if (d.preferredTime) details.preferredTime = d.preferredTime;
  if (d.page) details.page = d.page;
  if (d.source) details.from = d.source;
  if (d.demoRequestId != null) details.demoRequestId = Number(d.demoRequestId);
  return {
    projectId,
    name: d.name,
    ...(d.email ? { email: d.email } : {}),
    ...(d.phone ? { phone: d.phone } : {}),
    ...(d.goal ? { message: d.goal } : {}),
    details,
    // No sourceLabel: the screens name the `demo` source in the reader's language.
    source: 'demo',
    // A retry of the same demo request is the same lead.
    ...(d.demoRequestId != null ? { externalId: `demo:${d.demoRequestId}` } : {}),
    consent: { text: DEMO_CONSENT_TEXT, at: now.toISOString() },
    lang: d.lang,
    openTask: false
  };
}

export async function recordDemoLead(
  d: DemoLeadInput,
  fetchFn: typeof globalThis.fetch
): Promise<{ ok: boolean; leadId?: string; reason?: string }> {
  const projectId = centralRikmaId();
  const hostId = demoHostId();
  if (!projectId || !hostId) return { ok: false, reason: 'not_configured' };
  try {
    const { actionService } = await import('$lib/server/actions/index.js');
    const res: any = await actionService.executeAction('createLead', demoLeadParams(projectId, d), {
      userId: hostId,
      jwt: adminToken(),
      lang: 'he',
      fetch: fetchFn
    });
    if (!res?.success) return { ok: false, reason: res?.error?.code ?? 'error' };
    return { ok: true, leadId: res.data?.leadId != null ? String(res.data.leadId) : undefined };
  } catch (e) {
    console.error('[demo] lead record failed:', e);
    return { ok: false, reason: 'error' };
  }
}
