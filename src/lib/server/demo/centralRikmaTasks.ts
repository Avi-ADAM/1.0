/**
 * Turn a personal-demo request into real work in the central rikma.
 *
 * A lead who asks for a demo creates two obligations for the team, and the
 * platform's own answer to "who does this" is a task inside a rikma — not a row
 * in a CRM. So each demo request opens two **Acts** in the central rikma:
 *
 *   1. **coordinate** — reach the person, agree on a time.
 *   2. **the call itself** — hold the 20-minute demo.
 *
 * They are separate on purpose: the coordination is short and anyone can pick
 * it up, the call is longer and usually wants someone who can actually walk
 * through the system.
 *
 * Both are created **unassigned** (`isAssigned:false`, no `my`, no roles).
 * That is the whole point: with no assignee, `createTask`'s notification rule
 * falls back to the project's members, so everyone relevant hears about the
 * lead instead of one person being silently made responsible for it. Whoever is
 * free takes it. (Promoting an Act into a full open mission is a feature
 * arriving separately — this deliberately doesn't pre-empt it.)
 *
 * Creation goes through `actionService.executeAction('createTask', …)` rather
 * than a raw mutation, so validation, authorization and — crucially — the
 * notification fan-out are exactly the ones a task created inside the app gets.
 * `/api/demo` is anonymous, so the acting member comes from `DEMO_HOST_USER_ID`
 * and the admin token stands in for their JWT, the same shape `/api/v1/actions`
 * uses for API-key traffic.
 *
 * Configuration: `DEMO_CENTRAL_PROJECT_ID` names the central rikma and
 * `DEMO_HOST_USER_ID` the team member the tasks are opened by — who **must be a
 * member of that rikma**, since `createTask` enforces `projectMember`. With
 * either unset the whole thing no-ops (`reason:'not_configured'`) and the demo
 * request is still saved: the tasks are a convenience, never a precondition for
 * capturing a lead.
 *
 * Best-effort throughout: a Strapi hiccup here must never fail `/api/demo`.
 */

import { env } from '$env/dynamic/private';
import { actionService } from '$lib/server/actions/index.js';
import type { ActionContext } from '$lib/server/actions/types.js';

/** The two tasks a demo request generates. */
export type DemoTaskKind = 'coordinate' | 'call';

export interface DemoTaskLead {
  name: string;
  email?: string | null;
  phone?: string | null;
  /** Which of the four tracks they picked on the form. */
  track?: string | null;
  /** What they said they want to build or solve, in their own words. */
  goal?: string | null;
  /** How they want to meet: a fixed slot, drop-in, a callback, or a recording. */
  timeMode?: string | null;
  /** Free-text time preference ("evenings", "Sunday after 18:00", …). */
  preferredTime?: string | null;
  lang?: string | null;
  /** Strapi id of the `demo-request` row, so the task points back at it. */
  demoRequestId?: string | number | null;
  /** Guest link into the meetings app, when one was minted. */
  meetingLink?: string | null;
}

export interface DemoTasksResult {
  created: boolean;
  reason?: 'not_configured' | 'error';
  /** Act ids, present for whichever of the two succeeded. */
  coordActId?: string;
  callActId?: string;
}

/** `ADMINMONTHER` occasionally arrives with its own name or whitespace glued on. */
function adminToken(): string {
  let t = String(env.ADMINMONTHER ?? '').replace(/\s+/g, '');
  if (t.startsWith('ADMINMONTHER=')) t = t.slice('ADMINMONTHER='.length);
  return t;
}

/** The central rikma's project id, or '' when the feature is not configured. */
export function centralRikmaId(): string {
  return String(env.DEMO_CENTRAL_PROJECT_ID ?? '').trim();
}

/** The team member the demo tasks are opened by, or '' when not configured. */
export function demoHostId(): string {
  return String(env.DEMO_HOST_USER_ID ?? '').trim();
}

const TRACK_LABELS: Record<string, string> = {
  idea: 'רעיון למיזם',
  partnership: 'שותפות קיימת',
  provider: 'נותן/ת שירות שמחפש/ת מיזמים',
  curious: 'רוצה להכיר את המערכת'
};

const TIME_MODE_LABELS: Record<string, string> = {
  scheduled: 'רוצה לקבוע זמן מראש',
  flexible: 'מעדיף/ה להיכנס בזמן שנוח (פגישת אורח)',
  callback: 'השאיר/ה פרטים — נחזור אליו/ה',
  recorded: 'ביקש/ה קודם דמו מוקלט'
};

/**
 * The shared body of both tasks: everything the person who picks it up needs in
 * order to make the call useful, without opening another tab.
 */
function leadBrief(lead: DemoTaskLead): string {
  const contact = [lead.email, lead.phone].filter(Boolean).join(' · ') || '—';
  return [
    `שם: ${lead.name}`,
    `יצירת קשר: ${contact}`,
    `מה הכי קרוב אליהם: ${TRACK_LABELS[String(lead.track)] ?? lead.track ?? '—'}`,
    `העדפת מועד: ${TIME_MODE_LABELS[String(lead.timeMode)] ?? lead.timeMode ?? '—'}` +
      (lead.preferredTime ? ` (${lead.preferredTime})` : ''),
    lead.goal ? `מה הם רוצים ליצור: ${lead.goal}` : null,
    lead.lang ? `שפה: ${lead.lang}` : null,
    lead.meetingLink ? `קישור פגישה לאורח: ${lead.meetingLink}` : null,
    lead.demoRequestId ? `demo-request #${lead.demoRequestId}` : null
  ]
    .filter(Boolean)
    .join('\n');
}

/** Days from now for a task's due date, or null to leave it open. */
const DUE_DAYS: Record<DemoTaskKind, number | null> = {
  // A coordination task with no due date is exactly the task that rots — the
  // lead is waiting for a reply, so it carries a short one.
  coordinate: 3,
  // The call's date is whatever the two of them agree on; a made-up deadline
  // here would only be noise on the board.
  call: null
};

/** Title, description and urgency for one of the two tasks. */
function taskSpec(kind: DemoTaskKind, lead: DemoTaskLead) {
  const brief = leadBrief(lead);
  if (kind === 'coordinate') {
    return {
      name: `תיאום שיחת דמו · ${lead.name}`,
      description: `ליצור קשר עם מי שביקש/ה דמו אישי ולסגור מועד לשיחה של כ‑20 דקות.\n\n${brief}`,
      hashivut: 'yellow'
    };
  }
  return {
    name: `שיחת דמו אישית · ${lead.name}`,
    description:
      `להעביר דמו אישי של כ‑20 דקות: איך 1💗1 מתאימה למצב שלהם — חלוקת תרומות, ` +
      `משימות, קבלת החלטות והצטרפות שותפים.\n\n${brief}`,
    hashivut: 'green'
  };
}

function dueDate(kind: DemoTaskKind): string | undefined {
  const days = DUE_DAYS[kind];
  if (days == null) return undefined;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

/** Create one unassigned Act in the central rikma. Returns its id. */
async function createOne(
  context: ActionContext,
  projectId: string,
  kind: DemoTaskKind,
  lead: DemoTaskLead
): Promise<string> {
  const spec = taskSpec(kind, lead);

  const due = dueDate(kind);

  const result = await actionService.executeAction(
    'createTask',
    {
      projectId,
      name: spec.name,
      description: spec.description,
      hashivut: spec.hashivut,
      // Nobody is made responsible for this. An empty `notifyUserIds` is what
      // makes createTask's notification rule fall back to the whole rikma.
      isAssigned: false,
      dateS: new Date().toISOString(),
      ...(due ? { dateF: due } : {})
    },
    context
  );

  if (!result.success) {
    throw new Error(result.error?.message ?? `createTask failed for "${kind}"`);
  }

  const id = result.data?.id;
  if (!id) throw new Error(`createTask returned no id for "${kind}"`);
  return String(id);
}

/**
 * Open the coordinate + call tasks for one demo request.
 *
 * Each task is attempted independently: if the call task fails, the
 * coordination one that already succeeded is still reported back, so the caller
 * can store what it got.
 */
export async function createDemoTasks(
  lead: DemoTaskLead,
  fetchFn: typeof globalThis.fetch = fetch
): Promise<DemoTasksResult> {
  const projectId = centralRikmaId();
  const hostId = demoHostId();
  if (!projectId || !hostId) return { created: false, reason: 'not_configured' };

  // Strapi has no notion of "the system": the tasks are opened by the demo
  // host, with the admin token standing in for their JWT.
  const context: ActionContext = {
    userId: hostId,
    jwt: adminToken(),
    lang: 'he',
    fetch: fetchFn
  };

  const out: DemoTasksResult = { created: false };

  for (const kind of ['coordinate', 'call'] as const) {
    try {
      const id = await createOne(context, projectId, kind, lead);
      if (kind === 'coordinate') out.coordActId = id;
      else out.callActId = id;
      out.created = true;
    } catch (e) {
      console.error(`[demo] central-rikma "${kind}" task failed:`, e);
      out.reason = 'error';
    }
  }

  return out;
}
