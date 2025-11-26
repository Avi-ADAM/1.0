# Action Client Guide

The Action Client provides a simple, type-safe interface for executing server actions from the client-side code.

## Table of Contents

- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Type-Safe Helpers](#type-safe-helpers)
- [Error Handling](#error-handling)
- [Update Strategies](#update-strategies)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Quick Start

### Basic Usage

```typescript
import { executeAction } from '$lib/client/actionClient';

// Execute an action
const result = await executeAction('updateTask', {
  id: '123',
  projectId: '456',
  myIshur: true
});

if (result.success) {
  console.log('Success!', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Type-Safe Usage

```typescript
import { updateTask } from '$lib/client/actionClient';

// Type-safe action execution with autocomplete
const result = await updateTask({
  id: '123',
  projectId: '456',
  myIshur: true  // TypeScript knows this is a boolean
});
```

### With User Feedback

```typescript
import { updateTask } from '$lib/client/actionClient';

const result = await updateTask({
  id: '123',
  projectId: '456',
  myIshur: true
}, {
  showSuccessToast: true,
  successMessage: 'Task approved successfully!',
  showErrorToast: true  // Enabled by default
});
```

## Core Concepts

### Actions

Actions are server-side operations that:
- Validate parameters
- Check authorization
- Execute database operations
- Send notifications
- Return results with update strategies

### Action Keys

Each action has a unique key (e.g., `'updateTask'`, `'createMessage'`). The action key determines:
- What parameters are required
- What authorization checks are performed
- What notifications are sent
- How the client should update

### Update Strategies

After an action completes, the client can automatically update the UI using one of these strategies:
- **fullRefresh**: Reload all data (safest, slowest)
- **partialUpdate**: Reload specific data keys (balanced)
- **optimistic**: Apply changes immediately (fastest, requires custom function)
- **none**: No automatic update

## API Reference

### `executeAction()`

Execute any action by its key.

```typescript
function executeAction<K extends ActionKey>(
  actionKey: K,
  params: ActionParamsMap[K],
  options?: ExecuteActionOptions
): Promise<ActionResponse>
```

**Parameters:**
- `actionKey`: The unique identifier for the action
- `params`: Parameters required by the action
- `options`: Optional configuration

**Options:**
```typescript
interface ExecuteActionOptions {
  fetch?: typeof globalThis.fetch;      // Required in SSR
  onSuccess?: (data: any) => void;      // Success callback
  onError?: (error: any) => void;       // Error callback
  skipUpdateStrategy?: boolean;         // Skip automatic updates
  showSuccessToast?: boolean;           // Show success notification
  successMessage?: string;              // Custom success message
  showErrorToast?: boolean;             // Show error notification (default: true)
}
```

**Returns:**
```typescript
interface ActionResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  updateStrategy?: {
    type: 'fullRefresh' | 'partialUpdate' | 'optimistic' | 'none';
    config?: {
      dataKeys?: string[];
      updateFunction?: string;
    };
  };
}
```

### `displayActionError()`

Display an error message to the user.

```typescript
function displayActionError(error: ActionResponse['error']): void
```

Uses toast notifications if available, falls back to console.error and alert.

### `displayActionSuccess()`

Display a success message to the user.

```typescript
function displayActionSuccess(message: string): void
```

Uses toast notifications if available, falls back to console.log.

## Type-Safe Helpers

### `updateTask()`

Update a task (Act) in a project.

```typescript
function updateTask(
  params: UpdateTaskParams,
  options?: ExecuteActionOptions
): Promise<ActionResponse>
```

**Parameters:**
```typescript
interface UpdateTaskParams {
  id: string;                      // Task ID (required)
  projectId: string;               // Project ID (required)
  myIshur?: boolean;               // Approval by assignee
  valiIshur?: boolean;             // Approval by validator
  isAssigned?: boolean;            // Assignment status
  uid?: string[];                  // Assigned user IDs
  mesimabetahaliches?: string[];   // Associated mission IDs
}
```

**Example:**
```typescript
const result = await updateTask({
  id: '123',
  projectId: '456',
  myIshur: true,
  uid: ['user1', 'user2']
});
```

## Error Handling

### Error Codes

The action client provides standardized error codes:

| Code | Meaning | User Message |
|------|---------|--------------|
| `VALIDATION_FAILED` | Invalid parameters | "Invalid input. Please check your data and try again." |
| `UNAUTHORIZED` | No permission | "You do not have permission to perform this action." |
| `NOT_FOUND` | Resource not found | "The requested resource was not found." |
| `STRAPI_ERROR` | Server error | "A server error occurred. Please try again later." |
| `INTERNAL_ERROR` | Unexpected error | "An unexpected error occurred. Please try again later." |
| `NETWORK_ERROR` | Connection issue | "Network error. Please check your connection and try again." |
| `UNKNOWN_ACTION` | Invalid action key | "This action is not available." |

### Handling Errors

```typescript
const result = await updateTask(params, {
  onError: (error) => {
    // Custom error handling
    if (error.code === 'UNAUTHORIZED') {
      // Redirect to login
      goto('/login');
    } else {
      // Show error to user
      displayActionError(error);
    }
  }
});

// Or check result
if (!result.success) {
  console.error('Action failed:', result.error);
}
```

## Update Strategies

### Full Refresh

Reloads all data on the page. Safest but slowest.

```typescript
// Server returns:
{
  updateStrategy: {
    type: 'fullRefresh'
  }
}

// Client automatically calls:
await invalidate(() => true);
```

### Partial Update

Reloads specific data keys. Balanced approach.

```typescript
// Server returns:
{
  updateStrategy: {
    type: 'partialUpdate',
    config: {
      dataKeys: ['arr1', 'projectData']
    }
  }
}

// Client automatically calls:
await invalidate('arr1');
await invalidate('projectData');
```

### Optimistic Update

Applies changes immediately using a custom function. Fastest.

```typescript
// Server returns:
{
  updateStrategy: {
    type: 'optimistic',
    config: {
      updateFunction: 'refreshTaskList'
    }
  }
}

// Client looks for window.refreshTaskList or window.updateStrategies.refreshTaskList
// and calls it with the action result data
```

### No Update

Action doesn't affect client state.

```typescript
{
  updateStrategy: {
    type: 'none'
  }
}
```

### Skipping Update Strategies

```typescript
const result = await updateTask(params, {
  skipUpdateStrategy: true  // Don't apply update strategy
});

// Manually update if needed
if (result.success) {
  await invalidate('arr1');
}
```

## Examples

### Example 1: Simple Task Update

```typescript
import { updateTask } from '$lib/client/actionClient';

async function approveTask(taskId: string, projectId: string) {
  const result = await updateTask({
    id: taskId,
    projectId: projectId,
    myIshur: true
  }, {
    showSuccessToast: true,
    successMessage: 'Task approved!'
  });
  
  return result.success;
}
```

### Example 2: With Error Handling

```typescript
import { updateTask, displayActionError } from '$lib/client/actionClient';

async function assignTask(taskId: string, projectId: string, userIds: string[]) {
  const result = await updateTask({
    id: taskId,
    projectId: projectId,
    isAssigned: true,
    uid: userIds
  }, {
    showErrorToast: false,  // Handle errors manually
    onSuccess: (data) => {
      console.log('Task assigned:', data);
    },
    onError: (error) => {
      if (error.code === 'UNAUTHORIZED') {
        alert('You need permission to assign tasks');
      } else {
        displayActionError(error);
      }
    }
  });
  
  return result;
}
```

### Example 3: In Svelte Component

```svelte
<script lang="ts">
  import { updateTask } from '$lib/client/actionClient';
  
  export let taskId: string;
  export let projectId: string;
  
  let loading = false;
  
  async function handleApprove() {
    loading = true;
    
    const result = await updateTask({
      id: taskId,
      projectId: projectId,
      myIshur: true
    }, {
      showSuccessToast: true,
      successMessage: 'Task approved successfully!'
    });
    
    loading = false;
    
    if (result.success) {
      // Task list will be automatically updated via update strategy
      console.log('Task approved');
    }
  }
</script>

<button on:click={handleApprove} disabled={loading}>
  {loading ? 'Approving...' : 'Approve Task'}
</button>
```

### Example 4: SSR Context

```typescript
// In +page.server.ts or +server.ts
import { executeAction } from '$lib/client/actionClient';

export async function load({ fetch, cookies }) {
  const result = await executeAction('updateTask', {
    id: '123',
    projectId: '456',
    myIshur: true
  }, {
    fetch  // Pass fetch from load context
  });
  
  return {
    result
  };
}
```

### Example 5: Multiple Actions

```typescript
import { updateTask } from '$lib/client/actionClient';

async function approveMultipleTasks(tasks: Array<{id: string, projectId: string}>) {
  const results = await Promise.all(
    tasks.map(task => 
      updateTask({
        id: task.id,
        projectId: task.projectId,
        myIshur: true
      }, {
        skipUpdateStrategy: true  // Skip individual updates
      })
    )
  );
  
  // Check if all succeeded
  const allSucceeded = results.every(r => r.success);
  
  if (allSucceeded) {
    // Manually refresh once after all updates
    await invalidate('arr1');
    displayActionSuccess('All tasks approved!');
  } else {
    displayActionError({
      code: 'PARTIAL_FAILURE',
      message: 'Some tasks could not be approved'
    });
  }
  
  return allSucceeded;
}
```

## Best Practices

### 1. Use Type-Safe Helpers

Prefer type-safe helpers over generic `executeAction`:

```typescript
// Good
await updateTask({ id: '123', projectId: '456', myIshur: true });

// Less good (no type checking)
await executeAction('updateTask', { id: '123', projectId: '456', myIshur: true });
```

### 2. Provide User Feedback

Always show feedback for user-initiated actions:

```typescript
await updateTask(params, {
  showSuccessToast: true,
  successMessage: 'Task updated!'
});
```

### 3. Handle Errors Appropriately

Don't ignore errors:

```typescript
const result = await updateTask(params);

if (!result.success) {
  // Handle the error
  console.error('Failed to update task:', result.error);
}
```

### 4. Use Loading States

Show loading indicators during actions:

```typescript
let loading = false;

async function handleAction() {
  loading = true;
  try {
    await updateTask(params);
  } finally {
    loading = false;
  }
}
```

### 5. Batch Updates When Possible

For multiple related actions, skip individual updates and refresh once:

```typescript
for (const task of tasks) {
  await updateTask(task, { skipUpdateStrategy: true });
}
await invalidate('arr1');  // Refresh once
```

### 6. Pass Fetch in SSR

Always pass fetch function in server-side contexts:

```typescript
export async function load({ fetch }) {
  await executeAction('updateTask', params, { fetch });
}
```

### 7. Validate Before Sending

Validate data on the client before sending to reduce errors:

```typescript
if (!taskId || !projectId) {
  displayActionError({
    code: 'VALIDATION_FAILED',
    message: 'Task ID and Project ID are required'
  });
  return;
}

await updateTask({ id: taskId, projectId, myIshur: true });
```

## Adding New Actions

When new actions are added to the system:

1. Add the action key to `ActionKey` type
2. Add parameter interface (e.g., `CreateMessageParams`)
3. Add to `ActionParamsMap`
4. Create type-safe helper function
5. Update this documentation

Example:

```typescript
// 1. Add action key
export type ActionKey = 
  | 'updateTask'
  | 'createMessage'  // New action
  ;

// 2. Add parameter interface
export interface CreateMessageParams {
  forumId: string;
  content: string;
  attachments?: string[];
}

// 3. Add to map
export interface ActionParamsMap {
  updateTask: UpdateTaskParams;
  createMessage: CreateMessageParams;  // New action
}

// 4. Create helper
export async function createMessage(
  params: CreateMessageParams,
  options: ExecuteActionOptions = {}
): Promise<ActionResponse> {
  return executeAction('createMessage', params, options);
}
```

## Related Documentation

- [Action System Design](../../server/actions/README.md)
- [Update Strategies Guide](./UPDATE_STRATEGY_GUIDE.md)
- [Socket Client Guide](./SOCKET_CLIENT_GUIDE.md)
- [Action Configuration](../../server/actions/configs/README.md)
