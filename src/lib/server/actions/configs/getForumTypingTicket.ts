/**
 * A seat in one forum's "is typing" room (socket-server/src/typing.ts,
 * docs/inprogress/SPEC_SOCKET_REALTIME.md stage 5).
 *
 * The same participant rule that guards posting in the forum guards this, so
 * only someone who could write there hears who is writing. The ticket carries
 * the caller's own name, signed, so the room cannot be told someone else is
 * typing. A member who switched presence off gets no ticket: typing is a kind
 * of presence, and the opt-out is symmetric — not seen typing, not seeing it.
 *
 * `{ available: false }` when no ticket secret is configured — the chat shows
 * nothing, exactly as before.
 */

import type { ActionConfig } from '../types.js';
import { mintForumTicket, p2pTicketSecret } from '$lib/server/p2p/ticket.js';
import { displayName, hidesPresence } from '$lib/server/p2p/membership.js';

export const getForumTypingTicketConfig: ActionConfig = {
  key: 'getForumTypingTicket',
  description: 'A signed seat in a forum typing room, for a participant of that forum',
  graphqlOperation: async (params, context) => {
    const forumId = String(params.forumId ?? '');
    if (!/^\d{1,12}$/.test(forumId)) throw new Error('Invalid forumId');
    const secret = p2pTicketSecret();
    if (!secret) return { data: { available: false } };

    const uid = String(context.userId);
    const f = context.fetch as typeof fetch;
    if (await hidesPresence(f, uid)) return { data: { available: true, hidden: true } };

    const { ticket, expiresAt } = mintForumTicket(uid, forumId, await displayName(f, uid), secret);
    return { data: { available: true, hidden: false, ticket, expiresAt } };
  },
  paramSchema: {
    forumId: { type: 'string', required: true, description: 'The forum whose typing room to join' }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be signed in' },
    { type: 'forumParticipant', config: { forumIdParam: 'forumId' }, errorMessage: 'Only participants of this forum' }
  ],
  // Reads and signs; writes nothing — listed in READ_ONLY (realtime.contract.test.ts).
  updateStrategy: { type: 'none' }
};
