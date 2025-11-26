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

// Export ValidationEngine
export { ValidationEngine } from './ValidationEngine.js';
