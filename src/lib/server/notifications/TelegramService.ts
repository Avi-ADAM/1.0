/**
 * TelegramService
 * 
 * Handles Telegram notification sending for the unified action system.
 * Posts to the bot relay (/api/ste) for each recipient with a telegramId.
 */

import type { ActionContext } from '../actions/types';
import type { UserProfile, NotificationData } from './NotificationOrchestrator';
import { recipientTemplateLang, textFor } from './intent';
import { getInternalSecret, INTERNAL_HEADER } from '$lib/server/internalSecret.js';

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
      // The recipient's language, never the sender's (see recipientTemplateLang)
      const lang = recipientTemplateLang(user.lang);

      // Get the notification text in the appropriate language — the body may
      // speak theirs even where the templates do not (textFor).
      const title = textFor(notification.title, user.lang);
      const body = textFor(notification.body, user.lang);

      // /api/ste appends a path to 'https://www.1lev1.com/', so a config url
      // written as a route ('/deals') would become '//deals'.
      const path = (url: unknown) => String(url || 'lev').replace(/^\/+/, '') || 'lev';

      // Prepare Telegram message data
      const telegramData = {
        isNew: true,
        lang,
        chat_id: user.telegramId,
        // The relay sends HTML: a name with "<" or "&" in it would make
        // Telegram refuse the whole message.
        det: escapeHtml(title),
        message: escapeHtml(body),
        urladd: path(notification.metadata?.url),
        // One button per place to answer it (the rikma's vote page, the heart),
        // so the reader chooses; without links, the one `urladd` button.
        buttons: (notification.links ?? []).map((l) => ({ text: textFor(l.label, user.lang), path: path(l.href) }))
      };

      // The relay sends to a chosen chat only for this server. handleFetch
      // stamps the internal secret on same-origin calls, and this one is an
      // absolute www URL that is cross-origin from the VPS — so it carries the
      // header itself.
      const response = await context.fetch('https://www.1lev1.com/api/ste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [INTERNAL_HEADER]: getInternalSecret(),
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

}
