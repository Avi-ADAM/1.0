import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyUpdaterSignature } from './verify-signature.mjs';
import { parseReleaseManifest } from '../../src/lib/download/release.js';

export function verifyRelease(directory, expectedVersion, publicKey) {
  const manifest = JSON.parse(readFileSync(resolve(directory, 'latest.json'), 'utf8'));
  const release = parseReleaseManifest(manifest);
  assert.equal(release?.version, expectedVersion, 'Manifest must match the bundled version');
  assert.ok(release.windowsExe, 'Download page must offer an NSIS installer');
  assert.ok(release.windowsMsi, 'Download page must offer an MSI installer');
  assert.ok(release.pubDate, 'Manifest must have a publication date');
  const hashes = {};
  for (const [platform, extension] of [['windows-x86_64-nsis', '.exe'], ['windows-x86_64-msi', '.msi']]) {
    const entry = manifest.platforms[platform];
    assert.ok(entry?.signature?.trim(), `${platform} must be signed for the updater`);
    const url = new URL(entry.url);
    assert.equal(url.origin, 'https://github.com');
    assert.ok(url.pathname.startsWith(`/Avi-ADAM/1.0/releases/download/desktop-v${expectedVersion}/`));
    const name = decodeURIComponent(basename(url.pathname));
    assert.equal(basename(name), name, 'Asset filename cannot contain path separators');
    assert.ok(name.endsWith(extension));
    const bytes = readFileSync(resolve(directory, name));
    assert.ok(bytes.length > 1024, 'Installer must not be an empty/placeholder file');
    // PE / MSI compound document magic, not a zip or error page.
    assert.ok(extension === '.exe' ? bytes.subarray(0, 2).equals(Buffer.from('MZ')) : bytes.subarray(0, 8).equals(Buffer.from('d0cf11e0a1b11ae1', 'hex')));
    const signaturePath = resolve(directory, `${name}.sig`);
    assert.equal(readFileSync(signaturePath, 'utf8').trim(), entry.signature.trim(), 'Manifest signature must match the installer sidecar');
    verifyUpdaterSignature(bytes, entry.signature, publicKey);
    hashes[name] = createHash('sha256').update(bytes).digest('hex');
  }
  assert.equal(manifest.platforms['windows-x86_64']?.url, release.windowsExe, 'Generic updater target must prefer NSIS');
  return { version: expectedVersion, commit: process.env.GITHUB_SHA ?? null, hashes, assets: readdirSync(directory).sort() };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = process.argv[2];
  assert.ok(directory, 'Usage: node scripts/desktop/verify-release.mjs <downloaded-release-directory>');
  const version = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8')).version;
  const evidence = verifyRelease(directory, version, process.env.TAURI_UPDATER_PUBLIC_KEY);
  writeFileSync(resolve(directory, 'ci-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
}
