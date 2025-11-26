/**
 * ActionService Usage Examples
 * 
 * This file demonstrates how to use the ActionService to execute actions
 * with validation, authorization, and notifications.
 */

import { ActionService } from '../ActionService.js';
import { ValidationEngine } from '../ValidationEngine.js';
import { AuthorizationEngine } from '../AuthorizationEngine.js';
import { StrapiClient } from '../StrapiClient.js';
import { registerAction } from '../registry.js';
import type { ActionConfig, ActionContext } from '../types.js';

// ============================================================================
// Setup
// ============================================================================

// Create service instances
const strapiClient = new StrapiClient();
const validator = new ValidationEngine();
const authorizer = new AuthorizationEngine(strapiClient);

// Create action service (without notifier for this example)
const actionService = new ActionService(
  validator,
  authorizer,
  strapiClient
);

// ============================================================================
// Example 1: Simple Action with JWT Authorization
// ============================================================================

// Register a simple action
const simpleAction: ActionConfig = {
  key: 'getUserProfile',
  description: 'Get user profile information',
  graphqlOperation: '2userQue', // Existing QIDS query
  paramSchema: {
    uid: { type: 'string', required: true }
  },
  authRules: [
    { type: 'jwt' }
  ]
};

registerAction(simpleAction);

// Execute the action
async function example1() {
  const context: ActionContext = {
    userId: 'user123',
    jwt: 'valid-jwt-token',
    lang: 'he',
    fetch: globalThis.fetch
  };
  
  const result = await actionService.executeAction(
    'getUserProfile',
    { uid: 'user123' },
    context
  );
  
  if (result.success) {
    console.log('User profile:', result.data);
  } else {
    console.error('Error:', result.error);
  }
}

// ============================================================================
// Example 2: Action with Project Membership Authorization
// ============================================================================

const projectAction: ActionConfig = {
  key: 'updateTask',
  description: 'Update a task in a project',
  graphqlOperation: '31updateTask', // Existing QIDS query
  paramSchema: {
    taskId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    status: { type: 'string', required: false },
    description: { type: 'string', required: false }
  },
  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'You must be a project member to update tasks'
    }
  ],
  updateStrategy: {
    type: 'partialUpdate',
    config: { dataKeys: ['arr1'] }
  }
};

registerAction(projectAction);

// Execute the action
async function example2() {
  const context: ActionContext = {
    userId: 'user123',
    jwt: 'valid-jwt-token',
    lang: 'he',
    fetch: globalThis.fetch
  };
  
  const result = await actionService.executeAction(
    'updateTask',
    {
      taskId: 'task456',
      projectId: 'proj789',
      status: 'completed'
    },
    context
  );
  
  if (result.success) {
    console.log('Task updated:', result.data);
    console.log('Update strategy:', result.updateStrategy);
  } else {
    console.error('Error:', result.error);
  }
}

// ============================================================================
// Example 3: Action with Notifications
// ============================================================================

const notificationAction: ActionConfig = {
  key: 'createMessage',
  description: 'Create a new message in a forum',
  graphqlOperation: '1chatsend', // Existing QIDS query
  paramSchema: {
    forumId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    message: { type: 'string', required: true }
  },
  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' }
    }
  ],
  notification: {
    recipients: {
      type: 'projectMembers',
      config: {
        projectIdParam: 'projectId',
        excludeSender: true
      }
    },
    templates: {
      title: {
        he: 'הודעה חדשה',
        en: 'New Message'
      },
      body: {
        he: 'נוספה הודעה חדשה לפורום',
        en: 'A new message was added to the forum'
      }
    },
    channels: ['socket', 'email', 'push'],
    metadata: {
      icon: 'https://example.com/message-icon.png',
      url: '/forum/{{forumId}}',
      priority: 'normal'
    }
  },
  updateStrategy: {
    type: 'partialUpdate',
    config: { dataKeys: ['messages', 'forum'] }
  }
};

registerAction(notificationAction);

// Execute the action
async function example3() {
  const context: ActionContext = {
    userId: 'user123',
    jwt: 'valid-jwt-token',
    lang: 'he',
    fetch: globalThis.fetch
  };
  
  const result = await actionService.executeAction(
    'createMessage',
    {
      forumId: 'forum123',
      projectId: 'proj789',
      message: 'Hello everyone!'
    },
    context
  );
  
  if (result.success) {
    console.log('Message created:', result.data);
    // Notifications are sent asynchronously in the background
  } else {
    console.error('Error:', result.error);
  }
}

// ============================================================================
// Example 4: Action with Custom Validation
// ============================================================================

const customValidationAction: ActionConfig = {
  key: 'createProject',
  description: 'Create a new project',
  graphqlOperation: '5createProject', // Existing QIDS query
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
      description: 'Budget must be a positive number'
    },
    members: {
      type: 'array',
      required: true,
      validate: (value: any[]) => Array.isArray(value) && value.length > 0,
      description: 'Project must have at least one member'
    }
  },
  authRules: [
    { type: 'jwt' }
  ]
};

registerAction(customValidationAction);

// Execute the action
async function example4() {
  const context: ActionContext = {
    userId: 'user123',
    jwt: 'valid-jwt-token',
    lang: 'he',
    fetch: globalThis.fetch
  };
  
  // This will fail validation
  const result1 = await actionService.executeAction(
    'createProject',
    {
      name: 'AB', // Too short
      budget: -100, // Negative
      members: [] // Empty array
    },
    context
  );
  
  console.log('Validation errors:', result1.error?.details);
  
  // This will succeed
  const result2 = await actionService.executeAction(
    'createProject',
    {
      name: 'My New Project',
      budget: 10000,
      members: ['user123', 'user456']
    },
    context
  );
  
  if (result2.success) {
    console.log('Project created:', result2.data);
  }
}

// ============================================================================
// Example 5: Error Handling
// ============================================================================

async function example5() {
  const context: ActionContext = {
    userId: 'user123',
    jwt: 'valid-jwt-token',
    lang: 'he',
    fetch: globalThis.fetch
  };
  
  // Unknown action
  const result1 = await actionService.executeAction(
    'unknownAction',
    {},
    context
  );
  console.log('Unknown action error:', result1.error);
  // { code: 'UNKNOWN_ACTION', message: '...' }
  
  // Validation failure
  const result2 = await actionService.executeAction(
    'getUserProfile',
    {}, // Missing required 'uid' parameter
    context
  );
  console.log('Validation error:', result2.error);
  // { code: 'VALIDATION_FAILED', message: '...', details: [...] }
  
  // Authorization failure
  const result3 = await actionService.executeAction(
    'updateTask',
    {
      taskId: 'task456',
      projectId: 'proj999' // User is not a member of this project
    },
    context
  );
  console.log('Authorization error:', result3.error);
  // { code: 'UNAUTHORIZED', message: '...' }
}

// ============================================================================
// Example 6: Using ActionService in API Endpoint
// ============================================================================

/**
 * Example SvelteKit API endpoint using ActionService
 * 
 * File: src/routes/api/action/+server.ts
 */
/*
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { actionService } from '$lib/server/actions/index.js';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    // Parse request body
    const { actionKey, params } = await request.json();
    
    // Get user context from cookies
    const userId = cookies.get('id');
    const jwt = cookies.get('jwt');
    const lang = cookies.get('lang') || 'he';
    
    // Validate user is authenticated
    if (!userId || !jwt) {
      return json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'User must be authenticated'
        }
      }, { status: 401 });
    }
    
    // Execute action
    const result = await actionService.executeAction(
      actionKey,
      params,
      { userId, jwt, lang, fetch }
    );
    
    // Return result
    const status = result.success ? 200 : 
                   result.error?.code === 'UNAUTHORIZED' ? 403 :
                   result.error?.code === 'VALIDATION_FAILED' ? 400 : 500;
    
    return json(result, { status });
    
  } catch (error) {
    console.error('Action API error:', error);
    return json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }, { status: 500 });
  }
};
*/

// ============================================================================
// Export examples for testing
// ============================================================================

export {
  example1,
  example2,
  example3,
  example4,
  example5
};
