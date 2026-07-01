import { verifySignedObject, type PubKeyResolver } from '$lib/crypto/verify';
import { idbAdd, idbGet } from '$lib/crypto/keystore';
import { isConsentEventShape, type ConsentEvent } from './event';
import { hasCommitments, verifyCommitments, type CommitmentOptions } from './commitment';

export type IngestResult =
  | { ok: true; deduped: false; event: ConsentEvent; warnings?: string[] }
  | { ok: true; deduped: true;  event: ConsentEvent; warnings?: string[] }
  | { ok: false; reason: string };

export type IngestOptions = Partial<Omit<CommitmentOptions, 'getEvent'>> & {
  /** Override the default IDB lookup (tests / server-side reuse). */
  getEvent?: CommitmentOptions['getEvent'];
};

export async function ingestEvent(
  raw: unknown,
  resolve: PubKeyResolver,
  opts: IngestOptions = {}
): Promise<IngestResult> {
  if (!isConsentEventShape(raw)) return { ok: false, reason: 'bad_shape' };
  const ev = raw as ConsentEvent;

  const existing = await idbGet<ConsentEvent>('events', ev.id);
  if (existing) return { ok: true, deduped: true, event: existing };

  const v = await verifySignedObject(ev, resolve);
  if (!v.ok) return { ok: false, reason: v.reason };

  // Phase 1.5 — events that declare state commitments must survive a local
  // replay (PLAN_rikma_as_state_machine §7). A provably false stateRoot /
  // delta / quorum is rejected exactly like a bad signature.
  let warnings: string[] | undefined;
  if (hasCommitments(ev)) {
    const c = await verifyCommitments(ev, {
      getEvent: opts.getEvent ?? ((id) => idbGet<ConsentEvent>('events', id)),
      mode: opts.mode,
      projectId: opts.projectId,
      memberWeights: opts.memberWeights
    });
    if (!c.ok) return { ok: false, reason: `commitment:${c.reason}` };
    if (c.warnings.length > 0) warnings = c.warnings;
  }

  await idbAdd('events', ev);
  return { ok: true, deduped: false, event: ev, warnings };
}
