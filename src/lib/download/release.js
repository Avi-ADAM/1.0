/**
 * The download page's view of a desktop release — pure, no I/O.
 *
 * The source of truth is the Tauri updater manifest (`latest.json`), the same
 * file the installed app polls for updates. Reading it here means a release is
 * published in exactly one place: whatever the updater would install is what
 * the page offers, and the page can never advertise a version the app does not
 * know about (or the other way round).
 *
 * Tauri v2 manifest shape:
 *   { version, notes?, pub_date?, platforms: { "windows-x86_64": { url, signature }, … } }
 * `tauri-action` also writes installer-specific keys (`windows-x86_64-nsis`,
 * `windows-x86_64-msi`); both spellings are accepted.
 */

/** @typedef {'windows' | 'android' | 'mac' | 'linux' | 'ios' | 'other'} Platform */

/**
 * @typedef {object} DesktopRelease
 * @property {string} version
 * @property {string | null} pubDate  ISO date, or null when the manifest has none.
 * @property {string} notes           Plain text. Render as text, never as HTML.
 * @property {string | null} windowsExe  The NSIS installer (`…-setup.exe`).
 * @property {string | null} windowsMsi  The MSI, for managed / IT installs.
 */

/** Only an https URL to a real installer is offered — never a `.zip` updater bundle. */
function installerUrl(/** @type {unknown} */ entry, /** @type {RegExp} */ ext) {
  if (!entry || typeof entry !== 'object') return null;
  const url = /** @type {{ url?: unknown }} */ (entry).url;
  if (typeof url !== 'string') return null;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  return ext.test(parsed.pathname) ? parsed.href : null;
}

/**
 * @param {unknown} raw  The parsed `latest.json`.
 * @returns {DesktopRelease | null}  null when the manifest is unusable or offers no Windows installer.
 */
export function parseReleaseManifest(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const m = /** @type {Record<string, any>} */ (raw);
  const version = typeof m.version === 'string' ? m.version.replace(/^v/, '').trim() : '';
  if (!version) return null;
  const platforms = m.platforms && typeof m.platforms === 'object' ? m.platforms : {};

  const EXE = /\.exe$/i;
  const MSI = /\.msi$/i;
  const windowsExe =
    installerUrl(platforms['windows-x86_64-nsis'], EXE) ??
    installerUrl(platforms['windows-x86_64'], EXE);
  const windowsMsi =
    installerUrl(platforms['windows-x86_64-msi'], MSI) ??
    installerUrl(platforms['windows-x86_64'], MSI);
  if (!windowsExe && !windowsMsi) return null;

  let pubDate = null;
  if (typeof m.pub_date === 'string' && !Number.isNaN(Date.parse(m.pub_date))) {
    pubDate = new Date(m.pub_date).toISOString();
  }

  return {
    version,
    pubDate,
    notes: typeof m.notes === 'string' ? m.notes.trim() : '',
    windowsExe,
    windowsMsi
  };
}

/**
 * An Android link from the environment: a Play listing or a direct APK.
 * @param {string | undefined} url
 * @returns {{ url: string, store: boolean } | null}
 */
export function parseAndroidLink(url) {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    if (u.protocol !== 'https:') return null;
    return { url: u.href, store: u.hostname === 'play.google.com' };
  } catch {
    return null;
  }
}

/**
 * Best guess at the visitor's OS, for choosing the primary button only — the
 * page always lists every platform, so a wrong guess costs one scroll.
 *
 * @param {string} userAgent
 * @param {{ platform?: string, maxTouchPoints?: number }} [hints]
 *   `platform` from `navigator.userAgentData` when the browser has it;
 *   `maxTouchPoints` tells an iPad (which claims to be a Mac) from a Mac.
 * @returns {Platform}
 */
export function detectPlatform(userAgent, hints = {}) {
  const ua = userAgent || '';
  const hinted = (hints.platform || '').toLowerCase();
  // Android before Linux: every Android UA also says "Linux".
  if (hinted === 'android' || /android/i.test(ua)) return 'android';
  if (hinted === 'ios' || /iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (hinted === 'windows' || /windows/i.test(ua)) return 'windows';
  if (hinted === 'macos' || /macintosh|mac os x/i.test(ua)) {
    return (hints.maxTouchPoints ?? 0) > 1 ? 'ios' : 'mac';
  }
  // ChromeOS cannot run a Windows installer or an AppImage — treat it as "other".
  if (hinted === 'chrome os' || /cros/i.test(ua)) return 'other';
  if (hinted === 'linux' || /linux/i.test(ua)) return 'linux';
  return 'other';
}
