import { afterEach, describe, expect, it, vi } from 'vitest';
import { EDITOR_SOURCE, FRAME_SOURCE, joinLookFrame, lookFrame, shownLook } from './frame.svelte';
import { defaultLook } from './look';

/** Pretend this window is the look editor's preview frame. */
function framed() {
  const parent = { postMessage: vi.fn() };
  Object.defineProperty(window, 'parent', { value: parent, configurable: true });
  return parent;
}

function send(data: unknown, source: unknown, origin = window.location.origin) {
  window.dispatchEvent(new MessageEvent('message', { data, origin, source: source as any }));
}

describe('the preview frame', () => {
  afterEach(() => {
    Object.defineProperty(window, 'parent', { value: window, configurable: true });
  });

  it('does nothing on a page that is not in the editor’s frame', () => {
    joinLookFrame(new URL('http://x.test/project/1?lookFrame=1'));
    expect(lookFrame.active).toBe(false);
    expect(shownLook('own')).toBe('own');
  });

  it('shows the appearance it is asked for, without touching the cookies', () => {
    const parent = framed();
    const cookie = document.cookie;
    joinLookFrame(new URL(`${window.location.origin}/project/1?lookFrame=1&skin=business&shade=dark`));
    expect(lookFrame.active).toBe(true);
    const root = document.documentElement;
    expect(root.classList.contains('business')).toBe(true);
    expect(root.classList.contains('dark')).toBe(true);
    expect(parent.postMessage).toHaveBeenCalledWith(
      { source: FRAME_SOURCE, type: 'ready', path: '/project/1' },
      window.location.origin
    );

    send({ source: EDITOR_SOURCE, type: 'skin', theme: 'personal', mode: 'light' }, parent);
    expect(root.classList.contains('personal')).toBe(true);
    expect(root.classList.contains('business')).toBe(false);
    expect(root.classList.contains('dark')).toBe(false);
    expect(document.cookie).toBe(cookie);
  });

  it('renders the editor’s draft, parsed, and only from the window that framed it', () => {
    const parent = framed();
    joinLookFrame(new URL(`${window.location.origin}/project/1/join`));
    const look = defaultLook('publicService');
    look.profile.tagline = 'שלנו';

    send({ source: EDITOR_SOURCE, type: 'draft', look: { ...look, style: { hue: 'url(x)' } } }, {});
    expect(lookFrame.draft).toBeUndefined(); // not from our parent

    send({ source: EDITOR_SOURCE, type: 'draft', look }, parent, 'https://evil.example');
    expect(lookFrame.draft).toBeUndefined(); // not from our origin

    send({ source: EDITOR_SOURCE, type: 'draft', look: { ...look, style: { hue: 'url(x)' } } }, parent);
    expect(lookFrame.draft?.profile.tagline).toBe('שלנו');
    expect(lookFrame.draft?.style.hue).toBeNull();
    expect(shownLook(null)).toEqual(lookFrame.draft);

    // "Back to the page as it always was" is a draft too.
    send({ source: EDITOR_SOURCE, type: 'draft', look: null }, parent);
    expect(lookFrame.draft).toBeNull();
    expect(shownLook(defaultLook())).toBeNull();
  });
});
