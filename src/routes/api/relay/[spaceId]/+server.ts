// Encrypted-relay mailbox endpoints (S2a). POST pushes signed events into a
// space's log; GET pulls incrementally by seq cursor. In S2 events are still
// plaintext+signed, so the relay verifies signatures to keep junk out — the
// same check every client repeats locally, so the relay never becomes an
// authority. When S3 lands (per-space encryption) the verify step moves to
// an envelope signature and this endpoint goes blind.

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { isConsentEventShape, type ConsentEvent } from '$lib/consent/event';
import { isSealedEnvelopeShape } from '$lib/space/e2e/seal';
import { isValidSpaceId } from '$lib/space/protocol';
import { verifyConsentEvent, resolveFromStore } from '$lib/server/consent/verifyServerSide';
import { verifySignedObject } from '$lib/crypto/verify';
import { relayAppend, relayAppendSealed, relayRead, logEpoch } from '$lib/server/relay/log';

const MAX_BATCH = 200;

export const POST: RequestHandler = async ({ request, params, cookies }) => {
  // JWT cookie gates abuse; the event signatures are the real authentication.
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');
  const spaceId = params.spaceId;
  if (!isValidSpaceId(spaceId)) throw error(400, 'bad spaceId');

  const body = await request.json().catch(() => null);
  const events = Array.isArray(body?.events) ? body.events : [];
  const sealed = Array.isArray(body?.sealed) ? body.sealed : [];
  if (events.length + sealed.length === 0) throw error(400, 'events[] or sealed[] required');
  if (events.length + sealed.length > MAX_BATCH) throw error(413, `max ${MAX_BATCH} items per push`);

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

  // Sealed path (S3a): the relay verifies ONLY the outer device signature —
  // anti-spam, not authority. It cannot and does not look inside.
  for (const raw of sealed) {
    if (!isSealedEnvelopeShape(raw)) {
      results.push({ id: (raw as { id?: string })?.id ?? null, ok: false, reason: 'bad_shape' });
      continue;
    }
    if (raw.spaceId !== spaceId) {
      results.push({ id: raw.id, ok: false, reason: 'spaceId_mismatch' });
      continue;
    }
    const v = await verifySignedObject(raw, resolveFromStore);
    if (!v.ok) {
      results.push({ id: raw.id, ok: false, reason: `verify:${v.reason}` });
      continue;
    }
    const appended = await relayAppendSealed(spaceId, raw);
    if (!appended.ok) {
      results.push({ id: raw.id, ok: false, reason: appended.reason });
      continue;
    }
    results.push({ id: raw.id, ok: true, seq: appended.seq, deduped: appended.deduped });
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
