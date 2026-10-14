import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const manifestUrl = 'https://github.com/Avi-ADAM/1.0/releases/latest/download/latest.json';

export function prepareRelease({ base, windows, publicKey, privateKey, tag }) {
  if (base.identifier !== 'world.onelev1.app') throw new Error('The application identifier is immutable');
  if (!/^\d+\.\d+\.\d+$/.test(base.version)) throw new Error('Windows releases require major.minor.patch');
  const parts = base.version.split('.').map(Number);
  if (parts[0] > 255 || parts[1] > 255 || parts[2] > 65535) throw new Error('Version exceeds MSI limits');
  if (tag !== `desktop-v${base.version}`) throw new Error(`Tag must be desktop-v${base.version}`);
  if (!privateKey?.trim()) throw new Error('Missing TAURI_SIGNING_PRIVATE_KEY repository secret; do not generate a throwaway release key');
  const key = publicKey?.trim();
  if (!key) throw new Error('Set TAURI_UPDATER_PUBLIC_KEY repository variable or secret to the .pub file contents');
  if (!/^[A-Za-z0-9+/=]+$/.test(key)) throw new Error('TAURI_UPDATER_PUBLIC_KEY must contain the complete Tauri .pub file contents, without surrounding quotes or a file path');
  const decoded = Buffer.from(key, 'base64').toString('utf8').trim().split(/\r?\n/);
  const packet = Buffer.from(decoded[1] ?? '', 'base64');
  if (!decoded[0]?.startsWith('untrusted comment:') || packet.length !== 42 || packet.subarray(0, 2).toString() !== 'Ed') {
    throw new Error('Invalid Tauri/minisign public key');
  }
  if (windows.plugins.updater.endpoints.length !== 1 || windows.plugins.updater.endpoints[0] !== manifestUrl) {
    throw new Error('Download page and updater must use the same public manifest');
  }
  // Only the PUBLIC key is written into the bundle config. Neither private key
  // nor password is ever written, echoed, or included in an uploaded artifact.
  return { plugins: { updater: { pubkey: key } } };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const base = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
  const windows = JSON.parse(readFileSync('src-tauri/tauri.windows.conf.json', 'utf8'));
  const tag = process.env.DESKTOP_RELEASE_TAG || `desktop-v${base.version}`;
  const overlay = prepareRelease({ base, windows, tag, publicKey: process.env.TAURI_UPDATER_PUBLIC_KEY, privateKey: process.env.TAURI_SIGNING_PRIVATE_KEY });
  mkdirSync('scratch/desktop', { recursive: true });
  writeFileSync('scratch/desktop/signing.conf.json', `${JSON.stringify(overlay, null, 2)}\n`);
  console.log(`Prepared ${tag}; public manifest: ${manifestUrl}`);
}
