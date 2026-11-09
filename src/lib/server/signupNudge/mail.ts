/**
 * "Thank you for signing": said once, without assuming the person wants more.
 *
 * In the recipient's language (CLAUDE.md: the one place a `{ he, en, … }` table
 * is right).
 */
type Lang = 'he' | 'en' | 'ar' | 'ru' | 'es';
interface Copy {
  subject: string;
  hello: string;
  thanks: string;
  standsAlone: string;
  offer: string;
  button: string;
  ignore: string;
  stop: string;
}

const COPY: Record<Lang, Copy> = {
  he: {
    subject: 'תודה שהסכמת על האמנה',
    hello: 'שלום {{name}},',
    thanks: 'תודה שהסכמת על האמנה של 1💗1.',
    standsAlone: 'ההסכמה שלך עומדת בפני עצמה, ואין צורך לעשות שום דבר נוסף.',
    offer: 'אם רצית גם להצטרף לאתר ולא הספקת, הקישור הזה ימשיך בדיוק מהמקום שעצרת:',
    button: 'להמשך ההרשמה',
    ignore: 'אם לא, אפשר פשוט להתעלם. לא נשלח תזכורת נוספת.',
    stop: 'להסרה מרשימת הדיוור'
  },
  en: {
    subject: 'Thank you for signing the agreement',
    hello: 'Hello {{name}},',
    thanks: 'Thank you for signing the 1💗1 agreement.',
    standsAlone: 'Your signature stands on its own, and there is nothing else you need to do.',
    offer: "If you also wanted to join the site and didn't get to it, this link picks up exactly where you stopped:",
    button: 'Continue signing up',
    ignore: "If not, you can simply ignore this. We won't send another reminder.",
    stop: 'Unsubscribe'
  },
  ar: {
    subject: 'شكرًا لموافقتك على الاتفاقية',
    hello: 'مرحبًا {{name}}،',
    thanks: 'شكرًا لموافقتك على اتفاقية 1💗1.',
    standsAlone: 'موافقتك قائمة بذاتها، ولا حاجة إلى فعل أي شيء آخر.',
    offer: 'إذا أردت أيضًا الانضمام إلى الموقع ولم يتسنَّ لك ذلك، فهذا الرابط يكمل من حيث توقفت تمامًا:',
    button: 'متابعة التسجيل',
    ignore: 'وإن لم ترغب، يمكنك ببساطة تجاهل هذه الرسالة. لن نرسل تذكيرًا آخر.',
    stop: 'إلغاء الاشتراك'
  },
  ru: {
    subject: 'Спасибо, что подписали соглашение',
    hello: 'Здравствуйте, {{name}}!',
    thanks: 'Спасибо, что подписали соглашение 1💗1.',
    standsAlone: 'Ваша подпись имеет силу сама по себе, и больше ничего делать не нужно.',
    offer: 'Если вы хотели также присоединиться к сайту, но не успели, эта ссылка продолжит ровно с того места, где вы остановились:',
    button: 'Продолжить регистрацию',
    ignore: 'Если нет, просто проигнорируйте это письмо. Больше напоминаний не будет.',
    stop: 'Отписаться'
  },
  es: {
    subject: 'Gracias por firmar el acuerdo',
    hello: 'Hola, {{name}}:',
    thanks: 'Gracias por firmar el acuerdo de 1💗1.',
    standsAlone: 'Tu firma tiene valor por sí misma y no necesitas hacer nada más.',
    offer: 'Si también querías unirte al sitio y no llegaste a hacerlo, este enlace continúa exactamente donde te quedaste:',
    button: 'Continuar el registro',
    ignore: 'Si no, simplemente ignora este mensaje. No enviaremos otro recordatorio.',
    stop: 'Darse de baja'
  }
};

const RTL = new Set<Lang>(['he', 'ar']);

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buildNudgeMail(input: {
  name: string;
  lang: string | null;
  continueUrl: string;
  stopUrl: string;
}): { subject: string; html: string; text: string } {
  const lang: Lang = input.lang && input.lang in COPY ? (input.lang as Lang) : 'he';
  const t = COPY[lang];
  const hello = t.hello.replace('{{name}}', input.name);
  const dir = RTL.has(lang) ? 'rtl' : 'ltr';
  const align = dir === 'rtl' ? 'right' : 'left';

  const html = `<!doctype html><html lang="${lang}" dir="${dir}"><body style="margin:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;color:#1f2430">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="background:#ffffff;border-radius:12px;padding:24px;text-align:${align}">
<p style="margin:0 0 12px">${esc(hello)}</p>
<p style="margin:0 0 12px;font-weight:bold">${esc(t.thanks)}</p>
<p style="margin:0 0 20px">${esc(t.standsAlone)}</p>
<p style="margin:0 0 12px">${esc(t.offer)}</p>
<p style="margin:0 0 20px"><a href="${esc(input.continueUrl)}" style="display:inline-block;background:#2f5d50;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">${esc(t.button)}</a></p>
<p style="margin:0">${esc(t.ignore)}</p>
</div>
<p style="font-size:12px;margin:16px 4px 0;text-align:${align}"><a href="${esc(input.stopUrl)}" style="color:#555">${esc(t.stop)}</a></p>
</div></body></html>`;

  const text = [
    hello,
    '',
    t.thanks,
    t.standsAlone,
    '',
    t.offer,
    input.continueUrl,
    '',
    t.ignore,
    '',
    `${t.stop}: ${input.stopUrl}`
  ].join('\n');

  return { subject: t.subject, html, text };
}
