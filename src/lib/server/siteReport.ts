// src/lib/server/siteReport.ts
//
// Pure helpers for turning a site report into work in the central rikma
// (PLAN_EXTERNAL_TASKS_API §4).
//
// A user who finds a bug — or something that simply makes no sense — is doing
// the platform a real favour, and today that favour lands in a Telegram message
// and a Strapi row nobody is accountable for. Mirroring it as a task in the
// central rikma puts a name and a consent on it, exactly like any other work.
//
// This file is the side-effect-free half so the mapping can be tested without
// Strapi; `siteReportMirror.ts` is the half that talks to it.

/** Prefix that marks a task as mirroring a site report. */
export const SITE_REPORT_PREFIX = 'sitereport_';

/** The central rikma. Overridable, but 1 is the platform's own rikma. */
export const DEFAULT_CENTRAL_PROJECT_ID = '1';

/** `SiteReport.type` — what the person was doing when they wrote to us. */
export type SiteReportType = 'bug' | 'feature' | 'partnership' | 'contact';

/** `SiteReport.status`. */
export type SiteReportStatus = 'new' | 'in_review' | 'resolved';

export const REPORT_TITLES: Record<SiteReportType, { he: string; en: string }> = {
  bug: { he: 'תקלה באתר', en: 'Site bug' },
  feature: { he: 'הצעת שיפור', en: 'Improvement idea' },
  partnership: { he: 'פניית שותפות', en: 'Partnership enquiry' },
  contact: { he: 'פנייה לצוות', en: 'Message to the team' }
};

/**
 * How urgent the task is.
 *
 * A bug is something broken for a real person right now. A partnership or a
 * contact message has somebody waiting for an answer — less urgent than a
 * breakage, more urgent than an idea, because leaving a human unanswered is its
 * own kind of failure. An improvement idea is genuinely "when we get to it".
 */
export function urgencyForReportType(type: unknown): 'red' | 'yellow' | 'green' | 'white' {
  switch (type) {
    case 'bug':
      return 'red';
    case 'partnership':
    case 'contact':
      return 'yellow';
    case 'feature':
      return 'green';
    default:
      return 'white';
  }
}

export interface SiteReportInput {
  type?: string | null;
  description?: string | null;
  page?: string | null;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  lang?: string | null;
}

/** `sitereport_<id>` — the idempotency key and the handle the sync back uses. */
export function externalIdFor(reportId: string | number): string {
  return `${SITE_REPORT_PREFIX}${String(reportId)}`;
}

/** The Strapi row id back out of an externalId, or null if it isn't one of ours. */
export function reportIdFromExternalId(externalId: unknown): string | null {
  const s = String(externalId ?? '');
  if (!s.startsWith(SITE_REPORT_PREFIX)) return null;
  const id = s.slice(SITE_REPORT_PREFIX.length);
  return id === '' ? null : id;
}

/**
 * The task's name. Short enough to read in a list, specific enough to act on.
 * The full text goes in the description.
 */
export function buildTaskName(report: SiteReportInput): string {
  const type = (report.type ?? 'contact') as SiteReportType;
  const label = REPORT_TITLES[type]?.he ?? 'פנייה';
  const first = String(report.description ?? '')
    .trim()
    .split('\n')[0]
    .slice(0, 100);
  return first ? `${label}: ${first}` : label;
}

/**
 * The description a rikma member actually needs: what happened, where, in which
 * language, and who to answer. The reporter's email is included on purpose —
 * without it "we'll get back to you" is a promise nobody can keep — and it goes
 * no further than the rikma that is handling the report.
 */
export function buildTaskDescription(report: SiteReportInput): string {
  const lines = [String(report.description ?? '').trim()];
  const meta: string[] = [];
  if (report.page) meta.push(`עמוד: ${report.page}`);
  if (report.lang) meta.push(`שפה: ${report.lang}`);
  meta.push(report.userId ? `משתמש רשום #${report.userId}` : 'אורח');
  if (report.userName) meta.push(String(report.userName));
  if (report.userEmail) meta.push(`להשיב אל: ${report.userEmail}`);
  if (meta.length) lines.push('', meta.join(' · '));
  return lines.join('\n').slice(0, 4000);
}

/**
 * Params for the shared `createTask` action.
 *
 * `myIshur` is never set: a mirrored report is an offer to whoever handles it,
 * not an assignment — the same rule the external API follows.
 */
export function buildSiteReportTaskParams(args: {
  report: SiteReportInput;
  reportId: string | number;
  projectId: string;
  missionId?: string | null;
  assignedUserId?: string | null;
  roleIds?: string[];
  link?: string | null;
}): Record<string, unknown> {
  const { report, reportId, projectId, missionId, assignedUserId, roleIds = [], link } = args;
  const isAssigned = !!assignedUserId;

  const params: Record<string, unknown> = {
    projectId,
    name: buildTaskName(report),
    description: buildTaskDescription(report),
    link: link ?? report.page ?? '',
    isAssigned,
    hashivut: urgencyForReportType(report.type),
    externalId: externalIdFor(reportId),
    source: 'api',
    myIshur: false
  };

  if (isAssigned) {
    params.assignedUserId = assignedUserId;
    if (missionId) params.missionId = missionId;
  } else if (roleIds.length > 0) {
    params.tafkidims = roleIds;
  }

  return params;
}

/**
 * Task state → report state.
 *
 * `awaitingConsent` maps to nothing: a task nobody has picked up is exactly what
 * a `new` report already says. Null ⇒ leave the report alone.
 */
export function reportStatusForTaskStatus(taskStatus: unknown): SiteReportStatus | null {
  if (taskStatus === 'accepted') return 'in_review';
  if (taskStatus === 'done') return 'resolved';
  return null;
}

/** A report only ever moves forward, so re-opened work cannot un-resolve it. */
export const REPORT_STATUS_RANK: Record<string, number> = {
  new: 0,
  in_review: 1,
  resolved: 2
};

export function reportMovesForward(next: SiteReportStatus, current: unknown): boolean {
  return (REPORT_STATUS_RANK[next] ?? 0) > (REPORT_STATUS_RANK[String(current ?? 'new')] ?? 0);
}
