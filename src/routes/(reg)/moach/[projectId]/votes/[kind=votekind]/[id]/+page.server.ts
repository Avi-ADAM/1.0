import { sendToSer } from '$lib/send/sendToSer.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Single-entity vote pages. Each kind has its own focused query that returns
// exactly the fields the lev voting cards need — fast and position-independent,
// so an email/share link lands directly on one vote with no array scanning and
// no heavy lev-page payload.
const QID: Record<string, string> = {
  pmash: 'getPmashForVote',
  pendm: 'getPendmForVote'
};
const ROOT: Record<string, string> = {
  pmash: 'pmash',
  pendm: 'pendm'
};

export const load: PageServerLoad = async ({ params, fetch }) => {
  const { projectId, kind, id } = params as {
    projectId: string;
    kind: 'pmash' | 'pendm';
    id: string;
  };

  const res = await sendToSer({ eid: id }, QID[kind], null, null, false, fetch);
  const entity = res?.data?.[ROOT[kind]]?.data ?? null;

  if (!entity) throw error(404, 'Vote not found');

  // Cross-project guard: the entity must belong to the project in the URL.
  // Membership in that project is already enforced by the moach [projectId]
  // +layout.server.ts, so we only need to prevent viewing a vote from another
  // project by guessing its id.
  const entityProjectId = entity.attributes?.project?.data?.id;
  if (String(entityProjectId) !== String(projectId)) {
    throw error(404, 'Vote not found');
  }

  return { kind, entity };
};
