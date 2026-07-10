/**
 * Ensure Personal Rikma — PLAN_USER_OFFERINGS §3.1.
 *
 * Idempotently returns the caller's "home rikma" (the regular, one-member
 * project that hosts their personal offerings), creating it on first use.
 *
 * Design note: the created project carries NO special flag — it is a normal
 * rikma that happens to start with a single member. Every consent mechanism
 * already branches on member count (single member ⇒ instant consensus), and
 * the product direction is to invite partners into it, not to fence it off.
 * `user.personal_project` exists only so repeated publishes reuse the same
 * rikma instead of minting a new one each time.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

type MinimalContext = {
  userId: string | number;
  jwt: string;
  fetch: typeof fetch;
};

type StrapiExec = {
  execute: (
    qid: string,
    vars: Record<string, unknown>,
    jwt: string,
    f: typeof fetch
  ) => Promise<any>;
};

/**
 * Reusable helper so sibling actions (publishUserResourceAsProduct,
 * confirmMaagadQuorum…) can ensure the rikma without re-entering the registry.
 * Returns `{ projectId, projectName, created }`.
 */
export async function ensurePersonalRikmaFor(
  context: MinimalContext,
  strapi: StrapiExec
): Promise<{ projectId: string; projectName: string; created: boolean }> {
  const uid = String(context.userId);

  const uRes = await strapi.execute(
    '250getUserPersonalProject',
    { uid },
    context.jwt,
    context.fetch
  );
  const uAttrs = uRes?.data?.usersPermissionsUser?.data?.attributes ?? {};
  const existing = uAttrs.personal_project?.data;
  if (existing?.id) {
    return {
      projectId: String(existing.id),
      projectName: existing.attributes?.projectName ?? '',
      created: false
    };
  }

  const username = uAttrs.username || '';
  const projectName = username ? `הריקמה של ${username}` : 'הריקמה שלי';
  const now = new Date().toISOString();

  // Same creation path as the createWeave action (crWeaveFull): the caller is
  // the sole member; restime defaults to 72h ('sth') like matanotpend rounds.
  const pRes = await strapi.execute(
    'crWeaveFull',
    {
      members: [uid],
      projectName,
      publicDescription: null,
      descripFor: null,
      linkToWebsite: null,
      vallues: [],
      restime: 'sth',
      timeToP: null,
      profilePic: null,
      isOt: false,
      publishedAt: now
    },
    context.jwt,
    context.fetch
  );
  const project = pRes?.data?.createProject?.data;
  if (!project?.id) throw new Error('יצירת ריקמת הבית נכשלה');

  await strapi.execute(
    '251setUserPersonalProject',
    { uid, pid: String(project.id) },
    context.jwt,
    context.fetch
  );

  return {
    projectId: String(project.id),
    projectName: project.attributes?.projectName ?? projectName,
    created: true
  };
}

const handler: ActionExecutionHandler = async (_params, context, util) => {
  const { strapi } = util;
  const result = await ensurePersonalRikmaFor(
    {
      userId: context.userId as string,
      jwt: context.jwt as string,
      fetch: context.fetch as typeof fetch
    },
    strapi
  );

  return {
    data: result,
    updateStrategy: { type: 'none' as const }
  };
};

export const ensurePersonalRikmaConfig: ActionConfig = {
  key: 'ensurePersonalRikma',
  description:
    'Idempotently get-or-create the caller\'s home rikma (a regular one-member project) that hosts their personal offerings. Returns { projectId, projectName, created }.',
  graphqlOperation: handler,
  paramSchema: {},
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' }
};
