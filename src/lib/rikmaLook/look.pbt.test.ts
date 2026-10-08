import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  BLOCK_KEYS,
  CLASSIC_BLOCKS,
  FOCUSES,
  applyPreset,
  ctaHref,
  defaultLook,
  lookIssues,
  parseHex,
  parseLink,
  parseLook,
  sameLook,
  type RikmaLook
} from './look.js';
import { contrast, hexToOklch, oklchToHex } from './color.js';
import { CLASSIC_SKIN, fontHref, skinColors, skinVars, surfacesOf } from './tokens.js';

const hexArb = fc
  .tuple(fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }))
  .map(([r, g, b]) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`);

describe('parseLook', () => {
  it('returns null for no look, and never throws on anything', () => {
    expect(parseLook(null)).toBeNull();
    expect(parseLook('not json')).toBeNull();
    expect(parseLook([])).toBeNull();
    fc.assert(
      fc.property(fc.anything(), (v) => {
        const r = parseLook(v);
        return r === null || r.v === 1;
      })
    );
  });

  it('is a fixed point: parsing a parsed look changes nothing', () => {
    fc.assert(
      fc.property(fc.object({ maxDepth: 3 }), fc.constantFrom(...FOCUSES), (junk, focus) => {
        const once = parseLook({ ...junk, focus });
        return JSON.stringify(parseLook(once)) === JSON.stringify(once);
      })
    );
  });

  it('keeps every block exactly once', () => {
    const look = parseLook({
      blocks: [
        { key: 'about', visible: false },
        { key: 'about' },
        { key: 'nope' },
        { key: 'team', visible: true }
      ]
    })!;
    expect(look.blocks.map((b) => b.key).sort()).toEqual([...BLOCK_KEYS].sort());
    expect(look.blocks[0]).toEqual({ key: 'about', visible: false });
    expect(look.blocks[1]).toEqual({ key: 'team', visible: true });
  });

  it('refuses code, foreign urls and spoofing characters', () => {
    const look = parseLook({
      style: { hue: 'red; background:url(x)', hue2: 'expression(x)' },
      media: { cover: { id: '6', url: 'http://plain.example/x.png' } },
      profile: { tagline: 'Hello\u202eevil\u0000 <b>x</b>', regKind: 'amuta', legalId: '58-000' },
      links: { donate: 'http://insecure.example', reports: 'https://user:pw@x.example', accessibility: 'https://ok.example/a11y' },
      partners: [{ name: 'A', url: 'javascript:x' }],
      contact: { email: 'not-an-email', phone: '<script>' },
      cta: { primary: { kind: 'link', label: 'website', url: 'data:text/html,x' } }
    })!;
    expect(look.style.hue).toBeNull();
    expect(look.style.hue2).toBeNull();
    expect(look.media.cover).toBeNull();
    expect(look.profile.tagline).toBe('Hello evil <b>x</b>'); // text is rendered as text, never as HTML
    expect(look.profile.legalId).toBe('58-000');
    expect(look.links.donate).toBeNull();
    expect(look.links.reports).toBeNull();
    expect(look.links.accessibility).toBe('https://ok.example/a11y');
    expect(look.partners[0].url).toBeNull();
    expect(look.contact).toMatchObject({ email: '', phone: '' });
    expect(look.cta.primary.url).toBeNull();
    expect(lookIssues(look)).toContain('primaryLinkMissing');
  });

  it('a registration number needs a kind of registration', () => {
    expect(parseLook({ profile: { legalId: '58-000' } })!.profile.legalId).toBe('');
    expect(parseLook({ profile: { regKind: 'bogus', legalId: '1' } })!.profile.regKind).toBe('none');
  });

  it('accepts our own uploads', () => {
    const look = parseLook({ media: { cover: { id: '13', url: '/uploads/c_abc.webp' } } })!;
    expect(look.media.cover).toEqual({ id: '13', url: '/uploads/c_abc.webp' });
  });

  it('caps lists and lengths', () => {
    const look = parseLook({
      stats: Array.from({ length: 9 }, (_, i) => ({ value: String(i), label: 'x'.repeat(99) })),
      partners: Array.from({ length: 30 }, (_, i) => ({ name: `p${i}` }))
    })!;
    expect(look.stats).toHaveLength(4);
    expect(look.stats[0].label).toHaveLength(40);
    expect(look.partners).toHaveLength(12);
  });
});

describe('presets', () => {
  it('give every focus a complete, issue-free look that keeps the platform colours', () => {
    for (const f of FOCUSES) {
      const look = defaultLook(f);
      expect(parseLook(look)).toEqual(look);
      expect(lookIssues(look)).toEqual([]);
      expect(look.style.hue).toBeNull();
      expect(skinVars(look)).toBe('');
    }
  });

  it('a community starts from the page as it has always been', () => {
    const look = defaultLook('community');
    expect(look.blocks.slice(0, CLASSIC_BLOCKS.length).map((b) => b.key)).toEqual(CLASSIC_BLOCKS);
    expect(look.cta.primary.kind).toBe('support');
    expect(look.cta.secondary?.kind).toBe('join');
  });

  it('a social service asks for donations; a business for contact', () => {
    expect(defaultLook('publicService').cta.primary.kind).toBe('donate');
    expect(defaultLook('business').cta.primary.kind).toBe('contact');
  });

  it('switching focus keeps what the members wrote and chose', () => {
    const mine: RikmaLook = { ...defaultLook('community'), profile: { ...defaultLook().profile, tagline: 'שלנו' } };
    mine.style.hue = '#123456';
    const next = applyPreset(mine, 'publicService');
    expect(next.profile.tagline).toBe('שלנו');
    expect(next.style.hue).toBe('#123456');
    expect(next.cta.primary.kind).toBe('donate');
    expect(sameLook(next, parseLook(next))).toBe(true);
  });
});

describe('ctaHref', () => {
  it('sends donate to the rikma’s own page when it has one', () => {
    const look = defaultLook('publicService');
    expect(ctaHref(look.cta.primary, look, 7)).toBe('/project/7/support');
    look.links.donate = 'https://give.example/us';
    expect(ctaHref(look.cta.primary, look, 7)).toBe('https://give.example/us');
  });
});

describe('colour math', () => {
  it('parses hex and links strictly', () => {
    expect(parseHex('#ABC')).toBe('#aabbcc');
    expect(parseHex('red')).toBeNull();
    expect(parseLink('https://x.example/a?b=1')).toBe('https://x.example/a?b=1');
    expect(parseLink('https://localhost')).toBeNull();
  });

  it('round-trips sRGB through OKLCH', () => {
    fc.assert(
      fc.property(hexArb, (hex) => {
        const back = oklchToHex(hexToOklch(hex));
        const [a, b] = [hex, back].map((h) => parseInt(h.slice(1), 16));
        return [16, 8, 0].every((s) => Math.abs(((a >> s) & 255) - ((b >> s) & 255)) <= 1);
      })
    );
  });

  it('no look, no colours: the pages keep exactly what they always painted', () => {
    expect(skinColors(null)).toEqual(CLASSIC_SKIN);
    expect(skinVars(null)).toBe('');
  });

  it('every colour a look can produce reads on the page', () => {
    fc.assert(
      fc.property(fc.option(hexArb, { nil: null }), fc.option(hexArb, { nil: null }), (hue, hue2) => {
        const look = parseLook({ style: { hue, hue2 } })!;
        const s = skinColors(look);
        for (const bg of surfacesOf(s)) {
          if (contrast('#ffffff', bg) < 7) return false; // body text
          if (hue && (contrast(s.gold, bg) < 4.5 || contrast(s.goldSoft, bg) < 4.5)) return false;
          if (hue2 && (contrast(s.barbi, bg) < 4.5 || contrast(s.barbiSoft, bg) < 4.5)) return false;
        }
        if (hue && [s.gold, s.gold2, s.gold3].some((f) => contrast(f, s.onGold) < 4.5)) return false;
        if (hue2 && [s.barbi, s.barbi2].some((f) => contrast(f, s.onBarbi) < 4.5)) return false;
        return true;
      }),
      { numRuns: 300 }
    );
  });

  it('skinVars is only custom properties built from our own values', () => {
    fc.assert(
      fc.property(fc.object({ maxDepth: 3 }), hexArb, hexArb, (junk, hue, hue2) => {
        const look = parseLook({ ...junk, style: { ...(junk as any).style, hue, hue2 } });
        if (!look) return true;
        const style = skinVars(look);
        return (
          !/[<>{}"\\]|url\(|expression|@import/i.test(style) &&
          style.split(';').every((decl) => /^--[a-z0-9-]+:[#a-z0-9 .,'-]+$/i.test(decl)) &&
          style.includes('--pp-gold:') &&
          style.includes('--pp-barbi:')
        );
      })
    );
  });

  it('loads only the faces it needs', () => {
    const look = defaultLook('community');
    expect(fontHref(look)).toBeNull();
    look.style.font = 'heebo';
    look.style.headingFont = 'frank';
    expect(fontHref(look)).toBe(
      'https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800&family=Frank+Ruhl+Libre:wght@400;700;900&display=swap'
    );
  });
});
