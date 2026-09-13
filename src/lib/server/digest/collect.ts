/**
 * Reading one user's digest — PLAN_DAILY_DIGEST §3.2 `collect`.
 *
 * The same four reads serve both consumers, through different doors
 * (see src/routes/api/send/qidsDigest.js):
 *   - `session`: the hub, as the signed-in user — `$idL` queries, the user's
 *     own JWT, and /api/send guarantees the answer is about them;
 *   - `service`: the digest run, as the platform — `$uid` twins on the
 *     service token, serviceAdmin only.
 *
 * Every part settles on its own and reports failure as data. A failed read is
 * NOT an empty one: "0 votes" because Strapi timed out is precisely the
 * TIMEGRAMA lesson ("a failed timegrama looks exactly like a waiting one").
 * The hub just hides a failed section; the digest run must not send a brief
 * whose votes line is a failure dressed as zero — `failed` is how it knows.
 */

import { sendToSer } from '$lib/send/sendToSer.js';
import { composeDigest, digestCounts, type DigestCounts, type DigestPayload } from '$lib/digest/compose.js';
import { emptyHubSummary, processHubSummary, type HubSummary } from '$lib/digest/hubSummary.js';
import { emptySuggestionSummary, processSuggestions, type SuggestionSummary } from '$lib/digest/suggestions.js';
import { emptyWhatsNew, processWhatsNew, resolveSince, type WhatsNewSummary } from '$lib/digest/whatsNew.js';
import { emptyWorkSummary, processWork, type WorkSummary } from '$lib/digest/work.js';
import type { DigestContact } from '$lib/digest/policy.js';

export type DigestDoor = 'session' | 'service';
export type DigestPart = 'hub' | 'work' | 'suggestions' | 'whatsNew';

const QIDS: Record<DigestDoor, Record<DigestPart, string>> = {
  session: {
    hub: '85levHubSummary',
    work: '340digestWork',
    suggestions: '341digestSuggestions',
    whatsNew: '342digestWhatsNew'
  },
  service: {
    hub: '347digestHubSummaryFor',
    work: '343digestWorkFor',
    suggestions: '344digestSuggestionsFor',
    whatsNew: '345digestWhatsNewFor'
  }
};

export interface Settled<T> {
  value: T;
  /** Set when the read failed — `value` is then the empty default. */
  error?: string;
}

export interface CollectOptions {
  fetch: typeof globalThis.fetch;
  door: DigestDoor;
  /** Previous digest's cursor; null ⇒ the default 24h window. */
  cursor?: string | null;
  now?: number;
}

/** The user's delivery fields, read by the service twin of the work query. */
export interface DigestRecipient extends DigestContact {
  lang: string | null;
  blocked: boolean;
}

function assertOk(raw: any, qid: string): any {
  const errors = raw?.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    throw new Error(`${qid}: ${errors[0]?.message ?? 'GraphQL error'}`);
  }
  if (!raw?.data) throw new Error(`${qid}: no data`);
  return raw;
}

async function settle<T>(p: Promise<T>, fallback: T): Promise<Settled<T>> {
  try {
    return { value: await p };
  } catch (e) {
    return { value: fallback, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Start the four reads for one user. Returns the promises unsettled so the
 * hub can stream them; `collectDigest` below awaits them for the run.
 *
 * @param hubRaw an already-running `85levHubSummary` read, so the hub page does
 *               not fetch the same thing twice.
 */
export function startDigestReads(uid: string, opts: CollectOptions, hubRaw?: Promise<any>) {
  const now = opts.now ?? Date.now();
  const qids = QIDS[opts.door];
  const svc = opts.door === 'service';
  // The session door's `$idL` is rebound by /api/send; passing it anyway keeps
  // the variable present so the query is well-formed.
  const idVar = svc ? { uid } : { idL: uid };
  const since = resolveSince(opts.cursor, now);
  const q = (qid: string, extra: Record<string, unknown> = {}) =>
    sendToSer({ ...idVar, ...extra }, qid, 0, 0, svc, opts.fetch).then((raw: any) => assertOk(raw, qid));

  const hubP = hubRaw ? hubRaw.then((raw) => assertOk(raw, qids.hub)) : q(qids.hub);
  const workRaw = q(qids.work);

  return {
    since,
    hub: settle(hubP.then((raw) => processHubSummary(raw, uid, now)), emptyHubSummary()),
    work: settle(workRaw.then((raw) => processWork(raw, now)), emptyWorkSummary()),
    suggestions: settle(q(qids.suggestions).then(processSuggestions), emptySuggestionSummary()),
    whatsNew: settle(
      q(qids.whatsNew, { since }).then((raw) => processWhatsNew(raw, since)),
      emptyWhatsNew(since)
    ),
    /**
     * Only meaningful on the service door, where 343 selects the fields.
     * Settled like the rest: the hub never awaits it, and an unawaited
     * rejection is an unhandledRejection that takes the Node process down.
     */
    recipient: settle(
      workRaw.then((raw): DigestRecipient => {
        const a = raw?.data?.usersPermissionsUser?.data?.attributes ?? {};
        return {
          email: a.email ?? null,
          lang: a.lang ?? null,
          noMail: a.noMail ?? null,
          telegramId: a.telegramId ?? null,
          pushDevices: a.machshirs?.data?.length ?? 0,
          blocked: a.blocked === true
        };
      }),
      null as DigestRecipient | null
    )
  };
}

export interface CollectedDigest {
  payload: DigestPayload;
  counts: DigestCounts;
  hub: HubSummary;
  work: WorkSummary;
  suggestions: SuggestionSummary;
  whatsNew: WhatsNewSummary;
  /** Parts whose read failed, with the reason. Empty ⇔ the payload is whole. */
  failed: Partial<Record<DigestPart, string>>;
}

/** Wait for every part and compose. Never throws for a failed part. */
export async function composeFromReads(
  uid: string,
  reads: ReturnType<typeof startDigestReads>,
  { lang, now = Date.now() }: { lang?: string | null; now?: number } = {}
): Promise<CollectedDigest> {
  const [hub, work, suggestions, whatsNew] = await Promise.all([
    reads.hub,
    reads.work,
    reads.suggestions,
    reads.whatsNew
  ]);
  const failed: CollectedDigest['failed'] = {};
  if (hub.error) failed.hub = hub.error;
  if (work.error) failed.work = work.error;
  if (suggestions.error) failed.suggestions = suggestions.error;
  if (whatsNew.error) failed.whatsNew = whatsNew.error;

  const payload = composeDigest({
    userId: uid,
    lang,
    hub: hub.value,
    work: work.value,
    suggestions: suggestions.value,
    whatsNew: whatsNew.value,
    now
  });
  return {
    payload,
    counts: digestCounts(payload, hub.value),
    hub: hub.value,
    work: work.value,
    suggestions: suggestions.value,
    whatsNew: whatsNew.value,
    failed
  };
}
