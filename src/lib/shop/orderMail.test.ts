import { describe, expect, it } from 'vitest';
import {
  MAIL_LOCALES,
  buildOrderMail,
  buyerFactsOf,
  escapeHtml,
  mailLocaleOf,
  websiteLink,
  whatsappLink,
  type OrderMailInput
} from './orderMail';

const base: OrderMailInput = {
  kind: 'paid',
  locale: 'he',
  shopName: 'חנות הספרים',
  number: '1042',
  buyerName: 'דנה',
  lines: [
    { name: 'ספר בישול', optionLabel: 'כריכה קשה', quantity: 2, unitPrice: 80, lineTotal: 160 },
    { name: 'סימניה', optionLabel: null, quantity: 1, unitPrice: 10, lineTotal: null }
  ],
  total: 190,
  currency: 'ILS',
  delivery: {
    preference: 'delivery',
    addressLine: 'הרצל 1, נתניה 4250000',
    method: 'שליח עד הבית',
    fee: 20,
    pickupPointName: null,
    pickupAddress: null,
    pickupByAppointment: false,
    etaMinDays: 2,
    etaMaxDays: 4
  },
  oversold: false,
  tracking: null,
  website: 'shop.example',
  whatsapp: '972501234567',
  canReply: true
};

describe('mailLocaleOf', () => {
  it('reads the order locale', () => {
    expect(mailLocaleOf('he')).toBe('he');
    expect(mailLocaleOf('en-US')).toBe('en');
    expect(mailLocaleOf('AR_EG')).toBe('ar');
    expect(mailLocaleOf('iw')).toBe('he');
  });
  it('defaults to Hebrew when none is stored, English when we do not write it', () => {
    expect(mailLocaleOf(null)).toBe('he');
    expect(mailLocaleOf('')).toBe('he');
    expect(mailLocaleOf('fr')).toBe('en');
  });
});

describe('buildOrderMail', () => {
  it('writes a paid order: number, items, total, delivery', () => {
    const m = buildOrderMail(base);
    // Intl puts invisible direction marks around a Hebrew price; the reader sees "160 ₪".
    const text = m.text.replace(/\p{Cf}/gu, '').replace(/[^\S\n]+/g, ' ');
    expect(m.locale).toBe('he');
    expect(m.subject).toBe('חנות הספרים — התשלום על הזמנה 1042 התקבל');
    expect(text).toContain('שלום דנה,');
    expect(text).toContain('מספר הזמנה: 1042');
    expect(text).toContain('- ספר בישול · כריכה קשה × 2 — 160 ₪');
    // A line with no total is priced from unit × quantity.
    expect(text).toContain('- סימניה × 1 — 10 ₪');
    expect(text).toContain('סה״כ: 190 ₪');
    expect(text).toContain('כתובת למשלוח: הרצל 1, נתניה 4250000');
    expect(text).toContain('דמי משלוח: 20 ₪');
    expect(text).toContain('זמן אספקה משוער: 2–4 ימים');
  });

  it('is right-to-left for Hebrew and Arabic only', () => {
    expect(buildOrderMail(base).html).toContain('dir="rtl"');
    expect(buildOrderMail({ ...base, locale: 'ar' }).html).toContain('dir="rtl"');
    expect(buildOrderMail({ ...base, locale: 'en' }).html).toContain('dir="ltr"');
  });

  it('a closing mail carries no delivery section', () => {
    for (const kind of ['cancelled', 'cancelledUnpaid', 'expired'] as const) {
      const m = buildOrderMail({ ...base, kind });
      expect(m.text).not.toContain('משלוח:');
      // Only "what was ordered" — no delivery heading.
      expect(m.html.match(/<h2/g)).toHaveLength(1);
    }
    expect(buildOrderMail({ ...base, kind: 'paid' }).html.match(/<h2/g)).toHaveLength(2);
  });

  it.each([...MAIL_LOCALES])('has every moment in %s, with no placeholder left over', (locale) => {
    for (const kind of ['received', 'paid', 'shipped', 'tracking', 'cancelled', 'cancelledUnpaid', 'expired'] as const) {
      const m = buildOrderMail({
        ...base,
        locale,
        kind,
        tracking: { carrier: 'DHL', number: 'AB123', url: 'https://t.example/AB123' }
      });
      expect(m.subject).toContain('1042');
      expect(m.subject).not.toMatch(/[{}]/);
      expect(m.text).not.toMatch(/\{\w+\}/);
      expect(m.html).not.toMatch(/\{\w+\}/);
      expect(m.html).toContain(`lang="${locale}"`);
    }
  });

  it('says the money was not taken yet on an arranged order', () => {
    const en = buildOrderMail({ ...base, locale: 'en', kind: 'received' });
    expect(en.subject).toBe('חנות הספרים — we got your order 1042');
    expect(en.text).toContain("You haven't been charged yet");
  });

  it('shows the tracking only once the parcel has left', () => {
    const t = { carrier: 'DHL', number: 'AB123', url: 'https://t.example/AB123' };
    const shipped = buildOrderMail({ ...base, kind: 'shipped', tracking: t });
    expect(shipped.text).toContain('מספר מעקב: AB123');
    expect(shipped.text).toContain('חברת שילוח: DHL');
    expect(shipped.html).toContain('href="https://t.example/AB123"');
    expect(buildOrderMail({ ...base, kind: 'paid', tracking: t }).text).not.toContain('AB123');
    expect(buildOrderMail({ ...base, kind: 'shipped', tracking: null }).text).not.toContain('מעקב משלוח');
  });

  it('is honest about stock on a paid order only', () => {
    expect(buildOrderMail({ ...base, oversold: true }).text).toContain('אינם במלאי כרגע');
    expect(buildOrderMail({ ...base, oversold: true, kind: 'shipped' }).text).not.toContain('אינם במלאי כרגע');
    expect(buildOrderMail(base).text).not.toContain('אינם במלאי כרגע');
  });

  it('describes pickup, digital and arranged handover', () => {
    const pickup = buildOrderMail({
      ...base,
      delivery: { ...base.delivery, preference: 'pickup', pickupPointName: 'הסניף', pickupAddress: 'בן יהודה 5, תל אביב' }
    });
    expect(pickup.text).toContain('איסוף מהסניף');
    expect(pickup.text).toContain('בן יהודה 5, תל אביב');
    expect(pickup.text).not.toContain('דמי משלוח');
    expect(buildOrderMail({ ...base, delivery: { ...base.delivery, preference: 'digital' } }).text).toContain('אין משלוח');
    expect(buildOrderMail({ ...base, delivery: { ...base.delivery, preference: 'contact' } }).text).toContain('נתאם איתך את המסירה');
  });

  it('says a pickup point works by appointment, only when it does', () => {
    const delivery = { ...base.delivery, preference: 'pickup' as const, pickupPointName: 'הסניף' };
    expect(buildOrderMail({ ...base, delivery: { ...delivery, pickupByAppointment: true } }).text).toContain('בתיאום מראש');
    expect(buildOrderMail({ ...base, delivery }).text).not.toContain('בתיאום מראש');
  });

  it('writes free delivery and a single-day estimate', () => {
    const m = buildOrderMail({ ...base, delivery: { ...base.delivery, fee: 0, etaMinDays: 1, etaMaxDays: 1 } });
    expect(m.text).toContain('דמי משלוח: ללא עלות');
    expect(m.text).toContain('זמן אספקה משוער: יום אחד');
  });

  it('says whether a reply reaches anyone', () => {
    expect(buildOrderMail({ ...base, canReply: true }).text).toContain('אפשר להשיב למייל הזה.');
    expect(buildOrderMail({ ...base, canReply: false }).text).toContain('זהו מייל אוטומטי.');
  });

  it('links the shop only when it gave a usable address', () => {
    const m = buildOrderMail(base);
    expect(m.html).toContain('href="https://shop.example/"');
    expect(m.html).toContain('href="https://wa.me/972501234567"');
    const none = buildOrderMail({ ...base, website: 'javascript:alert(1)', whatsapp: 'call me' });
    expect(none.html).not.toContain('javascript:');
    expect(none.text).not.toContain('שאלות?');
  });

  it('escapes everything a person typed', () => {
    const m = buildOrderMail({
      ...base,
      shopName: 'A<b>&"shop',
      buyerName: '<script>alert(1)</script>',
      lines: [{ name: '"><img src=x onerror=1>', optionLabel: "o'k", quantity: 1, unitPrice: 5, lineTotal: 5 }],
      delivery: { ...base.delivery, addressLine: '<i>Herzl</i> 1' }
    });
    expect(m.html).not.toContain('<script>');
    expect(m.html).not.toContain('<img');
    expect(m.html).not.toContain('<i>');
    expect(m.html).toContain('&lt;script&gt;');
    expect(m.html).toContain('&#39;');
  });

  it('keeps a subject on one line', () => {
    const m = buildOrderMail({ ...base, shopName: 'A\r\nBcc: victim@example.com', number: '1\n2' });
    expect(m.subject).not.toMatch(/[\r\n]/);
  });
});

describe('buyerFactsOf', () => {
  it('is the name, the phone and the address, on one line', () => {
    expect(buyerFactsOf({ name: 'דנה', phone: '050-1234567' }, { city: 'נתניה', street: 'הרצל', house: '1' })).toBe(
      'דנה · 050-1234567 · הרצל 1, נתניה'
    );
  });
  it('leaves out what is missing, and is empty when everything is', () => {
    expect(buyerFactsOf({ name: 'דנה', phone: null }, null)).toBe('דנה');
    expect(buyerFactsOf(null, undefined)).toBe('');
    expect(buyerFactsOf({ name: '', phone: '  ' }, 'not an address')).toBe('');
  });
  it('keeps a stranger\'s line breaks out of the notice', () => {
    expect(buyerFactsOf({ name: 'דנה\nהקונה: אחר', phone: null }, null)).not.toMatch(/[\r\n]/);
  });
});

describe('links', () => {
  it('escapes the five characters', () => {
    expect(escapeHtml(`<&>"'`)).toBe('&lt;&amp;&gt;&quot;&#39;');
  });
  it('websiteLink', () => {
    expect(websiteLink('https://a.example/x')).toBe('https://a.example/x');
    expect(websiteLink('a.example')).toBe('https://a.example/');
    expect(websiteLink('not a site')).toBeNull();
    expect(websiteLink('javascript:alert(1)')).toBeNull();
    expect(websiteLink(null)).toBeNull();
  });
  it('whatsappLink', () => {
    expect(whatsappLink('https://wa.me/972501234567')).toBe('https://wa.me/972501234567');
    expect(whatsappLink('+972 50-123 4567')).toBe('https://wa.me/972501234567');
    expect(whatsappLink('12')).toBeNull();
    expect(whatsappLink('abc 12345678')).toBeNull();
  });
});
