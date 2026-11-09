/**
 * Every mail after the confirmation (docs/inprogress/PLAN_EVENTS_WEBINARS.md
 * §5.2, W3): tomorrow, in an hour, we've started, thanks / you missed it, the
 * date moved, the date was cancelled, a seat opened, a new date opened.
 *
 * In the recipient's language (CLAUDE.md: the one place a `{ he, en, … }`
 * table is right). Links go to the registrant's own page — or, for "we've
 * started", straight through its join step, which records that they came.
 */

import { buildIcs } from '$lib/events/ics';
import type { MailKind } from '$lib/events/reminders';
import { buildConfirmation, formatWhen, mailLang, renderMail, type MailButton } from './mail';

type Lang = 'he' | 'en' | 'ar' | 'ru' | 'es';
type Copy = { subject: string; lead: string; note?: string };

const COPY: Record<Lang, Record<Exclude<MailKind, 'confirm'>, Copy> & { buttons: Record<string, string> }> = {
  he: {
    d1: { subject: 'מחר: {{title}}', lead: 'רק מזכירים — נתראה מחר.', note: 'הכניסה נפתחת בדף ההרשמה שלך 15 דקות לפני ההתחלה.' },
    h1: { subject: 'בעוד שעה: {{title}}', lead: 'עוד שעה מתחילים.', note: 'הכניסה נפתחת בדף ההרשמה שלך 15 דקות לפני ההתחלה.' },
    live: { subject: 'התחלנו: {{title}}', lead: 'האירוע התחיל עכשיו — עוד אפשר להצטרף.' },
    thanks: { subject: 'תודה שהגעת: {{title}}', lead: 'תודה שהיית איתנו!' },
    missed: { subject: 'פספסת? {{title}}', lead: 'לא ראינו אותך הפעם — זה קורה.', note: 'אפשר להירשם למועד הבא בדף האירוע.' },
    moved: { subject: 'המועד השתנה: {{title}}', lead: 'המועד שנרשמת אליו השתנה.', note: 'קובץ יומן מעודכן מצורף. אם המועד החדש לא מתאים — אפשר לבחור מועד אחר בדף האירוע.' },
    cancelled: { subject: 'המועד בוטל: {{title}}', lead: 'המועד שנרשמת אליו בוטל. סליחה על השינוי.', note: 'אפשר לבחור מועד אחר בדף האירוע.' },
    promoted: { subject: 'התפנה מקום: {{title}}', lead: 'התפנה מקום, והוא שלך!', note: 'קובץ יומן מצורף. הכניסה נפתחת בדף ההרשמה שלך 15 דקות לפני ההתחלה.' },
    newDate: { subject: 'מועד חדש: {{title}}', lead: 'נפתח מועד חדש לאירוע שביקשת לשמוע עליו.' },
    buttons: { myPage: 'דף ההרשמה שלי', join: 'להצטרף עכשיו', recording: 'צפייה בהקלטה', next: 'הצעד הבא', eventPage: 'לדף האירוע', pick: 'לבחירת מועד', whenNew: 'המועד החדש' }
  },
  en: {
    d1: { subject: 'Tomorrow: {{title}}', lead: 'Just a reminder — see you tomorrow.', note: 'The way in opens on your registration page 15 minutes before the start.' },
    h1: { subject: 'In an hour: {{title}}', lead: 'We start in an hour.', note: 'The way in opens on your registration page 15 minutes before the start.' },
    live: { subject: "We've started: {{title}}", lead: 'The event has just started — you can still join.' },
    thanks: { subject: 'Thanks for coming: {{title}}', lead: 'Thank you for being with us!' },
    missed: { subject: 'Missed it? {{title}}', lead: "We didn't see you this time — it happens.", note: 'You can register for the next date on the event page.' },
    moved: { subject: 'The date changed: {{title}}', lead: 'The date you registered for has changed.', note: "An updated calendar file is attached. If the new time doesn't work, pick another date on the event page." },
    cancelled: { subject: 'The date was cancelled: {{title}}', lead: 'The date you registered for was cancelled. Sorry for the change.', note: 'You can pick another date on the event page.' },
    promoted: { subject: 'A seat opened: {{title}}', lead: "A seat opened, and it's yours!", note: 'A calendar file is attached. The way in opens on your registration page 15 minutes before the start.' },
    newDate: { subject: 'A new date: {{title}}', lead: 'A new date opened for the event you asked to hear about.' },
    buttons: { myPage: 'My registration', join: 'Join now', recording: 'Watch the recording', next: 'The next step', eventPage: 'Event page', pick: 'Pick a date', whenNew: 'The new time' }
  },
  ar: {
    d1: { subject: 'غدًا: {{title}}', lead: 'مجرد تذكير — نراك غدًا.', note: 'يُفتح الدخول في صفحة تسجيلك قبل البدء بـ15 دقيقة.' },
    h1: { subject: 'بعد ساعة: {{title}}', lead: 'نبدأ بعد ساعة.', note: 'يُفتح الدخول في صفحة تسجيلك قبل البدء بـ15 دقيقة.' },
    live: { subject: 'بدأنا: {{title}}', lead: 'بدأت الفعالية الآن — ما زال بإمكانك الانضمام.' },
    thanks: { subject: 'شكرًا لحضورك: {{title}}', lead: 'شكرًا لوجودك معنا!' },
    missed: { subject: 'فاتتك؟ {{title}}', lead: 'لم نرك هذه المرة — يحدث ذلك.', note: 'يمكنك التسجيل للموعد القادم في صفحة الفعالية.' },
    moved: { subject: 'تغيّر الموعد: {{title}}', lead: 'تغيّر الموعد الذي سجّلت له.', note: 'مرفق ملف تقويم محدّث. إذا لم يناسبك الموعد الجديد — اختر موعدًا آخر في صفحة الفعالية.' },
    cancelled: { subject: 'أُلغي الموعد: {{title}}', lead: 'أُلغي الموعد الذي سجّلت له. نعتذر عن التغيير.', note: 'يمكنك اختيار موعد آخر في صفحة الفعالية.' },
    promoted: { subject: 'توفّر مكان: {{title}}', lead: 'توفّر مكان، وهو لك!', note: 'مرفق ملف تقويم. يُفتح الدخول في صفحة تسجيلك قبل البدء بـ15 دقيقة.' },
    newDate: { subject: 'موعد جديد: {{title}}', lead: 'فُتح موعد جديد للفعالية التي طلبت أن نخبرك بها.' },
    buttons: { myPage: 'صفحة تسجيلي', join: 'انضم الآن', recording: 'مشاهدة التسجيل', next: 'الخطوة التالية', eventPage: 'صفحة الفعالية', pick: 'اختيار موعد', whenNew: 'الموعد الجديد' }
  },
  ru: {
    d1: { subject: 'Завтра: {{title}}', lead: 'Просто напоминаем — увидимся завтра.', note: 'Вход откроется на странице вашей регистрации за 15 минут до начала.' },
    h1: { subject: 'Через час: {{title}}', lead: 'Начинаем через час.', note: 'Вход откроется на странице вашей регистрации за 15 минут до начала.' },
    live: { subject: 'Мы начали: {{title}}', lead: 'Событие только что началось — ещё можно присоединиться.' },
    thanks: { subject: 'Спасибо, что пришли: {{title}}', lead: 'Спасибо, что были с нами!' },
    missed: { subject: 'Не получилось? {{title}}', lead: 'В этот раз мы вас не увидели — так бывает.', note: 'На следующую дату можно записаться на странице события.' },
    moved: { subject: 'Дата изменилась: {{title}}', lead: 'Дата, на которую вы записались, изменилась.', note: 'Обновлённый файл календаря во вложении. Если новое время не подходит — выберите другую дату на странице события.' },
    cancelled: { subject: 'Дата отменена: {{title}}', lead: 'Дата, на которую вы записались, отменена. Простите за изменение.', note: 'Другую дату можно выбрать на странице события.' },
    promoted: { subject: 'Освободилось место: {{title}}', lead: 'Освободилось место, и оно ваше!', note: 'Файл календаря во вложении. Вход откроется на странице вашей регистрации за 15 минут до начала.' },
    newDate: { subject: 'Новая дата: {{title}}', lead: 'Открылась новая дата события, о котором вы просили сообщить.' },
    buttons: { myPage: 'Моя регистрация', join: 'Присоединиться', recording: 'Смотреть запись', next: 'Следующий шаг', eventPage: 'Страница события', pick: 'Выбрать дату', whenNew: 'Новое время' }
  },
  es: {
    d1: { subject: 'Mañana: {{title}}', lead: 'Solo un recordatorio: nos vemos mañana.', note: 'La entrada se abre en tu página de registro 15 minutos antes del inicio.' },
    h1: { subject: 'En una hora: {{title}}', lead: 'Empezamos en una hora.', note: 'La entrada se abre en tu página de registro 15 minutos antes del inicio.' },
    live: { subject: 'Ya empezamos: {{title}}', lead: 'El evento acaba de empezar: todavía puedes unirte.' },
    thanks: { subject: 'Gracias por venir: {{title}}', lead: '¡Gracias por acompañarnos!' },
    missed: { subject: '¿Te lo perdiste? {{title}}', lead: 'Esta vez no te vimos; pasa.', note: 'Puedes registrarte para la próxima fecha en la página del evento.' },
    moved: { subject: 'Cambió la fecha: {{title}}', lead: 'La fecha en la que te registraste cambió.', note: 'Adjuntamos un archivo de calendario actualizado. Si la nueva hora no te sirve, elige otra fecha en la página del evento.' },
    cancelled: { subject: 'Se canceló la fecha: {{title}}', lead: 'La fecha en la que te registraste se canceló. Perdona el cambio.', note: 'Puedes elegir otra fecha en la página del evento.' },
    promoted: { subject: 'Se liberó un lugar: {{title}}', lead: '¡Se liberó un lugar y es tuyo!', note: 'Adjuntamos un archivo de calendario. La entrada se abre en tu página de registro 15 minutos antes del inicio.' },
    newDate: { subject: 'Nueva fecha: {{title}}', lead: 'Se abrió una nueva fecha para el evento del que pediste noticias.' },
    buttons: { myPage: 'Mi registro', join: 'Unirme ahora', recording: 'Ver la grabación', next: 'El siguiente paso', eventPage: 'Página del evento', pick: 'Elegir fecha', whenNew: 'La nueva hora' }
  }
};

const fill = (s: string, vars: Record<string, string>) => s.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');

export interface ReminderInput {
  kind: MailKind;
  registrationId: string;
  name: string;
  lang: string | null;
  event: { title: string; tagline: string | null; afterUrl: string | null };
  session: { startsAt: string; durationMin: number; timezone: string; recordingUrl: string | null } | null;
  /** Absolute URLs. */
  pageUrl: string;
  eventUrl: string | null;
  origin: string;
  /** The calendar SEQUENCE after this mail (moves and cancellations bump it). */
  seq: number;
  /** For a resent confirmation: it confirms a place on the waiting list. */
  waitlist?: boolean;
}

export interface BuiltMail {
  subject: string;
  html: string;
  text: string;
  ics: string | null;
  icsMethod: 'PUBLISH' | 'CANCEL' | null;
}

const abs = (origin: string, href: string | null) =>
  !href ? '' : /^https?:\/\//.test(href) ? href : href.startsWith('/') ? `${origin}${href}` : '';

export function buildReminder(r: ReminderInput): BuiltMail {
  if (r.kind === 'confirm') {
    const c = buildConfirmation({
      event: r.event,
      session: r.session!,
      name: r.name,
      lang: r.lang,
      pageUrl: r.pageUrl,
      waitlist: !!r.waitlist,
      registrationId: r.registrationId
    });
    return { ...c, icsMethod: c.ics ? 'PUBLISH' : null };
  }
  const lang = mailLang(r.lang) as Lang;
  const copy = COPY[lang][r.kind];
  const b = COPY[lang].buttons;
  const when = r.session ? formatWhen(r.session, lang) : null;
  const buttons: MailButton[] = [];
  switch (r.kind) {
    case 'live':
      buttons.push({ href: `${r.pageUrl}/join`, label: b.join, primary: true });
      break;
    case 'thanks':
      if (r.event.afterUrl) buttons.push({ href: abs(r.origin, r.event.afterUrl), label: b.next, primary: true });
      if (r.session?.recordingUrl) buttons.push({ href: r.session.recordingUrl, label: b.recording, primary: !r.event.afterUrl });
      break;
    case 'missed':
      if (r.session?.recordingUrl) buttons.push({ href: r.session.recordingUrl, label: b.recording, primary: true });
      if (r.eventUrl) buttons.push({ href: r.eventUrl, label: b.eventPage, primary: !r.session?.recordingUrl });
      break;
    case 'cancelled':
      if (r.eventUrl) buttons.push({ href: r.eventUrl, label: b.pick, primary: true });
      break;
    case 'newDate':
      if (r.eventUrl) buttons.push({ href: r.eventUrl, label: b.pick, primary: true });
      break;
    default:
      buttons.push({ href: r.pageUrl, label: b.myPage, primary: true });
      if (r.kind === 'moved' && r.eventUrl) buttons.push({ href: r.eventUrl, label: b.eventPage });
  }

  const showWhen = ['d1', 'h1', 'moved', 'promoted', 'newDate', 'live'].includes(r.kind);
  const { html, text } = renderMail({
    lang,
    name: r.name,
    title: r.event.title,
    tagline: r.kind === 'newDate' || r.kind === 'promoted' ? r.event.tagline : null,
    lead: copy.lead,
    when: showWhen ? when : null,
    whenLabel: r.kind === 'moved' ? b.whenNew : undefined,
    note: copy.note ?? null,
    buttons
  });

  // A calendar entry is replaced (moved, promoted) or removed (cancelled) under the same UID.
  let ics: string | null = null;
  let icsMethod: BuiltMail['icsMethod'] = null;
  if (r.session && (r.kind === 'moved' || r.kind === 'promoted' || r.kind === 'cancelled')) {
    ics = buildIcs({
      uid: `event-registration-${r.registrationId}@1lev1.com`,
      title: r.event.title,
      description: r.event.tagline,
      startsAt: r.session.startsAt,
      durationMin: r.session.durationMin,
      url: r.pageUrl,
      sequence: r.seq,
      cancel: r.kind === 'cancelled'
    });
    icsMethod = r.kind === 'cancelled' ? 'CANCEL' : 'PUBLISH';
  }

  return { subject: fill(copy.subject, { title: r.event.title }), html, text, ics, icsMethod };
}
