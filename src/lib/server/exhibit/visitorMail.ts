/**
 * The mail a fair visitor gets when they leave an address
 * (docs/inprogress/PLAN_EXHIBITION_MODE.md §7, added 2026-11-26).
 *
 * One mail, once: the idea they built at the stand and the link to it — the
 * same link the QR carries, so the phone page opens it with "start" and "keep
 * it for me". It is not a mailing list and promises nothing else; the team's
 * follow-up still runs through the lead.
 *
 * The token rides in the link's fragment as on the QR. In a mail it does pass
 * through the provider — that is the price of "send it to me", and the token
 * opens only this one pending draft for its 30 days.
 *
 * In the recipient's language (CLAUDE.md: the one place a `{ he, en, … }` table
 * is right). On unless `EXHIBIT_MAILS_ENABLED=false`.
 */
type Lang = 'he' | 'en' | 'ar' | 'ru' | 'es';
interface Copy {
  subject: string;
  hello: string;
  helloNoName: string;
  built: string;
  waits: string;
  button: string;
  keeps: string;
  ignore: string;
}

const COPY: Record<Lang, Copy> = {
  he: {
    subject: 'הרקמה שבניתם ביריד: {{idea}}',
    hello: 'שלום {{name}},',
    helloNoName: 'שלום,',
    built: 'ביריד בניתם רקמה: {{idea}}.',
    waits: 'היא מחכה לכם ב-1💗1. מהקישור אפשר להמשיך ממנה לרקמה אמיתית, או לבקש שנחזור אליכם:',
    button: 'לרקמה שלי',
    keeps: 'הקישור שמור 30 יום, בלי התחייבות.',
    ignore: 'קיבלתם את המייל הזה כי השארתם את הכתובת בעמדה. לא נשלח מיילים נוספים בלי שתבקשו.'
  },
  en: {
    subject: 'The rikma you built at the fair: {{idea}}',
    hello: 'Hello {{name}},',
    helloNoName: 'Hello,',
    built: 'At the fair you built a rikma: {{idea}}.',
    waits: 'It is waiting for you on 1💗1. From the link you can carry on and make it a real rikma, or ask us to get back to you:',
    button: 'Open my rikma',
    keeps: 'The link is kept for 30 days, with no commitment.',
    ignore: "You got this mail because you left your address at the stand. We won't send more unless you ask."
  },
  ar: {
    subject: 'الريكما التي بنيتها في المعرض: {{idea}}',
    hello: 'مرحبًا {{name}}،',
    helloNoName: 'مرحبًا،',
    built: 'في المعرض بنيت ريكما: {{idea}}.',
    waits: 'إنها بانتظارك على 1💗1. من الرابط يمكنك المتابعة وتحويلها إلى ريكما حقيقية، أو أن تطلب منا التواصل معك:',
    button: 'إلى الريكما الخاصة بي',
    keeps: 'الرابط محفوظ لمدة 30 يومًا، دون أي التزام.',
    ignore: 'وصلتك هذه الرسالة لأنك تركت عنوانك في الجناح. لن نرسل رسائل أخرى إلا إذا طلبت ذلك.'
  },
  ru: {
    subject: 'Рикма, которую вы собрали на выставке: {{idea}}',
    hello: 'Здравствуйте, {{name}}!',
    helloNoName: 'Здравствуйте!',
    built: 'На выставке вы собрали рикму: {{idea}}.',
    waits: 'Она ждёт вас на 1💗1. По ссылке можно продолжить и превратить её в настоящую рикму или попросить нас связаться с вами:',
    button: 'Открыть мою рикму',
    keeps: 'Ссылка хранится 30 дней и ни к чему не обязывает.',
    ignore: 'Вы получили это письмо, потому что оставили адрес на стенде. Больше писем не будет, если вы сами не попросите.'
  },
  es: {
    subject: 'La rikma que creaste en la feria: {{idea}}',
    hello: 'Hola, {{name}}:',
    helloNoName: 'Hola:',
    built: 'En la feria creaste una rikma: {{idea}}.',
    waits: 'Te está esperando en 1💗1. Desde el enlace puedes seguir y convertirla en una rikma real, o pedirnos que te contactemos:',
    button: 'Abrir mi rikma',
    keeps: 'El enlace se guarda 30 días, sin compromiso.',
    ignore: 'Recibiste este correo porque dejaste tu dirección en el stand. No enviaremos más correos a menos que lo pidas.'
  }
};

const RTL = new Set<Lang>(['he', 'ar']);

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** A subject is a header: no line breaks, and not endless. */
const oneLine = (s: string, max: number) => s.replace(/[\r\n]+/g, ' ').trim().slice(0, max);

export function buildExhibitMail(input: {
  name: string | null;
  lang: string | null;
  idea: string;
  url: string;
}): { subject: string; html: string; text: string } {
  const lang: Lang = input.lang && input.lang in COPY ? (input.lang as Lang) : 'he';
  const c = COPY[lang];
  const idea = oneLine(input.idea, 120);
  const name = input.name ? oneLine(input.name, 80) : '';
  const hello = name ? c.hello.replace('{{name}}', name) : c.helloNoName;
  const built = c.built.replace('{{idea}}', idea);
  const dir = RTL.has(lang) ? 'rtl' : 'ltr';
  const align = dir === 'rtl' ? 'right' : 'left';

  const html = `<!doctype html><html lang="${lang}" dir="${dir}"><body style="margin:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;color:#1f2430">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="background:#ffffff;border-radius:12px;padding:24px;text-align:${align}">
<p style="margin:0 0 12px">${esc(hello)}</p>
<p style="margin:0 0 12px;font-weight:bold">${esc(built)}</p>
<p style="margin:0 0 20px">${esc(c.waits)}</p>
<p style="margin:0 0 20px"><a href="${esc(input.url)}" style="display:inline-block;background:#2f5d50;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">${esc(c.button)}</a></p>
<p style="margin:0">${esc(c.keeps)}</p>
</div>
<p style="font-size:12px;color:#555;margin:16px 4px 0;text-align:${align}">${esc(c.ignore)}</p>
</div></body></html>`;

  const text = [hello, '', built, c.waits, input.url, '', c.keeps, '', c.ignore].join('\n');
  return { subject: oneLine(c.subject.replace('{{idea}}', idea), 160), html, text };
}

/**
 * One mail per draft and address, and a few per address a day: the address is
 * typed by a stranger at a public stand, and the platform mails from one shared
 * account the provider blocks on unusual volume. In memory, like the other
 * mail caps — one process serves the API.
 */
export class ExhibitMailThrottle {
  private sent = new Set<string>();
  private perAddress = new Map<string, number[]>();

  constructor(private max = 3, private windowMs = 24 * 60 * 60 * 1000) {}

  /** Takes the slot only when it says yes, so call it right before sending. */
  take(draftId: string, address: string, now = Date.now()): boolean {
    const a = address.toLowerCase();
    const key = `${draftId}:${a}`;
    if (this.sent.has(key)) return false;
    const fresh = (this.perAddress.get(a) ?? []).filter((t) => now - t < this.windowMs);
    if (fresh.length >= this.max) return false;
    if (this.sent.size > 5000) this.sent.clear();
    if (this.perAddress.size > 5000) this.perAddress.clear();
    this.sent.add(key);
    this.perAddress.set(a, [...fresh, now]);
    return true;
  }
}
