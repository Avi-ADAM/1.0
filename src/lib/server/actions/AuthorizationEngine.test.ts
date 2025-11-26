/**
 * Unit tests for AuthorizationEngine
 * 
 * Tests JWT validation, project membership checks, role-based authorization,
 * and custom authorization functions.
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthorizationEngine, type IStrapiClient } from './AuthorizationEngine.js';
import type { AuthRule, ActionContext } from './types.js';

describe('AuthorizationEngine', () => {
  let authEngine: AuthorizationEngine;
  let mockStrapiClient: IStrapiClient;
  let testContext: ActionContext;
  
  beforeEach(() => {
    // Create mock Strapi client
    mockStrapiClient = {
      execute: vi.fn()
    };
    
    authEngine = new AuthorizationEngine(mockStrapiClient);
    
    // Create test context
    testContext = {
      userId: 'user123',
      jwt: 'valid-jwt-token',
      lang: 'he',
      fetch: global.fetch
    };
  });
  
  describe('JWT Validation', () => {
    it('should pass when JWT is present', async () => {
      const rules: AuthRule[] = [
        { type: 'jwt' }
      ];
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        {},
        testContext
      );
      
      expect(result.authorized).toBe(true);
      expect(result.reason).toBeUndefined();
    });
    
    it('should fail when JWT is missing', async () => {
      const rules: AuthRule[] = [
        { type: 'jwt' }
      ];
      
      const contextWithoutJwt = { ...testContext, jwt: '' };
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        {},
        contextWithoutJwt
      );
      
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('Valid JWT token is required');
    });
    
    it('should use custom error message when provided', async () => {
      const rules: AuthRule[] = [
        { 
          type: 'jwt',
          errorMessage: 'You must be logged in to perform this action'
        }
      ];
      
      const contextWithoutJwt = { ...testContext, jwt: '' };
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        {},
        contextWithoutJwt
      );
      
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('You must be logged in to perform this action');
    });
  });
  
  describe('Project Membership Check', () => {
    it('should pass when user is a project member', async () => {
      const rules: AuthRule[] = [
        { type: 'projectMember' }
      ];
      
      const params = {
        projectId: 'project456'
      };
      
      // Mock successful membership check
      vi.mocked(mockStrapiClient.execute).mockResolvedValue({
        data: {
          usersPermissionsUser: {
            data: {
              attributes: {
                projects_1s: {
                  data: [
                    {
                      id: 'project456',
                      attributes: {
                        projectName: 'Test Project'
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      });
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        params,
        testContext
      );
      
      expect(result.authorized).toBe(true);
      expect(mockStrapiClient.execute).toHaveBeenCalledWith(
        '65checkProjectMembership',
        { uid: 'user123', projectId: 'project456' },
        'valid-jwt-token',
        expect.any(Function) // fetch function
      );
    });
    
    it('should fail when user is not a project member', async () => {
      const rules: AuthRule[] = [
        { type: 'projectMember' }
      ];
      
      const params = {
        projectId: 'project456'
      };
      
      // Mock failed membership check (empty projects array)
      vi.mocked(mockStrapiClient.execute).mockResolvedValue({
        data: {
          usersPermissionsUser: {
            data: {
              attributes: {
                projects_1s: {
                  data: []
                }
              }
            }
          }
        }
      });
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        params,
        testContext
      );
      
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('User is not a member of this project');
    });
    
    it('should fail when projectId parameter is missing', async () => {
      const rules: AuthRule[] = [
        { type: 'projectMember' }
      ];
      
      const params = {};
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        params,
        testContext
      );
      
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain('Project ID parameter');
      expect(mockStrapiClient.execute).not.toHaveBeenCalled();
    });
    
    it('should use custom projectId parameter name', async () => {
      const rules: AuthRule[] = [
        { 
          type: 'projectMember',
          config: {
            projectIdParam: 'pid'
          }
        }
      ];
      
      const params = {
        pid: 'project789'
      };
      
      // Mock successful membership check
      vi.mocked(mockStrapiClient.execute).mockResolvedValue({
        data: {
          usersPermissionsUser: {
            data: {
              attributes: {
                projects_1s: {
                  data: [{ id: 'project789' }]
                }
              }
            }
          }
        }
      });
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        params,
        testContext
      );
      
      expect(result.authorized).toBe(true);
      expect(mockStrapiClient.execute).toHaveBeenCalledWith(
        '65checkProjectMembership',
        { uid: 'user123', projectId: 'project789' },
        'valid-jwt-token',
        expect.any(Function) // fetch function
      );
    });
    
    it('should support nested projectId parameter paths', async () => {
      const rules: AuthRule[] = [
        { 
          type: 'projectMember',
          config: {
            projectIdParam: 'data.project'
          }
        }
      ];
      
      const params = {
        data: {
          project: 'project999'
        }
      };
      
      // Mock successful membership check
      vi.mocked(mockStrapiClient.execute).mockResolvedValue({
        data: {
          usersPermissionsUser: {
            data: {
              attributes: {
                projects_1s: {
                  data: [{ id: 'project999' }]
                }
              }
            }
          }
        }
      });
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        params,
        testContext
      );
      
      expect(result.authorized).toBe(true);
      expect(mockStrapiClient.execute).toHaveBeenCalledWith(
        '65checkProjectMembership',
        { uid: 'user123', projectId: 'project999' },
        'valid-jwt-token',
        expect.any(Function)
      );
    });
    
    it('should handle Strapi errors gracefully', async () => {
      const rules: AuthRule[] = [
        { type: 'projectMember' }
      ];
      
      const params = {
        projectId: 'project456'
      };
      
      // Mock Strapi error
      vi.mocked(mockStrapiClient.execute).mockRejectedValue(
        new Error('Network error')
      );
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        params,
        testContext
      );
      
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('Failed to verify project membership');
    });
    
    it('should use custom error message for membership check', async () => {
      const rules: AuthRule[] = [
        { 
          type: 'projectMember',
          errorMessage: 'You must be a project member to perform this action'
        }
      ];
      
      const params = {
        projectId: 'project456'
      };
      
      // Mock failed membership check
      vi.mocked(mockStrapiClient.execute).mockResolvedValue({
        data: {
          usersPermissionsUser: {
            data: {
              attributes: {
                projects_1s: {
                  data: []
                }
              }
            }
          }
        }
      });
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        params,
        testContext
      );
      
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('You must be a project member to perform this action');
    });
  });
  
  describe('Role-Based Authorization', () => {
    it('should pass role check (placeholder implementation)', async () => {
      const rules: AuthRule[] = [
        { 
          type: 'role',
          config: {
            requiredRole: 'admin'
          }
        }
      ];
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        {},
        testContext
      );
      
      // Current implementation is a placeholder that always passes
      expect(result.authorized).toBe(true);
    });
    
    it('should fail when required role is not configured', async () => {
      const rules: AuthRule[] = [
        { 
          type: 'role',
          config: {}
        }
      ];
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        {},
        testContext
      );
      
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain('missing required role configuration');
    });
  });
  
  describe('Custom Authorization', () => {
    it('should pass when custom function returns authorized', async () => {
      const customCheck = vi.fn().mockResolvedValue({
        authorized: true
      });
      
      const rules: AuthRule[] = [
        { 
          type: 'custom',
          config: {
            checkFunction: customCheck
          }
        }
      ];
      
      const params = { customParam: 'value' };
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        params,
        testContext
      );
      
      expect(result.authorized).toBe(true);
      expect(customCheck).toHaveBeenCalledWith('user123', params, testContext);
    });
    
    it('should fail when custom function returns unauthorized', async () => {
      const customCheck = vi.fn().mockResolvedValue({
        authorized: false,
        reason: 'Custom check failed'
      });
      
      const rules: AuthRule[] = [
        { 
          type: 'custom',
          config: {
            checkFunction: customCheck
          }
        }
      ];
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        {},
        testContext
      );
      
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('Custom check failed');
    });
    
    it('should fail when custom function is missing', async () => {
      const rules: AuthRule[] = [
        { 
          type: 'custom',
          config: {}
        }
      ];
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        {},
        testContext
      );
      
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain('missing check function');
    });
    
    it('should fail when custom function throws an error', async () => {
      const customCheck = vi.fn().mockRejectedValue(
        new Error('Custom function error')
      );
      
      const rules: AuthRule[] = [
        { 
          type: 'custom',
          config: {
            checkFunction: customCheck
          }
        }
      ];
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        {},
        testContext
      );
      
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('Custom authorization check failed');
    });
    
    it('should use custom error message when function fails', async () => {
      const customCheck = vi.fn().mockRejectedValue(
        new Error('Custom function error')
      );
      
      const rules: AuthRule[] = [
        { 
          type: 'custom',
          errorMessage: 'You do not have permission to perform this action',
          config: {
            checkFunction: customCheck
          }
        }
      ];
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        {},
        testContext
      );
      
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('You do not have permission to perform this action');
    });
    
    it('should fail when custom function returns invalid result', async () => {
      const customCheck = vi.fn().mockResolvedValue({
        // Missing 'authorized' field
        someOtherField: true
      });
      
      const rules: AuthRule[] = [
        { 
          type: 'custom',
          config: {
            checkFunction: customCheck
          }
        }
      ];
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        {},
        testContext
      );
      
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain('invalid result');
    });
  });
  
  describe('Multiple Rules', () => {
    it('should pass when all rules pass', async () => {
      const customCheck = vi.fn().mockResolvedValue({
        authorized: true
      });
      
      const rules: AuthRule[] = [
        { type: 'jwt' },
        { 
          type: 'custom',
          config: {
            checkFunction: customCheck
          }
        }
      ];
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        {},
        testContext
      );
      
      expect(result.authorized).toBe(true);
    });
    
    it('should fail when first rule fails', async () => {
      const customCheck = vi.fn().mockResolvedValue({
        authorized: true
      });
      
      const rules: AuthRule[] = [
        { type: 'jwt' },
        { 
          type: 'custom',
          config: {
            checkFunction: customCheck
          }
        }
      ];
      
      const contextWithoutJwt = { ...testContext, jwt: '' };
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        {},
        contextWithoutJwt
      );
      
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('Valid JWT token is required');
      // Custom check should not be called if JWT check fails
      expect(customCheck).not.toHaveBeenCalled();
    });
    
    it('should fail when second rule fails', async () => {
      const customCheck = vi.fn().mockResolvedValue({
        authorized: false,
        reason: 'Custom check failed'
      });
      
      const rules: AuthRule[] = [
        { type: 'jwt' },
        { 
          type: 'custom',
          config: {
            checkFunction: customCheck
          }
        }
      ];
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        {},
        testContext
      );
      
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('Custom check failed');
    });
    
    it('should check rules in sequence and stop at first failure', async () => {
      const customCheck1 = vi.fn().mockResolvedValue({
        authorized: false,
        reason: 'First check failed'
      });
      
      const customCheck2 = vi.fn().mockResolvedValue({
        authorized: true
      });
      
      const rules: AuthRule[] = [
        { 
          type: 'custom',
          config: {
            checkFunction: customCheck1
          }
        },
        { 
          type: 'custom',
          config: {
            checkFunction: customCheck2
          }
        }
      ];
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        {},
        testContext
      );
      
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('First check failed');
      expect(customCheck1).toHaveBeenCalled();
      // Second check should not be called
      expect(customCheck2).not.toHaveBeenCalled();
    });
  });
  
  describe('Unknown Rule Type', () => {
    it('should fail with unknown rule type', async () => {
      const rules: AuthRule[] = [
        { type: 'unknown' as any }
      ];
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        {},
        testContext
      );
      
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain('Unknown authorization rule type');
    });
  });
  
  describe('Empty Rules', () => {
    it('should pass when no rules are defined', async () => {
      const rules: AuthRule[] = [];
      
      const result = await authEngine.authorize(
        'user123',
        rules,
        {},
        testContext
      );
      
      expect(result.authorized).toBe(true);
    });
  });
});
