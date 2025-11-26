/**
 * Migration Metrics System
 * 
 * Tracks usage of old QIDS system vs new Action System during migration.
 * Collects metrics on error rates, response times, and migration progress.
 */

export interface MetricEntry {
  timestamp: number;
  system: 'qids' | 'action';
  actionKey: string;
  userId: string;
  success: boolean;
  responseTime: number;
  error?: string;
}

export interface MetricsSummary {
  totalRequests: number;
  qidsRequests: number;
  actionRequests: number;
  migrationPercentage: number;
  errorRates: {
    qids: number;
    action: number;
  };
  avgResponseTimes: {
    qids: number;
    action: number;
  };
  actionBreakdown: {
    [actionKey: string]: {
      qids: number;
      action: number;
      migrated: boolean;
    };
  };
}

class MigrationMetricsCollector {
  private metrics: MetricEntry[] = [];
  private maxMetrics = 10000; // Keep last 10k metrics in memory
  
  /**
   * Record a metric entry
   */
  record(entry: Omit<MetricEntry, 'timestamp'>): void {
    this.metrics.push({
      ...entry,
      timestamp: Date.now()
    });
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    
    // Log to console for monitoring
    console.log('[MIGRATION_METRIC]', JSON.stringify({
      system: entry.system,
      actionKey: entry.actionKey,
      success: entry.success,
      responseTime: entry.responseTime,
      error: entry.error
    }));
  }
  
  /**
   * Get metrics summary for a time period
   */
  getSummary(periodMs: number = 3600000): MetricsSummary {
    const cutoff = Date.now() - periodMs;
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoff);
    
    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        qidsRequests: 0,
        actionRequests: 0,
        migrationPercentage: 0,
        errorRates: { qids: 0, action: 0 },
        avgResponseTimes: { qids: 0, action: 0 },
        actionBreakdown: {}
      };
    }
    
    const qidsMetrics = recentMetrics.filter(m => m.system === 'qids');
    const actionMetrics = recentMetrics.filter(m => m.system === 'action');
    
    const qidsErrors = qidsMetrics.filter(m => !m.success).length;
    const actionErrors = actionMetrics.filter(m => !m.success).length;
    
    const qidsAvgTime = qidsMetrics.length > 0
      ? qidsMetrics.reduce((sum, m) => sum + m.responseTime, 0) / qidsMetrics.length
      : 0;
    
    const actionAvgTime = actionMetrics.length > 0
      ? actionMetrics.reduce((sum, m) => sum + m.responseTime, 0) / actionMetrics.length
      : 0;
    
    // Build action breakdown
    const actionBreakdown: MetricsSummary['actionBreakdown'] = {};
    
    for (const metric of recentMetrics) {
      if (!actionBreakdown[metric.actionKey]) {
        actionBreakdown[metric.actionKey] = {
          qids: 0,
          action: 0,
          migrated: false
        };
      }
      
      if (metric.system === 'qids') {
        actionBreakdown[metric.actionKey].qids++;
      } else {
        actionBreakdown[metric.actionKey].action++;
        actionBreakdown[metric.actionKey].migrated = true;
      }
    }
    
    return {
      totalRequests: recentMetrics.length,
      qidsRequests: qidsMetrics.length,
      actionRequests: actionMetrics.length,
      migrationPercentage: recentMetrics.length > 0
        ? (actionMetrics.length / recentMetrics.length) * 100
        : 0,
      errorRates: {
        qids: qidsMetrics.length > 0 ? (qidsErrors / qidsMetrics.length) * 100 : 0,
        action: actionMetrics.length > 0 ? (actionErrors / actionMetrics.length) * 100 : 0
      },
      avgResponseTimes: {
        qids: Math.round(qidsAvgTime),
        action: Math.round(actionAvgTime)
      },
      actionBreakdown
    };
  }
  
  /**
   * Get detailed metrics for a specific action
   */
  getActionMetrics(actionKey: string, periodMs: number = 3600000): {
    qids: MetricEntry[];
    action: MetricEntry[];
  } {
    const cutoff = Date.now() - periodMs;
    const actionMetrics = this.metrics.filter(
      m => m.actionKey === actionKey && m.timestamp >= cutoff
    );
    
    return {
      qids: actionMetrics.filter(m => m.system === 'qids'),
      action: actionMetrics.filter(m => m.system === 'action')
    };
  }
  
  /**
   * Clear all metrics (for testing)
   */
  clear(): void {
    this.metrics = [];
  }
  
  /**
   * Get raw metrics (for export/analysis)
   */
  getRawMetrics(limit: number = 1000): MetricEntry[] {
    return this.metrics.slice(-limit);
  }
}

// Singleton instance
export const migrationMetrics = new MigrationMetricsCollector();
