/**
 * Migration Metrics Usage Examples
 * 
 * This file demonstrates how to use the migration metrics system
 * to track the transition from QIDS to Action System.
 */

import { migrationMetrics } from '../MigrationMetrics';
import { trackQidsCall } from '../QidsMetricsWrapper';

// ============================================================================
// Example 1: Tracking a QIDS Call
// ============================================================================

/**
 * Before migration - no tracking
 */
async function updateTaskOld(taskId: string, status: string, userId: string, fetch: typeof globalThis.fetch) {
  const result = await fetch('/api/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      qid: '31updateTask',
      variables: { taskId, status }
    })
  });
  
  return result.json();
}

/**
 * During migration - with tracking
 */
async function updateTaskWithTracking(taskId: string, status: string, userId: string, fetch: typeof globalThis.fetch) {
  return trackQidsCall(
    'updateTask', // Action key for metrics
    userId,
    async () => {
      const result = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qid: '31updateTask',
          variables: { taskId, status }
        })
      });
      
      return result.json();
    }
  );
}

// ============================================================================
// Example 2: Action System (Automatic Tracking)
// ============================================================================

/**
 * After migration - automatic tracking via ActionService
 * No additional code needed!
 */
async function updateTaskNew(taskId: string, status: string, userId: string, jwt: string, fetch: typeof globalThis.fetch) {
  const result = await fetch('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actionKey: 'updateTask',
      params: { taskId, status }
    })
  });
  
  return result.json();
}

// ============================================================================
// Example 3: Accessing Metrics Programmatically
// ============================================================================

/**
 * Get migration summary for the last hour
 */
function getMigrationSummary() {
  const summary = migrationMetrics.getSummary(3600000); // 1 hour
  
  console.log('Migration Progress:', {
    totalRequests: summary.totalRequests,
    migrationPercentage: `${summary.migrationPercentage.toFixed(1)}%`,
    qidsRequests: summary.qidsRequests,
    actionRequests: summary.actionRequests,
    errorRates: {
      qids: `${summary.errorRates.qids.toFixed(2)}%`,
      action: `${summary.errorRates.action.toFixed(2)}%`
    },
    avgResponseTimes: {
      qids: `${summary.avgResponseTimes.qids}ms`,
      action: `${summary.avgResponseTimes.action}ms`
    }
  });
  
  return summary;
}

/**
 * Get metrics for a specific action
 */
function getActionMetrics(actionKey: string) {
  const metrics = migrationMetrics.getActionMetrics(actionKey, 3600000);
  
  console.log(`Metrics for ${actionKey}:`, {
    qidsCount: metrics.qids.length,
    actionCount: metrics.action.length,
    qidsSuccessRate: metrics.qids.length > 0
      ? `${(metrics.qids.filter(m => m.success).length / metrics.qids.length * 100).toFixed(1)}%`
      : 'N/A',
    actionSuccessRate: metrics.action.length > 0
      ? `${(metrics.action.filter(m => m.success).length / metrics.action.length * 100).toFixed(1)}%`
      : 'N/A'
  });
  
  return metrics;
}

/**
 * Check if an action has been migrated
 */
function isActionMigrated(actionKey: string): boolean {
  const summary = migrationMetrics.getSummary();
  const breakdown = summary.actionBreakdown[actionKey];
  
  return breakdown?.migrated || false;
}

/**
 * Get list of all migrated actions
 */
function getMigratedActions(): string[] {
  const summary = migrationMetrics.getSummary();
  
  return Object.entries(summary.actionBreakdown)
    .filter(([_, data]) => data.migrated)
    .map(([actionKey, _]) => actionKey);
}

/**
 * Get list of actions that need migration
 */
function getUnmigratedActions(): string[] {
  const summary = migrationMetrics.getSummary();
  
  return Object.entries(summary.actionBreakdown)
    .filter(([_, data]) => !data.migrated)
    .map(([actionKey, _]) => actionKey);
}

// ============================================================================
// Example 4: Monitoring and Alerts
// ============================================================================

/**
 * Check if error rate is acceptable
 */
function checkErrorRates(): { ok: boolean; message: string } {
  const summary = migrationMetrics.getSummary();
  const threshold = 5; // 5% error rate threshold
  
  if (summary.errorRates.action > threshold) {
    return {
      ok: false,
      message: `Action System error rate (${summary.errorRates.action.toFixed(2)}%) exceeds threshold (${threshold}%)`
    };
  }
  
  if (summary.errorRates.qids > threshold) {
    return {
      ok: false,
      message: `QIDS error rate (${summary.errorRates.qids.toFixed(2)}%) exceeds threshold (${threshold}%)`
    };
  }
  
  return {
    ok: true,
    message: 'Error rates are within acceptable limits'
  };
}

/**
 * Check if response times are acceptable
 */
function checkResponseTimes(): { ok: boolean; message: string } {
  const summary = migrationMetrics.getSummary();
  const threshold = 1000; // 1 second threshold
  
  if (summary.avgResponseTimes.action > threshold) {
    return {
      ok: false,
      message: `Action System response time (${summary.avgResponseTimes.action}ms) exceeds threshold (${threshold}ms)`
    };
  }
  
  if (summary.avgResponseTimes.qids > threshold) {
    return {
      ok: false,
      message: `QIDS response time (${summary.avgResponseTimes.qids}ms) exceeds threshold (${threshold}ms)`
    };
  }
  
  return {
    ok: true,
    message: 'Response times are within acceptable limits'
  };
}

/**
 * Check if migration is progressing
 */
function checkMigrationProgress(expectedPercentage: number): { ok: boolean; message: string } {
  const summary = migrationMetrics.getSummary();
  
  if (summary.migrationPercentage < expectedPercentage) {
    return {
      ok: false,
      message: `Migration progress (${summary.migrationPercentage.toFixed(1)}%) is below expected (${expectedPercentage}%)`
    };
  }
  
  return {
    ok: true,
    message: `Migration progress (${summary.migrationPercentage.toFixed(1)}%) is on track`
  };
}

/**
 * Run all health checks
 */
function runHealthChecks() {
  const checks = [
    checkErrorRates(),
    checkResponseTimes(),
    checkMigrationProgress(50) // Expect at least 50% migrated
  ];
  
  const failed = checks.filter(c => !c.ok);
  
  if (failed.length > 0) {
    console.error('Health checks failed:');
    failed.forEach(check => console.error(`- ${check.message}`));
    return false;
  }
  
  console.log('All health checks passed');
  return true;
}

// ============================================================================
// Example 5: Exporting Metrics
// ============================================================================

/**
 * Export metrics to JSON for external analysis
 */
function exportMetrics(limit: number = 1000) {
  const rawMetrics = migrationMetrics.getRawMetrics(limit);
  const summary = migrationMetrics.getSummary();
  
  return {
    exportedAt: new Date().toISOString(),
    summary,
    rawMetrics
  };
}

/**
 * Export metrics to CSV format
 */
function exportMetricsToCSV(limit: number = 1000): string {
  const rawMetrics = migrationMetrics.getRawMetrics(limit);
  
  const headers = ['timestamp', 'system', 'actionKey', 'userId', 'success', 'responseTime', 'error'];
  const rows = rawMetrics.map(m => [
    new Date(m.timestamp).toISOString(),
    m.system,
    m.actionKey,
    m.userId,
    m.success,
    m.responseTime,
    m.error || ''
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csv;
}

// ============================================================================
// Example 6: Real-time Monitoring
// ============================================================================

/**
 * Set up periodic monitoring
 */
function startMonitoring(intervalMs: number = 60000) {
  const interval = setInterval(() => {
    const summary = getMigrationSummary();
    
    console.log('\n=== Migration Status ===');
    console.log(`Migration: ${summary.migrationPercentage.toFixed(1)}%`);
    console.log(`Total Requests: ${summary.totalRequests}`);
    console.log(`Error Rates: QIDS ${summary.errorRates.qids.toFixed(2)}%, Action ${summary.errorRates.action.toFixed(2)}%`);
    console.log(`Response Times: QIDS ${summary.avgResponseTimes.qids}ms, Action ${summary.avgResponseTimes.action}ms`);
    
    // Run health checks
    runHealthChecks();
  }, intervalMs);
  
  return () => clearInterval(interval);
}

// Export examples
export {
  updateTaskWithTracking,
  updateTaskNew,
  getMigrationSummary,
  getActionMetrics,
  isActionMigrated,
  getMigratedActions,
  getUnmigratedActions,
  checkErrorRates,
  checkResponseTimes,
  checkMigrationProgress,
  runHealthChecks,
  exportMetrics,
  exportMetricsToCSV,
  startMonitoring
};
