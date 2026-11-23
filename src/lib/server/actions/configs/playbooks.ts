/**
 * proposePlaybookUpdate — docs/tbd/PLAN_AGENT_WORK.md, AW2.
 *
 * A playbook is what every agent of every member trusts, so nobody — member
 * or agent — rewrites it alone. A rikma of one writes directly; otherwise the
 * new text becomes a `kind: playbook` Decision, rikma-wide, that matures on
 * everyone's yes or on restime silence (the proposer signs by proposing).
 *
 * A new proposal for the same playbook replaces one still open — it is the
 * counter-proposal of this kind: the old text leaves the table and its clock
 * closes, and the new one starts a fresh restime. Nothing is ever a "no".
 *
 * Who signs is everyone in the rikma, not only the role's holder: wider than
 * the plan's first sketch (§AW2 "מי שמחזיק את התפקיד מאשר"), and the rule
 * that holds when nobody holds the role (§7 ש9).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { calcDeadlineMs } from './actionUtils.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { noticeSubject } from '$lib/notices/links';
import { bodyProblem, cleanBody, pickPlaybooks, sameSlot, PLAYBOOK_MAX } from '$lib/playbooks/playbook';
import { loadOpenProposals, loadPlaybooks, writePlaybook, type Run } from '$lib/server/playbooks/store';

const serviceRun = (strapi: any, context: any): Run => (qid, vars) => strapi.execute(qid, vars, undefined, context.fetch);

const proposePlaybookUpdate: ActionExecutionHandler = async (params, context, { strapi }) => {
  const run = serviceRun(strapi, context);
  const projectId = String(params.projectId);
  const roleId = params.roleId ? String(params.roleId) : null;
  const body = cleanBody(params.body);
  const problem = bodyProblem(body);
  if (problem === 'empty') throw new ActionError('VALIDATION_FAILED', 'The playbook text is empty');
  if (problem === 'tooLong') throw new ActionError('VALIDATION_FAILED', `The playbook is longer than ${PLAYBOOK_MAX} characters`);
  const title = String(params.title ?? '').trim().slice(0, 200);

  const base = await strapi.execute('getProjectBaseInfo', { pid: projectId }, undefined, context.fetch);
  const attrs = base?.data?.project?.data?.attributes;
  if (!attrs) throw new ActionError('NOT_FOUND', 'No such rikma');
  const memberCount: number = attrs.user_1s?.data?.length ?? 1;

  // The slot is resolved here, never trusted from the caller: the rikma-wide one, or this role's.
  const current = pickPlaybooks(await loadPlaybooks(run, projectId), roleId);
  const doc = roleId ? current.role : current.general;
  const docId = doc?.docId ?? null;
  if (doc && doc.body === body) return { applied: false, unchanged: true, docId, decisionId: null };

  const name = title || doc?.title || (roleId ? 'Playbook' : 'Rikma playbook');

  if (memberCount <= 1) {
    const written = await writePlaybook(run, { projectId, docId, roleId, title: name, body, byUserId: String(context.userId) });
    return { applied: true, docId: written, decisionId: null };
  }

  // A newer text for the same playbook takes the old one off the table.
  const open = (await loadOpenProposals(run, projectId)).filter((p) => sameSlot(p, { docId, roleId }));
  const replaced: string[] = [];
  for (const p of open) {
    await run('playbookDecisionArchive', { id: p.decisionId });
    // Its clock closes too, so silence cannot apply a text that is no longer on the table.
    if (p.timegramaId) await run('35updateTimeGrama', { id: p.timegramaId, done: true }).catch(() => null);
    replaced.push(p.decisionId);
  }

  const now = new Date();
  const deadline = new Date(now.getTime() + calcDeadlineMs(attrs.restime ?? 'feh')).toISOString();
  const res = await run('playbookDecisionCreate', {
    projectIds: [projectId],
    publishedAt: now.toISOString(),
    decisionName: name,
    newPlaybook: body,
    playbookDoc: docId,
    playbookRole: roleId,
    vots: [{ what: true, users_permissions_user: String(context.userId) }]
  });
  const decisionId = res?.data?.createDecision?.data?.id;
  if (!decisionId) throw new Error(`Could not open the playbook proposal: ${JSON.stringify(res?.errors ?? 'no answer')}`);
  await strapi.execute('32createTimeGrama', { whatami: 'decision', decision: decisionId, date: deadline }, context.jwt, context.fetch);

  return { applied: false, docId, decisionId: String(decisionId), deadline, replaced };
};

export const proposePlaybookUpdateConfig: ActionConfig = {
  key: 'proposePlaybookUpdate',
  description:
    "Propose a new text for a rikma playbook (rikma-wide, or one role's). Written directly in a rikma of one; otherwise opens a 'playbook' Decision that matures on consent or restime silence, replacing an open proposal for the same playbook.",
  graphqlOperation: proposePlaybookUpdate,
  paramSchema: {
    projectId: { type: 'string', required: true, description: 'The rikma' },
    roleId: { type: 'string', required: false, description: "A role (tafkidim) id for that role's playbook; omit for the rikma-wide one" },
    body: { type: 'string', required: true, description: 'The whole new text, plain' },
    title: { type: 'string', required: false, description: 'A short title' },
    via: { type: 'string', required: false, description: "'agent' when an agent wrote it for the member" }
  },
  access: ['user', 'serviceAdmin'],
  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in' },
    { type: 'projectMember', config: { projectIdParam: 'projectId' }, errorMessage: 'Only members of the rikma propose changes to its playbooks' }
  ],
  notification: {
    when: (_p, r) => !!(r?.decisionId ?? r?.data?.decisionId),
    recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId', excludeSender: true } },
    templates: {
      title: {
        he: 'הצעה לעדכן את ספר העבודה של הרקמה',
        en: "A proposal to update the rikma's playbook",
        ar: 'اقتراح لتحديث دليل عمل الريكما',
        ru: 'Предложение обновить рабочую книгу рикмы',
        es: 'Una propuesta para actualizar el manual de trabajo de la rikma'
      },
      body: {
        he: 'הסוכנים של כל החברים קוראים את ספר העבודה. אפשר לקרוא את הנוסח החדש ולאשר בלב, או להציע נוסח אחר',
        en: "Every member's agents read the playbook. Read the new text and approve it in your heart, or propose another",
        ar: 'وكلاء جميع الأعضاء يقرؤون دليل العمل. اقرأ النص الجديد ووافق عليه في القلب، أو اقترح نصًا آخر',
        ru: 'Рабочую книгу читают агенты всех участников. Прочитайте новый текст и одобрите в сердце или предложите другой',
        es: 'Los agentes de todos los miembros leen el manual. Lee el nuevo texto y apruébalo en tu corazón, o propón otro'
      }
    },
    intent: 'consent',
    subject: (p, r) => {
      const id = r?.decisionId ?? r?.data?.decisionId;
      return id ? noticeSubject('decision', id, p.projectId, 'hachla') : null;
    },
    metadata: { type: 'base', url: '/moach/{{projectId}}/votes' }
  },
  updateStrategy: { type: 'none' },
  realtime: { scopes: (p) => scopeList([scope('project', p.projectId)]) }
};

export const playbookActions: ActionConfig[] = [proposePlaybookUpdateConfig];
