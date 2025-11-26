/**
 * Integration Tests for updateTask Action
 * 
 * Tests the complete flow of the updateTask action from
 * API endpoint through to Strapi execution.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActionService } from '../ActionService.js';
import { ValidationEngine } from '../ValidationEngine.js';
import { AuthorizationEngine } from '../AuthorizationEngine.js';
import { StrapiClient } from '../StrapiClient.js';
import { NotificationOrchestrator } from '$lib/server/notifications/NotificationOrchestrator.js';
import { clearRegistry, registerAction } from '../registry.js';
import { updateTaskAction } from './updateTask.js';
import type { ActionContext } from '../types.js';

describe('updateTask Action Integration', () => {
  let actionService: ActionService;
  let mockStrapiClient: StrapiClient;
  let mockNotifier: NotificationOrchestrator;
  let testContext: ActionContext;

  beforeEach(() => {
    // Clear and re-register action
    clearRegistry();
    registerAction(updateTaskAction);

    // Create mock Strapi client
    mockStrapiClient = {
      execute: vi.fn()
    } as any;

    // Create mock notification orchestrator
    mockNotifier = {
      notify: vi.fn().mockResolvedValue(undefined)
    } as any;

    // Create action service
    const validator = new ValidationEngine();
    const authorizer = new AuthorizationEngine(mockStrapiClient);

    actionService = new ActionService(
      validator,
      authorizer,
      mockStrapiClient,
      mockNotifier
    );

    // Create test context
    testContext = {
      userId: '123',
      jwt: 'test-jwt-token',
      lang: 'he',
      fetch: global.fetch
    };
  });

  it('should execute updateTask action successfully', async () => {
    // Mock Strapi responses
    (mockStrapiClient.execute as any).mockImplementation((queryId: string) => {
      if (queryId === '65checkProjectMembership') {
        // User is a project member
        return Promise.resolve({
          data: {
            usersPermissionsUser: {
              data: {
                attributes: {
                  projects_1s: {
                    data: [{ id: '456' }]
                  }
                }
              }
            }
          }
        });
      } else if (queryId === '31updateTask') {
        // Task update successful
        return Promise.resolve({
          data: {
            updateAct: {
              data: {
                id: '789',
                attributes: {
                  shem: 'Updated Task',
                  my: {
                    data: [{ id: '123' }]
                  }
                }
              }
            }
          }
        });
      }
      return Promise.resolve({});
    });

    // Execute action
    const result = await actionService.executeAction(
      'updateTask',
      {
        id: '789',
        projectId: '456',
        myIshur: true,
        isAssigned: true
      },
      testContext
    );

    // Verify result
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.updateStrategy).toBeDefined();
    expect(result.updateStrategy?.type).toBe('partialUpdate');

    // Verify Strapi was called correctly
    expect(mockStrapiClient.execute).toHaveBeenCalledWith(
      '65checkProjectMembership',
      expect.objectContaining({
        uid: '123',
        projectId: '456'
      }),
      'test-jwt-token',
      expect.any(Function) // fetch function
    );

    expect(mockStrapiClient.execute).toHaveBeenCalledWith(
      '31updateTask',
      expect.objectContaining({
        id: '789',
        projectId: '456',
        myIshur: true,
        isAssigned: true
      }),
      'test-jwt-token',
      expect.any(Function) // fetch function
    );

    // Verify notifications were triggered
    expect(mockNotifier.notify).toHaveBeenCalled();
  });

  it('should reject action with missing required parameters', async () => {
    // Execute action without required parameters
    const result = await actionService.executeAction(
      'updateTask',
      {
        // Missing 'id' and 'projectId'
        myIshur: true
      },
      testContext
    );

    // Verify validation error
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_FAILED');
    expect(result.error?.details).toBeDefined();
    expect(result.error?.details).toContain('Missing required parameter: id');
    expect(result.error?.details).toContain('Missing required parameter: projectId');

    // Verify Strapi was not called
    expect(mockStrapiClient.execute).not.toHaveBeenCalledWith(
      '31updateTask',
      expect.anything(),
      expect.anything()
    );
  });

  it('should reject action when user is not a project member', async () => {
    // Mock Strapi to return no project membership
    (mockStrapiClient.execute as any).mockImplementation((queryId: string) => {
      if (queryId === '65checkProjectMembership') {
        return Promise.resolve({
          data: {
            usersPermissionsUser: {
              data: {
                attributes: {
                  projects_1s: {
                    data: [] // No projects
                  }
                }
              }
            }
          }
        });
      }
      return Promise.resolve({});
    });

    // Execute action
    const result = await actionService.executeAction(
      'updateTask',
      {
        id: '789',
        projectId: '456',
        myIshur: true
      },
      testContext
    );

    // Verify authorization error
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNAUTHORIZED');

    // Verify task update was not called
    expect(mockStrapiClient.execute).not.toHaveBeenCalledWith(
      '31updateTask',
      expect.anything(),
      expect.anything()
    );

    // Verify notifications were not triggered
    expect(mockNotifier.notify).not.toHaveBeenCalled();
  });

  it('should handle Strapi errors gracefully', async () => {
    // Mock Strapi to return authorization success but task update failure
    (mockStrapiClient.execute as any).mockImplementation((queryId: string) => {
      if (queryId === '65checkProjectMembership') {
        return Promise.resolve({
          data: {
            usersPermissionsUser: {
              data: {
                attributes: {
                  projects_1s: {
                    data: [{ id: '456' }]
                  }
                }
              }
            }
          }
        });
      } else if (queryId === '31updateTask') {
        // Simulate Strapi error with errors property
        return Promise.reject({
          errors: [{ message: 'Task not found' }]
        });
      }
      return Promise.resolve({});
    });

    // Execute action
    const result = await actionService.executeAction(
      'updateTask',
      {
        id: '789',
        projectId: '456',
        myIshur: true
      },
      testContext
    );

    // Verify error handling
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('STRAPI_ERROR');

    // Verify notifications were not triggered
    expect(mockNotifier.notify).not.toHaveBeenCalled();
  });

  it('should validate parameter types correctly', async () => {
    // Execute action with invalid parameter types
    const result = await actionService.executeAction(
      'updateTask',
      {
        id: '789',
        projectId: '456',
        myIshur: 'not-a-boolean', // Should be boolean
        uid: 'not-an-array' // Should be array
      },
      testContext
    );

    // Verify validation error
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_FAILED');

    // Verify Strapi was not called
    expect(mockStrapiClient.execute).not.toHaveBeenCalledWith(
      '31updateTask',
      expect.anything(),
      expect.anything()
    );
  });

  it('should pass all optional parameters to Strapi', async () => {
    // Mock Strapi responses
    (mockStrapiClient.execute as any).mockImplementation((queryId: string) => {
      if (queryId === '65checkProjectMembership') {
        return Promise.resolve({
          data: {
            usersPermissionsUser: {
              data: {
                attributes: {
                  projects_1s: {
                    data: [{ id: '456' }]
                  }
                }
              }
            }
          }
        });
      } else if (queryId === '31updateTask') {
        return Promise.resolve({
          data: {
            updateAct: {
              data: { id: '789' }
            }
          }
        });
      }
      return Promise.resolve({});
    });

    // Execute action with all optional parameters
    const params = {
      id: '789',
      projectId: '456',
      myIshur: true,
      valiIshur: false,
      isAssigned: true,
      uid: ['123', '456'],
      mesimabetahaliches: ['111', '222']
    };

    const result = await actionService.executeAction(
      'updateTask',
      params,
      testContext
    );

    // Verify success
    expect(result.success).toBe(true);

    // Verify all parameters were passed to Strapi
    expect(mockStrapiClient.execute).toHaveBeenCalledWith(
      '31updateTask',
      expect.objectContaining(params),
      'test-jwt-token',
      expect.any(Function) // fetch function
    );
  });
});
