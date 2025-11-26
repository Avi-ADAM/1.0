# Socket Client Implementation Guide

## Quick Start

### 1. Automatic Connection (Recommended)

The socket client automatically connects when a user is authenticated. This is handled in `+layout.svelte`:

```typescript
// Already implemented in src/routes/+layout.svelte
import { socketClient } from '$lib/stores/socketClient';

onMount(() => {
  if (browser && data?.id && data?.jwt) {
    socketClient.connect(String(data.id), data.jwt);
    
    const unsubscribe = socketClient.onNotification((notification) => {
      // Handle notification
      toast.info(notification.title[userLang]);
    });
    
    return () => {
      unsubscribe();
      socketClient.disconnect();
    };
  }
});
```

### 2. Listen for Notifications in Components

```typescript
import { socketClient } from '$lib/stores/socketClient';
import { onMount, onDestroy } from 'svelte';

let unsubscribe: (() => void) | null = null;

onMount(() => {
  unsubscribe = socketClient.onNotification((notification) => {
    console.log('Received:', notification);
    
    // Update your component state
    if (notification.actionKey === 'updateTask') {
      refreshTasks();
    }
  });
});

onDestroy(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
```

### 3. Execute Actions with Real-Time Updates

```typescript
import { executeAction } from '$lib/client/actionClient';

async function updateTask() {
  const result = await executeAction('updateTask', {
    taskId: '123',
    status: 'completed'
  });
  
  if (result.success) {
    // Action succeeded
    // Other users will receive notification via socket
    console.log('Task updated:', result.data);
  }
}
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      User Browser                            │
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │  Component   │         │   Layout     │                 │
│  │              │         │              │                 │
│  │ executeAction│         │ socketClient │                 │
│  └──────┬───────┘         └──────┬───────┘                 │
│         │                        │                          │
│         │ POST /api/action       │ WebSocket                │
│         ▼                        ▼                          │
└─────────┼────────────────────────┼──────────────────────────┘
          │                        │
          │                        │
┌─────────▼────────────────────────▼──────────────────────────┐
│                    Server Infrastructure                     │
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │ Action API   │         │  Socket.IO   │                 │
│  │  Endpoint    │         │   Server     │                 │
│  └──────┬───────┘         └──────▲───────┘                 │
│         │                        │                          │
│         │                        │                          │
│  ┌──────▼───────┐         ┌──────┴───────┐                 │
│  │   Action     │────────▶│ Notification │                 │
│  │   Service    │         │ Orchestrator │                 │
│  └──────┬───────┘         └──────────────┘                 │
│         │                                                    │
│  ┌──────▼───────┐                                          │
│  │   Strapi     │                                          │
│  │   Database   │                                          │
│  └──────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
```

## Complete Flow Example

### Scenario: User Updates a Task

1. **User Action**
   ```typescript
   // Component A (user clicks "Complete Task")
   await executeAction('updateTask', {
     taskId: '123',
     status: 'completed'
   });
   ```

2. **Action Processing**
   - Request sent to `/api/action`
   - Action Service validates parameters
   - Action Service checks authorization
   - Action Service updates Strapi database
   - Action Service triggers notifications

3. **Notification Broadcasting**
   - Notification Orchestrator identifies recipients (project members)
   - Sends to Socket.IO server
   - Socket.IO server broadcasts to all connected users

4. **Real-Time Update**
   ```typescript
   // Component B (another user's browser)
   socketClient.onNotification((notification) => {
     if (notification.actionKey === 'updateTask') {
       // Refresh task list
       invalidate('tasks');
     }
   });
   ```

## API Reference

### Socket Client Store

```typescript
import { socketClient } from '$lib/stores/socketClient';

// Connect to server
socketClient.connect(userId: string, jwt: string): void

// Disconnect from server
socketClient.disconnect(): void

// Register notification listener
socketClient.onNotification(callback: (notification) => void): () => void

// Send ping (health check)
socketClient.ping(): void

// Get current state
socketClient.getState(): SocketState

// Check if ready
socketClient.isReady(): boolean

// Subscribe to state changes (Svelte store)
socketClient.subscribe(callback: (state) => void): () => void
```

### Action Client

```typescript
import { executeAction, displayActionError, displayActionSuccess } from '$lib/client/actionClient';

// Execute an action
executeAction(
  actionKey: string,
  params: Record<string, any>,
  options?: {
    fetch?: typeof globalThis.fetch;
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
    skipUpdateStrategy?: boolean;
  }
): Promise<ActionResponse>

// Display error to user
displayActionError(error: ActionResponse['error']): void

// Display success to user
displayActionSuccess(message: string): void
```

## Common Patterns

### Pattern 1: Action with Notification

```typescript
// Execute action and let socket handle updates
async function createMessage(content: string) {
  const result = await executeAction('createMessage', {
    forumId: currentForum.id,
    content
  });
  
  if (result.success) {
    // Local update (optimistic)
    messages = [...messages, result.data];
    
    // Other users will receive via socket
  }
}
```

### Pattern 2: Selective Updates

```typescript
// Only update if notification is relevant
socketClient.onNotification((notification) => {
  if (notification.actionKey === 'updateTask') {
    const taskId = notification.data?.taskId;
    
    // Only refresh if it's a task we're displaying
    if (currentTasks.some(t => t.id === taskId)) {
      refreshTasks();
    }
  }
});
```

### Pattern 3: Multi-Tab Sync

```typescript
// Keep multiple tabs in sync
socketClient.onNotification((notification) => {
  // Update local state based on notification
  switch (notification.actionKey) {
    case 'updateTask':
      updateLocalTask(notification.data);
      break;
    case 'createMessage':
      addLocalMessage(notification.data);
      break;
    case 'deleteItem':
      removeLocalItem(notification.data);
      break;
  }
});
```

### Pattern 4: Connection Status UI

```typescript
<script>
  import { socketClient } from '$lib/stores/socketClient';
  
  const socketState = $derived($socketClient);
</script>

{#if !socketState.connected}
  <div class="offline-banner">
    You're offline. Changes will sync when reconnected.
  </div>
{:else if socketState.reconnecting}
  <div class="reconnecting-banner">
    Reconnecting... (Attempt {socketState.reconnectAttempts})
  </div>
{/if}
```

## Testing

### Manual Testing

1. **Start Socket Server**
   ```bash
   cd socket-server
   npm run dev
   ```

2. **Start SvelteKit App**
   ```bash
   npm run dev
   ```

3. **Open Test Page**
   Navigate to: `http://localhost:5173/test-socket`

4. **Test Scenarios**
   - Connection/disconnection
   - Authentication
   - Notification reception
   - Reconnection behavior
   - Multi-tab sync

### Automated Testing

```bash
# Run socket client tests
npm test src/lib/stores/socketClient.test.ts
```

## Troubleshooting

### Problem: Socket won't connect

**Check:**
1. Is Socket.IO server running? (`cd socket-server && npm run dev`)
2. Is VITE_SOCKET_URL correct in .env?
3. Are there CORS issues? (Check browser console)
4. Is JWT valid?

**Solution:**
```bash
# Check server is running
curl http://localhost:3001/health

# Check environment variable
echo $VITE_SOCKET_URL
```

### Problem: Notifications not received

**Check:**
1. Is socket connected AND authenticated?
2. Are notification listeners registered?
3. Is the action configured to send notifications?
4. Are you in the recipient list?

**Debug:**
```typescript
// Check connection status
console.log('Socket state:', socketClient.getState());

// Verify listener is registered
const unsubscribe = socketClient.onNotification((n) => {
  console.log('Notification received:', n);
});
```

### Problem: Frequent disconnections

**Check:**
1. Network stability
2. Server health
3. JWT expiration
4. Firewall/proxy issues

**Solution:**
- Check server logs
- Monitor reconnection attempts
- Verify JWT hasn't expired

## Best Practices

### 1. Always Cleanup Listeners

```typescript
onDestroy(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
```

### 2. Use Language-Aware Messages

```typescript
const userLang = $locale || 'he';
const message = notification.title[userLang] || notification.title.he;
```

### 3. Handle Offline Gracefully

```typescript
if (!socketClient.isReady()) {
  // Queue action or show offline message
  toast.warning('You are offline. Action will sync when reconnected.');
}
```

### 4. Avoid Memory Leaks

```typescript
// ❌ Bad: Listener never cleaned up
socketClient.onNotification((n) => {
  updateUI(n);
});

// ✅ Good: Listener cleaned up on unmount
const unsubscribe = socketClient.onNotification((n) => {
  updateUI(n);
});

onDestroy(() => {
  unsubscribe();
});
```

### 5. Debounce Rapid Updates

```typescript
import { debounce } from 'lodash';

const debouncedRefresh = debounce(() => {
  refreshData();
}, 500);

socketClient.onNotification((notification) => {
  debouncedRefresh();
});
```

## Configuration

### Environment Variables

```env
# .env.development
VITE_SOCKET_URL=http://localhost:3001

# .env.production
VITE_SOCKET_URL=https://socket.yourdomain.com
```

### Socket Options

Configured in `src/lib/stores/socketClient.ts`:

```typescript
const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10,
  timeout: 20000,
  transports: ['websocket', 'polling']
});
```

## Related Documentation

- [Socket Client Store](../stores/socketClient.README.md)
- [Action Client](./actionClient.ts)
- [Socket.IO Server](../../../socket-server/README.md)
- [Notification Orchestrator](../server/notifications/NotificationOrchestrator.ts)
- [Design Document](../../../.kiro/specs/unified-action-system/design.md)

## Examples

- [Complete Example Component](./examples/socket-action-example.svelte)
- [Test Page](../../routes/test-socket/+page.svelte)
- [Layout Integration](../../routes/+layout.svelte)
