/**
 * Is the browser online? One shared answer for the whole app.
 *
 * `navigator.onLine === false` is reliable (no network at all); `true` only
 * means "there is a network", not that the server answers — so callers use
 * `offline` to *wait*, never to declare a server healthy.
 *
 * `onBackOnline` fires when the network returns, and also when a hidden tab
 * becomes visible again: a phone that slept with the tab in the background
 * lost its socket the same way, without ever firing `offline`.
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export const isOnline = writable<boolean>(browser ? navigator.onLine !== false : true);

type Listener = (reason: 'online' | 'visible') => void;
const listeners = new Set<Listener>();
let wired = false;

function fire(reason: 'online' | 'visible') {
  for (const l of listeners) {
    try {
      l(reason);
    } catch (err) {
      console.error('[network] listener failed', err);
    }
  }
}

function wire() {
  if (wired || !browser) return;
  wired = true;
  window.addEventListener('online', () => {
    isOnline.set(true);
    fire('online');
  });
  window.addEventListener('offline', () => isOnline.set(false));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine !== false) fire('visible');
  });
}

/** Run `listener` whenever connectivity may have come back. Returns `off`. */
export function onBackOnline(listener: Listener): () => void {
  wire();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function online(): boolean {
  wire();
  return get(isOnline);
}

if (browser) wire();
