import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import {
  openRecoverySession,
  findRecoverySession,
  isRecoveryCodeShape,
  effectiveSetFor,
  recoveryCheckFor,
  RECOVERY_SESSION_TTL_MS
} from '$lib/server/consent/recovery';
import { usernamesFor } from '$lib/server/consent/userDirectory';
import { notifyRecovery } from '$lib/server/consent/recoveryNotify';

// T9b social recovery — the request half (PLAN_T9_SOCIAL_RECOVERY §4).
//
// POST — the NEW device (email session, no trusted key) opens a recovery
//        request with its public keys and gets a code to read to its
//        guardians, plus the fingerprint they must read back.
// GET ?code= — a GUARDIAN looks the request up. Answered only when the
//        caller is in the user's guardian set in force; to anyone else the
//        code does not exist.
//
// Neither step is authority. The vouch is a signed consent event the guardian
// posts to /api/consent/events; registration re-derives everything from the
// signed events (keys/register with `recovery: true`).
export const POST: RequestHandler = async ({ request, cookies, locals }) => {
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');
  const userId = locals.uid || undefined;
  if (!userId) throw error(401, 'no user id in session');

  const body = await request.json().catch(() => null);
  const { devicePubB64, algo, pubSpkiB64, label, kemPubSpkiB64 } = (body ?? {}) as {
    devicePubB64?: unknown; algo?: unknown; pubSpkiB64?: unknown;
    label?: unknown; kemPubSpkiB64?: unknown;
  };
  if (typeof devicePubB64 !== 'string' ||
      (algo !== 'Ed25519' && algo !== 'ECDSA-P256') ||
      typeof pubSpkiB64 !== 'string' ||
      typeof label !== 'string' ||
      // The KEM key is not optional here: it is half of what guardians vouch
      // for, and the only way members can hand this device the rikma's keys.
      typeof kemPubSpkiB64 !== 'string' || !kemPubSpkiB64) {
    throw error(400, 'bad shape');
  }

  const set = await effectiveSetFor(userId);
  if (!set) return json({ ok: false, reason: 'no_guardians' }, { status: 409 });

  const session = await openRecoverySession({
    userId, devicePubB64, algo, pubSpkiB64, label: label.slice(0, 60), kemPubSpkiB64
  });
  // Only guardians who accepted can vouch — those are the ones to call.
  const names = await usernamesFor(set.accepted);
  console.info('[recovery-telemetry]', {
    userId, status: 'request_opened', device: devicePubB64.slice(0, 12)
  });
  void notifyRecovery(userId, 'recoveryOpened', { fingerprint: session.fingerprint });

  return json({
    ok: true,
    code: session.code,
    fingerprint: session.fingerprint,
    ttlMs: RECOVERY_SESSION_TTL_MS,
    threshold: set.predicate.threshold,
    guardians: set.accepted.map((id) => ({ id, username: names[id] ?? null }))
  });
};

export const GET: RequestHandler = async ({ url, cookies, locals }) => {
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');
  const guardianId = locals.uid || undefined;
  if (!guardianId) throw error(401, 'no user id in session');

  const code = url.searchParams.get('code') ?? '';
  if (!isRecoveryCodeShape(code)) throw error(400, 'bad code');

  const s = findRecoverySession(code);
  // Same answer for "no such code" and "not your business": a code must not
  // confirm to a stranger that a recovery is under way.
  const notFound = () => json({ ok: false, reason: 'not_found' }, { status: 404 });
  if (!s || s.userId === guardianId) return notFound();
  const set = await effectiveSetFor(s.userId);
  if (!set || !set.accepted.includes(String(guardianId))) {
    console.info('[recovery-telemetry]', { status: 'lookup_refused', guardianId });
    return notFound();
  }

  const check = await recoveryCheckFor(s.userId, {
    devicePubKey: s.devicePubB64,
    kemPubSpkiB64: s.kemPubSpkiB64
  });
  const names = await usernamesFor([s.userId]);
  return json({
    ok: true,
    request: {
      userId: s.userId,
      username: names[s.userId] ?? null,
      devicePubB64: s.devicePubB64,
      kemPubSpkiB64: s.kemPubSpkiB64,
      label: s.label,
      fingerprint: s.fingerprint,
      openedAt: s.createdAt,
      guardianSetId: set.set.id,
      threshold: set.predicate.threshold,
      vouchers: check.vouchers ?? [],
      protestedAt: check.protestedAt ?? null
    }
  });
};
