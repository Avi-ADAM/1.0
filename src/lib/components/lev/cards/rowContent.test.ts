/**
 * The list view and the card swiper render the same items through the same
 * `<LevCard>`, so *which* items appear can never diverge. What can diverge is
 * what a row manages to say about one: the row builds its own text off the
 * DisplayItem, and a kind nobody wrote a builder for used to come out as a
 * project name and a blank body.
 *
 * These tests close that: every `ani` LevCard can render gets walked, given a
 * representative item, and checked for a title, a kind label, a CTA and figures
 * whose translation keys actually exist — in all five locales, not just Hebrew.
 */
import { describe, it, expect } from 'vitest';
import {
  RENDERABLE_ANIS,
  rowContent,
  rowKindKey,
  rowCtaKey,
  kindAccent
} from './cardKinds.js';

import he from '$lib/translations/he/lev.json';
import en from '$lib/translations/en/lev.json';
import ar from '$lib/translations/ar/lev.json';
import ru from '$lib/translations/ru/lev.json';
import es from '$lib/translations/es/lev.json';

const LOCALES: Record<string, any> = { he, en, ar, ru, es };

/** `lev.list.kind.pends` → the string at `list.kind.pends` in a lev.json. */
function lookup(bundle: any, key: string): unknown {
  // The bundles are the `lev` namespace itself, so drop the leading `lev.`.
  const path = key.replace(/^lev\./, '').split('.');
  return path.reduce((acc, part) => (acc == null ? acc : acc[part]), bundle);
}

/**
 * One item per kind, carrying the fields its processor actually produces (see
 * levProcessors). Deliberately minimal: if a builder needs a field that is not
 * here, it should still produce a title from the fallbacks.
 */
const SAMPLES: Record<string, any> = {
  haluk: { name: 'חלוקת רווחי אוגוסט', hervach: 4200, halukot: [{}, {}], noofusers: 3 },
  sheirutp: { name: 'ייעוץ תזונה', username: 'דנה', price: 250, quant: 2, total: 500 },
  sale: { name: 'סדנת אפייה', customerName: 'יוסי', price: 180, quant: 4, total: 720 },
  buy: { name: 'חומרי גלם', projectName: 'מאפיית השכונה', price: 90, quant: 3, total: 270 },
  // Real shape: `kind` is the direction, and `shear`/`hervachti` are component
  // arrays off the transfer's tosplit — never text.
  vidu: {
    kind: 'send',
    sendname: 'רותי',
    resname: 'עמית',
    amount: 1200,
    shear: [{}, {}],
    hervachti: [{ id: 1, amount: 600 }]
  },
  mtaha: {
    name: 'עיצוב האתר',
    descrip: 'מסך הבית והניווט',
    howmanyhoursalready: 12,
    hoursassinged: 40,
    perhour: 120
  },
  pmashes: { name: 'מחשב נייד', descrip: 'לצוות הפיתוח', hm: 2, price: 4000, easy: 8000 },
  pends: { name: 'כתיבת תוכן', descrip: 'עשרה מאמרים', noofhours: 20, perhour: 150 },
  wegets: { nameRaw: 'ארגזי ירקות', username: 'נועה', hm: 10, price: 60, easy: 600 },
  fiapp: { nameRaw: 'תיקון הצנרת', username: 'איתי', nhours: 6, perhour: 200 },
  walcomen: { username: 'מיכל', details: 'ברוכה הבאה לרקמה', projectName: 'גינת הקהילה' },
  askedcoin: { username: 'תמר', openName: 'ניהול קהילה', nhours: 15, perhour: 130 },
  askedm: { username: 'שי', openName: 'הגברה לאירוע', price: 900, myp: 1, easy: 900 },
  meData: { name: 'צילום מוצרים', descrip: 'יום צילום בסטודיו', noofhours: 8, perhour: 250 },
  huca: { mashname: 'רמקולים', descrip: 'זוג רמקולים מוגברים', price: 700, myp: 2, easy: 1400 },
  archObject: {
    archive: {
      targetName: 'משימת הניקיון',
      targetKind: 'missionInProgress',
      accruedHours: 4,
      standingOrder: 2
    }
  },
  stipend: {
    stipend: {
      recipientName: 'אורי',
      funderName: 'הדס',
      kind: 'stipendPledge',
      standingOrder: 1,
      standing: { stipendRate: 45 }
    }
  },
  hachla: { kind: 'pubdes', projectName: 'רקמת הלחם' },
  wishoffer: { volunteerName: 'ליאור', missionName: 'הסעה לבית החולים', hours: 3 },
  sitesharepay: { amount: 320, rikmaName: 'רקמת הלחם' },
  stipendpay: { recipientName: 'אורי', hours: 42, amount: 2100, stipendRate: 50 },
  stipendconfirm: { funderName: 'הדס', amount: 2100, hours: 42, stipendRate: 50 },
  sitesharedecide: { proposedAmount: 320, basisAmount: 6400 }
};

const base = (ani: string) => ({
  ani,
  coinlapach: `${ani}-1`,
  projectId: '7',
  projectName: 'רקמת הלחם',
  pl: 100,
  ...(SAMPLES[ani] ?? {})
});

describe('every renderable kind has row content', () => {
  it('covers each ani LevCard can render — no kind is list-only or card-only', () => {
    // Guards the premise: if a kind is added to LevCard and to RENDERABLE but
    // nobody writes a sample here, this fails rather than silently skipping it.
    for (const ani of RENDERABLE_ANIS) {
      expect(SAMPLES, `no sample item for "${ani}"`).toHaveProperty(ani);
    }
  });

  it.each(RENDERABLE_ANIS)('%s renders a title, a kind and a CTA', (ani) => {
    const item = base(ani);
    const content = rowContent(item);

    const title =
      content.title?.text ?? (content.title?.key ? lookup(he, content.title.key) : '');
    expect(title, `"${ani}" produced no title`).toBeTruthy();

    expect(lookup(he, content.kindKey), `"${ani}" has no kind label`).toBeTruthy();
    expect(lookup(he, rowCtaKey(item)), `"${ani}" has no CTA label`).toBeTruthy();
    expect(kindAccent(ani)).toMatch(/^(var\(|#)/);
  });

  it.each(RENDERABLE_ANIS)('%s only emits fact keys that exist', (ani) => {
    for (const fact of rowContent(base(ani)).facts) {
      const key = `lev.list.fact.${fact.key}`;
      expect(lookup(he, key), `"${ani}" emits an unknown fact "${fact.key}"`).toBeTruthy();
      // The chips are `{{value}}` interpolations; a single-brace placeholder or
      // a name under two characters renders as the empty string (see the i18n
      // notes in CLAUDE.md), so assert the shape as well as the presence.
      expect(String(lookup(he, key))).toContain('{{value}}');
    }
  });

  it.each(RENDERABLE_ANIS)('%s has a subtitle that resolves', (ani) => {
    const { subtitle } = rowContent(base(ani));
    if (!subtitle) return; // a kind with nothing to add is allowed to say nothing
    if (subtitle.key) expect(lookup(he, subtitle.key) ?? subtitle.key).toBeTruthy();
    else expect(subtitle.text).toBeTruthy();
  });

  // Half of these payload fields are Strapi relations or component arrays. A
  // builder that drops one into a text slot renders the literal string
  // "[object Object]" on the row, which is exactly what the transfer row did
  // with the tosplit's `hervachti`.
  it.each(RENDERABLE_ANIS)('%s never stringifies an object into its text', (ani) => {
    const { title, subtitle } = rowContent(base(ani));
    for (const slot of [title, subtitle]) {
      expect(slot?.text ?? '').not.toContain('[object');
      for (const v of Object.values(slot?.params ?? {})) {
        expect(typeof v === 'object' && v !== null, `${ani} passes an object as a param`).toBe(
          false
        );
      }
    }
  });
});

describe('a transfer row', () => {
  it('says which side of it the user is on instead of naming the split', () => {
    expect(rowContent({ ...base('vidu'), kind: 'send' }).subtitle).toEqual({
      key: 'lev.list.sub.transferSend',
      params: undefined
    });
    expect(rowContent({ ...base('vidu'), kind: 'recive' }).subtitle).toEqual({
      key: 'lev.list.sub.transferRecive',
      params: undefined
    });
    expect(rowContent({ ...base('vidu'), kind: undefined }).subtitle).toEqual({
      key: 'lev.list.sub.transfer',
      params: undefined
    });
  });

  it('counts the split rows rather than stringifying them', () => {
    const facts = rowContent(base('vidu')).facts;
    expect(facts).toContainEqual({ key: 'shares', value: 2 });
    expect(facts).toContainEqual({ key: 'amount', value: 1200 });
  });
});

describe('the new keys exist in every locale', () => {
  const keys = [
    ...RENDERABLE_ANIS.map((ani) => rowKindKey(base(ani))),
    ...RENDERABLE_ANIS.map((ani) => rowCtaKey(base(ani))),
    ...['vote', 'answer', 'pay', 'confirm', 'view'].map((k) => `lev.list.cta.${k}`),
    ...['chat', 'project'].map((k) => `lev.list.act.${k}`),
    // The countdown, shown by the row and by the coin. `over` is what a passed
    // deadline reads as, and each unit carries its own singular because no
    // locale here agrees with a bare "{{count}} ימים" at one.
    ...['over', 'd', 'h', 'm', 's', 'dOne', 'hOne', 'mOne', 'sOne'].map(
      (k) => `lev.list.time.${k}`
    ),
    // The coin field's own chrome: the return-to-heart button and the three-step
    // size control, which is the answer to "older members cannot read this".
    'lev.coins.center',
    ...['label', 's', 'm', 'l'].map((k) => `lev.coins.size.${k}`),
    ...['transfer', 'transferSend', 'transferRecive'].map((k) => `lev.list.sub.${k}`),
    ...[
      'hours',
      'hoursDone',
      'rate',
      'amount',
      'qty',
      'price',
      'profit',
      'shares',
      'members',
      'round',
      'basis',
      'transfers'
    ].map((k) => `lev.list.fact.${k}`)
  ];

  it.each(Object.keys(LOCALES))('%s carries all of them', (locale) => {
    const missing = [...new Set(keys)].filter((k) => !lookup(LOCALES[locale], k));
    expect(missing).toEqual([]);
  });
});

describe('sub-kinds get their own label', () => {
  it('separates site-share income from an ordinary sale', () => {
    expect(rowKindKey({ ani: 'sale' })).toBe('lev.list.kind.sale');
    expect(rowKindKey({ ani: 'sale', isSiteShareIncome: true })).toBe(
      'lev.list.kind.saleIncome'
    );
  });

  it('separates an edit and a release from an archive', () => {
    expect(rowKindKey({ ani: 'archObject', archive: {} })).toBe(
      'lev.list.kind.archObject'
    );
    expect(rowKindKey({ ani: 'archObject', archive: { kind: 'editObject' } })).toBe(
      'lev.list.kind.editObject'
    );
    expect(rowKindKey({ ani: 'archObject', archive: { scope: 'release' } })).toBe(
      'lev.list.kind.releaseObject'
    );
  });

  it('names the decision instead of showing a bare project name', () => {
    expect(rowContent({ ani: 'hachla', kind: 'timtoM' }).title).toEqual({
      key: 'lev.list.decision.timtoM',
      params: undefined
    });
    expect(
      rowContent({ ani: 'hachla', kind: 'saleClaim', saleClaim: { productName: 'עוגה' } })
        .title
    ).toEqual({ text: 'עוגה' });
  });
});

describe('the CTA follows what the item wants', () => {
  it('names the pending act', () => {
    expect(rowCtaKey({ ani: 'pends', pl: 100 })).toBe('lev.list.cta.vote');
    expect(rowCtaKey({ ani: 'stipendpay', pl: 100 })).toBe('lev.list.cta.pay');
    expect(rowCtaKey({ ani: 'wegets', pl: 100 })).toBe('lev.list.cta.answer');
    expect(rowCtaKey({ ani: 'vidu', pl: 100 })).toBe('lev.list.cta.confirm');
  });

  it('drops to "view" once the item no longer wants anything', () => {
    expect(rowCtaKey({ ani: 'pends', pl: 100, already: true })).toBe('lev.list.cta.view');
    expect(rowCtaKey({ ani: 'pends', pl: 900 })).toBe('lev.list.cta.view');
  });
});
