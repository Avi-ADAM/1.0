/**
 * Integration tests for ValidationEngine
 * 
 * Tests ValidationEngine integration with action configurations
 * and realistic validation scenarios.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationEngine } from './ValidationEngine.js';
import { registerAction, clearRegistry, getAction } from './registry.js';
import type { ActionConfig } from './types.js';

describe('ValidationEngine Integration', () => {
  let validator: ValidationEngine;
  
  beforeEach(() => {
    validator = new ValidationEngine();
    clearRegistry();
  });
  
  it('should validate parameters for a registered action', async () => {
    // Register a sample action
    const actionConfig: ActionConfig = {
      key: 'createTask',
      description: 'Create a new task',
      graphqlOperation: '4crtask',
      paramSchema: {
        projectId: { type: 'string', required: true },
        taskName: { type: 'string', required: true },
        description: { type: 'string', required: false },
        priority: {
          type: 'number',
          required: false,
          validate: (value) => value >= 1 && value <= 5,
          description: 'must be between 1 and 5'
        }
      },
      authRules: [{ type: 'jwt' }]
    };
    
    registerAction(actionConfig);
    
    // Get the action and validate params
    const action = getAction('createTask');
    expect(action).toBeDefined();
    
    // Valid params
    const validParams = {
      projectId: '123',
      taskName: 'New Task',
      priority: 3
    };
    
    const validResult = await validator.validate(validParams, action!.paramSchema);
    expect(validResult.valid).toBe(true);
    
    // Invalid params - missing required field
    const invalidParams1 = {
      projectId: '123'
      // taskName is missing
    };
    
    const invalidResult1 = await validator.validate(invalidParams1, action!.paramSchema);
    expect(invalidResult1.valid).toBe(false);
    expect(invalidResult1.errors).toContain('Missing required parameter: taskName');
    
    // Invalid params - wrong type
    const invalidParams2 = {
      projectId: 123, // should be string
      taskName: 'New Task'
    };
    
    const invalidResult2 = await validator.validate(invalidParams2, action!.paramSchema);
    expect(invalidResult2.valid).toBe(false);
    expect(invalidResult2.errors[0]).toContain('must be of type string');
    
    // Invalid params - failed custom validation
    const invalidParams3 = {
      projectId: '123',
      taskName: 'New Task',
      priority: 10 // out of range
    };
    
    const invalidResult3 = await validator.validate(invalidParams3, action!.paramSchema);
    expect(invalidResult3.valid).toBe(false);
    expect(invalidResult3.errors[0]).toContain('failed custom validation');
  });
  
  it('should validate complex action with multiple validation rules', async () => {
    const actionConfig: ActionConfig = {
      key: 'updateUser',
      description: 'Update user profile',
      graphqlOperation: 'updateUserProfile',
      paramSchema: {
        userId: { type: 'string', required: true },
        email: {
          type: 'string',
          required: false,
          validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
          description: 'must be a valid email address'
        },
        age: {
          type: 'number',
          required: false,
          validate: (value) => value >= 0 && value <= 150,
          description: 'must be between 0 and 150'
        },
        skills: {
          type: 'array',
          required: false,
          validate: (value) => Array.isArray(value) && value.length > 0,
          description: 'must be a non-empty array'
        },
        metadata: {
          type: 'object',
          required: false
        }
      },
      authRules: [{ type: 'jwt' }]
    };
    
    registerAction(actionConfig);
    const action = getAction('updateUser');
    
    // Valid complex params
    const validParams = {
      userId: 'user123',
      email: 'user@example.com',
      age: 25,
      skills: ['JavaScript', 'TypeScript'],
      metadata: { theme: 'dark' }
    };
    
    const validResult = await validator.validate(validParams, action!.paramSchema);
    expect(validResult.valid).toBe(true);
    
    // Multiple validation errors
    const invalidParams = {
      userId: 'user123',
      email: 'invalid-email', // invalid format
      age: 200, // out of range
      skills: [], // empty array
      metadata: 'not an object' // wrong type
    };
    
    const invalidResult = await validator.validate(invalidParams, action!.paramSchema);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(1);
  });
  
  it('should handle action with no required parameters', async () => {
    const actionConfig: ActionConfig = {
      key: 'getStats',
      description: 'Get user statistics',
      graphqlOperation: 'getUserStats',
      paramSchema: {
        includeHistory: { type: 'boolean', required: false },
        limit: { type: 'number', required: false }
      },
      authRules: [{ type: 'jwt' }]
    };
    
    registerAction(actionConfig);
    const action = getAction('getStats');
    
    // Empty params should be valid
    const emptyParams = {};
    const result = await validator.validate(emptyParams, action!.paramSchema);
    expect(result.valid).toBe(true);
    
    // Params with optional fields should be valid
    const withParams = {
      includeHistory: true,
      limit: 10
    };
    const result2 = await validator.validate(withParams, action!.paramSchema);
    expect(result2.valid).toBe(true);
  });
  
  it('should validate realistic project action parameters', async () => {
    const actionConfig: ActionConfig = {
      key: 'createProject',
      description: 'Create a new project',
      graphqlOperation: 'createProject',
      paramSchema: {
        projectName: {
          type: 'string',
          required: true,
          validate: (value) => value.length >= 3 && value.length <= 100,
          description: 'must be between 3 and 100 characters'
        },
        description: {
          type: 'string',
          required: false,
          validate: (value) => value.length <= 500,
          description: 'must be at most 500 characters'
        },
        memberIds: {
          type: 'array',
          required: true,
          validate: (value) => Array.isArray(value) && value.length > 0,
          description: 'must include at least one member'
        },
        isPublic: {
          type: 'boolean',
          required: false
        },
        tags: {
          type: 'array',
          required: false
        }
      },
      authRules: [{ type: 'jwt' }]
    };
    
    registerAction(actionConfig);
    const action = getAction('createProject');
    
    // Valid project creation
    const validParams = {
      projectName: 'My New Project',
      description: 'A great project',
      memberIds: ['user1', 'user2'],
      isPublic: true,
      tags: ['tag1', 'tag2']
    };
    
    const validResult = await validator.validate(validParams, action!.paramSchema);
    expect(validResult.valid).toBe(true);
    
    // Invalid - project name too short
    const invalidParams1 = {
      projectName: 'AB',
      memberIds: ['user1']
    };
    
    const invalidResult1 = await validator.validate(invalidParams1, action!.paramSchema);
    expect(invalidResult1.valid).toBe(false);
    expect(invalidResult1.errors[0]).toContain('failed custom validation');
    
    // Invalid - empty member list
    const invalidParams2 = {
      projectName: 'Valid Name',
      memberIds: []
    };
    
    const invalidResult2 = await validator.validate(invalidParams2, action!.paramSchema);
    expect(invalidResult2.valid).toBe(false);
    expect(invalidResult2.errors[0]).toContain('must include at least one member');
  });
});

