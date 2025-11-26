/**
 * PushService Usage Examples
 * 
 * This file demonstrates how to use the PushService class
 * for sending push notifications in the unified action system.
 */

import { PushService } from '../PushService';
import type { UserProfile, NotificationData } from '../NotificationOrchestrator';
import type { ActionContext } from '../../actions/types';

// Example 1: Basic push notification to multiple users
async function example1_basicPushNotification() {
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
            jsoni: '{"endpoint":"https://fcm.googleapis.com/fcm/send/abc123","keys":{"p256dh":"...","auth":"..."}}'
          }
        }
      ]
    },
    {
      id: '456',
      username: 'user2',
      email: 'user2@example.com',
      lang: 'en',
      machshirs: [
        {
          id: '2',
          attributes: {
            jsoni: '{"endpoint":"https://fcm.googleapis.com/fcm/send/def456","keys":{"p256dh":"...","auth":"..."}}'
          }
        }
      ]
    }
  ];

  const notification: NotificationData = {
    title: { 
      he: 'משימה חדשה', 
      en: 'New Task', 
      ar: 'مهمة جديدة' 
    },
    body: { 
      he: 'נוספה משימה חדשה לפרויקט שלך', 
      en: 'A new task was added to your project', 
      ar: 'تمت إضافة مهمة جديدة إلى مشروعك' 
    },
    metadata: {
      url: 'https://www.1lev1.com/lev',
      icon: 'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png',
      priority: 'normal'
    }
  };

  const context: ActionContext = {
    userId: '789',
    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    lang: 'he',
    fetch: globalThis.fetch
  };

  await pushService.sendBulk(recipients, notification, context);
}

// Example 2: User with multiple devices
async function example2_multipleDevices() {
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
            jsoni: '{"endpoint":"https://fcm.googleapis.com/fcm/send/device1","keys":{...}}'
          }
        },
        {
          id: '2',
          attributes: {
            jsoni: '{"endpoint":"https://fcm.googleapis.com/fcm/send/device2","keys":{...}}'
          }
        },
        {
          id: '3',
          attributes: {
            jsoni: '{"endpoint":"https://fcm.googleapis.com/fcm/send/device3","keys":{...}}'
          }
        }
      ]
    }
  ];

  const notification: NotificationData = {
    title: { he: 'הודעה חשובה', en: 'Important Message' },
    body: { he: 'יש לך הודעה חדשה', en: 'You have a new message' }
  };

  const context: ActionContext = {
    userId: '456',
    jwt: 'token',
    lang: 'he',
    fetch: globalThis.fetch
  };

  // This will send the notification to all 3 devices
  await pushService.sendBulk(recipients, notification, context);
}

// Example 3: Mixed recipients (some with devices, some without)
async function example3_mixedRecipients() {
  const pushService = new PushService();

  const recipients: UserProfile[] = [
    {
      id: '123',
      username: 'user_with_device',
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
    },
    {
      id: '456',
      username: 'user_without_device',
      email: 'user2@example.com',
      lang: 'en',
      machshirs: [] // No devices
    },
    {
      id: '789',
      username: 'user_with_invalid_device',
      email: 'user3@example.com',
      lang: 'ar',
      machshirs: [
        {
          id: '2',
          attributes: {
            // Missing jsoni field
          }
        }
      ]
    }
  ];

  const notification: NotificationData = {
    title: { he: 'עדכון', en: 'Update', ar: 'تحديث' },
    body: { he: 'יש עדכון חדש', en: 'There is a new update', ar: 'هناك تحديث جديد' }
  };

  const context: ActionContext = {
    userId: '999',
    jwt: 'token',
    lang: 'he',
    fetch: globalThis.fetch
  };

  // Only user_with_device will receive the notification
  // user_without_device will be filtered out (no devices)
  // user_with_invalid_device's device will be skipped (missing jsoni)
  await pushService.sendBulk(recipients, notification, context);
}

// Example 4: Custom notification with URL and icon
async function example4_customNotification() {
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
    title: { he: 'הצעה חדשה', en: 'New Offer' },
    body: { he: 'קיבלת הצעה חדשה למשימה', en: 'You received a new offer for a task' },
    metadata: {
      url: 'https://www.1lev1.com/lev/offers/123', // Custom URL
      icon: 'https://example.com/custom-icon.png', // Custom icon
      priority: 'high'
    }
  };

  const context: ActionContext = {
    userId: '456',
    jwt: 'token',
    lang: 'he',
    fetch: globalThis.fetch
  };

  await pushService.sendBulk(recipients, notification, context);
}

// Example 5: Language fallback
async function example5_languageFallback() {
  const pushService = new PushService();

  const recipients: UserProfile[] = [
    {
      id: '123',
      username: 'user_with_unsupported_lang',
      email: 'user1@example.com',
      lang: 'fr', // French is not supported
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
    title: { he: 'הודעה', en: 'Message' },
    body: { he: 'תוכן ההודעה', en: 'Message content' }
  };

  const context: ActionContext = {
    userId: '456',
    jwt: 'token',
    lang: 'he', // Context language is Hebrew
    fetch: globalThis.fetch
  };

  // User's language (fr) is not supported, so it will fall back to context language (he)
  await pushService.sendBulk(recipients, notification, context);
}

// Example 6: Error handling
async function example6_errorHandling() {
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
            jsoni: '{"endpoint":"https://invalid-endpoint.com","keys":{...}}'
          }
        }
      ]
    }
  ];

  const notification: NotificationData = {
    title: { he: 'הודעה', en: 'Message' },
    body: { he: 'תוכן', en: 'Content' }
  };

  const context: ActionContext = {
    userId: '456',
    jwt: 'token',
    lang: 'he',
    fetch: globalThis.fetch
  };

  try {
    await pushService.sendBulk(recipients, notification, context);
    // Even if some notifications fail, the method won't throw
    // Errors are logged but the method completes
  } catch (error) {
    // This catch block will rarely be reached
    // Individual notification failures are handled internally
    console.error('Unexpected error:', error);
  }
}

// Example 7: Integration with NotificationOrchestrator
async function example7_withOrchestrator() {
  // This example shows how PushService is used within NotificationOrchestrator
  
  // In NotificationOrchestrator:
  // if (config.channels.includes('push')) {
  //   promises.push(
  //     this.pushService.sendBulk(
  //       filteredRecipients,
  //       notificationData,
  //       context
  //     )
  //   );
  // }
  
  // The orchestrator handles:
  // 1. Recipient identification
  // 2. Sender exclusion
  // 3. Parallel channel execution
  // 4. Error aggregation
}

export {
  example1_basicPushNotification,
  example2_multipleDevices,
  example3_mixedRecipients,
  example4_customNotification,
  example5_languageFallback,
  example6_errorHandling,
  example7_withOrchestrator
};
