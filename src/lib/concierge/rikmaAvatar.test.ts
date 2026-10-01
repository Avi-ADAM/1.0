import { describe, expect, it } from 'vitest';
import { avatarWords, buildRikmaAvatarSvg, AVATAR_FALLBACK_WORD } from './rikmaAvatar.js';

describe('avatarWords — one or two words that name the product', () => {
  it('takes the lead clause of a wish title and drops parenthetical notes', () => {
    expect(
      avatarWords('פינת עבודה ביתית: שולחן עץ בהתאמה אישית והרכבת מחשב (בדיקת QA)')
    ).toBe('פינת עבודה');
  });

  it('skips stop words and works in other languages', () => {
    expect(avatarWords('A birthday party for my daughter')).toBe('birthday party');
    expect(avatarWords('Un viaje a Grecia, con amigos')).toBe('viaje Grecia');
  });

  it('lets a short third word ride along so the phrase still means something', () => {
    expect(avatarWords('מסיבת יום הולדת ארוכה מאוד')).toBe('מסיבת יום הולדת');
    expect(avatarWords('פינת עבודה ביתית')).toBe('פינת עבודה'); // too long for three
  });

  it('is one word when the title is one word', () => {
    expect(avatarWords('שיפוץ')).toBe('שיפוץ');
  });

  it('never returns empty — falls back to the concierge name', () => {
    expect(avatarWords('')).toBe(AVATAR_FALLBACK_WORD);
    expect(avatarWords(null)).toBe(AVATAR_FALLBACK_WORD);
    expect(avatarWords('(בלבד)')).toBe(AVATAR_FALLBACK_WORD);
    expect(avatarWords('של עם את')).toBe(AVATAR_FALLBACK_WORD);
  });

  it('cuts a single absurdly long word instead of shrinking it to dust', () => {
    const out = avatarWords('אבגדהוזחטיכלמנסעפצקרשתאבגדהוזחטיכלמנ');
    expect([...out].length).toBeLessThanOrEqual(16);
    expect(out.endsWith('…')).toBe(true);
  });
});

describe('buildRikmaAvatarSvg', () => {
  const medalHref = 'data:image/jpeg;base64,AAAA';

  it('embeds the medal and the words, right-to-left for Hebrew', () => {
    const svg = buildRikmaAvatarSvg({ words: 'פינת עבודה', medalHref });
    expect(svg).toContain(`href="${medalHref}"`);
    expect(svg).toContain('>פינת עבודה</text>');
    expect(svg).toContain('direction="rtl"');
  });

  it('is left-to-right for Latin text', () => {
    expect(buildRikmaAvatarSvg({ words: 'birthday party', medalHref })).toContain('direction="ltr"');
  });

  it('escapes whatever a member typed — the words are user text inside XML', () => {
    const svg = buildRikmaAvatarSvg({ words: '<script>alert("x")</script> & co', medalHref });
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
    expect(svg).toContain('&amp; co');
    // the quote in the title is escaped too, so it cannot end the attribute
    expect(svg).toContain('&quot;x&quot;');
  });

  it('shrinks long phrases so they stay inside the avatar circle', () => {
    const size = (w: string) =>
      Number(buildRikmaAvatarSvg({ words: w, medalHref }).match(/font-size="(\d+)"/)![1]);
    expect(size('שיפוץ')).toBeGreaterThan(size('מסיבת יום הולדת ארוכה מאוד'));
    expect(size('מסיבת יום הולדת ארוכה מאוד ומפורטת')).toBeGreaterThanOrEqual(26);
  });
});
