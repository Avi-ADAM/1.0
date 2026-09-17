import { describe, it, expect } from 'vitest';
import { badgeMarkdown, badgeMessage, renderBadge } from './badge.js';

describe('badgeMessage', () => {
  it('invites rather than forbids', () => {
    expect(badgeMessage({ partners: 14, license: 'rikmaShared' })).toBe('rikma · 14 partners · create with us');
    expect(badgeMessage({ partners: 1, license: 'rikma' })).toBe('rikma · 1 partner · contributors are partners');
  });

  it('says nothing about a license the rikma has not chosen', () => {
    expect(badgeMessage({ partners: 3, license: null })).toBe('rikma · 3 partners');
    expect(badgeMessage({ partners: 3, license: 'bogus' })).toBe('rikma · 3 partners');
  });
});

describe('renderBadge', () => {
  it('is an accessible SVG with the text escaped', () => {
    const svg = renderBadge('1lev1', 'a <b> & "c"');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('role="img"');
    expect(svg).toContain('a &lt;b&gt; &amp; &quot;c&quot;');
    expect(svg).not.toContain('<b>');
  });

  it('grows with the message', () => {
    const width = (s: string) => Number(/width="(\d+)"/.exec(s)![1]);
    expect(width(renderBadge('1lev1', 'a much longer message'))).toBeGreaterThan(width(renderBadge('1lev1', 'short')));
  });
});

describe('badgeMarkdown', () => {
  it('links the badge to the rikma’s public page', () => {
    expect(badgeMarkdown('https://www.1lev1.com/', '12')).toBe(
      '[![1lev1 rikma](https://www.1lev1.com/api/badge/12.svg)](https://www.1lev1.com/project/12)'
    );
  });
});
