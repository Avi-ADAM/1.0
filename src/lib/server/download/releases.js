/**
 * Where the download page and the `/download/<platform>` redirects learn what
 * is published. Both are configured by env and both are optional — with
 * nothing set, the page renders its "coming soon" state, never an error.
 *
 * - `DESKTOP_RELEASE_MANIFEST_URL` — the Tauri updater manifest (`latest.json`)
 *   of the Windows app. Usually the `latest/download/latest.json` asset of the
 *   GitHub release that `tauri-action` publishes.
 * - `ANDROID_DOWNLOAD_URL` — a Play listing or a direct APK.
 */
import { env } from '$env/dynamic/private';
import { parseAndroidLink, parseReleaseManifest } from '$lib/download/release.js';

const TTL_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 3000;

/** @type {{ at: number, url: string, value: import('$lib/download/release.js').DesktopRelease | null } | null} */
let cached = null;

/**
 * @param {typeof fetch} fetchFn
 * @returns {Promise<import('$lib/download/release.js').DesktopRelease | null>}
 */
export async function getDesktopRelease(fetchFn) {
  const url = env.DESKTOP_RELEASE_MANIFEST_URL?.trim();
  if (!url) return null;
  const now = Date.now();
  if (cached && cached.url === url && now - cached.at < TTL_MS) return cached.value;

  let value = null;
  try {
    const res = await fetchFn(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (res.ok) value = parseReleaseManifest(await res.json());
  } catch {
    // Unreachable or malformed: show "coming soon" rather than break the page.
    // A previous good answer is still better than nothing.
    if (cached?.url === url && cached.value) return cached.value;
  }
  cached = { at: now, url, value };
  return value;
}

export function getAndroidLink() {
  return parseAndroidLink(env.ANDROID_DOWNLOAD_URL);
}

/** Test seam. */
export function _resetReleaseCache() {
  cached = null;
}
