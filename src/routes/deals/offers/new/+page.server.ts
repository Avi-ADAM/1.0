import { sendViaProxy } from '$lib/server/sendViaProxy.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, fetch }) => {
  const { uid } = await parent();
  const profile = await sendViaProxy(fetch, 'meProfile', { uid }).catch(() => null);
  return { userCurrency: profile?.usersPermissionsUser?.data?.attributes?.currency ?? null };
};
