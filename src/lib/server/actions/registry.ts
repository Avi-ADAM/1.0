/**
 * Action Registry
 * 
 * Central registry for all action configurations. Actions are registered
 * at startup and can be retrieved by their key.
 */

import type { ActionConfig } from './types.js';

/**
 * Global registry of all actions
 */
export const actionRegistry: Map<string, ActionConfig> = new Map();

/**
 * Register an action configuration
 * 
 * @param config - The action configuration to register
 * @throws Error if action key already exists or configuration is invalid
 */
export function registerAction(config: ActionConfig): void {
  // Validate configuration
  validateActionConfig(config);
  
  // Check for duplicate keys
  if (actionRegistry.has(config.key)) {
    throw new Error(`Action with key "${config.key}" is already registered`);
  }
  
  // Register the action
  actionRegistry.set(config.key, config);
}

/**
 * Get an action configuration by key
 * 
 * @param key - The action key
 * @returns The action configuration, or undefined if not found
 */
export function getAction(key: string): ActionConfig | undefined {
  return actionRegistry.get(key);
}

/**
 * Get all registered action keys
 * 
 * @returns Array of all registered action keys
 */
export function getAllActionKeys(): string[] {
  return Array.from(actionRegistry.keys());
}

/**
 * Check if an action is registered
 * 
 * @param key - The action key
 * @returns True if the action is registered
 */
export function hasAction(key: string): boolean {
  return actionRegistry.has(key);
}

/**
 * Clear all registered actions (useful for testing)
 */
export function clearRegistry(): void {
  actionRegistry.clear();
}

/**
 * Validate action configuration
 * 
 * @param config - The action configuration to validate
 * @throws Error if configuration is invalid
 */
function validateActionConfig(config: ActionConfig): void {
  // Check required fields
  if (!config.key || typeof config.key !== 'string') {
    throw new Error('Action configuration must have a valid "key" field');
  }
  
  if (!config.description || typeof config.description !== 'string') {
    throw new Error(`Action "${config.key}" must have a valid "description" field`);
  }
  
  if (!config.graphqlOperation || typeof config.graphqlOperation !== 'string') {
    throw new Error(`Action "${config.key}" must have a valid "graphqlOperation" field`);
  }
  
  if (!config.paramSchema || typeof config.paramSchema !== 'object') {
    throw new Error(`Action "${config.key}" must have a valid "paramSchema" field`);
  }
  
  if (!Array.isArray(config.authRules)) {
    throw new Error(`Action "${config.key}" must have a valid "authRules" array`);
  }
  
  // Validate param schema
  for (const [paramName, paramRule] of Object.entries(config.paramSchema)) {
    if (!paramRule.type) {
      throw new Error(
        `Action "${config.key}": Parameter "${paramName}" must have a "type" field`
      );
    }
    
    if (!['string', 'number', 'boolean', 'array', 'object'].includes(paramRule.type)) {
      throw new Error(
        `Action "${config.key}": Parameter "${paramName}" has invalid type "${paramRule.type}"`
      );
    }
    
    if (typeof paramRule.required !== 'boolean') {
      throw new Error(
        `Action "${config.key}": Parameter "${paramName}" must have a boolean "required" field`
      );
    }
  }
  
  // Validate auth rules
  for (const rule of config.authRules) {
    if (!rule.type) {
      throw new Error(`Action "${config.key}": Auth rule must have a "type" field`);
    }
    
    if (!['jwt', 'projectMember', 'role', 'custom'].includes(rule.type)) {
      throw new Error(
        `Action "${config.key}": Auth rule has invalid type "${rule.type}"`
      );
    }
  }
  
  // Validate notification config if present
  if (config.notification) {
    const notif = config.notification;
    
    if (!notif.recipients || !notif.recipients.type) {
      throw new Error(
        `Action "${config.key}": Notification must have a valid "recipients" configuration`
      );
    }
    
    if (!notif.templates || !notif.templates.title || !notif.templates.body) {
      throw new Error(
        `Action "${config.key}": Notification must have valid "templates" with title and body`
      );
    }
    
    if (!notif.templates.title.he || !notif.templates.title.en) {
      throw new Error(
        `Action "${config.key}": Notification title must have Hebrew (he) and English (en) translations`
      );
    }
    
    if (!notif.templates.body.he || !notif.templates.body.en) {
      throw new Error(
        `Action "${config.key}": Notification body must have Hebrew (he) and English (en) translations`
      );
    }
    
    if (!Array.isArray(notif.channels) || notif.channels.length === 0) {
      throw new Error(
        `Action "${config.key}": Notification must have at least one channel`
      );
    }
    
    for (const channel of notif.channels) {
      if (!['socket', 'email', 'telegram', 'push'].includes(channel)) {
        throw new Error(
          `Action "${config.key}": Invalid notification channel "${channel}"`
        );
      }
    }
  }
  
  // Validate update strategy if present
  if (config.updateStrategy) {
    if (!config.updateStrategy.type) {
      throw new Error(
        `Action "${config.key}": Update strategy must have a "type" field`
      );
    }
    
    if (!['fullRefresh', 'partialUpdate', 'optimistic', 'none'].includes(config.updateStrategy.type)) {
      throw new Error(
        `Action "${config.key}": Invalid update strategy type "${config.updateStrategy.type}"`
      );
    }
  }
}

// Note: Actions are registered via configs/index.ts
// The configs/index.ts file is imported by the ActionService and API endpoint
