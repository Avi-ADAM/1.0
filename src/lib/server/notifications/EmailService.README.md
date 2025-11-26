# EmailService

The `EmailService` class handles email notification sending for the unified action system. It provides a clean, reusable interface for sending bulk emails with Svelte templates.

## Features

- ✅ Bulk email sending to multiple recipients
- ✅ Integration with existing `sendBolkMail` infrastructure
- ✅ Svelte email template rendering support
- ✅ Language selection logic (Hebrew, English, Arabic)
- ✅ Automatic filtering of users with `noMail` flag
- ✅ Error handling and logging
- ✅ Plain text email generation

## Usage

### Basic Usage

```typescript
import { EmailService } from '$lib/server/notifications/EmailService';

const emailService = new EmailService();

await emailService.sendBulk(
  recipients,      // Array of UserProfile objects
  notification,    // NotificationData with title, body, metadata
  'SimpleNuti',    // Template name (optional, defaults to 'SimpleNuti')
  context          // ActionContext with fetch and language
);
```

### With NotificationOrchestrator

The `EmailService` is automatically integrated into the `NotificationOrchestrator`:

```typescript
const orchestrator = new NotificationOrchestrator(strapiClient);

await orchestrator.notify(
  {
    recipients: { type: 'projectMembers' },
    templates: {
      title: { he: 'כותרת', en: 'Title' },
      body: { he: 'תוכן', en: 'Content' }
    },
    channels: ['email', 'telegram', 'push'],
    emailTemplate: 'SimpleNuti'
  },
  actionParams,
  actionResult,
  context
);
```

## API Reference

### `sendBulk(recipients, notification, templateName, context)`

Sends bulk email notifications to multiple recipients.

**Parameters:**
- `recipients: UserProfile[]` - List of users to send emails to
- `notification: NotificationData` - Notification data with title, body, and metadata
- `templateName: string` - Name of the Svelte email template (default: 'SimpleNuti')
- `context: ActionContext` - Action context with fetch and language info

**Returns:** `Promise<void>`

**Behavior:**
1. Filters out users with `noMail: true`
2. Loads the specified email template
3. Renders email for each recipient in their preferred language
4. Sends emails via `/api/sendMail` endpoint
5. Logs successes and failures

## Language Selection

The service automatically selects the appropriate language for each user:

1. Uses user's `lang` if it's supported (he, en, ar)
2. Falls back to context language if user's language is not supported
3. Defaults to Hebrew if neither is supported

## Email Templates

Currently supported templates:
- `SimpleNuti` - Simple notification template with title, body, and username

To add new templates:
1. Create a Svelte component in `src/lib/components/mail/`
2. Update the `loadTemplate()` method in `EmailService.ts`

## Error Handling

- Individual email failures don't stop the batch
- All errors are logged with details
- Uses `Promise.allSettled` to ensure all emails are attempted
- Returns summary of successes and failures

## Integration with Existing Infrastructure

The `EmailService` integrates seamlessly with the existing email infrastructure:

- Uses `/api/sendMail` endpoint (nodemailer with Zoho SMTP)
- Compatible with `svelty-email` for template rendering
- Follows the same data structure as `sendBolkMail`

## Requirements Validation

This implementation satisfies the following requirements:

- ✅ **Requirement 6.1**: Sends notifications via email channel
- ✅ **Requirement 6.2**: Uses each user's preferred language
- ✅ **Requirement 6.3**: Filters users with `noMail` flag
- ✅ **Requirement 6.7**: Uses Svelte email templates
- ✅ **Requirement 6.9**: Reuses existing notification infrastructure

## Testing

See `EmailService.test.ts` for unit tests covering:
- Email filtering (noMail flag)
- Language selection logic
- Template rendering
- Error handling
- Bulk sending

## Example

```typescript
const recipients = [
  {
    id: '1',
    username: 'user1',
    email: 'user1@example.com',
    lang: 'he',
    noMail: false,
    machshirs: []
  },
  {
    id: '2',
    username: 'user2',
    email: 'user2@example.com',
    lang: 'en',
    noMail: true,  // This user will be filtered out
    machshirs: []
  }
];

const notification = {
  title: { he: 'משימה חדשה', en: 'New Task' },
  body: { he: 'נוספה משימה חדשה לפרויקט', en: 'A new task was added to the project' },
  metadata: {
    url: 'https://www.1lev1.com/lev',
    icon: 'https://example.com/icon.png'
  }
};

await emailService.sendBulk(recipients, notification, 'SimpleNuti', context);
// Result: Only user1 receives an email (user2 has noMail: true)
```
