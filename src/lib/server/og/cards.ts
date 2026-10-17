/**
 * Share cards for the public demand pages — the picture a `/maagad/<id>` or
 * `/wish/<id>` link unfurls into in WhatsApp, Telegram, X, LinkedIn, Slack…
 *
 * PLAN_MARKETING_GLOBAL §4 (loops 1 and 4): the link a member pastes to bring
 * one more signer has to sell itself — "7 of 10 signed · 4 days left" — and a
 * pool with no supplier yet is a job ad its own customers wrote. Both cards are
 * built here as satori element trees (JSX-free, so this file stays plain TS)
 * and rasterised by `render.ts`.
 *
 * Layout rules learned the hard way with satori's RTL support (0.56):
 *   - the root carries `direction` and must have NO padding; the content box is
 *     positioned absolutely instead. Padding on an RTL ancestor shifts every
 *     text run by twice its size.
 *   - a figure next to RTL words is its own node ("7" | "of 10 signed"), never
 *     a `7/10` fragment inside one string, so the bidi pass has nothing to flip.
 *   - `lineClamp` only clamps on `display: block` text.
 *   - no logical properties (`margin-inline-*`): margins are physical, and the
 *     helpers below pick the side from the language.
 */
import coinDataUrl from './coin-128.png?inline';
import { daysLeft as daysUntil } from '$lib/pooling/bestOffer.js';
import { OG_FONT_FAMILY } from './fonts.js';
import {
  fmtDay,
  fmtPrice,
  isRtlLang,
  labelsFor,
  type OgLang
} from './labels.js';

export { pickOffer } from '$lib/pooling/bestOffer.js';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** Where a card says it lives. Bare host — no scheme — reads better on the image. */
export const OG_HOST = '1lev1.com';

const INNER_W = OG_WIDTH - 128;

// Brand tokens, same as remotion/src/theme.ts (pulled from the live site).
const C = {
  navy: '#1e2145',
  navyDeep: '#14162e',
  bluesun: '#2c384a',
  green: '#5be2a9',
  greenBright: '#2effa8',
  pink: '#ff4d9e',
  gold: '#fcf6ba',
  white: '#ffffff',
  muted: 'rgba(255,255,255,0.72)',
  faint: 'rgba(255,255,255,0.12)'
};

/* ----------------------------------------------------------------------- */
/* satori element helpers                                                   */
/* ----------------------------------------------------------------------- */

export type OgNode = {
  type: string;
  props: Record<string, unknown> & { children?: OgNode | string | Array<OgNode | string> };
};

type Style = Record<string, string | number | undefined>;
type Kid = OgNode | string | null | false | undefined;

const el = (type: string, style: Style, ...children: Kid[]): OgNode => {
  const kids = children.filter((c): c is OgNode | string => c !== null && c !== false && c !== undefined);
  const props: OgNode['props'] = { style: { display: 'flex', ...style } };
  if (kids.length === 1) props.children = kids[0];
  else if (kids.length > 1) props.children = kids;
  return { type, props };
};

/** A single run of text. `clamp` lines → ellipsis (needs display:block in satori). */
const text = (s: string, style: Style = {}, clamp?: number): OgNode => ({
  type: 'div',
  props: {
    style: clamp ? { display: 'block', lineClamp: clamp, ...style } : { display: 'flex', ...style },
    children: s
  }
});

const row = (style: Style, ...children: Kid[]) =>
  el('div', { flexDirection: 'row', alignItems: 'center', ...style }, ...children);

const col = (style: Style, ...children: Kid[]) => el('div', { flexDirection: 'column', ...style }, ...children);

/** Strip tags and collapse whitespace — descriptions arrive as rich text. */
export const plain = (html: string | null | undefined, max = 180): string => {
  const s = String(html ?? '')
    // Block-level tags separate words; inline ones (<b>, <a>…) must not, or
    // "<b>farmer</b>," reads "farmer ,".
    .replace(/<\/?(?:p|div|br|li|ul|ol|h[1-6]|blockquote|tr|td|th|section|article)\b[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return [...s].length > max ? [...s].slice(0, max - 1).join('') + '…' : s;
};

const titleSize = (title: string): number => {
  const n = [...title].length;
  if (n <= 28) return 66;
  if (n <= 50) return 56;
  if (n <= 80) return 48;
  return 42;
};

/** A check mark as a path — Rubik has no ✓ glyph, and satori renders no emoji. */
const check = (color: string): OgNode => ({
  type: 'svg',
  props: {
    width: 26,
    height: 26,
    viewBox: '0 0 24 24',
    fill: 'none',
    children: {
      type: 'path',
      props: { d: 'M4 12.5l5 5L20 6.5', stroke: color, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }
    }
  }
});

/**
 * Everything that depends on the reading direction, bound once per card:
 * start/end margins and the frame, header and footer.
 */
function kit(lang: OgLang) {
  const rtl = isRtlLang(lang);
  /** Margin on the *start* side (right in RTL). */
  const ms = (px: number): Style => (rtl ? { marginRight: px } : { marginLeft: px });

  const chip = (s: string, style: Style = {}) =>
    text(s, {
      padding: '8px 18px',
      borderRadius: 999,
      background: C.faint,
      fontSize: 24,
      color: C.white,
      marginTop: 12,
      ...(rtl ? { marginLeft: 12 } : { marginRight: 12 }),
      ...style
    });

  const frame = (header: OgNode, body: OgNode, footer: OgNode): OgNode =>
    el(
      'div',
      {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        position: 'relative',
        direction: rtl ? 'rtl' : 'ltr',
        fontFamily: OG_FONT_FAMILY,
        color: C.white,
        background: `linear-gradient(135deg, ${C.bluesun} 0%, ${C.navy} 55%, ${C.navyDeep} 100%)`
      },
      // Soft brand glows — cheap depth, no image assets.
      el('div', {
        position: 'absolute',
        top: -220,
        [rtl ? 'left' : 'right']: -180,
        width: 620,
        height: 620,
        borderRadius: 999,
        background: 'radial-gradient(circle, rgba(91,226,169,0.28) 0%, rgba(91,226,169,0) 70%)'
      }),
      el('div', {
        position: 'absolute',
        bottom: -260,
        [rtl ? 'right' : 'left']: -160,
        width: 640,
        height: 640,
        borderRadius: 999,
        background: 'radial-gradient(circle, rgba(255,77,158,0.22) 0%, rgba(255,77,158,0) 70%)'
      }),
      // Thin gold rule along the top edge: the site's signature gradient.
      el('div', {
        position: 'absolute',
        top: 0,
        left: 0,
        width: OG_WIDTH,
        height: 8,
        background: 'linear-gradient(90deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)'
      }),
      col(
        {
          position: 'absolute',
          top: 52,
          left: 64,
          width: INNER_W,
          height: OG_HEIGHT - 104,
          justifyContent: 'space-between'
        },
        header,
        body,
        footer
      )
    );

  const header = (kind: string, status?: { label: string; tone: 'green' | 'pink' | 'gold' } | null): OgNode => {
    const tone = { green: C.green, pink: C.pink, gold: C.gold }[status?.tone ?? 'green'];
    return row(
      { justifyContent: 'space-between', width: '100%' },
      row(
        {},
        { type: 'img', props: { src: coinDataUrl, width: 60, height: 60, style: { borderRadius: 999 } } },
        col(
          ms(18),
          text('1lev1', { fontSize: 28, fontWeight: 700, letterSpacing: 1, direction: 'ltr' }),
          text(kind, { fontSize: 22, color: C.muted })
        )
      ),
      status
        ? row(
            { padding: '10px 22px', borderRadius: 999, border: `2px solid ${tone}` },
            check(tone),
            text(status.label, { fontSize: 24, fontWeight: 700, color: tone, ...ms(10) })
          )
        : null
    );
  };

  const footer = (lead: string, path: string): OgNode =>
    row(
      { justifyContent: 'space-between', width: '100%', alignItems: 'flex-end' },
      text(lead, { fontSize: 26, color: C.muted, maxWidth: 760 }, 1),
      text(`${OG_HOST}${path}`, { fontSize: 26, color: C.white, opacity: 0.85, direction: 'ltr' })
    );

  /** `92px figure` + words + optional muted facts, on one baseline. */
  const figure = (n: number, words: string, color: string, facts: string[] = []): OgNode =>
    row(
      { alignItems: 'baseline' },
      text(String(n), { fontSize: 92, fontWeight: 700, color, lineHeight: 1 }),
      text(words, { fontSize: 38, ...ms(18) }),
      ...facts.map((f) => text(f, { fontSize: 32, color: C.muted, ...ms(36) }))
    );

  const bar = (pct: number): OgNode =>
    el(
      'div',
      { width: '100%', height: 18, borderRadius: 999, background: C.faint, marginTop: 18 },
      el('div', {
        width: Math.max(18, Math.round(INNER_W * Math.max(0, Math.min(1, pct)))),
        height: 18,
        borderRadius: 999,
        background: `linear-gradient(90deg, ${C.greenBright}, ${C.green})`
      })
    );

  const titleBlock = (title: string, sub: string | null, chips: OgNode[], stats: OgNode): OgNode =>
    col(
      { width: '100%' },
      text(title, { fontSize: titleSize(title), fontWeight: 700, lineHeight: 1.15 }, 2),
      sub ? text(sub, { fontSize: 28, color: C.muted, marginTop: 10, lineHeight: 1.3 }, 2) : null,
      row({ flexWrap: 'wrap', marginTop: 6 }, ...chips),
      el('div', { marginTop: 26 }, stats)
    );

  return { rtl, ms, chip, frame, header, footer, figure, bar, titleBlock };
}

/* ----------------------------------------------------------------------- */
/* maagad (demand pool)                                                     */
/* ----------------------------------------------------------------------- */

export type MaagadCardOffer = {
  title: string;
  signedCount: number;
  min: number | null;
  max: number | null;
  deadline: string | null;
  status: string;
  price: number | null;
  currency: string | null;
  recurrence: string | null;
};

export type MaagadCardData = {
  id: string;
  name: string;
  desc: string;
  membersCount: number;
  scope: string;
  frequency: string | null;
  status: string;
  categories: string[];
  offersCount: number;
  /** The offer the card leads with — the furthest along (see `pickOffer`). */
  best: MaagadCardOffer | null;
};

type Rec = 'weekly' | 'biweekly' | 'monthly';
const asRec = (v: string | null | undefined): Rec | null =>
  v === 'weekly' || v === 'biweekly' || v === 'monthly' ? v : null;

export function maagadCard(d: MaagadCardData, lang: OgLang, now = Date.now()): OgNode {
  const L = labelsFor(lang);
  const k = kit(lang);
  const best = d.best;
  const reached = best?.status === 'quorum_reached' || best?.status === 'activated';
  const status =
    best?.status === 'activated'
      ? { label: L.activated, tone: 'green' as const }
      : best?.status === 'quorum_reached'
        ? { label: L.thresholdReached, tone: 'green' as const }
        : null;

  // With an offer the household count is a chip; without one it is the figure.
  const chips: OgNode[] = best ? [k.chip(`${d.membersCount} ${L.households}`)] : [];
  if (d.scope === 'global') chips.push(k.chip(L.online));
  const freq = asRec(d.frequency) ?? asRec(best?.recurrence);
  if (freq) chips.push(k.chip(L.frequency[freq]));
  for (const c of d.categories.slice(0, 2)) chips.push(k.chip(c));
  if (d.offersCount > 1) chips.push(k.chip(L.offersN(d.offersCount)));

  let stats: OgNode;
  let lead: string;
  if (best && best.min) {
    const { min, signedCount: signed } = best;
    const left = daysUntil(best.deadline, now);
    const price = fmtPrice(best.price, best.currency, lang);
    const per = asRec(best.recurrence);
    const facts: string[] = [];
    if (!reached && left != null) facts.push(left === 0 ? L.lastDay : L.daysLeft(left));
    else if (best.deadline) facts.push(L.until(fmtDay(best.deadline, lang)));
    if (price) facts.push(per ? `${price} ${L.per[per]}` : price);

    stats = col({ width: '100%' }, k.figure(signed, L.ofSigned(min), C.green, facts), k.bar(signed / min));
    lead = !reached && signed < min ? `${L.moreToGo(min - signed)} · ${L.signIndividually}` : L.signIndividually;
  } else {
    // No threshold offer yet: the pool itself is the message — demand waiting
    // for a supplier (loop 2).
    stats = col(
      { width: '100%' },
      k.figure(d.membersCount, L.households, C.green),
      text(L.lookingForSupplier, { fontSize: 34, color: C.gold, marginTop: 14, fontWeight: 700 }, 1)
    );
    lead = L.joinSoft;
  }

  const body = k.titleBlock(d.name, d.desc ? plain(d.desc, 150) : null, chips, stats);
  return k.frame(k.header(L.kindMaagad, status), body, k.footer(lead, `/maagad/${d.id}`));
}

/* ----------------------------------------------------------------------- */
/* wish (concierge)                                                         */
/* ----------------------------------------------------------------------- */

export type WishCardData = {
  id: string;
  name: string;
  longDes: string;
  ownerName: string;
  proposalsCount: number;
  startDate: string | null;
  locationHint: string | null;
  totalBounti: number | null;
  currency?: string | null;
  fulfilled: boolean;
  missionsCount: number;
  resourcesCount: number;
  values: string[];
  categories: string[];
};

export function wishCard(d: WishCardData, lang: OgLang): OgNode {
  const L = labelsFor(lang);
  const k = kit(lang);
  const status = d.fulfilled ? { label: L.fulfilled, tone: 'green' as const } : null;

  const chips: OgNode[] = [];
  if (d.ownerName) chips.push(k.chip(L.by(d.ownerName)));
  if (d.locationHint) chips.push(k.chip(d.locationHint));
  chips.push(k.chip(d.startDate ? fmtDay(d.startDate, lang) || L.flexibleDate : L.flexibleDate));
  const budget = fmtPrice(d.totalBounti, d.currency ?? null, lang);
  if (budget) chips.push(k.chip(`${L.budget} ${budget}`));
  for (const v of [...d.categories, ...d.values].slice(0, 2)) chips.push(k.chip(v, { color: C.gold }));

  const parts: string[] = [];
  if (d.missionsCount) parts.push(L.tasksN(d.missionsCount));
  if (d.resourcesCount) parts.push(L.resourcesN(d.resourcesCount));

  const stats = d.proposalsCount
    ? k.figure(d.proposalsCount, L.proposalsWord(d.proposalsCount), C.pink, parts.length ? [parts.join(' · ')] : [])
    : col(
        {},
        text(L.noProposals, { fontSize: 38, fontWeight: 700, color: C.pink }),
        parts.length ? text(parts.join(' · '), { fontSize: 32, color: C.muted, marginTop: 10 }) : null
      );

  const body = k.titleBlock(d.name, d.longDes ? plain(d.longDes, 170) : null, chips, stats);
  return k.frame(k.header(L.kindWish, status), body, k.footer(L.canYouHelp, `/wish/${d.id}`));
}

/* ----------------------------------------------------------------------- */
/* fallback                                                                 */
/* ----------------------------------------------------------------------- */

/** What a crawler gets for an id that is gone or not public: the brand, nothing else. */
export function genericCard(lang: OgLang, kind: 'maagad' | 'wish'): OgNode {
  const L = labelsFor(lang);
  const k = kit(lang);
  const body = col(
    { width: '100%' },
    text(kind === 'wish' ? L.kindWish : L.kindMaagad, { fontSize: 60, fontWeight: 700 }),
    text(L.signIndividually, { fontSize: 30, color: C.muted, marginTop: 16 })
  );
  return k.frame(k.header(L.brand), body, k.footer('', kind === 'wish' ? '/wish/new' : '/demand'));
}
