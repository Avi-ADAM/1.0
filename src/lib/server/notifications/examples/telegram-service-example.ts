/**
 * TelegramService Usage Examples
 * 
 * This file demonstrates how to use the TelegramService for sending
 * Telegram notifications in the unified action system.
 */

import { TelegramService } from '../TelegramService';
import type { UserProfile, NotificationData } from '../NotificationOrchestrator';
import type { ActionContext } from '../../actions/types';

// Example 1: Basic Telegram notification
async function example1_basicNotification() {
  const telegramService = new TelegramService();

  const recipients: UserProfile[] = [
    {
      id: '123',
      username: 'john_doe',
      email: 'john@example.com',
      lang: 'he',
      telegramId: '123456789',
      machshirs: []
    },
    {
      id: '456',
      username: 'jane_smith',
      email: 'jane@example.com',
      lang: 'en',
      telegramId: '987654321',
      machshirs: []
    }
  ];

  const notification: NotificationData = {
    title: {
      he: 'משימה חדשה',
      en: 'New Task'
    },
    body: {
      he: 'נוספה משימה חדשה לפרויקט שלך',
      en: 'A new task was added to your project'
    },
    metadata: {
      url: 'lev/project/123/task/456',
      priority: 'normal'
    }
  };

  const context: ActionContext = {
    userId: '789',
    jwt: 'user-jwt-token',
    lang: 'he',
    fetch: globalThis.fetch
  };

  await telegramService.sendBulk(recipients, notification, context);
}

// Example 2: Notification with mixed languages
async function example2_mixedLanguages() {
  const telegramService = new TelegramService();

  const recipients: UserProfile[] = [
    {
      id: '1',
      username: 'hebrew_user',
      email: 'hebrew@example.com',
      lang: 'he',
      telegramId: '111111111',
      machshirs: []
    },
    {
      id: '2',
      username: 'english_user',
      email: 'english@example.com',
      lang: 'en',
      telegramId: '222222222',
      machshirs: []
    },
    {
      id: '3',
      username: 'arabic_user',
      email: 'arabic@example.com',
      lang: 'ar',
      telegramId: '333333333',
      machshirs: []
    },
    {
      id: '4',
      username: 'french_user',
      email: 'french@example.com',
      lang: 'fr', // Not supported, will fall back to context language
      telegramId: '444444444',
      machshirs: []
    }
  ];

  const notification: NotificationData = {
    title: {
      he: 'הודעה חשובה',
      en: 'Important Message',
      ar: 'رسالة مهمة'
    },
    body: {
      he: 'יש לך עדכון חדש',
      en: 'You have a new update',
      ar: 'لديك تحديث جديد'
    }
  };

  const context: ActionContext = {
    userId: '999',
    jwt: 'admin-jwt-token',
    lang: 'he',
    fetch: globalThis.fetch
  };

  // Hebrew user gets Hebrew, English user gets English, Arabic user gets Arabic
  // French user falls back to Hebrew (context language)
  await telegramService.sendBulk(recipients, notification, context);
}

// Example 3: Filtering users without Telegram
async function example3_filteringUsers() {
  const telegramService = new TelegramService();

  const recipients: UserProfile[] = [
    {
      id: '1',
      username: 'has_telegram',
      email: 'has@example.com',
      lang: 'he',
      telegramId: '123456789', // Has Telegram
      machshirs: []
    },
    {
      id: '2',
      username: 'no_telegram',
      email: 'no@example.com',
      lang: 'he',
      telegramId: undefined, // No Telegram
      machshirs: []
    },
    {
      id: '3',
      username: 'empty_telegram',
      email: 'empty@example.com',
      lang: 'he',
      telegramId: '', // Empty Telegram ID
      machshirs: []
    }
  ];

  const notification: NotificationData = {
    title: { he: 'בדיקה', en: 'Test' },
    body: { he: 'הודעת בדיקה', en: 'Test message' }
  };

  const context: ActionContext = {
    userId: '999',
    jwt: 'jwt-token',
    lang: 'he',
    fetch: globalThis.fetch
  };

  // Only user 1 will receive the Telegram message
  // Users 2 and 3 are automatically filtered out
  await telegramService.sendBulk(recipients, notification, context);
}

// Example 4: Notification with custom URL
async function example4_customUrl() {
  const telegramService = new TelegramService();

  const recipients: UserProfile[] = [
    {
      id: '123',
      username: 'user',
      email: 'user@example.com',
      lang: 'he',
      telegramId: '123456789',
      machshirs: []
    }
  ];

  const notification: NotificationData = {
    title: {
      he: 'הזמנה לפגישה',
      en: 'Meeting Invitation'
    },
    body: {
      he: 'הוזמנת לפגישה חדשה',
      en: 'You have been invited to a new meeting'
    },
    metadata: {
      url: 'lev/meeting/789', // Custom URL for deep linking
      priority: 'high'
    }
  };

  const context: ActionContext = {
    userId: '456',
    jwt: 'jwt-token',
    lang: 'he',
    fetch: globalThis.fetch
  };

  await telegramService.sendBulk(recipients, notification, context);
}

// Example 5: Error handling
async function example5_errorHandling() {
  const telegramService = new TelegramService();

  const recipients: UserProfile[] = [
    {
      id: '1',
      username: 'valid_user',
      email: 'valid@example.com',
      lang: 'he',
      telegramId: '123456789',
      machshirs: []
    },
    {
      id: '2',
      username: 'invalid_user',
      email: 'invalid@example.com',
      lang: 'he',
      telegramId: 'invalid-telegram-id', // This might fail
      machshirs: []
    }
  ];

  const notification: NotificationData = {
    title: { he: 'הודעה', en: 'Message' },
    body: { he: 'תוכן', en: 'Content' }
  };

  const context: ActionContext = {
    userId: '999',
    jwt: 'jwt-token',
    lang: 'he',
    fetch: globalThis.fetch
  };

  // Even if one message fails, others will still be sent
  // Errors are logged but don't throw
  await telegramService.sendBulk(recipients, notification, context);
  
  // Check console for:
  // "TelegramService: Successfully sent X/Y Telegram messages"
  // "TelegramService: N Telegram messages failed to send"
}

// Example 6: Integration with NotificationOrchestrator
async function example6_withOrchestrator() {
  // This is how TelegramService is typically used in the action system
  // The NotificationOrchestrator handles calling it
  
  import { NotificationOrchestrator } from '../NotificationOrchestrator';
  import { StrapiClient } from '../../actions/StrapiClient';
  
  const strapiClient = new StrapiClient(
    'https://api.1lev1.com/graphql',
    'admin-token'
  );
  
  const orchestrator = new NotificationOrchestrator(strapiClient);
  
  const notificationConfig = {
    recipients: {
      type: 'projectMembers' as const,
      config: {
        projectIdParam: 'projectId',
        excludeSender: true
      }
    },
    templates: {
      title: {
        he: 'עדכון בפרויקט',
        en: 'Project Update'
      },
      body: {
        he: 'יש עדכון חדש בפרויקט',
        en: 'There is a new update in the project'
      }
    },
    channels: ['telegram', 'email', 'push'] as const,
    metadata: {
      url: 'lev/project/123',
      priority: 'normal' as const
    }
  };
  
  const actionParams = {
    projectId: '123',
    taskId: '456'
  };
  
  const actionResult = {
    success: true,
    data: { /* ... */ }
  };
  
  const context: ActionContext = {
    userId: '789',
    jwt: 'user-jwt-token',
    lang: 'he',
    fetch: globalThis.fetch
  };
  
  // This will send Telegram (along with email and push) to all project members
  await orchestrator.notify(
    notificationConfig,
    actionParams,
    actionResult,
    context
  );
}

// Export examples for documentation
export const examples = {
  example1_basicNotification,
  example2_mixedLanguages,
  example3_filteringUsers,
  example4_customUrl,
  example5_errorHandling,
  example6_withOrchestrator
};
