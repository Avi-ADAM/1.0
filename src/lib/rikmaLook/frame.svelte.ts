/**
 * The look editor's live preview is the real public pages in an iframe
 * (docs/inprogress/PLAN_RIKMA_SUBDOMAINS.md §5.5): `/project/<id>`, `/join`
 * and `/support`, rendered by the very components a visitor gets. This module
 * is the page side of that frame.
 *
 * Opened with `?lookFrame=1` inside a frame, a public page:
 *  - renders the editor's **draft** look instead of the saved one;
 *  - renders as a guest sees it (no member header, the guest invitation);
 *  - shows the appearance the editor asks for — personal/business ×
 *    light/dark — by setting the classes on its own `<html>` directly. It
 *    never writes the `theme` / `mode` cookies: those are the member's own
 *    choice and the frame shares them with the editor around it.
 *
 * Messages are taken only from the window that framed us, on our own origin;
 * a draft is a `RikmaLook` and goes through `parseLook` like any other.
 */

import { parseLook, type RikmaLook } from './look.js';

export const FRAME_PARAM = 'lookFrame';
export const EDITOR_SOURCE = 'rikma-look-editor';
export const FRAME_SOURCE = 'rikma-look-frame';

export type FrameTheme = 'personal' | 'business';
export type FrameMode = 'light' | 'dark';

export type EditorMessage =
  | { source: typeof EDITOR_SOURCE; type: 'draft'; look: unknown }
  | { source: typeof EDITOR_SOURCE; type: 'skin'; theme: FrameTheme; mode: FrameMode };

export type FrameMessage = { source: typeof FRAME_SOURCE; type: 'ready'; path: string };

export const lookFrame = $state<{ active: boolean; draft: RikmaLook | null | undefined }>({
  active: false,
  draft: undefined
});

/** The look a public page shows: the editor's draft inside the preview, otherwise its own. */
export function shownLook<T>(own: T): RikmaLook | T | null {
  return lookFrame.active && lookFrame.draft !== undefined ? lookFrame.draft : own;
}

let listening = false;

function applySkin(theme: FrameTheme, mode: FrameMode) {
  const root = document.documentElement;
  root.classList.remove('personal', 'business');
  root.classList.add(theme);
  root.classList.toggle('dark', mode === 'dark');
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-mode', mode);
  root.style.colorScheme = mode;
}

const asTheme = (v: unknown): FrameTheme | null => (v === 'personal' || v === 'business' ? v : null);
const asMode = (v: unknown): FrameMode | null => (v === 'light' || v === 'dark' ? v : null);

/**
 * Called by every public page on mount. Outside the editor's frame it does
 * nothing; inside it, it starts listening (once) and tells the editor which
 * page is showing, so the editor sends the draft and the appearance again.
 */
export function joinLookFrame(url: URL): void {
  if (typeof window === 'undefined' || window.parent === window) return;
  if (!lookFrame.active && !url.searchParams.has(FRAME_PARAM)) return;
  lookFrame.active = true;

  if (!listening) {
    listening = true;
    // The first paint already carries the appearance asked for in the address.
    const theme = asTheme(url.searchParams.get('skin'));
    const mode = asMode(url.searchParams.get('shade'));
    if (theme && mode) applySkin(theme, mode);

    window.addEventListener('message', (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      const m = e.data as EditorMessage | null;
      if (!m || m.source !== EDITOR_SOURCE) return;
      if (m.type === 'draft') {
        lookFrame.draft = parseLook(m.look);
      } else if (m.type === 'skin') {
        const t = asTheme(m.theme);
        const md = asMode(m.mode);
        if (t && md) applySkin(t, md);
      }
    });
  }

  const ready: FrameMessage = { source: FRAME_SOURCE, type: 'ready', path: url.pathname };
  window.parent.postMessage(ready, window.location.origin);
}
