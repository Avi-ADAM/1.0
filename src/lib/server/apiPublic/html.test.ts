import { describe, expect, it } from 'vitest';
import { sanitizeDescriptionHtml } from './html.js';

const clean = (html: unknown) => sanitizeDescriptionHtml(html);

describe('sanitizeDescriptionHtml — what a description may keep', () => {
  it('keeps the formatting a rich-text description is made of', () => {
    expect(
      clean('<h2>סדנה</h2><p>שלוש <strong>שעות</strong>, <em>8</em> משתתפים</p><ul><li>א</li></ul>')
    ).toBe('<h2>סדנה</h2><p>שלוש <strong>שעות</strong>, <em>8</em> משתתפים</p><ul><li>א</li></ul>');
  });

  it('re-emits allowed tags bare — no attribute of the source survives', () => {
    expect(clean('<p class="x" style="color:red" data-a="1">hi</p>')).toBe('<p>hi</p>');
  });

  it('keeps an http(s)/mailto link and marks it as user content', () => {
    expect(clean('<a href="https://haohel.co.il" target="_blank">site</a>')).toBe(
      '<a href="https://haohel.co.il" rel="noopener nofollow ugc">site</a>'
    );
    expect(clean("<a href='mailto:a@b.co'>m</a>")).toBe(
      '<a href="mailto:a@b.co" rel="noopener nofollow ugc">m</a>'
    );
  });

  it('returns null for nothing, for non-strings, and for a tag-only shell', () => {
    expect(clean(null)).toBeNull();
    expect(clean({ type: 'doc' })).toBeNull();
    expect(clean('   ')).toBeNull();
    expect(clean('<script>x</script>')).toBeNull();
  });
});

describe('sanitizeDescriptionHtml — known payloads come out inert', () => {
  const payloads = [
    '<script>alert(1)</script>',
    '<SCRIPT SRC=//evil/x.js></SCRIPT>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)><circle/></svg>',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<a href="javascript:alert(1)">x</a>',
    '<a href="JaVaScRiPt:alert(1)">x</a>',
    '<a href="java\tscript:alert(1)">x</a>',
    '<a href="&#106;avascript:alert(1)">x</a>',
    '<a href="&#x6A;avascript&colon;alert(1)">x</a>',
    '<a href="data:text/html;base64,PHNjcmlwdD4=">x</a>',
    '<p onclick="alert(1)">x</p>',
    '<style>body{display:none}</style>',
    '<scr<script>ipt>alert(1)</script>',
    '<img src=x onerror=alert(1)//',
    '<!--<script>alert(1)</script>-->',
    '"><script>alert(1)</script>'
  ];

  for (const payload of payloads) {
    it(`neutralises ${JSON.stringify(payload)}`, () => {
      const out = clean(`<p>before</p>${payload}<p>after</p>`) ?? '';
      expect(out).not.toMatch(/<script/i);
      expect(out).not.toMatch(/<(img|svg|iframe|style)\b/i);
      expect(out).not.toMatch(/\son\w+\s*=/i);
      expect(out).not.toMatch(/href="(?!https?:|mailto:)/i);
      expect(out).not.toMatch(/javascript:/i);
      expect(out.startsWith('<p>before</p>')).toBe(true);
    });
  }

  it('escapes a "<" that never closes, so it cannot open a tag downstream', () => {
    expect(clean('a < b <img src=x onerror=alert(1)')).toBe(
      'a &lt; b &lt;img src=x onerror=alert(1)'
    );
  });
});
