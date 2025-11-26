/**
 * Unit tests for ActionService
 * 
 * Tests the core action execution flow including validation,
 * authorization, Strapi operations, and error handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActionService, ActionError } from './ActionService.js';
import { ValidationEngine } from './ValidationEngine.js';
import { AuthorizationEngine } from './AuthorizationEngine.js';
import { StrapiClient } from './StrapiClient.js';
import { registerAction, clearRegistry } from './registry.js';
import type { ActionContext, ActionConfig } from './types.js';

// Mock logger to suppress console output during tests
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

// Mock notification orchestrator
const mockNotifier = {
  notify: vi.fn().mockResolvedValue(undefined)
};

describe('ActionService', () => {
  let actionService: ActionService;
  let validator: ValidationEngine;
  let authorizer: AuthorizationEngine;
  let strapiClient: StrapiClient;
  let testContext: ActionContext;
  
  beforeEach(() => {
    // Clear registry before each test
    clearRegistry();
    
    // Reset mocks
    vi.clearAllMocks();
    mockNotifier.notify.mockResolvedValue(undefined);
    
    // Create instances
    validator = new ValidationEngine();
    strapiClient = new StrapiClient();
    authorizer = new AuthorizationEngine(strapiClient);
    actionService = new ActionService(
      validator,
      authorizer,
      strapiClient,
      mockNotifier,
      mockLogger
    );
    
    // Test context
    testContext = {
      userId: 'user123',
      jwt: 'valid-jwt-token',
      lang: 'he',
      fetch: global.fetch
    };
  });
  
  describe('executeAction', () => {
    it('should execute a valid action successfully', async () => {
      // Register a test action
      const testAction: ActionConfig = {
        key: 'testAction',
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {
          name: { type: 'string', required: true }
        },
        authRules: [{ type: 'jwt' }]
      };
      registerAction(testAction);
      
      // Mock Strapi response
      vi.spyOn(strapiClient, 'execute').mockResolvedValue({
        data: { result: 'success' }
      });
      
      // Execute action
      const result = await actionService.executeAction(
        'testAction',
        { name: 'test' },
        testContext
      );
      
      // Verify result
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: { result: 'success' } });
      expect(result.error).toBeUndefined();
      
      // Verify Strapi was called
      expect(strapiClient.execute).toHaveBeenCalledWith(
        '1testQuery',
        { name: 'test' },
        'valid-jwt-token',
        expect.any(Function) // fetch function
      );
      
      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Action execution started',
        expect.objectContaining({
          actionKey: 'testAction',
          userId: 'user123'
        })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Action execution completed',
        expect.objectContaining({
          actionKey: 'testAction',
          userId: 'user123'
        })
      );
    });
    
    it('should return error for unknown action', async () => {
      const result = await actionService.executeAction(
        'unknownAction',
        {},
        testContext
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: 'UNKNOWN_ACTION',
        message: 'Action "unknownAction" not found in registry',
        details: undefined
      });
      
      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Action execution failed',
        expect.objectContaining({
          errorCode: 'UNKNOWN_ACTION'
        })
      );
    });
    
    it('should return error for validation failure', async () => {
      // Register action with required parameter
      const testAction: ActionConfig = {
        key: 'testAction',
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {
          name: { type: 'string', required: true },
          age: { type: 'number', required: true }
        },
        authRules: [{ type: 'jwt' }]
      };
      registerAction(testAction);
      
      // Execute with missing parameter
      const result = await actionService.executeAction(
        'testAction',
        { name: 'test' }, // missing 'age'
        testContext
      );
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_FAILED');
      expect(result.error?.message).toBe('Parameter validation failed');
      expect(result.error?.details).toContain('Missing required parameter: age');
    });
    
    it('should return error for authorization failure', async () => {
      // Register action with project membership requirement
      const testAction: ActionConfig = {
        key: 'testAction',
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {
          projectId: { type: 'string', required: true }
        },
        authRules: [
          { type: 'jwt' },
          { type: 'projectMember', config: { projectIdParam: 'projectId' } }
        ]
      };
      registerAction(testAction);
      
      // Mock Strapi to return no project membership
      vi.spyOn(strapiClient, 'execute').mockResolvedValue({
        data: {
          usersPermissionsUser: {
            data: {
              attributes: {
                projects_1s: { data: [] } // No projects
              }
            }
          }
        }
      });
      
      // Execute action
      const result = await actionService.executeAction(
        'testAction',
        { projectId: 'proj123' },
        testContext
      );
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
      expect(result.error?.message).toContain('not a member');
    });
    
    it('should trigger notifications for actions with notification config', async () => {
      // Register action with notifications
      const testAction: ActionConfig = {
        key: 'testAction',
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {
          name: { type: 'string', required: true }
        },
        authRules: [{ type: 'jwt' }],
        notification: {
          recipients: {
            type: 'projectMembers',
            config: { projectIdParam: 'projectId' }
          },
          templates: {
            title: { he: 'כותרת', en: 'Title' },
            body: { he: 'תוכן', en: 'Content' }
          },
          channels: ['socket', 'email']
        }
      };
      registerAction(testAction);
      
      // Mock Strapi response
      const strapiResult = { data: { result: 'success' } };
      vi.spyOn(strapiClient, 'execute').mockResolvedValue(strapiResult);
      
      // Execute action
      const result = await actionService.executeAction(
        'testAction',
        { name: 'test', projectId: 'proj123' },
        testContext
      );
      
      expect(result.success).toBe(true);
      
      // Wait a bit for async notification
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify notification was triggered
      expect(mockNotifier.notify).toHaveBeenCalledWith(
        testAction.notification,
        { name: 'test', projectId: 'proj123' },
        strapiResult,
        testContext
      );
    });
    
    it('should not fail action if notification fails', async () => {
      // Register action with notifications
      const testAction: ActionConfig = {
        key: 'testAction',
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {
          name: { type: 'string', required: true }
        },
        authRules: [{ type: 'jwt' }],
        notification: {
          recipients: {
            type: 'projectMembers',
            config: { projectIdParam: 'projectId' }
          },
          templates: {
            title: { he: 'כותרת', en: 'Title' },
            body: { he: 'תוכן', en: 'Content' }
          },
          channels: ['socket']
        }
      };
      registerAction(testAction);
      
      // Mock Strapi response
      vi.spyOn(strapiClient, 'execute').mockResolvedValue({
        data: { result: 'success' }
      });
      
      // Mock notification failure
      mockNotifier.notify.mockRejectedValue(new Error('Notification failed'));
      
      // Execute action
      const result = await actionService.executeAction(
        'testAction',
        { name: 'test', projectId: 'proj123' },
        testContext
      );
      
      // Action should still succeed
      expect(result.success).toBe(true);
      
      // Wait for async notification error
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Notification error',
        expect.objectContaining({
          actionKey: 'testAction',
          error: 'Notification failed'
        })
      );
    });
    
    it('should return update strategy in result', async () => {
      // Register action with update strategy
      const testAction: ActionConfig = {
        key: 'testAction',
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {
          name: { type: 'string', required: true }
        },
        authRules: [{ type: 'jwt' }],
        updateStrategy: {
          type: 'partialUpdate',
          config: { dataKeys: ['arr1', 'user'] }
        }
      };
      registerAction(testAction);
      
      // Mock Strapi response
      vi.spyOn(strapiClient, 'execute').mockResolvedValue({
        data: { result: 'success' }
      });
      
      // Execute action
      const result = await actionService.executeAction(
        'testAction',
        { name: 'test' },
        testContext
      );
      
      expect(result.success).toBe(true);
      expect(result.updateStrategy).toEqual({
        type: 'partialUpdate',
        config: { dataKeys: ['arr1', 'user'] }
      });
    });
    
    it('should handle Strapi errors gracefully', async () => {
      // Register action
      const testAction: ActionConfig = {
        key: 'testAction',
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {
          name: { type: 'string', required: true }
        },
        authRules: [{ type: 'jwt' }]
      };
      registerAction(testAction);
      
      // Mock Strapi error
      const strapiError = {
        errors: [
          { message: 'Database connection failed', extensions: { code: 'DB_ERROR' } }
        ]
      };
      vi.spyOn(strapiClient, 'execute').mockRejectedValue(strapiError);
      
      // Execute action
      const result = await actionService.executeAction(
        'testAction',
        { name: 'test' },
        testContext
      );
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('STRAPI_ERROR');
      expect(result.error?.message).toBe('Database operation failed');
      expect(result.error?.details).toEqual(strapiError.errors);
    });
    
    it('should handle unexpected errors gracefully', async () => {
      // Register action
      const testAction: ActionConfig = {
        key: 'testAction',
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {
          name: { type: 'string', required: true }
        },
        authRules: [{ type: 'jwt' }]
      };
      registerAction(testAction);
      
      // Mock unexpected error
      vi.spyOn(strapiClient, 'execute').mockRejectedValue(
        new Error('Unexpected error')
      );
      
      // Execute action
      const result = await actionService.executeAction(
        'testAction',
        { name: 'test' },
        testContext
      );
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INTERNAL_ERROR');
      expect(result.error?.message).toBe('An unexpected error occurred');
    });
    
    it('should log execution time for successful actions', async () => {
      // Register action
      const testAction: ActionConfig = {
        key: 'testAction',
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {},
        authRules: [{ type: 'jwt' }]
      };
      registerAction(testAction);
      
      // Mock Strapi response
      vi.spyOn(strapiClient, 'execute').mockResolvedValue({
        data: { result: 'success' }
      });
      
      // Execute action
      await actionService.executeAction('testAction', {}, testContext);
      
      // Verify execution time was logged
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Action execution completed',
        expect.objectContaining({
          executionTime: expect.stringMatching(/\d+ms/)
        })
      );
    });
    
    it('should log execution time for failed actions', async () => {
      // Execute unknown action
      await actionService.executeAction('unknownAction', {}, testContext);
      
      // Verify execution time was logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Action execution failed',
        expect.objectContaining({
          executionTime: expect.stringMatching(/\d+ms/)
        })
      );
    });
  });
  
  describe('ActionError', () => {
    it('should create error with code and message', () => {
      const error = new ActionError('TEST_ERROR', 'Test error message');
      
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('ActionError');
    });
    
    it('should include details if provided', () => {
      const details = { field: 'name', reason: 'invalid' };
      const error = new ActionError('TEST_ERROR', 'Test error', details);
      
      expect(error.details).toEqual(details);
    });
    
    it('should convert to error object', () => {
      const error = new ActionError('TEST_ERROR', 'Test error', { extra: 'data' });
      const errorObj = error.toErrorObject();
      
      expect(errorObj).toEqual({
        code: 'TEST_ERROR',
        message: 'Test error',
        details: { extra: 'data' }
      });
    });
  });
});
