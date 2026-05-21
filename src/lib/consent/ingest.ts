import { verifySignedObject, type PubKeyResolver } from '$lib/crypto/verify';
import { idbAdd, idbGet } from '$lib/crypto/keystore';
import { isConsentEventShape, type ConsentEvent } from './event';

export type IngestResult =
  | { ok: true; deduped: false; event: ConsentEvent }
  | { ok: true; deduped: true;  event: ConsentEvent }
  | { ok: false; reason: string };

export async function ingestEvent(
  raw: unknown,
  resolve: PubKeyResolver
): Promise<IngestResult> {
  if (!isConsentEventShape(raw)) return { ok: false, reason: 'bad_shape' };
  const ev = raw as ConsentEvent;

  const existing = await idbGet<ConsentEvent>('events', ev.id);
  if (existing) return { ok: true, deduped: true, event: existing };

  const v = await verifySignedObject(ev, resolve);
  if (!v.ok) return { ok: false, reason: v.reason };

  await idbAdd('events', ev);
  return { ok: true, deduped: false, event: ev };
}
