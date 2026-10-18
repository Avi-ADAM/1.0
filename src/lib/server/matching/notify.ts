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
  // Concierge-published needs are project-less — phrase without the rikma.
  const inProjectHe = projectName ? ` ברקמה "${projectName}"` : '';
  const inProjectEn = projectName ? ` in project "${projectName}"` : '';

  if (kind === 'resource') {
    return {
      title: {
        he: 'יש הצעה חדשה שיכולה להתאים לך 💚',
        en: 'There is a new suggestion that could fit you 💚'
      },
      body: {
        he: `מחפשים את המשאב "${entityName}"${inProjectHe} - בדיוק מה שיש לך להציע. היכנסו לעמוד הלב כדי להגיב.`,
        en: `The resource "${entityName}"${inProjectEn} is wanted - exactly what you have to offer. Visit your heart page to respond.`
      },
      metadata: { url: 'lev', priority: 'normal' }
    };
  }
  return {
    title: {
      he: 'יש הצעה חדשה שיכולה להתאים לך 💚',
      en: 'There is a new suggestion that could fit you 💚'
    },
    body: {
      he: `המשימה "${entityName}"${inProjectHe} מתאימה לכישורים ולתפקידים שלך. היכנסו לעמוד הלב כדי להגיב.`,
      en: `The mission "${entityName}"${inProjectEn} matches your skills and roles. Visit your heart page to respond.`
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
      { fetch: deps.fetch, lang: deps.lang || 'he' }
    );
  } catch (err) {
    console.error('[matching/notify] failed to send suggestion emails:', err);
  }
}

export type PartnerInviteEmailStatus = 'sent' | 'failed' | 'skipped';

/**
 * One email for the rikma invite. Existing members receive or reuse
 * match-suggestion cards from the matching engine; the email links to those
 * cards and the rikma's join page. A person without an account gets the public
 * join page, where they can sign up before offering themselves.
 */
export async function sendPartnerInvitationEmail(
  recipient: SuggestionRecipient,
  project: { id: string; name: string },
  targets: { openMissions: { id: string; name: string }[]; openMashaabims: { id: string; name: string }[] },
  deps: { fetch: typeof globalThis.fetch; lang?: string }
): Promise<PartnerInviteEmailStatus> {
  const missionNames = targets.openMissions.map((item) => item.name).filter(Boolean).slice(0, 8);
  const resourceNames = targets.openMashaabims.map((item) => item.name).filter(Boolean).slice(0, 8);
  const joinUrl = `/project/${encodeURIComponent(project.id)}/join`;
  const workHe = [
    missionNames.length ? `משימות שאפשר להציע לקחת: ${missionNames.join(', ')}` : '',
    resourceNames.length ? `משאבים שאפשר להציע לספק: ${resourceNames.join(', ')}` : ''
  ].filter(Boolean).join('. ');
  const workEn = [
    missionNames.length ? `Missions you can offer to take on: ${missionNames.join(', ')}` : '',
    resourceNames.length ? `Resources you can offer: ${resourceNames.join(', ')}` : ''
  ].filter(Boolean).join('. ');
  const workAr = [
    missionNames.length ? `مهام يمكنك عرض تولّيها: ${missionNames.join('، ')}` : '',
    resourceNames.length ? `موارد يمكنك عرض تقديمها: ${resourceNames.join('، ')}` : ''
  ].filter(Boolean).join('. ');

  const notification: NotificationData = {
    title: {
      he: `הזמנה להצטרף לרקמה "${project.name}"`,
      en: `An invitation to join "${project.name}"`,
      ar: `دعوة للانضمام إلى "${project.name}"`
    },
    body: {
      he: [
        `הוזמנת להצטרף לרקמה "${project.name}". אפשר לצפות במה שהיא מחפשת ולהציע השתתפות בתנאים שלך.`,
        workHe,
        'ההצעה שלך והחלטת הרקמה נעשות דרך האתר; שום דבר לא נרשם על שמך בלי הסכמתך.'
      ].filter(Boolean).join('\n\n'),
      en: [
        `You are invited to join the "${project.name}" rikma. See what it needs and offer to contribute on your own terms.`,
        workEn,
        'Your offer and the rikma’s decision happen on the site; nothing is assigned to you without your consent.'
      ].filter(Boolean).join('\n\n'),
      ar: [
        `أنت مدعو للانضمام إلى نسيج "${project.name}". اطّلع على احتياجاته وقدّم عرضًا للمساهمة بشروطك.`,
        workAr,
        'يتم تقديم عرضك وقرار النسيج عبر الموقع؛ لن يُسجّل أي شيء باسمك دون موافقتك.'
      ].filter(Boolean).join('\n\n')
    },
    links: [
      {
        kind: 'rikma',
        href: joinUrl,
        label: {
          he: 'לצפות ברקמה ולהצטרף',
          en: 'View the rikma and join',
          ar: 'عرض النسيج والانضمام',
          ru: 'Посмотреть рикму и присоединиться',
          es: 'Ver la rikma y unirme'
        }
      },
      ...(recipient.id && recipient.id !== 'external' && (missionNames.length || resourceNames.length)
        ? [{
            kind: 'lev' as const,
            href: '/lev',
            label: {
              he: 'לפתוח את ההזמנות שלי',
              en: 'Open my invitations',
              ar: 'افتح دعواتي',
              ru: 'Открыть мои приглашения',
              es: 'Abrir mis invitaciones'
            }
          }]
        : [])
    ]
  };

  try {
    const summary = await emailService.sendBulkWithResult(
      [
        {
          id: recipient.id || 'external',
          username: recipient.username || '',
          email: recipient.email,
          lang: recipient.lang || deps.lang || 'he',
          noMail: recipient.noMail,
          machshirs: []
        }
      ],
      notification,
      'SimpleNuti',
      { fetch: deps.fetch, lang: deps.lang || 'he' }
    );
    if (summary.sent > 0) return 'sent';
    if (summary.failed > 0) return 'failed';
    return 'skipped';
  } catch (err) {
    console.error('[matching/notify] failed to send partner invitation:', err);
    return 'failed';
  }
}
