// Run AFTER the draft release is published and the website env is deployed.
// Deliberately use no Authorization header: private/draft assets must fail.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { manifestUrl } from './prepare-release.mjs';
import { verifyRelease } from './verify-release.mjs';
import { parseReleaseManifest } from '../../src/lib/download/release.js';

const version = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8')).version;
const directory = 'scratch/desktop/public-release';
mkdirSync(directory, { recursive: true });
const manifestResponse = await fetch(manifestUrl, { signal: AbortSignal.timeout(30000) });
assert.ok(manifestResponse.ok, 'latest.json must be publicly readable without authentication');
const manifest = await manifestResponse.json();
writeFileSync(join(directory, 'latest.json'), JSON.stringify(manifest, null, 2));
const release = parseReleaseManifest(manifest);
assert.equal(release?.version, version, 'The published manifest must advertise this build');
for (const kind of ['nsis', 'msi']) {
  const entry = manifest.platforms[`windows-x86_64-${kind}`];
  const url = new URL(entry.url);
  assert.equal(url.origin, 'https://github.com');
  assert.ok(url.pathname.startsWith(`/Avi-ADAM/1.0/releases/download/desktop-v${version}/`));
  const name = decodeURIComponent(basename(url.pathname));
  assert.equal(basename(name), name);
  for (const suffix of ['', '.sig']) {
    const response = await fetch(`${url.href}${suffix}`, { signal: AbortSignal.timeout(120000) });
    assert.ok(response.ok, `${name}${suffix} must be publicly downloadable`);
    writeFileSync(join(directory, `${name}${suffix}`), Buffer.from(await response.arrayBuffer()));
  }
}
const evidence = verifyRelease(directory, version, process.env.TAURI_UPDATER_PUBLIC_KEY);
for (const [route, installer] of [['windows', release.windowsExe], ['windows-msi', release.windowsMsi]]) {
  const response = await fetch(`https://www.1lev1.com/download/${route}`, {
    redirect: 'manual', signal: AbortSignal.timeout(30000)
  });
  assert.ok([301, 302, 303, 307, 308].includes(response.status), `${route} must redirect`);
  assert.equal(response.headers.get('location'), installer, `${route} must point to the manifest installer`);
}
const page = await fetch('https://www.1lev1.com/download', { signal: AbortSignal.timeout(30000) });
assert.ok(page.ok, 'Download page must render');
const html = await page.text();
assert.ok(html.includes(version), 'Download page must display the release version');
assert.ok(html.includes(release.windowsExe), 'Download page must offer the NSIS asset');
evidence.checkedAt = new Date().toISOString();
evidence.publicManifest = manifestUrl;
evidence.website = 'https://www.1lev1.com/download';
writeFileSync(join(directory, 'public-evidence.json'), JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence, null, 2));
