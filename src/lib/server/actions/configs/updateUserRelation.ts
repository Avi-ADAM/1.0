import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { matchUserToOpenEntities } from '$lib/server/matching/engine';
import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';

const KISH_VALC: Record<string, string> = {
  skills:     'skillName',
  work_ways:  'workWayName',
  vallues:    'valueName',
  tafkidims:  'roleDescription'
};

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { kish, ids } = params;
  const valc = KISH_VALC[kish as string];
  if (!valc) throw new Error(`Invalid relation field: ${kish}`);

  const userId = context.userId as string;
  const jwt    = context.jwt   as string;
  const f      = context.fetch as typeof fetch;

  const idList = (ids as string[]).map(id => `"${id}"`).join(', ');

  const res = await f(STRAPI_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({
      query: `mutation {
        updateUsersPermissionsUser(id: ${userId}, data: { ${kish}: [${idList}] }) {
          data {
            attributes {
              ${kish} {
                data {
                  id
                  attributes {
                    ${valc}
                    localizations { data { attributes { ${valc} } } }
                  }
                }
              }
            }
          }
        }
      }`
    })
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);

  // Profile capabilities changed → immediately find newly matching open
  // missions for this user and store them as match-suggestions, so the lev
  // page shows fresh suggestions with a clean pull. Never blocks the save.
  if (kish === 'skills' || kish === 'tafkidims' || kish === 'work_ways') {
    await matchUserToOpenEntities(userId, 'profileUpdated', {
      strapi,
      fetch: f,
      lang: context.lang
    });
  }

  return json.data.updateUsersPermissionsUser.data;
};

export const updateUserRelationConfig: ActionConfig = {
  key: 'updateUserRelation',
  description: 'Update a relation field on the current user (skills, work_ways, vallues, tafkidims)',
  graphqlOperation: handler,
  paramSchema: {
    kish: { type: 'string', required: true,  description: 'Relation field name (whitelisted)' },
    ids:  { type: 'array',  required: true,  description: 'Array of relation IDs to set' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'You must be logged in to update your profile' }],
  updateStrategy: { type: 'none' }
};
