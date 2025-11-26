# TelegramService

The `TelegramService` handles Telegram notification sending for the unified action system. It integrates with the existing Telegram notification infrastructure (`sendBolkTelegram`) while providing a clean, typed interface.

## Features

- **Bulk Telegram Sending**: Send Telegram messages to multiple users in parallel
- **Language Selection**: Automatically selects the appropriate language for each user
- **User Filtering**: Filters out users without Telegram IDs
- **Error Resilience**: Continues sending even if some messages fail
- **Integration**: Uses existing Telegram API endpoint (`https://www.1lev1.com/api/ste`)

## Usage

```typescript
import { TelegramService } from '$lib/server/notifications/TelegramService';
import type { UserProfile, NotificationData } from '$lib/server/notifications/NotificationOrchestrator';

const telegramService = new TelegramService();

const recipients: UserProfile[] = [
  {
    id: '1',
    username: 'user1',
    email: 'user1@example.com',
    lang: 'he',
    telegramId: '123456789',
    machshirs: []
  },
  {
    id: '2',
    username: 'user2',
    email: 'user2@example.com',
    lang: 'en',
    telegramId: '987654321',
    machshirs: []
  }
];

const notification: NotificationData = {
  title: {
    he: 'משימה חדשה',
    en: 'New Task',
    ar: 'مهمة جديدة'
  },
  body: {
    he: 'נוספה משימה חדשה לפרויקט',
    en: 'A new task was added to the project',
    ar: 'تمت إضافة مهمة جديدة إلى المشروع'
  },
  metadata: {
    url: 'lev/project/123',
    icon: 'task-icon.png',
    priority: 'normal'
  }
};

const context = {
  userId: '1',
  jwt: 'user-jwt-token',
  lang: 'he',
  fetch: globalThis.fetch
};

await telegramService.sendBulk(recipients, notification, context);
```

## API

### `sendBulk(recipients, notification, context)`

Sends Telegram messages to multiple recipients.

**Parameters:**
- `recipients: UserProfile[]` - List of users to send messages to
- `notification: NotificationData` - Notification content with title, body, and metadata
- `context: ActionContext` - Action context with fetch and language info

**Returns:** `Promise<void>`

**Behavior:**
1. Filters recipients to only include users with `telegramId`
2. Sends messages in parallel using `Promise.allSettled`
3. Logs success/failure for each message
4. Does not throw errors (uses Promise.allSettled for resilience)

## Language Selection

The service selects the appropriate language for each user:

1. **User's Language**: If the user's `lang` is 'he', 'en', or 'ar', use it
2. **Context Language**: If user's language is not supported, fall back to context language
3. **Default**: If neither is supported, default to 'he' (Hebrew)

## Filtering

Users are automatically filtered based on:
- **telegramId presence**: Only users with a non-empty `telegramId` receive messages
- **No other filtering**: Unlike email (which respects `noMail`), Telegram has no opt-out flag

## Integration with Existing Infrastructure

The service integrates with the existing Telegram API:

**Endpoint**: `https://www.1lev1.com/api/ste`

**Payload Format**:
```json
{
  "isNew": true,
  "lang": "he",
  "chat_id": "123456789",
  "det": "Title text",
  "message": "Body text",
  "urladd": "lev/project/123"
}
```

## Error Handling

- Individual message failures are logged but don't stop other messages
- Uses `Promise.allSettled` to ensure all messages are attempted
- Logs detailed error information for debugging
- Returns summary of successes/failures

## Comparison with sendBolkTelegram

The new `TelegramService` improves upon the original `sendBolkTelegram`:

| Feature | sendBolkTelegram | TelegramService |
|---------|------------------|-----------------|
| Type Safety | No types | Full TypeScript types |
| Error Handling | Basic try/catch | Promise.allSettled with detailed logging |
| Language Selection | Inline logic | Dedicated method |
| Filtering | Manual | Automatic |
| Sender Exclusion | Manual (myid param) | Handled by NotificationOrchestrator |
| Integration | Direct function call | Service class with DI |
| Testing | Difficult | Easy to mock/test |

## Testing

Example test:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { TelegramService } from './TelegramService';

describe('TelegramService', () => {
  it('should filter users without telegramId', async () => {
    const service = new TelegramService();
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    
    const recipients = [
      { id: '1', telegramId: '123', lang: 'he', /* ... */ },
      { id: '2', telegramId: undefined, lang: 'en', /* ... */ },
      { id: '3', telegramId: '456', lang: 'ar', /* ... */ }
    ];
    
    await service.sendBulk(recipients, notification, { fetch: mockFetch, /* ... */ });
    
    // Should only send to users 1 and 3
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
  
  it('should use correct language for each user', async () => {
    const service = new TelegramService();
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    
    const recipients = [
      { id: '1', telegramId: '123', lang: 'he', /* ... */ },
      { id: '2', telegramId: '456', lang: 'en', /* ... */ }
    ];
    
    await service.sendBulk(recipients, notification, { 
      fetch: mockFetch, 
      lang: 'he',
      /* ... */ 
    });
    
    const calls = mockFetch.mock.calls;
    const firstCall = JSON.parse(calls[0][1].body);
    const secondCall = JSON.parse(calls[1][1].body);
    
    expect(firstCall.lang).toBe('he');
    expect(secondCall.lang).toBe('en');
  });
});
```

## Requirements Validation

This implementation satisfies the following requirements:

- **6.1**: Sends notifications via Telegram channel in parallel with other channels
- **6.2**: Uses each user's preferred language from their profile
- **6.6**: Filters only users who have a telegramId configured
- **6.9**: Reuses existing notification infrastructure (Telegram API endpoint)

## Related Files

- `NotificationOrchestrator.ts` - Coordinates all notification channels
- `EmailService.ts` - Similar service for email notifications
- `src/lib/func/telegram/sendBolkTelegram.svelte` - Original Telegram function
- `src/routes/api/nutifyPm/+server.js` - Example usage of original function
