# Migration Metrics Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Application                          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
        ┌───────────────────┐       ┌───────────────────┐
        │   QIDS System     │       │  Action System    │
        │   (Old)           │       │  (New)            │
        └───────────────────┘       └───────────────────┘
                    │                           │
                    │                           │
        ┌───────────▼───────────┐   ┌──────────▼──────────┐
        │  trackQidsCall()      │   │  ActionService      │
        │  (Manual Wrapper)     │   │  (Auto Tracking)    │
        └───────────┬───────────┘   └──────────┬──────────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  MigrationMetrics       │
                    │  (In-Memory Storage)    │
                    │  - Last 10k metrics     │
                    │  - Aggregation          │
                    │  - Console logging      │
                    └─────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
        ┌───────────────────┐       ┌───────────────────┐
        │  API Endpoint     │       │  Dashboard UI     │
        │  /api/migration-  │       │  /migration-      │
        │  metrics          │       │  dashboard        │
        └───────────────────┘       └───────────────────┘
```

## Data Flow

### 1. QIDS System Request Flow

```
User Action
    │
    ▼
Component calls trackQidsCall()
    │
    ├─ Start timer
    │
    ▼
Execute QIDS operation
    │
    ├─ Success or Error
    │
    ▼
Stop timer & calculate response time
    │
    ▼
migrationMetrics.record({
    system: 'qids',
    actionKey: 'updateTask',
    userId: 'user123',
    success: true/false,
    responseTime: 245,
    error: 'optional error message'
})
    │
    ├─ Store in memory
    ├─ Log to console
    │
    ▼
Return result to caller
```

### 2. Action System Request Flow

```
User Action
    │
    ▼
Component calls ActionService.executeAction()
    │
    ├─ Start timer
    │
    ▼
Validate parameters
    │
    ▼
Check authorization
    │
    ▼
Execute Strapi operation
    │
    ├─ Success or Error
    │
    ▼
Stop timer & calculate response time
    │
    ▼
migrationMetrics.record({
    system: 'action',
    actionKey: 'updateTask',
    userId: 'user123',
    success: true/false,
    responseTime: 198,
    error: 'optional error message'
})
    │
    ├─ Store in memory
    ├─ Log to console
    │
    ▼
Trigger notifications (async)
    │
    ▼
Return result to caller
```

## Metric Storage

### In-Memory Structure

```typescript
class MigrationMetricsCollector {
  private metrics: MetricEntry[] = [
    {
      timestamp: 1699564800000,
      system: 'qids',
      actionKey: 'updateTask',
      userId: 'user123',
      success: true,
      responseTime: 245
    },
    {
      timestamp: 1699564801000,
      system: 'action',
      actionKey: 'updateTask',
      userId: 'user456',
      success: true,
      responseTime: 198
    },
    // ... up to 10,000 entries
  ];
}
```

### Aggregation Process

```
Raw Metrics
    │
    ▼
Filter by time period
    │
    ▼
Group by system (qids/action)
    │
    ├─ Calculate totals
    ├─ Calculate error rates
    ├─ Calculate avg response times
    │
    ▼
Group by action key
    │
    ├─ Count per system
    ├─ Determine migration status
    │
    ▼
Return MetricsSummary
```

## API Endpoint Architecture

```
GET /api/migration-metrics
    │
    ├─ Parse query params
    │   ├─ period (time range)
    │   ├─ action (specific action)
    │   ├─ raw (raw data flag)
    │   └─ limit (result limit)
    │
    ▼
Call migrationMetrics methods
    │
    ├─ getSummary(period)
    ├─ getActionMetrics(action, period)
    ├─ getRawMetrics(limit)
    │
    ▼
Format response
    │
    ▼
Return JSON
```

## Dashboard Architecture

```
Migration Dashboard Component
    │
    ├─ State Management
    │   ├─ summary: MetricsSummary
    │   ├─ loading: boolean
    │   ├─ error: string | null
    │   ├─ period: number
    │   └─ autoRefresh: boolean
    │
    ├─ Data Fetching
    │   ├─ fetchMetrics()
    │   ├─ Auto-refresh (30s)
    │   └─ Manual refresh
    │
    ├─ UI Components
    │   ├─ Overview Cards
    │   │   ├─ Total Requests
    │   │   ├─ Migration Progress
    │   │   ├─ QIDS Requests
    │   │   └─ Action Requests
    │   │
    │   ├─ Performance Comparison
    │   │   ├─ Response Time Charts
    │   │   └─ Improvement Indicators
    │   │
    │   ├─ Error Rate Comparison
    │   │   ├─ Error Rate Charts
    │   │   └─ Improvement Indicators
    │   │
    │   └─ Action Breakdown Table
    │       ├─ Action Key
    │       ├─ Migration Status
    │       ├─ QIDS Count
    │       ├─ Action Count
    │       └─ Total Count
    │
    └─ Controls
        ├─ Time Period Selector
        ├─ Auto-refresh Toggle
        └─ Manual Refresh Button
```

## Logging Architecture

### Console Logging Format

```json
{
  "level": "INFO",
  "type": "MIGRATION_METRIC",
  "timestamp": "2024-11-09T12:34:56.789Z",
  "data": {
    "system": "action",
    "actionKey": "updateTask",
    "success": true,
    "responseTime": 198,
    "error": null
  }
}
```

### Log Aggregation Flow

```
Application Logs
    │
    ▼
Console Output
    │
    ├─ [MIGRATION_METRIC] JSON
    │
    ▼
External Log Aggregator
(e.g., ELK, Splunk, CloudWatch)
    │
    ├─ Parse JSON
    ├─ Index by fields
    ├─ Create dashboards
    │
    ▼
Long-term Analysis & Alerting
```

## Performance Considerations

### Memory Management

```
Metric Entry Size: ~200 bytes
Max Entries: 10,000
Total Memory: ~2 MB

Cleanup Strategy:
- Keep last 10,000 entries
- Automatic FIFO removal
- No disk I/O
```

### CPU Overhead

```
Per Request:
- Record metric: <0.1ms
- Log to console: <0.5ms
- Total overhead: <1ms

Aggregation:
- getSummary(): ~5ms for 10k entries
- Cached in dashboard
- Not on critical path
```

### Network Impact

```
API Endpoint:
- Response size: ~5-10 KB
- Compression: gzip
- Cache headers: no-cache (real-time data)

Dashboard:
- Initial load: ~50 KB
- Auto-refresh: ~5 KB every 30s
- Minimal bandwidth usage
```

## Scalability

### Current Limits

```
In-Memory Storage:
- 10,000 metrics
- ~2 MB memory
- ~1 hour of high traffic

Suitable for:
- Single server deployment
- Up to 1000 req/min
- Short-term monitoring
```

### Future Enhancements

```
For Higher Scale:
1. Database Storage
   - PostgreSQL/MongoDB
   - Persistent metrics
   - Unlimited history

2. Time-Series Database
   - InfluxDB/TimescaleDB
   - Optimized for metrics
   - Better aggregation

3. Distributed Tracing
   - OpenTelemetry
   - Jaeger/Zipkin
   - Full request tracing

4. External Monitoring
   - Prometheus
   - Grafana
   - Production-grade monitoring
```

## Security Considerations

### Access Control

```
API Endpoint:
- No authentication (internal use)
- Consider adding JWT check
- Rate limiting recommended

Dashboard:
- No authentication (internal use)
- Consider adding admin role check
- IP whitelist recommended
```

### Data Privacy

```
Metrics Include:
- User IDs (anonymize in production?)
- Action keys (safe)
- Response times (safe)
- Error messages (may contain sensitive data)

Recommendations:
- Redact sensitive error details
- Hash user IDs
- Limit metric retention
```

## Monitoring the Monitor

### Health Checks

```typescript
// Check if metrics are being recorded
function checkMetricsHealth(): boolean {
  const summary = migrationMetrics.getSummary(300000); // Last 5 min
  
  if (summary.totalRequests === 0) {
    console.warn('No metrics recorded in last 5 minutes');
    return false;
  }
  
  return true;
}

// Check if dashboard is accessible
async function checkDashboardHealth(): Promise<boolean> {
  try {
    const response = await fetch('/api/migration-metrics');
    return response.ok;
  } catch (error) {
    console.error('Dashboard API not accessible:', error);
    return false;
  }
}
```

### Alerting

```typescript
// Alert on high error rates
function checkErrorRates(): void {
  const summary = migrationMetrics.getSummary();
  
  if (summary.errorRates.action > 5) {
    // Send alert (email, Slack, PagerDuty, etc.)
    console.error(`ALERT: High error rate in Action System: ${summary.errorRates.action}%`);
  }
}

// Alert on slow response times
function checkResponseTimes(): void {
  const summary = migrationMetrics.getSummary();
  
  if (summary.avgResponseTimes.action > 1000) {
    // Send alert
    console.warn(`ALERT: Slow response time in Action System: ${summary.avgResponseTimes.action}ms`);
  }
}
```

## Integration Points

### 1. Application Code

```typescript
// QIDS System
import { trackQidsCall } from '$lib/server/metrics/QidsMetricsWrapper';

// Action System
import { ActionService } from '$lib/server/actions/ActionService';
// (automatic tracking built-in)
```

### 2. Monitoring Systems

```typescript
// Export to Prometheus
app.get('/metrics', (req, res) => {
  const summary = migrationMetrics.getSummary();
  
  res.set('Content-Type', 'text/plain');
  res.send(`
    # HELP migration_requests_total Total number of requests
    # TYPE migration_requests_total counter
    migration_requests_total{system="qids"} ${summary.qidsRequests}
    migration_requests_total{system="action"} ${summary.actionRequests}
    
    # HELP migration_error_rate Error rate percentage
    # TYPE migration_error_rate gauge
    migration_error_rate{system="qids"} ${summary.errorRates.qids}
    migration_error_rate{system="action"} ${summary.errorRates.action}
  `);
});
```

### 3. CI/CD Pipeline

```yaml
# .github/workflows/migration-check.yml
name: Migration Progress Check

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly

jobs:
  check-migration:
    runs-on: ubuntu-latest
    steps:
      - name: Check migration progress
        run: |
          PROGRESS=$(curl -s https://api.example.com/migration-metrics | jq '.data.summary.migrationPercentage')
          echo "Migration progress: $PROGRESS%"
          
          if [ $(echo "$PROGRESS < 50" | bc) -eq 1 ]; then
            echo "::warning::Migration progress is below 50%"
          fi
```

## Conclusion

The migration metrics architecture is designed to be:
- **Lightweight**: Minimal overhead on production systems
- **Comprehensive**: Tracks all relevant metrics
- **Accessible**: Easy-to-use dashboard and API
- **Scalable**: Can be extended for higher scale
- **Maintainable**: Clear separation of concerns
- **Observable**: Built-in logging and monitoring
