import { error } from '@sveltejs/kit';
import { sendViaProxy } from '$lib/server/sendViaProxy.js';

export async function load({ params, cookies, fetch }) {
  const projectId = params.projectId;

  // The proxy authenticates from the cookie itself; this only decides whether
  // there is any point in making the call.
  if (!cookies.get('tok') && !cookies.get('jwt')) {
    throw error(401, 'Unauthorized');
  }

  try {
    const data = await sendViaProxy(fetch, '306moachChainsExtra', { id: projectId });
    return {
      chainsServerData: data?.project?.data?.attributes || null
    };
  } catch (err) {
    console.error('Failed to load chains server data:', err);
    return { chainsServerData: null };
  }
}
