/**
 * Taking an act and reporting on it — docs/tbd/PLAN_AGENT_WORK.md, AW1.
 *
 *   claimTask  — "I'll do it": accept an act handed to me, or take one open to
 *                my role (or to nobody in particular), hung on one of my own
 *                running missions so the hours it takes count.
 *   reportTask — what the doer (usually their agent) says about it: a plan,
 *                progress, being stuck, or done. The words go into the act's
 *                own thread; `done` also marks the act done, which hands it to
 *                its validator — and only the validator is told — and arms
 *                the silence clock (validationClock.ts). The site's "done"
 *                button comes through here too, without words.
 *   returnTask — the validator's "not yet", with its reason: back to the doer.
 *
 * Both write the act through `updateTask`, never a raw mutation, so the
 * GitHub issue comment and the outgoing task webhooks (webhooks/dispatch.ts)
 * fire exactly as they do for a click on the site.
 *
 * `updateTask` itself only checks that the caller is a member of the rikma.
 * The checks here — whose act it is, which mission it may hang on, who may
 * report — are the real gate for these two paths, so they are explicit and
 * live in the pure `$lib/acts/agentTasks`.
 */
import { env } from '$env/dynamic/private';
import type { ActionConfig, ActionContext, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { missionsMapOf } from '$lib/fulfillment/rows';
import { armValidationClock, closeValidationClocks } from '$lib/server/acts/validationClock';
import {
  REPORT_PHASES,
  actForumSubject,
  claimPlan,
  formatReport,
  formatReturn,
  reportProblem,
  returnProblem,
  taskOf,
  type ReportPhase,
  type TaskRow,
  type ViewerMission
} from '$lib/acts/agentTasks';

type Strapi = { execute: (qid: string, vars: any, jwt?: any, fetchFn?: any) => Promise<any> };

const run = (strapi: Strapi, context: ActionContext) => (qid: string, vars: Record<string, unknown>) =>
  strapi.execute(qid, vars, context.jwt, context.fetch);

async function runAction(key: string, params: Record<string, any>, context: ActionContext) {
  const { actionService } = await import('$lib/server/actions/index.js');
  return actionService.executeAction(key, params, context);
}

/** The act, fenced to the rikma named in the call. */
async function loadTask(strapi: Strapi, context: ActionContext, projectId: string, actId: string): Promise<TaskRow> {
  const res = await run(strapi, context)('agentTaskById', { id: actId });
  const task = taskOf(res?.data?.act?.data);
  if (!task || task.project?.id !== projectId) {
    throw new ActionError('NOT_FOUND', `No task ${actId} in this rikma`);
  }
  return task;
}

/** The act, plus the rikma's restime — the pace of its validation clock. */
async function loadTaskWithRestime(strapi: Strapi, context: ActionContext, projectId: string, actId: string) {
  const res = await run(strapi, context)('agentTaskById', { id: actId });
  const node = res?.data?.act?.data;
  const task = taskOf(node);
  if (!task || task.project?.id !== projectId) {
    throw new ActionError('NOT_FOUND', `No task ${actId} in this rikma`);
  }
  return { task, restime: (node?.attributes?.project?.data?.attributes?.restime as string | null) ?? null };
}

/**
 * Write one message in the task's thread. Same write and the same `via` switch
 * as createChatMessage (chat.ts), but not through it on purpose: a task's
 * thread is rikma-wide, and that action tells every participant — a report is
 * for its validator, and a "not yet" for its doer.
 */
async function postToThread(strapi: Strapi, context: ActionContext, forumId: string, text: string, viaAgent: boolean) {
  const markVia = viaAgent && env.CHAT_VIA_ENABLED === 'true';
  const da = new Date().toISOString();
  const msg = await run(strapi, context)(markVia ? '1chatsendVia' : '1chatsend', {
    fid: forumId,
    fidn: parseInt(forumId, 10),
    idL: String(context.userId),
    da,
    mes: text,
    ...(markVia ? { via: 'agent' } : {})
  });
  if (msg?.errors) throw new ActionError('MESSAGE_FAILED', `Could not save the message: ${msg.errors[0]?.message ?? ''}`);
  const id = msg?.data?.createMessage?.data?.id;
  return id != null ? String(id) : null;
}

async function usernameOf(strapi: Strapi, context: ActionContext, userId: string): Promise<string> {
  const res = await run(strapi, context)('24userJSONQue', { uid: userId });
  return res?.data?.usersPermissionsUser?.data?.attributes?.username || '';
}

/** The caller's own running missions in the rikma, with the roles each carries. */
export async function myRunningMissions(
  strapi: Strapi,
  context: ActionContext,
  projectId: string
): Promise<ViewerMission[]> {
  const res = await run(strapi, context)('fulfillmentMissions', { pid: projectId });
  const me = String(context.userId);
  return [...missionsMapOf(res?.data?.mesimabetahaliches?.data ?? []).values()]
    .filter((m) => !m.closed && m.holderId === me)
    .map((m) => ({ id: m.id, name: m.name, roleIds: m.roleIds }));
}

async function updateTask(context: ActionContext, params: Record<string, any>) {
  const r = await runAction('updateTask', params, context);
  if (!r.success) throw new ActionError('UPDATE_FAILED', r.error?.message ?? 'Could not update the task');
}

const claimTask: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const me = String(context.userId);
  const task = await loadTask(strapi as Strapi, context, projectId, String(params.id));
  const missions = await myRunningMissions(strapi as Strapi, context, projectId);
  const plan = claimPlan(task, me, missions, params.missionId != null ? String(params.missionId) : null);

  if (plan.kind === 'refuse') throw new ActionError(plan.code, plan.reason);

  let missionIds = task.missions.map((m) => m.id);
  if (plan.kind === 'approve') {
    if (plan.missionId) missionIds = [...missionIds, plan.missionId];
    await updateTask(context, {
      id: task.id,
      projectId,
      myIshur: true,
      ...(plan.missionId ? { mesimabetahaliches: missionIds } : {})
    });
  } else if (plan.kind === 'take') {
    if (plan.missionId) missionIds = [plan.missionId];
    await updateTask(context, {
      id: task.id,
      projectId,
      uid: [me],
      isAssigned: true,
      myIshur: true,
      ...(plan.missionId ? { mesimabetahaliches: missionIds } : {})
    });
  }

  const mine = new Set(missions.map((m) => m.id));
  return {
    id: task.id,
    projectId,
    name: task.name,
    outcome: plan.kind === 'already' ? 'already' : plan.kind === 'approve' ? 'accepted' : 'taken',
    missionIds,
    /** Hours count only on an act hung on one of the doer's own missions. */
    onMyMission: missionIds.some((id) => mine.has(id)),
    myMissions: missions.map((m) => ({ id: m.id, name: m.name }))
  };
};

/** The act's own thread, created the first time something is said about it. */
async function ensureActForum(strapi: Strapi, context: ActionContext, task: TaskRow, projectId: string) {
  if (task.forumIds[0]) return { forumId: task.forumIds[0], created: false };
  const res = await run(strapi, context)('agentActForumCreate', {
    pid: projectId,
    actId: task.id,
    subject: actForumSubject(task.id, task.name),
    da: new Date().toISOString()
  });
  const forumId = res?.data?.createForum?.data?.id;
  if (!forumId) throw new ActionError('FORUM_FAILED', 'Could not open the task thread');
  return { forumId: String(forumId), created: true };
}

const reportTask: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const me = String(context.userId);
  const phase = String(params.phase) as ReportPhase;
  if (!(REPORT_PHASES as readonly string[]).includes(phase)) {
    throw new ActionError('VALIDATION_FAILED', `phase must be one of ${REPORT_PHASES.join(', ')}`);
  }
  const summary = String(params.summary ?? '').trim();
  // The site's "done" button says nothing more than done; every other report has words.
  if (!summary && phase !== 'done') throw new ActionError('VALIDATION_FAILED', 'summary is required');

  const s = strapi as Strapi;
  const { task, restime } = await loadTaskWithRestime(s, context, projectId, String(params.id));
  const problem = reportProblem(task, me);
  if (problem) throw new ActionError('NOT_YOURS', problem);
  if (phase === 'done' && task.status === 'pendingValidation') {
    throw new ActionError('ALREADY_DONE', 'This task is already waiting for its validator.');
  }

  // Reporting on an act handed to you is saying yes to it.
  if (!task.accepted) await updateTask(context, { id: task.id, projectId, myIshur: true });

  let forumId: string | null = task.forumIds[0] ?? null;
  let created = false;
  let messageId: string | null = null;
  if (summary) {
    const text = formatReport({
      phase,
      summary,
      links: Array.isArray(params.links) ? params.links : [],
      verifySteps: Array.isArray(params.verifySteps) ? params.verifySteps : [],
      remaining: Array.isArray(params.remaining) ? params.remaining : []
    });
    ({ forumId, created } = await ensureActForum(s, context, task, projectId));
    messageId = await postToThread(s, context, forumId, text, params.via === 'agent');
  }

  let validationDueAt: string | null = null;
  if (phase === 'done') {
    await updateTask(context, { id: task.id, projectId, naasa: true, status: 100 });
    // Silence is consent: unanswered by restime, the task is validated (validationClock.ts).
    if (task.validator && task.validator.id !== me) {
      ({ dueAt: validationDueAt } = await armValidationClock(run(s, context), task.id, restime));
    }
  }

  const username = await usernameOf(s, context, me);
  const validatorId = task.validator?.id ?? null;
  const tellValidator = (phase === 'done' || phase === 'blocked') && validatorId && validatorId !== me;

  return {
    id: task.id,
    projectId,
    name: task.name,
    phase,
    username,
    forumId,
    forumCreated: created,
    messageId,
    status: phase === 'done' ? 'pendingValidation' : task.accepted ? task.status : 'inProgress',
    validatorId,
    validationDueAt,
    // The reporter's own missions the task hangs on: where its hours are saved.
    missionIds: task.missions.filter((m) => m.holderId === me).map((m) => m.id),
    notifyUserIds: tellValidator ? [validatorId] : []
  };
};

/**
 * "Not yet" — the validator's counter to a done report. Never a bare no: the
 * note is required and goes into the task's thread, the task goes back to its
 * doer as under way, and the silence clock closes. The next "done" opens a new one.
 */
const returnTask: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const me = String(context.userId);
  const note = String(params.note ?? '').trim();
  if (!note) throw new ActionError('VALIDATION_FAILED', 'Say what is still missing - a note is required.');

  const s = strapi as Strapi;
  const task = await loadTask(s, context, projectId, String(params.id));
  const problem = returnProblem(task, me);
  if (problem) throw new ActionError('NOT_YOURS', problem);

  const { forumId } = await ensureActForum(s, context, task, projectId);
  const messageId = await postToThread(s, context, forumId, formatReturn(note), params.via === 'agent');
  await updateTask(context, { id: task.id, projectId, naasa: false, status: 90 });
  await closeValidationClocks(run(s, context), task.id);

  return {
    id: task.id,
    projectId,
    name: task.name,
    username: await usernameOf(s, context, me),
    forumId,
    messageId,
    status: 'inProgress',
    notifyUserIds: task.assignees.map((p) => p.id).filter((id) => id !== me)
  };
};

const TEMPLATES_DONE = {
  title: { he: '{{name}}: מוכן לבדיקה שלך', en: '{{name}}: ready for you to check', ar: '{{name}}: جاهزة لتتحقق منها' },
  body: {
    he: '{{username}} מדווח/ת שהמטלה בוצעה. מה לבדוק כתוב בשיחה של המטלה.',
    en: '{{username}} reports the task is done. What to check is in the task thread.',
    ar: '{{username}} أبلغ/ت أن المهمة أُنجزت. ما يجب التحقق منه مكتوب في محادثة المهمة.'
  }
};

const TEMPLATES_BLOCKED = {
  title: { he: '{{name}}: נתקע', en: '{{name}}: stuck', ar: '{{name}}: متوقفة' },
  body: {
    he: '{{username}} נתקע/ה במטלה וכתב/ה למה בשיחה של המטלה.',
    en: '{{username}} is stuck on the task and wrote why in the task thread.',
    ar: '{{username}} توقف/ت في المهمة وكتب/ت السبب في محادثة المهمة.'
  }
};

export const agentTaskActions: ActionConfig[] = [
  {
    key: 'claimTask',
    description: 'Accept a task handed to me, or take one open to my role, on one of my own running missions',
    graphqlOperation: claimTask,
    paramSchema: {
      id: { type: 'string', required: true, description: 'Act id' },
      projectId: { type: 'string', required: true, description: 'The rikma the act belongs to' },
      missionId: { type: 'string', required: false, description: 'One of my running missions to hang the act on' }
    },
    authRules: [
      { type: 'jwt', errorMessage: 'You must be logged in' },
      { type: 'projectMember', config: { projectIdParam: 'projectId' }, errorMessage: 'Only members of the rikma take its tasks' }
    ],
    // updateTask, run inside, already tells the rikma and its boards.
    updateStrategy: { type: 'none' },
    realtime: {
      scopes: (p) => scopeList([scope('project', p.projectId), scope('act', p.id)])
    }
  },
  {
    key: 'reportTask',
    description: "The doer's report on a task - plan, progress, stuck or done - in the task's own thread",
    graphqlOperation: reportTask,
    paramSchema: {
      id: { type: 'string', required: true, description: 'Act id' },
      projectId: { type: 'string', required: true, description: 'The rikma the act belongs to' },
      phase: { type: 'string', required: true, description: 'plan | progress | blocked | done' },
      // Optional only for "done": the site's button reports done without words.
      summary: { type: 'string', required: false, description: 'What was done or planned, in the reporter’s words' },
      links: { type: 'array', required: false, description: 'http(s) links: PR, commit, preview' },
      verifySteps: { type: 'array', required: false, description: 'How the validator checks it, step by step' },
      remaining: { type: 'array', required: false, description: 'What is left for later' },
      via: { type: 'string', required: false, description: "'agent' when an agent wrote it for the member" }
    },
    authRules: [
      { type: 'jwt', errorMessage: 'You must be logged in' },
      { type: 'projectMember', config: { projectIdParam: 'projectId' }, errorMessage: 'Only members of the rikma report on its tasks' }
    ],
    notification: {
      when: (_p, r) => Array.isArray(r?.notifyUserIds) && r.notifyUserIds.length > 0,
      recipients: { type: 'specificUsers', config: { userIdsParam: 'notifyUserIds', excludeSender: true } },
      templates: TEMPLATES_DONE,
      templatesFor: (_p, r) => (r?.phase === 'blocked' ? TEMPLATES_BLOCKED : TEMPLATES_DONE),
      // Done waits for the validator's answer; stuck is only news for them.
      intent: (_p, r) => (r?.phase === 'done' ? 'consent' : 'personal'),
      metadata: { priority: 'normal', url: '/forum/{{forumId}}', forumId: '{{forumId}}' }
    },
    updateStrategy: { type: 'none' },
    realtime: {
      scopes: (p, r) => scopeList([scope('project', p.projectId), scope('act', p.id), scope('forum', r?.forumId)])
    }
  },
  {
    key: 'returnTask',
    description: 'The validator\'s "not yet": the task goes back to its doer with a note, and its silence clock closes',
    graphqlOperation: returnTask,
    paramSchema: {
      id: { type: 'string', required: true, description: 'Act id' },
      projectId: { type: 'string', required: true, description: 'The rikma the act belongs to' },
      note: { type: 'string', required: true, description: 'What is still missing or not working' },
      via: { type: 'string', required: false, description: "'agent' when an agent wrote it for the member" }
    },
    authRules: [
      { type: 'jwt', errorMessage: 'You must be logged in' },
      { type: 'projectMember', config: { projectIdParam: 'projectId' }, errorMessage: 'Only members of the rikma answer its tasks' }
    ],
    notification: {
      when: (_p, r) => Array.isArray(r?.notifyUserIds) && r.notifyUserIds.length > 0,
      recipients: { type: 'specificUsers', config: { userIdsParam: 'notifyUserIds', excludeSender: true } },
      templates: {
        title: { he: '{{name}}: עוד לא', en: '{{name}}: not yet', ar: '{{name}}: ليس بعد' },
        body: {
          he: '{{username}} בדק/ה ומשהו עדיין חסר. מה בדיוק — בשיחה של המטלה.',
          en: '{{username}} checked and something is still missing. What exactly is in the task thread.',
          ar: '{{username}} تحقق/ت وما زال شيء ناقصًا. التفاصيل في محادثة المهمة.'
        }
      },
      // Work is back on them; nothing is counted against their silence.
      intent: 'personal',
      metadata: { priority: 'normal', url: '/forum/{{forumId}}', forumId: '{{forumId}}' }
    },
    updateStrategy: { type: 'none' },
    realtime: {
      scopes: (p, r) => scopeList([scope('project', p.projectId), scope('act', p.id), scope('forum', r?.forumId)])
    }
  }
];
