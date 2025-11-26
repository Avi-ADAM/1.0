/**
 * Tests for Action Registry
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerAction,
  getAction,
  getAllActionKeys,
  hasAction,
  clearRegistry
} from './registry.js';
import type { ActionConfig } from './types.js';

describe('Action Registry', () => {
  beforeEach(() => {
    // Clear registry before each test
    clearRegistry();
  });

  describe('registerAction', () => {
    it('should register a valid action configuration', () => {
      const config: ActionConfig = {
        key: 'testAction',
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {
          userId: {
            type: 'string',
            required: true
          }
        },
        authRules: [
          {
            type: 'jwt'
          }
        ]
      };

      registerAction(config);

      expect(hasAction('testAction')).toBe(true);
      expect(getAction('testAction')).toEqual(config);
    });

    it('should throw error for duplicate action keys', () => {
      const config: ActionConfig = {
        key: 'testAction',
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {},
        authRules: []
      };

      registerAction(config);

      expect(() => registerAction(config)).toThrow(
        'Action with key "testAction" is already registered'
      );
    });

    it('should throw error for missing key', () => {
      const config = {
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {},
        authRules: []
      } as any;

      expect(() => registerAction(config)).toThrow(
        'Action configuration must have a valid "key" field'
      );
    });

    it('should throw error for missing description', () => {
      const config = {
        key: 'testAction',
        graphqlOperation: '1testQuery',
        paramSchema: {},
        authRules: []
      } as any;

      expect(() => registerAction(config)).toThrow(
        'Action "testAction" must have a valid "description" field'
      );
    });

    it('should throw error for missing graphqlOperation', () => {
      const config = {
        key: 'testAction',
        description: 'Test action',
        paramSchema: {},
        authRules: []
      } as any;

      expect(() => registerAction(config)).toThrow(
        'Action "testAction" must have a valid "graphqlOperation" field'
      );
    });

    it('should throw error for invalid param schema', () => {
      const config: ActionConfig = {
        key: 'testAction',
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {
          userId: {
            type: 'invalid' as any,
            required: true
          }
        },
        authRules: []
      };

      expect(() => registerAction(config)).toThrow(
        'Parameter "userId" has invalid type "invalid"'
      );
    });

    it('should throw error for invalid auth rule type', () => {
      const config: ActionConfig = {
        key: 'testAction',
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {},
        authRules: [
          {
            type: 'invalid' as any
          }
        ]
      };

      expect(() => registerAction(config)).toThrow(
        'Auth rule has invalid type "invalid"'
      );
    });

    it('should validate notification configuration', () => {
      const config: ActionConfig = {
        key: 'testAction',
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {},
        authRules: [],
        notification: {
          recipients: {
            type: 'projectMembers'
          },
          templates: {
            title: {
              he: 'כותרת',
              en: 'Title'
            },
            body: {
              he: 'תוכן',
              en: 'Content'
            }
          },
          channels: ['socket', 'email']
        }
      };

      expect(() => registerAction(config)).not.toThrow();
    });

    it('should throw error for invalid notification channel', () => {
      const config: ActionConfig = {
        key: 'testAction',
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {},
        authRules: [],
        notification: {
          recipients: {
            type: 'projectMembers'
          },
          templates: {
            title: {
              he: 'כותרת',
              en: 'Title'
            },
            body: {
              he: 'תוכן',
              en: 'Content'
            }
          },
          channels: ['invalid' as any]
        }
      };

      expect(() => registerAction(config)).toThrow(
        'Invalid notification channel "invalid"'
      );
    });
  });

  describe('getAction', () => {
    it('should return undefined for non-existent action', () => {
      expect(getAction('nonExistent')).toBeUndefined();
    });

    it('should return registered action', () => {
      const config: ActionConfig = {
        key: 'testAction',
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {},
        authRules: []
      };

      registerAction(config);

      expect(getAction('testAction')).toEqual(config);
    });
  });

  describe('getAllActionKeys', () => {
    it('should return empty array when no actions registered', () => {
      expect(getAllActionKeys()).toEqual([]);
    });

    it('should return all registered action keys', () => {
      const config1: ActionConfig = {
        key: 'action1',
        description: 'Action 1',
        graphqlOperation: '1query1',
        paramSchema: {},
        authRules: []
      };

      const config2: ActionConfig = {
        key: 'action2',
        description: 'Action 2',
        graphqlOperation: '2query2',
        paramSchema: {},
        authRules: []
      };

      registerAction(config1);
      registerAction(config2);

      const keys = getAllActionKeys();
      expect(keys).toHaveLength(2);
      expect(keys).toContain('action1');
      expect(keys).toContain('action2');
    });
  });

  describe('hasAction', () => {
    it('should return false for non-existent action', () => {
      expect(hasAction('nonExistent')).toBe(false);
    });

    it('should return true for registered action', () => {
      const config: ActionConfig = {
        key: 'testAction',
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {},
        authRules: []
      };

      registerAction(config);

      expect(hasAction('testAction')).toBe(true);
    });
  });

  describe('clearRegistry', () => {
    it('should clear all registered actions', () => {
      const config: ActionConfig = {
        key: 'testAction',
        description: 'Test action',
        graphqlOperation: '1testQuery',
        paramSchema: {},
        authRules: []
      };

      registerAction(config);
      expect(hasAction('testAction')).toBe(true);

      clearRegistry();
      expect(hasAction('testAction')).toBe(false);
      expect(getAllActionKeys()).toEqual([]);
    });
  });
});
