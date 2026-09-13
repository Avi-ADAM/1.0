/**
 * The digest run — PLAN_DAILY_DIGEST §3.2 `run`, **dry only for now**.
 *
 * What exists: audience → collect → compose → policy, for one user or one
 * page of the audience, reported as data. What does not yet: `deliver` and
 * `record`, which need the `user-digest` collection in Strapi (§3.3) — without
 * it there is no `lastSentAt`, so a real run could not keep "one a day" and
 * would send twice on a retried cron. That is the rule the plan calls the
 * most important after "an empty digest is not sent", so this refuses to send
 * rather than send without it.
 *
 * The dry run is the plan's step 0 on its own: "?dry=1 on 20 real users — how
 * many of them would get a non-empty digest?" If the answer is 3 of 20, the
 * digest is not the fix and the plan says to stop and discuss.
 */

import { sendToSer } from '$lib/send/sendToSer.js';
import { decideDigest, type DigestDecision, type DigestState } from '$lib/digest/policy.js';
import type { DigestCounts, DigestPayload } from '$lib/digest/compose.js';
import { composeFromReads, startDigestReads, type DigestPart } from './collect.js';

export interface DryUserResult {
  uid: string;
  lang: string;
  isEmpty: boolean;
  decision: DigestDecision;
  counts: DigestCounts;
  failed: Partial<Record<DigestPart, string>>;
  /** Full payload — only for a single-user run, not for an audience page. */
  payload?: DigestPayload;
}

export interface DryRunOptions {
  fetch: typeof globalThis.fetch;
  now?: Date;
  force?: boolean;
  /** Stored state per user, once `user-digest` exists. Absent ⇒ defaults. */
  stateOf?: (uid: string) => DigestState | null;
}

export async function dryRunUser(
  uid: string,
  opts: DryRunOptions & { withPayload?: boolean }
): Promise<DryUserResult> {
  const now = opts.now ?? new Date();
  const state = opts.stateOf?.(uid) ?? null;
  // The cursor would come from `user-digest`; until then every run is a
  // first digest (the last 24h).
  const reads = startDigestReads(uid, { fetch: opts.fetch, door: 'service', cursor: null, now: now.getTime() });
  const recipient = await reads.recipient;
  const lang = recipient.value?.lang ?? null;
  const collected = await composeFromReads(uid, reads, { lang, now: now.getTime() });

  const failed = { ...collected.failed };
  if (recipient.error && !failed.work) failed.work = recipient.error;

  let decision = decideDigest(collected.payload, collected.counts, state, recipient.value ?? {}, {
    now,
    force: opts.force
  });
  // A digest whose votes read failed would say "0 votes" to someone who has
  // some. Never send that — the whole point of the digest is that line — and
  // never report it as 'empty' either, which is the failure dressed as a zero.
  if (failed.hub) {
    decision = { send: false, reason: 'failedRead', channels: decision.channels, forced: false };
  }

  return {
    uid,
    lang: collected.payload.lang,
    isEmpty: collected.payload.isEmpty,
    decision,
    counts: collected.counts,
    failed,
    ...(opts.withPayload ? { payload: collected.payload } : {})
  };
}

export interface AudiencePage {
  ids: string[];
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export async function audiencePage(
  fetch: typeof globalThis.fetch,
  page: number,
  pageSize: number
): Promise<AudiencePage> {
  const raw: any = await sendToSer({ page, pageSize }, '346digestAudience', 0, 0, true, fetch);
  if (raw?.errors?.length) throw new Error(`346digestAudience: ${raw.errors[0]?.message}`);
  const node = raw?.data?.usersPermissionsUsers;
  if (!node) throw new Error('346digestAudience: no data');
  const p = node.meta?.pagination ?? {};
  return {
    ids: (node.data ?? []).map((u: any) => String(u.id)),
    page: p.page ?? page,
    pageSize: p.pageSize ?? pageSize,
    pageCount: p.pageCount ?? 0,
    total: p.total ?? 0
  };
}

/** Run `fn` over `items` with at most `limit` in flight — Strapi is one box. */
export async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export interface DryRunSummary {
  users: number;
  nonEmpty: number;
  wouldSend: number;
  byReason: Record<string, number>;
  byChannel: Record<string, number>;
  /** Users with at least one failed read — a number that must stay 0. */
  withFailedReads: number;
  votesWaiting: number;
  urgentWaiting: number;
}

export function summarize(results: DryUserResult[]): DryRunSummary {
  const s: DryRunSummary = {
    users: results.length,
    nonEmpty: 0,
    wouldSend: 0,
    byReason: {},
    byChannel: {},
    withFailedReads: 0,
    votesWaiting: 0,
    urgentWaiting: 0
  };
  for (const r of results) {
    if (!r.isEmpty) s.nonEmpty++;
    if (Object.keys(r.failed).length > 0) s.withFailedReads++;
    s.votesWaiting += r.counts.votes;
    s.urgentWaiting += r.counts.urgent;
    if (r.decision.send) {
      s.wouldSend++;
      for (const c of r.decision.channels) s.byChannel[c] = (s.byChannel[c] ?? 0) + 1;
    } else {
      s.byReason[r.decision.reason] = (s.byReason[r.decision.reason] ?? 0) + 1;
    }
  }
  return s;
}
