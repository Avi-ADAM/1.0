import { sendToSer } from '$lib/send/sendToSer.js';

/**
 * Whether the person chose to be findable by other people's agents
 * (PLAN_MCP_PARTNER_INTEGRATION P1.5). The identity is the signed session's
 * (`locals.uid`), never a cookie value. A read that fails — the field not yet
 * deployed, a slow backend — reads as "not findable", the default, and hides the
 * switch rather than showing a state it could not confirm.
 */
export async function load({ locals, fetch }) {
  const uid = locals.uid;
  if (!uid) return { findable: false, findableKnown: false };
  try {
    const res = await sendToSer({ uid: String(uid) }, 'findableByAgentsFor', 0, 0, true, fetch);
    const attrs = res?.data?.usersPermissionsUser?.data?.attributes;
    if (!attrs || res?.errors?.length) return { findable: false, findableKnown: false };
    return { findable: attrs.findableByAgents === true, findableKnown: true };
  } catch {
    return { findable: false, findableKnown: false };
  }
}
