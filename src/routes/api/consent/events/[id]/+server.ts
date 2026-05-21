import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { consentStore } from '$lib/server/consent/store';

export const GET: RequestHandler = async ({ params, cookies }) => {
  if (!cookies.get('jwt')) throw error(401, 'Unauthorized');
  const ev = consentStore.getEvent(params.id!);
  if (!ev) throw error(404, 'not found');
  return json({ ok: true, event: ev });
};
