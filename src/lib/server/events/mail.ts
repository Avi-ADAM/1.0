/**
 * The registration email (docs/inprogress/PLAN_EVENTS_WEBINARS.md §5.2).
 *
 * Written in the *registrant's* language — the one place a `{ he, en, … }`
 * table is right (CLAUDE.md i18n: `$t()` follows the reader of a page; an
 * email follows its recipient). Every link points at the registrant's own
 * `/e/<token>` page, never at the Zoom link itself.
 */

import { buildIcs, googleCalendarUrl } from '$lib/events/ics';
import type { EventView, SessionView } from '$lib/events/model';
import { sendMailSafe } from '$lib/server/mailer.js';

type Lang = 'he' | 'en' | 'ar' | 'ru' | 'es';
const LANGS: Lang[] = ['he', 'en', 'ar', 'ru', 'es'];
const RTL = new Set<Lang>(['he', 'ar']);

const COPY: Record<Lang, Record<string, string>> = {
  he: {
    subject: 'נרשמת: {{title}}',
    subjectWait: 'ברשימת ההמתנה: {{title}}',
    hello: 'שלום {{name}},',
    registered: 'המקום שלך שמור.',
    waitlist: 'המועד מלא כרגע, ונכנסת לרשימת ההמתנה. אם יתפנה מקום — נכתוב לך.',
    when: 'מתי',
    howJoin: 'הקישור לכניסה נפתח בדף ההרשמה שלך 15 דקות לפני ההתחלה.',
    myPage: 'דף ההרשמה שלי',
    calendar: 'להוסיף ל-Google Calendar',
    icsNote: 'מצורף גם קובץ יומן לכל תוכנה אחרת.',
    footer: 'קיבלת את המייל הזה כי נרשמת דרך 1lev1. לביטול ההרשמה — בדף ההרשמה שלך.'
  },
  en: {
    subject: "You're registered: {{title}}",
    subjectWait: "You're on the waiting list: {{title}}",
    hello: 'Hi {{name}},',
    registered: 'Your seat is saved.',
    waitlist: "This date is full right now, so you're on the waiting list. We'll write if a seat opens.",
    when: 'When',
    howJoin: 'The join link opens on your registration page 15 minutes before the start.',
    myPage: 'My registration',
    calendar: 'Add to Google Calendar',
    icsNote: 'A calendar file for any other app is attached.',
    footer: 'You got this email because you registered through 1lev1. To cancel, use your registration page.'
  },
  ar: {
    subject: 'تم تسجيلك: {{title}}',
    subjectWait: 'أنت على قائمة الانتظار: {{title}}',
    hello: 'مرحبًا {{name}}،',
    registered: 'مكانك محجوز.',
    waitlist: 'هذا الموعد ممتلئ حاليًا، وأنت على قائمة الانتظار. سنكتب لك إذا توفر مكان.',
    when: 'متى',
    howJoin: 'يُفتح رابط الدخول في صفحة تسجيلك قبل البدء بـ15 دقيقة.',
    myPage: 'صفحة تسجيلي',
    calendar: 'إضافة إلى Google Calendar',
    icsNote: 'مرفق أيضًا ملف تقويم لأي تطبيق آخر.',
    footer: 'وصلتك هذه الرسالة لأنك سجلت عبر 1lev1. لإلغاء التسجيل — من صفحة تسجيلك.'
  },
  ru: {
    subject: 'Вы зарегистрированы: {{title}}',
    subjectWait: 'Вы в листе ожидания: {{title}}',
    hello: 'Здравствуйте, {{name}}!',
    registered: 'Ваше место сохранено.',
    waitlist: 'На эту дату мест сейчас нет, и вы в листе ожидания. Мы напишем, если место освободится.',
    when: 'Когда',
    howJoin: 'Ссылка для входа откроется на странице вашей регистрации за 15 минут до начала.',
    myPage: 'Моя регистрация',
    calendar: 'Добавить в Google Calendar',
    icsNote: 'Файл календаря для любого другого приложения — во вложении.',
    footer: 'Вы получили это письмо, потому что зарегистрировались через 1lev1. Отменить регистрацию можно на её странице.'
  },
  es: {
    subject: 'Te registraste: {{title}}',
    subjectWait: 'Estás en la lista de espera: {{title}}',
    hello: 'Hola, {{name}}:',
    registered: 'Tu lugar está reservado.',
    waitlist: 'Esta fecha está completa por ahora y quedaste en la lista de espera. Te escribiremos si se libera un lugar.',
    when: 'Cuándo',
    howJoin: 'El enlace para entrar se abre en tu página de registro 15 minutos antes del inicio.',
    myPage: 'Mi registro',
    calendar: 'Añadir a Google Calendar',
    icsNote: 'También adjuntamos un archivo de calendario para cualquier otra aplicación.',
    footer: 'Recibiste este correo porque te registraste a través de 1lev1. Para cancelar, usa tu página de registro.'
  }
};

export function mailLang(lang: string | null | undefined): Lang {
  return LANGS.includes(lang as Lang) ? (lang as Lang) : 'he';
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fill = (s: string, vars: Record<string, string>) => s.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');

/** "יום שלישי, 10 בנובמבר 2026, 19:00 (שעון Asia/Jerusalem)" in the recipient's language. */
export function formatWhen(session: Pick<SessionView, 'startsAt' | 'timezone' | 'durationMin'>, lang: Lang): string {
  const tz = session.timezone || 'Asia/Jerusalem';
  try {
    const fmt = new Intl.DateTimeFormat(lang, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: tz,
      timeZoneName: 'short'
    });
    return fmt.format(new Date(session.startsAt));
  } catch {
    return new Date(session.startsAt).toUTCString();
  }
}

export interface ConfirmationInput {
  event: Pick<EventView, 'title' | 'tagline'>;
  session: Pick<SessionView, 'startsAt' | 'timezone' | 'durationMin'>;
  name: string;
  lang: string | null;
  pageUrl: string;
  waitlist: boolean;
  registrationId: string;
}

export function buildConfirmation(c: ConfirmationInput) {
  const lang = mailLang(c.lang);
  const t = COPY[lang];
  const dir = RTL.has(lang) ? 'rtl' : 'ltr';
  const when = formatWhen(c.session, lang);
  const subject = fill(c.waitlist ? t.subjectWait : t.subject, { title: c.event.title });
  const cal = googleCalendarUrl({
    title: c.event.title,
    description: c.event.tagline,
    startsAt: c.session.startsAt,
    durationMin: c.session.durationMin,
    url: c.pageUrl
  });
  const html = `<!doctype html><html lang="${lang}" dir="${dir}"><body style="margin:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;color:#1f2430">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="background:#ffffff;border-radius:12px;padding:24px;text-align:${dir === 'rtl' ? 'right' : 'left'}">
<p style="margin:0 0 12px">${esc(fill(t.hello, { name: c.name }))}</p>
<h1 style="margin:0 0 8px;font-size:22px">${esc(c.event.title)}</h1>
${c.event.tagline ? `<p style="margin:0 0 16px;color:#555">${esc(c.event.tagline)}</p>` : ''}
<p style="margin:0 0 16px;font-weight:bold">${esc(c.waitlist ? t.waitlist : t.registered)}</p>
<p style="margin:0 0 4px;color:#555">${esc(t.when)}</p>
<p style="margin:0 0 16px;font-size:17px">${esc(when)}</p>
${c.waitlist ? '' : `<p style="margin:0 0 20px">${esc(t.howJoin)}</p>`}
<p style="margin:0 0 12px"><a href="${esc(c.pageUrl)}" style="display:inline-block;background:#2f5d50;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">${esc(t.myPage)}</a></p>
${c.waitlist ? '' : `<p style="margin:0 0 4px"><a href="${esc(cal)}" style="color:#2f5d50">${esc(t.calendar)}</a></p><p style="margin:0;color:#777;font-size:13px">${esc(t.icsNote)}</p>`}
</div>
<p style="color:#777;font-size:12px;margin:16px 4px 0">${esc(t.footer)}</p>
</div></body></html>`;
  const text = [
    fill(t.hello, { name: c.name }),
    '',
    c.event.title,
    c.waitlist ? t.waitlist : t.registered,
    `${t.when}: ${when}`,
    c.waitlist ? '' : t.howJoin,
    `${t.myPage}: ${c.pageUrl}`,
    '',
    t.footer
  ]
    .filter((l) => l !== null)
    .join('\n');
  const ics = c.waitlist
    ? null
    : buildIcs({
        uid: `event-registration-${c.registrationId}@1lev1.com`,
        title: c.event.title,
        description: c.event.tagline,
        startsAt: c.session.startsAt,
        durationMin: c.session.durationMin,
        url: c.pageUrl
      });
  return { subject, html, text, ics };
}

export async function sendConfirmation(to: string, c: ConfirmationInput) {
  const m = buildConfirmation(c);
  return sendMailSafe({
    to,
    subject: m.subject,
    html: m.html,
    text: m.text,
    ...(m.ics ? { attachments: [{ filename: 'event.ics', content: m.ics, contentType: 'text/calendar; charset=utf-8; method=PUBLISH' }] } : {})
  });
}

// ─── the shared layout for every later mail (W3: reminders, changes, after) ──

export interface MailButton {
  href: string;
  label: string;
  /** The filled button; others are plain links under it. */
  primary?: boolean;
}

export interface RenderInput {
  lang: string | null;
  name: string;
  title: string;
  tagline?: string | null;
  lead: string;
  whenLabel?: string;
  when?: string | null;
  note?: string | null;
  buttons: MailButton[];
}

/** The same card the confirmation uses, with any lead line and buttons. */
export function renderMail(r: RenderInput): { html: string; text: string } {
  const lang = mailLang(r.lang);
  const t = COPY[lang];
  const dir = RTL.has(lang) ? 'rtl' : 'ltr';
  const buttons = r.buttons.filter((b) => b.href);
  const html = `<!doctype html><html lang="${lang}" dir="${dir}"><body style="margin:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;color:#1f2430">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="background:#ffffff;border-radius:12px;padding:24px;text-align:${dir === 'rtl' ? 'right' : 'left'}">
<p style="margin:0 0 12px">${esc(fill(t.hello, { name: r.name }))}</p>
<h1 style="margin:0 0 8px;font-size:22px">${esc(r.title)}</h1>
${r.tagline ? `<p style="margin:0 0 16px;color:#555">${esc(r.tagline)}</p>` : ''}
<p style="margin:0 0 16px;font-weight:bold">${esc(r.lead)}</p>
${r.when ? `<p style="margin:0 0 4px;color:#555">${esc(r.whenLabel ?? t.when)}</p><p style="margin:0 0 16px;font-size:17px">${esc(r.when)}</p>` : ''}
${r.note ? `<p style="margin:0 0 20px">${esc(r.note)}</p>` : ''}
${buttons
  .map((b) =>
    b.primary
      ? `<p style="margin:0 0 12px"><a href="${esc(b.href)}" style="display:inline-block;background:#2f5d50;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">${esc(b.label)}</a></p>`
      : `<p style="margin:0 0 8px"><a href="${esc(b.href)}" style="color:#2f5d50">${esc(b.label)}</a></p>`
  )
  .join('\n')}
</div>
<p style="color:#777;font-size:12px;margin:16px 4px 0">${esc(t.footer)}</p>
</div></body></html>`;
  const text = [
    fill(t.hello, { name: r.name }),
    '',
    r.title,
    r.lead,
    r.when ? `${r.whenLabel ?? t.when}: ${r.when}` : '',
    r.note ?? '',
    ...buttons.map((b) => `${b.label}: ${b.href}`),
    '',
    t.footer
  ]
    .filter((l, i, all) => l !== '' || (all[i - 1] ?? '') !== '')
    .join('\n');
  return { html, text };
}
