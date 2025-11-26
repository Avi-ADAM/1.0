/**
 * Migration Metrics Tests
 * 
 * Tests for the migration metrics collection and aggregation system.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { migrationMetrics } from './MigrationMetrics';

describe('MigrationMetrics', () => {
  beforeEach(() => {
    // Clear metrics before each test
    migrationMetrics.clear();
  });
  
  describe('record', () => {
    it('should record a metric entry', () => {
      migrationMetrics.record({
        system: 'action',
        actionKey: 'updateTask',
        userId: 'user123',
        success: true,
        responseTime: 250
      });
      
      const summary = migrationMetrics.getSummary();
      expect(summary.totalRequests).toBe(1);
      expect(summary.actionRequests).toBe(1);
      expect(summary.qidsRequests).toBe(0);
    });
    
    it('should record multiple metrics', () => {
      migrationMetrics.record({
        system: 'action',
        actionKey: 'updateTask',
        userId: 'user123',
        success: true,
        responseTime: 250
      });
      
      migrationMetrics.record({
        system: 'qids',
        actionKey: 'updateTask',
        userId: 'user456',
        success: true,
        responseTime: 300
      });
      
      const summary = migrationMetrics.getSummary();
      expect(summary.totalRequests).toBe(2);
      expect(summary.actionRequests).toBe(1);
      expect(summary.qidsRequests).toBe(1);
    });
  });
  
  describe('getSummary', () => {
    it('should return empty summary when no metrics', () => {
      const summary = migrationMetrics.getSummary();
      
      expect(summary.totalRequests).toBe(0);
      expect(summary.qidsRequests).toBe(0);
      expect(summary.actionRequests).toBe(0);
      expect(summary.migrationPercentage).toBe(0);
    });
    
    it('should calculate migration percentage correctly', () => {
      // Add 3 action requests and 1 qids request
      migrationMetrics.record({
        system: 'action',
        actionKey: 'updateTask',
        userId: 'user1',
        success: true,
        responseTime: 200
      });
      
      migrationMetrics.record({
        system: 'action',
        actionKey: 'createTask',
        userId: 'user2',
        success: true,
        responseTime: 250
      });
      
      migrationMetrics.record({
        system: 'action',
        actionKey: 'deleteTask',
        userId: 'user3',
        success: true,
        responseTime: 150
      });
      
      migrationMetrics.record({
        system: 'qids',
        actionKey: 'updateUser',
        userId: 'user4',
        success: true,
        responseTime: 300
      });
      
      const summary = migrationMetrics.getSummary();
      
      expect(summary.totalRequests).toBe(4);
      expect(summary.actionRequests).toBe(3);
      expect(summary.qidsRequests).toBe(1);
      expect(summary.migrationPercentage).toBe(75); // 3/4 = 75%
    });
    
    it('should calculate error rates correctly', () => {
      // Add 2 successful and 1 failed action request
      migrationMetrics.record({
        system: 'action',
        actionKey: 'updateTask',
        userId: 'user1',
        success: true,
        responseTime: 200
      });
      
      migrationMetrics.record({
        system: 'action',
        actionKey: 'updateTask',
        userId: 'user2',
        success: false,
        responseTime: 150,
        error: 'Validation failed'
      });
      
      migrationMetrics.record({
        system: 'action',
        actionKey: 'updateTask',
        userId: 'user3',
        success: true,
        responseTime: 250
      });
      
      const summary = migrationMetrics.getSummary();
      
      expect(summary.errorRates.action).toBeCloseTo(33.33, 1); // 1/3 = 33.33%
    });
    
    it('should calculate average response times correctly', () => {
      migrationMetrics.record({
        system: 'action',
        actionKey: 'updateTask',
        userId: 'user1',
        success: true,
        responseTime: 200
      });
      
      migrationMetrics.record({
        system: 'action',
        actionKey: 'updateTask',
        userId: 'user2',
        success: true,
        responseTime: 300
      });
      
      migrationMetrics.record({
        system: 'qids',
        actionKey: 'updateTask',
        userId: 'user3',
        success: true,
        responseTime: 400
      });
      
      const summary = migrationMetrics.getSummary();
      
      expect(summary.avgResponseTimes.action).toBe(250); // (200 + 300) / 2
      expect(summary.avgResponseTimes.qids).toBe(400);
    });
    
    it('should build action breakdown correctly', () => {
      migrationMetrics.record({
        system: 'action',
        actionKey: 'updateTask',
        userId: 'user1',
        success: true,
        responseTime: 200
      });
      
      migrationMetrics.record({
        system: 'qids',
        actionKey: 'updateTask',
        userId: 'user2',
        success: true,
        responseTime: 300
      });
      
      migrationMetrics.record({
        system: 'qids',
        actionKey: 'createUser',
        userId: 'user3',
        success: true,
        responseTime: 250
      });
      
      const summary = migrationMetrics.getSummary();
      
      expect(summary.actionBreakdown['updateTask']).toEqual({
        qids: 1,
        action: 1,
        migrated: true
      });
      
      expect(summary.actionBreakdown['createUser']).toEqual({
        qids: 1,
        action: 0,
        migrated: false
      });
    });
    
    it('should filter by time period', () => {
      // Add an old metric (2 hours ago)
      const oldMetric = {
        system: 'qids' as const,
        actionKey: 'oldAction',
        userId: 'user1',
        success: true,
        responseTime: 200
      };
      
      // Manually add with old timestamp
      (migrationMetrics as any).metrics.push({
        ...oldMetric,
        timestamp: Date.now() - 7200000 // 2 hours ago
      });
      
      // Add a recent metric
      migrationMetrics.record({
        system: 'action',
        actionKey: 'newAction',
        userId: 'user2',
        success: true,
        responseTime: 250
      });
      
      // Get summary for last hour
      const summary = migrationMetrics.getSummary(3600000);
      
      // Should only include the recent metric
      expect(summary.totalRequests).toBe(1);
      expect(summary.actionRequests).toBe(1);
      expect(summary.qidsRequests).toBe(0);
    });
  });
  
  describe('getActionMetrics', () => {
    it('should return metrics for specific action', () => {
      migrationMetrics.record({
        system: 'action',
        actionKey: 'updateTask',
        userId: 'user1',
        success: true,
        responseTime: 200
      });
      
      migrationMetrics.record({
        system: 'qids',
        actionKey: 'updateTask',
        userId: 'user2',
        success: true,
        responseTime: 300
      });
      
      migrationMetrics.record({
        system: 'action',
        actionKey: 'createTask',
        userId: 'user3',
        success: true,
        responseTime: 250
      });
      
      const metrics = migrationMetrics.getActionMetrics('updateTask');
      
      expect(metrics.action.length).toBe(1);
      expect(metrics.qids.length).toBe(1);
      expect(metrics.action[0].actionKey).toBe('updateTask');
      expect(metrics.qids[0].actionKey).toBe('updateTask');
    });
  });
  
  describe('getRawMetrics', () => {
    it('should return raw metrics with limit', () => {
      // Add 5 metrics
      for (let i = 0; i < 5; i++) {
        migrationMetrics.record({
          system: 'action',
          actionKey: `action${i}`,
          userId: `user${i}`,
          success: true,
          responseTime: 200 + i * 10
        });
      }
      
      const raw = migrationMetrics.getRawMetrics(3);
      
      expect(raw.length).toBe(3);
      // Should return the last 3
      expect(raw[0].actionKey).toBe('action2');
      expect(raw[1].actionKey).toBe('action3');
      expect(raw[2].actionKey).toBe('action4');
    });
  });
  
  describe('clear', () => {
    it('should clear all metrics', () => {
      migrationMetrics.record({
        system: 'action',
        actionKey: 'updateTask',
        userId: 'user1',
        success: true,
        responseTime: 200
      });
      
      expect(migrationMetrics.getSummary().totalRequests).toBe(1);
      
      migrationMetrics.clear();
      
      expect(migrationMetrics.getSummary().totalRequests).toBe(0);
    });
  });
});
