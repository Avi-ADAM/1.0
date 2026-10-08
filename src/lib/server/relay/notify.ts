// T1 — socket wake for space sync (HANDOFF_DISTRIBUTED_DB).
//
// After the relay accepts new envelopes for a space, poke the standalone
// Socket.io server (socket-server/) so subscribed replicas pull immediately
// instead of waiting for the polling fallback. METADATA ONLY: the payload is
// the spaceId, never content — consistent with the relay's mailbox role.
//
// Best-effort: a down socket server degrades realtime to polling, never
// blocks or fails a push.

import { SOCKET_SERVER_URL, socketServerHeaders } from '$lib/server/socketServer.js';

let warned = false;

export function notifySpaceChanged(spaceId: string): void {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  fetch(`${SOCKET_SERVER_URL}/space-changed`, {
    method: 'POST',
    headers: socketServerHeaders(),
    body: JSON.stringify({ spaceId }),
    signal: controller.signal
  })
    .catch((e) => {
      if (!warned) {
        warned = true;
        console.warn('[relay/notify] space-changed emit failed - polling fallback only:', e?.message ?? e);
      }
    })
    .finally(() => clearTimeout(timer));
}
