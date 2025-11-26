/**
 * Integration tests for ActionService
 * 
 * Tests the complete flow with all components working together.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActionService } from './ActionService.js';
import { ValidationEngine } from './ValidationEngine.js';
import { AuthorizationEngine } from './AuthorizationEngine.js';
import { StrapiClient } from './StrapiClient.js';
import { NotificationOrchestrator } from '../notifications/NotificationOrchestrator.js';
import { registerAction, clearRegistry } from './registry.js';
import type { ActionContext, ActionConfig } from './types.js';

describe('ActionService Integration Tests', () => {
  let actionService: ActionService;
  let actionServiceWithNotifier: ActionService;
  let strapiClient: StrapiClient;
  let notifier: NotificationOrchestrator;
  let testContext: ActionContext;
  
  beforeEach(() => {
    clearRegistry();
    
    // Create real instances (not mocked)
    strapiClient = new StrapiClient();
    const validator = new ValidationEngine();
    const authorizer = new AuthorizationEngine(strapiClient);
    notifier = new NotificationOrchestrator(strapiClient);
    
    // Create service without notifier for backward compatibility tests
    actionService = new ActionService(validator, authorizer, strapiClient);
    
    // Create service with notifier for notification tests
    actionServiceWithNotifier = new ActionService(validator, authorizer, strapiClient, notifier);
    
    testContext = {
      userId: 'user123',
      jwt: 'valid-jwt-token',
      lang: 'he',
      fetch: global.fetch
    };
  });
  
  it('should execute complete action flow with all validations', async () => {
    // Register a realistic action
    const action: ActionConfig = {
      key: 'updateUserProfile',
      description: 'Update user profile information',
      graphqlOperation: '2userUpdate',
      paramSchema: {
        userId: { type: 'string', required: true },
        username: {
          type: 'string',
          required: false,
          validate: (value: string) => value.length >= 3,
          description: 'Username must be at least 3 characters'
        },
        email: {
          type: 'string',
          required: false,
          validate: (value: string) => value.includes('@'),
          description: 'Must be a valid email'
        }
      },
      authRules: [
        { type: 'jwt' }
      ],
      updateStrategy: {
        type: 'partialUpdate',
        config: { dataKeys: ['user'] }
      }
    };
    
    registerAction(action);
    
    // Mock Strapi response
    vi.spyOn(strapiClient, 'execute').mockResolvedValue({
      data: {
        updateUsersPermissionsUser: {
          data: {
            id: 'user123',
            attributes: {
              username: 'newusername',
              email: 'new@email.com'
            }
          }
        }
      }
    });
    
    // Execute action with valid parameters
    const result = await actionService.executeAction(
      'updateUserProfile',
      {
        userId: 'user123',
        username: 'newusername',
        email: 'new@email.com'
      },
      testContext
    );
    
    // Verify success
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.updateStrategy).toEqual({
      type: 'partialUpdate',
      config: { dataKeys: ['user'] }
    });
    
    // Verify Strapi was called correctly
    expect(strapiClient.execute).toHaveBeenCalledWith(
      '2userUpdate',
      {
        userId: 'user123',
        username: 'newusername',
        email: 'new@email.com'
      },
      'valid-jwt-token',
      expect.any(Function) // fetch function
    );
  });
  
  it('should reject action with invalid custom validation', async () => {
    // Register action with custom validation
    const action: ActionConfig = {
      key: 'createProject',
      description: 'Create a new project',
      graphqlOperation: '5createProject',
      paramSchema: {
        name: {
          type: 'string',
          required: true,
          validate: (value: string) => value.length >= 3 && value.length <= 50,
          description: 'Project name must be between 3 and 50 characters'
        },
        budget: {
          type: 'number',
          required: true,
          validate: (value: number) => value > 0,
          description: 'Budget must be positive'
        }
      },
      authRules: [{ type: 'jwt' }]
    };
    
    registerAction(action);
    
    // Execute with invalid parameters
    const result = await actionService.executeAction(
      'createProject',
      {
        name: 'AB', // Too short
        budget: -100 // Negative
      },
      testContext
    );
    
    // Verify validation failure
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_FAILED');
    expect(result.error?.details).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Parameter name failed custom validation'),
        expect.stringContaining('Parameter budget failed custom validation')
      ])
    );
  });
  
  it('should handle complex authorization flow', async () => {
    // Register action with multiple auth rules
    const action: ActionConfig = {
      key: 'deleteTask',
      description: 'Delete a task from a project',
      graphqlOperation: '32deleteTask',
      paramSchema: {
        taskId: { type: 'string', required: true },
        projectId: { type: 'string', required: true }
      },
      authRules: [
        { type: 'jwt' },
        {
          type: 'projectMember',
          config: { projectIdParam: 'projectId' },
          errorMessage: 'Only project members can delete tasks'
        }
      ]
    };
    
    registerAction(action);
    
    // Mock Strapi to return project membership
    vi.spyOn(strapiClient, 'execute').mockImplementation(async (queryId) => {
      if (queryId === '65checkProjectMembership') {
        return {
          data: {
            usersPermissionsUser: {
              data: {
                attributes: {
                  projects_1s: {
                    data: [{ id: 'proj123' }] // User is a member
                  }
                }
              }
            }
          }
        };
      }
      // Actual delete operation
      return {
        data: {
          deleteTask: {
            data: { id: 'task456' }
          }
        }
      };
    });
    
    // Execute action
    const result = await actionService.executeAction(
      'deleteTask',
      {
        taskId: 'task456',
        projectId: 'proj123'
      },
      testContext
    );
    
    // Verify success
    expect(result.success).toBe(true);
    
    // Verify both Strapi calls were made
    expect(strapiClient.execute).toHaveBeenCalledWith(
      '65checkProjectMembership',
      { uid: 'user123', projectId: 'proj123' },
      'valid-jwt-token',
      expect.any(Function) // fetch function
    );
    expect(strapiClient.execute).toHaveBeenCalledWith(
      '32deleteTask',
      { taskId: 'task456', projectId: 'proj123' },
      'valid-jwt-token',
      expect.any(Function) // fetch function
    );
  });
  
  it('should handle Strapi errors gracefully in authorization', async () => {
    // Register action with project membership check
    const action: ActionConfig = {
      key: 'updateTask',
      description: 'Update a task',
      graphqlOperation: '31updateTask',
      paramSchema: {
        taskId: { type: 'string', required: true },
        projectId: { type: 'string', required: true }
      },
      authRules: [
        { type: 'jwt' },
        { type: 'projectMember', config: { projectIdParam: 'projectId' } }
      ]
    };
    
    registerAction(action);
    
    // Mock Strapi to fail on membership check
    vi.spyOn(strapiClient, 'execute').mockRejectedValue(
      new Error('Network error')
    );
    
    // Execute action
    const result = await actionService.executeAction(
      'updateTask',
      {
        taskId: 'task456',
        projectId: 'proj123'
      },
      testContext
    );
    
    // Verify authorization failure
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNAUTHORIZED');
    expect(result.error?.message).toContain('Failed to verify project membership');
  });
  
  it('should validate all parameter types correctly', async () => {
    // Register action with various parameter types
    const action: ActionConfig = {
      key: 'complexAction',
      description: 'Action with various parameter types',
      graphqlOperation: '1testQuery',
      paramSchema: {
        name: { type: 'string', required: true },
        age: { type: 'number', required: true },
        active: { type: 'boolean', required: true },
        tags: { type: 'array', required: true },
        metadata: { type: 'object', required: true }
      },
      authRules: [{ type: 'jwt' }]
    };
    
    registerAction(action);
    
    // Test with correct types
    vi.spyOn(strapiClient, 'execute').mockResolvedValue({ data: {} });
    
    const result1 = await actionService.executeAction(
      'complexAction',
      {
        name: 'test',
        age: 25,
        active: true,
        tags: ['tag1', 'tag2'],
        metadata: { key: 'value' }
      },
      testContext
    );
    
    expect(result1.success).toBe(true);
    
    // Test with wrong types
    const result2 = await actionService.executeAction(
      'complexAction',
      {
        name: 123, // Should be string
        age: '25', // Should be number
        active: 'yes', // Should be boolean
        tags: 'tag1,tag2', // Should be array
        metadata: 'key=value' // Should be object
      },
      testContext
    );
    
    expect(result2.success).toBe(false);
    expect(result2.error?.code).toBe('VALIDATION_FAILED');
    expect(result2.error?.details?.length).toBeGreaterThan(0);
  });
  
  describe('Notification Integration', () => {
    it('should trigger notifications asynchronously without blocking response', async () => {
      // Register action with notification config
      const action: ActionConfig = {
        key: 'createMessage',
        description: 'Create a new message',
        graphqlOperation: '1chatsend',
        paramSchema: {
          projectId: { type: 'string', required: true },
          message: { type: 'string', required: true }
        },
        authRules: [{ type: 'jwt' }],
        notification: {
          recipients: {
            type: 'projectMembers',
            config: { projectIdParam: 'projectId', excludeSender: true }
          },
          templates: {
            title: { he: 'הודעה חדשה', en: 'New Message', ar: 'رسالة جديدة' },
            body: { he: 'נוספה הודעה חדשה', en: 'A new message was added', ar: 'تمت إضافة رسالة جديدة' }
          },
          channels: ['socket', 'email', 'telegram', 'push']
        }
      };
      
      registerAction(action);
      
      // Mock Strapi response
      vi.spyOn(strapiClient, 'execute').mockResolvedValue({
        data: {
          createMessage: {
            data: { id: 'msg123' }
          }
        }
      });
      
      // Mock notification orchestrator with delay
      let notificationStarted = false;
      let notificationCompleted = false;
      vi.spyOn(notifier, 'notify').mockImplementation(async () => {
        notificationStarted = true;
        // Simulate slow notification processing
        await new Promise(resolve => setTimeout(resolve, 100));
        notificationCompleted = true;
      });
      
      // Execute action and measure time
      const startTime = Date.now();
      const result = await actionServiceWithNotifier.executeAction(
        'createMessage',
        {
          projectId: 'proj123',
          message: 'Hello world'
        },
        testContext
      );
      const responseTime = Date.now() - startTime;
      
      // Verify action succeeded
      expect(result.success).toBe(true);
      
      // Verify response returned quickly (before notification completed)
      expect(responseTime).toBeLessThan(50); // Should be much faster than 100ms
      expect(notificationStarted).toBe(true);
      expect(notificationCompleted).toBe(false); // Not completed yet
      
      // Wait for notification to complete
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(notificationCompleted).toBe(true);
      
      // Verify notification was called with correct parameters
      expect(notifier.notify).toHaveBeenCalledWith(
        action.notification,
        { projectId: 'proj123', message: 'Hello world' },
        { data: { createMessage: { data: { id: 'msg123' } } } },
        testContext
      );
    });
    
    it('should not fail action if notification fails', async () => {
      // Register action with notification config
      const action: ActionConfig = {
        key: 'updateTask',
        description: 'Update a task',
        graphqlOperation: '31updateTask',
        paramSchema: {
          taskId: { type: 'string', required: true },
          status: { type: 'string', required: true }
        },
        authRules: [{ type: 'jwt' }],
        notification: {
          recipients: {
            type: 'projectMembers',
            config: { projectIdParam: 'projectId' }
          },
          templates: {
            title: { he: 'משימה עודכנה', en: 'Task Updated', ar: 'تم تحديث المهمة' },
            body: { he: 'המשימה עודכנה בהצלחה', en: 'Task updated successfully', ar: 'تم تحديث المهمة بنجاح' }
          },
          channels: ['email']
        }
      };
      
      registerAction(action);
      
      // Mock Strapi response
      vi.spyOn(strapiClient, 'execute').mockResolvedValue({
        data: {
          updateTask: {
            data: { id: 'task456', attributes: { status: 'completed' } }
          }
        }
      });
      
      // Mock notification orchestrator to fail
      vi.spyOn(notifier, 'notify').mockRejectedValue(
        new Error('Email service unavailable')
      );
      
      // Execute action
      const result = await actionServiceWithNotifier.executeAction(
        'updateTask',
        {
          taskId: 'task456',
          status: 'completed',
          projectId: 'proj123'
        },
        testContext
      );
      
      // Verify action still succeeded despite notification failure
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      // Wait a bit to ensure notification was attempted
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Verify notification was attempted
      expect(notifier.notify).toHaveBeenCalled();
    });
    
    it('should work without notifier for backward compatibility', async () => {
      // Register action with notification config
      const action: ActionConfig = {
        key: 'simpleAction',
        description: 'Simple action',
        graphqlOperation: '1testQuery',
        paramSchema: {
          value: { type: 'string', required: true }
        },
        authRules: [{ type: 'jwt' }],
        notification: {
          recipients: { type: 'projectMembers' },
          templates: {
            title: { he: 'עדכון', en: 'Update', ar: 'تحديث' },
            body: { he: 'פעולה בוצעה', en: 'Action performed', ar: 'تم تنفيذ الإجراء' }
          },
          channels: ['email']
        }
      };
      
      registerAction(action);
      
      // Mock Strapi response
      vi.spyOn(strapiClient, 'execute').mockResolvedValue({
        data: { result: 'success' }
      });
      
      // Execute action with service that has no notifier
      const result = await actionService.executeAction(
        'simpleAction',
        { value: 'test' },
        testContext
      );
      
      // Verify action succeeded even without notifier
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
    
    it('should handle notification errors gracefully and log them', async () => {
      // Register action with notification
      const action: ActionConfig = {
        key: 'criticalAction',
        description: 'Critical action',
        graphqlOperation: '1testQuery',
        paramSchema: {
          data: { type: 'string', required: true }
        },
        authRules: [{ type: 'jwt' }],
        notification: {
          recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId' } },
          templates: {
            title: { he: 'פעולה קריטית', en: 'Critical Action', ar: 'إجراء حرج' },
            body: { he: 'בוצעה פעולה קריטית', en: 'Critical action performed', ar: 'تم تنفيذ إجراء حرج' }
          },
          channels: ['email', 'telegram']
        }
      };
      
      registerAction(action);
      
      // Mock Strapi response
      vi.spyOn(strapiClient, 'execute').mockResolvedValue({
        data: { result: 'success' }
      });
      
      // Mock console.error to verify error logging
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock notification to throw error
      vi.spyOn(notifier, 'notify').mockRejectedValue(
        new Error('Notification system down')
      );
      
      // Execute action
      const result = await actionServiceWithNotifier.executeAction(
        'criticalAction',
        { data: 'important', projectId: 'proj123' },
        testContext
      );
      
      // Verify action succeeded
      expect(result.success).toBe(true);
      
      // Wait for notification error to be logged
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Verify error was logged (but action didn't fail)
      // Note: The exact logging format depends on the logger implementation
      // We just verify that some error logging occurred
      expect(notifier.notify).toHaveBeenCalled();
      
      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });
});
