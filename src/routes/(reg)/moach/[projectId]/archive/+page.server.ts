import { sendToSer } from '$lib/send/sendToSer.js';
import type { PageServerLoad } from './$types';

/**
 * The rikma's archive (PLAN_OBJECT_ARCHIVAL — phase 3).
 *
 * Nothing is ever deleted, so this is where removed objects stay readable:
 * what left, why, who carried it, and what happened to the hours. It is the
 * one query in the codebase that asks *for* `lifecycle: archived` instead of
 * filtering it out.
 */
export const load: PageServerLoad = async ({ params, fetch }) => {
  const { projectId } = params;

  const res = (await sendToSer(
    { pid: projectId },
    'archivedObjects',
    0,
    0,
    false,
    fetch
  )) as any;

  return {
    archived: res?.data?.project?.data?.attributes ?? null
  };
};
