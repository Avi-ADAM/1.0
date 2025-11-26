/**
 * Update Strategy Helpers
 * 
 * This module provides common update strategy functions that can be used
 * with the optimistic update strategy. These functions handle typical
 * UI update patterns after actions complete.
 * 
 * Usage:
 * ```typescript
 * import { registerUpdateStrategies } from '$lib/client/updateStrategies';
 * 
 * // Register all strategies globally (usually in +layout.svelte)
 * registerUpdateStrategies();
 * 
 * // Or use individual strategies
 * import { updateTaskList } from '$lib/client/updateStrategies';
 * updateTaskList(data);
 * ```
 */

import { browser } from '$app/environment';
import { invalidate } from '$app/navigation';
import { get } from 'svelte/store';

/**
 * Update strategy function type
 */
export type UpdateStrategyFunction = (data: any, config?: any) => void | Promise<void>;

/**
 * Registry of update strategy functions
 */
const strategies: Record<string, UpdateStrategyFunction> = {};

/**
 * Register an update strategy function
 * 
 * @param name - Name of the strategy
 * @param fn - Function to execute
 */
export function registerStrategy(name: string, fn: UpdateStrategyFunction): void {
  strategies[name] = fn;
  
  // Also register on window for global access
  if (browser) {
    if (!(window as any).updateStrategies) {
      (window as any).updateStrategies = {};
    }
    (window as any).updateStrategies[name] = fn;
  }
}

/**
 * Get a registered update strategy function
 * 
 * @param name - Name of the strategy
 * @returns The strategy function or null if not found
 */
export function getStrategy(name: string): UpdateStrategyFunction | null {
  return strategies[name] || null;
}

/**
 * Register all built-in update strategies
 * 
 * Call this once in your root layout to make all strategies available.
 */
export function registerUpdateStrategies(): void {
  // Task/Mission updates
  registerStrategy('updateTaskList', updateTaskList);
  registerStrategy('updateTask', updateTask);
  registerStrategy('updateMissionList', updateMissionList);
  
  // Project updates
  registerStrategy('updateProjectData', updateProjectData);
  registerStrategy('updateProjectMembers', updateProjectMembers);
  
  // Chat/Forum updates
  registerStrategy('updateForumMessages', updateForumMessages);
  registerStrategy('updateChatList', updateChatList);
  
  // User profile updates
  registerStrategy('updateUserProfile', updateUserProfile);
  
  // Haluka (distribution) updates
  registerStrategy('updateHalukaList', updateHalukaList);
  
  // Negotiation updates
  registerStrategy('updateNegotiationState', updateNegotiationState);
  
  // Timer updates
  registerStrategy('updateTimerState', updateTimerState);
  
  console.log('[UpdateStrategies] Registered all built-in strategies');
}

// ============================================================================
// Built-in Update Strategy Functions
// ============================================================================

/**
 * Update task list after task creation/update/deletion
 * 
 * Invalidates the arr1 (task list) data key to trigger a refresh.
 */
export async function updateTaskList(data: any, config?: any): Promise<void> {
  console.log('[UpdateStrategies] Updating task list');
  
  if (browser) {
    // Invalidate the task list data
    await invalidate('arr1');
    
    // If specific project ID provided, invalidate that project's data
    if (config?.projectId) {
      await invalidate(`project:${config.projectId}`);
    }
  }
}

/**
 * Update a specific task in the UI
 * 
 * This is more efficient than refreshing the entire list.
 */
export function updateTask(data: any, config?: any): void {
  console.log('[UpdateStrategies] Updating specific task', { taskId: data?.id });
  
  if (!browser) return;
  
  // Dispatch custom event that components can listen to
  const event = new CustomEvent('task-updated', {
    detail: {
      taskId: data?.id || config?.taskId,
      task: data
    }
  });
  
  window.dispatchEvent(event);
}

/**
 * Update mission list after mission changes
 */
export async function updateMissionList(data: any, config?: any): Promise<void> {
  console.log('[UpdateStrategies] Updating mission list');
  
  if (browser) {
    // Invalidate mission-related data
    await invalidate('missions');
    await invalidate('pendingMissions');
    
    // Also update task list as missions affect tasks
    await invalidate('arr1');
  }
}

/**
 * Update project data after project changes
 */
export async function updateProjectData(data: any, config?: any): Promise<void> {
  console.log('[UpdateStrategies] Updating project data', {
    projectId: data?.projectId || config?.projectId
  });
  
  if (browser) {
    const projectId = data?.projectId || config?.projectId;
    
    if (projectId) {
      // Invalidate specific project data
      await invalidate(`project:${projectId}`);
    } else {
      // Invalidate all project data
      await invalidate('projects');
    }
  }
}

/**
 * Update project members list
 */
export async function updateProjectMembers(data: any, config?: any): Promise<void> {
  console.log('[UpdateStrategies] Updating project members');
  
  if (browser) {
    const projectId = data?.projectId || config?.projectId;
    
    if (projectId) {
      await invalidate(`project:${projectId}:members`);
      await invalidate(`project:${projectId}`);
    }
  }
}

/**
 * Update forum messages after new message
 */
export async function updateForumMessages(data: any, config?: any): Promise<void> {
  console.log('[UpdateStrategies] Updating forum messages', {
    forumId: data?.forumId || config?.forumId
  });
  
  if (browser) {
    const forumId = data?.forumId || config?.forumId;
    
    if (forumId) {
      await invalidate(`forum:${forumId}`);
    } else {
      await invalidate('forums');
    }
  }
}

/**
 * Update chat list
 */
export async function updateChatList(data: any, config?: any): Promise<void> {
  console.log('[UpdateStrategies] Updating chat list');
  
  if (browser) {
    await invalidate('chats');
    await invalidate('forums');
  }
}

/**
 * Update user profile data
 */
export async function updateUserProfile(data: any, config?: any): Promise<void> {
  console.log('[UpdateStrategies] Updating user profile', {
    userId: data?.userId || config?.userId
  });
  
  if (browser) {
    const userId = data?.userId || config?.userId;
    
    if (userId) {
      await invalidate(`user:${userId}`);
    }
    
    // Also invalidate current user data
    await invalidate('currentUser');
  }
}

/**
 * Update haluka (distribution) list
 */
export async function updateHalukaList(data: any, config?: any): Promise<void> {
  console.log('[UpdateStrategies] Updating haluka list');
  
  if (browser) {
    await invalidate('halukas');
    
    // Also update project data as halukas are project-related
    if (config?.projectId) {
      await invalidate(`project:${config.projectId}`);
    }
  }
}

/**
 * Update negotiation state
 */
export async function updateNegotiationState(data: any, config?: any): Promise<void> {
  console.log('[UpdateStrategies] Updating negotiation state', {
    negotiationId: data?.negotiationId || config?.negotiationId
  });
  
  if (browser) {
    const negotiationId = data?.negotiationId || config?.negotiationId;
    
    if (negotiationId) {
      await invalidate(`negotiation:${negotiationId}`);
    } else {
      await invalidate('negotiations');
    }
  }
}

/**
 * Update timer state (optimistic update for better UX)
 */
export function updateTimerState(data: any, config?: any): void {
  console.log('[UpdateStrategies] Updating timer state', {
    timerId: data?.timerId || config?.timerId,
    action: config?.action
  });
  
  if (!browser) return;
  
  // Dispatch custom event for timer components
  const event = new CustomEvent('timer-updated', {
    detail: {
      timerId: data?.timerId || config?.timerId,
      action: config?.action, // 'start', 'stop', 'save'
      data
    }
  });
  
  window.dispatchEvent(event);
}

// ============================================================================
// Store Integration Helpers
// ============================================================================

/**
 * Create an update strategy that updates a Svelte store
 * 
 * @param store - Svelte writable store
 * @param updateFn - Function to update the store value
 * @returns Update strategy function
 */
export function createStoreUpdateStrategy<T>(
  store: { update: (fn: (value: T) => T) => void },
  updateFn: (currentValue: T, data: any, config?: any) => T
): UpdateStrategyFunction {
  return (data: any, config?: any) => {
    store.update(current => updateFn(current, data, config));
  };
}

/**
 * Create an update strategy that appends to an array store
 * 
 * @param store - Svelte writable store containing an array
 * @returns Update strategy function
 */
export function createAppendStrategy<T>(
  store: { update: (fn: (value: T[]) => T[]) => void }
): UpdateStrategyFunction {
  return (data: any) => {
    store.update(current => [...current, data]);
  };
}

/**
 * Create an update strategy that removes from an array store
 * 
 * @param store - Svelte writable store containing an array
 * @param idKey - Key to use for identifying items (default: 'id')
 * @returns Update strategy function
 */
export function createRemoveStrategy<T extends Record<string, any>>(
  store: { update: (fn: (value: T[]) => T[]) => void },
  idKey: string = 'id'
): UpdateStrategyFunction {
  return (data: any) => {
    const idToRemove = data?.[idKey];
    if (!idToRemove) return;
    
    store.update(current => current.filter(item => item[idKey] !== idToRemove));
  };
}

/**
 * Create an update strategy that updates an item in an array store
 * 
 * @param store - Svelte writable store containing an array
 * @param idKey - Key to use for identifying items (default: 'id')
 * @returns Update strategy function
 */
export function createUpdateItemStrategy<T extends Record<string, any>>(
  store: { update: (fn: (value: T[]) => T[]) => void },
  idKey: string = 'id'
): UpdateStrategyFunction {
  return (data: any) => {
    const idToUpdate = data?.[idKey];
    if (!idToUpdate) return;
    
    store.update(current =>
      current.map(item =>
        item[idKey] === idToUpdate ? { ...item, ...data } : item
      )
    );
  };
}

// ============================================================================
// Socket Integration
// ============================================================================

/**
 * Handle socket notification with update strategy
 * 
 * This function can be used as a socket notification listener to automatically
 * apply update strategies when receiving real-time updates.
 * 
 * @param notification - Notification payload from socket
 */
export async function handleSocketUpdate(notification: any): Promise<void> {
  console.log('[UpdateStrategies] Handling socket update', {
    actionKey: notification.actionKey,
    hasUpdateStrategy: !!notification.updateStrategy
  });
  
  if (!notification.updateStrategy) {
    console.log('[UpdateStrategies] No update strategy in socket notification');
    return;
  }
  
  const strategy = notification.updateStrategy;
  
  // Execute the update strategy
  if (strategy.type === 'optimistic' && strategy.config?.updateFunction) {
    const fn = getStrategy(strategy.config.updateFunction);
    if (fn) {
      await fn(notification.data, strategy.config);
    }
  } else if (strategy.type === 'partialUpdate' && strategy.config?.dataKeys) {
    for (const key of strategy.config.dataKeys) {
      await invalidate(key);
    }
  } else if (strategy.type === 'fullRefresh') {
    await invalidate(() => true);
  }
}
