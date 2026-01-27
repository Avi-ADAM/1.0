/**
 * Client-side Action Helper for Unified Action System
 * 
 * This module provides a simple interface for executing actions from the client.
 * It handles API calls, error handling, and update strategies.
 * 
 * Usage:
 * ```typescript
 * import { executeAction, updateTask } from '$lib/client/actionClient';
 * 
 * // Generic action execution
 * const result = await executeAction('updateTask', {
 *   id: '123',
 *   projectId: '456',
 *   myIshur: true
 * });
 * 
 * // Type-safe action helper
 * const result = await updateTask({
 *   id: '123',
 *   projectId: '456',
 *   myIshur: true
 * });
 * 
 * if (result.success) {
 *   console.log('Task updated:', result.data);
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 */

import { browser } from '$app/environment';
import { invalidate } from '$app/navigation';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Action response from the server
 */
export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  updateStrategy?: {
    type: 'fullRefresh' | 'partialUpdate' | 'optimistic' | 'none';
    config?: {
      dataKeys?: string[];
      updateFunction?: string;
    };
  };
}

/**
 * Options for executing an action
 */
export interface ExecuteActionOptions {
  /** Fetch function (required in SSR context) */
  fetch?: typeof globalThis.fetch;

  /** Callback on successful action */
  onSuccess?: (data: any) => void;

  /** Callback on action error */
  onError?: (error: any) => void;

  /** Skip automatic update strategy execution */
  skipUpdateStrategy?: boolean;

  /** Show success toast notification */
  showSuccessToast?: boolean;

  /** Success message for toast */
  successMessage?: string;

  /** Show error toast notification */
  showErrorToast?: boolean;
}

// ============================================================================
// Action Parameter Types
// ============================================================================

/**
 * Parameters for updateTask action
 */
export interface UpdateTaskParams {
  /** ID of the task (Act) to update */
  id: string;

  /** ID of the project containing the task */
  projectId: string;

  /** Task approval status by assignee */
  myIshur?: boolean;

  /** Task approval status by validator */
  valiIshur?: boolean;

  /** Whether the task is assigned */
  isAssigned?: boolean;

  /** Array of user IDs assigned to the task */
  uid?: string[];

  /** Array of mission IDs associated with the task */
  mesimabetahaliches?: string[];
}

/**
 * Parameters for createHaluka action
 */
export interface CreateHalukaParams {
  data: {
    project: string;
    usersend: string;
    userrecive: string;
    amount: number;
    matbea: string;
    confirmed: boolean;
    publishedAt: string;
  };
}

/**
 * Parameters for createTosplit action
 */
export interface CreateTosplitParams {
  data: {
    publishedAt: string;
    project: string;
    vots: Array<{
      what: boolean;
      users_permissions_user: string;
    }>;
    halukas: number[];
    hervachti: Array<{
      users_permissions_user: number;
      amount: number;
      mekabel: boolean;
      noten: boolean;
    }>;
    sales?: number[];
  };
}

/**
 * Parameters for timerStart action
 */
export interface TimerStartParams {
  /** ID of the mission to start timer for */
  missionId: string;

  /** ID of the project containing the mission */
  projectId: string;

  /** ID of the user starting the timer */
  userId: string;

  /** ID of existing timer to resume (optional) */
  timerId?: string;
}

/**
 * Parameters for timerStop action
 */
export interface TimerStopParams {
  /** ID of the timer to stop */
  timerId: string;

  /** ID of the project containing the mission */
  projectId: string;

  /** ID of the user stopping the timer */
  userId: string;

  /** Total accumulated hours (optional) */
  totalHours?: number;
}

/**
 * Parameters for timerSave action
 */
export interface TimerSaveParams {
  /** ID of the mission to save timer for */
  missionId: string;

  /** ID of the timer to save */
  timerId: string;

  /** ID of the project containing the mission */
  projectId: string;

  /** ID of the user saving the timer */
  userId: string;

  /** Total hours to commit */
  totalHours: number;

  /** Array of task IDs associated with this timer session */
  tasks?: string[];
}

export type ActionKey =
  | 'updateTask'
  | 'createHaluka'
  | 'createTosplit'
  | 'approveHaluka'
  | 'timerStart'
  | 'timerStop'
  | 'timerSave'
  | 'addVote'
  | 'approveSheirutpend'
  | 'rejectSheirutpend'
  ;

export interface ActionParamsMap {
  timerSave: TimerSaveParams;
  addVote: {
    type: 'pend' | 'sheirutpend';
    id: string;
    projectId: string;
    existingComponentData: any[];
    order?: number;
  };
  approveSheirutpend: {
    id: string;
    projectId: string;
  };
  rejectSheirutpend: {
    id: string;
    projectId: string;
  };
}

// ============================================================================
// Core Action Execution
// ============================================================================

/**
 * Execute an action via the Action API
 * 
 * This is the main function for executing actions. It handles:
 * - API communication
 * - Error handling
 * - Update strategy execution
 * - User feedback (toasts)
 * 
 * @param actionKey - The unique identifier for the action
 * @param params - Parameters for the action
 * @param options - Additional options
 * @returns Promise with the action result
 * 
 * @example
 * ```typescript
 * const result = await executeAction('updateTask', {
 *   id: '123',
 *   projectId: '456',
 *   myIshur: true
 * }, {
 *   showSuccessToast: true,
 *   successMessage: 'Task updated successfully!'
 * });
 * ```
 */
export async function executeAction<K extends ActionKey>(
  actionKey: K,
  params: K extends keyof ActionParamsMap ? ActionParamsMap[K] : Record<string, any>,
  options: ExecuteActionOptions = {}
): Promise<ActionResponse> {
  if (!browser && !options.fetch) {
    throw new Error('executeAction requires fetch function in SSR context');
  }

  const fetchFn = options.fetch || fetch;

  try {
    console.log(`[ActionClient] Executing action: ${actionKey}`, params);

    const response = await fetchFn('/api/action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        actionKey,
        params
      })
    });

    const result: ActionResponse = await response.json();

    if (!response.ok || !result.success) {
      console.error(`[ActionClient] Action failed:`, result.error);

      // Show error toast if requested
      if (options.showErrorToast !== false) {
        displayActionError(result.error);
      }

      if (options.onError) {
        options.onError(result.error);
      }

      return result;
    }

    console.log(`[ActionClient] Action succeeded:`, result.data);

    // Execute update strategy if not skipped
    if (!options.skipUpdateStrategy && result.updateStrategy) {
      await executeUpdateStrategy(result.updateStrategy, result.data);
    }

    // Show success toast if requested
    if (options.showSuccessToast && options.successMessage) {
      displayActionSuccess(options.successMessage);
    }

    if (options.onSuccess) {
      options.onSuccess(result.data);
    }

    return result;
  } catch (error) {
    console.error(`[ActionClient] Network error:`, error);

    const errorResponse: ActionResponse = {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown network error'
      }
    };

    // Show error toast if requested
    if (options.showErrorToast !== false) {
      displayActionError(errorResponse.error);
    }

    if (options.onError) {
      options.onError(errorResponse.error);
    }

    return errorResponse;
  }
}

/**
 * Execute an update strategy after an action completes
 * 
 * This function handles different update strategies to keep the UI in sync
 * with the server state after an action completes.
 */
async function executeUpdateStrategy(
  strategy: NonNullable<ActionResponse['updateStrategy']>,
  data: any
): Promise<void> {
  console.log(`[ActionClient] Executing update strategy: ${strategy.type}`, {
    config: strategy.config,
    hasData: !!data
  });

  try {
    switch (strategy.type) {
      case 'fullRefresh':
        // Invalidate all data to trigger a full page refresh
        // This is the safest but slowest option
        if (browser) {
          console.log('[ActionClient] Performing full refresh');
          await invalidate(() => true);
        }
        break;

      case 'partialUpdate':
        // Invalidate specific data keys to refresh only affected data
        // This is more efficient than full refresh
        if (browser && strategy.config?.dataKeys) {
          console.log('[ActionClient] Performing partial update', {
            keys: strategy.config.dataKeys
          });

          for (const key of strategy.config.dataKeys) {
            await invalidate(key);
          }
        } else if (browser) {
          // If no specific keys provided, fall back to full refresh
          console.warn('[ActionClient] No data keys specified for partial update, falling back to full refresh');
          await invalidate(() => true);
        }
        break;

      case 'optimistic':
        // Apply optimistic update using custom function
        // This provides immediate UI feedback without waiting for server
        if (strategy.config?.updateFunction) {
          const updateFn = getUpdateFunction(strategy.config.updateFunction);

          if (updateFn) {
            console.log('[ActionClient] Applying optimistic update', {
              function: strategy.config.updateFunction
            });

            await updateFn(data, strategy.config);
          } else {
            console.warn(`[ActionClient] Update function not found: ${strategy.config.updateFunction}`);

            // Fall back to partial or full refresh if function not found
            if (strategy.config?.dataKeys) {
              await invalidate(strategy.config.dataKeys[0]);
            } else {
              await invalidate(() => true);
            }
          }
        } else {
          console.warn('[ActionClient] No update function specified for optimistic strategy');
        }
        break;

      case 'none':
        // No update needed - action doesn't affect client state
        console.log('[ActionClient] No update strategy applied');
        break;

      default:
        console.warn(`[ActionClient] Unknown update strategy: ${(strategy as any).type}`);
    }
  } catch (error) {
    console.error('[ActionClient] Error executing update strategy:', error);

    // On error, try to fall back to full refresh to ensure consistency
    if (browser) {
      console.log('[ActionClient] Falling back to full refresh due to error');
      await invalidate(() => true);
    }
  }
}

/**
 * Get an update function by name
 * 
 * Update functions can be registered globally or in specific stores.
 * They receive the action result data and strategy config.
 */
function getUpdateFunction(name: string): UpdateFunction | null {
  if (!browser) return null;

  // Check global window object
  if ((window as any)[name] && typeof (window as any)[name] === 'function') {
    return (window as any)[name];
  }

  // Check updateStrategies namespace
  if ((window as any).updateStrategies?.[name]) {
    return (window as any).updateStrategies[name];
  }

  return null;
}

/**
 * Type for update functions
 */
type UpdateFunction = (data: any, config?: any) => void | Promise<void>;

// ============================================================================
// Type-Safe Action Helpers
// ============================================================================

/**
 * Update a task (Act) in a project
 * 
 * This is a type-safe wrapper around executeAction for the updateTask action.
 * 
 * @param params - Task update parameters
 * @param options - Execution options
 * @returns Promise with the action result
 * 
 * @example
 * ```typescript
 * const result = await updateTask({
 *   id: '123',
 *   projectId: '456',
 *   myIshur: true
 * }, {
 *   showSuccessToast: true,
 *   successMessage: 'Task approved!'
 * });
 * ```
 */
export async function updateTask(
  params: UpdateTaskParams,
  options: ExecuteActionOptions = {}
): Promise<ActionResponse> {
  return executeAction('updateTask', params, options);
}

/**
 * Start or resume a timer for a mission
 * 
 * This action notifies relevant users via WebSocket when a timer is started.
 * 
 * @param params - Timer start parameters
 * @param options - Execution options
 * @returns Promise with the action result
 * 
 * @example
 * ```typescript
 * const result = await timerStart({
 *   missionId: '123',
 *   projectId: '456',
 *   userId: '789'
 * });
 * ```
 */
export async function timerStart(
  params: TimerStartParams,
  options: ExecuteActionOptions = {}
): Promise<ActionResponse> {
  return executeAction('timerStart', params, options);
}

/**
 * Stop a timer for a mission
 * 
 * This action notifies relevant users via WebSocket when a timer is stopped.
 * 
 * @param params - Timer stop parameters
 * @param options - Execution options
 * @returns Promise with the action result
 * 
 * @example
 * ```typescript
 * const result = await timerStop({
 *   timerId: '123',
 *   projectId: '456',
 *   userId: '789'
 * });
 * ```
 */
export async function timerStop(
  params: TimerStopParams,
  options: ExecuteActionOptions = {}
): Promise<ActionResponse> {
  return executeAction('timerStop', params, options);
}

/**
 * Save a timer and commit hours to mission
 * 
 * This action notifies project members via WebSocket when a timer is saved.
 * 
 * @param params - Timer save parameters
 * @param options - Execution options
 * @returns Promise with the action result
 * 
 * @example
 * ```typescript
 * const result = await timerSave({
 *   missionId: '123',
 *   timerId: '456',
 *   projectId: '789',
 *   userId: '101',
 *   totalHours: 2.5
 * });
 * ```
 */
export async function timerSave(
  params: TimerSaveParams,
  options: ExecuteActionOptions = {}
): Promise<ActionResponse> {
  return executeAction('timerSave', params, options);
}

/**
 * Add a vote to a pend or sheirutpend item
 * 
 * @param params - Vote parameters
 * @param options - Execution options
 */
export async function addVote(
  params: {
    type: 'pend' | 'sheirutpend';
    id: string;
    projectId: string;
    existingComponentData: any[];
    order?: number;
  },
  options: ExecuteActionOptions = {}
): Promise<ActionResponse> {
  return executeAction('addVote', params, options);
}

/**
 * Approve a product request
 */
export async function approveSheirutpend(
  params: { id: string; projectId: string },
  options: ExecuteActionOptions = {}
): Promise<ActionResponse> {
  return executeAction('approveSheirutpend', params, options);
}

/**
 * Reject a product request
 */
export async function rejectSheirutpend(
  params: { id: string; projectId: string },
  options: ExecuteActionOptions = {}
): Promise<ActionResponse> {
  return executeAction('rejectSheirutpend', params, options);
}

// ============================================================================
// User Feedback Helpers
// ============================================================================

/**
 * Helper to display action errors to the user
 * 
 * Uses toast notifications if available, falls back to console.error and alert.
 * Provides user-friendly error messages based on error codes.
 * 
 * @param error - Error object from action response
 */
export function displayActionError(error: ActionResponse['error']): void {
  if (!error) return;

  // Get user-friendly error message
  const message = getUserFriendlyErrorMessage(error);

  // Try to use toast if available
  if (browser && (window as any).toast) {
    (window as any).toast.error(message);
  } else {
    console.error('[ActionClient]', message);
    // Fallback to alert in browser
    if (browser) {
      alert(message);
    }
  }
}

/**
 * Helper to display action success to the user
 * 
 * Uses toast notifications if available, falls back to console.log.
 * 
 * @param message - Success message to display
 */
export function displayActionSuccess(message: string): void {
  // Try to use toast if available
  if (browser && (window as any).toast) {
    (window as any).toast.success(message);
  } else {
    console.log('[ActionClient]', message);
  }
}

/**
 * Get a user-friendly error message based on error code
 * 
 * @param error - Error object from action response
 * @returns User-friendly error message
 */
function getUserFriendlyErrorMessage(error: ActionResponse['error']): string {
  if (!error) return 'An unknown error occurred';

  // Map error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    'VALIDATION_FAILED': 'Invalid input. Please check your data and try again.',
    'UNAUTHORIZED': 'You do not have permission to perform this action.',
    'NOT_FOUND': 'The requested resource was not found.',
    'STRAPI_ERROR': 'A server error occurred. Please try again later.',
    'INTERNAL_ERROR': 'An unexpected error occurred. Please try again later.',
    'NETWORK_ERROR': 'Network error. Please check your connection and try again.',
    'UNKNOWN_ACTION': 'This action is not available.'
  };

  // Return mapped message or original message
  return errorMessages[error.code] || error.message || 'An error occurred';
}
