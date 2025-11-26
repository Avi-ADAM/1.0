/**
 * Action Service
 * 
 * Main service that orchestrates the entire action flow:
 * 1. Retrieves action configuration
 * 2. Validates parameters
 * 3. Checks authorization
 * 4. Executes GraphQL operation
 * 5. Triggers notifications (async)
 * 6. Returns result with update strategy
 * 
 * Validates: Requirements 1.1, 1.4, 9.1, 9.2
 */

import type {
  ActionContext,
  ActionResult,
  ActionError as ActionErrorType
} from './types.js';
import { actionRegistry } from './registry.js';
import { ValidationEngine } from './ValidationEngine.js';
import { AuthorizationEngine } from './AuthorizationEngine.js';
import { StrapiClient } from './StrapiClient.js';
import { migrationMetrics } from '../metrics/MigrationMetrics.js';

// Import to trigger action registration
import './configs/index.js';

/**
 * Custom error class for action execution errors
 */
export class ActionError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ActionError';
  }
  
  /**
   * Convert to ActionErrorType for response
   */
  toErrorObject(): ActionErrorType {
    return {
      code: this.code,
      message: this.message,
      details: this.details
    };
  }
}

/**
 * Logger interface for dependency injection
 */
export interface ILogger {
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
  debug(message: string, data?: any): void;
}

/**
 * Default console logger implementation
 */
class ConsoleLogger implements ILogger {
  info(message: string, data?: any): void {
    console.log(`[INFO] ${message}`, data || '');
  }
  
  warn(message: string, data?: any): void {
    console.warn(`[WARN] ${message}`, data || '');
  }
  
  error(message: string, data?: any): void {
    console.error(`[ERROR] ${message}`, data || '');
  }
  
  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }
}

/**
 * Notification orchestrator interface for dependency injection
 */
export interface INotificationOrchestrator {
  notify(
    config: any,
    actionParams: Record<string, any>,
    actionResult: any,
    context: ActionContext
  ): Promise<void>;
}

/**
 * Action Service
 * 
 * Orchestrates the complete action execution flow with validation,
 * authorization, persistence, and notifications.
 */
export class ActionService {
  private logger: ILogger;
  
  constructor(
    private validator: ValidationEngine,
    private authorizer: AuthorizationEngine,
    private strapiClient: StrapiClient,
    private notifier?: INotificationOrchestrator,
    logger?: ILogger
  ) {
    this.logger = logger || new ConsoleLogger();
  }
  
  /**
   * Execute an action
   * 
   * This is the main entry point for action execution. It orchestrates
   * the entire flow from validation to notification.
   * 
   * @param actionKey - The unique identifier for the action
   * @param params - Parameters for the action
   * @param context - Execution context (user, JWT, language, etc.)
   * @returns Action result with success status and data or error
   */
  async executeAction(
    actionKey: string,
    params: Record<string, any>,
    context: ActionContext
  ): Promise<ActionResult> {
    const startTime = Date.now();
    
    // Log the action request
    this.logger.info('Action execution started', {
      actionKey,
      userId: context.userId,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Step 1: Get action configuration
      const config = actionRegistry.get(actionKey);
      if (!config) {
        throw new ActionError(
          'UNKNOWN_ACTION',
          `Action "${actionKey}" not found in registry`
        );
      }
      
      this.logger.debug('Action configuration retrieved', {
        actionKey,
        description: config.description
      });
      
      // Step 2: Validate parameters
      const validationResult = await this.validator.validate(
        params,
        config.paramSchema
      );
      
      if (!validationResult.valid) {
        throw new ActionError(
          'VALIDATION_FAILED',
          'Parameter validation failed',
          validationResult.errors
        );
      }
      
      this.logger.debug('Parameter validation passed', { actionKey });
      
      // Step 3: Check authorization
      const authResult = await this.authorizer.authorize(
        context.userId,
        config.authRules,
        params,
        context
      );
      
      if (!authResult.authorized) {
        throw new ActionError(
          'UNAUTHORIZED',
          authResult.reason || 'User is not authorized to perform this action'
        );
      }
      
      this.logger.debug('Authorization check passed', {
        actionKey,
        userId: context.userId
      });
      
      // Step 4: Execute GraphQL operation
      const strapiResult = await this.strapiClient.execute(
        config.graphqlOperation,
        params,
        context.jwt,
        context.fetch
      );
      
      this.logger.debug('Strapi operation completed', {
        actionKey,
        hasData: !!strapiResult.data
      });
      
      // Step 5: Trigger notifications (async, don't wait)
      if (config.notification && this.notifier) {
        // Fire and forget - notifications shouldn't block the response
        this.notifier.notify(
          config.notification,
          params,
          strapiResult,
          context
        ).catch(err => {
          // Log notification errors but don't fail the action
          this.logger.error('Notification error', {
            actionKey,
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined
          });
        });
        
        this.logger.debug('Notifications triggered', { actionKey });
      }
      
      // Calculate execution time
      const executionTime = Date.now() - startTime;
      
      // Record migration metrics
      migrationMetrics.record({
        system: 'action',
        actionKey,
        userId: context.userId,
        success: true,
        responseTime: executionTime
      });
      
      // Log successful completion
      this.logger.info('Action execution completed', {
        actionKey,
        userId: context.userId,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString()
      });
      
      // Step 6: Return result with update strategy
      return {
        success: true,
        data: strapiResult,
        updateStrategy: config.updateStrategy
      };
      
    } catch (error) {
      // Calculate execution time
      const executionTime = Date.now() - startTime;
      
      // Handle different error types
      if (error instanceof ActionError) {
        // Record migration metrics for failure
        migrationMetrics.record({
          system: 'action',
          actionKey,
          userId: context.userId,
          success: false,
          responseTime: executionTime,
          error: error.message
        });
        
        // Log action errors
        this.logger.error('Action execution failed', {
          actionKey,
          userId: context.userId,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          executionTime: `${executionTime}ms`,
          timestamp: new Date().toISOString()
        });
        
        return {
          success: false,
          error: error.toErrorObject()
        };
      }
      
      // Handle Strapi errors
      if (error && typeof error === 'object' && 'errors' in error) {
        // Record migration metrics for Strapi failure
        migrationMetrics.record({
          system: 'action',
          actionKey,
          userId: context.userId,
          success: false,
          responseTime: executionTime,
          error: 'STRAPI_ERROR'
        });
        
        // Extract detailed error information
        const strapiErrors = (error as any).errors || [];
        const firstError = strapiErrors[0] || {};
        
        this.logger.error('Strapi operation failed', {
          actionKey,
          userId: context.userId,
          errors: strapiErrors,
          queryId: firstError.extensions?.queryId,
          variables: firstError.extensions?.variables,
          responseBody: firstError.extensions?.responseBody,
          executionTime: `${executionTime}ms`,
          timestamp: new Date().toISOString()
        });
        
        return {
          success: false,
          error: {
            code: 'STRAPI_ERROR',
            message: 'Database operation failed',
            details: strapiErrors
          }
        };
      }
      
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      // Record migration metrics for unexpected failure
      migrationMetrics.record({
        system: 'action',
        actionKey,
        userId: context.userId,
        success: false,
        responseTime: executionTime,
        error: errorMessage
      });
      
      this.logger.error('Unexpected error during action execution', {
        actionKey,
        userId: context.userId,
        error: errorMessage,
        stack: errorStack,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        }
      };
    }
  }
}
