/**
 * Tests for updateTask Action Configuration
 * 
 * Validates that the updateTask action is properly configured
 * and registered in the action registry.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { clearRegistry, registerAction, getAction, hasAction } from '../registry.js';
import { updateTaskAction } from './updateTask.js';

describe('updateTask Action Configuration', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('should have all required fields', () => {
    expect(updateTaskAction.key).toBe('updateTask');
    expect(updateTaskAction.description).toBeTruthy();
    expect(updateTaskAction.graphqlOperation).toBe('31updateTask');
    expect(updateTaskAction.paramSchema).toBeDefined();
    expect(updateTaskAction.authRules).toBeDefined();
    expect(updateTaskAction.notification).toBeDefined();
    expect(updateTaskAction.updateStrategy).toBeDefined();
  });

  it('should have correct parameter schema', () => {
    const schema = updateTaskAction.paramSchema;
    
    // Required parameters
    expect(schema.id).toBeDefined();
    expect(schema.id.type).toBe('string');
    expect(schema.id.required).toBe(true);
    
    expect(schema.projectId).toBeDefined();
    expect(schema.projectId.type).toBe('string');
    expect(schema.projectId.required).toBe(true);
    
    // Optional parameters
    expect(schema.myIshur).toBeDefined();
    expect(schema.myIshur.type).toBe('boolean');
    expect(schema.myIshur.required).toBe(false);
    
    expect(schema.valiIshur).toBeDefined();
    expect(schema.valiIshur.type).toBe('boolean');
    expect(schema.valiIshur.required).toBe(false);
    
    expect(schema.isAssigned).toBeDefined();
    expect(schema.isAssigned.type).toBe('boolean');
    expect(schema.isAssigned.required).toBe(false);
    
    expect(schema.uid).toBeDefined();
    expect(schema.uid.type).toBe('array');
    expect(schema.uid.required).toBe(false);
    
    expect(schema.mesimabetahaliches).toBeDefined();
    expect(schema.mesimabetahaliches.type).toBe('array');
    expect(schema.mesimabetahaliches.required).toBe(false);
  });

  it('should have correct authorization rules', () => {
    const authRules = updateTaskAction.authRules;
    
    expect(authRules).toHaveLength(2);
    
    // JWT rule
    expect(authRules[0].type).toBe('jwt');
    expect(authRules[0].errorMessage).toBeTruthy();
    
    // Project membership rule
    expect(authRules[1].type).toBe('projectMember');
    expect(authRules[1].config?.projectIdParam).toBe('projectId');
    expect(authRules[1].errorMessage).toBeTruthy();
  });

  it('should have correct notification configuration', () => {
    const notification = updateTaskAction.notification!;
    
    // Recipients
    expect(notification.recipients.type).toBe('projectMembers');
    expect(notification.recipients.config?.projectIdParam).toBe('projectId');
    expect(notification.recipients.config?.excludeSender).toBe(true);
    
    // Templates
    expect(notification.templates.title.he).toBeTruthy();
    expect(notification.templates.title.en).toBeTruthy();
    expect(notification.templates.title.ar).toBeTruthy();
    
    expect(notification.templates.body.he).toBeTruthy();
    expect(notification.templates.body.en).toBeTruthy();
    expect(notification.templates.body.ar).toBeTruthy();
    
    // Channels
    expect(notification.channels).toContain('socket');
    expect(notification.channels).toContain('push');
    
    // Metadata
    expect(notification.metadata?.priority).toBe('normal');
    expect(notification.metadata?.url).toBeTruthy();
  });

  it('should have correct update strategy', () => {
    const strategy = updateTaskAction.updateStrategy!;
    
    expect(strategy.type).toBe('partialUpdate');
    expect(strategy.config?.dataKeys).toContain('arr1');
    expect(strategy.config?.updateFunction).toBe('refreshTaskList');
  });

  it('should register successfully', () => {
    expect(() => registerAction(updateTaskAction)).not.toThrow();
    expect(hasAction('updateTask')).toBe(true);
    
    const registered = getAction('updateTask');
    expect(registered).toBeDefined();
    expect(registered?.key).toBe('updateTask');
  });

  it('should not allow duplicate registration', () => {
    registerAction(updateTaskAction);
    expect(() => registerAction(updateTaskAction)).toThrow('already registered');
  });

  it('should validate configuration on registration', () => {
    // This test verifies that the configuration passes validation
    // by successfully registering it
    expect(() => registerAction(updateTaskAction)).not.toThrow();
  });
});
