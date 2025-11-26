/**
 * EmailService Usage Examples
 * 
 * This file demonstrates how to use the EmailService class
 * for sending email notifications in the unified action system.
 */

import { EmailService } from '../EmailService';
import type { UserProfile, NotificationData } from '../NotificationOrchestrator';
import type { ActionContext } from '../../actions/types';

// Example 1: Basic email sending
async function example1_basicEmailSending(context: ActionContext) {
  const emailService = new EmailService();

  const recipients: UserProfile[] = [
    {
      id: '1',
      username: 'דני',
      email: 'danny@example.com',
      lang: 'he',
      noMail: false,
      machshirs: []
    },
    {
      id: '2',
      username: 'Sarah',
      email: 'sarah@example.com',
      lang: 'en',
      noMail: false,
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

  await emailService.sendBulk(recipients, notification, 'SimpleNuti', context);
  console.log('Emails sent successfully!');
}

// Example 2: Filtering users with noMail flag
async function example2_noMailFiltering(context: ActionContext) {
  const emailService = new EmailService();

  const recipients: UserProfile[] = [
    {
      id: '1',
      username: 'User1',
      email: 'user1@example.com',
      lang: 'he',
      noMail: false,  // Will receive email
      machshirs: []
    },
    {
      id: '2',
      username: 'User2',
      email: 'user2@example.com',
      lang: 'en',
      noMail: true,   // Will NOT receive email (filtered out)
      machshirs: []
    },
    {
      id: '3',
      username: 'User3',
      email: 'user3@example.com',
      lang: 'he',
      noMail: false,  // Will receive email
      machshirs: []
    }
  ];

  const notification: NotificationData = {
    title: { he: 'עדכון', en: 'Update' },
    body: { he: 'יש עדכון חדש', en: 'There is a new update' }
  };

  // Only User1 and User3 will receive emails
  await emailService.sendBulk(recipients, notification, 'SimpleNuti', context);
}

// Example 3: Language fallback
async function example3_languageFallback(context: ActionContext) {
  const emailService = new EmailService();

  const recipients: UserProfile[] = [
    {
      id: '1',
      username: 'User1',
      email: 'user1@example.com',
      lang: 'he',  // Supported - will use Hebrew
      noMail: false,
      machshirs: []
    },
    {
      id: '2',
      username: 'User2',
      email: 'user2@example.com',
      lang: 'fr',  // Not supported - will fall back to context.lang
      noMail: false,
      machshirs: []
    },
    {
      id: '3',
      username: 'User3',
      email: 'user3@example.com',
      lang: 'es',  // Not supported - will fall back to context.lang
      noMail: false,
      machshirs: []
    }
  ];

  const notification: NotificationData = {
    title: { he: 'הודעה', en: 'Message', ar: 'رسالة' },
    body: { he: 'תוכן ההודעה', en: 'Message content', ar: 'محتوى الرسالة' }
  };

  // User1 gets Hebrew, User2 and User3 get context.lang (probably 'he')
  await emailService.sendBulk(recipients, notification, 'SimpleNuti', context);
}

// Example 4: Integration with NotificationOrchestrator
async function example4_withOrchestrator(context: ActionContext) {
  // This is how EmailService is used within the NotificationOrchestrator
  
  // The orchestrator automatically:
  // 1. Gets recipients from project
  // 2. Filters by noMail flag
  // 3. Sends via EmailService
  // 4. Handles errors gracefully
  
  // You don't need to call EmailService directly when using the orchestrator
  console.log('See NotificationOrchestrator.ts for integration example');
}

// Example 5: Error handling
async function example5_errorHandling(context: ActionContext) {
  const emailService = new EmailService();

  const recipients: UserProfile[] = [
    {
      id: '1',
      username: 'ValidUser',
      email: 'valid@example.com',
      lang: 'he',
      noMail: false,
      machshirs: []
    },
    {
      id: '2',
      username: 'InvalidUser',
      email: 'invalid-email',  // Invalid email format
      lang: 'en',
      noMail: false,
      machshirs: []
    }
  ];

  const notification: NotificationData = {
    title: { he: 'בדיקה', en: 'Test' },
    body: { he: 'בדיקת שגיאות', en: 'Error testing' }
  };

  try {
    // EmailService will attempt to send to all recipients
    // Individual failures are logged but don't stop the batch
    await emailService.sendBulk(recipients, notification, 'SimpleNuti', context);
    console.log('Batch completed (some may have failed - check logs)');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Example 6: Custom template (future enhancement)
async function example6_customTemplate(context: ActionContext) {
  const emailService = new EmailService();

  const recipients: UserProfile[] = [
    {
      id: '1',
      username: 'User1',
      email: 'user1@example.com',
      lang: 'he',
      noMail: false,
      machshirs: []
    }
  ];

  const notification: NotificationData = {
    title: { he: 'הזמנה', en: 'Invitation' },
    body: { he: 'הוזמנת לפרויקט', en: 'You were invited to a project' }
  };

  // Currently only 'SimpleNuti' is supported
  // In the future, you could specify different templates:
  // await emailService.sendBulk(recipients, notification, 'InvitationTemplate', context);
  
  await emailService.sendBulk(recipients, notification, 'SimpleNuti', context);
}

// Export examples for testing
export {
  example1_basicEmailSending,
  example2_noMailFiltering,
  example3_languageFallback,
  example4_withOrchestrator,
  example5_errorHandling,
  example6_customTemplate
};
