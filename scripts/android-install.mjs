#!/usr/bin/env node
/**
 * Installs the latest built debug APK onto a connected device.
 *
 *   npm run android:apk      # build
 *   npm run android:install  # push to the phone
 *
 * adb is not on PATH on a default Windows Android Studio install, so it is
 * resolved from ANDROID_HOME rather than assumed.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const apkDir = join(repoRoot, 'src-tauri/gen/android/app/build/outputs/apk');

function adbPath() {
  const home = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (home) {
    const exe = join(home, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');
    if (existsSync(exe)) return exe;
  }
  return 'adb'; // fall back to PATH
}

/** Newest .apk under outputs/apk (universal or per-arch, debug or release). */
function newestApk(dir) {
  if (!existsSync(dir)) return null;
  let best = null;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = newestApk(full);
      if (nested && (!best || nested.mtime > best.mtime)) best = nested;
    } else if (entry.name.endsWith('.apk')) {
      const { mtimeMs } = statSync(full);
      if (!best || mtimeMs > best.mtime) best = { path: full, mtime: mtimeMs };
    }
  }
  return best;
}

const adb = adbPath();
const devices = spawnSync(adb, ['devices'], { encoding: 'utf8' });
const attached = (devices.stdout || '')
  .split('\n')
  .slice(1)
  .map((l) => l.trim())
  .filter((l) => l.endsWith('device'));

if (attached.length === 0) {
  console.error(
    'לא נמצא מכשיר מחובר.\n' +
      '  USB:      חברו בכבל, אשרו "ניפוי שגיאות USB" בטלפון, ואז: adb devices\n' +
      '  אלחוטי:   בטלפון → אפשרויות מפתחים → ניפוי שגיאות אלחוטי → התאמה,\n' +
      '            ואז: adb pair <ip:port> <code> && adb connect <ip:port>'
  );
  process.exit(1);
}

const apk = newestApk(apkDir);
if (!apk) {
  console.error(`לא נמצא APK תחת ${apkDir} — הריצו קודם: npm run android:apk`);
  process.exit(1);
}

console.log(`מתקין ${apk.path}`);
// -r reinstall keeping data, -d allow downgrade (rebuilds keep versionCode 1)
const res = spawnSync(adb, ['install', '-r', '-d', apk.path], { stdio: 'inherit' });
process.exit(res.status ?? 1);
