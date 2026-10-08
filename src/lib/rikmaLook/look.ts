/**
 * The structured look of a rikma's public pages (docs/inprogress/PLAN_RIKMA_SUBDOMAINS.md §5).
 *
 * A look is a **layer over the real pages** — the seal, the two doors, the
 * glass panels of `/project/<id>`, `/join` and `/support` stay exactly what
 * they are; the look recolours them, adds a line under the seal, a few panels
 * between the existing ones, and decides what the two doors ask for. It never
 * swaps the page for another layout.
 *
 * `Project.look` is JSON a member proposes and the rikma approves, then every
 * visitor renders — so it is **data, never code**. No HTML, no CSS, no free
 * URL for an image: every field below is a closed choice, a length-capped line
 * of text, a colour we parse ourselves, or an https link. `parseLook` is the
 * only way in; it never throws, and anything it does not recognise becomes the
 * default. The CSS is produced from it by `tokens.ts`, out of numbers.
 *
 * Every rikma is a rikma, so the starting point is not a legal form but **what
 * the members do together** (`focus`): develop a product to sell, run a
 * business, give a social service to the public, build a community, create.
 * That picks the doors, the order of the panels and a couple of headings. The
 * legal registration, when there is one, is a separate trust detail.
 */

export const LOOK_VERSION = 1 as const;

export const FOCUSES = ['product', 'business', 'publicService', 'community', 'creative'] as const;
/** What a registration number is called; `none` hides the line. */
export const REG_KINDS = ['none', 'amuta', 'company', 'osek', 'society', 'other'] as const;
export const FONTS = ['default', 'rubik', 'heebo', 'assistant', 'noto', 'frank', 'secular'] as const;
export const CORNERS = ['round', 'soft', 'sharp'] as const;
export const BLOCK_KEYS = [
  'impact',
  'about',
  'team',
  'values',
  'missions',
  'products',
  'partners',
  'contact'
] as const;
export const CTA_KINDS = [
  'support',
  'join',
  'donate',
  'volunteer',
  'contact',
  'products',
  'link'
] as const;
export const CTA_LABELS = [
  'join',
  'support',
  'donate',
  'volunteer',
  'contact',
  'shop',
  'book',
  'website',
  'learnMore',
  'subscribe'
] as const;

export type Focus = (typeof FOCUSES)[number];
export type RegKind = (typeof REG_KINDS)[number];
export type Font = (typeof FONTS)[number];
export type Corners = (typeof CORNERS)[number];
export type BlockKey = (typeof BLOCK_KEYS)[number];
export type CtaKind = (typeof CTA_KINDS)[number];
export type CtaLabel = (typeof CTA_LABELS)[number];

export interface LookImage {
  /** Strapi upload id — the server re-resolves the url from it before saving. */
  id: string;
  url: string;
}

/** One of the two doors under the seal. */
export interface Cta {
  kind: CtaKind;
  label: CtaLabel;
  /** Only for `kind: 'link'`. */
  url: string | null;
}

export interface RikmaLook {
  v: typeof LOOK_VERSION;
  focus: Focus;
  style: {
    /** Replaces the platform gold. null = keep the gold. */
    hue: string | null;
    /** Replaces the platform pink. null = keep the pink. */
    hue2: string | null;
    font: Font;
    headingFont: Font;
    corners: Corners;
  };
  media: {
    /** A wide photo behind the seal. The seal itself shows the rikma's own picture. */
    cover: LookImage | null;
    /** Where the cover is anchored when cropped, 0..100 (%). */
    focusX: number;
    focusY: number;
  };
  profile: {
    tagline: string;
    regKind: RegKind;
    legalId: string;
    donationNote: string;
    /** A year, "2019", or ''. */
    founded: string;
  };
  stats: Array<{ value: string; label: string }>;
  partners: Array<{ name: string; url: string | null }>;
  contact: { email: string; phone: string; address: string; hours: string };
  links: {
    donate: string | null;
    reports: string | null;
    accessibility: string | null;
    booking: string | null;
  };
  /** The two doors under the seal — `primary` is the first (gold) one. */
  cta: { primary: Cta; secondary: Cta | null };
  blocks: Array<{ key: BlockKey; visible: boolean }>;
}

export const LIMITS = {
  tagline: 120,
  legalId: 30,
  donationNote: 140,
  statValue: 16,
  statLabel: 40,
  stats: 4,
  partnerName: 60,
  partners: 12,
  email: 120,
  phone: 30,
  address: 140,
  hours: 80,
  url: 300
} as const;

// ── The page without a look ────────────────────────────────────────────────

/**
 * The panels of the page as every rikma without a look has always had them,
 * in their order. The new panels (numbers, partners, contact) exist only in a
 * look, since only a look has anything to put in them.
 */
export const CLASSIC_BLOCKS: BlockKey[] = ['about', 'team', 'values', 'missions', 'products'];

/** The two doors of the page without a look. */
export const CLASSIC_DOORS: { primary: Cta; secondary: Cta } = {
  primary: { kind: 'support', label: 'support', url: null },
  secondary: { kind: 'join', label: 'join', url: null }
};

// ── Presets: a starting point per thing we do together ─────────────────────

interface Preset {
  primary: Cta;
  secondary: Cta | null;
  order: BlockKey[];
}

const cta = (kind: CtaKind, label: CtaLabel): Cta => ({ kind, label, url: null });

/**
 * Only emphasis — which doors, which panels first. Colours, type and text are
 * the members' and a preset never touches them.
 */
export const PRESETS: Record<Focus, Preset> = {
  // Developing something to sell: what it is, who builds it, come build it.
  product: {
    primary: cta('join', 'join'),
    secondary: cta('products', 'shop'),
    order: ['about', 'products', 'missions', 'impact', 'team', 'values', 'partners', 'contact']
  },
  // Running a business: what we sell and how to reach us.
  business: {
    primary: cta('contact', 'contact'),
    secondary: cta('products', 'shop'),
    order: ['about', 'products', 'impact', 'partners', 'contact', 'missions', 'team', 'values']
  },
  // A social service to the public: the cause, the proof, then the ask.
  publicService: {
    primary: cta('donate', 'donate'),
    secondary: cta('volunteer', 'volunteer'),
    order: ['impact', 'about', 'missions', 'partners', 'team', 'values', 'products', 'contact']
  },
  // A community around an idea — the page as it has always been.
  community: {
    primary: cta('support', 'support'),
    secondary: cta('join', 'join'),
    order: ['about', 'team', 'values', 'missions', 'products', 'impact', 'partners', 'contact']
  },
  // Creating together — art, content, knowledge.
  creative: {
    primary: cta('support', 'support'),
    secondary: cta('join', 'join'),
    order: ['about', 'products', 'team', 'missions', 'values', 'impact', 'partners', 'contact']
  }
};

export function defaultLook(focus: Focus = 'community'): RikmaLook {
  const p = PRESETS[focus];
  return {
    v: LOOK_VERSION,
    focus,
    style: { hue: null, hue2: null, font: 'default', headingFont: 'default', corners: 'round' },
    media: { cover: null, focusX: 50, focusY: 50 },
    profile: { tagline: '', regKind: 'none', legalId: '', donationNote: '', founded: '' },
    stats: [],
    partners: [],
    contact: { email: '', phone: '', address: '', hours: '' },
    links: { donate: null, reports: null, accessibility: null, booking: null },
    cta: { primary: { ...p.primary }, secondary: p.secondary ? { ...p.secondary } : null },
    blocks: p.order.map((key) => ({ key, visible: true }))
  };
}

/**
 * Switch what we do together the way a member means it: take that preset's
 * doors and order, keep everything they already chose, wrote and uploaded.
 */
export function applyPreset(look: RikmaLook, focus: Focus): RikmaLook {
  const fresh = defaultLook(focus);
  return { ...look, focus, cta: fresh.cta, blocks: fresh.blocks };
}

// ── Parsing ────────────────────────────────────────────────────────────────

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

function oneOf<T extends string>(list: readonly T[], v: unknown, fallback: T): T {
  return typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : fallback;
}

/**
 * One line of a member's text: control characters and the bidi *override*
 * marks are removed (they can reorder what a reader sees — a phone number that
 * displays as someone else's), whitespace is collapsed, length is capped.
 */
export function cleanLine(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v
    .replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
    .trim();
}

/** `#rgb` or `#rrggbb`, returned as lowercase `#rrggbb`; anything else is null. */
export function parseHex(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(s)) return s;
  if (/^#[0-9a-f]{3}$/.test(s)) return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  return null;
}

/** An outbound link a visitor may follow: https, a real host, no credentials. */
export function parseLink(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s || s.length > LIMITS.url) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== 'https:') return null;
    if (u.username || u.password) return null;
    if (!u.hostname.includes('.')) return null;
    return u.href;
  } catch {
    return null;
  }
}

/**
 * An image we serve: an https url (Strapi's upload provider) or the backend's
 * own `/uploads/…` path, with the upload id it came from. The server replaces
 * the url with the one Strapi reports for that id before anything is saved
 * (`resolveLookImages`), so a hand-edited url never reaches a visitor.
 */
function parseImage(v: unknown): LookImage | null {
  if (!isObj(v)) return null;
  const id = String(v.id ?? '');
  if (!/^\d{1,12}$/.test(id)) return null;
  const url = typeof v.url === 'string' ? v.url.trim() : '';
  const okUrl = /^\/uploads\/[\w.\-/]+$/.test(url) || parseLink(url) !== null;
  return okUrl ? { id, url } : null;
}

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
const PHONE = /^\+?[\d\s\-()]{6,30}$/;

function parseCta(v: unknown, fallback: Cta | null): Cta | null {
  if (!isObj(v)) return fallback;
  const kind = oneOf(CTA_KINDS, v.kind, fallback?.kind ?? 'join');
  return {
    kind,
    label: oneOf(CTA_LABELS, v.label, fallback?.label ?? 'learnMore'),
    url: kind === 'link' ? parseLink(v.url) : null
  };
}

const pct = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : fallback;
};

/**
 * Anything → a complete, safe `RikmaLook`, or null when there is no look at
 * all (null / not an object) — which means "the page as it has always been".
 */
export function parseLook(input: unknown): RikmaLook | null {
  let raw = input;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!isObj(raw)) return null;

  const focus = oneOf(FOCUSES, raw.focus, 'community');
  const base = defaultLook(focus);
  const style = isObj(raw.style) ? raw.style : {};
  const media = isObj(raw.media) ? raw.media : {};
  const profile = isObj(raw.profile) ? raw.profile : {};
  const contact = isObj(raw.contact) ? raw.contact : {};
  const links = isObj(raw.links) ? raw.links : {};
  const ctas = isObj(raw.cta) ? raw.cta : {};

  const email = cleanLine(contact.email, LIMITS.email);
  const phone = cleanLine(contact.phone, LIMITS.phone);
  const founded = cleanLine(profile.founded, 4);
  const regKind = oneOf(REG_KINDS, profile.regKind, 'none');

  const blocks: RikmaLook['blocks'] = [];
  for (const b of Array.isArray(raw.blocks) ? raw.blocks : []) {
    if (!isObj(b)) continue;
    const key = oneOf(BLOCK_KEYS, b.key, '' as BlockKey);
    if (!key || blocks.some((x) => x.key === key)) continue;
    blocks.push({ key, visible: b.visible !== false });
  }
  // A block this version does not know about yet is appended where the preset puts it.
  for (const b of base.blocks) if (!blocks.some((x) => x.key === b.key)) blocks.push(b);

  return {
    v: LOOK_VERSION,
    focus,
    style: {
      hue: parseHex(style.hue),
      hue2: parseHex(style.hue2),
      font: oneOf(FONTS, style.font, base.style.font),
      headingFont: oneOf(FONTS, style.headingFont, base.style.headingFont),
      corners: oneOf(CORNERS, style.corners, base.style.corners)
    },
    media: {
      cover: parseImage(media.cover),
      focusX: pct(media.focusX, 50),
      focusY: pct(media.focusY, 50)
    },
    profile: {
      tagline: cleanLine(profile.tagline, LIMITS.tagline),
      regKind,
      legalId: regKind === 'none' ? '' : cleanLine(profile.legalId, LIMITS.legalId),
      donationNote: cleanLine(profile.donationNote, LIMITS.donationNote),
      founded: /^\d{4}$/.test(founded) ? founded : ''
    },
    stats: (Array.isArray(raw.stats) ? raw.stats : [])
      .filter(isObj)
      .map((s) => ({
        value: cleanLine(s.value, LIMITS.statValue),
        label: cleanLine(s.label, LIMITS.statLabel)
      }))
      .filter((s) => s.value && s.label)
      .slice(0, LIMITS.stats),
    partners: (Array.isArray(raw.partners) ? raw.partners : [])
      .filter(isObj)
      .map((p) => ({ name: cleanLine(p.name, LIMITS.partnerName), url: parseLink(p.url) }))
      .filter((p) => p.name)
      .slice(0, LIMITS.partners),
    contact: {
      email: EMAIL.test(email) ? email : '',
      phone: PHONE.test(phone) ? phone : '',
      address: cleanLine(contact.address, LIMITS.address),
      hours: cleanLine(contact.hours, LIMITS.hours)
    },
    links: {
      donate: parseLink(links.donate),
      reports: parseLink(links.reports),
      accessibility: parseLink(links.accessibility),
      booking: parseLink(links.booking)
    },
    cta: {
      primary: parseCta(ctas.primary, base.cta.primary) ?? base.cta.primary,
      secondary: ctas.secondary === null ? null : parseCta(ctas.secondary, base.cta.secondary)
    },
    blocks
  };
}

export type LookIssue = 'primaryLinkMissing' | 'secondaryLinkMissing';

/**
 * What would make the page wrong rather than merely plain. A `link` door with
 * no address would be a dead door; everything else has a fallback.
 */
export function lookIssues(look: RikmaLook): LookIssue[] {
  const issues: LookIssue[] = [];
  if (look.cta.primary.kind === 'link' && !look.cta.primary.url) issues.push('primaryLinkMissing');
  if (look.cta.secondary?.kind === 'link' && !look.cta.secondary.url) {
    issues.push('secondaryLinkMissing');
  }
  return issues;
}

/** Same look, field for field? (Key order in stored JSON does not matter.) */
export function sameLook(a: RikmaLook | null, b: RikmaLook | null): boolean {
  if (!a || !b) return a === b;
  return JSON.stringify(parseLook(a)) === JSON.stringify(parseLook(b));
}

// ── Where a door goes ──────────────────────────────────────────────────────

/**
 * @param projectId - the join/support pages live under `/project/<id>/…`
 */
export function ctaHref(c: Cta, look: RikmaLook | null, projectId: string | number): string {
  switch (c.kind) {
    case 'join':
    case 'volunteer':
      return `/project/${projectId}/join`;
    case 'support':
      return `/project/${projectId}/support`;
    case 'donate':
      // A rikma with its own donation page (Israel Gives, a bank page, …) sends
      // people there; one without it uses the rikma's support page.
      return look?.links.donate ?? `/project/${projectId}/support`;
    case 'contact':
      return '#rikma-contact';
    case 'products':
      return '#rikma-products';
    case 'link':
      return c.url ?? '#';
  }
}

/** Is the destination outside 1lev1 (so it opens in a new tab, rel=noopener)? */
export const isExternalHref = (href: string) => /^https:\/\//.test(href);
