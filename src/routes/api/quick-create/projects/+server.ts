import { error, json } from '@sveltejs/kit';
import { sendToSer } from '$lib/send/sendToSer.js';
import type { RequestHandler } from './$types';

/**
 * Minimal membership list for the global Quick Create picker.
 * Identity is taken from the signed session (`locals.uid`), never from a
 * caller-supplied user id. The normal /moach layout and create action still
 * re-check membership/authorization before displaying or saving a form.
 */
export const GET: RequestHandler = async ({ locals, fetch }) => {
  const uid = locals.uid;
  if (!uid) throw error(401, 'Authentication required');

  try {
    const result: any = await sendToSer(
      { uid: String(uid) },
      '64getUserProjectList',
      null,
      null,
      false,
      fetch,
      { silent: true }
    );

    const rows =
      result?.data?.usersPermissionsUser?.data?.attributes?.projects_1s?.data ??
      [];
    const projects = rows
      .map((project: any) => {
        const attributes = project?.attributes;
        if (!project?.id || !attributes?.projectName) return null;
        return {
          id: String(project.id),
          projectName: String(attributes.projectName),
          profilePic:
            attributes.profilePic?.data?.attributes?.formats?.thumbnail?.url ??
            attributes.profilePic?.data?.attributes?.url ??
            null
        };
      })
      .filter(Boolean);

    return json(
      { projects },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (cause) {
    console.error('[quick-create] Failed to load the member rikmas', cause);
    throw error(503, 'Could not load your rikmas');
  }
};
