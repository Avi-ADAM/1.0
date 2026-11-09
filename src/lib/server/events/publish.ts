/**
 * Publishing an event (docs/inprogress/PLAN_EVENTS_WEBINARS.md §1.3).
 *
 * The public page speaks for every member, so it rides the same road as the
 * rikma's address and look: a rikma of one publishes directly; a larger one
 * opens a `Decision` (`kind: 'event'`) that matures on everyone's yes
 * (voteOnDecision) or on restime silence (timegrama). Both routes end here,
 * and this checks everything again — the event may have been archived, or
 * already published, while the clock ran.
 */

import type { Run } from './store';

export async function setPublished(run: Run, eventId: string, now: Date = new Date()) {
  return run('eventUpdate', { id: String(eventId), data: { status: 'published', publishedOn: now.toISOString() } });
}

export async function applyEventDecision(run: Run, decisionId: string, projectId: string): Promise<boolean> {
  const res = await run('eventDecision', { id: String(decisionId) });
  const d = res?.data?.decision?.data?.attributes;
  if (!d || d.kind !== 'event') return false;
  const onThisRikma = (d.projects?.data ?? []).some((p: any) => String(p.id) === String(projectId));
  const ev = d.rikma_event?.data;
  if (!onThisRikma || !ev?.id) return false;
  if (String(ev.attributes?.project?.data?.id ?? '') !== String(projectId)) return false;
  // Only a proposal still waiting is published. A draft the members pulled
  // back, or an event already public or closed, is left as it is.
  if (ev.attributes?.status !== 'proposed') return false;
  await setPublished(run, String(ev.id));
  return true;
}
