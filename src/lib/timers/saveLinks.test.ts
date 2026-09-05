import { describe, it, expect } from 'vitest';
import {
  normalizeSaveLink,
  normalizeSaveLinks,
  parseSaveLinks,
  saveLinkLabel,
  serializeSaveLinks,
  SAVE_LINKS_MAX,
  SAVE_LINKS_MAX_CHARS
} from './saveLinks.js';

describe('normalizeSaveLink', () => {
  it('keeps an http(s) url as it is', () => {
    expect(normalizeSaveLink('https://github.com/Avi-ADAM/1.0/pull/482')).toBe(
      'https://github.com/Avi-ADAM/1.0/pull/482'
    );
  });

  it('promotes a scheme-less host, because that is a typo and not a protocol choice', () => {
    expect(normalizeSaveLink('1lev1.com/moach')).toBe('https://1lev1.com/moach');
  });

  it.each(['javascript:alert(1)', 'data:text/html,<script>x</script>', 'mailto:a@b.com', 'file:///etc/passwd'])(
    'refuses %s — these render as links other members click',
    (value) => {
      expect(normalizeSaveLink(value)).toBeNull();
    }
  );

  it('refuses what is not a url at all', () => {
    expect(normalizeSaveLink('worked on the login page')).toBeNull();
    expect(normalizeSaveLink('   ')).toBeNull();
    expect(normalizeSaveLink(null)).toBeNull();
    expect(normalizeSaveLink(42)).toBeNull();
  });
});

describe('parseSaveLinks', () => {
  it('splits the stored string on newlines, spaces and commas', () => {
    expect(parseSaveLinks('https://a.com\nhttps://b.com https://c.com,https://d.com')).toEqual([
      'https://a.com',
      'https://b.com',
      'https://c.com',
      'https://d.com'
    ]);
  });

  it('is empty for nothing', () => {
    expect(parseSaveLinks('')).toEqual([]);
    expect(parseSaveLinks(null)).toEqual([]);
  });
});

describe('normalizeSaveLinks', () => {
  it('de-dupes while keeping the order the member added them in', () => {
    expect(
      normalizeSaveLinks(['https://b.com/', 'https://a.com/', 'https://b.com/'])
    ).toEqual(['https://b.com/', 'https://a.com/']);
  });

  it('drops the links that are not http(s) and keeps the rest', () => {
    expect(
      normalizeSaveLinks(['https://ok.com/', 'javascript:alert(1)', 'https://fine.com/'])
    ).toEqual(['https://ok.com/', 'https://fine.com/']);
  });

  it(`keeps at most ${SAVE_LINKS_MAX} links`, () => {
    const many = Array.from({ length: SAVE_LINKS_MAX + 3 }, (_, i) => `https://a.com/${i}`);
    expect(normalizeSaveLinks(many)).toHaveLength(SAVE_LINKS_MAX);
  });

  it('refuses the link that would not fit the column rather than storing half of it', () => {
    const long = `https://a.com/${'x'.repeat(200)}`;
    const kept = normalizeSaveLinks([long, `https://b.com/${'y'.repeat(200)}`]);
    expect(kept).toEqual([long]);
    expect(serializeSaveLinks(kept).length).toBeLessThanOrEqual(SAVE_LINKS_MAX_CHARS);
  });

  it('round-trips through the stored string', () => {
    const links = ['https://a.com/one', 'https://b.com/two'];
    expect(normalizeSaveLinks(serializeSaveLinks(links))).toEqual(links);
  });
});

describe('saveLinkLabel', () => {
  it('names the host plus the last segment, which is what tells two PRs apart', () => {
    expect(saveLinkLabel('https://github.com/Avi-ADAM/1.0/pull/482')).toBe('github.com/482');
  });

  it('falls back to the host alone', () => {
    expect(saveLinkLabel('https://www.1lev1.com/')).toBe('1lev1.com');
  });

  it('gives back whatever it was handed when that is not a url', () => {
    expect(saveLinkLabel('not a url')).toBe('not a url');
  });
});
