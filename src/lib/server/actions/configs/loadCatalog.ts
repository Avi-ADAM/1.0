import type { ActionConfig, ActionExecutionHandler } from '../types.js';

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

  const res = await f(import.meta.env.VITE_URL + '/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({
      query: `query { ${linkp} { data { id attributes { ${field} ${more} } } } }`
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
