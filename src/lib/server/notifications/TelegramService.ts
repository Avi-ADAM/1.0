/**
 * TelegramService
 * 
 * Handles Telegram notification sending for the unified action system.
 * Integrates with existing sendBolkTelegram infrastructure.
 */

import type { ActionContext } from '../actions/types';
import type { UserProfile, NotificationData } from './NotificationOrchestrator';

export class TelegramService {
  /**
   * Send bulk Telegram notifications to multiple recipients
   * 
   * @param recipients - List of users to send Telegram messages to
   * @param notification - Notification data with title, body, and metadata
   * @param context - Action context with fetch and language info
   */
  async sendBulk(
    recipients: UserProfile[],
    notification: NotificationData,
    context: ActionContext
  ): Promise<void> {
    // Filter users who don't have a Telegram ID
    const telegramRecipients = recipients.filter(user => 
      user.telegramId && user.telegramId.trim() !== ''
    );

    if (telegramRecipients.length === 0) {
      console.log('TelegramService: No Telegram recipients after filtering');
      return;
    }

    console.log(`TelegramService: Sending Telegram messages to ${telegramRecipients.length} recipients`);

    // Send Telegram messages to all recipients
    const telegramPromises = telegramRecipients.map(user => 
      this.sendToUser(user, notification, context)
    );

    // Wait for all messages to be sent (but don't fail if some fail)
    const results = await Promise.allSettled(telegramPromises);

    // Log any failures
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error(`TelegramService: ${failures.length} Telegram messages failed to send`);
      failures.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Telegram message ${index} error:`, result.reason);
        }
      });
    }

    console.log(`TelegramService: Successfully sent ${results.length - failures.length}/${results.length} Telegram messages`);
  }

  /**
   * Send Telegram message to a single user
   */
  private async sendToUser(
    user: UserProfile,
    notification: NotificationData,
    context: ActionContext
  ): Promise<void> {
    try {
      // Determine language - use user's language if it's supported, otherwise fall back to context language
      const lang = this.selectLanguage(user.lang, context.lang);

      // Get the notification text in the appropriate language
      const title = notification.title[lang as 'he' | 'en' | 'ar'] || notification.title.he;
      const body = notification.body[lang as 'he' | 'en' | 'ar'] || notification.body.he;

      // Prepare Telegram message data
      const telegramData = {
        isNew: true,
        lang,
        chat_id: user.telegramId,
        det: title,
        message: body,
        urladd: notification.metadata?.url || 'lev'
      };

      // Send via existing Telegram API
      const response = await context.fetch('https://www.1lev1.com/api/ste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(telegramData)
      });

      if (!response.ok) {
        throw new Error(`Telegram API returned status ${response.status}`);
      }

      console.log(`TelegramService: Telegram message sent successfully to user ${user.id} (${user.username})`);
    } catch (error) {
      console.error(`TelegramService: Failed to send Telegram message to user ${user.id}:`, error);
      throw error; // Re-throw so Promise.allSettled can catch it
    }
  }

  /**
   * Select appropriate language for the user
   * Uses user's language if supported, otherwise falls back to context language
   */
  private selectLanguage(userLang: string, contextLang: string): string {
    const supportedLanguages = ['he', 'en', 'ar'];
    
    if (supportedLanguages.includes(userLang)) {
      return userLang;
    }
    
    if (supportedLanguages.includes(contextLang)) {
      return contextLang;
    }
    
    // Default to Hebrew
    return 'he';
  }
}
