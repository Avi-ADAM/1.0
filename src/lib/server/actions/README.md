# Unified Action System

> Who is calling comes from `locals.uid` — the identity `hooks.server.js`
> derives from the **signed** JWT (`src/lib/server/identity.js`). The `id`
> cookie is written `httpOnly:false` for the UI, so any caller can set it to
> any value; reading it on the server is a vulnerability, not a shortcut.
> See docs/PLAN_PROXY_SECURITY.md §14.1.

A comprehensive, type-safe system for managing all server-side operations with validation, authorization, and multi-channel notifications.

## Overview

The Unified Action System replaces ad-hoc Strapi calls with a centralized, structured approach that provides:

- ✅ **Centralized Configuration**: Define actions once with all metadata
- ✅ **Automatic Validation**: Type checking and custom validation rules
- ✅ **Authorization**: JWT, project membership, role-based, and custom checks
- ✅ **Error Handling**: Consistent error responses with detailed logging
- ✅ **Notifications**: Multi-channel (socket, email, Telegram, push)
- ✅ **Update Strategies**: Client-side update coordination
- ✅ **Audit Logging**: Complete audit trail of all actions

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│                    (SvelteKit Frontend)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Action API Endpoint                      │
│                  POST /api/action                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Action Service                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Validation   │→ │Authorization │→ │   Strapi     │     │
│  │   Engine     │  │   Engine     │  │   Client     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                              │              │
│                                              ▼              │
│                                    ┌──────────────┐        │
│                                    │Notification  │        │
│                                    │Orchestrator  │        │
│                                    └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
            ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
            │  Socket.IO   │        │    Email     │        │  Telegram    │
            │   Server     │        │   Service    │        │   Service    │
            └──────────────┘        └──────────────┘        └──────────────┘
```

## Quick Start

### 1. Define an Action

```typescript
import { registerAction } from '$lib/server/actions/registry.js';
import type { ActionConfig } from '$lib/server/actions/types.js';

const updateTaskAction: ActionConfig = {
  key: 'updateTask',
  description: 'Update a task in a project',
  graphqlOperation: '31updateTask', // QIDS query ID
  
  // Parameter validation
  paramSchema: {
    taskId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    status: { type: 'string', required: false },
    description: { type: 'string', required: false }
  },
  
  // Authorization rules
  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'You must be a project member to update tasks'
    }
  ],
  
  // Notification configuration
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
        he: 'משימה עודכנה',
        en: 'Task Updated'
      },
      body: {
        he: 'משימה {{taskId}} עודכנה',
        en: 'Task {{taskId}} was updated'
      }
    },
    channels: ['socket', 'email', 'push']
  },
  
  // Update strategy for client
  updateStrategy: {
    type: 'partialUpdate',
    config: { dataKeys: ['arr1'] }
  }
};

registerAction(updateTaskAction);
```

### 2. Execute an Action

```typescript
import { actionService } from '$lib/server/actions/index.js';

const result = await actionService.executeAction(
  'updateTask',
  {
    taskId: 'task123',
    projectId: 'proj456',
    status: 'completed'
  },
  {
    userId: 'user789',
    jwt: 'user-jwt-token',
    lang: 'he',
    fetch: globalThis.fetch
  }
);

if (result.success) {
  console.log('Task updated:', result.data);
  console.log('Update strategy:', result.updateStrategy);
} else {
  console.error('Error:', result.error);
}
```

### 3. Use in API Endpoint

```typescript
// src/routes/api/action/+server.ts
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { actionService } from '$lib/server/actions/index.js';

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
  const { actionKey, params } = await request.json();
  
  const result = await actionService.executeAction(
    actionKey,
    params,
    {
      userId: locals.uid as string,
      jwt: cookies.get('jwt')!,
      lang: cookies.get('lang') || 'he',
      fetch
    }
  );
  
  return json(result);
};
```

## Components

### ActionService

Main orchestrator that handles the complete action flow.

**Responsibilities:**
- Retrieve action configuration
- Validate parameters
- Check authorization
- Execute GraphQL operations
- Trigger notifications (async)
- Log all operations
- Return structured results

**Key Methods:**
- `executeAction(actionKey, params, context)` - Execute an action

### ValidationEngine

Validates action parameters against schemas.

**Features:**
- Type validation (string, number, boolean, array, object)
- Required parameter checks
- Custom validation functions
- Descriptive error messages

### AuthorizationEngine

Checks if users are authorized to perform actions.

**Supported Rules:**
- `jwt` - JWT token validation
- `projectMember` - Project membership check
- `role` - Role-based authorization (placeholder)
- `custom` - Custom authorization functions

### StrapiClient

Wrapper for GraphQL operations to Strapi.

**Features:**
- Uses existing QIDS queries
- Retry logic with exponential backoff
- Connection pooling
- Error handling

### Action Registry

Central registry for all action configurations.

**Functions:**
- `registerAction(config)` - Register an action
- `getAction(key)` - Get action configuration
- `hasAction(key)` - Check if action exists
- `clearRegistry()` - Clear all actions (testing)

## Configuration

### Action Configuration

```typescript
interface ActionConfig {
  key: string;                      // Unique identifier
  description: string;              // Human-readable description
  graphqlOperation: string;         // QIDS query ID
  paramSchema: ParamSchema;         // Parameter validation
  authRules: AuthRule[];            // Authorization rules
  notification?: NotificationConfig; // Notification settings
  updateStrategy?: UpdateStrategy;   // Client update strategy
}
```

### Parameter Schema

```typescript
interface ParamRule {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  validate?: (value: any) => boolean;
  description?: string;
}
```

### Authorization Rules

```typescript
interface AuthRule {
  type: 'jwt' | 'projectMember' | 'role' | 'custom';
  config?: {
    projectIdParam?: string;
    requiredRole?: string;
    checkFunction?: (userId, params, context) => Promise<AuthorizationResult>;
  };
  errorMessage?: string;
}
```

### Notification Configuration

```typescript
interface NotificationConfig {
  recipients: RecipientRule;
  templates: {
    title: { he: string; en: string; ar?: string };
    body: { he: string; en: string; ar?: string };
  };
  channels: ('socket' | 'email' | 'telegram' | 'push')[];
  emailTemplate?: string;
  metadata?: {
    icon?: string;
    url?: string;
    priority?: 'low' | 'normal' | 'high';
  };
}
```

## Error Handling

### Error Codes

- `UNKNOWN_ACTION` - Action not found in registry
- `VALIDATION_FAILED` - Parameter validation failed
- `UNAUTHORIZED` - Authorization check failed
- `STRAPI_ERROR` - Database operation failed
- `INTERNAL_ERROR` - Unexpected error

### Error Response Format

```typescript
{
  success: false,
  error: {
    code: 'VALIDATION_FAILED',
    message: 'Parameter validation failed',
    details: ['Missing required parameter: taskId']
  }
}
```

## Logging

All actions are logged with:
- Timestamp
- User ID
- Action key
- Parameters (sanitized)
- Result status
- Execution time
- Error details (if failed)

### Log Levels

- `info` - Action start/complete
- `warn` - Warnings
- `error` - Errors with stack traces
- `debug` - Detailed debugging (development only)

## Testing

### Running Tests

```bash
# Run all action system tests
npm run test src/lib/server/actions/

# Run specific test file
npm run test src/lib/server/actions/ActionService.test.ts

# Run with coverage
npm run test -- --coverage
```

### Test Coverage

- ✅ 109 tests across 8 test files
- ✅ Unit tests for all components
- ✅ Integration tests for complete flows
- ✅ Property-based tests for registry

## Implementation Status

### Completed (Tasks 1-6)

- ✅ Core infrastructure and type definitions
- ✅ Action Registry with validation
- ✅ ValidationEngine with custom validation
- ✅ AuthorizationEngine with multiple rule types
- ✅ StrapiClient with retry logic
- ✅ ActionService with complete flow

### In Progress

- ⏳ Notification Orchestrator (Task 9)
- ⏳ Action API endpoint (Task 7)
- ⏳ Socket.IO server (Task 15-17)

### Planned

- 📋 Email/Telegram/Push services (Tasks 10-12)
- 📋 Client-side integration (Tasks 18-19, 22)
- 📋 Migration from QIDS (Tasks 21, 23-27)

## Examples

See `examples/` directory for:
- `action-service-example.ts` - Complete usage examples
- `authorization-example.ts` - Authorization patterns
- `strapi-client-example.ts` - Strapi client usage

## Requirements Validated

This implementation validates:

- **Requirement 1.1**: Action service accepts requests and returns results
- **Requirement 1.2**: Parameter validation
- **Requirement 1.3**: Descriptive error messages
- **Requirement 1.4**: Comprehensive error handling
- **Requirement 2.1**: JWT validation
- **Requirement 2.2**: Authorization rule checking
- **Requirement 2.3**: 403 errors for unauthorized access
- **Requirement 3.1**: GraphQL execution
- **Requirement 3.2**: Result data return
- **Requirement 3.3**: Error handling and rollback
- **Requirement 8.1**: Single configuration file
- **Requirement 8.2**: Complete configuration
- **Requirement 9.1**: Action logging
- **Requirement 9.2**: Error logging

## Performance

- **Target Response Time**: < 500ms for 95% of requests
- **Async Notifications**: Don't block action response
- **Connection Pooling**: Reuse HTTP connections
- **Caching**: Project membership and user profiles (future)

## Security

- ✅ JWT validation on every request
- ✅ Authorization checks before execution
- ✅ Parameter validation prevents injection
- ✅ Error messages don't expose internals
- ✅ Complete audit trail

## Next Steps

1. Implement Notification Orchestrator (Task 9)
2. Create Action API endpoint (Task 7)
3. Set up Socket.IO server (Tasks 15-17)
4. Migrate first action from QIDS (Task 21)
5. Add caching layer (Task 31)

## Contributing

When adding new actions:

1. Define action configuration
2. Register action at startup
3. Write unit tests
4. Write integration tests
5. Update documentation

## License

Internal use only - Part of the 1Lev1 platform.
