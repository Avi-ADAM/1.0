// Where the relay may run (A0, PLAN_DISTRIBUTED_EXECUTION). Its seq log is
// in-memory, so it is only coherent inside ONE long-lived process — the
// sveltekit-api container on the VPS, which the browser reaches through
// VITE_API_BASE. On Vercel every lambda instance would keep its own log and
// mint its own logEpoch: a push landing in one instance is invisible from the
// next, and nothing errors. A client that reaches the relay there (a deploy
// without VITE_API_BASE, the Tauri app on VITE_URL) gets a visible 503
// instead of that silent split-brain.

export const RELAY_WRONG_HOST = 'relay_not_on_this_host';

/** Null when this process may serve the relay, else the refusal reason. */
export function relayRefusalReason(env: Record<string, string | undefined>): string | null {
  return env.VERCEL ? RELAY_WRONG_HOST : null;
}
