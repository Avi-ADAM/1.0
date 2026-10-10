/**
 * Server secrets are read with `$env/dynamic/private`, never `$env/static/private`.
 *
 * Static private values are inlined by `vite build`, so the Docker image carries
 * whatever the BUILD machine's .env said (deploy-api.ps1 builds locally). The
 * server's own .env — where a rotated password actually lands — is then never
 * read. That is how notification mail stayed silent for two months: the image
 * held a stale ZOHO password while the VPS .env had the right one (170.1).
 * Dynamic values come from the running process, on the VPS and on Vercel alike.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

// vitest runs from the repo root; import.meta.url is not a file: URL under happy-dom.
const SRC = join(process.cwd(), 'src');
const IMPORT = /(?:from\s*|import\s*\(\s*)['"]\$env\/static\/private['"]/;

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|ts|svelte)$/.test(e.name) && !/\.test\.|\.spec\./.test(e.name)) out.push(p);
  }
  return out;
}

describe('$env/static/private', () => {
  it('is imported nowhere in src', () => {
    const offenders = walk(SRC)
      .filter((f) => IMPORT.test(readFileSync(f, 'utf8')))
      .map((f) => relative(SRC, f));
    expect(offenders).toEqual([]);
  });
});
