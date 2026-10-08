/**
 * The viewer's own notice settings (docs/inprogress/PLAN_SMART_NOTICES.md §4):
 * hiding a notice, bringing it back, and her preferences (the heart's kind
 * filter, muted rikmas).
 *
 * Hiding is not rejecting. Nothing here touches the thing the notice is about —
 * no vote, no status, not `hidden_by_wisher` (that is the wish page hiding a
 * proposal, a different act). It writes one row about the viewer's own view, and
 * a silence clock on the hidden thing keeps running; the row says so before it
 * hides (NoticeRow).
 *
 * Every row is the caller's: the user is always `context.userId`, never a param,
 * and a delete only touches rows read back as hers.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

type Run = (qid: string, vars: Record<string, unknown>) => Promise<any>;

const runner = (strapi: any, context: any): Run => (qid, vars) =>
  strapi.execute(qid, vars, context.jwt, context.fetch);

/** The key a notice is hidden by — `source:kind:id:vN`, kept short and plain. */
const KEY = /^[a-z]+:[A-Za-z0-9:._-]{1,180}$/;

async function readMine(run: Run, userId: string) {
  const res = await run('423myNoticePrefs', { idL: userId });
  if (res?.errors?.length) throw new Error(`Could not read notice settings: ${JSON.stringify(res.errors).slice(0, 300)}`);
  const d = res?.data ?? res;
  return {
    dismissals: (d?.noticeDismissals?.data ?? []) as { id: string; attributes: { noticeKey: string; until: string | null } }[],
    pref: (d?.noticePrefs?.data?.[0] ?? null) as { id: string; attributes: Record<string, unknown> } | null
  };
}

function assertWrite(res: any, what: string) {
  if (res?.errors?.length) throw new Error(`Could not ${what}: ${JSON.stringify(res.errors).slice(0, 300)}`);
}

// ── dismissNotice ──────────────────────────────────────────────────────────

const dismiss: ActionExecutionHandler = async (params, context, { strapi }) => {
  const noticeKey = String(params.noticeKey ?? '');
  if (!KEY.test(noticeKey)) throw new Error('noticeKey is not a notice key');
  const until = params.until ? new Date(String(params.until)) : null;
  if (until && !Number.isFinite(until.getTime())) throw new Error('until is not a date');

  const run = runner(strapi, context);
  const me = String(context.userId);
  const { dismissals } = await readMine(run, me);
  // Hiding twice is hiding once.
  if (!dismissals.some((d) => d.attributes?.noticeKey === noticeKey)) {
    assertWrite(
      await run('424createNoticeDismissal', {
        data: { noticeKey, until: until ? until.toISOString() : null, users_permissions_user: me }
      }),
      'hide the notice'
    );
  }
  return { data: { noticeKey, hidden: true }, updateStrategy: { type: 'none' } };
};

export const dismissNoticeConfig: ActionConfig = {
  key: 'dismissNotice',
  description:
    "Hide one notice from the caller's own notices. Not a rejection: the thing it is about is untouched, and any silence clock on it keeps running. A new round of the same thing is a new notice.",
  graphqlOperation: dismiss,
  paramSchema: {
    noticeKey: { type: 'string', required: true, description: 'Notice.key — source:kind:id:vRound' },
    until: { type: 'string', required: false, description: 'ISO date to hide until; omit to hide until the terms move' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to hide a notice' }],
  updateStrategy: { type: 'none' }
};

// ── restoreNotice ──────────────────────────────────────────────────────────

const restore: ActionExecutionHandler = async (params, context, { strapi }) => {
  const noticeKey = String(params.noticeKey ?? '');
  if (!KEY.test(noticeKey)) throw new Error('noticeKey is not a notice key');
  const run = runner(strapi, context);
  const { dismissals } = await readMine(run, String(context.userId));
  const mine = dismissals.filter((d) => d.attributes?.noticeKey === noticeKey);
  for (const d of mine) assertWrite(await run('425deleteNoticeDismissal', { id: String(d.id) }), 'restore the notice');
  return { data: { noticeKey, restored: mine.length }, updateStrategy: { type: 'none' } };
};

export const restoreNoticeConfig: ActionConfig = {
  key: 'restoreNotice',
  description: "Bring a hidden notice back into the caller's own notices.",
  graphqlOperation: restore,
  paramSchema: {
    noticeKey: { type: 'string', required: true, description: 'Notice.key that was hidden' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to restore a notice' }],
  updateStrategy: { type: 'none' }
};

// ── saveNoticePrefs ────────────────────────────────────────────────────────

/** The heart's filter: kind key → shown. Anything else is dropped. */
function cleanMilon(v: unknown): Record<string, boolean> | undefined {
  if (v == null || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const out: Record<string, boolean> = {};
  for (const [k, on] of Object.entries(v as Record<string, unknown>)) {
    if (/^[A-Za-z]{1,30}$/.test(k) && typeof on === 'boolean') out[k] = on;
  }
  return out;
}

const save: ActionExecutionHandler = async (params, context, { strapi }) => {
  const data: Record<string, unknown> = {};
  const milon = cleanMilon(params.milon);
  if (milon) data.milon = milon;
  if (Array.isArray(params.mutedProjects)) {
    data.mutedProjects = [...new Set((params.mutedProjects as unknown[]).map(String).filter((s) => /^\d+$/.test(s)))];
  }
  if (params.lastSeenAt) {
    const at = new Date(String(params.lastSeenAt));
    if (Number.isFinite(at.getTime())) data.lastSeenAt = at.toISOString();
  }
  if (!Object.keys(data).length) throw new Error('Nothing to save');

  const run = runner(strapi, context);
  const me = String(context.userId);
  const { pref } = await readMine(run, me);
  if (pref) {
    assertWrite(await run('427updateNoticePref', { id: String(pref.id), data }), 'save notice settings');
  } else {
    assertWrite(await run('426createNoticePref', { data: { ...data, users_permissions_user: me } }), 'save notice settings');
  }
  return { data: { saved: Object.keys(data) }, updateStrategy: { type: 'none' } };
};

export const saveNoticePrefsConfig: ActionConfig = {
  key: 'saveNoticePrefs',
  description: "Save the caller's notice preferences: the heart's kind filter (milon), muted rikmas, last seen.",
  graphqlOperation: save,
  paramSchema: {
    milon: { type: 'object', required: false, description: 'kind key → shown (the heart filter)' },
    mutedProjects: { type: 'array', required: false, description: 'rikma ids whose notices are muted' },
    lastSeenAt: { type: 'string', required: false, description: 'ISO date the notices were last opened' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to save notice settings' }],
  updateStrategy: { type: 'none' }
};
