/**
 * Authorization Engine
 * 
 * Checks if users are authorized to perform actions based on configured rules.
 * Supports JWT validation, project membership checks, role-based authorization,
 * and custom authorization functions.
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 */

import type {
  AuthRule,
  AuthorizationResult,
  ActionContext
} from './types.js';
import { authorizeForumParticipant } from './forumAccess.js';

/**
 * StrapiClient interface for dependency injection
 * This allows us to mock the client in tests
 */
export interface IStrapiClient {
  execute(
    queryId: string,
    variables: Record<string, any>,
    userJwt?: string,
    fetchFn?: typeof globalThis.fetch
  ): Promise<any>;
}

/**
 * AuthorizationEngine class
 * 
 * Responsible for checking if users are authorized to perform actions.
 * Evaluates all configured authorization rules before allowing an action.
 */
export class AuthorizationEngine {
  constructor(private strapiClient: IStrapiClient) {}
  
  /**
   * Get a nested value from an object using dot notation
   * 
   * @param obj - The object to get the value from
   * @param path - The path to the value (e.g., 'data.project')
   * @returns The value at the path, or undefined if not found
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  /**
   * Authorize a user to perform an action
   * 
   * Checks all authorization rules in sequence. If any rule fails,
   * the authorization fails immediately.
   * 
   * @param userId - The user ID attempting the action
   * @param rules - Array of authorization rules to check
   * @param params - Action parameters (may contain projectId, etc.)
   * @param context - Action execution context
   * @returns Authorization result with success status and reason for failure
   */
  async authorize(
    userId: string,
    rules: AuthRule[],
    params: Record<string, any>,
    context: ActionContext
  ): Promise<AuthorizationResult> {
    // Check each rule in sequence
    for (const rule of rules) {
      const result = await this.checkRule(rule, userId, params, context);
      if (!result.authorized) {
        return result;
      }
    }
    
    // All rules passed
    return { authorized: true };
  }
  
  /**
   * Check a single authorization rule
   * 
   * @param rule - The authorization rule to check
   * @param userId - The user ID attempting the action
   * @param params - Action parameters
   * @param context - Action execution context
   * @returns Authorization result
   */
  private async checkRule(
    rule: AuthRule,
    userId: string,
    params: Record<string, any>,
    context: ActionContext
  ): Promise<AuthorizationResult> {
    switch (rule.type) {
      case 'jwt':
        return this.checkJwt(rule, context);

      case 'self':
        return this.checkSelf(rule, userId, params);

      case 'projectMember':
        return await this.checkProjectMembership(rule, userId, params, context);

      case 'sheirutCustomer':
        return await this.checkSheirutCustomer(rule, userId, params, context);

      case 'sheirutpendRequester':
        return await this.checkSheirutpendRequester(rule, userId, params, context);

      case 'forumParticipant':
        return await this.checkForumParticipant(rule, userId, params, context);

      case 'or':
        return await this.checkOr(rule, userId, params, context);

      case 'role':
        return this.checkRole(rule, userId);

      case 'custom':
        return await this.checkCustom(rule, userId, params, context);

      default:
        return {
          authorized: false,
          reason: `Unknown authorization rule type: ${(rule as any).type}`
        };
    }
  }
  
  /**
   * Check JWT token validity
   * 
   * The JWT is already validated by the API endpoint before reaching here,
   * so this is primarily a sanity check.
   * 
   * @param rule - The JWT authorization rule
   * @param context - Action execution context
   * @returns Authorization result
   */
  private checkJwt(
    rule: AuthRule,
    context: ActionContext
  ): AuthorizationResult {
    // Check if JWT exists and is not empty
    if (!context.jwt || context.jwt.trim() === '') {
      return {
        authorized: false,
        reason: rule.errorMessage || 'Valid JWT token is required'
      };
    }
    
    // JWT is present and should have been validated by the API endpoint
    return { authorized: true };
  }
  
  /**
   * Check that the action targets the acting user themselves.
   *
   * For actions that take a target-user param (e.g. `userId`), this guarantees
   * the id the client supplied matches the authenticated user (context.userId,
   * which comes from the httpOnly cookie — never from the request body). It is
   * the declarative form of the "verify it's really them" ownership check for
   * self-scoped operations (editing one's own profile, voting as oneself, …).
   *
   * Server/bot calls (isSer) are unaffected: /api/action sets
   * context.userId = params.userId for those, so the two always match.
   *
   * @param rule - The self authorization rule (config.userIdParam, default 'userId')
   * @param userId - The acting user id (from context)
   * @param params - Action parameters (should contain the target user id)
   * @returns Authorization result
   */
  private checkSelf(
    rule: AuthRule,
    userId: string,
    params: Record<string, any>
  ): AuthorizationResult {
    const userIdParam = rule.config?.userIdParam || 'userId';
    const target = this.getNestedValue(params, userIdParam);

    // Require the param — a self-scoped action must name whom it acts on so the
    // match is explicit (deny-by-default, like the other entity checks).
    if (target === undefined || target === null || target === '') {
      return {
        authorized: false,
        reason: rule.errorMessage || `User ID parameter "${userIdParam}" is required for this action`
      };
    }

    if (String(target) !== String(userId)) {
      return {
        authorized: false,
        reason: rule.errorMessage || 'You can only perform this action on your own account'
      };
    }

    return { authorized: true };
  }

  /**
   * Check if user is a member of a project
   *
   * Uses the existing QIDS query 65checkProjectMembership to verify
   * that the user is a member of the specified project.
   * 
   * @param rule - The project membership authorization rule
   * @param userId - The user ID to check
   * @param params - Action parameters (should contain projectId)
   * @param context - Action execution context
   * @returns Authorization result
   */
  private async checkProjectMembership(
    rule: AuthRule,
    userId: string,
    params: Record<string, any>,
    context: ActionContext
  ): Promise<AuthorizationResult> {
    // Get project ID from parameters (supports nested paths like 'data.project')
    const projectIdParam = rule.config?.projectIdParam || 'projectId';
    const projectId = this.getNestedValue(params, projectIdParam);
    
    // Check if project ID is provided
    if (!projectId) {
      return {
        authorized: false,
        reason: rule.errorMessage || `Project ID parameter "${projectIdParam}" is required for this action`
      };
    }
    
    try {
      // Query Strapi to check project membership
      const result = await this.strapiClient.execute(
        '65checkProjectMembership',
        { uid: userId, projectId: String(projectId) },
        context.jwt,
        context.fetch
      );
      
      // Check if user is a member of the project
      // The query returns the project in projects_1s if the user is a member
      const projects = result?.data?.usersPermissionsUser?.data?.attributes?.projects_1s?.data || [];
      const isMember = projects.length > 0;
      
      if (!isMember) {
        return {
          authorized: false,
          reason: rule.errorMessage || 'User is not a member of this project'
        };
      }
      
      return { authorized: true };
    } catch (error) {
      // If the query fails, deny authorization
      console.error('Project membership check failed:', error);
      return {
        authorized: false,
        reason: rule.errorMessage || 'Failed to verify project membership'
      };
    }
  }
  
  /**
   * Check if user is the customer of a sheirut (has a sheirutpend for it)
   */
  private async checkSheirutCustomer(
    rule: AuthRule,
    userId: string,
    params: Record<string, any>,
    context: ActionContext
  ): Promise<AuthorizationResult> {
    const sheirutIdParam = rule.config?.sheirutIdParam || 'sheirutId';
    const sheirutId = this.getNestedValue(params, sheirutIdParam);

    if (!sheirutId) {
      return {
        authorized: false,
        reason: rule.errorMessage || `Sheirut ID parameter "${sheirutIdParam}" is required for this action`
      };
    }

    try {
      const result = await this.strapiClient.execute(
        '65checkSheirutCustomer',
        { uid: userId, sheirutId: String(sheirutId) },
        context.jwt,
        context.fetch
      );

      const pends = result?.data?.sheirutpends?.data || [];
      if (pends.length === 0) {
        return {
          authorized: false,
          reason: rule.errorMessage || 'User is not the customer of this sheirut'
        };
      }

      return { authorized: true };
    } catch (error) {
      console.error('Sheirut customer check failed:', error);
      return {
        authorized: false,
        reason: rule.errorMessage || 'Failed to verify sheirut customer status'
      };
    }
  }

  /**
   * Check if user is the requester (users_permissions_user) of a sheirutpend
   */
  private async checkSheirutpendRequester(
    rule: AuthRule,
    userId: string,
    params: Record<string, any>,
    context: ActionContext
  ): Promise<AuthorizationResult> {
    const sheirutpendIdParam = rule.config?.sheirutpendIdParam || 'sheirutpendId';
    const sheirutpendId = this.getNestedValue(params, sheirutpendIdParam);

    if (!sheirutpendId) {
      return {
        authorized: false,
        reason: rule.errorMessage || `Sheirutpend ID parameter "${sheirutpendIdParam}" is required`
      };
    }

    try {
      const result = await this.strapiClient.execute(
        '65checkSheirutpendRequester',
        { uid: userId, sheirutpendId: String(sheirutpendId) },
        context.jwt,
        context.fetch
      );

      const requesterId = result?.data?.sheirutpend?.data?.attributes?.users_permissions_user?.data?.id;
      if (!requesterId || String(requesterId) !== String(userId)) {
        return {
          authorized: false,
          reason: rule.errorMessage || 'User is not the requester of this sheirutpend'
        };
      }

      return { authorized: true };
    } catch (error) {
      console.error('Sheirutpend requester check failed:', error);
      return {
        authorized: false,
        reason: rule.errorMessage || 'Failed to verify sheirutpend requester'
      };
    }
  }

  /**
   * Check if user can access a forum according to the forum's owning relation.
   */
  private async checkForumParticipant(
    rule: AuthRule,
    userId: string,
    params: Record<string, any>,
    context: ActionContext
  ): Promise<AuthorizationResult> {
    const forumIdParam = rule.config?.forumIdParam || 'forumId';
    const forumId = this.getNestedValue(params, forumIdParam);

    if (!forumId) {
      return {
        authorized: false,
        reason: rule.errorMessage || `Forum ID parameter "${forumIdParam}" is required for this action`
      };
    }

    try {
      return await authorizeForumParticipant(
        this.strapiClient,
        userId,
        String(forumId),
        context
      );
    } catch (error) {
      console.error('Forum participant check failed:', error);
      return {
        authorized: false,
        reason: rule.errorMessage || 'Failed to verify forum access'
      };
    }
  }

  /**
   * Pass if ANY of the sub-rules passes (OR logic)
   */
  private async checkOr(
    rule: AuthRule,
    userId: string,
    params: Record<string, any>,
    context: ActionContext
  ): Promise<AuthorizationResult> {
    const subRules = rule.config?.rules;

    if (!subRules || subRules.length === 0) {
      return {
        authorized: false,
        reason: 'OR authorization rule has no sub-rules configured'
      };
    }

    const failures: string[] = [];
    for (const subRule of subRules) {
      const result = await this.checkRule(subRule, userId, params, context);
      if (result.authorized) {
        return { authorized: true };
      }
      failures.push(result.reason || 'Unauthorized');
    }

    return {
      authorized: false,
      reason: rule.errorMessage || failures.join(' | ')
    };
  }

  /**
   * Check if user has a required role.
   *
   * NOT IMPLEMENTED — and therefore FAIL-CLOSED. Role-to-Strapi mapping was
   * never wired, so this rule cannot make a trustworthy positive decision.
   * It previously returned `authorized: true` unconditionally, which is a
   * silent fail-open: any action that declared a `role` rule would be
   * effectively unguarded. Until a real implementation exists (query the
   * user's Strapi role, compare to requiredRole), the only safe answer is
   * to deny. No action currently uses this rule type.
   *
   * @param rule - The role authorization rule
   * @param userId - The user ID to check
   * @returns Authorization result (always denied)
   */
  private checkRole(
    rule: AuthRule,
    userId: string
  ): AuthorizationResult {
    const requiredRole = rule.config?.requiredRole;

    if (!requiredRole) {
      return {
        authorized: false,
        reason: 'Role authorization rule is missing required role configuration'
      };
    }

    console.error(
      `Role-based authorization is not implemented — denying by default. ` +
      `Required role: ${requiredRole}, User: ${userId}`
    );

    return {
      authorized: false,
      reason:
        rule.errorMessage ||
        'Role-based authorization is not implemented; this action is denied by default'
    };
  }
  
  /**
   * Execute a custom authorization function
   * 
   * Allows for complex authorization logic that doesn't fit into
   * the standard rule types.
   * 
   * @param rule - The custom authorization rule
   * @param userId - The user ID to check
   * @param params - Action parameters
   * @param context - Action execution context
   * @returns Authorization result
   */
  private async checkCustom(
    rule: AuthRule,
    userId: string,
    params: Record<string, any>,
    context: ActionContext
  ): Promise<AuthorizationResult> {
    const checkFunction = rule.config?.checkFunction;
    
    if (!checkFunction || typeof checkFunction !== 'function') {
      return {
        authorized: false,
        reason: 'Custom authorization rule is missing check function'
      };
    }
    
    try {
      // Execute the custom authorization function
      const result = await checkFunction(userId, params, context);
      
      // If the function doesn't return a proper result, deny authorization
      if (!result || typeof result.authorized !== 'boolean') {
        return {
          authorized: false,
          reason: 'Custom authorization function returned invalid result'
        };
      }
      
      return result;
    } catch (error) {
      // If the custom function throws an error, deny authorization
      console.error('Custom authorization function failed:', error);
      return {
        authorized: false,
        reason: rule.errorMessage || 'Custom authorization check failed'
      };
    }
  }
}
