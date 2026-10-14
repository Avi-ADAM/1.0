/**
 * Stable links that always point at the current release —
 * `/download/windows`, `/download/windows-msi`, `/download/android` — for
 * emails, READMEs and the in-app "get the desktop app" prompt. Nothing has to
 * be edited when a new version ships.
 *
 * A platform with nothing published yet goes back to the page, which explains
 * what is available instead of handing the visitor a 404.
 */
import { error, redirect } from '@sveltejs/kit';
import { getAndroidLink, getDesktopRelease } from '$lib/server/download/releases.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, fetch }) {
  let target = null;
  switch (params.platform) {
    case 'windows':
      target = (await getDesktopRelease(fetch))?.windowsExe ?? null;
      break;
    case 'windows-msi':
      target = (await getDesktopRelease(fetch))?.windowsMsi ?? null;
      break;
    case 'android':
      target = getAndroidLink()?.url ?? null;
      break;
    default:
      error(404, 'Not found');
  }
  redirect(target ? 302 : 303, target ?? '/download');
}
