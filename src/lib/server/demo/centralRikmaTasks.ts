/**
 * Turn a personal-demo request into real work in the central rikma.
 *
 * A lead who asks for a demo creates two obligations for the team, and the
 * platform's own answer to "who does this and what is it worth" is a mission
 * inside a rikma — not a row in a CRM. So each demo request opens two open
 * missions in the central rikma:
 *
 *   1. **coordinate** — reach the person, agree on a time.
 *   2. **the call itself** — hold the 20-minute demo.
 *
 * They are separate on purpose: the coordination is short and anyone can pick
 * it up, the call is longer and usually wants someone who can actually walk
 * through the system. Both are ordinary `OpenMission`s (`archived:false`,
 * `isRishon:false`, `source:'project'`), so they show up on the rikma's board,
 * can be claimed, timed and split like any other mission — no new machinery.
 *
 * Configuration: `DEMO_CENTRAL_PROJECT_ID` names the central rikma. With it
 * unset the whole thing no-ops (`reason:'not_configured'`) and the demo request
 * is still saved — the tasks are a convenience, never a precondition for
 * capturing a lead. `DEMO_COORD_HOURS` / `DEMO_CALL_HOURS` override the default
 * hour estimates.
 *
 * Best-effort throughout: a Strapi hiccup here must never fail `/api/demo`.
 */

import { env } from '$env/dynamic/private';
import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';

/** The two missions a demo request generates. */
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
  /** Strapi id of the `demo-request` row, so the mission points back at it. */
  demoRequestId?: string | number | null;
  /** Guest link into the meetings app, when one was minted. */
  meetingLink?: string | null;
}

export interface DemoTasksResult {
  created: boolean;
  reason?: 'not_configured' | 'error';
  /** OpenMission ids, keyed by kind — present for whichever ones succeeded. */
  coordMissionId?: string;
  callMissionId?: string;
}

const CREATE_MISSION = `mutation DemoCreateMission($missionName: String, $descrip: String, $publishedAt: DateTime) {
  createMission(data: { missionName: $missionName, descrip: $descrip, publishedAt: $publishedAt }) {
    data { id }
  }
}`;

const CREATE_OPEN_MISSION = `mutation DemoCreateOpenMission(
  $projectId: ID!
  $missionId: ID!
  $name: String!
  $descrip: String
  $noofhours: Float
  $publishedAt: DateTime!
) {
  createOpenMission(data: {
    project: $projectId
    mission: $missionId
    name: $name
    descrip: $descrip
    noofhours: $noofhours
    source: project
    isRishon: false
    archived: false
    publishedAt: $publishedAt
  }) {
    data { id }
  }
}`;

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

function hours(name: 'DEMO_COORD_HOURS' | 'DEMO_CALL_HOURS', fallback: number): number {
  const n = Number(env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
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
 * The shared body of both missions: everything the person on the other end
 * needs in order to make the call useful, without opening another tab.
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

/** Title + description + hour estimate for one of the two missions. */
function taskSpec(kind: DemoTaskKind, lead: DemoTaskLead) {
  const brief = leadBrief(lead);
  if (kind === 'coordinate') {
    return {
      name: `תיאום שיחת דמו · ${lead.name}`,
      descrip:
        `ליצור קשר עם מי שביקש/ה דמו אישי ולסגור מועד לשיחה של כ‑20 דקות.\n\n${brief}`,
      noofhours: hours('DEMO_COORD_HOURS', 0.25)
    };
  }
  return {
    name: `שיחת דמו אישית · ${lead.name}`,
    descrip:
      `להעביר דמו אישי של כ‑20 דקות: איך 1💗1 מתאימה למצב שלהם — חלוקת תרומות, ` +
      `משימות, קבלת החלטות והצטרפות שותפים.\n\n${brief}`,
    noofhours: hours('DEMO_CALL_HOURS', 0.5)
  };
}

async function gql(
  fetchFn: typeof globalThis.fetch,
  query: string,
  variables: Record<string, unknown>
): Promise<any> {
  const res = await fetchFn(STRAPI_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken()}`
    },
    body: JSON.stringify({ query, variables })
  });
  const data = await res.json();
  if (data?.errors) {
    throw new Error(JSON.stringify(data.errors).slice(0, 300));
  }
  return data?.data;
}

/** Create one Mission + its OpenMission in the central rikma. Returns the OpenMission id. */
async function createOne(
  fetchFn: typeof globalThis.fetch,
  projectId: string,
  kind: DemoTaskKind,
  lead: DemoTaskLead
): Promise<string> {
  const spec = taskSpec(kind, lead);
  const publishedAt = new Date().toISOString();

  const missionData = await gql(fetchFn, CREATE_MISSION, {
    missionName: spec.name,
    descrip: spec.descrip,
    publishedAt
  });
  const missionId = missionData?.createMission?.data?.id;
  if (!missionId) throw new Error(`createMission returned no id for "${kind}"`);

  const openData = await gql(fetchFn, CREATE_OPEN_MISSION, {
    projectId,
    missionId: String(missionId),
    name: spec.name,
    descrip: spec.descrip,
    noofhours: spec.noofhours,
    publishedAt
  });
  const openId = openData?.createOpenMission?.data?.id;
  if (!openId) throw new Error(`createOpenMission returned no id for "${kind}"`);

  return String(openId);
}

/**
 * Open the coordinate + call missions for one demo request.
 *
 * Each mission is attempted independently: if the call mission fails, the
 * coordination one that already succeeded is still reported back, so the caller
 * can store what it got.
 */
export async function createDemoTasks(
  lead: DemoTaskLead,
  fetchFn: typeof globalThis.fetch = fetch
): Promise<DemoTasksResult> {
  const projectId = centralRikmaId();
  if (!projectId) return { created: false, reason: 'not_configured' };

  const out: DemoTasksResult = { created: false };

  for (const kind of ['coordinate', 'call'] as const) {
    try {
      const id = await createOne(fetchFn, projectId, kind, lead);
      if (kind === 'coordinate') out.coordMissionId = id;
      else out.callMissionId = id;
      out.created = true;
    } catch (e) {
      console.error(`[demo] central-rikma "${kind}" mission failed:`, e);
      out.reason = 'error';
    }
  }

  return out;
}
