/**
 * Reading and writing leads (docs/inprogress/PLAN_LEADS.md). Every call runs
 * under the ADMIN token — the lead qids are serviceAdmin-only because a lead
 * carries someone's phone and email — so the caller must already have passed
 * the action's projectMember rule for `projectId`.
 */

import { createHash } from 'node:crypto';
import { dedupeLookupKeys, sharesContact } from '$lib/leads/dedupe';
import { absorbsRepeatContact } from '$lib/leads/status';

type Execute = (qid: string, vars: Record<string, unknown>, jwt: undefined, fetchFn: any) => Promise<any>;

export interface LeadStore {
  run: (qid: string, vars: Record<string, unknown>) => Promise<any>;
}

/** Bind the client to the admin token and the request's fetch. */
export function leadStore(strapi: { execute: Execute }, fetchFn: typeof globalThis.fetch | undefined): LeadStore {
  return { run: (qid, vars) => strapi.execute(qid, vars, undefined, fetchFn) };
}

/** 16 hex chars of sha-256: enough to tell people apart inside one rikma. */
export function contactHash(part: string): string {
  return createHash('sha256').update(part).digest('hex').slice(0, 16);
}

export interface LeadRow {
  id: string;
  projectId: string | null;
  name: string | null;
  organization: string | null;
  status: string;
  ownerId: string | null;
  actId: string | null;
  externalId: string | null;
  dedupeKey: string | null;
  followUpAt: string | null;
  lastActivityAt: string | null;
  createdAt: string | null;
}

export function toLeadRow(row: any): LeadRow | null {
  if (!row?.id) return null;
  const a = row.attributes ?? {};
  const rel = (r: any) => (r?.data?.id != null ? String(r.data.id) : null);
  return {
    id: String(row.id),
    projectId: rel(a.project),
    name: a.name ?? null,
    organization: a.organization ?? null,
    status: a.status ?? 'new',
    ownerId: rel(a.owner),
    actId: rel(a.act),
    externalId: a.externalId ?? null,
    dedupeKey: a.dedupeKey ?? null,
    followUpAt: a.followUpAt ?? null,
    lastActivityAt: a.lastActivityAt ?? null,
    createdAt: a.createdAt ?? null
  };
}

/** The lead, only if it belongs to this rikma — a lead id from another rikma reads as missing. */
export async function loadLeadInProject(store: LeadStore, leadId: string, projectId: string): Promise<LeadRow | null> {
  const res = await store.run('leadById', { id: String(leadId) });
  const lead = toLeadRow(res?.data?.lead?.data);
  return lead && lead.projectId === String(projectId) ? lead : null;
}

export async function findLeadByExternalId(store: LeadStore, projectId: string, externalId: string) {
  const res = await store.run('leadByExternalId', { pid: String(projectId), externalId });
  const row = res?.data?.leads?.data?.[0];
  if (!row?.id) return null;
  return {
    id: String(row.id),
    status: row.attributes?.status ?? 'new',
    actId: row.attributes?.act?.data?.id != null ? String(row.attributes.act.data.id) : null
  };
}

/**
 * Earlier leads of the same person in this rikma (§2.4): the open one a new
 * enquiry folds into, and the latest won one it should point back to.
 */
export async function findSameContact(
  store: LeadStore,
  projectId: string,
  email: string | null,
  phone: string | null
): Promise<{ open: LeadRow | null; previousWon: LeadRow | null }> {
  const keys = dedupeLookupKeys(email, phone, contactHash);
  if (!keys.length) return { open: null, previousWon: null };
  const res = await store.run('leadsByContact', {
    filters: {
      project: { id: { eq: String(projectId) } },
      or: keys.map((k) => ({ dedupeKey: { contains: k } }))
    }
  });
  const rows = ((res?.data?.leads?.data ?? []) as any[])
    .map((r) => toLeadRow({ ...r, attributes: { ...r.attributes, project: { data: { id: projectId } } } }))
    .filter((r): r is LeadRow => !!r && sharesContact(r.dedupeKey, keys));
  return {
    open: rows.find((r) => absorbsRepeatContact(r.status)) ?? null,
    previousWon: rows.find((r) => r.status === 'won') ?? null
  };
}

export interface ActivityInput {
  leadId: string;
  kind: string;
  direction?: 'in' | 'out' | null;
  body?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  actorId?: string | null;
  at?: string;
  meetingId?: string | null;
}

/** Append one log entry. There is no update or delete — a correction is a new entry. */
export async function recordActivity(store: LeadStore, a: ActivityInput): Promise<string | null> {
  const data: Record<string, unknown> = {
    lead: a.leadId,
    kind: a.kind,
    at: a.at ?? new Date().toISOString()
  };
  if (a.direction) data.direction = a.direction;
  if (a.body) data.body = a.body;
  if (a.fromStatus) data.fromStatus = a.fromStatus;
  if (a.toStatus) data.toStatus = a.toStatus;
  if (a.actorId) data.actor = a.actorId;
  if (a.meetingId) data.meetingId = a.meetingId;
  const res = await store.run('leadActivityCreate', { data });
  const id = res?.data?.createLeadActivity?.data?.id;
  return id != null ? String(id) : null;
}

export async function updateLead(store: LeadStore, leadId: string, data: Record<string, unknown>): Promise<void> {
  const res = await store.run('leadUpdate', { id: String(leadId), data });
  if (!res?.data?.updateLead?.data?.id) throw new Error(`updateLead ${leadId}: no data returned`);
}

/** The later of two ISO instants (`lastActivityAt` never moves backwards). */
export function laterOf(a: string | null | undefined, b: string): string {
  if (!a) return b;
  return Date.parse(a) > Date.parse(b) ? a : b;
}
