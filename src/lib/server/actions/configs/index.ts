/**
 * Action Configuration Index
 * 
 * This file imports and registers all action configurations.
 * Actions are registered at module load time.
 */

import { registerAction } from '../registry.js';
import { updateTaskAction } from './updateTask.js';
import { approveHalukaConfig } from './approveHaluka.js';
import { createHalukaConfig } from './createHaluka.js';
import { createTosplitConfig } from './createTosplit.js';
import { createSheirutpendConfig } from './createSheirutpend.js';

/**
 * Register all actions
 * 
 * This function is called automatically when the module is imported.
 * It registers all action configurations with the action registry.
 */
export function registerAllActions(): void {
  // Register all actions
  registerAction(updateTaskAction);
  registerAction(approveHalukaConfig);
  registerAction(createHalukaConfig);
  registerAction(createTosplitConfig);
  registerAction(createSheirutpendConfig);
  
  // Future actions will be registered here
  // registerAction(createMessageAction);
  // registerAction(createTaskAction);
  // etc.
}

// Auto-register actions when module is imported
registerAllActions();

// Export individual actions for testing
export { 
  updateTaskAction,
  approveHalukaConfig,
  createHalukaConfig,
  createTosplitConfig
};
