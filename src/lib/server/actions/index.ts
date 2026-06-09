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

const STRAPI_ENDPOINT = (process.env.VITE_URL || 'https://tovmeod.1lev1.com') + '/graphql';
const ADMIN_TOKEN = (process.env.ADMINMONTHER || process.env.VITE_ADMINMONTHER || '').replace(/\s+/g, '');

const strapiClient = new StrapiClient(STRAPI_ENDPOINT, ADMIN_TOKEN);
const validator = new ValidationEngine();
const authorizer = new AuthorizationEngine(strapiClient);
const notifier = new NotificationOrchestrator(strapiClient);

export const actionService = new ActionService(
  validator,
  authorizer,
  strapiClient,
  notifier
);
