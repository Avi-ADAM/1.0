/**
 * The words on a share card, in the five interface languages.
 *
 * Server-only, so they live here rather than in a translation namespace: a
 * card is rendered once per (object, language) and cached, and the client never
 * needs these strings. Wording follows the pages the cards point at —
 * `demand.json` for pools, the wish page for wishes — so what a reader sees in
 * WhatsApp is what they find after the tap.
 *
 * Numbers are interpolated as separate nodes wherever a sentence mixes a figure
 * with RTL text (see cards.ts), so no label here carries a `7/10`-style
 * fragment that a bidi algorithm might flip.
 */

export type OgLang = 'he' | 'en' | 'ar' | 'ru' | 'es';

export const OG_LANGS: OgLang[] = ['he', 'en', 'ar', 'ru', 'es'];

export const isRtlLang = (lang: OgLang): boolean => lang === 'he' || lang === 'ar';

/** Normalise whatever arrived in `?lang=` to a supported language (Hebrew is the site default). */
export function ogLang(raw: string | null | undefined): OgLang {
  const l = String(raw ?? '').toLowerCase().slice(0, 2);
  return (OG_LANGS as string[]).includes(l) ? (l as OgLang) : 'he';
}

type Labels = {
  brand: string;
  kindMaagad: string;
  kindWish: string;
  households: string;
  ofSigned: (min: number) => string;
  daysLeft: (n: number) => string;
  lastDay: string;
  until: (date: string) => string;
  moreToGo: (n: number) => string;
  thresholdReached: string;
  activated: string;
  lookingForSupplier: string;
  signIndividually: string;
  /** The pool page's `join_note`: joining is soft, only a signature binds. */
  joinSoft: string;
  online: string;
  frequency: Record<'weekly' | 'biweekly' | 'monthly', string>;
  per: Record<'weekly' | 'biweekly' | 'monthly', string>;
  offersN: (n: number) => string;
  by: (name: string) => string;
  /** The words after the big figure: `offers to help` — the number is its own node. */
  proposalsWord: (n: number) => string;
  noProposals: string;
  tasksN: (n: number) => string;
  resourcesN: (n: number) => string;
  budget: string;
  flexibleDate: string;
  canYouHelp: string;
  fulfilled: string;
};

const LABELS: Record<OgLang, Labels> = {
  he: {
    brand: '1lev1',
    kindMaagad: 'מאגד ביקוש',
    kindWish: 'משאלה · קונסיירז׳',
    households: 'משקי בית',
    ofSigned: (min) => `מתוך ${min} חתמו`,
    daysLeft: (n) => (n === 1 ? 'נותר יום אחד' : `נותרו ${n} ימים`),
    lastDay: 'היום האחרון',
    until: (date) => `עד ${date}`,
    moreToGo: (n) => (n === 1 ? 'חסר/ה עוד אחד/ת' : `חסרים עוד ${n}`),
    thresholdReached: 'הסף הושג',
    activated: 'הופעל',
    lookingForSupplier: 'מחפשים ספק — אתם יכולים לספק את זה?',
    signIndividually: 'חותמים אישית · קורה רק אם מגיעים לסף',
    joinSoft: 'הצטרפות רכה והפיכה — מתחייבים רק כשחותמים על הצעה',
    online: 'אונליין / גלובלי',
    frequency: { weekly: 'שבועי', biweekly: 'דו-שבועי', monthly: 'חודשי' },
    per: { weekly: 'לשבוע', biweekly: 'לשבועיים', monthly: 'לחודש' },
    offersN: (n) => (n === 1 ? 'הצעה אחת' : `${n} הצעות`),
    by: (name) => `מאת ${name}`,
    proposalsWord: (n) => (n === 1 ? 'הצעת עזרה' : 'הצעות עזרה'),
    noProposals: 'עדיין בלי הצעות — תהיו הראשונים',
    tasksN: (n) => (n === 1 ? 'משימה אחת' : `${n} משימות`),
    resourcesN: (n) => (n === 1 ? 'משאב אחד' : `${n} משאבים`),
    budget: 'תקציב',
    flexibleDate: 'תאריך גמיש',
    canYouHelp: 'יש לך פיסה לתת? אפשר להציע בלי התחייבות',
    fulfilled: 'התגשמה'
  },
  en: {
    brand: '1lev1',
    kindMaagad: 'Demand pool',
    kindWish: 'Wish · Concierge',
    households: 'households',
    ofSigned: (min) => `of ${min} signed`,
    daysLeft: (n) => (n === 1 ? '1 day left' : `${n} days left`),
    lastDay: 'last day',
    until: (date) => `until ${date}`,
    moreToGo: (n) => (n === 1 ? '1 more to go' : `${n} more to go`),
    thresholdReached: 'Threshold reached',
    activated: 'Activated',
    lookingForSupplier: 'Looking for a supplier — can you supply this?',
    signIndividually: 'Sign individually · it only happens if enough people do',
    joinSoft: 'Joining is soft and reversible — you commit only when you sign an offer',
    online: 'Online / global',
    frequency: { weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly' },
    per: { weekly: '/ week', biweekly: '/ 2 weeks', monthly: '/ month' },
    offersN: (n) => (n === 1 ? '1 offer' : `${n} offers`),
    by: (name) => `by ${name}`,
    proposalsWord: (n) => (n === 1 ? 'offer to help' : 'offers to help'),
    noProposals: 'No offers yet — be the first',
    tasksN: (n) => (n === 1 ? '1 task' : `${n} tasks`),
    resourcesN: (n) => (n === 1 ? '1 resource' : `${n} resources`),
    budget: 'Budget',
    flexibleDate: 'Flexible date',
    canYouHelp: 'Have a piece to give? Offer it — no commitment',
    fulfilled: 'Fulfilled'
  },
  ar: {
    brand: '1lev1',
    kindMaagad: 'تجمّع طلب',
    kindWish: 'أمنية · كونسيرج',
    households: 'أسر',
    ofSigned: (min) => `من أصل ${min} وقّعوا`,
    daysLeft: (n) => (n === 1 ? 'بقي يوم واحد' : `بقي ${n} أيام`),
    lastDay: 'اليوم الأخير',
    until: (date) => `حتى ${date}`,
    moreToGo: (n) => (n === 1 ? 'ينقص واحد' : `ينقص ${n}`),
    thresholdReached: 'تم بلوغ الحد',
    activated: 'تم التفعيل',
    lookingForSupplier: 'يبحثون عن مورّد — هل يمكنك توفير ذلك؟',
    signIndividually: 'توقيع فردي · يحدث فقط عند بلوغ الحد',
    joinSoft: 'الانضمام غير ملزم وقابل للتراجع — تلتزم فقط عند توقيع عرض',
    online: 'عبر الإنترنت / عالمي',
    frequency: { weekly: 'أسبوعي', biweekly: 'كل أسبوعين', monthly: 'شهري' },
    per: { weekly: 'أسبوعياً', biweekly: 'كل أسبوعين', monthly: 'شهرياً' },
    offersN: (n) => (n === 1 ? 'عرض واحد' : `${n} عروض`),
    by: (name) => `من ${name}`,
    proposalsWord: (n) => (n === 1 ? 'عرض مساعدة' : 'عروض مساعدة'),
    noProposals: 'لا عروض بعد — كونوا الأوائل',
    tasksN: (n) => (n === 1 ? 'مهمة واحدة' : `${n} مهام`),
    resourcesN: (n) => (n === 1 ? 'مورد واحد' : `${n} موارد`),
    budget: 'الميزانية',
    flexibleDate: 'موعد مرن',
    canYouHelp: 'هل لديك ما تقدّمه؟ اعرضه دون التزام',
    fulfilled: 'تحقّقت'
  },
  ru: {
    brand: '1lev1',
    kindMaagad: 'Пул спроса',
    kindWish: 'Желание · Консьерж',
    households: 'домохозяйств',
    ofSigned: (min) => `из ${min} подписали`,
    daysLeft: (n) => (n === 1 ? 'остался 1 день' : `осталось ${n} дн.`),
    lastDay: 'последний день',
    until: (date) => `до ${date}`,
    moreToGo: (n) => `не хватает ${n}`,
    thresholdReached: 'Порог достигнут',
    activated: 'Активировано',
    lookingForSupplier: 'Ищут поставщика — можете это предложить?',
    signIndividually: 'Подпись личная · случится, только если наберётся порог',
    joinSoft: 'Присоединение ни к чему не обязывает — обязательство только при подписи предложения',
    online: 'Онлайн / глобально',
    frequency: { weekly: 'Еженедельно', biweekly: 'Раз в 2 недели', monthly: 'Ежемесячно' },
    per: { weekly: '/ нед.', biweekly: '/ 2 нед.', monthly: '/ мес.' },
    offersN: (n) => `${n} предл.`,
    by: (name) => `от ${name}`,
    proposalsWord: () => 'предл. помощи',
    noProposals: 'Пока нет предложений — будьте первыми',
    tasksN: (n) => `${n} задач`,
    resourcesN: (n) => `${n} ресурсов`,
    budget: 'Бюджет',
    flexibleDate: 'Гибкая дата',
    canYouHelp: 'Можете помочь с частью? Предложите без обязательств',
    fulfilled: 'Исполнено'
  },
  es: {
    brand: '1lev1',
    kindMaagad: 'Grupo de demanda',
    kindWish: 'Deseo · Conserjería',
    households: 'hogares',
    ofSigned: (min) => `de ${min} firmaron`,
    daysLeft: (n) => (n === 1 ? 'queda 1 día' : `quedan ${n} días`),
    lastDay: 'último día',
    until: (date) => `hasta el ${date}`,
    moreToGo: (n) => (n === 1 ? 'falta 1' : `faltan ${n}`),
    thresholdReached: 'Umbral alcanzado',
    activated: 'Activado',
    lookingForSupplier: 'Buscan proveedor — ¿puedes ofrecerlo?',
    signIndividually: 'Firma individual · solo ocurre si se alcanza el umbral',
    joinSoft: 'Unirse no compromete y es reversible — solo te comprometes al firmar una oferta',
    online: 'En línea / global',
    frequency: { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' },
    per: { weekly: '/ semana', biweekly: '/ 2 semanas', monthly: '/ mes' },
    offersN: (n) => (n === 1 ? '1 oferta' : `${n} ofertas`),
    by: (name) => `de ${name}`,
    proposalsWord: (n) => (n === 1 ? 'oferta de ayuda' : 'ofertas de ayuda'),
    noProposals: 'Aún sin ofertas — sé la primera persona',
    tasksN: (n) => (n === 1 ? '1 tarea' : `${n} tareas`),
    resourcesN: (n) => (n === 1 ? '1 recurso' : `${n} recursos`),
    budget: 'Presupuesto',
    flexibleDate: 'Fecha flexible',
    canYouHelp: '¿Tienes algo que aportar? Ofrécelo sin compromiso',
    fulfilled: 'Cumplido'
  }
};

export const labelsFor = (lang: OgLang): Labels => LABELS[lang];

const INTL_LOCALE: Record<OgLang, string> = {
  he: 'he-IL',
  en: 'en',
  ar: 'ar',
  ru: 'ru-RU',
  es: 'es-ES'
};

/** `19 Jun` / `19 ביוני` — the day a deadline falls on, in the reader's language. */
export function fmtDay(iso: string | null | undefined, lang: OgLang): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(INTL_LOCALE[lang], { day: 'numeric', month: 'short' }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/**
 * `₪90` / `90 ₪` / `€12.50`, or `90 שקל` when the currency is a free-text
 * name rather than an ISO code. Never throws — a card must render.
 */
export function fmtPrice(
  amount: number | null | undefined,
  currency: string | null | undefined,
  lang: OgLang
): string {
  if (amount == null || !Number.isFinite(Number(amount))) return '';
  const n = Number(amount);
  const code = String(currency ?? '').trim();
  if (/^[A-Za-z]{3}$/.test(code)) {
    try {
      return new Intl.NumberFormat(INTL_LOCALE[lang], {
        style: 'currency',
        currency: code.toUpperCase(),
        maximumFractionDigits: Number.isInteger(n) ? 0 : 2
      }).format(n);
    } catch {
      /* unknown code: fall through to the plain form */
    }
  }
  const plain = new Intl.NumberFormat(INTL_LOCALE[lang], {
    maximumFractionDigits: Number.isInteger(n) ? 0 : 2
  }).format(n);
  return code ? `${plain} ${code}` : plain;
}
