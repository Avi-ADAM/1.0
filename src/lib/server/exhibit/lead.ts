/**
 * A fair visitor who asked to be got back to is a lead of the central rikma
 * (docs/inprogress/PLAN_EXHIBITION_MODE.md §7) — the same `createLead` a demo request
 * and an event registration use, so the team sees them in the leads screen
 * with a stage, a log and a follow-up task, and nothing new to learn.
 *
 * `source: 'event'` (a fair is an event; no new enum value), the stand's name
 * as the label, and `externalId: exhibit:<session>` — leaving an email at the
 * stand and then again on the phone is one lead, not two. The details carry
 * what the team needs to call back with something concrete: the idea, how
 * many parts are still open, and the two links (the preview, and the signup
 * that claims the draft).
 */
import { centralRikmaId, demoHostId } from '$lib/server/demo/centralRikmaTasks.js';
import { adminToken } from '$lib/server/adminToken.js';

export const EXHIBIT_CONSENT_TEXT =
  'Built a rikma at the 1lev1 exhibition stand and left these details so the team can get back to them about it';

export interface ExhibitLeadInput {
  sessionId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  lang: string;
  /** Where the details were typed: the stand's own screen, or the visitor's phone. */
  via: 'kiosk' | 'phone';
  idea: string;
  missions: number;
  open: number;
  previewUrl: string;
  signupUrl: string;
}

/** The `createLead` params — pure, so the mapping is tested. */
export function exhibitLeadParams(
  projectId: string,
  d: ExhibitLeadInput,
  label: string,
  now: Date = new Date()
): Record<string, unknown> {
  const name = (d.name ?? '').trim() || (d.email ?? '').split('@')[0] || d.phone || 'exhibit visitor';
  return {
    projectId,
    name: name.slice(0, 120),
    ...(d.email ? { email: d.email } : {}),
    ...(d.phone ? { phone: d.phone } : {}),
    message: d.idea.slice(0, 500),
    details: {
      idea: d.idea.slice(0, 200),
      missions: d.missions,
      openParts: d.open,
      via: d.via,
      preview: d.previewUrl,
      signup: d.signupUrl
    },
    source: 'event',
    sourceLabel: label.slice(0, 200),
    sourceUrl: d.previewUrl,
    externalId: `exhibit:${d.sessionId}`,
    consent: { text: EXHIBIT_CONSENT_TEXT, at: now.toISOString() },
    lang: d.lang,
    // Someone in the team should take it while the fair is still fresh.
    openTask: true
  };
}

export async function recordExhibitLead(
  d: ExhibitLeadInput,
  label: string,
  fetchFn: typeof globalThis.fetch
): Promise<{ ok: boolean; leadId?: string; duplicated?: boolean; reason?: string }> {
  const projectId = centralRikmaId();
  const hostId = demoHostId();
  if (!projectId || !hostId) return { ok: false, reason: 'not_configured' };
  try {
    const { actionService } = await import('$lib/server/actions/index.js');
    const res: any = await actionService.executeAction('createLead', exhibitLeadParams(projectId, d, label), {
      userId: hostId,
      jwt: adminToken(),
      lang: d.lang,
      fetch: fetchFn
    });
    if (!res?.success) return { ok: false, reason: res?.error?.code ?? 'error' };
    return {
      ok: true,
      leadId: res.data?.leadId != null ? String(res.data.leadId) : undefined,
      duplicated: !!res.data?.duplicated
    };
  } catch (e) {
    console.error('[exhibit] lead record failed:', e);
    return { ok: false, reason: 'error' };
  }
}
