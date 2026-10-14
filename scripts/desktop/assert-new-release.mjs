import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const version = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8')).version;
const tag = process.env.DESKTOP_RELEASE_TAG;
assert.equal(tag, `desktop-v${version}`);
const headers = { accept: 'application/vnd.github+json' };
if (process.env.GH_TOKEN) headers.authorization = `Bearer ${process.env.GH_TOKEN}`;
async function get(path) {
  const response = await fetch(`https://api.github.com/repos/Avi-ADAM/1.0/${path}`, {
    headers, signal: AbortSignal.timeout(30000)
  });
  if (response.status === 404) return null;
  assert.ok(response.ok, `GitHub release preflight failed (${response.status})`);
  return response.json();
}
const existing = await get(`releases/tags/${encodeURIComponent(tag)}`);
assert.ok(!existing || existing.draft, 'Never replace a published installer: increment the shared version');
const latest = await get('releases/latest');
if (latest?.tag_name?.startsWith('desktop-v')) {
  const previous = latest.tag_name.slice('desktop-v'.length).split('.').map(Number);
  const next = version.split('.').map(Number);
  const firstDifference = next.findIndex((part, index) => part !== previous[index]);
  assert.ok(firstDifference >= 0 && next[firstDifference] > previous[firstDifference], 'Desktop version must increase after every published release');
}
console.log(`Release version preflight passed for ${tag}`);
