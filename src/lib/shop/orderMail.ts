/**
 * The mail a buyer gets about their order — pure, so every sentence is tested.
 *
 * Four moments, each one a fact the rikma already recorded:
 *
 *   received — an arranged-payment order came in, nothing charged yet
 *   paid     — the money arrived (a charge on the site, or "payment received"
 *              confirmed by a member)
 *   shipped  — a member marked a delivery order as sent
 *   tracking — a tracking number was added to an order that already left
 *
 * The builder only turns an {@link OrderMailInput} into subject / text / HTML in
 * the buyer's language. Who gets it, whether it may go out at all and how it is
 * sent are `$lib/server/shop/orderMail.ts`.
 *
 * The strings below are indexed by the **recipient's** language — the buyer's,
 * stored on the order — not the viewer's, so `$t()` cannot express them (the
 * same reason the notification payloads and `components/mail/*` keep their own
 * dictionaries). Everything that is not a sentence of ours — the shop's name, a
 * product's name, the buyer's address — is data and is HTML-escaped.
 */

import { formatMoney } from '$lib/money/format.js';
import type { CurrencyCode } from '$lib/money/currencies.js';
import { addressLine, addressOf } from './manage';
import { safeUrl, type Tracking } from './tracking';

export type OrderMailKind = 'received' | 'paid' | 'shipped' | 'tracking' | 'cancelled' | 'cancelledUnpaid' | 'expired';

/** The mails that close an order: no delivery section, nothing left to arrange. */
export const CLOSING_KINDS: readonly OrderMailKind[] = ['cancelled', 'cancelledUnpaid', 'expired'];

export const MAIL_LOCALES = ['he', 'en', 'ar', 'ru', 'es'] as const;
export type MailLocale = (typeof MAIL_LOCALES)[number];

/**
 * The language of the buyer's mail, from the order's `locale` ("he", "en-US",
 * the old "iw"). None stored ⇒ Hebrew, the storefronts' default; one we do not
 * write ⇒ English.
 */
export function mailLocaleOf(raw: string | null | undefined): MailLocale {
  const base = (raw ?? '').trim().toLowerCase().split(/[-_]/)[0];
  if (!base) return 'he';
  if (base === 'iw') return 'he';
  return (MAIL_LOCALES as readonly string[]).includes(base) ? (base as MailLocale) : 'en';
}

export interface OrderMailLine {
  name: string;
  optionLabel: string | null;
  quantity: number;
  unitPrice: number | null;
  lineTotal: number | null;
}

export interface OrderMailDelivery {
  preference: 'pickup' | 'delivery' | 'digital' | 'contact';
  /** One line, as `addressLine` writes it. */
  addressLine: string | null;
  /** The shipping method's name, when the rikma priced one. */
  method: string | null;
  fee: number | null;
  pickupPointName: string | null;
  pickupAddress: string | null;
  pickupByAppointment: boolean;
  etaMinDays: number | null;
  etaMaxDays: number | null;
}

export interface OrderMailInput {
  kind: OrderMailKind;
  /** The order's stored locale — see {@link mailLocaleOf}. */
  locale: string | null;
  shopName: string;
  /** What people say out loud (`orderNumberOf`). */
  number: string;
  buyerName: string | null;
  lines: OrderMailLine[];
  total: number | null;
  currency: string;
  delivery: OrderMailDelivery;
  /** The stock did not cover part of a paid order. */
  oversold?: boolean;
  tracking: Tracking | null;
  /** The shop's own public links, when it set them. */
  website: string | null;
  whatsapp: string | null;
  /** A reply reaches a person (a Reply-To is set). */
  canReply: boolean;
  /** The shop chose to leave out the "sent through 1lev1" line. */
  hideSentVia?: boolean;
}

export interface BuiltOrderMail {
  subject: string;
  text: string;
  html: string;
  locale: MailLocale;
}

// ─── the words ──────────────────────────────────────────────────────────────

interface Copy {
  rtl: boolean;
  hello: (name: string | null) => string;
  subject: Record<OrderMailKind, string>;
  intro: Record<OrderMailKind, string>;
  delay: string;
  orderNumber: string;
  items: string;
  total: string;
  delivery: string;
  pickup: string;
  pickupAt: string;
  pickupWhen: string;
  byAppointment: string;
  shipTo: string;
  fee: string;
  free: string;
  eta: string;
  /** "1 day" / "3 days" */
  days: (n: number) => string;
  /** The unit after a range: "2–4 days" */
  daysUnit: string;
  digital: string;
  arrange: string;
  arrangeWhatsapp: string;
  /** What the buyer's WhatsApp message opens with. */
  arrangeWhatsappText: string;
  tracking: string;
  carrier: string;
  trackingNumber: string;
  trackingLink: string;
  contact: string;
  website: string;
  whatsapp: string;
  canReply: string;
  automatic: string;
  sentVia: string;
}

const COPY: Record<MailLocale, Copy> = {
  he: {
    rtl: true,
    hello: (n) => (n ? `שלום ${n},` : 'שלום,'),
    subject: {
      received: '{shop} — קיבלנו את הזמנה {number}',
      paid: '{shop} — התשלום על הזמנה {number} התקבל',
      shipped: '{shop} — הזמנה {number} יצאה אליך',
      tracking: '{shop} — מספר מעקב להזמנה {number}',
      cancelled: '{shop} — הזמנה {number} בוטלה',
      cancelledUnpaid: '{shop} — הזמנה {number} בוטלה',
      expired: '{shop} — הזמנה {number} פגה'
    },
    intro: {
      received: 'קיבלנו את ההזמנה שלך. התשלום עדיין לא נגבה — נחזור אליך בקרוב כדי לתאם אותו.',
      paid: 'תודה! התשלום התקבל וההזמנה שלך נכנסה לטיפול.',
      shipped: 'ההזמנה שלך נשלחה והיא בדרך אליך.',
      tracking: 'הוספנו מספר מעקב למשלוח שלך.',
      cancelled: 'ההזמנה שלך בוטלה. אם כבר שילמת, נחזור אליך בנוגע להחזר.',
      cancelledUnpaid: 'ההזמנה שלך בוטלה. לא נגבה ממך תשלום.',
      expired: 'ההזמנה שלך פגה כי התשלום לא תואם בזמן. לא נגבה ממך תשלום, ואפשר להזמין שוב בכל עת.'
    },
    delay: 'חלק מהפריטים אינם במלאי כרגע. ניצור איתך קשר לגבי מועד האספקה.',
    orderNumber: 'מספר הזמנה',
    items: 'מה הוזמן',
    total: 'סה״כ',
    delivery: 'משלוח',
    pickup: 'איסוף עצמי',
    pickupAt: 'איסוף מ{name}',
    pickupWhen: 'מועד האיסוף',
    byAppointment: 'בתיאום מראש',
    shipTo: 'כתובת למשלוח',
    fee: 'דמי משלוח',
    free: 'ללא עלות',
    eta: 'זמן אספקה משוער',
    days: (n) => (n === 1 ? 'יום אחד' : `${n} ימים`),
    daysUnit: 'ימים',
    digital: 'מוצר דיגיטלי — אין משלוח.',
    arrange: 'נתאם איתך את המסירה.',
    arrangeWhatsapp: 'לתיאום בוואטסאפ',
    arrangeWhatsappText: 'שלום, לגבי הזמנה {number}',
    tracking: 'מעקב משלוח',
    carrier: 'חברת שילוח',
    trackingNumber: 'מספר מעקב',
    trackingLink: 'לעמוד המעקב',
    contact: 'שאלות? אפשר לפנות אלינו:',
    website: 'אתר',
    whatsapp: 'וואטסאפ',
    canReply: 'אפשר להשיב למייל הזה.',
    automatic: 'זהו מייל אוטומטי.',
    sentVia: 'נשלח באמצעות 1lev1'
  },
  en: {
    rtl: false,
    hello: (n) => (n ? `Hi ${n},` : 'Hello,'),
    subject: {
      received: '{shop} — we got your order {number}',
      paid: '{shop} — payment received for order {number}',
      shipped: '{shop} — your order {number} is on its way',
      tracking: '{shop} — tracking number for order {number}',
      cancelled: '{shop} — order {number} was cancelled',
      cancelledUnpaid: '{shop} — order {number} was cancelled',
      expired: '{shop} — order {number} expired'
    },
    intro: {
      received: "We've received your order. You haven't been charged yet — we'll be in touch soon to arrange payment.",
      paid: 'Thank you! Your payment was received and your order is being handled.',
      shipped: 'Your order has shipped and is on its way to you.',
      tracking: "We've added a tracking number to your shipment.",
      cancelled: "Your order was cancelled. If you already paid, we'll get back to you about the refund.",
      cancelledUnpaid: 'Your order was cancelled. You were not charged.',
      expired: "Your order expired because payment wasn't arranged in time. You were not charged, and you're welcome to order again any time."
    },
    delay: "Some items are out of stock right now. We'll contact you about when they will arrive.",
    orderNumber: 'Order number',
    items: 'What you ordered',
    total: 'Total',
    delivery: 'Delivery',
    pickup: 'Pickup',
    pickupAt: 'Pick up at {name}',
    pickupWhen: 'Pickup time',
    byAppointment: 'By appointment',
    shipTo: 'Ship to',
    fee: 'Delivery fee',
    free: 'Free',
    eta: 'Estimated delivery',
    days: (n) => (n === 1 ? '1 day' : `${n} days`),
    daysUnit: 'days',
    digital: 'Digital product — nothing is shipped.',
    arrange: "We'll arrange the handover with you.",
    arrangeWhatsapp: 'Arrange on WhatsApp',
    arrangeWhatsappText: 'Hi, about order {number}',
    tracking: 'Shipment tracking',
    carrier: 'Carrier',
    trackingNumber: 'Tracking number',
    trackingLink: 'Track your shipment',
    contact: 'Questions? Reach us here:',
    website: 'Website',
    whatsapp: 'WhatsApp',
    canReply: 'You can reply to this email.',
    automatic: 'This is an automatic email.',
    sentVia: 'Sent through 1lev1'
  },
  ar: {
    rtl: true,
    hello: (n) => (n ? `مرحبًا ${n}،` : 'مرحبًا،'),
    subject: {
      received: '{shop} — استلمنا طلبك {number}',
      paid: '{shop} — تم استلام الدفع للطلب {number}',
      shipped: '{shop} — طلبك {number} في الطريق إليك',
      tracking: '{shop} — رقم تتبّع الطلب {number}',
      cancelled: '{shop} — تم إلغاء الطلب {number}',
      cancelledUnpaid: '{shop} — تم إلغاء الطلب {number}',
      expired: '{shop} — انتهت صلاحية الطلب {number}'
    },
    intro: {
      received: 'استلمنا طلبك. لم يتم سحب أي مبلغ بعد — سنتواصل معك قريبًا لترتيب الدفع.',
      paid: 'شكرًا لك! تم استلام الدفع وطلبك قيد المعالجة.',
      shipped: 'تم شحن طلبك وهو في الطريق إليك.',
      tracking: 'أضفنا رقم تتبّع لشحنتك.',
      cancelled: 'تم إلغاء طلبك. إذا كنت قد دفعت بالفعل فسنتواصل معك بخصوص الاسترداد.',
      cancelledUnpaid: 'تم إلغاء طلبك. لم يُخصم منك أي مبلغ.',
      expired: 'انتهت صلاحية طلبك لأن الدفع لم يُرتَّب في الوقت المناسب. لم يُخصم منك أي مبلغ، ويمكنك الطلب مجددًا في أي وقت.'
    },
    delay: 'بعض المنتجات غير متوفرة في المخزون حاليًا. سنتواصل معك بشأن موعد التوريد.',
    orderNumber: 'رقم الطلب',
    items: 'ما الذي طلبته',
    total: 'المجموع',
    delivery: 'التوصيل',
    pickup: 'استلام شخصي',
    pickupAt: 'الاستلام من {name}',
    pickupWhen: 'موعد الاستلام',
    byAppointment: 'بتنسيق مسبق',
    shipTo: 'عنوان التوصيل',
    fee: 'رسوم التوصيل',
    free: 'مجانًا',
    eta: 'مدة التوصيل المتوقعة',
    days: (n) => (n === 1 ? 'يوم واحد' : n === 2 ? 'يومان' : n <= 10 ? `${n} أيام` : `${n} يومًا`),
    daysUnit: 'أيام',
    digital: 'منتج رقمي — لا يوجد شحن.',
    arrange: 'سننسّق معك التسليم.',
    arrangeWhatsapp: 'التنسيق عبر واتساب',
    arrangeWhatsappText: 'مرحبًا، بخصوص الطلب {number}',
    tracking: 'تتبّع الشحنة',
    carrier: 'شركة الشحن',
    trackingNumber: 'رقم التتبّع',
    trackingLink: 'صفحة التتبّع',
    contact: 'لديك سؤال؟ تواصل معنا:',
    website: 'الموقع',
    whatsapp: 'واتساب',
    canReply: 'يمكنك الرد على هذا البريد.',
    automatic: 'هذه رسالة تلقائية.',
    sentVia: 'أُرسلت عبر 1lev1'
  },
  ru: {
    rtl: false,
    hello: (n) => (n ? `Здравствуйте, ${n}!` : 'Здравствуйте!'),
    subject: {
      received: '{shop} — мы получили ваш заказ {number}',
      paid: '{shop} — оплата заказа {number} получена',
      shipped: '{shop} — заказ {number} отправлен',
      tracking: '{shop} — трек-номер заказа {number}',
      cancelled: '{shop} — заказ {number} отменён',
      cancelledUnpaid: '{shop} — заказ {number} отменён',
      expired: '{shop} — срок заказа {number} истёк'
    },
    intro: {
      received: 'Мы получили ваш заказ. Оплата пока не списана — скоро свяжемся с вами, чтобы её согласовать.',
      paid: 'Спасибо! Оплата получена, заказ принят в работу.',
      shipped: 'Ваш заказ отправлен и уже в пути.',
      tracking: 'Мы добавили трек-номер к вашей посылке.',
      cancelled: 'Ваш заказ отменён. Если вы уже заплатили, мы свяжемся с вами по поводу возврата.',
      cancelledUnpaid: 'Ваш заказ отменён. Деньги с вас не списывались.',
      expired: 'Срок вашего заказа истёк: оплату не согласовали вовремя. Деньги с вас не списывались, и вы можете оформить заказ снова в любое время.'
    },
    delay: 'Некоторых товаров сейчас нет в наличии. Мы свяжемся с вами по поводу сроков.',
    orderNumber: 'Номер заказа',
    items: 'Что вы заказали',
    total: 'Итого',
    delivery: 'Доставка',
    pickup: 'Самовывоз',
    pickupAt: 'Самовывоз: {name}',
    pickupWhen: 'Время самовывоза',
    byAppointment: 'По предварительной договорённости',
    shipTo: 'Адрес доставки',
    fee: 'Стоимость доставки',
    free: 'Бесплатно',
    eta: 'Ориентировочный срок доставки',
    days: (n) => `${n} дн.`,
    daysUnit: 'дн.',
    digital: 'Цифровой товар — доставка не требуется.',
    arrange: 'Мы согласуем с вами передачу заказа.',
    arrangeWhatsapp: 'Договориться в WhatsApp',
    arrangeWhatsappText: 'Здравствуйте, по поводу заказа {number}',
    tracking: 'Отслеживание посылки',
    carrier: 'Служба доставки',
    trackingNumber: 'Трек-номер',
    trackingLink: 'Страница отслеживания',
    contact: 'Есть вопросы? Свяжитесь с нами:',
    website: 'Сайт',
    whatsapp: 'WhatsApp',
    canReply: 'На это письмо можно ответить.',
    automatic: 'Это автоматическое письмо.',
    sentVia: 'Отправлено через 1lev1'
  },
  es: {
    rtl: false,
    hello: (n) => (n ? `Hola, ${n}:` : 'Hola:'),
    subject: {
      received: '{shop} — hemos recibido tu pedido {number}',
      paid: '{shop} — pago recibido del pedido {number}',
      shipped: '{shop} — tu pedido {number} va en camino',
      tracking: '{shop} — número de seguimiento del pedido {number}',
      cancelled: '{shop} — pedido {number} cancelado',
      cancelledUnpaid: '{shop} — pedido {number} cancelado',
      expired: '{shop} — el pedido {number} venció'
    },
    intro: {
      received: 'Hemos recibido tu pedido. Todavía no se ha cobrado nada: te contactaremos pronto para acordar el pago.',
      paid: '¡Gracias! Hemos recibido el pago y tu pedido ya está en preparación.',
      shipped: 'Tu pedido ha sido enviado y va de camino.',
      tracking: 'Hemos añadido un número de seguimiento a tu envío.',
      cancelled: 'Tu pedido fue cancelado. Si ya pagaste, te contactaremos por el reembolso.',
      cancelledUnpaid: 'Tu pedido fue cancelado. No se te cobró nada.',
      expired: 'Tu pedido venció porque el pago no se coordinó a tiempo. No se te cobró nada y puedes volver a pedir cuando quieras.'
    },
    delay: 'Algunos artículos no están en stock ahora mismo. Te contactaremos para informarte de la fecha.',
    orderNumber: 'Número de pedido',
    items: 'Qué has pedido',
    total: 'Total',
    delivery: 'Entrega',
    pickup: 'Recogida',
    pickupAt: 'Recogida en {name}',
    pickupWhen: 'Horario de recogida',
    byAppointment: 'Con cita previa',
    shipTo: 'Enviar a',
    fee: 'Gastos de envío',
    free: 'Gratis',
    eta: 'Plazo estimado de entrega',
    days: (n) => (n === 1 ? '1 día' : `${n} días`),
    daysUnit: 'días',
    digital: 'Producto digital: no hay envío.',
    arrange: 'Acordaremos contigo la entrega.',
    arrangeWhatsapp: 'Coordinar por WhatsApp',
    arrangeWhatsappText: 'Hola, sobre el pedido {number}',
    tracking: 'Seguimiento del envío',
    carrier: 'Transportista',
    trackingNumber: 'Número de seguimiento',
    trackingLink: 'Página de seguimiento',
    contact: '¿Dudas? Escríbenos:',
    website: 'Sitio web',
    whatsapp: 'WhatsApp',
    canReply: 'Puedes responder a este correo.',
    automatic: 'Este es un correo automático.',
    sentVia: 'Enviado a través de 1lev1'
  }
};

// ─── the rikma's own notice ─────────────────────────────────────────────────

/**
 * Who bought and where it goes, in one line, for the notification the rikma's
 * members get about a new order: `דנה · 050-123 4567 · הרצל 1, נתניה`. Names a
 * stranger typed, so it is data — the caller puts it into a sentence of its
 * own. Empty when the storefront sent none of it.
 */
export function buyerFactsOf(
  buyer: { name?: string | null; phone?: string | null } | null | undefined,
  address: unknown
): string {
  const clean = (s: string | null | undefined) => oneLine(s ?? '');
  return [clean(buyer?.name), clean(buyer?.phone), clean(addressLine(addressOf(address)))].filter(Boolean).join(' · ');
}

// ─── helpers ────────────────────────────────────────────────────────────────

const fill =(template: string, vars: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');

/** HTML text — every value that is not a sentence of ours goes through this. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** One line: a subject must never carry a line break (header injection). */
const oneLine = (s: string) => s.replace(/[\r\n\u2028\u2029]+/g, ' ').replace(/\s+/g, ' ').trim();

/** The shop's website as a link — `shop.example` gets its scheme. */
export function websiteLink(raw: string | null | undefined): string | null {
  const v = (raw ?? '').trim();
  if (!v) return null;
  return safeUrl(v) ?? (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v) ? safeUrl(`https://${v}`) : null);
}

/** The shop's WhatsApp as a link — a `wa.me` link, or just the number (`050…` is an Israeli one). */
export function whatsappLink(raw: string | null | undefined): string | null {
  const v = (raw ?? '').trim();
  if (!v) return null;
  const link = safeUrl(v);
  if (link) return link;
  const typed = v.replace(/\D/g, '');
  // wa.me wants the country code; a local 050… there opens a dead chat.
  const digits = /^0\d{8,9}$/.test(typed) ? `972${typed.slice(1)}` : typed;
  return digits.length >= 8 && digits.length <= 15 && /^[+\d][\d\s()-]*$/.test(v) ? `https://wa.me/${digits}` : null;
}

function etaText(c: Copy, min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  if (min !== null && max !== null && min !== max) return `${min}–${max} ${c.daysUnit}`;
  return c.days((max ?? min) as number);
}

interface Row {
  label: string;
  value: string;
  /** A link target for the value, already vetted by `safeUrl`. */
  href?: string | null;
}

// ─── the builder ────────────────────────────────────────────────────────────

export function buildOrderMail(input: OrderMailInput): BuiltOrderMail {
  const locale = mailLocaleOf(input.locale);
  const c = COPY[locale];
  const currency = input.currency as CurrencyCode;
  const money = (n: number | null) => (n === null || !Number.isFinite(n) ? '' : formatMoney(n, currency, locale));

  const shop = oneLine(input.shopName) || '1lev1';
  const number = oneLine(input.number);
  const subject = oneLine(fill(c.subject[input.kind], { shop, number }));

  // What was ordered.
  const items = input.lines.map((l) => {
    const name = oneLine(l.name) + (l.optionLabel ? ` · ${oneLine(l.optionLabel)}` : '');
    const sum = l.lineTotal ?? (l.unitPrice !== null ? Math.round(l.unitPrice * l.quantity * 100) / 100 : null);
    return { name, qty: l.quantity, sum: money(sum) };
  });

  // How it gets there.
  const d = input.delivery;
  const delivery: Row[] = [];
  if (d.preference === 'pickup') {
    delivery.push({
      label: c.delivery,
      value: d.pickupPointName ? fill(c.pickupAt, { name: oneLine(d.pickupPointName) }) : c.pickup
    });
    if (d.pickupAddress) delivery.push({ label: c.shipTo, value: oneLine(d.pickupAddress) });
    if (d.pickupByAppointment) delivery.push({ label: c.pickupWhen, value: c.byAppointment });
  } else if (d.preference === 'delivery') {
    if (d.addressLine) delivery.push({ label: c.shipTo, value: oneLine(d.addressLine) });
    if (d.method) delivery.push({ label: c.delivery, value: oneLine(d.method) });
    if (d.fee !== null) delivery.push({ label: c.fee, value: d.fee > 0 ? money(d.fee) : c.free });
    const eta = etaText(c, d.etaMinDays, d.etaMaxDays);
    if (eta) delivery.push({ label: c.eta, value: eta });
  } else if (d.preference === 'digital') {
    delivery.push({ label: c.delivery, value: c.digital });
  } else {
    delivery.push({ label: c.delivery, value: c.arrange });
  }
  // A closed order has nothing left to deliver or arrange.
  if (CLOSING_KINDS.includes(input.kind)) delivery.length = 0;

  // A parcel's tracking — only once it has left.
  const t = input.kind === 'shipped' || input.kind === 'tracking' ? input.tracking : null;
  const tracking: Row[] = [];
  if (t) {
    if (t.carrier) tracking.push({ label: c.carrier, value: oneLine(t.carrier) });
    tracking.push({ label: c.trackingNumber, value: oneLine(t.number) });
    if (t.url) tracking.push({ label: c.trackingLink, value: t.url, href: safeUrl(t.url) });
  }

  // How to reach the shop.
  const site = websiteLink(input.website);
  const wa = whatsappLink(input.whatsapp);
  const contact: Row[] = [];
  if (site) contact.push({ label: c.website, value: site, href: site });
  // Whatever waits on a conversation gets the way to start it, up where the
  // handover is described. A closed order has nothing left to arrange.
  const needsArranging = d.preference === 'contact' || (d.preference === 'pickup' && d.pickupByAppointment);
  const arrange = wa && needsArranging && !CLOSING_KINDS.includes(input.kind) ? wa : null;
  const arrangeChat = arrange?.match(/^https:\/\/wa\.me\/(\d+)$/)?.[1] ?? null;
  const arrangeHref =
    arrange && arrangeChat ? `${arrange}?text=${encodeURIComponent(fill(c.arrangeWhatsappText, { number }))}` : arrange;
  if (wa && !arrange) contact.push({ label: c.whatsapp, value: wa, href: wa });

  const total = money(input.total);
  const showDelay = input.oversold === true && input.kind === 'paid';
  const hello = c.hello(input.buyerName ? oneLine(input.buyerName) : null);

  // ── plain text ──
  const out: string[] = [hello, '', c.intro[input.kind]];
  if (showDelay) out.push(c.delay);
  out.push('', `${c.orderNumber}: ${number}`, '', `${c.items}:`);
  for (const it of items) out.push(`- ${it.name} × ${it.qty}${it.sum ? ` — ${it.sum}` : ''}`);
  if (total) out.push(`${c.total}: ${total}`);
  if (delivery.length) {
    out.push('', `${c.delivery}:`);
    for (const r of delivery) out.push(`${r.label}: ${r.value}`);
    if (arrange) out.push(`${c.arrangeWhatsapp}: ${arrange}`);
  }
  if (tracking.length) {
    out.push('', `${c.tracking}:`);
    for (const r of tracking) out.push(`${r.label}: ${r.value}`);
  }
  out.push('');
  if (contact.length) {
    out.push(c.contact);
    for (const r of contact) out.push(`${r.label}: ${r.value}`);
  }
  const signature = input.hideSentVia ? [shop] : [shop, c.sentVia];
  out.push(input.canReply ? c.canReply : c.automatic, signature.join(' · '));
  const text = out.join('\n');

  // ── HTML ──
  const e = escapeHtml;
  const align = c.rtl ? 'right' : 'left';
  const row = (r: Row) =>
    `<tr><td style="padding:2px ${c.rtl ? '0' : '12px'} 2px ${c.rtl ? '12px' : '0'};color:#6b6b6b;white-space:nowrap;vertical-align:top">${e(r.label)}</td>` +
    `<td style="padding:2px 0">${r.href ? `<a href="${e(r.href)}" style="color:#1a5fb4">${e(r.value)}</a>` : e(r.value)}</td></tr>`;
  const table = (rows: Row[]) => `<table role="presentation" style="border-collapse:collapse;font-size:14px">${rows.map(row).join('')}</table>`;
  const h = (s: string) => `<h2 style="margin:22px 0 6px;font-size:15px">${e(s)}</h2>`;

  const html = [
    `<!doctype html><html lang="${locale}" dir="${c.rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>`,
    `<body style="margin:0;padding:0;background:#f4f4f2">`,
    `<div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1c1c1c;text-align:${align}" dir="${c.rtl ? 'rtl' : 'ltr'}">`,
    `<div style="background:#ffffff;border-radius:12px;padding:24px">`,
    `<p style="margin:0 0 4px;font-size:13px;color:#6b6b6b">${e(shop)}</p>`,
    `<p style="margin:0 0 12px;font-size:17px;font-weight:700">${e(hello)}</p>`,
    `<p style="margin:0 0 8px">${e(c.intro[input.kind])}</p>`,
    showDelay ? `<p style="margin:0 0 8px">${e(c.delay)}</p>` : '',
    `<p style="margin:14px 0 0"><span style="color:#6b6b6b">${e(c.orderNumber)}:</span> <strong>${e(number)}</strong></p>`,
    h(c.items),
    `<table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">`,
    items
      .map(
        (it) =>
          `<tr><td style="padding:4px 0;border-bottom:1px solid #ececec">${e(it.name)} <span style="color:#6b6b6b">× ${it.qty}</span></td>` +
          `<td style="padding:4px 0;border-bottom:1px solid #ececec;text-align:${c.rtl ? 'left' : 'right'};white-space:nowrap">${e(it.sum)}</td></tr>`
      )
      .join(''),
    total
      ? `<tr><td style="padding:8px 0 0;font-weight:700">${e(c.total)}</td><td style="padding:8px 0 0;text-align:${c.rtl ? 'left' : 'right'};font-weight:700;white-space:nowrap">${e(total)}</td></tr>`
      : '',
    `</table>`,
    delivery.length ? h(c.delivery) + table(delivery) : '',
    arrangeHref
      ? `<p style="margin:14px 0 0"><a href="${e(arrangeHref)}" style="display:inline-block;padding:10px 18px;background:#25d366;color:#0b2e17;border-radius:8px;font-weight:700;text-decoration:none">${e(c.arrangeWhatsapp)}</a>` +
        (arrangeChat ? ` <span dir="ltr" style="font-size:14px;color:#6b6b6b;white-space:nowrap">+${e(arrangeChat)}</span>` : '') +
        `</p>`
      : '',
    tracking.length ? h(c.tracking) + table(tracking) : '',
    `<hr style="border:0;border-top:1px solid #ececec;margin:22px 0 12px">`,
    contact.length ? `<p style="margin:0 0 6px;font-size:13px;color:#6b6b6b">${e(c.contact)}</p>${table(contact)}` : '',
    `<p style="margin:10px 0 0;font-size:12px;color:#8a8a8a">${[input.canReply ? c.canReply : c.automatic, ...signature].map(e).join(' · ')}</p>`,
    `</div></div></body></html>`
  ].join('');

  return { subject, text, html, locale };
}
