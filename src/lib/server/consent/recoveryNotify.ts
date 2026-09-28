// T9b — the emails that make the two waiting periods mean something.
//
// A 72h activation delay protects nobody if the owner never learns a new
// guardian set was signed, and a 24h protest window protects nobody if the
// owner never learns a recovery started. Both go to the account's email. It
// is the one channel a thief holding an unlocked device does not
// automatically hold too.
//
// Recipient-language texts, so an inline { he, en, … } object is the right
// shape here (CLAUDE.md, i18n): $t() renders in the SENDER's locale.
// Fire-and-forget: sendMailSafe never throws, and a failed email must never
// fail the signed action that triggered it.

import { sendMailSafe } from '$lib/server/mailer.js';
import { userContact, usernamesFor } from './userDirectory';

const SITE = 'https://www.1lev1.com';
type Lang = 'he' | 'en' | 'ar' | 'ru' | 'es';
type Kind = 'guardiansChanged' | 'recoveryOpened' | 'recoveryCompleted' | 'nominated' | 'guardianWithdrew';

const TEXT: Record<Kind, Record<Lang, { subject: string; body: (v: Vars) => string }>> = {
  nominated: {
    he: {
      subject: 'ביקשו ממך להיות אפוטרופס לשחזור חשבון',
      body: (v) => `${v.name} ביקש/ה שתהיה/י אחד/ת מהאפוטרופסים של החשבון שלו/ה ב-1lev1. אם יאבדו כל המכשירים שלו/ה, תתבקש/י לאשר בשיחה או פנים אל פנים שהמכשיר החדש באמת שלו/ה.\nזה תקף רק אחרי שתסכים/י: ${SITE}/me/settings/recovery`
    },
    en: {
      subject: "You've been asked to be an account-recovery guardian",
      body: (v) => `${v.name} asked you to be one of the guardians of their 1lev1 account. If they ever lose every device, you'll be asked to confirm — by voice or in person — that their new device really is theirs.\nIt only counts once you agree: ${SITE}/me/settings/recovery`
    },
    ar: {
      subject: 'طُلب منك أن تكون وصيًّا لاستعادة حساب',
      body: (v) => `طلب ${v.name} أن تكون أحد أوصياء حسابه على 1lev1. إذا فقد كل أجهزته، سيُطلب منك أن تؤكد صوتيًا أو وجهًا لوجه أن جهازه الجديد له فعلًا.\nلا يسري ذلك إلا بعد موافقتك: ${SITE}/me/settings/recovery`
    },
    ru: {
      subject: 'Вас просят стать поручителем для восстановления аккаунта',
      body: (v) => `${v.name} просит вас стать одним из поручителей своего аккаунта в 1lev1. Если он потеряет все устройства, вас попросят подтвердить — голосом или лично, — что новое устройство действительно его.\nЭто вступит в силу только после вашего согласия: ${SITE}/me/settings/recovery`
    },
    es: {
      subject: 'Te pidieron ser aval para recuperar una cuenta',
      body: (v) => `${v.name} te pidió ser uno de los avales de su cuenta en 1lev1. Si alguna vez pierde todos sus dispositivos, se te pedirá confirmar —por voz o en persona— que su nuevo dispositivo es realmente suyo.\nSolo cuenta cuando aceptes: ${SITE}/me/settings/recovery`
    }
  },
  guardianWithdrew: {
    he: {
      subject: 'אפוטרופס הפסיק לשמש לחשבון שלך',
      body: (v) => `${v.name} כבר לא משמש/ת אפוטרופס לחשבון שלך. כדאי לבדוק שעדיין יש מספיק אפוטרופסים: ${SITE}/me/settings/recovery`
    },
    en: {
      subject: 'A guardian stepped down from your account',
      body: (v) => `${v.name} is no longer a guardian of your account. Check that you still have enough guardians: ${SITE}/me/settings/recovery`
    },
    ar: {
      subject: 'تنحّى وصي عن حسابك',
      body: (v) => `لم يعد ${v.name} وصيًّا على حسابك. تحقق من أنه ما زال لديك عدد كافٍ من الأوصياء: ${SITE}/me/settings/recovery`
    },
    ru: {
      subject: 'Поручитель вашего аккаунта отказался от роли',
      body: (v) => `${v.name} больше не является поручителем вашего аккаунта. Проверьте, хватает ли у вас поручителей: ${SITE}/me/settings/recovery`
    },
    es: {
      subject: 'Un aval dejó de serlo para tu cuenta',
      body: (v) => `${v.name} ya no es aval de tu cuenta. Comprueba que todavía tienes suficientes avales: ${SITE}/me/settings/recovery`
    }
  },
  guardiansChanged: {
    he: {
      subject: 'נחתמה רשימת אפוטרופסים חדשה לחשבון שלך',
      body: (v) => `מכשיר של החשבון שלך חתם על רשימת אפוטרופסים חדשה. היא תיכנס לתוקף ב-${v.when}.\nאם זה לא היית את/ה, בטל/י את המכשיר ההוא לפני המועד הזה: ${SITE}/me/devices`
    },
    en: {
      subject: 'A new guardian list was signed for your account',
      body: (v) => `A device on your account signed a new list of recovery guardians. It takes effect on ${v.when}.\nIf this wasn't you, revoke that device before then: ${SITE}/me/devices`
    },
    ar: {
      subject: 'تم توقيع قائمة أوصياء جديدة لحسابك',
      body: (v) => `وقّع جهاز على حسابك قائمة جديدة بأوصياء الاستعادة. ستسري في ${v.when}.\nإن لم تكن أنت، ألغِ ذلك الجهاز قبل هذا الموعد: ${SITE}/me/devices`
    },
    ru: {
      subject: 'Для вашего аккаунта подписан новый список поручителей',
      body: (v) => `Устройство вашего аккаунта подписало новый список поручителей для восстановления. Он вступит в силу ${v.when}.\nЕсли это были не вы, отзовите это устройство до этого времени: ${SITE}/me/devices`
    },
    es: {
      subject: 'Se firmó una nueva lista de avales para tu cuenta',
      body: (v) => `Un dispositivo de tu cuenta firmó una nueva lista de avales de recuperación. Entrará en vigor el ${v.when}.\nSi no fuiste tú, revoca ese dispositivo antes de esa fecha: ${SITE}/me/devices`
    }
  },
  recoveryOpened: {
    he: {
      subject: 'התחיל שחזור של החשבון שלך במכשיר חדש',
      body: (v) => `מישהו פתח בקשה לשחזר את החשבון שלך במכשיר חדש (טביעת אצבע ${v.fingerprint}).\nאם זה את/ה, אין צורך לעשות דבר. אם לא, היכנס/י ממכשיר שנמצא אצלך ולחץ/י "זה לא אני": ${SITE}/me/settings/recovery\nלאחר אישור האפוטרופסים יש 24 שעות למחות.`
    },
    en: {
      subject: 'A recovery of your account started on a new device',
      body: (v) => `Someone opened a request to recover your account on a new device (fingerprint ${v.fingerprint}).\nIf this is you, there is nothing to do. If not, open this page on a device you still hold and press "This isn't me": ${SITE}/me/settings/recovery\nOnce your guardians approve, you have 24 hours to object.`
    },
    ar: {
      subject: 'بدأت استعادة حسابك على جهاز جديد',
      body: (v) => `فتح أحدهم طلبًا لاستعادة حسابك على جهاز جديد (البصمة ${v.fingerprint}).\nإن كنت أنت فلا حاجة لفعل شيء. وإلا فافتح هذه الصفحة من جهاز ما زال معك واضغط "هذا ليس أنا": ${SITE}/me/settings/recovery\nبعد موافقة الأوصياء لديك 24 ساعة للاعتراض.`
    },
    ru: {
      subject: 'Началось восстановление вашего аккаунта на новом устройстве',
      body: (v) => `Кто-то открыл запрос на восстановление вашего аккаунта на новом устройстве (отпечаток ${v.fingerprint}).\nЕсли это вы, ничего делать не нужно. Если нет, откройте эту страницу на устройстве, которое у вас есть, и нажмите «Это не я»: ${SITE}/me/settings/recovery\nПосле одобрения поручителей у вас есть 24 часа, чтобы возразить.`
    },
    es: {
      subject: 'Comenzó la recuperación de tu cuenta en un dispositivo nuevo',
      body: (v) => `Alguien abrió una solicitud para recuperar tu cuenta en un dispositivo nuevo (huella ${v.fingerprint}).\nSi eres tú, no hace falta hacer nada. Si no, abre esta página en un dispositivo que todavía tengas y pulsa «No soy yo»: ${SITE}/me/settings/recovery\nCuando tus avales aprueben, tienes 24 horas para objetar.`
    }
  },
  recoveryCompleted: {
    he: {
      subject: 'מכשיר חדש שוחזר לחשבון שלך',
      body: (v) => `מכשיר חדש (טביעת אצבע ${v.fingerprint}) נרשם לחשבון שלך באישור האפוטרופסים. שאר המכשירים הישנים בוטלו.\nאם זה לא היית את/ה, פנה/י לאפוטרופסים שלך מיד.`
    },
    en: {
      subject: 'A new device was recovered on your account',
      body: (v) => `A new device (fingerprint ${v.fingerprint}) was registered on your account with your guardians' approval. Your old devices were retired.\nIf this wasn't you, contact your guardians right away.`
    },
    ar: {
      subject: 'تمت استعادة جهاز جديد على حسابك',
      body: (v) => `سُجّل جهاز جديد (البصمة ${v.fingerprint}) على حسابك بموافقة أوصيائك، وأُلغيت أجهزتك القديمة.\nإن لم تكن أنت، تواصل مع أوصيائك فورًا.`
    },
    ru: {
      subject: 'На вашем аккаунте восстановлено новое устройство',
      body: (v) => `Новое устройство (отпечаток ${v.fingerprint}) зарегистрировано на вашем аккаунте с одобрения поручителей. Старые устройства отозваны.\nЕсли это были не вы, немедленно свяжитесь с поручителями.`
    },
    es: {
      subject: 'Se recuperó un dispositivo nuevo en tu cuenta',
      body: (v) => `Un dispositivo nuevo (huella ${v.fingerprint}) se registró en tu cuenta con la aprobación de tus avales. Tus dispositivos anteriores quedaron retirados.\nSi no fuiste tú, contacta a tus avales de inmediato.`
    }
  }
};

type Vars = { when?: string; fingerprint?: string; name?: string };

const LOCALE: Record<Lang, string> = { he: 'he-IL', en: 'en-GB', ar: 'ar', ru: 'ru-RU', es: 'es-ES' };

export async function notifyRecovery(
  userId: string,
  kind: Kind,
  vars: { at?: number; fingerprint?: string; otherId?: string } = {}
): Promise<void> {
  try {
    const who = await userContact(userId);
    if (!who) return;
    const lang = (['he', 'en', 'ar', 'ru', 'es'].includes(who.lang) ? who.lang : 'he') as Lang;
    const when = vars.at
      ? new Date(vars.at).toLocaleString(LOCALE[lang], { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jerusalem' })
      : '';
    const t = TEXT[kind][lang];
    const name = vars.otherId ? (await usernamesFor([vars.otherId]))[vars.otherId] ?? '1lev1' : undefined;
    const text = t.body({ when, fingerprint: vars.fingerprint, name });
    const dir = lang === 'he' || lang === 'ar' ? 'rtl' : 'ltr';
    const html = `<div dir="${dir}" style="font-family:sans-serif;line-height:1.6">${text
      .split('\n')
      .map((l) => `<p>${escapeHtml(l)}</p>`)
      .join('')}</div>`;
    await sendMailSafe({ to: who.email, subject: t.subject, text, html });
  } catch (e) {
    console.warn('[recovery-telemetry] notify failed', { userId, kind, error: (e as Error).message });
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
