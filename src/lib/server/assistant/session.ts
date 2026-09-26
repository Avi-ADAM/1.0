/**
 * The `assistant-session` row: load, create, save with a version check
 * (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §3.3).
 *
 * Every read and write goes through the service token (qids 363–366 are
 * serviceAdmin-only) — the callers are the assistant actions, which decide
 * ownership themselves with `ownsSession`. Nothing here trusts a client value
 * for who the owner is.
 */

import { LIMITS, type AssistantKind, type AssistantState, type AssistantVia, type Revision } from '$lib/assistant/types.js';

export interface StrapiLike {
  execute: (qid: string, vars: Record<string, any>, jwt?: string, fetchFn?: typeof fetch) => Promise<any>;
}

export type SessionStatus = 'pending' | 'active' | 'applied' | 'closed';

export interface SessionRow {
  id: string;
  kind: AssistantKind;
  status: SessionStatus;
  userId: string | null;
  projectId: string | null;
  projectName: string | null;
  ratsonId: string | null;
  /** The signatory row a pending (agent-prepared) session is claimed through (§5.4). */
  chezinId: string | null;
  startedVia: AssistantVia;
  lang: string | null;
  sourceText: string | null;
  state: AssistantState;
  revisions: Revision[];
  version: number;
  updatedAt: string | null;
  claimExpiresAt: string | null;
  shareExpiresAt: string | null;
}

const EMPTY_STATE: AssistantState = { items: [] };

function relId(rel: any): string | null {
  const id = rel?.data?.id;
  return id != null ? String(id) : null;
}

function asState(raw: unknown): AssistantState {
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as any).items)) return EMPTY_STATE;
  return raw as AssistantState;
}

/** A GraphQL `assistantSession` node → a row. */
export function rowFromNode(node: any): SessionRow | null {
  if (!node?.id) return null;
  const a = node.attributes ?? {};
  return {
    id: String(node.id),
    kind: a.kind,
    status: a.status ?? 'active',
    userId: relId(a.user),
    projectId: relId(a.project),
    projectName: a.project?.data?.attributes?.projectName ?? null,
    ratsonId: relId(a.ratson),
    chezinId: relId(a.chezin),
    startedVia: a.startedVia ?? 'site',
    lang: a.lang ?? null,
    sourceText: a.sourceText ?? null,
    state: asState(a.state),
    revisions: Array.isArray(a.revisions) ? a.revisions : [],
    version: Number(a.version ?? 0),
    updatedAt: a.updatedAt ?? null,
    claimExpiresAt: a.claimExpiresAt ?? null,
    shareExpiresAt: a.shareExpiresAt ?? null
  };
}

export function ownsSession(row: SessionRow | null, userId: string | undefined | null): row is SessionRow {
  return !!row && !!userId && row.userId === String(userId);
}

export async function loadSession(strapi: StrapiLike, id: string, fetchFn?: typeof fetch): Promise<SessionRow | null> {
  const res = await strapi.execute('364getAssistantSession', { id: String(id) }, undefined, fetchFn);
  return rowFromNode(res?.data?.assistantSession?.data);
}

export async function findLatestSession(
  strapi: StrapiLike,
  userId: string,
  kind: AssistantKind,
  fetchFn?: typeof fetch
): Promise<SessionRow | null> {
  const res = await strapi.execute('366findMyAssistantSessions', { uid: String(userId), kind, limit: 1 }, undefined, fetchFn);
  return rowFromNode(res?.data?.assistantSessions?.data?.[0]);
}

export async function createSession(
  strapi: StrapiLike,
  input: {
    /** null only for a `pending` session an agent prepared before signup (§5.1). */
    userId: string | null;
    kind: AssistantKind;
    status?: SessionStatus;
    claimEmail?: string | null;
    claimExpiresAt?: string | null;
    state: AssistantState;
    startedVia: AssistantVia;
    lang?: string;
    projectId?: string | null;
    ratsonId?: string | null;
    sourceText?: string | null;
    revisions?: Revision[];
  },
  fetchFn?: typeof fetch
): Promise<SessionRow> {
  const data: Record<string, unknown> = {
    ...(input.userId ? { user: String(input.userId) } : {}),
    kind: input.kind,
    status: input.status ?? 'active',
    startedVia: input.startedVia,
    state: input.state,
    revisions: input.revisions ?? [],
    version: 1
  };
  if (input.lang) data.lang = input.lang.slice(0, 3);
  if (input.projectId) data.project = String(input.projectId);
  if (input.ratsonId) data.ratson = String(input.ratsonId);
  if (input.sourceText) data.sourceText = input.sourceText.slice(0, 20000);
  if (input.claimEmail) data.claimEmail = input.claimEmail.slice(0, 200);
  if (input.claimExpiresAt) data.claimExpiresAt = input.claimExpiresAt;

  const res = await strapi.execute('363createAssistantSession', { data }, undefined, fetchFn);
  const row = rowFromNode(res?.data?.createAssistantSession?.data);
  if (!row) throw new Error('Could not save the assistant session');
  return row;
}

export type SaveResult = { ok: true; row: SessionRow } | { ok: false; conflict: SessionRow };

/**
 * Write a new state (and optionally append a revision) — but only if nobody
 * wrote since `expectedVersion`. On a mismatch the current row comes back so
 * the caller can show "meanwhile it changed — here is the list now".
 *
 * Strapi has no conditional update, so this is read-check-write; the window
 * is one round trip, which is what two people (or a person and their agent)
 * typing into the same list can realistically hit — and the loser is told,
 * never silently overwritten.
 */
export async function saveSession(
  strapi: StrapiLike,
  row: SessionRow,
  change: {
    state?: AssistantState;
    revision?: Omit<Revision, 'v'>;
    expectedVersion?: number;
    patch?: {
      status?: SessionStatus;
      projectId?: string;
      appliedAt?: string;
      /** The claim (§5.4): the session becomes this user's. */
      userId?: string;
      ratsonId?: string;
      /** The signatory row of the agent-prepared signup (§5.4). */
      chezinId?: string;
    };
  },
  fetchFn?: typeof fetch
): Promise<SaveResult> {
  let base = row;
  if (change.expectedVersion !== undefined) {
    const fresh = await loadSession(strapi, row.id, fetchFn);
    if (!fresh) throw new Error('The assistant session no longer exists');
    if (fresh.version !== change.expectedVersion) return { ok: false, conflict: fresh };
    base = fresh;
  }

  const version = base.version + 1;
  const data: Record<string, unknown> = { version };
  if (change.state) data.state = change.state;
  if (change.revision) {
    data.revisions = [...base.revisions, { ...change.revision, v: version }].slice(-LIMITS.revisions);
  }
  if (change.patch?.status) data.status = change.patch.status;
  if (change.patch?.projectId) data.project = String(change.patch.projectId);
  if (change.patch?.appliedAt) data.appliedAt = change.patch.appliedAt;
  if (change.patch?.userId) data.user = String(change.patch.userId);
  if (change.patch?.ratsonId) data.ratson = String(change.patch.ratsonId);
  if (change.patch?.chezinId) data.chezin = String(change.patch.chezinId);

  const res = await strapi.execute('365updateAssistantSession', { id: row.id, data }, undefined, fetchFn);
  const saved = rowFromNode(res?.data?.updateAssistantSession?.data);
  if (!saved) throw new Error('Could not save the assistant session');
  return { ok: true, row: saved };
}

/**
 * Set or clear the preview link (§4.4). Not a revision and no version bump:
 * sharing does not change the list, and an agent holding the current version
 * must not be told "it changed meanwhile" because someone made a link.
 */
export async function setShare(
  strapi: StrapiLike,
  id: string,
  share: { key: string; expiresAt: string } | null,
  fetchFn?: typeof fetch
): Promise<void> {
  await strapi.execute(
    '365updateAssistantSession',
    { id: String(id), data: share ? { shareKey: share.key, shareExpiresAt: share.expiresAt } : { shareKey: null, shareExpiresAt: null } },
    undefined,
    fetchFn
  );
}

/**
 * The pending sessions an agent prepared for this signatory, not yet expired —
 * what a new account claims (§5.4). By the chezin row, never by email alone:
 * text someone else prepared with your address does not become yours.
 */
export async function findPendingByChezin(
  strapi: StrapiLike,
  chezinId: string,
  now: Date = new Date(),
  fetchFn?: typeof fetch
): Promise<SessionRow[]> {
  const res = await strapi.execute('367findPendingAssistantByChezin', { cid: String(chezinId) }, undefined, fetchFn);
  return (res?.data?.assistantSessions?.data ?? [])
    .map(rowFromNode)
    .filter((r: SessionRow | null): r is SessionRow => !!r && r.status === 'pending' && !r.userId)
    .filter((r: SessionRow) => !r.claimExpiresAt || new Date(r.claimExpiresAt).getTime() > now.getTime());
}

/** A live preview link → its session, or null (unknown, expired, not a rikma). */
export async function loadByShareKey(
  strapi: StrapiLike,
  key: string,
  now: Date = new Date(),
  fetchFn?: typeof fetch
): Promise<SessionRow | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(key)) return null;
  const res = await strapi.execute('368getAssistantByShareKey', { k: key }, undefined, fetchFn);
  const row = rowFromNode(res?.data?.assistantSessions?.data?.[0]);
  if (!row || row.kind !== 'rikma') return null;
  if (!row.shareExpiresAt || new Date(row.shareExpiresAt).getTime() <= now.getTime()) return null;
  return row;
}

/**
 * What a caller (the site, or an agent over MCP) gets back: the list without
 * the internal bookkeeping (`droppedFrom`, stored `changes`), and only the
 * recent transcript.
 */
export function publicView(row: SessionRow, recentRevisions = 5) {
  return {
    sessionId: row.id,
    kind: row.kind,
    status: row.status,
    version: row.version,
    projectId: row.projectId,
    projectName: row.projectName,
    fields: row.state.fields ?? {},
    questions: row.state.questions ?? [],
    items: row.state.items.map(({ droppedFrom: _d, ...it }) => it),
    recent: row.revisions.slice(-recentRevisions).map(({ changes: _c, ...r }) => r)
  };
}
