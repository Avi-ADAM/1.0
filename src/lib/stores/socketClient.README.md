# Socket.IO Client for Unified Action System

## Overview

The Socket.IO client provides real-time notification capabilities for the Unified Action System. It automatically connects when a user is authenticated and handles reconnection, authentication, and notification delivery.

## Architecture

```
┌─────────────────┐
│  +layout.svelte │  ← Initializes connection on mount
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  socketClient   │  ← Manages connection lifecycle
│     (Store)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Socket.IO      │  ← Communicates with server
│    Server       │
└─────────────────┘
```

## Usage

### Basic Connection

The socket client is automatically initialized in `+layout.svelte` when a user is authenticated:

```typescript
import { socketClient } from '$lib/stores/socketClient';

// Connect (usually done automatically in layout)
socketClient.connect(userId, jwt);

// Check connection status
const state = socketClient.getState();
console.log('Connected:', state.connected);
console.log('Authenticated:', state.authenticated);
```

### Listening for Notifications

```typescript
import { socketClient } from '$lib/stores/socketClient';

// Register a notification listener
const unsubscribe = socketClient.onNotification((notification) => {
  console.log('Received:', notification);
  
  // Access notification data
  const title = notification.title.he; // or .en, .ar
  const body = notification.body.he;
  const url = notification.metadata?.url;
  
  // Handle the notification
  // e.g., show toast, update UI, navigate, etc.
});

// Cleanup when component unmounts
onDestroy(() => {
  unsubscribe();
});
```

### Monitoring Connection State

```typescript
import { socketClient } from '$lib/stores/socketClient';

// Subscribe to state changes
const unsubscribe = socketClient.subscribe((state) => {
  if (state.connected && state.authenticated) {
    console.log('Ready to receive notifications');
  }
  
  if (state.error) {
    console.error('Socket error:', state.error);
  }
  
  if (state.reconnecting) {
    console.log('Reconnecting...', state.reconnectAttempts);
  }
});
```

### Manual Disconnect

```typescript
import { socketClient } from '$lib/stores/socketClient';

// Disconnect (usually done automatically on page unload)
socketClient.disconnect();
```

## Notification Payload Structure

```typescript
interface NotificationPayload {
  actionKey?: string;  // The action that triggered this notification
  title: {
    he: string;
    en: string;
    ar?: string;
  };
  body: {
    he: string;
    en: string;
    ar?: string;
  };
  metadata?: {
    icon?: string;      // Icon URL
    url?: string;       // Navigation URL
    priority?: 'low' | 'normal' | 'high';
  };
  data?: any;          // Action-specific data
}
```

## Connection State

```typescript
interface SocketState {
  connected: boolean;        // TCP connection established
  authenticated: boolean;    // User authenticated with server
  userId: string | null;     // Current user ID
  error: string | null;      // Last error message
  reconnecting: boolean;     // Currently attempting to reconnect
  reconnectAttempts: number; // Number of reconnection attempts
}
```

## Configuration

Set the Socket.IO server URL in your environment variables:

```env
# .env
VITE_SOCKET_URL=http://localhost:3001
```

For production:

```env
# .env.production
VITE_SOCKET_URL=https://socket.yourdomain.com
```

## Reconnection Behavior

The client automatically handles reconnection with exponential backoff:

- **Initial delay**: 1 second
- **Max delay**: 30 seconds
- **Max attempts**: 10
- **Strategy**: Exponential backoff (1s, 2s, 4s, 8s, 16s, 30s, ...)

After max attempts, the client stops trying and displays an error. The user can refresh the page to retry.

## Error Handling

The client handles various error scenarios:

### Authentication Errors
- Missing credentials
- Invalid JWT
- Expired JWT
- User ID mismatch

**Action**: Socket disconnects immediately, error displayed to user

### Connection Errors
- Network unavailable
- Server unreachable
- Timeout

**Action**: Automatic reconnection with exponential backoff

### Server Disconnect
- Server shutdown
- Server restart
- Load balancer issues

**Action**: Automatic reconnection

## Integration with Action System

The socket client works seamlessly with the Action System:

1. User performs an action via `executeAction()`
2. Action Service processes the action
3. Notification Orchestrator identifies recipients
4. Socket.IO Server broadcasts to connected users
5. Socket Client receives notification
6. Notification listener handles the update

```typescript
// Example: Update UI when task is updated
socketClient.onNotification((notification) => {
  if (notification.actionKey === 'updateTask') {
    // Refresh task list
    invalidate('tasks');
  }
});
```

## Best Practices

### 1. Single Connection
Only one socket connection should exist per user session. The layout handles this automatically.

### 2. Cleanup Listeners
Always unsubscribe from notification listeners when components unmount:

```typescript
onDestroy(() => {
  unsubscribe();
});
```

### 3. Language Selection
Always use the user's preferred language when displaying notifications:

```typescript
const userLang = $locale || 'he';
const message = notification.title[userLang] || notification.title.he;
```

### 4. Error Display
Show connection errors to users in a non-intrusive way:

```typescript
$: if ($socketClient.error) {
  toast.error('Connection issue: ' + $socketClient.error);
}
```

### 5. Offline Handling
Handle offline scenarios gracefully:

```typescript
$: if (!$socketClient.connected) {
  // Show offline indicator
  // Disable real-time features
  // Queue actions for later
}
```

## Testing

### Manual Testing

1. Start the Socket.IO server:
```bash
cd socket-server
npm run dev
```

2. Start the SvelteKit app:
```bash
npm run dev
```

3. Login as a user
4. Check browser console for connection logs
5. Trigger an action that sends notifications
6. Verify notification appears

### Testing Reconnection

1. Stop the Socket.IO server
2. Observe reconnection attempts in console
3. Restart the server
4. Verify automatic reconnection

### Testing Multiple Sessions

1. Open app in multiple browser tabs
2. Login as the same user
3. Trigger a notification
4. Verify all tabs receive the notification

## Troubleshooting

### Connection Fails Immediately

**Symptoms**: Socket connects then disconnects immediately

**Causes**:
- Invalid JWT
- User ID mismatch
- Server authentication failure

**Solution**: Check JWT validity and user ID

### Cannot Connect

**Symptoms**: Connection never establishes

**Causes**:
- Wrong SOCKET_URL
- Server not running
- CORS issues
- Firewall blocking

**Solution**: Verify server URL and CORS configuration

### Notifications Not Received

**Symptoms**: Connected but no notifications

**Causes**:
- Not authenticated
- No notification listeners registered
- Server not broadcasting

**Solution**: Check authentication status and listener registration

### Frequent Disconnections

**Symptoms**: Connects then disconnects repeatedly

**Causes**:
- Network instability
- Server overload
- Timeout too short

**Solution**: Check network and server health

## Related Documentation

- [Socket.IO Server](../../../socket-server/README.md)
- [Action Client](../client/actionClient.ts)
- [Notification Orchestrator](../server/notifications/NotificationOrchestrator.ts)
- [Action System Design](.kiro/specs/unified-action-system/design.md)
