# Migration Metrics Integration Guide

This guide shows you how to integrate migration metrics tracking into your existing code during the QIDS to Action System migration.

## Quick Start

### 1. Track Existing QIDS Calls

Find your existing QIDS calls and wrap them with the metrics tracker:

**Before:**
```typescript
// src/routes/api/update-task/+server.ts
import { sendToSer } from '$lib/send/sendToSer';

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
```

**After:**
```typescript
// src/routes/api/update-task/+server.ts
import { sendToSer } from '$lib/send/sendToSer';
import { trackQidsCall } from '$lib/server/metrics/QidsMetricsWrapper';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { taskId, status } = await request.json();
  const userId = cookies.get('id');
  
  const result = await trackQidsCall(
    'updateTask', // Action key for metrics
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
```

### 2. Migrate to Action System

When you're ready to migrate, replace the QIDS call with the Action System:

```typescript
// src/routes/api/update-task/+server.ts
import { executeAction } from '$lib/client/actionClient';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { taskId, status } = await request.json();
  const userId = cookies.get('id');
  const jwt = cookies.get('jwt');
  const lang = cookies.get('lang');
  
  // Action System automatically tracks metrics!
  const result = await executeAction(
    'updateTask',
    { taskId, status },
    { userId, jwt, lang, fetch }
  );
  
  return json(result);
};
```

### 3. Monitor the Dashboard

Navigate to `/migration-dashboard` to see:
- Migration progress percentage
- Error rates comparison
- Response times comparison
- Action-by-action breakdown

## Integration Patterns

### Pattern 1: Server-Side API Endpoint

```typescript
import { trackQidsCall } from '$lib/server/metrics/QidsMetricsWrapper';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const params = await request.json();
  const userId = cookies.get('id');
  
  const result = await trackQidsCall(
    'actionKeyName',
    userId,
    () => yourExistingQidsCall(params)
  );
  
  return json(result);
};
```

### Pattern 2: Server-Side Load Function

```typescript
import { trackQidsCall } from '$lib/server/metrics/QidsMetricsWrapper';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies, fetch }) => {
  const userId = cookies.get('id');
  
  const data = await trackQidsCall(
    'loadProjectData',
    userId,
    () => sendToSer(
      { projectId: params.id },
      '3projectJSONQue',
      0,
      0,
      false,
      fetch
    )
  );
  
  return { project: data };
};
```

### Pattern 3: Client-Side Component

For client-side calls, wrap the fetch call:

```typescript
import { trackQidsCall } from '$lib/server/metrics/QidsMetricsWrapper';

async function updateTask(taskId: string, status: string) {
  const userId = $idd; // From store
  
  const result = await trackQidsCall(
    'updateTask',
    userId,
    () => fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qid: '31updateTask',
        variables: { taskId, status }
      })
    }).then(r => r.json())
  );
  
  return result;
}
```

## Naming Conventions

Use consistent action key names across both systems:

| QIDS Query ID | Action Key | Description |
|---------------|------------|-------------|
| 31updateTask | updateTask | Update task status |
| 4crtask | createTask | Create new task |
| 1chatsend | createMessage | Send chat message |
| 69 | createHaluka | Create haluka |
| 40 | createNegotiation | Create negotiation |

## Monitoring Best Practices

### 1. Set Up Regular Checks

```typescript
// In your monitoring script
import { migrationMetrics } from '$lib/server/metrics/MigrationMetrics';

setInterval(() => {
  const summary = migrationMetrics.getSummary(3600000); // Last hour
  
  // Alert if error rate is high
  if (summary.errorRates.action > 5) {
    console.error(`High error rate in Action System: ${summary.errorRates.action}%`);
  }
  
  // Alert if response time is slow
  if (summary.avgResponseTimes.action > 1000) {
    console.warn(`Slow response time in Action System: ${summary.avgResponseTimes.action}ms`);
  }
}, 300000); // Every 5 minutes
```

### 2. Track Migration Progress

```typescript
// Check migration progress weekly
const summary = migrationMetrics.getSummary(604800000); // Last 7 days

console.log(`Migration Progress: ${summary.migrationPercentage.toFixed(1)}%`);
console.log(`Actions migrated: ${Object.values(summary.actionBreakdown).filter(a => a.migrated).length}`);
console.log(`Actions remaining: ${Object.values(summary.actionBreakdown).filter(a => !a.migrated).length}`);
```

### 3. Compare Performance

```typescript
const summary = migrationMetrics.getSummary();

const improvement = {
  responseTime: ((summary.avgResponseTimes.qids - summary.avgResponseTimes.action) / summary.avgResponseTimes.qids) * 100,
  errorRate: summary.errorRates.qids - summary.errorRates.action
};

console.log(`Response time improvement: ${improvement.responseTime.toFixed(1)}%`);
console.log(`Error rate improvement: ${improvement.errorRate.toFixed(2)}%`);
```

## Troubleshooting

### Metrics Not Appearing

**Problem:** Dashboard shows no data

**Solution:**
1. Check that `trackQidsCall` is being called
2. Verify console logs show `[MIGRATION_METRIC]` entries
3. Check that the API endpoint `/api/migration-metrics` is accessible
4. Ensure time period is set correctly (default is 1 hour)

### Incorrect Action Keys

**Problem:** Same action appears twice with different keys

**Solution:**
1. Use consistent naming between QIDS and Action System
2. Check the action key in both `trackQidsCall` and action config
3. Update all references to use the same key

### High Error Rates

**Problem:** New system shows higher error rate than old system

**Solution:**
1. Check validation rules - they may be stricter
2. Review authorization rules - they may be more restrictive
3. Check for missing parameters in action configs
4. Review error logs for specific failure patterns

### Slow Response Times

**Problem:** New system is slower than old system

**Solution:**
1. Check if notifications are blocking (they shouldn't be)
2. Review Strapi query performance
3. Check for N+1 query problems
4. Consider adding caching for frequently accessed data

## Migration Checklist

Use this checklist for each action you migrate:

- [ ] Identify the QIDS query ID
- [ ] Choose a consistent action key name
- [ ] Add `trackQidsCall` wrapper to existing code
- [ ] Deploy and verify metrics appear in dashboard
- [ ] Create action configuration for new system
- [ ] Test new action thoroughly
- [ ] Deploy new action alongside old system
- [ ] Monitor dashboard for 24-48 hours
- [ ] Compare error rates and response times
- [ ] If metrics look good, switch traffic to new system
- [ ] Monitor for another 24-48 hours
- [ ] Remove old QIDS code
- [ ] Remove `trackQidsCall` wrapper (optional)

## API Reference

### Track QIDS Call

```typescript
trackQidsCall<T>(
  actionKey: string,
  userId: string,
  operation: () => Promise<T>
): Promise<T>
```

### Get Metrics Summary

```typescript
GET /api/migration-metrics?period=3600000
```

### Get Action-Specific Metrics

```typescript
GET /api/migration-metrics?action=updateTask
```

### Get Raw Metrics

```typescript
GET /api/migration-metrics?raw=true&limit=1000
```

## Next Steps

1. **Start tracking**: Add `trackQidsCall` to your most-used endpoints
2. **Monitor baseline**: Let it run for a week to establish baseline metrics
3. **Migrate one action**: Choose a simple, low-risk action to migrate first
4. **Compare metrics**: Use the dashboard to compare old vs new
5. **Iterate**: Migrate more actions based on confidence from metrics
6. **Complete migration**: Once all actions are migrated, remove QIDS code

## Support

For questions or issues:
1. Check the [README.md](./README.md) for detailed documentation
2. Review [examples](./examples/migration-metrics-example.ts) for usage patterns
3. Check the dashboard at `/migration-dashboard` for real-time data
4. Review console logs for `[MIGRATION_METRIC]` entries
