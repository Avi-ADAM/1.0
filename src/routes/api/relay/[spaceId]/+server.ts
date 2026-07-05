// Encrypted-relay mailbox endpoints (S2a). POST pushes signed events into a
// space's log; GET pulls incrementally by seq cursor. In S2 events are still
// plaintext+signed, so the relay verifies signatures to keep junk out — the
// same check every client repeats locally, so the relay never becomes an
// authority. When S3 lands (per-space encryption) the verify step moves to
// an envelope signature and this endpoint goes blind.

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { isConsentEventShape, type ConsentEvent } from '$lib/consent/event';
import { isValidSpaceId } from '$lib/space/protocol';
import { verifyConsentEvent } from '$lib/server/consent/verifyServerSide';
import { relayAppend, relayRead, logEpoch } from '$lib/server/relay/log';

const MAX_BATCH = 200;

export const POST: RequestHandler = async ({ request, params, cookies }) => {
  // JWT cookie gates abuse; the event signatures are the real authentication.
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');
  const spaceId = params.spaceId;
  if (!isValidSpaceId(spaceId)) throw error(400, 'bad spaceId');

  const body = await request.json().catch(() => null);
  const events = body?.events;
  if (!Array.isArray(events) || events.length === 0) throw error(400, 'events[] required');
  if (events.length > MAX_BATCH) throw error(413, `max ${MAX_BATCH} events per push`);

  const results: Array<
    { id: string; ok: true; seq: number; deduped: boolean } | { id: string | null; ok: false; reason: string }
  > = [];

  for (const raw of events) {
    if (!isConsentEventShape(raw)) {
      results.push({ id: (raw as { id?: string })?.id ?? null, ok: false, reason: 'bad_shape' });
      continue;
    }
    const ev = raw as ConsentEvent;
    const v = await verifyConsentEvent(ev);
    if (!v.ok) {
      results.push({ id: ev.id, ok: false, reason: `verify:${v.reason}` });
      continue;
    }
    const appended = await relayAppend(spaceId, ev);
    if (!appended.ok) {
      results.push({ id: ev.id, ok: false, reason: appended.reason });
      continue;
    }
    results.push({ id: ev.id, ok: true, seq: appended.seq, deduped: appended.deduped });
  }

  const state = relayRead(spaceId, Number.MAX_SAFE_INTEGER);
  return json({ ok: true, epoch: logEpoch, latestSeq: state.latestSeq, results });
};

export const GET: RequestHandler = async ({ url, params, cookies }) => {
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');
  const spaceId = params.spaceId;
  if (!isValidSpaceId(spaceId)) throw error(400, 'bad spaceId');

  const sinceRaw = url.searchParams.get('since');
  const since = sinceRaw ? Number(sinceRaw) : 0;
  if (!Number.isFinite(since) || since < 0) throw error(400, 'bad since');

  // headsOnly is the cheap poll: O(1) payload when nothing changed.
  if (url.searchParams.get('headsOnly') === '1') {
    const r = relayRead(spaceId, Number.MAX_SAFE_INTEGER);
    return json({ ok: true, epoch: r.epoch, latestSeq: r.latestSeq, heads: r.heads });
  }

  const r = relayRead(spaceId, since);
  return json({
    ok: true,
    epoch: r.epoch,
    latestSeq: r.latestSeq,
    heads: r.heads,
    events: r.envelopes
  });
};
