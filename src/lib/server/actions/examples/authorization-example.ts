/**
 * Authorization Engine Usage Examples
 * 
 * This file demonstrates how to use the AuthorizationEngine
 * with different rule types and configurations.
 */

import { AuthorizationEngine } from '../AuthorizationEngine.js';
import { StrapiClient } from '../StrapiClient.js';
import type { AuthRule, ActionContext } from '../types.js';

// Initialize the components
const strapiClient = new StrapiClient();
const authEngine = new AuthorizationEngine(strapiClient);

// Example context (would come from the API endpoint)
const exampleContext: ActionContext = {
  userId: 'user123',
  jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  lang: 'he',
  fetch: global.fetch
};

/**
 * Example 1: Simple JWT validation
 * 
 * Use this for actions that only require a logged-in user
 */
async function example1_JwtOnly() {
  const rules: AuthRule[] = [
    { type: 'jwt' }
  ];
  
  const result = await authEngine.authorize(
    exampleContext.userId,
    rules,
    {},
    exampleContext
  );
  
  if (result.authorized) {
    console.log('✅ User is authenticated');
  } else {
    console.log('❌ Authentication failed:', result.reason);
  }
}

/**
 * Example 2: Project membership check
 * 
 * Use this for actions that require the user to be a project member
 */
async function example2_ProjectMembership() {
  const rules: AuthRule[] = [
    { type: 'jwt' },
    { 
      type: 'projectMember',
      config: {
        projectIdParam: 'projectId'
      },
      errorMessage: 'You must be a member of this project to perform this action'
    }
  ];
  
  const params = {
    projectId: 'project456',
    taskName: 'New Task'
  };
  
  const result = await authEngine.authorize(
    exampleContext.userId,
    rules,
    params,
    exampleContext
  );
  
  if (result.authorized) {
    console.log('✅ User is authorized to modify this project');
  } else {
    console.log('❌ Authorization failed:', result.reason);
  }
}

/**
 * Example 3: Custom parameter name for project ID
 * 
 * Use this when your action uses a different parameter name
 */
async function example3_CustomProjectIdParam() {
  const rules: AuthRule[] = [
    { type: 'jwt' },
    { 
      type: 'projectMember',
      config: {
        projectIdParam: 'pid' // Custom parameter name
      }
    }
  ];
  
  const params = {
    pid: 'project789', // Using 'pid' instead of 'projectId'
    data: { /* ... */ }
  };
  
  const result = await authEngine.authorize(
    exampleContext.userId,
    rules,
    params,
    exampleContext
  );
  
  return result;
}

/**
 * Example 4: Custom authorization function
 * 
 * Use this for complex authorization logic that doesn't fit
 * into the standard rule types
 */
async function example4_CustomAuthorization() {
  const rules: AuthRule[] = [
    { type: 'jwt' },
    { 
      type: 'custom',
      config: {
        checkFunction: async (userId, params, context) => {
          // Custom logic: Check if user created the task
          const taskId = params.taskId;
          
          // Query Strapi to get task creator
          const strapiClient = new StrapiClient();
          const result = await strapiClient.execute(
            'getTaskCreator', // Hypothetical QIDS query
            { taskId },
            context.jwt
          );
          
          const creatorId = result?.data?.task?.data?.attributes?.creator?.data?.id;
          
          if (creatorId === userId) {
            return { authorized: true };
          } else {
            return {
              authorized: false,
              reason: 'Only the task creator can perform this action'
            };
          }
        }
      },
      errorMessage: 'You do not have permission to modify this task'
    }
  ];
  
  const params = {
    taskId: 'task123',
    newStatus: 'completed'
  };
  
  const result = await authEngine.authorize(
    exampleContext.userId,
    rules,
    params,
    exampleContext
  );
  
  return result;
}

/**
 * Example 5: Multiple authorization checks
 * 
 * Combine multiple rule types for complex authorization requirements
 */
async function example5_MultipleRules() {
  const rules: AuthRule[] = [
    // First: Check JWT
    { 
      type: 'jwt',
      errorMessage: 'You must be logged in'
    },
    // Second: Check project membership
    { 
      type: 'projectMember',
      config: {
        projectIdParam: 'projectId'
      },
      errorMessage: 'You must be a project member'
    },
    // Third: Custom check for specific permission
    { 
      type: 'custom',
      config: {
        checkFunction: async (userId, params, context) => {
          // Check if user has 'admin' role in this project
          // This is a simplified example
          const hasAdminRole = true; // Would query Strapi
          
          return {
            authorized: hasAdminRole,
            reason: hasAdminRole ? undefined : 'You must be a project admin'
          };
        }
      },
      errorMessage: 'Insufficient permissions'
    }
  ];
  
  const params = {
    projectId: 'project456',
    action: 'deleteProject'
  };
  
  const result = await authEngine.authorize(
    exampleContext.userId,
    rules,
    params,
    exampleContext
  );
  
  if (result.authorized) {
    console.log('✅ User has all required permissions');
  } else {
    console.log('❌ Authorization failed:', result.reason);
    // The reason will be from the first rule that failed
  }
  
  return result;
}

/**
 * Example 6: Using in an action configuration
 * 
 * This shows how authorization rules are typically defined
 * in action configurations
 */
const exampleActionConfig = {
  key: 'updateTask',
  description: 'Update a task in a project',
  graphqlOperation: '31updateTask',
  paramSchema: {
    taskId: { type: 'string' as const, required: true },
    projectId: { type: 'string' as const, required: true },
    updates: { type: 'object' as const, required: true }
  },
  authRules: [
    { type: 'jwt' as const },
    { 
      type: 'projectMember' as const,
      config: {
        projectIdParam: 'projectId'
      },
      errorMessage: 'You must be a member of this project to update tasks'
    }
  ]
};

/**
 * Example 7: Error handling
 * 
 * Always handle authorization failures appropriately
 */
async function example7_ErrorHandling() {
  const rules: AuthRule[] = [
    { type: 'jwt' },
    { type: 'projectMember' }
  ];
  
  const params = {
    projectId: 'project456'
  };
  
  try {
    const result = await authEngine.authorize(
      exampleContext.userId,
      rules,
      params,
      exampleContext
    );
    
    if (!result.authorized) {
      // Return appropriate HTTP status code
      return {
        status: 403,
        body: {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: result.reason || 'You are not authorized to perform this action'
          }
        }
      };
    }
    
    // Proceed with the action
    return {
      status: 200,
      body: {
        success: true,
        data: { /* ... */ }
      }
    };
  } catch (error) {
    // Handle unexpected errors
    console.error('Authorization error:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while checking authorization'
        }
      }
    };
  }
}

// Export examples for documentation
export {
  example1_JwtOnly,
  example2_ProjectMembership,
  example3_CustomProjectIdParam,
  example4_CustomAuthorization,
  example5_MultipleRules,
  exampleActionConfig,
  example7_ErrorHandling
};
