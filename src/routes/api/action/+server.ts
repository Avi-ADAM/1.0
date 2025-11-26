/**
 * Action API Endpoint
 * 
 * Unified endpoint for all action executions.
 * Handles validation, authorization, execution, and notifications.
 * 
 * POST /api/action
 * Body: { actionKey: string, params: Record<string, any> }
 * 
 * Validates: Requirements 1.1, 1.5
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { ActionService } from '$lib/server/actions/ActionService.js';
import { ValidationEngine } from '$lib/server/actions/ValidationEngine.js';
import { AuthorizationEngine } from '$lib/server/actions/AuthorizationEngine.js';
import { StrapiClient } from '$lib/server/actions/StrapiClient.js';
import { NotificationOrchestrator } from '$lib/server/notifications/NotificationOrchestrator.js';
import type { ActionContext } from '$lib/server/actions/types.js';
// Import action configurations to register them
import '$lib/server/actions/configs/index.js';

// Environment variables
const STRAPI_ENDPOINT = import.meta.env.VITE_URL + '/graphql';
const ADMIN_TOKEN = import.meta.env.VITE_ADMINMONTHER;

// Initialize services (singleton pattern)
let actionService: ActionService | null = null;

function getActionService(): ActionService {
  if (!actionService) {
    const strapiClient = new StrapiClient(STRAPI_ENDPOINT, ADMIN_TOKEN);
    const validator = new ValidationEngine();
    const authorizer = new AuthorizationEngine(strapiClient);
    const notifier = new NotificationOrchestrator(strapiClient);
    
    actionService = new ActionService(
      validator,
      authorizer,
      strapiClient,
      notifier
    );
  }
  
  return actionService;
}

/**
 * POST handler for action execution
 */
export const POST: RequestHandler = async ({ request, cookies, fetch }) => {
  // Set up timeout for the entire request
  const controller = new AbortController();
  const timeout = 30000; // 30-second timeout
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    // Parse request body
    const body = await request.json();
    const { actionKey, params } = body;
    
    // Validate request structure
    if (!actionKey || typeof actionKey !== 'string') {
      throw error(400, 'Missing or invalid actionKey');
    }
    
    if (!params || typeof params !== 'object') {
      throw error(400, 'Missing or invalid params');
    }
    
    // Extract user context from cookies
    const userId = cookies.get('id');
    const jwt = cookies.get('jwt');
    const lang = cookies.get('lang') || 'he';
    
    // Validate user authentication
    if (!userId || !jwt) {
      throw error(401, 'Authentication required. Please log in.');
    }
    
    // Build action context
    const context: ActionContext = {
      userId,
      jwt,
      lang,
      fetch
    };
    
    // Execute action
    const service = getActionService();
    const result = await service.executeAction(actionKey, params, context);
    
    // Clear timeout
    clearTimeout(timeoutId);
    
    // Return result
    if (result.success) {
      return json({
        success: true,
        data: result.data,
        updateStrategy: result.updateStrategy
      });
    } else {
      // Map error codes to HTTP status codes
      const statusCode = getStatusCodeForError(result.error?.code);
      
      return json(
        {
          success: false,
          error: result.error
        },
        { status: statusCode }
      );
    }
    
  } catch (e) {
    // Clear timeout
    clearTimeout(timeoutId);
    
    // Handle timeout errors
    if (e instanceof Error && e.name === 'AbortError') {
      console.error('Action request timed out');
      throw error(504, 'Gateway Timeout: The request took too long to process.');
    }
    
    // Re-throw SvelteKit errors
    if (e && typeof e === 'object' && 'status' in e && 'body' in e) {
      throw e;
    }
    
    // Handle unexpected errors
    console.error('Unexpected error in action endpoint:', e);
    throw error(500, e instanceof Error ? e.message : 'An internal server error occurred.');
  }
};

/**
 * Map error codes to HTTP status codes
 */
function getStatusCodeForError(errorCode?: string): number {
  switch (errorCode) {
    case 'VALIDATION_FAILED':
      return 400;
    case 'UNAUTHORIZED':
      return 403;
    case 'UNKNOWN_ACTION':
    case 'NOT_FOUND':
      return 404;
    case 'STRAPI_ERROR':
    case 'INTERNAL_ERROR':
    default:
      return 500;
  }
}
