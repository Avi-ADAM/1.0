/**
 * Property-Based Tests for Action Registry
 * 
 * These tests verify universal properties that should hold across
 * all possible inputs using fast-check for property-based testing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  registerAction,
  getAction,
  hasAction,
  clearRegistry
} from './registry.js';
import type { ActionConfig } from './types.js';

describe('Action Registry - Property-Based Tests', () => {
  beforeEach(() => {
    clearRegistry();
  });

  /**
   * Property: Registered actions can always be retrieved
   * 
   * For any valid action configuration, after registering it,
   * we should be able to retrieve it by its key.
   */
  it('registered actions can always be retrieved', () => {
    fc.assert(
      fc.property(
        // Generate random valid action configurations
        fc.record({
          key: fc.string({ minLength: 1, maxLength: 50 }),
          description: fc.string({ minLength: 1, maxLength: 200 }),
          graphqlOperation: fc.string({ minLength: 1, maxLength: 50 })
        }),
        (actionData) => {
          // Clear registry for each iteration
          clearRegistry();
          
          // Create a valid action config
          const config: ActionConfig = {
            key: actionData.key,
            description: actionData.description,
            graphqlOperation: actionData.graphqlOperation,
            paramSchema: {},
            authRules: []
          };
          
          // Register the action
          registerAction(config);
          
          // Verify we can retrieve it
          const retrieved = getAction(actionData.key);
          expect(retrieved).toBeDefined();
          expect(retrieved?.key).toBe(actionData.key);
          expect(retrieved?.description).toBe(actionData.description);
          expect(retrieved?.graphqlOperation).toBe(actionData.graphqlOperation);
          
          // Verify hasAction returns true
          expect(hasAction(actionData.key)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Duplicate keys are always rejected
   * 
   * For any action key, attempting to register two actions with
   * the same key should always fail on the second registration.
   */
  it('duplicate keys are always rejected', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (key, description, graphqlOperation) => {
          // Clear registry for each iteration
          clearRegistry();
          
          // Create first action
          const config1: ActionConfig = {
            key,
            description,
            graphqlOperation,
            paramSchema: {},
            authRules: []
          };
          
          // Create second action with same key
          const config2: ActionConfig = {
            key,
            description: description + ' (duplicate)',
            graphqlOperation: graphqlOperation + '2',
            paramSchema: {},
            authRules: []
          };
          
          // First registration should succeed
          registerAction(config1);
          
          // Second registration should fail
          expect(() => registerAction(config2)).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Invalid parameter types are always rejected
   * 
   * For any action configuration with invalid parameter types,
   * registration should always fail with a descriptive error.
   */
  it('invalid parameter types are always rejected', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string().filter(type => !['string', 'number', 'boolean', 'array', 'object'].includes(type)),
        (key, paramName, invalidType) => {
          // Clear registry for each iteration
          clearRegistry();
          
          // Create action with invalid param type
          const config: ActionConfig = {
            key,
            description: 'Test action',
            graphqlOperation: '1test',
            paramSchema: {
              [paramName]: {
                type: invalidType as any,
                required: true
              }
            },
            authRules: []
          };
          
          // Registration should fail
          expect(() => registerAction(config)).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Actions with valid notification configs are accepted
   * 
   * For any action with a properly structured notification configuration,
   * registration should succeed.
   */
  it('valid notification configurations are accepted', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.array(fc.constantFrom('socket', 'email', 'telegram', 'push'), { minLength: 1, maxLength: 4 }),
        (key, titleHe, bodyHe, channels) => {
          // Clear registry for each iteration
          clearRegistry();
          
          // Create action with notification config
          const config: ActionConfig = {
            key,
            description: 'Test action',
            graphqlOperation: '1test',
            paramSchema: {},
            authRules: [],
            notification: {
              recipients: {
                type: 'projectMembers'
              },
              templates: {
                title: {
                  he: titleHe,
                  en: 'Title EN'
                },
                body: {
                  he: bodyHe,
                  en: 'Body EN'
                }
              },
              channels: channels as any
            }
          };
          
          // Registration should succeed
          expect(() => registerAction(config)).not.toThrow();
          
          // Verify we can retrieve it
          const retrieved = getAction(key);
          expect(retrieved).toBeDefined();
          expect(retrieved?.notification?.templates.title.he).toBe(titleHe);
          expect(retrieved?.notification?.channels).toEqual(channels);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Clearing registry removes all actions
   * 
   * For any set of registered actions, clearing the registry
   * should result in an empty registry.
   */
  it('clearing registry removes all actions', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            key: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ minLength: 1, maxLength: 200 }),
            graphqlOperation: fc.string({ minLength: 1, maxLength: 50 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (actions) => {
          // Clear registry for each iteration
          clearRegistry();
          
          // Register all actions (with unique keys)
          const uniqueActions = new Map();
          for (const action of actions) {
            if (!uniqueActions.has(action.key)) {
              uniqueActions.set(action.key, action);
            }
          }
          
          for (const action of uniqueActions.values()) {
            const config: ActionConfig = {
              key: action.key,
              description: action.description,
              graphqlOperation: action.graphqlOperation,
              paramSchema: {},
              authRules: []
            };
            registerAction(config);
          }
          
          // Verify actions are registered
          expect(uniqueActions.size).toBeGreaterThan(0);
          for (const key of uniqueActions.keys()) {
            expect(hasAction(key)).toBe(true);
          }
          
          // Clear registry
          clearRegistry();
          
          // Verify all actions are removed
          for (const key of uniqueActions.keys()) {
            expect(hasAction(key)).toBe(false);
            expect(getAction(key)).toBeUndefined();
          }
        }
      ),
      { numRuns: 50 } // Fewer runs since this test is more complex
    );
  });
});
