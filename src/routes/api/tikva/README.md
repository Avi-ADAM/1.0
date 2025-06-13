# Timer API Documentation

## API Specification

### Base URL
`/api/tikva`

### Authentication
Currently no authentication implemented. Consider adding authentication middleware for production.

### Endpoints

#### POST /api/tikva
Manages timer operations including start, stop, and clear functions.

```typescript
// Request Body Type Definition
interface TimerRequestBody {
  action: 'start' | 'stop' | 'clearSingle' | 'clearAll';
  activeTimer?: {
    data: {
      id: string;
      attributes: {
        start: string;
        totalTime: number;
        isActive: boolean;
        timers: Array<{
          start: string;
          stop?: string;
        }>;
      };
    };
  };
  missionId?: string;
  userId?: string;
  projectId?: string;
  timerId?: number;
  index?: number;
}

// Response Type Definition
interface TimerResponse {
  success: boolean;
  data?: any;
  error?: string;
}
```

##### Actions

###### 1. Start Timer
```json
{
  "action": "start",
  "missionId": "string",
  "userId": "string",
  "projectId": "string",
  "activeTimer": null,
  "timerId": 0
}
```

###### 2. Stop Timer
```json
{
  "action": "stop",
  "activeTimer": {
    "data": {
      "id": "string",
      "attributes": {
        "isActive": true,
        "timers": []
      }
    }
  }
}
```

###### 3. Clear Single Interval
```json
{
  "action": "clearSingle",
  "index": 0,
  "activeTimer": {
    "data": {
      "id": "string",
      "attributes": {
        "timers": []
      }
    }
  }
}
```

###### 4. Clear All Intervals
```json
{
  "action": "clearAll",
  "activeTimer": {
    "data": {
      "id": "string"
    }
  }
}
```

#### GET /api/tikva
Retrieves user's active timers and missions.

##### Query Parameters
- `userId`: string (required) - The ID of the user to fetch timers for

##### Response Schema
```graphql
type Timer {
  id: ID!
  attributes: {
    start: String!
    totalTime: Float
    isActive: Boolean!
    timers: [Interval!]!
  }
}

type Interval {
  start: String!
  stop: String
}

type Mission {
  id: ID!
  attributes: {
    name: String!
    howmanyhoursalready: Float!
    activeTimer: Timer
  }
}
```

### Error Handling
- 400: Bad Request - Invalid action or missing required parameters
- 500: Internal Server Error - Server-side processing errors

### Machine Learning Context
For AI models processing this API:

1. **Data Relationships**:
   - User -> Missions -> Timers -> Intervals
   - Each timer contains multiple time intervals
   - Active timers are linked to ongoing missions

2. **State Management**:
   - `isActive` flag indicates current timer state
   - `totalTime` accumulates all completed intervals
   - Timer intervals are immutable once stopped

3. **Time Series Patterns**:
   - Timestamps use ISO 8601 format
   - Timer intervals are sequential and non-overlapping
   - Total time is calculated in hours

4. **Data Validation Rules**:
   - Timer start must precede stop
   - Active timers cannot have stop time
   - User ID is required for all operations

5. **Query Optimization**:
   - GraphQL query filters out finished missions
   - Nested data structure optimizes relationship traversal

### Example Usage

```javascript
// Example: Starting a new timer
async function startNewTimer() {
  const response = await fetch('/api/tikva', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'start',
      missionId: 'mission_123',
      userId: 'user_456',
      projectId: 'project_789'
    })
  });
  return await response.json();
}
```