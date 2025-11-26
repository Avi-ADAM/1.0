# PushService

The `PushService` class handles push notification sending for the unified action system. It integrates with the existing web-push infrastructure and manages multiple devices per user.

## Features

- ✅ Sends push notifications to multiple users in parallel
- ✅ Handles multiple devices (machshirs) per user
- ✅ Language selection based on user preferences
- ✅ Filters users without registered devices
- ✅ Graceful error handling with detailed logging
- ✅ Integration with existing `/api/pusher` endpoint

## Usage

```typescript
import { PushService } from '$lib/server/notifications/PushService';
import type { UserProfile, NotificationData } from '$lib/server/notifications/NotificationOrchestrator';

const pushService = new PushService();

const recipients: UserProfile[] = [
  {
    id: '123',
    username: 'user1',
    email: 'user1@example.com',
    lang: 'he',
    machshirs: [
      {
        id: '1',
        attributes: {
          jsoni: '{"endpoint":"...","keys":{...}}'
        }
      }
    ]
  }
];

const notification: NotificationData = {
  title: { he: 'כותרת', en: 'Title', ar: 'عنوان' },
  body: { he: 'תוכן', en: 'Content', ar: 'محتوى' },
  metadata: {
    url: 'https://www.1lev1.com/lev',
    icon: 'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png',
    priority: 'normal'
  }
};

const context = {
  userId: '456',
  jwt: 'token',
  lang: 'he',
  fetch: globalThis.fetch
};

await pushService.sendBulk(recipients, notification, context);
```

## How It Works

### 1. Recipient Filtering

The service filters recipients to only include users who have registered devices:

```typescript
const pushRecipients = recipients.filter(user => 
  user.machshirs && user.machshirs.length > 0
);
```

### 2. Language Selection

For each user, the service selects the appropriate language:

1. Use user's language if it's supported (he, en, ar)
2. Fall back to context language if user's language is not supported
3. Default to Hebrew if neither is supported

### 3. Multiple Devices

Each user can have multiple devices (machshirs). The service sends notifications to all devices:

```typescript
const devicePromises = user.machshirs.map(machshir => 
  this.sendToDevice(machshir, title, body, notification, context)
);
```

### 4. Device Validation

Before sending to a device, the service checks if it has the required `jsoni` field:

```typescript
if (!machshir.attributes?.jsoni) {
  console.warn(`Device ${machshir.id} missing jsoni field, skipping`);
  return;
}
```

### 5. Push Notification Format

The service formats the push notification according to the existing API:

```typescript
const pushData = {
  jsoni: machshir.attributes.jsoni,
  machshirId: machshir.id,
  messege: {
    url: notification.metadata?.url || 'https://www.1lev1.com/lev',
    body: body,
    pic: notification.metadata?.icon || 'default-icon-url',
    title: title
  }
};
```

### 6. Error Handling

The service uses `Promise.allSettled` to ensure that failures in sending to some devices don't prevent sending to others:

```typescript
const results = await Promise.allSettled(pushPromises);

const failures = results.filter(r => r.status === 'rejected');
if (failures.length > 0) {
  console.error(`${failures.length} push notifications failed to send`);
}
```

## Integration with NotificationOrchestrator

The `PushService` is integrated into the `NotificationOrchestrator`:

```typescript
export class NotificationOrchestrator {
  private pushService: PushService;

  constructor(private strapiClient: StrapiClient) {
    this.pushService = new PushService();
  }

  async notify(config: NotificationConfig, ...): Promise<void> {
    if (config.channels.includes('push')) {
      promises.push(
        this.pushService.sendBulk(
          filteredRecipients,
          notificationData,
          context
        )
      );
    }
  }
}
```

## Device Data Structure

Each device (machshir) has the following structure:

```typescript
{
  id: string;
  attributes: {
    jsoni: string; // JSON string containing web-push subscription
    // Other attributes...
  }
}
```

The `jsoni` field contains the web-push subscription information:

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

## Logging

The service provides detailed logging at multiple levels:

- **Info**: Number of recipients, successful sends
- **Warning**: Devices missing required fields
- **Error**: Failed sends with error details

Example logs:

```
PushService: Sending push notifications to 5 recipients
PushService: Device 123 missing jsoni field, skipping
PushService: Push notification sent successfully to device 456
PushService: 2 push notifications failed to send
PushService: Successfully sent 3/5 push notifications
```

## Error Scenarios

### No Recipients

If no users have registered devices:

```
PushService: No push recipients after filtering
```

### Missing jsoni Field

If a device is missing the required `jsoni` field:

```
PushService: Device 123 missing jsoni field, skipping
```

### API Failure

If the pusher API returns an error:

```
PushService: Pusher API returned status 500
PushService: Failed to send push notification to device 123: Error: ...
```

### Partial Failures

If some devices fail but others succeed:

```
PushService: 2/5 devices failed for user 789
PushService: Successfully sent 3/5 push notifications
```

## Requirements Validation

This implementation satisfies the following requirements:

- ✅ **Requirement 6.1**: Sends notifications via push channel in parallel
- ✅ **Requirement 6.2**: Uses each user's preferred language
- ✅ **Requirement 6.5**: Handles multiple devices per user (machshirs)
- ✅ **Requirement 6.9**: Reuses existing pusherer infrastructure

## Testing

See `PushService.test.ts` for unit tests covering:

- Push notification payload generation
- Multiple device handling
- Language selection
- Device filtering (missing jsoni)
- Error handling

## Future Enhancements

1. **Retry Logic**: Add retry mechanism for failed push notifications
2. **Device Cleanup**: Automatically remove devices that consistently fail
3. **Priority Handling**: Support different priority levels for notifications
4. **Batching**: Batch multiple notifications to the same device
5. **Analytics**: Track delivery rates and device engagement
