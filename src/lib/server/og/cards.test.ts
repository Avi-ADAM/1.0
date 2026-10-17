import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { genericCard, maagadCard, pickOffer, plain, wishCard, type MaagadCardData, type WishCardData } from './cards.js';
import { fmtPrice, ogLang, OG_LANGS } from './labels.js';
import { daysLeft as daysUntil } from '$lib/pooling/bestOffer.js';
import { renderCardPng } from './render.js';

// Set OG_PREVIEW_DIR to a folder to get every rendered card written there for a
// visual check (vitest never commits pixels; this is for a human).
const PREVIEW_DIR = process.env.OG_PREVIEW_DIR;
function keep(name: string, png: Buffer) {
  if (!PREVIEW_DIR) return;
  mkdirSync(PREVIEW_DIR, { recursive: true });
  writeFileSync(join(PREVIEW_DIR, `${name}.png`), png);
}

const NOW = Date.parse('2026-10-14T08:00:00Z');
const inDays = (n: number) => new Date(NOW + n * 86_400_000).toISOString();

/** PNG signature + IHDR width/height. */
function pngSize(buf: Buffer): { w: number; h: number } {
  expect(buf.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

const pool: MaagadCardData = {
  id: '12',
  name: 'סל ירקות אורגני שבועי בשרון',
  desc: '<p>משקי בית בנתניה והסביבה שמחפשים סל ירקות אורגני <b>ישירות מהחקלאי</b>, פעם בשבוע, בלי מתווכים.</p>',
  membersCount: 12,
  scope: 'local',
  frequency: 'weekly',
  status: 'offered',
  categories: ['מזון', 'חקלאות'],
  offersCount: 2,
  best: {
    title: 'סל ירקות עונתי',
    signedCount: 7,
    min: 10,
    max: 30,
    deadline: inDays(4),
    status: 'open',
    price: 90,
    currency: 'ILS',
    recurrence: 'weekly'
  }
};

const wish: WishCardData = {
  id: '45',
  name: 'יום חופש לאמא ליום הולדתה',
  longDes:
    'אמא שלי מטפלת בילדים כל יום ובקרוב יום הולדתה. אני רוצה לתת לה יום שלם משוחרר - טיפול ספא, ארוחה טובה, מישהי שתשגיח על הילדים.',
  ownerName: 'נעה ב.',
  proposalsCount: 6,
  startDate: inDays(30),
  locationHint: 'חיפה והקריות',
  totalBounti: 1200,
  currency: 'ILS',
  fulfilled: false,
  missionsCount: 4,
  resourcesCount: 3,
  values: ['הדדיות', 'נדיבות'],
  categories: []
};

describe('share cards', () => {
  it('renders a 1200×630 PNG for a pool with a live offer, in every language', async () => {
    for (const lang of OG_LANGS) {
      const png = await renderCardPng(maagadCard(pool, lang, NOW));
      keep(`maagad-${lang}`, png);
      expect(pngSize(png)).toEqual({ w: 1200, h: 630 });
      expect(png.length).toBeGreaterThan(10_000);
    }
  }, 60_000);

  it('renders the "looking for a supplier" pool, the reached pool and a long title', async () => {
    const noOffer = await renderCardPng(
      maagadCard({ ...pool, offersCount: 0, best: null, categories: [], frequency: null }, 'en', NOW)
    );
    keep('maagad-no-offer-en', noOffer);
    expect(pngSize(noOffer)).toEqual({ w: 1200, h: 630 });

    const reached = await renderCardPng(
      maagadCard(
        {
          ...pool,
          scope: 'global',
          name: 'Cohort workshop: ceramics for beginners — opens only if eight people sign up by the 15th',
          desc: '',
          best: { ...pool.best!, status: 'quorum_reached', signedCount: 10, min: 10, price: 25, currency: 'USD', recurrence: 'one_time' }
        },
        'en',
        NOW
      )
    );
    keep('maagad-reached-en', reached);
    expect(pngSize(reached)).toEqual({ w: 1200, h: 630 });

    const ar = await renderCardPng(
      maagadCard({ ...pool, name: 'سلة خضار عضوية أسبوعية', desc: 'أسر في المنطقة تبحث عن سلة أسبوعية مباشرة من المزارع.' }, 'ar', NOW)
    );
    keep('maagad-ar', ar);
    expect(pngSize(ar)).toEqual({ w: 1200, h: 630 });
  }, 60_000);

  it('renders a wish — with offers, with none, fulfilled — and the generic fallback', async () => {
    const he = await renderCardPng(wishCard(wish, 'he'));
    keep('wish-he', he);
    expect(pngSize(he)).toEqual({ w: 1200, h: 630 });

    const en = await renderCardPng(
      wishCard(
        { ...wish, name: 'A day off for my mother on her birthday', longDes: 'Spa, a good meal, someone to watch the kids — all arranged in advance.', ownerName: 'Noa B.', locationHint: 'Haifa', proposalsCount: 0, values: ['generosity'] },
        'en'
      )
    );
    keep('wish-none-en', en);
    expect(pngSize(en)).toEqual({ w: 1200, h: 630 });

    const done = await renderCardPng(wishCard({ ...wish, fulfilled: true, startDate: null, totalBounti: null }, 'ru'));
    keep('wish-fulfilled-ru', done);
    expect(pngSize(done)).toEqual({ w: 1200, h: 630 });

    const generic = await renderCardPng(genericCard('es', 'maagad'));
    keep('generic-es', generic);
    expect(pngSize(generic)).toEqual({ w: 1200, h: 630 });
  }, 60_000);
});

describe('card helpers', () => {
  it('pickOffer prefers activated > reached > open, then the most signatures', () => {
    const offers = [
      { id: 'a', status: 'open', signedCount: 9 },
      { id: 'b', status: 'expired', signedCount: 30 },
      { id: 'c', status: 'open', signedCount: 3 },
      { id: 'd', status: 'quorum_reached', signedCount: 5 }
    ];
    expect(pickOffer(offers)?.id).toBe('d');
    expect(pickOffer(offers.filter((o) => o.id !== 'd'))?.id).toBe('a');
    expect(pickOffer([{ status: 'withdrawn', signedCount: 2 }])).toBeNull();
  });

  it('plain() strips markup and clips with an ellipsis', () => {
    expect(plain('<p>a&nbsp;<b>b</b></p>\n c')).toBe('a b c');
    expect(plain('x'.repeat(50), 10)).toBe('xxxxxxxxx…');
    expect(plain(null)).toBe('');
  });

  it('daysUntil floors at zero and ignores bad dates', () => {
    expect(daysUntil(inDays(4), NOW)).toBe(4);
    expect(daysUntil(inDays(-2), NOW)).toBe(0);
    expect(daysUntil('nope', NOW)).toBeNull();
    expect(daysUntil(null, NOW)).toBeNull();
  });

  it('fmtPrice handles ISO codes, free-text currencies and nothing at all', () => {
    expect(fmtPrice(90, 'ILS', 'en')).toMatch(/90/);
    expect(fmtPrice(12.5, 'USD', 'en')).toMatch(/12\.50/);
    expect(fmtPrice(90, 'שקל', 'he')).toBe('90 שקל');
    expect(fmtPrice(null, 'ILS', 'he')).toBe('');
    expect(fmtPrice(7, 'XYZ1', 'es')).toBe('7 XYZ1');
  });

  it('ogLang falls back to Hebrew', () => {
    expect(ogLang('en')).toBe('en');
    expect(ogLang('EN-us')).toBe('en');
    expect(ogLang('fr')).toBe('he');
    expect(ogLang(null)).toBe('he');
  });
});
