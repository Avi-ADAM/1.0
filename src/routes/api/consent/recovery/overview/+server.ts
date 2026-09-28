import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { recoveryOverview } from '$lib/server/consent/recovery';
import { usernamesFor } from '$lib/server/consent/userDirectory';
import type { GuardianSetPredicate } from '$lib/consent/recovery';
import type { ConsentEvent } from '$lib/consent/event';

// GET /api/consent/recovery/overview — the session user's own recovery state:
// the guardian set in force, a newer one waiting (for its activation delay
// and/or its guardians' consent), every recovery in progress on this account
// (what a device the user still holds needs in order to protest), and the
// other side — whom this user was nominated to guard. Self only.
export const GET: RequestHandler = async ({ cookies, locals }) => {
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');
  const userId = locals.uid || undefined;
  if (!userId) throw error(401, 'no user id in session');

  const o = await recoveryOverview(String(userId));
  const ids = [
    ...guardiansOf(o.effective),
    ...guardiansOf(o.pending?.set ?? null),
    ...o.recoveries.flatMap((p) => p.check.vouchers ?? []),
    ...o.guarding.map((g) => g.ownerId)
  ];
  const names = await usernamesFor(ids);
  const setView = (ev: ConsentEvent | null, accepted: string[]) =>
    ev && {
      id: ev.id,
      signedAt: ev.ts,
      threshold: (ev.predicate as unknown as GuardianSetPredicate).threshold,
      guardians: guardiansOf(ev).map((id) => ({
        id,
        username: names[id] ?? null,
        accepted: accepted.includes(id)
      }))
    };

  return json({
    ok: true,
    effective: setView(o.effective, o.effectiveAccepted),
    pending: o.pending && { ...setView(o.pending.set, o.pending.accepted), activeAt: o.pending.activeAt },
    recoveries: o.recoveries.map((p) => ({
      devicePubKey: p.devicePubKey,
      fingerprint: p.fingerprint,
      threshold: o.effective ? (o.effective.predicate as unknown as GuardianSetPredicate).threshold : null,
      vouchers: (p.check.vouchers ?? []).map((id) => ({ id, username: names[id] ?? null })),
      readyAt: p.check.ok ? p.check.readyAt : null,
      protestedAt: p.check.protestedAt ?? null
    })),
    guarding: o.guarding.map((g) => ({ ...g, username: names[g.ownerId] ?? null }))
  });
};

function guardiansOf(ev: ConsentEvent | null): string[] {
  return ev ? (ev.predicate as unknown as GuardianSetPredicate).guardians : [];
}
