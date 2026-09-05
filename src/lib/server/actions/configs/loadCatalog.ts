import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';

const CATALOG: Record<string, string> = {
  mashaabims: 'name',
  skills:     'skillName',
  workWays:   'workWayName',
  vallues:    'valueName',
  tafkidims:  'roleDescription'
};

const handler: ActionExecutionHandler = async (params, context) => {
  const { linkp, lang } = params;
  const field = CATALOG[linkp as string];
  if (!field) throw new Error(`Invalid catalog type: ${linkp}`);

  const jwt = context.jwt  as string;
  const f   = context.fetch as typeof fetch;

  const more = lang !== 'en' ? `localizations { data { attributes { ${field} } } }` : '';

  const res = await f(STRAPI_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({
      // Explicit limit: without one Strapi applies its default page size, so
      // the picker this feeds silently showed only the first slice of the
      // catalog — and a member whose resource sat past the cut-off would
      // "create" a duplicate template for something that already existed.
      // 500 matches qid 204getAllMashaabims, which reads the same collection.
      query: `query { ${linkp}(pagination: { limit: 500 }) { data { id attributes { ${field} ${more} } } } }`
    })
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data[linkp as string].data;
};

export const loadCatalogConfig: ActionConfig = {
  key: 'loadCatalog',
  description: 'Load a whitelisted catalog collection (mashaabims, skills, work_ways, vallues, tafkidims)',
  graphqlOperation: handler,
  paramSchema: {
    linkp: { type: 'string', required: true,  description: 'Collection name (whitelisted)' },
    lang:  { type: 'string', required: false, description: 'Language code (he for Hebrew localizations)' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'You must be logged in to load catalog data' }],
  updateStrategy: { type: 'none' }
};
