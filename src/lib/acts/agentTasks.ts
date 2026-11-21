/**
 * An act (task) as an outside agent sees it — PLAN_AGENT_WORK AW1.
 *
 * Pure, so the MCP tools, the two actions behind them (`claimTask`,
 * `reportTask`) and the tests all read one definition of:
 *   - what an act row says once its relations are flattened (`taskOf`);
 *   - what this person is to it and what it waits on from them (`nextStepFor`);
 *   - whether they may take it, and how (`claimPlan`);
 *   - whether they may report on it (`reportProblem`);
 *   - the report itself, written as a forum message and read back (`formatReport`,
 *     `parseReport`).
 *
 * The lanes come from `getActStatus` — never re-derived here.
 *
 * "Holding a role" in a rikma means holding a running mission in that role
 * (the same rule `takeFulfillmentAct` uses): an act has to hang off one of the
 * taker's own missions in progress, or the hours it takes accrue to nothing.
 */

import { getActStatus, type ActStatus } from './actStatus';

export interface TaskPerson {
  id: string;
  /** The raw user node, kept so the caller can resolve a display name for its reader. */
  node: unknown;
}

export interface TaskRow {
  id: string;
  name: string;
  description: string;
  link: string | null;
  urgency: string | null;
  startsAt: string | null;
  dueAt: string | null;
  progress: number;
  status: ActStatus;
  source: string | null;
  externalId: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  project: { id: string; name: string } | null;
  assignees: TaskPerson[];
  /** `myIshur`: the assignee accepted the assignment. */
  accepted: boolean;
  validator: TaskPerson | null;
  roleIds: string[];
  roles: { id: string; name: string }[];
  missions: { id: string; name: string; holderId: string | null }[];
  forumIds: string[];
  /** When an open clock on the act runs out — its validation clock, once reported done. */
  clockDueAt: string | null;
}

/** A running mission of the viewer in this rikma, with the roles it carries. */
export interface ViewerMission {
  id: string;
  name: string;
  roleIds: string[];
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);
const idOf = (v: any): string | null => (v?.id != null ? String(v.id) : null);
const nodes = (rel: any): any[] => (Array.isArray(rel?.data) ? rel.data.filter(Boolean) : []);

/** Act descriptions are usually plain text, but some were written in the rich editor. */
export function plainText(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Flatten one Strapi `act` node. `null` for anything that is not one. */
export function taskOf(node: any): TaskRow | null {
  const a = node?.attributes;
  if (!a || node?.id == null) return null;
  const project = a.project?.data;
  const validator = a.vali?.data;
  return {
    id: String(node.id),
    name: str(a.shem) ?? '',
    description: plainText(a.des),
    link: str(a.link),
    urgency: str(a.hashivut),
    startsAt: str(a.dateS),
    dueAt: str(a.dateF),
    progress: Number.isFinite(Number(a.status)) ? Number(a.status) : 0,
    status: getActStatus(a),
    source: str(a.source),
    externalId: str(a.externalId),
    updatedAt: str(a.updatedAt),
    createdAt: str(a.createdAt),
    project: project?.id != null ? { id: String(project.id), name: str(project.attributes?.projectName) ?? '' } : null,
    assignees: nodes(a.my).map((u) => ({ id: String(u.id), node: u })),
    accepted: a.myIshur === true,
    validator: validator?.id != null ? { id: String(validator.id), node: validator } : null,
    roleIds: nodes(a.tafkidims).map((r) => String(r.id)),
    roles: nodes(a.tafkidims).map((r) => ({ id: String(r.id), name: str(r.attributes?.roleDescription) ?? '' })),
    missions: nodes(a.mesimabetahaliches).map((m) => ({
      id: String(m.id),
      name: str(m.attributes?.name) ?? '',
      holderId: idOf(m.attributes?.users_permissions_user?.data)
    })),
    forumIds: nodes(a.forums).map((f) => String(f.id)),
    clockDueAt:
      a.timegrama?.data?.attributes && a.timegrama.data.attributes.done !== true
        ? str(a.timegrama.data.attributes.date)
        : null
  };
}

export type TaskRelation = 'assignee' | 'validator' | 'roleHolder' | 'member';

/** Every way the viewer is tied to the act, most binding first. */
export function relationsOf(task: TaskRow, viewerId: string, viewerRoleIds: string[] = []): TaskRelation[] {
  const me = String(viewerId);
  const out: TaskRelation[] = [];
  if (task.assignees.some((p) => p.id === me)) out.push('assignee');
  if (task.validator?.id === me) out.push('validator');
  if (task.assignees.length === 0 && task.roleIds.some((r) => viewerRoleIds.includes(r))) out.push('roleHolder');
  if (out.length === 0) out.push('member');
  return out;
}

/**
 * What the act waits on from this viewer.
 *   approve  — it was handed to them and they have not said yes;
 *   claim    — nobody has it and it is open to them (their role, or nobody's);
 *   do       — it is theirs and under way;
 *   validate — they are the validator and the doer says it is done;
 *   none     — nothing of theirs (someone else's, finished, or waiting on the validator).
 */
export type TaskNextStep = 'approve' | 'claim' | 'do' | 'validate' | 'none';

export function nextStepFor(task: TaskRow, viewerId: string, viewerRoleIds: string[] = []): TaskNextStep {
  const me = String(viewerId);
  const isAssignee = task.assignees.some((p) => p.id === me);
  switch (task.status) {
    case 'pendingApproval':
      return isAssignee ? 'approve' : 'none';
    case 'inProgress':
      return isAssignee ? 'do' : 'none';
    case 'pendingValidation':
      return task.validator?.id === me ? 'validate' : 'none';
    case 'completed':
      return 'none';
    default:
      // Unassigned or published: open to whoever holds one of its roles, or to
      // anyone in the rikma when it names no role.
      if (task.assignees.length > 0) return 'none';
      if (task.roleIds.length === 0) return 'claim';
      return task.roleIds.some((r) => viewerRoleIds.includes(r)) ? 'claim' : 'none';
  }
}

export type ClaimPlan =
  | { kind: 'approve'; missionId: string | null }
  | { kind: 'take'; missionId: string | null }
  | { kind: 'already' }
  | { kind: 'refuse'; code: 'DONE' | 'TAKEN' | 'NOT_IN_ROLE' | 'NOT_YOUR_MISSION'; reason: string };

/**
 * How the viewer takes the act.
 *
 * `requestedMissionId` is a mission of theirs to hang it on; it must be one of
 * `myMissions` (running, theirs, in this rikma). Without it, an act open to a
 * role goes on the first of their missions that carries that role, and an act
 * open to nobody in particular goes on their only mission when they have
 * exactly one. Otherwise it is taken unlinked — and the caller says so, since
 * hours on it will not count until it is linked.
 */
export function claimPlan(
  task: TaskRow,
  viewerId: string,
  myMissions: ViewerMission[],
  requestedMissionId?: string | null
): ClaimPlan {
  const me = String(viewerId);
  if (task.status === 'pendingValidation' || task.status === 'completed') {
    return { kind: 'refuse', code: 'DONE', reason: 'This task is already done.' };
  }

  let requested: ViewerMission | null = null;
  if (requestedMissionId != null && String(requestedMissionId) !== '') {
    requested = myMissions.find((m) => m.id === String(requestedMissionId)) ?? null;
    if (!requested) {
      return {
        kind: 'refuse',
        code: 'NOT_YOUR_MISSION',
        reason: `Mission ${requestedMissionId} is not one of your running missions in this rikma.`
      };
    }
  }
  const linkedToMine = task.missions.some((m) => myMissions.some((x) => x.id === m.id));

  if (task.assignees.some((p) => p.id === me)) {
    const missionId = requested && !task.missions.some((m) => m.id === requested!.id) ? requested.id : null;
    if (task.accepted) return missionId ? { kind: 'approve', missionId } : { kind: 'already' };
    return { kind: 'approve', missionId: missionId ?? (linkedToMine ? null : onlyMission(myMissions)) };
  }
  if (task.assignees.length > 0) {
    return { kind: 'refuse', code: 'TAKEN', reason: 'Someone else already has this task.' };
  }

  if (task.roleIds.length > 0) {
    const inRole = myMissions.filter((m) => m.roleIds.some((r) => task.roleIds.includes(r)));
    if (inRole.length === 0) {
      return { kind: 'refuse', code: 'NOT_IN_ROLE', reason: 'This task is open to a role you do not hold in this rikma.' };
    }
    if (requested && !inRole.some((m) => m.id === requested!.id)) {
      return {
        kind: 'refuse',
        code: 'NOT_IN_ROLE',
        reason: `Mission ${requested.id} does not carry the role this task is open to.`
      };
    }
    return { kind: 'take', missionId: (requested ?? inRole[0]).id };
  }

  return { kind: 'take', missionId: requested?.id ?? (linkedToMine ? null : onlyMission(myMissions)) };
}

function onlyMission(missions: ViewerMission[]): string | null {
  return missions.length === 1 ? missions[0].id : null;
}

/** Why the viewer may not report on the act, or `null` when they may. */
export function reportProblem(task: TaskRow, viewerId: string): string | null {
  const me = String(viewerId);
  if (task.status === 'completed') return 'This task was already validated; it is closed.';
  if (!task.assignees.some((p) => p.id === me)) {
    return task.assignees.length === 0
      ? 'Nobody has this task yet - take it first (claimTaskTool).'
      : 'Only the person this task is assigned to reports on it.';
  }
  return null;
}

// ---------------------------------------------------------------------------
// The report, as a forum message
// ---------------------------------------------------------------------------

export const REPORT_PHASES = ['plan', 'progress', 'blocked', 'done'] as const;
export type ReportPhase = (typeof REPORT_PHASES)[number];

export interface TaskReport {
  phase: ReportPhase;
  summary: string;
  links?: string[];
  verifySteps?: string[];
  remaining?: string[];
}

/** The first line of every report; what `parseReport` keys on. */
export const REPORT_TAG = '[1lev1:report';

/** Fed into a forum message, so bounded: the whole message stays under the chat limit. */
export const REPORT_LIMITS = { summary: 2000, item: 300, items: 12, total: 3800 } as const;

const oneLine = (s: unknown, max: number): string =>
  String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/** Only http(s) links are written; anything else (javascript:, data:) is dropped. */
export function safeLink(s: unknown): string | null {
  const v = oneLine(s, REPORT_LIMITS.item);
  return /^https?:\/\/\S+$/i.test(v) ? v : null;
}

/**
 * The message text. Symbol-led lines and one machine tag, so it reads the same
 * in every language and needs no platform wording of its own — the words are
 * the reporter's.
 */
export function formatReport(report: TaskReport): string {
  const phase = (REPORT_PHASES as readonly string[]).includes(report.phase) ? report.phase : 'progress';
  const lines: string[] = [`${REPORT_TAG} phase=${phase}]`];
  const summary = String(report.summary ?? '').trim().slice(0, REPORT_LIMITS.summary);
  if (summary) lines.push(summary);

  const list = (items: unknown[] | undefined, mark: (i: number) => string, clean: (s: unknown) => string | null) => {
    const kept = (items ?? []).map(clean).filter((s): s is string => !!s).slice(0, REPORT_LIMITS.items);
    if (kept.length) lines.push('', ...kept.map((s, i) => `${mark(i)} ${s}`));
  };
  list(report.links, () => '🔗', safeLink);
  list(report.verifySteps, (i) => `✅ ${i + 1}.`, (s) => oneLine(s, REPORT_LIMITS.item) || null);
  list(report.remaining, () => '⏭', (s) => oneLine(s, REPORT_LIMITS.item) || null);

  return lines.join('\n').slice(0, REPORT_LIMITS.total);
}

/** A message read back as a report, or `null` when it is an ordinary message. */
export function parseReport(text: unknown): TaskReport | null {
  if (typeof text !== 'string' || !text.startsWith(REPORT_TAG)) return null;
  const [head, ...rest] = text.split('\n');
  const m = /phase=(\w+)/.exec(head);
  const phase = (REPORT_PHASES as readonly string[]).includes(m?.[1] ?? '') ? (m![1] as ReportPhase) : 'progress';
  const summary: string[] = [];
  const links: string[] = [];
  const verifySteps: string[] = [];
  const remaining: string[] = [];
  for (const line of rest) {
    if (line.startsWith('🔗 ')) links.push(line.slice(3).trim());
    else if (/^✅ \d+\. /.test(line)) verifySteps.push(line.replace(/^✅ \d+\. /, '').trim());
    else if (line.startsWith('⏭ ')) remaining.push(line.slice(2).trim());
    else if (line.trim() || summary.length) summary.push(line);
  }
  return { phase, summary: summary.join('\n').trim(), links, verifySteps, remaining };
}

// ---------------------------------------------------------------------------
// "Not yet" — the validator's counter to a done report
// ---------------------------------------------------------------------------

/** First line of a validator's "not yet", read back by `parseReturn`. */
export const RETURN_TAG = '[1lev1:return]';
export const RETURN_NOTE_MAX = 2000;

/**
 * Why the viewer may not send the act back, or `null` when they may. Only its
 * validator, and only while it waits for them: once validated it is closed, and
 * before it is reported done there is nothing to answer yet.
 */
export function returnProblem(task: TaskRow, viewerId: string): string | null {
  if (task.validator?.id !== String(viewerId)) return 'Only the validator of this task answers its done report.';
  if (task.status !== 'pendingValidation') {
    return task.status === 'completed'
      ? 'This task was already validated; it is closed.'
      : 'This task is not waiting for validation.';
  }
  return null;
}

/** "Not yet" is a counter with its reason, never a bare no: the note is required. */
export function formatReturn(note: string): string {
  return `${RETURN_TAG}\n${String(note ?? '').trim().slice(0, RETURN_NOTE_MAX)}`;
}

export function parseReturn(text: unknown): { note: string } | null {
  if (typeof text !== 'string' || !text.startsWith(RETURN_TAG)) return null;
  return { note: text.slice(RETURN_TAG.length).trim() };
}

// ---------------------------------------------------------------------------
// The validation clock — silence is consent, at the rikma's pace
// ---------------------------------------------------------------------------

/**
 * What an `act` timegrama means when it comes due.
 *   reminder — an automatic act's due-time reminder (PLAN_SHOP_OPERATIONS A2),
 *              which keeps its own handler;
 *   mature   — a done report nobody answered: it is validated by silence;
 *   stale    — the clock outlived its question (sent back, validated, gone).
 */
export type ActClockMeaning = 'reminder' | 'mature' | 'stale';

export function actClockMeaning(a: {
  exists: boolean;
  automatic: boolean;
  naasa: boolean;
  valiIshur: boolean;
  hasValidator: boolean;
}): ActClockMeaning {
  if (a.automatic) return 'reminder';
  if (!a.exists || !a.hasValidator) return 'stale';
  return a.naasa && !a.valiIshur ? 'mature' : 'stale';
}

/** A message as a one-line preview: a report or a "not yet" without its machine tag. */
export function messagePreview(text: unknown): string {
  if (typeof text !== 'string') return '';
  const report = parseReport(text);
  if (report) return report.summary.split('\n')[0] ?? '';
  const back = parseReturn(text);
  return back ? back.note.split('\n')[0] ?? '' : text;
}

/** A forum subject for an act's thread — names it; access never comes from it. */
export const ACT_FORUM_PREFIX = 'ACT::';

export function actForumSubject(actId: string | number, name: string): string {
  return `${ACT_FORUM_PREFIX}${actId}::${String(name ?? '').replace(/::/g, ':').slice(0, 120)}`;
}
