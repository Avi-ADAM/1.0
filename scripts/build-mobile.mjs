#!/usr/bin/env node
/**
 * Mobile (Tauri) frontend build.
 *
 * Works on Windows/macOS/Linux without cross-env:
 *   ADAPTER=mobile  -> svelte.config.js picks adapter-static in SPA mode (fallback: index.html)
 *   VITE_TAURI=1    -> client code compiles in mobile-only branches ($lib/platform)
 *
 * Output goes to ./build and is consumed by src-tauri (frontendDist: "../build").
 */
import { spawnSync } from 'node:child_process';
import { existsSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Server-only load files that must NOT be part of the SPA build. If they are,
 * the client tries to fetch /__data.json at runtime, gets a 404 (there is no
 * server inside Tauri) and the app fails to boot. They are moved aside for the
 * duration of the build and always restored (see finally below).
 * src/routes/+layout.js already tolerates the missing data on mobile.
 */
const SERVER_FILES_TO_HIDE = ['src/routes/+layout.server.js'];

/**
 * $env/static/private imports make the (throwaway) server-side compile fail
 * when these vars are unset. adapter-static discards the server bundle — the
 * SPA output never contains these values — so dummies are safe here.
 * Real VITE_* values (VITE_URL, VITE_SOCKET_URL) DO ship in the app bundle
 * and must be provided for a real build (e.g. via .env or CI vars).
 */
const PRIVATE_ENV_STUBS = [
  'ADMINMONTHER',
  'CONSENSUS_PROXY_SECRET',
  'CONSENSUS_PUBLIC_TOKEN',
  'GEMINI_API_KEY',
  'GOOGLE_API',
  'GROQ_API_KEY',
  'NEW_TELEGRAM',
  'PINECONE',
  'PINECONE_INDEX',
  'STRAPI_TOKEN',
  'STRAPI_URL',
  'TELEGRAM_BOT_TOKEN_NEW',
  'URL',
  'ZOHO',
  'privateKey',
  'publicKey'
];

const stubs = {};
for (const name of PRIVATE_ENV_STUBS) {
  if (!process.env[name]) stubs[name] = 'mobile-build-stub';
}
// apiKeys.js validates length >= 32 at module load during the postbuild analyse step
if (!process.env.API_KEY_NONCE) {
  stubs.API_KEY_NONCE = 'mobile-build-stub-nonce-0123456789abcdef';
}

const env = {
  ...process.env,
  ...stubs,
  ADAPTER: 'mobile',
  VITE_TAURI: '1'
};

// note: no "+" in the temp name — SvelteKit rejects unknown +-prefixed files
const hidden = [];
for (const rel of SERVER_FILES_TO_HIDE) {
  const abs = join(repoRoot, rel);
  if (existsSync(abs)) {
    const tmp = join(dirname(abs), 'hidden-for-mobile.' + rel.split('/').pop().replace(/\+/g, ''));
    renameSync(abs, tmp);
    hidden.push([abs, tmp]);
  }
}

let status = 1;
try {
  const result = spawnSync('npx', ['vite', 'build'], {
    stdio: 'inherit',
    env,
    shell: process.platform === 'win32'
  });
  status = result.status ?? 1;
} finally {
  for (const [abs, tmp] of hidden) renameSync(tmp, abs);
}

process.exit(status);
