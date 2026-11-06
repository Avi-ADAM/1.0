// A2b P3 — the settings Decisions this rikma already applied, for the lazy
// project.amend signer ($lib/server/consent/settingsMatured). Read-only and
// advisory, like the timer and genesis exports beside it.

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { adminToken, strapiGet } from '$lib/server/consent/strapiRest';
import {
  maturedSettingsFromRest,
  settingsDecisionsQuery,
  settingsProjectQuery
} from '$lib/server/consent/settingsMatured';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.uid) throw error(401, 'Unauthorized');
  const projectId = params.projectId;
  if (!projectId || !/^\d+$/.test(projectId)) throw error(400, 'bad projectId');
  if (!adminToken()) throw error(503, 'mirror credentials not configured');

  const [decisions, project] = await Promise.all([
    strapiGet(settingsDecisionsQuery(projectId)),
    strapiGet(settingsProjectQuery(projectId))
  ]);
  // Only a member signs for a rikma — and only a member needs the list.
  const members = ((project as any)?.data?.attributes?.user_1s?.data ?? []).map((u: any) => String(u.id));
  if (!members.includes(String(locals.uid))) throw error(403, 'not a member of this rikma');

  return json({ ok: true, projectId, matured: maturedSettingsFromRest(decisions, project) });
};
