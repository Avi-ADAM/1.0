# Action Configurations

This directory contains all action configurations for the Unified Action System.

## Overview

Each action configuration defines:
- **Action Key**: Unique identifier for the action
- **GraphQL Operation**: QIDS query ID to execute
- **Parameter Schema**: Validation rules for parameters
- **Authorization Rules**: Who can execute the action
- **Notification Configuration**: Who gets notified and how
- **Update Strategy**: How clients should update their UI

## Creating a New Action

### 1. Create Configuration File

Create a new file `src/lib/server/actions/configs/yourAction.ts`:

```typescript
import type { ActionConfig } from '../types.js';

export const yourActionConfig: ActionConfig = {
  key: 'yourAction',
  description: 'Description of what this action does',
  graphqlOperation: 'XXyourQidsQuery', // QIDS query ID
  
  paramSchema: {
    // Required parameters
    id: {
      type: 'string',
      required: true,
      description: 'ID of the resource'
    },
    // Optional parameters
    name: {
      type: 'string',
      required: false,
      description: 'Optional name',
      validate: (value) => value.length > 0 // Custom validation
    }
  },
  
  authRules: [
    {
      type: 'jwt',
      errorMessage: 'You must be logged in'
    },
    {
      type: 'projectMember',
      config: {
        projectIdParam: 'projectId'
      },
      errorMessage: 'You must be a member of this project'
    }
  ],
  
  notification: {
    recipients: {
      type: 'projectMembers',
      config: {
        projectIdParam: 'projectId',
        excludeSender: true
      }
    },
    templates: {
      title: {
        he: 'כותרת בעברית',
        en: 'Title in English',
        ar: 'عنوان بالعربية'
      },
      body: {
        he: 'תוכן בעברית',
        en: 'Content in English',
        ar: 'محتوى بالعربية'
      }
    },
    channels: ['socket', 'push', 'email', 'telegram'],
    metadata: {
      priority: 'normal',
      url: '/path/to/resource/{{id}}'
    }
  },
  
  updateStrategy: {
    type: 'partialUpdate',
    config: {
      dataKeys: ['arr1'],
      updateFunction: 'refreshData'
    }
  }
};
```

### 2. Register the Action

Add your action to `src/lib/server/actions/configs/index.ts`:

```typescript
import { yourActionConfig } from './yourAction.js';

export function registerAllActions(): void {
  registerAction(updateTaskAction);
  registerAction(yourActionConfig); // Add your action here
  // ... other actions
}
```

### 3. Create Tests

Create unit tests in `yourAction.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { clearRegistry, registerAction } from '../registry.js';
import { yourActionConfig } from './yourAction.js';

describe('yourAction Configuration', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('should have all required fields', () => {
    expect(yourActionConfig.key).toBe('yourAction');
    expect(yourActionConfig.graphqlOperation).toBeTruthy();
    // ... more assertions
  });

  it('should register successfully', () => {
    expect(() => registerAction(yourActionConfig)).not.toThrow();
  });
});
```

Create integration tests in `yourAction.integration.test.ts` to test the complete flow.

### 4. Use the Action

Once registered, the action is automatically available via the `/api/action` endpoint:

```typescript
// Client-side (once client helper is implemented)
const result = await executeAction('yourAction', {
  id: '123',
  projectId: '456',
  name: 'Test'
});

if (result.success) {
  // Action succeeded
  // Notifications sent
  // UI updated based on updateStrategy
}
```

## Parameter Types

Supported parameter types:
- `string`: Text values
- `number`: Numeric values
- `boolean`: True/false values
- `array`: Arrays of values
- `object`: Complex objects

## Authorization Rules

Available authorization rule types:
- `jwt`: Validates JWT token (always required)
- `projectMember`: Checks project membership
- `role`: Checks user role (future)
- `custom`: Custom authorization function (future)

## Notification Recipients

Available recipient types:
- `projectMembers`: All members of a project
- `specificUsers`: Specific list of user IDs
- `skillBased`: Users with specific skills (future)
- `custom`: Custom recipient selection (future)

## Notification Channels

Available channels:
- `socket`: Real-time Socket.IO updates
- `push`: Push notifications to mobile devices
- `email`: Email notifications
- `telegram`: Telegram bot messages

## Update Strategies

Available strategies:
- `fullRefresh`: Reload entire page/data
- `partialUpdate`: Update specific data keys
- `optimistic`: Apply changes immediately, rollback on error
- `none`: No automatic updates

## Testing

Run all action configuration tests:

```bash
npm test -- src/lib/server/actions/configs/
```

Run specific action tests:

```bash
npm test -- src/lib/server/actions/configs/yourAction.test.ts
```

## Best Practices

1. **Always validate parameters**: Use the `validate` function for complex validation
2. **Provide clear error messages**: Help users understand authorization failures
3. **Use multilingual templates**: Support Hebrew, English, and Arabic
4. **Test thoroughly**: Write both unit and integration tests
5. **Document your action**: Add clear descriptions and comments
6. **Follow the pattern**: Use existing actions as examples

## Examples

See these files for complete examples:
- `updateTask.ts` - Basic task update action
- `example.ts` - Multiple example configurations

## Troubleshooting

### Action not found
- Make sure you registered it in `index.ts`
- Check that the action key matches exactly

### Validation errors
- Check parameter types match the schema
- Verify required parameters are provided

### Authorization errors
- Ensure JWT token is valid
- Check project membership for project-scoped actions

### Notification errors
- Check that notification templates have all required languages
- Verify channels are spelled correctly
- Ensure recipient configuration is valid

## Related Documentation

- [Action Service](../ActionService.ts) - Core action execution logic
- [Validation Engine](../ValidationEngine.ts) - Parameter validation
- [Authorization Engine](../AuthorizationEngine.ts) - Authorization checks
- [Notification Orchestrator](../../notifications/NotificationOrchestrator.ts) - Notification handling
