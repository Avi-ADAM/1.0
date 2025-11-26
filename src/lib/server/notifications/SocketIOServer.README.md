# SocketIOServer Client

Client for communicating with the standalone Socket.IO server to send real-time notifications to connected users.

## Overview

The `SocketIOServer` class provides a simple interface for broadcasting notifications to users via the Socket.IO server. It handles:

- Broadcasting to multiple users
- Error handling and resilience
- Health checks
- Statistics retrieval

## Usage

### Basic Broadcasting

```typescript
import { SocketIOServer } from './SocketIOServer';

const socketServer = new SocketIOServer('http://localhost:3001');

// Broadcast to specific user IDs
await socketServer.broadcast(
  ['user123', 'user456'],
  {
    title: { he: 'משימה חדשה', en: 'New Task' },
    body: { he: 'נוספה משימה חדשה', en: 'A new task was added' },
    metadata: {
      url: '/lev',
      priority: 'normal'
    }
  },
  context
);
```

### Broadcasting to UserProfile Array

```typescript
// Broadcast to users from UserProfile array
const users: UserProfile[] = [
  { id: '123', username: 'user1', email: 'user1@example.com', lang: 'he', machshirs: [] },
  { id: '456', username: 'user2', email: 'user2@example.com', lang: 'en', machshirs: [] }
];

await socketServer.broadcastToUsers(users, notification, context);
```

### Health Check

```typescript
const isHealthy = await socketServer.healthCheck(context);
if (!isHealthy) {
  console.error('Socket.IO server is not responding');
}
```

### Get Statistics

```typescript
const stats = await socketServer.getStats(context);
console.log(`Connected users: ${stats.connectedUsers}`);
console.log(`Total connections: ${stats.totalConnections}`);
```

## Integration with NotificationOrchestrator

The `SocketIOServer` is automatically integrated into the `NotificationOrchestrator`:

```typescript
import { NotificationOrchestrator } from './NotificationOrchestrator';
import { StrapiClient } from '../actions/StrapiClient';

const strapiClient = new StrapiClient(/* ... */);
const orchestrator = new NotificationOrchestrator(
  strapiClient,
  'http://localhost:3001' // Optional: Socket.IO server URL
);

// Socket notifications are sent automatically when 'socket' is in channels
await orchestrator.notify(
  {
    recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId' } },
    templates: {
      title: { he: 'עדכון', en: 'Update' },
      body: { he: 'יש עדכון חדש', en: 'There is a new update' }
    },
    channels: ['socket', 'email', 'telegram'], // Socket is included
    metadata: { url: '/lev' }
  },
  { projectId: '123' },
  {},
  context
);
```

## Configuration

The Socket.IO server URL can be configured in three ways:

1. **Constructor parameter** (highest priority):
   ```typescript
   new SocketIOServer('http://custom-server:3001')
   ```

2. **Environment variable**:
   ```bash
   SOCKET_SERVER_URL=http://localhost:3001
   ```

3. **Default**: `http://localhost:3001`

## Error Handling

The `SocketIOServer` is designed to be resilient:

- **Network errors**: Caught and logged, but don't throw exceptions
- **Server errors**: Returned in the response object with error details
- **No users**: Returns success with 0 deliveries
- **Partial failures**: Some users may receive notifications even if others fail

All errors are logged but don't block the main action flow.

## Response Format

The `broadcast()` method returns a `BroadcastResponse`:

```typescript
interface BroadcastResponse {
  success: boolean;           // Overall success status
  deliveredTo: number;        // Number of users who received the notification
  totalSockets: number;       // Total number of socket connections notified
  requestedUsers: number;     // Number of users requested to notify
  error?: string;             // Error message if failed
}
```

Example responses:

```typescript
// Success
{
  success: true,
  deliveredTo: 2,
  totalSockets: 3,  // User 1 has 2 connections, User 2 has 1
  requestedUsers: 2
}

// Partial success (some users not connected)
{
  success: true,
  deliveredTo: 1,
  totalSockets: 1,
  requestedUsers: 2
}

// Failure
{
  success: false,
  deliveredTo: 0,
  totalSockets: 0,
  requestedUsers: 2,
  error: "Socket.IO server returned 500: Internal Server Error"
}
```

## Testing

### Unit Testing

```typescript
import { SocketIOServer } from './SocketIOServer';

describe('SocketIOServer', () => {
  it('should broadcast to users', async () => {
    const server = new SocketIOServer('http://localhost:3001');
    
    const result = await server.broadcast(
      ['123', '456'],
      {
        title: { he: 'test', en: 'test' },
        body: { he: 'test', en: 'test' }
      },
      mockContext
    );
    
    expect(result.success).toBe(true);
    expect(result.requestedUsers).toBe(2);
  });
});
```

### Integration Testing

```typescript
// Test with real Socket.IO server
const server = new SocketIOServer('http://localhost:3001');

// Check health
const healthy = await server.healthCheck(context);
expect(healthy).toBe(true);

// Broadcast
const result = await server.broadcast(['123'], notification, context);
expect(result.success).toBe(true);
```

## Architecture

```
┌─────────────────────┐
│ NotificationOrch.   │
│                     │
│  - EmailService     │
│  - TelegramService  │
│  - PushService      │
│  - SocketIOServer ◄─┼─── New Integration
└──────────┬──────────┘
           │
           │ HTTP POST /broadcast
           │
┌──────────▼──────────┐
│  Socket.IO Server   │
│   (Port 3001)       │
└──────────┬──────────┘
           │
           │ WebSocket
           │
┌──────────▼──────────┐
│  Connected Clients  │
└─────────────────────┘
```

## Performance

- **Non-blocking**: Notifications are sent asynchronously
- **Parallel**: All channels (socket, email, telegram, push) send in parallel
- **Resilient**: Failures in one channel don't affect others
- **Fast**: Socket notifications are typically delivered in < 50ms

## Security

- Socket.IO server validates JWT tokens
- Only authenticated users can receive notifications
- CORS is configured to allow only trusted origins
- No sensitive data is logged

## Troubleshooting

### Notifications not being delivered

1. Check Socket.IO server is running:
   ```bash
   curl http://localhost:3001/health
   ```

2. Check users are connected:
   ```bash
   curl http://localhost:3001/stats
   ```

3. Check logs for errors:
   ```
   [SocketIOServer] Broadcast error: ...
   ```

### Server connection errors

1. Verify `SOCKET_SERVER_URL` environment variable
2. Check network connectivity
3. Verify Socket.IO server is running
4. Check firewall rules

### Users not receiving notifications

1. Verify users are authenticated on Socket.IO server
2. Check user IDs are correct
3. Verify users have active socket connections
4. Check client-side socket connection

## Related Documentation

- [Socket.IO Server README](../../../../socket-server/README.md)
- [NotificationOrchestrator README](./README.md)
- [Integration Guide](./INTEGRATION_GUIDE.md)
