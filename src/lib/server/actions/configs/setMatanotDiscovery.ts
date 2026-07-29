import type { ActionConfig, ActionExecutionHandler } from '../types.js';

/**
 * Hide / show a product in the public products directory (/gift).
 *
 * A rikma sells plenty of things it does not want listed on the discovery
 * page — members-only offers, a product still being shaped, a one-off for a
 * single customer. `hideFromDiscovery` is that opt-out: the product stays fully
 * alive (its own /gift/[id] page, the project page, sales reporting, sheiruts) —
 * it just stops appearing in the directory listing (QID 282).
 *
 * Like setSupportPage this is a display gate, not a money movement, so it is a
 * direct update with no Decision. Who may flip it:
 *   - a project product (`projectcreates`) — any member of one of its rikmas;
 *   - a personal product (`origin='personal'`) — its owner only.
 * Both are verified here against the product's own relations, so passing
 * someone else's matanotId cannot help a caller (null-legacy `hideFromDiscovery`
 * is read as false everywhere).
 */

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { matanotId, hideFromDiscovery } = params as {
    matanotId: string;
    hideFromDiscovery: boolean;
  };

  const id = String(matanotId ?? '');
  if (!id) throw new Error('matanotId is required');
  if (typeof hideFromDiscovery !== 'boolean') {
    throw new Error('hideFromDiscovery must be a boolean');
  }

  const uid = String(context.userId);
  const jwt = context.jwt as string;
  const f = context.fetch as typeof fetch;

  const meta = await strapi.execute('266getMatanotSellerMeta', { id }, jwt, f);
  const node = (meta as any)?.data?.matanot?.data;
  if (!node) throw new Error(`Matanot ${id} not found`);

  const attrs = node.attributes ?? {};
  const ownerId = attrs.owner_user?.data?.id;
  const projectIds: string[] = (attrs.projectcreates?.data ?? []).map((p: any) =>
    String(p.id)
  );

  let allowed = !!ownerId && String(ownerId) === uid;

  // A product can hang off more than one rikma — membership in any of them is
  // enough, same as everywhere else a project product is edited.
  for (const projectId of projectIds) {
    if (allowed) break;
    const res = await strapi.execute(
      '65checkProjectMembership',
      { uid, projectId },
      jwt,
      f
    );
    const projects =
      (res as any)?.data?.usersPermissionsUser?.data?.attributes?.projects_1s?.data ?? [];
    if (projects.length > 0) allowed = true;
  }

  if (!allowed) {
    throw new Error('Only the seller (rikma member or product owner) can change this');
  }

  const res = await strapi.execute(
    '285setMatanotDiscovery',
    { id, hideFromDiscovery },
    jwt,
    f
  );

  const updated =
    (res as any)?.data?.updateMatanot?.data?.attributes?.hideFromDiscovery ?? null;

  return {
    data: { matanotId: id, hideFromDiscovery: updated ?? hideFromDiscovery },
    updateStrategy: { type: 'none' as const }
  };
};

export const setMatanotDiscoveryConfig: ActionConfig = {
  key: 'setMatanotDiscovery',
  description:
    'Show or hide a product in the public products directory (/gift). Rikma member or personal-product owner.',
  graphqlOperation: handler,
  paramSchema: {
    matanotId: { type: 'string', required: true },
    hideFromDiscovery: { type: 'boolean', required: true }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' }
};
