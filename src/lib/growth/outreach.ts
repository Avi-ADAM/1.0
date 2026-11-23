/**
 * Invitation messages (docs/inprogress/PLAN_GROWTH_AGENT.md §6).
 *
 * These templates are the floor: they are what the operator gets when no
 * model is configured or the model fails, and they are the shape the model's
 * variants are asked to follow. They are written in the RECIPIENT's language,
 * which is why they live here and not in `$t()` — the same exception as the
 * action configs' notification templates.
 *
 * Nothing in this module sends anything. Opening WhatsApp or a mail draft
 * hands a text to another application; only the operator, afterwards, can
 * say that it was sent (§6.3).
 */

import type { GrowthLang, OutreachKind, OutreachVariant, Prospect } from './types';

export const LINK_TOKEN = '{{link}}';

interface Facts {
  name: string;
  what: string;
  why: string;
  collab: string;
}

function factsOf(p: Prospect, lang: GrowthLang): Facts {
  const services = (p.profile?.services.value.length ? p.profile.services.value : p.services).slice(0, 3);
  const what = services.length ? services.join(', ') : (p.category ?? '');
  const comp = (p.research?.complementary ?? []).slice(0, 3).join(', ');
  const why = p.category ? p.category : what;
  const collab = comp
    ? { he: ` ונראה לנו שיש מקום לשיתופי פעולה עם ${comp}`, en: `, and we see room to team up with ${comp}`, ar: `، ونرى مجالاً للتعاون مع ${comp}` }[lang]
    : '';
  return { name: p.name, what, why, collab };
}

const T: Record<GrowthLang, Record<OutreachKind, (f: Facts) => { subject?: string; body: string }>> = {
  he: {
    friendly: (f) => ({
      body:
        `היי! אנחנו בונים ב-1💗1 רשת של נותני שירות עצמאיים.\n\n` +
        `נתקלנו ב-${f.name}${f.what ? ` (${f.what})` : ''} וחשבנו שהשירותים שלכם יכולים להתאים מאוד${f.collab}.\n\n` +
        `ב-1💗1 לקוחות מתארים במילים שלהם מה הם צריכים, ואנחנו מחברים אותם לנותני שירות מתאימים שמגישים הצעות.\n\n` +
        `הכנו בשבילכם טיוטה של פרופיל עסקי. אפשר לעבור עליה, לתקן כל פרט ולהחליט אם להצטרף — או לא:\n${LINK_TOKEN}\n\n` +
        `מעניין אתכם להציץ?`
    }),
    professional: (f) => ({
      body:
        `שלום,\n\nפנינו אליכם כי ${f.name} עוסק ב${f.why || 'תחום'} שלקוחות מבקשים אצלנו${f.collab}.\n\n` +
        `1💗1 היא פלטפורמה שבה לקוחות מתארים צורך בשפה חופשית, ונותני שירות רלוונטיים מגישים הצעות. ההצטרפות היא בחירה שלכם, ושום דבר לא מתפרסם בלי אישורכם.\n\n` +
        `הכנו טיוטת פרופיל מתוך המידע הציבורי עליכם — לעיון, תיקון ואישור:\n${LINK_TOKEN}\n\nבברכה,\nצוות 1💗1`
    }),
    whatsapp: (f) => ({
      body: `היי! ראינו את ${f.name} וחשבנו שתתאימו לרשת נותני השירות של 1💗1 🙂 הכנו לכם טיוטת פרופיל — אפשר לתקן ולהחליט אם להצטרף: ${LINK_TOKEN}`
    }),
    email: (f) => ({
      subject: `הכנו טיוטת פרופיל ל-${f.name} ב-1💗1`,
      body:
        `שלום,\n\nבחרנו לפנות ל-${f.name} כי ${f.what ? `ה${f.what} שלכם` : 'השירותים שלכם'} מתאימים לבקשות שלקוחות שולחים אלינו${f.collab}.\n\n` +
        `ב-1💗1 לקוח כותב מה הוא צריך, והמערכת מחברת אותו לנותני שירות שמגישים הצעות. נותני שירות יכולים גם לחבור זה לזה ולהציע יחד.\n\n` +
        `הכנו טיוטת פרופיל מתוך מידע ציבורי בלבד. בקישור אפשר לעבור עליה, לתקן, ולהחליט אם להצטרף; שום דבר לא מתפרסם בלי אישורכם:\n${LINK_TOKEN}\n\n` +
        `אם תעדיפו שלא נפנה אליכם שוב, פשוט השיבו למייל הזה ונכבד את זה.\n\nבברכה,\nצוות 1💗1`
    })
  },
  en: {
    friendly: (f) => ({
      body:
        `Hi! We're building a network of independent service providers on 1💗1.\n\n` +
        `We came across ${f.name}${f.what ? ` (${f.what})` : ''} and thought your services could be a great fit${f.collab}.\n\n` +
        `1💗1 helps customers describe what they need in natural language and connects them with relevant providers who can submit proposals.\n\n` +
        `We'd love to invite you to review a business profile we've prepared for you. You can correct the details and decide whether you'd like to join:\n${LINK_TOKEN}\n\n` +
        `Would you be interested in taking a look?`
    }),
    professional: (f) => ({
      body:
        `Hello,\n\nWe're reaching out because ${f.name} works in ${f.why || 'a field'} our customers ask for${f.collab}.\n\n` +
        `1💗1 is a platform where customers describe a need in plain words and relevant providers send proposals. Joining is your choice, and nothing is published without your approval.\n\n` +
        `We prepared a draft profile from your public information, for you to review, correct and approve:\n${LINK_TOKEN}\n\nBest regards,\nThe 1💗1 team`
    }),
    whatsapp: (f) => ({
      body: `Hi! We saw ${f.name} and think you'd fit the 1💗1 provider network 🙂 We prepared a draft profile — you can fix it and decide whether to join: ${LINK_TOKEN}`
    }),
    email: (f) => ({
      subject: `A draft 1💗1 profile for ${f.name}`,
      body:
        `Hello,\n\nWe chose to contact ${f.name} because your ${f.what || 'services'} match requests customers send us${f.collab}.\n\n` +
        `On 1💗1 a customer writes what they need and is connected with providers who send proposals. Providers can also team up and propose together.\n\n` +
        `We prepared a draft profile from public information only. At the link you can review it, correct it and decide whether to join; nothing is published without your approval:\n${LINK_TOKEN}\n\n` +
        `If you'd rather we didn't contact you again, just reply to this email and we'll respect that.\n\nBest regards,\nThe 1💗1 team`
    })
  },
  ar: {
    friendly: (f) => ({
      body:
        `مرحباً! نحن نبني على 1💗1 شبكة من مقدّمي الخدمات المستقلين.\n\n` +
        `صادفنا ${f.name}${f.what ? ` (${f.what})` : ''} ورأينا أن خدماتكم قد تكون مناسبة جداً${f.collab}.\n\n` +
        `يساعد 1💗1 الزبائن على وصف ما يحتاجونه بكلماتهم، ويوصلهم بمقدّمي خدمات مناسبين يقدّمون عروضهم.\n\n` +
        `يسعدنا أن ندعوكم لمراجعة ملف تجاري أعددناه لكم. يمكنكم تصحيح التفاصيل وتقرير ما إذا كنتم ترغبون بالانضمام:\n${LINK_TOKEN}\n\n` +
        `هل يهمّكم إلقاء نظرة؟`
    }),
    professional: (f) => ({
      body:
        `مرحباً،\n\nنتواصل معكم لأن ${f.name} يعمل في مجال ${f.why || ''} يطلبه زبائننا${f.collab}.\n\n` +
        `1💗1 منصة يصف فيها الزبائن حاجتهم بلغة حرّة، ويرسل مقدّمو الخدمات المناسبون عروضهم. الانضمام قراركم، ولا يُنشر شيء دون موافقتكم.\n\n` +
        `أعددنا مسودة ملف من المعلومات العامة عنكم، للمراجعة والتصحيح والموافقة:\n${LINK_TOKEN}\n\nمع التحية،\nفريق 1💗1`
    }),
    whatsapp: (f) => ({
      body: `مرحباً! رأينا ${f.name} ونعتقد أنكم مناسبون لشبكة مقدّمي الخدمات في 1💗1 🙂 أعددنا لكم مسودة ملف — يمكنكم تعديلها وتقرير الانضمام: ${LINK_TOKEN}`
    }),
    email: (f) => ({
      subject: `مسودة ملف على 1💗1 لـ ${f.name}`,
      body:
        `مرحباً،\n\nاخترنا التواصل مع ${f.name} لأن ${f.what || 'خدماتكم'} تتوافق مع طلبات يرسلها إلينا الزبائن${f.collab}.\n\n` +
        `على 1💗1 يكتب الزبون ما يحتاجه، فيتم وصله بمقدّمي خدمات يرسلون عروضهم. ويمكن لمقدّمي الخدمات أيضاً التعاون وتقديم عروض مشتركة.\n\n` +
        `أعددنا مسودة ملف من معلومات عامة فقط. عبر الرابط يمكنكم مراجعتها وتصحيحها وتقرير الانضمام؛ لا يُنشر شيء دون موافقتكم:\n${LINK_TOKEN}\n\n` +
        `إن كنتم تفضّلون ألا نتواصل معكم مجدداً، يكفي الرد على هذه الرسالة وسنحترم ذلك.\n\nمع التحية،\nفريق 1💗1`
    })
  }
};

export function templateVariants(p: Prospect, lang: GrowthLang): OutreachVariant[] {
  const f = factsOf(p, lang);
  return (Object.keys(T[lang]) as OutreachKind[]).map((kind) => {
    const m = T[lang][kind](f);
    return { kind, lang, subject: m.subject ?? null, body: m.body, origin: 'template' as const };
  });
}

/**
 * Put the onboarding link where the message says so — or, when there is no
 * link yet, take the placeholder's line out rather than send `{{link}}`.
 */
export function fillLink(body: string, link: string | null | undefined): string {
  if (link) return body.split(LINK_TOKEN).join(link);
  // "…decide whether to join:\n{{link}}" → "…decide whether to join."
  return body.replace(/\s*:\s*\{\{link\}\}/g, '.').split(LINK_TOKEN).join('');
}

/** `wa.me` takes digits only, with the country code. */
export function whatsappUrl(phoneDigits: string | null, text: string): string | null {
  if (!phoneDigits) return null;
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`;
}

export function mailtoUrl(email: string | null, subject: string | null | undefined, body: string): string | null {
  if (!email) return null;
  const q = [subject ? `subject=${encodeURIComponent(subject)}` : '', `body=${encodeURIComponent(body)}`].filter(Boolean).join('&');
  return `mailto:${encodeURIComponent(email).replace('%40', '@')}?${q}`;
}
