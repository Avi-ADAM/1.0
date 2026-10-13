/**
 * EmailService
 * 
 * Handles email notification sending for the unified action system.
 * Integrates with existing sendBolkMail infrastructure and Svelte email templates.
 */

import type { ActionContext } from '../actions/types';
import type { UserProfile, NotificationData } from './NotificationOrchestrator';
import { recipientTemplateLang, textFor } from './intent';

/** Links in an email leave the site — they need the host. */
const SITE = 'https://www.1lev1.com';

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
    context: ActionContext,
    templateData?: Record<string, any>
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
      this.sendToUser(user, notification, template, render, context, templateData)
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
    context: ActionContext,
    templateData?: Record<string, any>
  ): Promise<void> {
    try {
      // The recipient's language, never the sender's (see recipientTemplateLang).
      // The template's own words come in `lang`; the title and body may speak
      // the reader's language even where the templates do not (textFor).
      const lang = recipientTemplateLang(user.lang);
      const title = textFor(notification.title, user.lang);
      const body = textFor(notification.body, user.lang);
      // Every place to answer it, as buttons — the reader picks.
      const links = (notification.links ?? []).map((l) => ({
        label: textFor(l.label, user.lang),
        href: `${SITE}${l.href}`
      }));

      // Render the email template
      const emailHtml = await render(template, {
        head: { ...notification.title, [lang]: title },
        body: { ...notification.body, [lang]: body },
        username: user.username,
        previewText: { ...notification.title, [lang]: title },
        lang,
        ...(links.length ? { links } : {}),
        ...(templateData || {})
      });

      // Prepare email data for the sendMail API
      const emailData = {
        email: user.email,
        emailHtml,
        previewText: title,
        emailText: [`${title}: ${body}`, ...links.map((l) => `${l.label}: ${l.href}`)].join('\n')
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
      const templates: Record<string, () => Promise<any>> = {
        SimpleNuti: () => import('$lib/components/mail/simpleNuti.svelte'),
        PendJustCreated: () => import('$lib/components/mail/pendJustCreated.svelte'),
        MissionInvite: () => import('$lib/components/mail/missionInvite.svelte'),
        HalukaApproved: () => import('$lib/components/mail/HalukaApproved.svelte'),
        ComeVoteJoin: () => import('$lib/components/mail/comeVoteJoin.svelte'),
        MissionAccepted: () => import('$lib/components/mail/mail.svelte'),
        MonthlyResourceActive: () => import('$lib/components/mail/monthlyResourceActive.svelte'),
      };

      const loader = templates[templateName];
      if (loader) {
        const module = await loader();
        return module.default;
      }

      console.warn(`EmailService: Template '${templateName}' not found, using SimpleNuti`);
      const fallback = await import('$lib/components/mail/simpleNuti.svelte');
      return fallback.default;
    } catch (error) {
      console.error(`EmailService: Failed to load template '${templateName}':`, error);
      throw error;
    }
  }

}
