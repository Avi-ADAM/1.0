/**
 * Migration Metrics API Endpoint
 * 
 * Provides access to migration metrics for monitoring and dashboard display.
 * 
 * GET /api/migration-metrics - Get summary metrics
 * GET /api/migration-metrics?period=3600000 - Get metrics for specific period (ms)
 * GET /api/migration-metrics?action=updateTask - Get metrics for specific action
 * GET /api/migration-metrics?raw=true - Get raw metrics data
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { migrationMetrics } from '$lib/server/metrics/MigrationMetrics';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const periodParam = url.searchParams.get('period');
    const actionParam = url.searchParams.get('action');
    const rawParam = url.searchParams.get('raw');
    const limitParam = url.searchParams.get('limit');
    
    // Parse period (default 1 hour)
    const period = periodParam ? parseInt(periodParam, 10) : 3600000;
    
    // Return raw metrics if requested
    if (rawParam === 'true') {
      const limit = limitParam ? parseInt(limitParam, 10) : 1000;
      const rawMetrics = migrationMetrics.getRawMetrics(limit);
      
      return json({
        success: true,
        data: {
          metrics: rawMetrics,
          count: rawMetrics.length
        }
      });
    }
    
    // Return action-specific metrics if requested
    if (actionParam) {
      const actionMetrics = migrationMetrics.getActionMetrics(actionParam, period);
      
      return json({
        success: true,
        data: {
          actionKey: actionParam,
          period,
          qidsMetrics: {
            count: actionMetrics.qids.length,
            successRate: actionMetrics.qids.length > 0
              ? (actionMetrics.qids.filter(m => m.success).length / actionMetrics.qids.length) * 100
              : 0,
            avgResponseTime: actionMetrics.qids.length > 0
              ? actionMetrics.qids.reduce((sum, m) => sum + m.responseTime, 0) / actionMetrics.qids.length
              : 0
          },
          actionMetrics: {
            count: actionMetrics.action.length,
            successRate: actionMetrics.action.length > 0
              ? (actionMetrics.action.filter(m => m.success).length / actionMetrics.action.length) * 100
              : 0,
            avgResponseTime: actionMetrics.action.length > 0
              ? actionMetrics.action.reduce((sum, m) => sum + m.responseTime, 0) / actionMetrics.action.length
              : 0
          }
        }
      });
    }
    
    // Return summary metrics
    const summary = migrationMetrics.getSummary(period);
    
    return json({
      success: true,
      data: {
        period,
        summary
      }
    });
    
  } catch (error) {
    console.error('Error fetching migration metrics:', error);
    
    return json({
      success: false,
      error: {
        code: 'METRICS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch metrics'
      }
    }, { status: 500 });
  }
};
