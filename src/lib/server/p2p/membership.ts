import { sendViaProxy } from '$lib/server/sendViaProxy.js';

type FetchLike = (input: any, init?: any) => Promise<Response>;

/**
 * Is `uid` a member of rikma `projectId`? The check behind every rikma-room
 * ticket (P2P, presence): the socket server cannot ask Strapi, so it trusts a
 * ticket only because this ran first. Throws when Strapi cannot be asked —
 * the caller answers 502, never "not a member".
 */
export async function isRikmaMember(fetch: FetchLike, projectId: string, uid: string): Promise<boolean> {
  const data = await sendViaProxy(fetch, '274getProjectMembers', { pid: projectId }, { isSer: true });
  const members: Array<{ id: string | number }> = data?.project?.data?.attributes?.user_1s?.data ?? [];
  return members.some((m) => String(m.id) === String(uid));
}

/** The name others will read beside "is typing"; '' when it cannot be read. */
export async function displayName(fetch: FetchLike, uid: string): Promise<string> {
  try {
    const data = await sendViaProxy(fetch, 'typingNameFor', { uid }, { isSer: true });
    return String(data?.usersPermissionsUser?.data?.attributes?.username ?? '');
  } catch {
    return '';
  }
}

/**
 * Has the member switched presence off? Read separately and forgivingly: the
 * default is visible, and a failed read (the field not deployed yet, a hiccup)
 * must not lock a member out of a room they chose to be in.
 */
export async function hidesPresence(fetch: FetchLike, uid: string): Promise<boolean> {
  try {
    const data = await sendViaProxy(fetch, 'presenceHiddenFor', { uid }, { isSer: true });
    return data?.usersPermissionsUser?.data?.attributes?.hidePresence === true;
  } catch (e) {
    console.warn('[presence] hidePresence read failed — treating as visible', e);
    return false;
  }
}
