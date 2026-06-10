/**
 * Create Weave — the "יצירת ריקמה" flow from baci.svelte, moved server-side.
 *
 * Reusable project-creation action so the JWT never reaches the client:
 *   1. Mint any vallues the user typed that don't exist yet (collect their ids).
 *   2. Create the project (weave) with the creator as the sole member.
 *
 * The cover-image upload stays a separate step (the client posts the file to
 * the /api/upload proxy, which injects the cookie JWT, and passes the returned
 * imageId here). Site-activity logging (/api/ste) stays on the client — it's a
 * same-origin internal endpoint with no token involved.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context, util) => {
  const { strapi } = util;
  const {
    projectName,
    publicDescription,
    descripFor,
    linkToWebsite,
    restime,
    timeToP,
    imageId,
    isOt,
    vallueIds = [],
    newVallueNames = []
  } = params as {
    projectName: string;
    publicDescription?: string | null;
    descripFor?: string | null;
    linkToWebsite?: string | null;
    restime?: string | null;
    timeToP?: string | null;
    imageId?: string | number | null;
    isOt?: boolean;
    vallueIds?: (string | number)[];
    newVallueNames?: string[];
  };

  if (!projectName || !String(projectName).trim()) {
    throw new Error('שם הריקמה חסר');
  }

  const now = new Date().toISOString();

  // 1) Create any new vallues the user typed, collect every resolved id.
  const resolvedVallueIds: string[] = vallueIds.map(String);
  for (const name of newVallueNames) {
    const trimmed = String(name).trim();
    if (!trimmed) continue;
    try {
      const vRes = await strapi.execute(
        'crVallue',
        { valueName: trimmed, publishedAt: now },
        context.jwt,
        context.fetch
      );
      const id = vRes?.data?.createVallue?.data?.id;
      if (id) resolvedVallueIds.push(String(id));
    } catch (e) {
      console.warn('[createWeave] createVallue failed (skipped):', trimmed, e);
    }
  }

  // 2) Create the project (weave) with the creator as the sole member.
  const pRes = await strapi.execute(
    'crWeaveFull',
    {
      members: [String(context.userId)],
      projectName: String(projectName).trim(),
      publicDescription: publicDescription ?? null,
      descripFor: descripFor ?? null,
      linkToWebsite: linkToWebsite ?? null,
      vallues: resolvedVallueIds,
      restime: restime || null,
      timeToP: timeToP || null,
      profilePic: imageId ? String(imageId) : null,
      isOt: isOt ?? false,
      publishedAt: now
    },
    context.jwt,
    context.fetch
  );

  const project = pRes?.data?.createProject?.data;
  if (!project?.id) throw new Error('יצירת הריקמה נכשלה');

  return {
    data: {
      projectId: String(project.id),
      projectName: project.attributes?.projectName ?? String(projectName).trim()
    },
    updateStrategy: { type: 'none' as const }
  };
};

export const createWeaveConfig: ActionConfig = {
  key: 'createWeave',
  description:
    'Create a new weave (project / "ריקמה") with the creator as sole member. Mints any new vallues first, then creates the project with all form fields. Reusable project-creation flow; keeps the JWT server-side.',
  graphqlOperation: handler,
  paramSchema: {
    projectName: { type: 'string', required: true },
    publicDescription: { type: 'string', required: false },
    descripFor: { type: 'string', required: false },
    linkToWebsite: { type: 'string', required: false },
    restime: { type: 'string', required: false },
    timeToP: { type: 'string', required: false },
    imageId: { type: 'string', required: false },
    isOt: { type: 'boolean', required: false },
    vallueIds: { type: 'array', required: false },
    newVallueNames: { type: 'array', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to create a weave' }],
  updateStrategy: { type: 'none' }
};
