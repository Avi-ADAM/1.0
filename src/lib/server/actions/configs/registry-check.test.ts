/**
 * Registry Check Test
 * 
 * Verifies that actions are properly registered when the module is imported.
 */

import { describe, it, expect } from 'vitest';
import { getAction, hasAction, getAllActionKeys } from '../registry.js';
// Import the index to trigger registration
import './index.js';

describe('Action Registry', () => {
  it('should have updateTask action registered', () => {
    expect(hasAction('updateTask')).toBe(true);
  });

  it('should be able to retrieve updateTask action', () => {
    const action = getAction('updateTask');
    expect(action).toBeDefined();
    expect(action?.key).toBe('updateTask');
    expect(action?.graphqlOperation).toBe('31updateTask');
  });

  it('should list all registered actions', () => {
    const keys = getAllActionKeys();
    expect(keys).toContain('updateTask');
    expect(keys.length).toBeGreaterThan(0);
  });

  it('should return undefined for non-existent action', () => {
    const action = getAction('nonExistentAction');
    expect(action).toBeUndefined();
  });

  it('should return false for non-existent action check', () => {
    expect(hasAction('nonExistentAction')).toBe(false);
  });
});
