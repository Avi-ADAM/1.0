# Update Strategy Guide

## Overview

The Update Strategy system provides a flexible way to keep the client UI in sync with server state after actions complete. It supports multiple strategies ranging from simple full-page refreshes to sophisticated optimistic updates.

## Strategy Types

### 1. Full Refresh (`fullRefresh`)

**When to use:**
- Major data changes that affect multiple parts of the UI
- When you're unsure what data needs updating
- For critical operations where consistency is paramount

**How it works:**
- Invalidates all SvelteKit load functions
- Triggers a complete data refresh for the current page
- Safest but slowest option

**Example:**
```typescript
const config: ActionConfig = {
  key: 'createProject',
  // ... other config
  updateStrategy: {
    type: 'fullRefresh'
  }
};
```

**Use cases:**
- Creating a new project
- Major configuration changes
- User role changes

### 2. Partial Update (`partialUpdate`)

**When to use:**
- You know exactly which data needs refreshing
- Want better performance than full refresh
- Changes affect specific, identifiable data

**How it works:**
- Invalidates only specified data keys
- SvelteKit re-runs only the affected load functions
- More efficient than full refresh

**Example:**
```typescript
const config: ActionConfig = {
  key: 'updateTask',
  // ... other config
  updateStrategy: {
    type: 'partialUpdate',
    config: {
      dataKeys: ['arr1', 'project:123']
    }
  }
};
```

**Use cases:**
- Updating a task (refresh task list)
- Adding a project member (refresh member list)
- Updating user profile (refresh user data)

### 3. Optimistic Update (`optimistic`)

**When to use:**
- Need immediate UI feedback
- Action is likely to succeed
- Want the best user experience

**How it works:**
- Calls a custom update function immediately
- Updates UI before server confirms
- Provides instant feedback to users

**Example:**
```typescript
const config: ActionConfig = {
  key: 'startTimer',
  // ... other config
  updateStrategy: {
    type: 'optimistic',
    config: {
      updateFunction: 'updateTimerState',
      timerId: '{{timerId}}' // Can use template variables
    }
  }
};
```

**Use cases:**
- Starting/stopping timers
- Liking/unliking content
- Simple state toggles
- Real-time collaboration features

### 4. No Update (`none`)

**When to use:**
- Action doesn't affect visible UI state
- You'll handle updates manually
- Action is purely server-side

**How it works:**
- No automatic updates are triggered
- You can still handle updates manually in callbacks

**Example:**
```typescript
const config: ActionConfig = {
  key: 'logEvent',
  // ... other config
  updateStrategy: {
    type: 'none'
  }
};
```

**Use cases:**
- Analytics events
- Background sync operations
- Logging actions

## Implementation Guide

### Server-Side Configuration

Define the update strategy in your action configuration:

```typescript
// src/lib/server/actions/configs/updateTask.ts
import { registerAction } from '../registry.js';

registerAction({
  key: 'updateTask',
  description: 'Update a task',
  graphqlOperation: '31updateTask',
  paramSchema: {
    taskId: { type: 'string', required: true },
    status: { type: 'string', required: false }
  },
  authRules: [
    { type: 'jwt' },
    { type: 'projectMember', config: { projectIdParam: 'projectId' } }
  ],
  updateStrategy: {
    type: 'partialUpdate',
    config: {
      dataKeys: ['arr1'] // Refresh task list
    }
  }
});
```

### Client-Side Usage

#### Basic Usage

```typescript
import { executeAction } from '$lib/client/actionClient';

// Execute action - update strategy runs automatically
const result = await executeAction('updateTask', {
  taskId: '123',
  status: 'completed'
});

if (result.success) {
  console.log('Task updated and UI refreshed');
}
```

#### With Callbacks

```typescript
const result = await executeAction('updateTask', {
  taskId: '123',
  status: 'completed'
}, {
  onSuccess: (data) => {
    console.log('Success!', data);
    // Custom success handling
  },
  onError: (error) => {
    console.error('Failed:', error);
    // Custom error handling
  }
});
```

#### Skip Automatic Strategy

```typescript
const result = await executeAction('updateTask', {
  taskId: '123',
  status: 'completed'
}, {
  skipUpdateStrategy: true // Don't execute strategy automatically
});

// Handle strategy manually
if (result.success && result.updateStrategy) {
  // Custom strategy handling
}
```

### Creating Custom Update Functions

#### 1. Register a Simple Function

```typescript
import { registerStrategy } from '$lib/client/updateStrategies';

registerStrategy('updateMyComponent', (data, config) => {
  console.log('Updating component with:', data);
  // Update your component state
});
```

#### 2. Register in Layout (Recommended)

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { registerUpdateStrategies } from '$lib/client/updateStrategies';
  
  onMount(() => {
    // Register all built-in strategies
    registerUpdateStrategies();
  });
</script>
```

#### 3. Create Store-Based Strategy

```typescript
import { writable } from 'svelte/store';
import { createStoreUpdateStrategy } from '$lib/client/updateStrategies';

const myStore = writable([]);

const updateStrategy = createStoreUpdateStrategy(
  myStore,
  (current, data, config) => {
    // Return new store value
    return [...current, data];
  }
);

registerStrategy('updateMyStore', updateStrategy);
```

#### 4. Create Array Manipulation Strategies

```typescript
import { writable } from 'svelte/store';
import {
  createAppendStrategy,
  createRemoveStrategy,
  createUpdateItemStrategy
} from '$lib/client/updateStrategies';

const items = writable([]);

// Append item to array
registerStrategy('appendItem', createAppendStrategy(items));

// Remove item from array
registerStrategy('removeItem', createRemoveStrategy(items, 'id'));

// Update item in array
registerStrategy('updateItem', createUpdateItemStrategy(items, 'id'));
```

## Socket Integration

Update strategies work seamlessly with Socket.IO notifications:

```typescript
import { socketClient } from '$lib/stores/socketClient';
import { handleSocketUpdate } from '$lib/client/updateStrategies';

// Listen for notifications
socketClient.onNotification(async (notification) => {
  console.log('Received notification:', notification);
  
  // Automatically apply update strategy if present
  await handleSocketUpdate(notification);
});
```

## Best Practices

### 1. Choose the Right Strategy

- **Use `fullRefresh`** when in doubt or for critical operations
- **Use `partialUpdate`** when you know specific data keys
- **Use `optimistic`** for instant feedback on likely-to-succeed actions
- **Use `none`** for actions that don't affect UI

### 2. Data Key Naming

Use consistent, descriptive data keys:

```typescript
// Good
dataKeys: ['arr1', 'project:123', 'user:456']

// Bad
dataKeys: ['data', 'stuff', 'things']
```

### 3. Optimistic Updates

Always have a fallback for optimistic updates:

```typescript
registerStrategy('updateLike', async (data, config) => {
  try {
    // Optimistic update
    updateLikeCount(data.itemId, +1);
  } catch (error) {
    // Fallback to refresh
    await invalidate(`item:${data.itemId}`);
  }
});
```

### 4. Error Handling

Update strategies only run on success:

```typescript
const result = await executeAction('updateTask', params);

if (result.success) {
  // Strategy was executed
} else {
  // Strategy was NOT executed
  // Handle error state
}
```

### 5. Testing Strategies

Test your update strategies:

```typescript
import { describe, it, expect } from 'vitest';
import { getStrategy } from '$lib/client/updateStrategies';

describe('Update Strategies', () => {
  it('should update task list', async () => {
    const strategy = getStrategy('updateTaskList');
    expect(strategy).toBeDefined();
    
    // Test the strategy
    await strategy({ taskId: '123' });
    // Assert expected behavior
  });
});
```

## Common Patterns

### Pattern 1: List Updates

```typescript
// Add item to list
updateStrategy: {
  type: 'optimistic',
  config: {
    updateFunction: 'appendToList',
    listKey: 'tasks'
  }
}

// Remove item from list
updateStrategy: {
  type: 'optimistic',
  config: {
    updateFunction: 'removeFromList',
    listKey: 'tasks',
    idKey: 'taskId'
  }
}

// Update item in list
updateStrategy: {
  type: 'optimistic',
  config: {
    updateFunction: 'updateInList',
    listKey: 'tasks',
    idKey: 'taskId'
  }
}
```

### Pattern 2: Nested Data Updates

```typescript
// Update nested project data
updateStrategy: {
  type: 'partialUpdate',
  config: {
    dataKeys: [
      'project:123',
      'project:123:members',
      'project:123:tasks'
    ]
  }
}
```

### Pattern 3: Multi-Component Updates

```typescript
// Update multiple components
updateStrategy: {
  type: 'optimistic',
  config: {
    updateFunction: 'updateMultiple',
    updates: [
      { component: 'taskList', action: 'refresh' },
      { component: 'projectStats', action: 'increment' },
      { component: 'notifications', action: 'add' }
    ]
  }
}
```

### Pattern 4: Conditional Updates

```typescript
registerStrategy('conditionalUpdate', async (data, config) => {
  if (config.condition === 'taskCompleted') {
    await invalidate('arr1');
    await invalidate('completedTasks');
  } else if (config.condition === 'taskCreated') {
    await invalidate('arr1');
  }
});
```

## Troubleshooting

### Strategy Not Executing

1. Check that the action succeeded (`result.success === true`)
2. Verify the strategy is defined in action config
3. Check console for error messages
4. Ensure update function is registered (for optimistic)

### Data Not Refreshing

1. Verify data keys match your load function dependencies
2. Check that invalidate is being called
3. Ensure load functions are properly set up
4. Check network tab for refetch requests

### Optimistic Update Not Working

1. Verify update function is registered
2. Check function name matches config
3. Ensure function is registered before action executes
4. Check console for warnings

### Performance Issues

1. Use `partialUpdate` instead of `fullRefresh`
2. Minimize number of data keys to invalidate
3. Use optimistic updates for instant feedback
4. Consider debouncing rapid updates

## Migration from Old System

### Before (Old QIDS System)

```typescript
import { sendToSer } from '$lib/send/sendToSer.js';

// Manual update after action
const result = await sendToSer(params, '31updateTask', 0, 0, false, fetch);
if (result) {
  // Manually refresh data
  arr1 = await loadTasks();
}
```

### After (New Action System)

```typescript
import { executeAction } from '$lib/client/actionClient';

// Automatic update via strategy
const result = await executeAction('updateTask', params);
// Data automatically refreshed via updateStrategy
```

## Advanced Topics

### Dynamic Data Keys

```typescript
updateStrategy: {
  type: 'partialUpdate',
  config: {
    dataKeys: ['project:{{projectId}}', 'user:{{userId}}']
  }
}

// Keys are interpolated with actual values at runtime
```

### Chained Updates

```typescript
registerStrategy('chainedUpdate', async (data, config) => {
  // Update multiple things in sequence
  await invalidate('tasks');
  await new Promise(resolve => setTimeout(resolve, 100));
  await invalidate('projects');
});
```

### Conditional Strategies

```typescript
// In action config
updateStrategy: {
  type: 'optimistic',
  config: {
    updateFunction: 'conditionalUpdate',
    condition: '{{status}}' // Passed from action params
  }
}
```

## API Reference

### `executeAction(actionKey, params, options)`

Execute an action with automatic update strategy handling.

**Parameters:**
- `actionKey: string` - Action identifier
- `params: Record<string, any>` - Action parameters
- `options?: object` - Optional configuration
  - `fetch?: Function` - Custom fetch function
  - `onSuccess?: Function` - Success callback
  - `onError?: Function` - Error callback
  - `skipUpdateStrategy?: boolean` - Skip automatic strategy execution

**Returns:** `Promise<ActionResponse>`

### `registerStrategy(name, fn)`

Register a custom update strategy function.

**Parameters:**
- `name: string` - Strategy name
- `fn: UpdateStrategyFunction` - Strategy function

### `registerUpdateStrategies()`

Register all built-in update strategies. Call once in root layout.

### `handleSocketUpdate(notification)`

Handle socket notification with update strategy.

**Parameters:**
- `notification: any` - Notification payload from socket

**Returns:** `Promise<void>`

## Examples

See `src/lib/client/examples/update-strategy-example.svelte` for comprehensive examples of all strategy types and patterns.
