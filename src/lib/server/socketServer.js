import { env } from '$env/dynamic/private';

/**
 * How server code reaches the standalone socket server (socket-server/).
 *
 * Its HTTP endpoints - `/broadcast` (push a notification to any user id) and
 * `/space-changed` - sit on socket.1lev1.com, a public host, so each call must
 * carry SOCKET_BROADCAST_SECRET in `x-socket-secret`. The socket server refuses
 * anything else, and refuses everything when its own copy is unset; the two
 * values must match. See socket-server/src/internal-auth.ts.
 *
 * Read through `$env/dynamic/private`: `vite dev` leaves process.env empty.
 */

export const SOCKET_SERVER_URL = (env.SOCKET_SERVER_URL || 'http://127.0.0.1:3001').replace(/\/+$/, '');

let warned = false;

/** @returns {Record<string, string>} */
export function socketServerHeaders() {
	const secret = (env.SOCKET_BROADCAST_SECRET || '').trim();
	if (!secret && !warned) {
		warned = true;
		console.warn('[socketServer] SOCKET_BROADCAST_SECRET is not set - the socket server will refuse every push');
	}
	return {
		'Content-Type': 'application/json',
		...(secret && { 'x-socket-secret': secret })
	};
}
