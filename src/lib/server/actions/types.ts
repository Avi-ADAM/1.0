/**
 * Core type definitions for the Unified Action System
 * 
 * This file contains all TypeScript interfaces and types used throughout
 * the action system, including configuration, validation, authorization,
 * and notification types.
 */

// ============================================================================
// Action Configuration Types
// ============================================================================

/**
 * Complete configuration for an action
 */
export interface ActionConfig {
  /** Unique identifier for this action (e.g., 'createTask', 'updateUser') */
  key: string;

  /** Human-readable description of what this action does */
  description: string;

  /** GraphQL query/mutation ID from QIDS OR a custom handler function */
  graphqlOperation: string | ActionExecutionHandler;

  /** Parameter validation schema */
  paramSchema: ParamSchema;

  /** Authorization rules that must be satisfied */
  authRules: AuthRule[];

  /** Notification configuration (optional) */
  notification?: NotificationConfig;

  /** Update strategy for client-side updates (optional) */
  updateStrategy?: UpdateStrategy;
}

/**
 * Custom action execution handler
 */
export type ActionExecutionHandler = (
  params: Record<string, any>,
  context: ActionContext,
  util: {
    strapi: any;
    notifier?: any;
  }
) => Promise<any>;

/**
 * Parameter validation schema
 */
export type ParamSchema = Record<string, ParamRule>;

/**
 * Validation rules for a single parameter
 */
export interface ParamRule {
  /** Expected type of the parameter */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';

  /** Whether this parameter is required */
  required: boolean;

  /** Custom validation function (optional) */
  validate?: (value: any) => boolean;

  /** Human-readable description of validation requirements */
  description?: string;
}

// ============================================================================
// Authorization Types
// ============================================================================

/**
 * Authorization rule configuration
 */
export interface AuthRule {
  /** Type of authorization check */
  type: 'jwt' | 'projectMember' | 'role' | 'custom';

  /** Configuration specific to the auth rule type */
  config?: AuthRuleConfig;

  /** Error message to return if authorization fails */
  errorMessage?: string;
}

/**
 * Configuration for authorization rules
 */
export interface AuthRuleConfig {
  /** Parameter name containing project ID (for projectMember check) */
  projectIdParam?: string;

  /** Required role name (for role check) */
  requiredRole?: string;

  /** Custom authorization function (for custom check) */
  checkFunction?: (
    userId: string,
    params: Record<string, any>,
    context: ActionContext
  ) => Promise<AuthorizationResult>;
}

/**
 * Result of an authorization check
 */
export interface AuthorizationResult {
  /** Whether the user is authorized */
  authorized: boolean;

  /** Reason for denial (if not authorized) */
  reason?: string;
}

// ============================================================================
// Notification Types
// ============================================================================

/**
 * Notification configuration for an action
 */
export interface NotificationConfig {
  /** Rules for determining who receives notifications */
  recipients: RecipientRule;

  /** Notification content templates (multilingual) */
  templates: NotificationTemplates;

  /** Which channels to use for notifications */
  channels: NotificationChannel[];

  /** Email template component name (optional, defaults to 'SimpleNuti') */
  emailTemplate?: string;

  /** Additional metadata for notifications */
  metadata?: NotificationMetadata;
}

/**
 * Rules for selecting notification recipients
 */
export interface RecipientRule {
  /** Type of recipient selection strategy */
  type: 'projectMembers' | 'specificUsers' | 'skillBased' | 'custom';

  /** Configuration for recipient selection */
  config?: RecipientRuleConfig;
}

/**
 * Configuration for recipient selection
 */
export interface RecipientRuleConfig {
  /** Parameter name containing project ID */
  projectIdParam?: string;

  /** Parameter name containing array of user IDs */
  userIdsParam?: string;

  /** Whether to exclude the action initiator from notifications */
  excludeSender?: boolean;

  /** Required skills for skill-based selection */
  skills?: string[];

  /** Custom GraphQL query for recipient selection */
  customQuery?: string;
}

/**
 * Multilingual notification content templates
 */
export interface NotificationTemplates {
  /** Notification title in different languages */
  title: LanguageStrings;

  /** Notification body in different languages */
  body: LanguageStrings;
}

/**
 * Strings in multiple languages
 */
export interface LanguageStrings {
  he: string;
  en: string;
  ar?: string;
}

/**
 * Available notification channels
 */
export type NotificationChannel = 'socket' | 'email' | 'telegram' | 'push';

/**
 * Additional metadata for notifications
 */
export interface NotificationMetadata {
  /** Icon URL for the notification */
  icon?: string;

  /** URL to navigate to when notification is clicked */
  url?: string;

  /** Priority level of the notification */
  priority?: 'low' | 'normal' | 'high';

  /** Project picture URL */
  projectPic?: string;

  /** Any additional custom data */
  [key: string]: any;
}

// ============================================================================
// Update Strategy Types
// ============================================================================

/**
 * Client-side update strategy configuration
 */
export interface UpdateStrategy {
  /** Type of update strategy */
  type: 'fullRefresh' | 'partialUpdate' | 'optimistic' | 'none';

  /** Configuration for the update strategy */
  config?: UpdateStrategyConfig;
}

/**
 * Configuration for update strategies
 */
export interface UpdateStrategyConfig {
  /** Data keys to refresh (for partialUpdate) */
  dataKeys?: string[];

  /** Name of client-side update function to call */
  updateFunction?: string;

  /** Additional configuration data */
  [key: string]: any;
}

// ============================================================================
// Action Execution Types
// ============================================================================

/**
 * Context information for action execution
 */
export interface ActionContext {
  /** User ID of the action initiator */
  userId: string;

  /** JWT token for authentication */
  jwt: string;

  /** User's preferred language */
  lang: string;

  /** Fetch function for making HTTP requests */
  fetch: typeof globalThis.fetch;
}

/**
 * Result of action execution
 */
export interface ActionResult {
  /** Whether the action succeeded */
  success: boolean;

  /** Data returned from the action (if successful) */
  data?: any;

  /** Update strategy to apply on the client */
  updateStrategy?: UpdateStrategy;

  /** Error information (if failed) */
  error?: ActionError;
}

/**
 * Error information
 */
export interface ActionError {
  /** Error code for programmatic handling */
  code: string;

  /** Human-readable error message */
  message: string;

  /** Additional error details */
  details?: any;
}

// ============================================================================
// User Profile Types
// ============================================================================

/**
 * User profile information for notifications
 */
export interface UserProfile {
  /** User ID */
  id: string;

  /** Username */
  username: string;

  /** Email address */
  email: string;

  /** Preferred language */
  lang: string;

  /** Telegram ID (optional) */
  telegramId?: string;

  /** Whether user has opted out of email notifications */
  noMail?: boolean;

  /** User's registered devices for push notifications */
  machshirs: DeviceInfo[];
}

/**
 * Device information for push notifications
 */
export interface DeviceInfo {
  /** Device ID */
  id: string;

  /** Device attributes */
  attributes?: {
    /** Push notification endpoint configuration */
    jsoni?: any;

    /** Additional device metadata */
    [key: string]: any;
  };
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Result of parameter validation
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;

  /** List of validation errors (if any) */
  errors: string[];
}

// ============================================================================
// Notification Payload Types
// ============================================================================

/**
 * Notification payload sent to users
 */
export interface NotificationPayload {
  /** Action key that triggered the notification */
  actionKey: string;

  /** Notification title in multiple languages */
  title: LanguageStrings;

  /** Notification body in multiple languages */
  body: LanguageStrings;

  /** Additional metadata */
  metadata?: NotificationMetadata;

  /** Action-specific data */
  data?: any;
}

// ============================================================================
// Action Request/Response Types
// ============================================================================

/**
 * Action request from client
 */
export interface ActionRequest {
  /** Action key to execute */
  actionKey: string;

  /** Parameters for the action */
  params: Record<string, any>;
}

/**
 * Action response to client
 */
export interface ActionResponse {
  /** Whether the action succeeded */
  success: boolean;

  /** Data returned from the action (if successful) */
  data?: any;

  /** Error information (if failed) */
  error?: {
    code: string;
    message: string;
    details?: any;
  };

  /** Update strategy to apply on the client */
  updateStrategy?: UpdateStrategy;
}
