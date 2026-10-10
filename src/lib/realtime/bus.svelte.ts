/**
 * The app's realtime bus, wired to the socket and to SvelteKit — the root
 * layout starts it once the socket connects. See `bus.ts` for what it does.
 *
 * - A load re-runs on a change by declaring `depends(rtKey('project:12'))`.
 * - A component that loads in `onMount` listens with `useRealtime`.
 * - The heart page and the rikma tabs listen through their adapters
 *   (`adapters/lev.ts`, `adapters/moach.ts`).
 */

import { browser } from '$app/environment';
import { invalidate } from '$app/navigation';
import { socketClient } from '$lib/stores/socketClient';
import { createRealtimeBus, type RealtimeHandler } from './bus';

export const realtimeBus = createRealtimeBus({
  on: (event, handler) => socketClient.on(event, handler),
  onReady: (listener) => socketClient.onReady(listener),
  clientId: () => (browser ? (window as any).__timerClientId : undefined),
  invalidate: (predicate) => invalidate(predicate)
});

/**
 * Listen to changes under these patterns for as long as the calling component
 * lives. Call it during component init. `patterns` may be a function, so a
 * component whose id comes from props re-subscribes when it changes.
 *
 *   useRealtime(() => [`decision:${kind}:${id}`], () => refetch());
 */
export function useRealtime(patterns: readonly string[] | (() => readonly string[]), handler: RealtimeHandler): void {
  $effect(() => {
    const list = typeof patterns === 'function' ? patterns() : patterns;
    if (!browser || list.length === 0) return;
    return realtimeBus.subscribe(list, handler);
  });
}
