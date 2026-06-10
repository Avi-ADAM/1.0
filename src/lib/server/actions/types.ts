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

  /**
   * Consent-event mapping for actions that ratify a group decision
   * (PLAN_action_migration_vs_p2p §6.3).
   *
   * When present, /api/action mirrors the action into a signed ConsentEvent
   * (Phase 1 shadow signing). The action's params map 1:1 to the event's
   * predicate (PLAN_action_migration_vs_p2p D-10). Absent ⇒ legacy mutation
   * only, no shadow event.
   */
  consentSpec?: ConsentSpec;
}

/**
 * Declarative mapping from an action invocation to a ConsentEvent. Lets
 * existing actions emit shadow-signed events without touching call sites.
 *
 * For poly-actions that branch on a param value (e.g. addVote with
 * type=tosplit|pend|sheirutpend|...), `action` and `subjectType` can be
 * functions that derive the right value from params. They can also return
 * `null` to indicate "no consent event for this invocation" — used when only
 * some branches of a poly-action ratify a group decision.
 */
export interface ConsentSpec {
  /** Dotted action name (e.g., 'tosplit.vote'). String or per-invocation deriver. */
  action: string | ((params: Record<string, unknown>) => string | null);

  /** Type tag for ConsentEvent.subject.type. String or per-invocation deriver. */
  subjectType: string | ((params: Record<string, unknown>) => string);

  /** Name of the action param that holds the subject id */
  subjectIdParam: string;

  /**
   * Whether this event ratifies a group decision (needs QuorumProof).
   * Maps to PLAN_rikma_as_state_machine §8.2 — informs the verifier whether
   * to expect a `quorum` field.
   */
  requireConsensus?: boolean;

  /**
   * Restime resolution mode (PLAN_restime_in_signed_chain §10).
   *   - 'project'  → look up the parent project's restimeMs
   *   - 'ratson'   → look up the parent ratson's restimeMs
   *   - 'custom'   → predicateFromParams must include `restimeMs`
   *   - undefined  → no restime applies (immediate decision)
   */
  restimeFrom?: 'project' | 'ratson' | 'custom';

  /**
   * Pure mapping from action params to event.predicate. If omitted, the
   * predicate is `{ ...params, [subjectIdParam]: undefined, userId: undefined }`
   * — the subject id moves to ConsentEvent.subject.id and userId is bound at
   * sign time from the session, not from the payload.
   */
  predicateFromParams?: (params: Record<string, unknown>) => Record<string, unknown>;

  /**
   * Optional: which existing event ids this one descends from. Default: an
   * empty array (caller assembles the DAG). For votes, typically the
   * proposal-creation event.
   */
  parentsFromParams?: (params: Record<string, unknown>) => string[];
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
  type: 'jwt' | 'projectMember' | 'sheirutCustomer' | 'forumParticipant' | 'role' | 'custom' | 'or';

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

  /** Parameter name containing sheirut ID (for sheirutCustomer check) */
  sheirutIdParam?: string;

  /** Parameter name containing forum ID (for forumParticipant check) */
  forumIdParam?: string;

  /** Required role name (for role check) */
  requiredRole?: string;

  /** Custom authorization function (for custom check) */
  checkFunction?: (
    userId: string,
    params: Record<string, any>,
    context: ActionContext
  ) => Promise<AuthorizationResult>;

  /** Sub-rules for 'or' type — passes if ANY sub-rule passes */
  rules?: AuthRule[];
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

  /** Extra props passed directly to the email template (for templates beyond SimpleNuti) */
  emailTemplateData?: Record<string, any>;

  /** Additional metadata for notifications */
  metadata?: NotificationMetadata;
}

/**
 * Rules for selecting notification recipients
 */
export interface RecipientRule {
  /** Type of recipient selection strategy */
  type: 'projectMembers' | 'specificUsers' | 'skillBased' | 'custom' | 'meetingParticipants' | 'askParticipants';

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

  /** Parameter name containing forum ID (for meeting participants) */
  forumIdParam?: string;

  /** Parameter name containing ask ID (for ask participants) */
  askIdParam?: string;

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
