/**
 * Haluka Notification Service
 * 
 * Sends customized notifications for haluka approvals:
 * - Celebratory notifications with confetti for users receiving money
 * - Formal notifications for users giving money
 */

import type { UserProfile } from './NotificationOrchestrator';
import type { ActionContext } from '../actions/types';

interface HalukaData {
  id: string;
  noten: boolean; // Is this user giving money?
  mekabel: boolean; // Is this user receiving money?
  amount: number;
  users_permissions_user: {
    data: {
      id: string;
    };
  };
}

interface NotificationContent {
  title: { he: string; en: string; ar: string };
  body: { he: string; en: string; ar: string };
  icon?: string;
  url?: string;
}

export class HalukaNotificationService {
  /**
   * Generate customized notification content based on user's role in haluka
   */
  static getNotificationContent(
    userId: string,
    halukot: HalukaData[]
  ): NotificationContent {
    // Find user's haluka entries
    const userHalukot = halukot.filter((h) => {
      const halukaUserId = h.users_permissions_user?.data?.id || h.users_permissions_user?.id || h.userId;
      return String(halukaUserId) === String(userId);
    });

    if (userHalukot.length === 0) {
      // Fallback for users not directly in halukot
      return {
        title: {
          he: 'חלוקה אושרה',
          en: 'Division Approved',
          ar: 'تمت الموافقة على التقسيم'
        },
        body: {
          he: 'החלוקה אושרה על ידי כל המשתתפים',
          en: 'The division has been approved by all participants',
          ar: 'تمت الموافقة على التقسيم من قبل جميع المشاركين'
        },
        url: 'lev'
      };
    }

    // Calculate totals
    const receiving = userHalukot
      .filter((h) => h.mekabel)
      .reduce((sum, h) => sum + (h.amount || 0), 0);
    
    const giving = userHalukot
      .filter((h) => h.noten)
      .reduce((sum, h) => sum + (h.amount || 0), 0);

    const netAmount = receiving - giving;

    // User is receiving money (net positive)
    if (netAmount > 0) {
      return {
        title: {
          he: `🎉 מזל טוב! קיבלת ${netAmount} ש"ח`,
          en: `🎉 Congratulations! You received ${netAmount} ILS`,
          ar: `🎉 تهانينا! لقد استلمت ${netAmount} شيكل`
        },
        body: {
          he: `החלוקה אושרה! ${netAmount} ש"ח נוספו ליתרה שלך 💰 כעת היכנס לעמוד הלב לתאום פרטי קבלת הכסף`,
          en: `Division approved! ${netAmount} ILS added to your balance 💰 Now go to the Lev page to coordinate receiving the money`,
          ar: `تمت الموافقة على التقسيم! تمت إضافة ${netAmount} شيكل إلى رصيدك 💰 الآن انتقل إلى صفحة ليف لتنسيق استلام المال`
        },
        icon: '🎉',
        url: 'lev'
      };
    }
    
    // User is giving money (net negative)
    if (netAmount < 0) {
      const absAmount = Math.abs(netAmount);
      return {
        title: {
          he: `חלוקה אושרה - ${absAmount} ש"ח`,
          en: `Division Approved - ${absAmount} ILS`,
          ar: `تمت الموافقة على التقسيم - ${absAmount} شيكل`
        },
        body: {
          he: `החלוקה אושרה. עליך להעביר ${absAmount} ש"ח 🤝 כעת היכנס לעמוד הלב לתאום פרטי ההעברה`,
          en: `Division approved. You need to transfer ${absAmount} ILS 🤝 Now go to the Lev page to coordinate the transfer`,
          ar: `تمت الموافقة على التقسيم. يجب عليك تحويل ${absAmount} شيكل 🤝 الآن انتقل إلى صفحة ليف لتنسيق التحويل`
        },
        icon: '📋',
        url: 'lev'
      };
    }

    // Net zero (giving and receiving equal amounts)
    return {
      title: {
        he: 'חלוקה אושרה',
        en: 'Division Approved',
        ar: 'تمت الموافقة على التقسيم'
      },
      body: {
        he: 'החלוקה אושרה. היתרה שלך מאוזנת',
        en: 'Division approved. Your balance is even',
        ar: 'تمت الموافقة على التقسيم. رصيدك متوازن'
      },
      url: 'lev'
    };
  }

  /**
   * Send notifications to all users involved in haluka
   */
  static async sendHalukaNotifications(
    halukot: HalukaData[],
    context: ActionContext,
    projectId?: string
  ): Promise<void> {
    // Get unique user IDs from halukot
    const userIds = new Set<string>();
    halukot.forEach((h) => {
      const userId = h.users_permissions_user?.data?.id || h.users_permissions_user?.id || h.userId;
      if (userId) {
        userIds.add(String(userId));
      }
    });

    // Get user profiles from Strapi
    const userProfiles = await this.getUserProfiles(Array.from(userIds), context);

    // For each user, send customized notification
    for (const user of userProfiles) {
      const content = this.getNotificationContent(user.id, halukot);
      const userLang = ['he', 'en', 'ar'].includes(user.lang) ? user.lang : context.lang;
      
      // Calculate if user is receiving or giving
      const userHalukot = halukot.filter(
        (h) => String(h.users_permissions_user.data.id) === String(user.id)
      );
      const receiving = userHalukot
        .filter((h) => h.mekabel)
        .reduce((sum, h) => sum + (h.amount || 0), 0);
      const giving = userHalukot
        .filter((h) => h.noten)
        .reduce((sum, h) => sum + (h.amount || 0), 0);
      const netAmount = Math.abs(receiving - giving);
      const isReceiving = receiving > giving;

      // Send via all channels in parallel
      const promises: Promise<void>[] = [];

      // Socket notification
      promises.push(
        context.fetch('/api/socket/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userIds: [user.id],
            notification: {
              title: content.title[userLang],
              body: content.body[userLang],
              icon: content.icon,
              url: content.url
            }
          })
        }).then(() => {}).catch((err: Error) => {
          console.error(`Socket notification failed for user ${user.id}:`, err);
        })
      );

      // Email notification (if user allows)
      if (!user.noMail) {
        promises.push(
          this.sendEmail(user, content, netAmount, isReceiving, userLang, context)
            .then(() => {})
            .catch((err: Error) => {
              console.error(`Email notification failed for user ${user.id}:`, err);
            })
        );
      }

      // Telegram notification (if user has telegram)
      if (user.telegramId) {
        promises.push(
          context.fetch('https://www.1lev1.com/api/ste', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              isNew: true,
              lang: userLang,
              chat_id: user.telegramId,
              det: content.title[userLang],
              message: content.body[userLang],
              urladd: 'lev'
            })
          }).then(() => {}).catch((err: Error) => {
            console.error(`Telegram notification failed for user ${user.id}:`, err);
          })
        );
      }

      // Push notifications (for all user devices)
      for (const machshir of user.machshirs) {
        if (machshir.attributes?.jsoni) {
          promises.push(
            context.fetch('/api/pusher', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsoni: machshir.attributes.jsoni,
                machshirId: machshir.id,
                messege: {
                  url: 'https://www.1lev1.com/lev',
                  body: content.body[userLang],
                  pic: content.icon || 'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png',
                  title: content.title[userLang]
                }
              })
            }).then(() => {}).catch((err: Error) => {
              console.error(`Push notification failed for user ${user.id}, device ${machshir.id}:`, err);
            })
          );
        }
      }

      await Promise.allSettled(promises);
    }
  }

  /**
   * Send email using svelty-email template
   */
  private static async sendEmail(
    user: UserProfile,
    content: NotificationContent,
    amount: number,
    isReceiving: boolean,
    lang: string,
    context: ActionContext
  ): Promise<void> {
    // Import the email template dynamically
    const { render } = await import('svelty-email');
    const HalukaApproved = await import('$lib/components/mail/HalukaApproved.svelte');
    
    // Render the email
    const emailHtml = await render(HalukaApproved.default, {
      username: user.username,
      amount,
      isReceiving,
      lang,
      previewText: content.title[lang]
    });

    // Send via existing sendMail API
    await context.fetch('/api/sendMail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        emailHtml,
        previewText: content.title[lang],
        emailText: `${content.title[lang]}: ${content.body[lang]}`
      })
    });
  }

  /**
   * Get user profiles from Strapi
   */
  private static async getUserProfiles(
    userIds: string[],
    context: ActionContext
  ): Promise<UserProfile[]> {
    // For now, return mock data
    // In production, this should query Strapi using QIDS
    return userIds.map(id => ({
      id,
      username: `User ${id}`,
      email: `user${id}@example.com`,
      lang: 'he',
      telegramId: undefined,
      noMail: false,
      machshirs: []
    }));
  }
}
