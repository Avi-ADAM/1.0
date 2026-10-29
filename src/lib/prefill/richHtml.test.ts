import { describe, expect, it } from 'vitest';
import { keepRichHtml, textToParagraphs } from './richHtml';

describe('keepRichHtml', () => {
  it('keeps the structure the editor can show', () => {
    const html = '<h2>מה</h2><p>אנחנו <strong>בונים</strong> <em>יחד</em></p><ul><li>א</li><li>ב</li></ul>';
    expect(keepRichHtml(html)).toBe(html);
  });

  it('drops scripts and styles with what is inside them', () => {
    expect(keepRichHtml('<p>a</p><script>alert(1)</script><style>p{}</style><p>b</p>')).toBe('<p>a</p><p>b</p>');
  });

  it('strips every attribute, and unsafe links', () => {
    expect(keepRichHtml('<p onclick="x()" class="c">t</p>')).toBe('<p>t</p>');
    expect(keepRichHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>');
    expect(keepRichHtml('<a href="https://1lev1.com" onclick="x">x</a>')).toBe(
      '<a href="https://1lev1.com" rel="noopener noreferrer">x</a>'
    );
  });

  it('maps headings and old emphasis onto the allowed set, and unwraps the rest', () => {
    expect(keepRichHtml('<h1>A</h1><h4>B</h4><b>c</b><i>d</i><div><span>e</span></div>')).toBe(
      '<h2>A</h2><h3>B</h3><strong>c</strong><em>d</em>e'
    );
  });

  it('escapes a bare "<" so it cannot open a tag later', () => {
    expect(keepRichHtml('<p>2 < 3 <img src=x onerror=alert(1)></p>')).toBe('<p>2 &lt; 3 </p>');
  });

  it('cuts a long text at the last closed block', () => {
    const p = '<p>' + 'x'.repeat(40) + '</p>';
    const out = keepRichHtml(p.repeat(10), 100);
    expect(out).toBe(p + p);
  });

  it('returns empty for nothing', () => {
    expect(keepRichHtml('')).toBe('');
    expect(keepRichHtml(undefined as unknown as string)).toBe('');
  });
});

describe('textToParagraphs', () => {
  it('turns blank-line paragraphs into <p> and escapes markup', () => {
    expect(textToParagraphs('one\n\ntwo <b>\nthree')).toBe('<p>one</p><p>two &lt;b><br>three</p>');
  });
});
