import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { ACTIONS, isConsentEventShape, type ConsentEvent } from '$lib/consent/event';
import { validateRecoveryIngest, GUARDIAN_SET_ACTIVATION_MS } from '$lib/consent/recovery';
import { verifyConsentEvent } from '$lib/server/consent/verifyServerSide';
import { consentStore } from '$lib/server/consent/store';
import { notifyRecovery } from '$lib/server/consent/recoveryNotify';

export const POST: RequestHandler = async ({ request, cookies }) => {
  // JWT cookie gates abuse, but the signature is the real authentication.
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');

  const body = await request.json();
  const ev = body?.event;
  if (!isConsentEventShape(ev)) throw error(400, 'bad event shape');

  // T9b: recovery events are accepted only when their signed ts is "now" —
  // every waiting period in recovery.ts trusts that clock.
  const ingest = validateRecoveryIngest(ev as ConsentEvent);
  if (!ingest.ok) throw error(400, `recovery: ${ingest.reason}`);

  const v = await verifyConsentEvent(ev as ConsentEvent);
  if (!v.ok) throw error(400, `verify failed: ${v.reason}`);

  const added = await consentStore.putEvent(ev as ConsentEvent);
  if (added) afterRecoveryEvent(ev as ConsentEvent);
  return json({ ok: true, deduped: !added, id: (ev as ConsentEvent).id });
};

function afterRecoveryEvent(ev: ConsentEvent) {
  if (ev.action === ACTIONS.recoveryGuardians) {
    console.info('[recovery-telemetry]', { userId: ev.actor, status: 'guardian_set_signed' });
    // The 72h activation delay is the owner's window — tell the owner.
    void notifyRecovery(ev.actor, 'guardiansChanged', { at: ev.ts + GUARDIAN_SET_ACTIVATION_MS });
  } else if (ev.action === ACTIONS.recoveryVouch) {
    console.info('[recovery-telemetry]', { userId: ev.subject.id, guardianId: ev.actor, status: 'vouched' });
  } else if (ev.action === ACTIONS.recoveryNominate) {
    // subject = the guardian-to-be; it waits for their consent, so tell them.
    console.info('[recovery-telemetry]', { userId: ev.actor, guardianId: ev.subject.id, status: 'nominated' });
    void notifyRecovery(ev.subject.id, 'nominated', { otherId: ev.actor });
  } else if (ev.action === ACTIONS.recoveryAccept) {
    console.info('[recovery-telemetry]', { userId: ev.subject.id, guardianId: ev.actor, status: 'accepted' });
  } else if (ev.action === ACTIONS.recoveryWithdraw) {
    // The owner's protection just got thinner — they should hear it.
    console.info('[recovery-telemetry]', { userId: ev.subject.id, guardianId: ev.actor, status: 'withdrawn' });
    void notifyRecovery(ev.subject.id, 'guardianWithdrew', { otherId: ev.actor });
  } else if (ev.action === ACTIONS.recoveryProtest) {
    console.info('[recovery-telemetry]', { userId: ev.actor, status: 'protested' });
  }
}

export const GET: RequestHandler = async ({ url, cookies, locals }) => {
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');

  const subjectType = url.searchParams.get('subjectType');
  const subjectId = url.searchParams.get('subjectId');
  if (!subjectType || !subjectId) throw error(400, 'subjectType and subjectId required');

  // A user's own subject holds their guardian set — who would vouch for them
  // is exactly what someone planning to con those people wants to know.
  // Guardians reach what they need through /api/consent/recovery.
  if (subjectType === 'user' && String(locals.uid ?? '') !== subjectId) {
    throw error(403, 'a user subject is readable by that user only');
  }

  const events = await consentStore.eventsForSubject(subjectType, subjectId);
  return json({ ok: true, events });
};
