/**
 * A chat bubble shows one member's words in another member's browser, so the
 * words must never become markup there (stored XSS through the forum).
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { readable } from 'svelte/store';

// happy-dom's Web Animations abort on unmount; the bubble's `slide` is not under test.
vi.mock('svelte/transition', () => ({ slide: () => ({ duration: 0 }) }));
vi.mock('$lib/translations', () => ({
  t: readable((key: string) => key)
}));

import ChatMessage from './messeges.svelte';

const bubble = (message: string) =>
  render(ChatMessage, {
    props: {
      sentByMe: false,
      nameChatPartner: 'Dan',
      profilePicChatPartner: '',
      nameMe: 'Maya',
      message,
      timestamp: new Date().toISOString()
    }
  });

describe('chat message — member text is never HTML', () => {
  it('renders <img onerror> inert, as the characters typed', () => {
    const payload = '<img src=x onerror=alert(1)>';
    const { container, getByText } = bubble(payload);
    // Only the sender's avatar is an <img>; the payload made none.
    const imgs = [...container.querySelectorAll('img')];
    expect(imgs).toHaveLength(1);
    expect(imgs[0].getAttribute('alt')).toBe('pic');
    expect(container.querySelector('[onerror]')).toBeNull();
    expect(getByText(payload)).toBeTruthy();
  });

  it('renders <script> and a javascript: link as text', () => {
    const { container } = bubble('<script>alert(1)</script><a href="javascript:alert(1)">x</a>');
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
    expect(container.textContent).toContain('<script>alert(1)</script>');
  });

  it('keeps line breaks and makes only http(s) links clickable', () => {
    const { container } = bubble('line one<br>see https://1lev1.com/forum/5.');
    const links = [...container.querySelectorAll('a')];
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('https://1lev1.com/forum/5');
    expect(links[0].getAttribute('rel')).toContain('noopener');
    expect(container.querySelector('.whitespace-pre-line')?.textContent).toBe(
      'line one\nsee https://1lev1.com/forum/5.'
    );
  });
});
