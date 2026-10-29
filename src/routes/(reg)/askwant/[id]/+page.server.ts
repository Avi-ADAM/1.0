import { error } from '@sveltejs/kit';
import { strapiClient } from '$lib/server/actions';
import { askwantState, type AskwantState } from '$lib/sheirut/askwantState';
import type { PageServerLoad } from './$types';

/**
 * The requester's own page for one request to receive a service — where the
 * "the rikma did not get to it" notice lands (TIMEGRAMA_REMINDERS R3), and
 * where "ask again" lives.
 *
 * The askwant is read with the service token (its qids are serviceAdmin-only),
 * so the owner check here is the whole guard: anyone else gets the same 404 a
 * missing request would, and learns nothing about it.
 */
export const load: PageServerLoad = async ({ params, locals }) => {
  const uid = locals.uid ? String(locals.uid) : '';
  if (!uid) throw error(401, 'Unauthorized');

  const res = await strapiClient.execute('298getAskwantForFinalize', { id: String(params.id) });
  const a = res?.data?.askwant?.data?.attributes;
  const owner = a?.users_permissions_user?.data?.id;
  if (!a || owner == null || String(owner) !== uid) throw error(404, 'Not found');

  const state: AskwantState = askwantState(a);
  return {
    askwantId: String(params.id),
    state,
    serviceName: a.sheirut?.data?.attributes?.name ?? '',
    projectName: a.project?.data?.attributes?.projectName ?? '',
    dueAt: state === 'waiting' ? (a.timegrama?.data?.attributes?.date ?? null) : null
  };
};
