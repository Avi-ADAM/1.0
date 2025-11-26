/**
 * QIDS Metrics Wrapper
 * 
 * Wraps the old QIDS system to track metrics during migration.
 * This allows us to compare old vs new system performance.
 */

import { migrationMetrics } from './MigrationMetrics';

/**
 * Wrap a QIDS call to track metrics
 */
export async function trackQidsCall<T>(
  actionKey: string,
  userId: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  let success = true;
  let error: string | undefined;
  
  try {
    const result = await operation();
    return result;
  } catch (err) {
    success = false;
    error = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    const responseTime = Date.now() - startTime;
    
    migrationMetrics.record({
      system: 'qids',
      actionKey,
      userId,
      success,
      responseTime,
      error
    });
  }
}
