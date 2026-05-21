import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { isConsentEventShape, type ConsentEvent } from '$lib/consent/event';
import { verifyConsentEvent } from '$lib/server/consent/verifyServerSide';
import { consentStore } from '$lib/server/consent/store';

export const POST: RequestHandler = async ({ request, cookies }) => {
  // JWT cookie gates abuse, but the signature is the real authentication.
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');

  const body = await request.json();
  const ev = body?.event;
  if (!isConsentEventShape(ev)) throw error(400, 'bad event shape');

  const v = await verifyConsentEvent(ev as ConsentEvent);
  if (!v.ok) throw error(400, `verify failed: ${v.reason}`);

  const added = consentStore.putEvent(ev as ConsentEvent);
  return json({ ok: true, deduped: !added, id: (ev as ConsentEvent).id });
};

export const GET: RequestHandler = async ({ url, cookies }) => {
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');

  const subjectType = url.searchParams.get('subjectType');
  const subjectId = url.searchParams.get('subjectId');
  if (!subjectType || !subjectId) throw error(400, 'subjectType and subjectId required');

  const events = consentStore.eventsForSubject(subjectType, subjectId);
  return json({ ok: true, events });
};
