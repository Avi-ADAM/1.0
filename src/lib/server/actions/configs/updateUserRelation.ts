import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const KISH_VALC: Record<string, string> = {
  skills:     'skillName',
  work_ways:  'workWayName',
  vallues:    'valueName',
  tafkidims:  'roleDescription'
};

const handler: ActionExecutionHandler = async (params, context) => {
  const { kish, ids } = params;
  const valc = KISH_VALC[kish as string];
  if (!valc) throw new Error(`Invalid relation field: ${kish}`);

  const userId = context.userId as string;
  const jwt    = context.jwt   as string;
  const f      = context.fetch as typeof fetch;

  const idList = (ids as string[]).map(id => `"${id}"`).join(', ');

  const res = await f(import.meta.env.VITE_URL + '/graphql', {
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
