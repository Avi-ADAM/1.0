# Notification Orchestrator

The NotificationOrchestrator is responsible for coordinating multi-channel notifications in the unified action system.

## Features

- **Multi-channel support**: Socket.IO, Email, Telegram, Push notifications
- **Recipient identification**: Project members, specific users, skill-based, custom queries
- **Intelligent filtering**: Respects user preferences (noMail flag, telegramId presence)
- **Language support**: Sends notifications in each user's preferred language (he, en, ar)
- **Caching**: Caches project membership queries for 5 minutes to improve performance
- **Parallel execution**: Sends all channels simultaneously using Promise.allSettled
- **Error resilience**: Notification failures don't block the main action
- **Real-time updates**: Socket.IO integration for instant notifications

## Completed Services

- ✅ **SocketIOServer** - Real-time notifications via Socket.IO
- ✅ **EmailService** - Email notifications with Svelte templates
- ✅ **TelegramService** - Telegram notifications with language support
- ✅ **PushService** - Push notifications to user devices

## Architecture

```
NotificationOrchestrator
├── getRecipients()          # Identify who should receive notifications
│   ├── projectMembers       # All members of a project
│   ├── specificUsers        # Filtered list of users
│   ├── skillBased          # Users with specific skills (TODO)
│   └── custom              # Custom query (TODO)
├── SocketIOServer           # Send real-time updates via Socket.IO
├── EmailService             # Send via email (respects noMail flag)
├── TelegramService          # Send via Telegram (requires telegramId)
├── PushService              # Send via push (to all user devices)
└── clearCache()            # Clear membership cache
```

## Usage

### Basic Usage

```typescript
import { NotificationOrchestrator } from '$lib/server/notifications/NotificationOrchestrator';
import { StrapiClient } from '$lib/server/actions/StrapiClient';

// Create instance
const strapiClient = new StrapiClient(
  process.env.VITE_URL || '',
  process.env.VITE_ADMINMONTHER || ''
);
const orchestrator = new NotificationOrchestrator(strapiClient);

// Send notifications
await orchestrator.notify(
  {
    recipients: {
      type: 'projectMembers',
      config: { projectIdParam: 'projectId', excludeSender: true }
    },
    templates: {
      title: { he: 'עדכון', en: 'Update' },
      body: { he: 'יש עדכון חדש', en: 'New update' }
    },
    channels: ['socket', 'email', 'telegram', 'push']
  },
  { projectId: '123' },
  { success: true },
  context
);
```

### Recipient Types

#### 1. Project Members
Send to all members of a project:

```typescript
recipients: {
  type: 'projectMembers',
  config: {
    projectIdParam: 'projectId',  // Which param contains project ID
    excludeSender: true           // Don't notify the action initiator
  }
}
```

#### 2. Specific Users
Send to a filtered list of users within a project:

```typescript
recipients: {
  type: 'specificUsers',
  config: {
    projectIdParam: 'projectId',
    userIdsParam: 'userIds',      // Which param contains user IDs array
    excludeSender: false
  }
}
```

#### 3. Skill-Based (TODO)
Send to users with specific skills:

```typescript
recipients: {
  type: 'skillBased',
  config: {
    skills: ['javascript', 'react']
  }
}
```

#### 4. Custom Query (TODO)
Use a custom GraphQL query to identify recipients:

```typescript
recipients: {
  type: 'custom',
  config: {
    customQuery: 'myCustomQuery'
  }
}
```

### Notification Channels

#### Socket.IO (Real-time)
- Sends instant updates to connected clients
- Fastest notification channel (< 50ms)
- Supports multiple connections per user
- Requires Socket.IO server to be running
- Implemented via `SocketIOServer` class

```typescript
channels: ['socket'],
metadata: {
  url: '/lev/project/123',  // URL for navigation
  priority: 'high'          // Priority level
}
```

See `SocketIOServer.README.md` for detailed documentation.

#### Email
- Respects `noMail` flag on user profiles
- Uses Svelte email templates (default: SimpleNuti)
- Sends in user's preferred language

```typescript
channels: ['email'],
emailTemplate: 'SimpleNuti'  // Optional, defaults to SimpleNuti
```

#### Telegram
- Only sends to users with `telegramId` configured
- Sends in user's preferred language (he/en/ar)
- Includes optional URL for deep linking
- Implemented via `TelegramService` class

```typescript
channels: ['telegram'],
metadata: {
  url: 'lev/project/123'  // URL suffix for deep linking
}
```

See `TelegramService.README.md` for detailed documentation.

#### Push Notifications
- Sends to all registered devices (machshirs) for each user
- Includes icon, title, body, and URL
- Sends in user's preferred language

```typescript
channels: ['push'],
metadata: {
  url: 'https://www.1lev1.com/lev',
  icon: 'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png'
}
```

### Language Support

The orchestrator automatically selects the appropriate language for each user:

1. If user's language is 'he', 'en', or 'ar', use that language
2. Otherwise, fall back to the action initiator's language (context.lang)
3. For Telegram, only 'he' and 'en' are supported

```typescript
templates: {
  title: {
    he: 'כותרת בעברית',
    en: 'Title in English',
    ar: 'عنوان بالعربية'  // Optional
  },
  body: {
    he: 'תוכן בעברית',
    en: 'Content in English',
    ar: 'محتوى بالعربية'  // Optional
  }
}
```

### Caching

Project membership queries are cached for 5 minutes to improve performance:

```typescript
// Cache is automatic, but you can clear it manually
orchestrator.clearCache();           // Clear all cache
orchestrator.clearCache('projectId'); // Clear specific project
```

### Error Handling

Notification failures are logged but don't block the main action:

```typescript
// If email fails, Telegram and push will still be sent
// All errors are logged to console
await orchestrator.notify(config, params, result, context);
// Returns immediately, even if some channels fail
```

## Integration with ActionService

The NotificationOrchestrator is automatically integrated with ActionService:

```typescript
import { ActionService } from '$lib/server/actions/ActionService';
import { NotificationOrchestrator } from '$lib/server/notifications/NotificationOrchestrator';

const actionService = new ActionService(
  validator,
  authorizer,
  strapiClient,
  new NotificationOrchestrator(strapiClient)  // Pass orchestrator
);

// Notifications are sent automatically when actions complete
await actionService.executeAction('updateTask', params, context);
```

## Performance Considerations

1. **Parallel Execution**: All channels are sent simultaneously using `Promise.allSettled`
2. **Caching**: Project membership queries are cached for 5 minutes
3. **Async Processing**: Notifications don't block the action response
4. **Error Resilience**: Individual channel failures don't affect other channels

## Testing

See `examples/notification-orchestrator-example.ts` for usage examples.

## Future Enhancements

1. **Skill-based recipient selection**: Filter users by skills
2. **Custom queries**: Support custom GraphQL queries for recipient selection
3. **Notification preferences**: Allow users to configure which channels they want
4. **Digest notifications**: Batch multiple notifications into a single message
5. **Notification scheduling**: Schedule notifications for later delivery
