import { sendToSer } from '$lib/send/sendToSer.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Single-entity vote pages. Each kind has its own focused query that returns
// exactly the fields the lev voting cards need — fast and position-independent,
// so an email/share link lands directly on one vote with no array scanning and
// no heavy lev-page payload.
const QID: Record<string, string> = {
  pmash: 'getPmashForVote',
  pendm: 'getPendmForVote',
  ask: 'getAskForVote',
  askm: 'getAskmForVote',
  tosplit: 'getTosplitForVote',
  decision: '159getDecisionForVote'
};
const ROOT: Record<string, string> = {
  pmash: 'pmash',
  pendm: 'pendm',
  ask: 'ask',
  askm: 'askm',
  tosplit: 'tosplit',
  decision: 'decision'
};

export const load: PageServerLoad = async ({ params, fetch }) => {
  const { projectId, kind, id } = params as {
    projectId: string;
    kind: 'pmash' | 'pendm' | 'ask' | 'askm' | 'tosplit' | 'decision';
    id: string;
  };

  const res = await sendToSer({ eid: id }, QID[kind], null, null, false, fetch);
  const entity = res?.data?.[ROOT[kind]]?.data ?? null;

  if (!entity) throw error(404, 'Vote not found');

  // Cross-project guard: when the entity has a project relation set, it must
  // match the URL. Older entities (created before the project field was added)
  // have null project — skip the check for those; moach layout auth already
  // confirmed the user is a member of projectId.
  const entityProjectId = entity.attributes?.project?.data?.id;
  if (entityProjectId && String(entityProjectId) !== String(projectId)) {
    throw error(404, 'Vote not found');
  }

  return { kind, entity };
};
