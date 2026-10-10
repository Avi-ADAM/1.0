/**
 * Requests that belong to socket.io (engine.io), not to our HTTP routes.
 *
 * The routes are a second 'request' listener on the same server, added after
 * socket.io attached, so both see every request. When the routes answered a
 * polling request with their 404, engine.io then wrote its own reply to the
 * same response — ERR_HTTP_HEADERS_SENT, and the process died. Any client
 * falling back from websocket to polling, or anyone sending one such request,
 * took the server down. The routes leave these requests alone.
 */

export const SOCKET_IO_PATH = '/socket.io/';

export function isSocketIoRequest(url: string | undefined, path = SOCKET_IO_PATH): boolean {
  if (!url) return false;
  return url === path.slice(0, -1) || url.startsWith(path);
}
