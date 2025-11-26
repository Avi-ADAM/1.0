# Migration Metrics System

This system tracks the migration from the old QIDS system to the new Action System, providing real-time metrics on usage, performance, and error rates.

## Overview

The migration metrics system consists of:

1. **MigrationMetrics.ts** - Core metrics collection and aggregation
2. **QidsMetricsWrapper.ts** - Wrapper for tracking old QIDS calls
3. **ActionService integration** - Automatic tracking of new Action System calls
4. **API endpoint** - `/api/migration-metrics` for accessing metrics data
5. **Dashboard** - `/migration-dashboard` for visualizing metrics

## Features

### Metrics Collected

For each request (both QIDS and Action System):
- **System**: Which system handled the request (`qids` or `action`)
- **Action Key**: The action identifier
- **User ID**: Who made the request
- **Success**: Whether the request succeeded
- **Response Time**: How long the request took (ms)
- **Error**: Error message if the request failed
- **Timestamp**: When the request was made

### Aggregated Metrics

The system provides:
- **Total requests** in the time period
- **Migration percentage** (% using new system)
- **Error rates** for both systems
- **Average response times** for both systems
- **Action breakdown** showing which actions are migrated

## Usage

### Tracking QIDS Calls

Wrap existing QIDS calls with the metrics tracker:

```typescript
import { trackQidsCall } from '$lib/server/metrics/QidsMetricsWrapper';

// Before
const result = await sendToSer(params, queryId, me, project, isSer, fetch);

// After
const result = await trackQidsCall(
  'actionKeyName', // e.g., 'updateTask'
  userId,
  () => sendToSer(params, queryId, me, project, isSer, fetch)
);
```

### Tracking Action System Calls

Action System calls are automatically tracked by the ActionService. No additional code needed!

### Accessing Metrics via API

```typescript
// Get summary for last hour
const response = await fetch('/api/migration-metrics');
const { data } = await response.json();
console.log(data.summary);

// Get summary for last 24 hours
const response = await fetch('/api/migration-metrics?period=86400000');

// Get metrics for specific action
const response = await fetch('/api/migration-metrics?action=updateTask');

// Get raw metrics data
const response = await fetch('/api/migration-metrics?raw=true&limit=500');
```

### Viewing the Dashboard

Navigate to `/migration-dashboard` to see:
- Real-time migration progress
- Performance comparison (response times)
- Error rate comparison
- Action-by-action breakdown
- Auto-refresh every 30 seconds

## API Reference

### GET /api/migration-metrics

Query parameters:
- `period` (number, optional): Time period in milliseconds (default: 3600000 = 1 hour)
- `action` (string, optional): Get metrics for specific action key
- `raw` (boolean, optional): Return raw metrics instead of summary
- `limit` (number, optional): Limit raw metrics count (default: 1000)

Response format:

```typescript
{
  success: boolean;
  data: {
    period: number;
    summary: {
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
    };
  };
}
```

## Logging

All metrics are also logged to the console in JSON format for external monitoring:

```json
{
  "system": "action",
  "actionKey": "updateTask",
  "success": true,
  "responseTime": 245,
  "error": null
}
```

These logs can be ingested by log aggregation systems (e.g., ELK, Splunk) for long-term analysis.

## Performance Considerations

- Metrics are stored in memory (last 10,000 entries)
- Minimal overhead (~1ms per request)
- Async logging doesn't block request processing
- Automatic cleanup of old metrics

## Migration Strategy

1. **Phase 1**: Add QIDS tracking to existing endpoints
2. **Phase 2**: Migrate actions one by one to Action System
3. **Phase 3**: Monitor dashboard for performance and errors
4. **Phase 4**: Once migration is complete, remove QIDS tracking

## Monitoring Recommendations

### Key Metrics to Watch

1. **Migration Percentage**: Should steadily increase
2. **Error Rate Comparison**: New system should have ≤ old system error rate
3. **Response Time Comparison**: New system should be faster or comparable
4. **Action Coverage**: Track which actions are migrated

### Alert Thresholds

- Error rate > 5% for either system
- Response time > 1000ms average
- Migration percentage not increasing over time
- Specific action showing high error rate

## Example: Migrating an Endpoint

```typescript
// Before: Old QIDS system
export const POST: RequestHandler = async ({ request, cookies }) => {
  const { taskId, status } = await request.json();
  const userId = cookies.get('id');
  
  const result = await sendToSer(
    { taskId, status },
    '31updateTask',
    0,
    0,
    false,
    fetch
  );
  
  return json(result);
};

// During Migration: Track QIDS calls
import { trackQidsCall } from '$lib/server/metrics/QidsMetricsWrapper';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { taskId, status } = await request.json();
  const userId = cookies.get('id');
  
  const result = await trackQidsCall(
    'updateTask',
    userId,
    () => sendToSer(
      { taskId, status },
      '31updateTask',
      0,
      0,
      false,
      fetch
    )
  );
  
  return json(result);
};

// After Migration: Use Action System (automatic tracking)
import { executeAction } from '$lib/client/actionClient';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { taskId, status } = await request.json();
  const userId = cookies.get('id');
  const jwt = cookies.get('jwt');
  const lang = cookies.get('lang');
  
  const result = await executeAction(
    'updateTask',
    { taskId, status },
    { userId, jwt, lang, fetch }
  );
  
  return json(result);
};
```

## Troubleshooting

### Metrics not appearing

- Check that `migrationMetrics.record()` is being called
- Verify console logs show `[MIGRATION_METRIC]` entries
- Check API endpoint is accessible

### Dashboard not updating

- Verify auto-refresh is enabled
- Check browser console for errors
- Ensure API endpoint is returning data

### Inaccurate metrics

- Verify time period is set correctly
- Check that both systems are being tracked
- Ensure action keys match between systems

## Future Enhancements

- Persistent storage (database) for long-term metrics
- Export metrics to CSV/JSON
- Grafana/Prometheus integration
- User-specific metrics
- Geographic distribution metrics
- Custom metric filters and queries
