import type { ActionConfig, ActionExecutionHandler } from '../types.js';

/**
 * Toggle the onboarding guide visibility for the current user.
 *
 * Sets `profilManualAlready` on the logged-in user (true = guide already done /
 * hidden, false = show guide again). The target user is taken from the JWT
 * context (server-side), never from a client-supplied id.
 *
 * Client sends: { show: boolean }  (show=true → resume guide, show=false → stop)
 */
const handler: ActionExecutionHandler = async (params, context) => {
  const show = params.show as boolean;

  const userId = context.userId as string;
  const jwt = context.jwt as string;
  const f = context.fetch as typeof fetch;

  // show=true (resume guide) → profilManualAlready=false
  // show=false (stop guide)  → profilManualAlready=true
  const profilManualAlready = !show;

  const res = await f(import.meta.env.VITE_URL + '/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({
      query: `mutation {
        updateUsersPermissionsUser(id: ${userId}, data: { profilManualAlready: ${profilManualAlready} }) {
          data { id }
        }
      }`
    })
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data.updateUsersPermissionsUser.data;
};

export const toggleGuideStatusConfig: ActionConfig = {
  key: 'toggleGuideStatus',
  description: 'Toggle onboarding guide visibility (profilManualAlready) for the current user',
  graphqlOperation: handler,
  paramSchema: {
    show: { type: 'boolean', required: true, description: 'true = resume guide, false = stop guide' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'You must be logged in to change guide settings' }],
  updateStrategy: { type: 'none' }
};
