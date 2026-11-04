/**
 * The leads line of the daily brief (docs/inprogress/PLAN_LEADS.md §4.4,
 * PLAN_DAILY_DIGEST): "2 enquiries waiting for an answer in <rikma>".
 *
 * Counts only what is the reader's to answer — leads they own, and leads
 * nobody took yet. A lead another member owns is that member's line. The
 * rule for "needs attention" is the one the manage screen sorts by
 * (`attentionReason`), with each rikma's own settings. No names: the query
 * carries no contact details, and the brief can travel by mail or Telegram.
 */

import { attentionReason, type AttentionReason } from '$lib/leads/attention';
import { resolveLeadSettings } from '$lib/leads/settings';

export interface LeadsDigestProject {
  projectId: string;
  projectName: string;
  /** Needs attention and is mine or nobody's. */
  attention: number;
  /** …of which "nobody answered yet". */
  unanswered: number;
  /** …of which the day to get back has come. */
  followUpDue: number;
  url: string;
}

export interface LeadsDigest {
  attention: number;
  projects: LeadsDigestProject[];
}

export function emptyLeadsDigest(): LeadsDigest {
  return { attention: 0, projects: [] };
}

export function pipelineUrl(projectId: string): string {
  return `/moach/${encodeURIComponent(projectId)}/sales/manage/pipeline?attention=1`;
}

export function processLeads(raw: any, uid: string, now: number): LeadsDigest {
  const rows = (raw?.data?.leads?.data ?? []) as any[];
  const byProject = new Map<string, LeadsDigestProject>();
  for (const row of rows) {
    const a = row?.attributes ?? {};
    const owner = a.owner?.data?.id != null ? String(a.owner.data.id) : null;
    if (owner && owner !== String(uid)) continue;
    const project = a.project?.data;
    if (project?.id == null) continue;
    const settings = resolveLeadSettings(project.attributes?.leadSettings);
    const reason: AttentionReason | null = attentionReason(
      { status: a.status, createdAt: a.createdAt, lastActivityAt: a.lastActivityAt, followUpAt: a.followUpAt },
      now,
      settings
    );
    if (!reason) continue;
    const pid = String(project.id);
    const entry =
      byProject.get(pid) ??
      ({
        projectId: pid,
        projectName: project.attributes?.projectName ?? '',
        attention: 0,
        unanswered: 0,
        followUpDue: 0,
        url: pipelineUrl(pid)
      } satisfies LeadsDigestProject);
    entry.attention++;
    if (reason === 'unanswered') entry.unanswered++;
    if (reason === 'followUpDue') entry.followUpDue++;
    byProject.set(pid, entry);
  }
  const projects = [...byProject.values()].sort((x, y) => y.attention - x.attention);
  return { attention: projects.reduce((s, p) => s + p.attention, 0), projects };
}
