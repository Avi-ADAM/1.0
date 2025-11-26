/**
 * PushService
 * 
 * Handles push notification sending for the unified action system.
 * Integrates with existing pusherer infrastructure and web-push API.
 */

import type { ActionContext } from '../actions/types';
import type { UserProfile, NotificationData } from './NotificationOrchestrator';

export class PushService {
  /**
   * Send bulk push notifications to multiple recipients
   * 
   * @param recipients - List of users to send push notifications to
   * @param notification - Notification data with title, body, and metadata
   * @param context - Action context with fetch and language info
   */
  async sendBulk(
    recipients: UserProfile[],
    notification: NotificationData,
    context: ActionContext
  ): Promise<void> {
    // Filter users who have registered devices (machshirs)
    const pushRecipients = recipients.filter(user => 
      user.machshirs && user.machshirs.length > 0
    );

    if (pushRecipients.length === 0) {
      console.log('PushService: No push recipients after filtering');
      return;
    }

    console.log(`PushService: Sending push notifications to ${pushRecipients.length} recipients`);

    // Send push notifications to all recipients
    const pushPromises = pushRecipients.map(user => 
      this.sendToUser(user, notification, context)
    );

    // Wait for all notifications to be sent (but don't fail if some fail)
    const results = await Promise.allSettled(pushPromises);

    // Log any failures
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error(`PushService: ${failures.length} push notifications failed to send`);
      failures.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Push notification ${index} error:`, result.reason);
        }
      });
    }

    console.log(`PushService: Successfully sent ${results.length - failures.length}/${results.length} push notifications`);
  }

  /**
   * Send push notification to a single user (all their devices)
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

      // Send to all devices for this user
      const devicePromises = user.machshirs.map(machshir => 
        this.sendToDevice(machshir, title, body, notification, context)
      );

      // Wait for all devices
      const deviceResults = await Promise.allSettled(devicePromises);

      // Log device-level failures
      const deviceFailures = deviceResults.filter(r => r.status === 'rejected');
      if (deviceFailures.length > 0) {
        console.error(`PushService: ${deviceFailures.length}/${user.machshirs.length} devices failed for user ${user.id}`);
      } else {
        console.log(`PushService: Push notifications sent successfully to all ${user.machshirs.length} devices for user ${user.id} (${user.username})`);
      }
    } catch (error) {
      console.error(`PushService: Failed to send push notifications to user ${user.id}:`, error);
      throw error; // Re-throw so Promise.allSettled can catch it
    }
  }

  /**
   * Send push notification to a single device
   */
  private async sendToDevice(
    machshir: any,
    title: string,
    body: string,
    notification: NotificationData,
    context: ActionContext
  ): Promise<void> {
    // Check if device has the required jsoni field
    if (!machshir.attributes?.jsoni) {
      console.warn(`PushService: Device ${machshir.id} missing jsoni field, skipping`);
      return;
    }

    try {
      // Prepare push notification data
      const pushData = {
        jsoni: machshir.attributes.jsoni,
        machshirId: machshir.id,
        messege: {
          url: notification.metadata?.url || 'https://www.1lev1.com/lev',
          body: body,
          pic: notification.metadata?.icon || 'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png',
          title: title
        }
      };

      // Send via existing pusher API
      const response = await context.fetch('/api/pusher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pushData)
      });

      if (!response.ok) {
        throw new Error(`Pusher API returned status ${response.status}`);
      }

      console.log(`PushService: Push notification sent successfully to device ${machshir.id}`);
    } catch (error) {
      console.error(`PushService: Failed to send push notification to device ${machshir.id}:`, error);
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
