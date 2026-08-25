/**
 * Unified Action System
 * 
 * Main entry point for the action system. Exports all types, registry functions,
 * and core components.
 */

// Export all types
export type {
  ActionConfig,
  ParamSchema,
  ParamRule,
  AuthRule,
  AuthRuleConfig,
  AuthorizationResult,
  NotificationConfig,
  RecipientRule,
  RecipientRuleConfig,
  NotificationTemplates,
  LanguageStrings,
  NotificationChannel,
  NotificationMetadata,
  UpdateStrategy,
  UpdateStrategyConfig,
  ActionContext,
  ActionResult,
  ActionError,
  UserProfile,
  DeviceInfo,
  ValidationResult,
  NotificationPayload,
  ActionRequest,
  ActionResponse
} from './types.js';

// Export registry functions
export {
  actionRegistry,
  registerAction,
  getAction,
  getAllActionKeys,
  hasAction,
  clearRegistry
} from './registry.js';

// Export core engines
export { ValidationEngine } from './ValidationEngine.js';
export { AuthorizationEngine } from './AuthorizationEngine.js';
export { StrapiClient } from './StrapiClient.js';
export { ActionService } from './ActionService.js';

// Initialize and export a singleton instance of ActionService
import { ValidationEngine } from './ValidationEngine.js';
import { AuthorizationEngine } from './AuthorizationEngine.js';
import { StrapiClient } from './StrapiClient.js';
import { ActionService } from './ActionService.js';
import { NotificationOrchestrator } from '$lib/server/notifications/NotificationOrchestrator.js';

import { STRAPI_GRAPHQL as STRAPI_ENDPOINT } from '$lib/server/strapiUrl.js';
import { env as privateEnv } from '$env/dynamic/private';

/**
 * The service token every action and every timegrama finalizer runs on.
 *
 * Read through `$env/dynamic/private` first, `process.env` second — the same
 * order `strapiUrl.js` uses, and for the same reason. `vite dev` does not copy
 * the `.env` file into `process.env`, so the bare `process.env` read left this
 * client with an **empty** token in development: every request went out
 * unauthenticated and came back FORBIDDEN. Handlers catch and log, so the only
 * symptom was silence — a `/api/timegrama` run in dev closed the clocks whose
 * handlers use `SendToAdmin` (which takes its token as an argument) and quietly
 * failed on every one that uses this client. Production was fine, which is
 * exactly what made it hard to see.
 */
const ADMIN_TOKEN = (privateEnv.ADMINMONTHER || process.env.ADMINMONTHER || '')
  .replace(/\s+/g, '')
  .replace(/^ADMINMONTHER=/, '');

if (!ADMIN_TOKEN) {
  console.warn(
    '[actions] ADMINMONTHER is empty — every StrapiClient call will be unauthenticated.'
  );
}

// Shared admin-token client. Exported so server code outside the action
// pipeline (e.g. the timegrama cron handlers) can reuse it — notably for the
// match-suggestion engine in $lib/server/matching.
export const strapiClient = new StrapiClient(STRAPI_ENDPOINT, ADMIN_TOKEN);
const validator = new ValidationEngine();
// Exported so the permissions introspection endpoint can evaluate an action's
// entity-level authRules with real params (final allowed/denied) without going
// through the full execute pipeline.
export const authorizer = new AuthorizationEngine(strapiClient);
const notifier = new NotificationOrchestrator(strapiClient);

export const actionService = new ActionService(
  validator,
  authorizer,
  strapiClient,
  notifier
);
