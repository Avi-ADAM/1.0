import { getAndroidLink, getDesktopRelease } from '$lib/server/download/releases.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
  return {
    release: await getDesktopRelease(fetch),
    android: getAndroidLink()
  };
}
