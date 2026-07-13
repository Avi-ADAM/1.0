/**
 * Email notification for freshly created match suggestions.
 *
 * Kept separate from NotificationOrchestrator because suggestion recipients
 * are computed by the matching engine (not by a declarative RecipientRule on
 * an action config). Reuses EmailService so noMail filtering, language
 * selection and the SimpleNuti template all behave like every other mail.
 */

import { EmailService } from '$lib/server/notifications/EmailService';
import type { UserProfile, NotificationData } from '$lib/server/notifications/NotificationOrchestrator';

export interface SuggestionRecipient {
  id: string;
  username: string;
  email: string;
  lang?: string;
  noMail?: boolean;
}

const emailService = new EmailService();

function buildNotification(
  kind: 'mission' | 'resource',
  entityName: string,
  projectName: string
): NotificationData {
  if (kind === 'resource') {
    return {
      title: {
        he: 'הזדמנות חדשה למשאב שלך מחכה בלב 💚',
        en: 'A new opportunity for your resource is waiting in your heart 💚'
      },
      body: {
        he: `הרקמה "${projectName}" מחפשת את המשאב "${entityName}" — בדיוק מה שיש לך להציע. היכנסו לעמוד הלב כדי להגיב.`,
        en: `The project "${projectName}" is looking for the resource "${entityName}" — exactly what you have to offer. Visit your heart page to respond.`
      },
      metadata: { url: 'lev', priority: 'normal' }
    };
  }
  return {
    title: {
      he: 'הצעה חדשה למשימה מחכה לך בלב 💚',
      en: 'A new mission suggestion is waiting in your heart 💚'
    },
    body: {
      he: `המשימה "${entityName}" ברקמה "${projectName}" מתאימה לכישורים ולתפקידים שלך. היכנסו לעמוד הלב כדי להגיב.`,
      en: `The mission "${entityName}" in project "${projectName}" matches your skills and roles. Visit your heart page to respond.`
    },
    metadata: { url: 'lev', priority: 'normal' }
  };
}

/**
 * Send "you have a new suggestion" emails. Errors are logged, never thrown —
 * notification failure must not fail the action that created the entity.
 */
export async function sendNewSuggestionEmails(
  recipients: SuggestionRecipient[],
  kind: 'mission' | 'resource',
  entityName: string,
  projectName: string,
  deps: { fetch: typeof globalThis.fetch; lang?: string }
): Promise<void> {
  if (recipients.length === 0) return;
  try {
    const profiles: UserProfile[] = recipients.map((r) => ({
      id: String(r.id),
      username: r.username,
      email: r.email,
      lang: r.lang || 'he',
      noMail: r.noMail,
      machshirs: []
    }));
    const notification = buildNotification(kind, entityName || '', projectName || '');
    await emailService.sendBulk(
      profiles,
      notification,
      'SimpleNuti',
      { fetch: deps.fetch, lang: deps.lang || 'he' } as any
    );
  } catch (err) {
    console.error('[matching/notify] failed to send suggestion emails:', err);
  }
}
