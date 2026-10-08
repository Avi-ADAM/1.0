import { describe, expect, it } from 'vitest';
import { paragraphsHtml, plainText } from './plainText';

describe('plainText / paragraphsHtml', () => {
  it('reads rich text as words, paragraphs kept', () => {
    expect(plainText('<p>אתר תדמית</p><p>עם <b>גלריה</b>&nbsp;ו&amp;בלוג</p>')).toBe('אתר תדמית\n\nעם גלריה ו&בלוג');
    expect(plainText('שורה<br>שנייה')).toBe('שורה\nשנייה');
    expect(plainText(null)).toBe('');
  });

  it('a script is text, never markup', () => {
    const html = paragraphsHtml('<script>alert(1)</script>\n\nשלום');
    expect(html).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p><p>שלום</p>');
    expect(html).not.toContain('<script>');
  });

  it('round-trips what a form edits', () => {
    const words = 'אתר תדמית\nבשתי שפות\n\nעם גלריה';
    expect(plainText(paragraphsHtml(words))).toBe(words);
  });
});
