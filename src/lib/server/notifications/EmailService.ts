/**
 * EmailService
 * 
 * Handles email notification sending for the unified action system.
 * Integrates with existing sendBolkMail infrastructure and Svelte email templates.
 */

import type { ActionContext } from '../actions/types';
import type { UserProfile, NotificationData } from './NotificationOrchestrator';

export class EmailService {
  /**
   * Send bulk email notifications to multiple recipients
   * 
   * @param recipients - List of users to send emails to
   * @param notification - Notification data with title, body, and metadata
   * @param templateName - Name of the Svelte email template to use (default: 'SimpleNuti')
   * @param context - Action context with fetch and language info
   */
  async sendBulk(
    recipients: UserProfile[],
    notification: NotificationData,
    templateName: string = 'SimpleNuti',
    context: ActionContext
  ): Promise<void> {
    // Filter users who don't want email (noMail flag)
    const emailRecipients = recipients.filter(user => user.noMail !== true);

    if (emailRecipients.length === 0) {
      console.log('EmailService: No email recipients after filtering');
      return;
    }

    console.log(`EmailService: Sending emails to ${emailRecipients.length} recipients`);

    // Import email rendering dynamically
    const { render } = await import('svelty-email');
    
    // Load the appropriate template
    const template = await this.loadTemplate(templateName);

    // Send emails to all recipients
    const emailPromises = emailRecipients.map(user => 
      this.sendToUser(user, notification, template, render, context)
    );

    // Wait for all emails to be sent (but don't fail if some fail)
    const results = await Promise.allSettled(emailPromises);

    // Log any failures
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error(`EmailService: ${failures.length} emails failed to send`);
      failures.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Email ${index} error:`, result.reason);
        }
      });
    }

    console.log(`EmailService: Successfully sent ${results.length - failures.length}/${results.length} emails`);
  }

  /**
   * Send email to a single user
   */
  private async sendToUser(
    user: UserProfile,
    notification: NotificationData,
    template: any,
    render: any,
    context: ActionContext
  ): Promise<void> {
    try {
      // Determine language - use user's language if it's supported, otherwise fall back to context language
      const lang = this.selectLanguage(user.lang, context.lang);

      // Render the email template
      const emailHtml = await render(template, {
        head: notification.title,
        body: notification.body,
        username: user.username,
        previewText: notification.title,
        lang
      });

      // Prepare email data for the sendMail API
      const emailData = {
        email: user.email,
        emailHtml,
        previewText: notification.title[lang as 'he' | 'en' | 'ar'] || notification.title.he,
        emailText: this.generatePlainText(notification, lang)
      };

      // Send via existing sendMail API
      const response = await context.fetch('/api/sendMail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        throw new Error(`Email API returned status ${response.status}`);
      }

      console.log(`EmailService: Email sent successfully to ${user.email}`);
    } catch (error) {
      console.error(`EmailService: Failed to send email to ${user.email}:`, error);
      throw error; // Re-throw so Promise.allSettled can catch it
    }
  }

  /**
   * Load email template by name
   */
  private async loadTemplate(templateName: string): Promise<any> {
    try {
      // Currently only SimpleNuti is supported
      // In the future, this can be extended to support multiple templates
      if (templateName === 'SimpleNuti') {
        const module = await import('$lib/components/mail/simpleNuti.svelte');
        return module.default;
      }

      // Default to SimpleNuti if template not found
      console.warn(`EmailService: Template '${templateName}' not found, using SimpleNuti`);
      const module = await import('$lib/components/mail/simpleNuti.svelte');
      return module.default;
    } catch (error) {
      console.error(`EmailService: Failed to load template '${templateName}':`, error);
      throw error;
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

  /**
   * Generate plain text version of the email
   */
  private generatePlainText(notification: NotificationData, lang: string): string {
    const title = notification.title[lang as 'he' | 'en' | 'ar'] || notification.title.he;
    const body = notification.body[lang as 'he' | 'en' | 'ar'] || notification.body.he;
    
    return `${title}: ${body}`;
  }
}
