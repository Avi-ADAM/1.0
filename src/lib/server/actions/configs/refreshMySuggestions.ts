/**
 * Action: refreshMySuggestions
 *
 * Recomputes match-suggestions for the current user against all open
 * missions / open mashaabims. Used by the lev page as a lazy backfill when a
 * user has no stored suggestions yet (e.g. users that predate the
 * match-suggestion collection), and available anywhere a manual "refresh my
 * matches" is needed. Event-driven upkeep (mission created / profile updated)
 * happens in the respective actions via src/lib/server/matching/engine.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { matchUserToOpenEntities } from '$lib/server/matching/engine';

const handler: ActionExecutionHandler = async (_params, context, { strapi }) => {
  const result = await matchUserToOpenEntities(String(context.userId), 'backfill', {
    strapi,
    fetch: context.fetch,
    lang: context.lang
  });

  return {
    data: result,
    updateStrategy: { type: 'none' }
  };
};

export const refreshMySuggestionsConfig: ActionConfig = {
  key: 'refreshMySuggestions',
  description: 'Recompute match-suggestions (missions + resources) for the current user.',
  graphqlOperation: handler,
  paramSchema: {},
  authRules: [{ type: 'jwt', errorMessage: 'You must be logged in to refresh suggestions' }],
  updateStrategy: { type: 'none' }
};
