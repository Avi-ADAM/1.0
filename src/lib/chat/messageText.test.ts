import { describe, it, expect } from 'vitest';
import { messageParts, messageText } from './messageText';

describe('messageText', () => {
  it('turns a stored <br> into a newline and keeps every other tag as text', () => {
    expect(messageText('a<br>b<BR/>c<br />d')).toBe('a\nb\nc\nd');
    expect(messageText('<img src=x onerror=alert(1)>')).toBe('<img src=x onerror=alert(1)>');
  });

  it('reads null and numbers without throwing', () => {
    expect(messageText(null)).toBe('');
    expect(messageText(undefined)).toBe('');
    expect(messageText(42)).toBe('42');
  });
});

describe('messageParts', () => {
  it('is one text run when there is no link', () => {
    expect(messageParts('שלום\nעולם')).toEqual([{ kind: 'text', text: 'שלום\nעולם' }]);
  });

  it('makes http(s) links clickable and leaves the sentence punctuation outside', () => {
    expect(messageParts('see https://1lev1.com/x?a=1. thanks')).toEqual([
      { kind: 'text', text: 'see ' },
      { kind: 'link', text: 'https://1lev1.com/x?a=1', href: 'https://1lev1.com/x?a=1' },
      { kind: 'text', text: '. thanks' }
    ]);
  });

  it('keeps a paren that belongs to the URL', () => {
    const [link] = messageParts('https://en.wikipedia.org/wiki/Tissue_(biology)');
    expect(link).toEqual({
      kind: 'link',
      text: 'https://en.wikipedia.org/wiki/Tissue_(biology)',
      href: 'https://en.wikipedia.org/wiki/Tissue_(biology)'
    });
  });

  it('never links javascript:, data: or a scheme-less address', () => {
    for (const m of ['javascript:alert(1)', 'data:text/html,<b>x</b>', 'www.example.com', '//evil.example']) {
      expect(messageParts(m).every((p) => p.kind === 'text')).toBe(true);
    }
  });

  it('stops a link at an angle bracket or a quote, so markup cannot ride inside href', () => {
    const parts = messageParts('https://a.example/"><img src=x onerror=alert(1)>');
    expect(parts[0]).toEqual({ kind: 'link', text: 'https://a.example/', href: 'https://a.example/' });
    expect(parts.slice(1).every((p) => p.kind === 'text')).toBe(true);
  });
});
