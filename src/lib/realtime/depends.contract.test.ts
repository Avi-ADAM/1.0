/**
 * Every realtime key a screen declares is one the bus can match
 * (docs/inprogress/PLAN_REALTIME_MIGRATION.md §3.5) — a typo such as
 * `depends('rt:missions:*')` or `useRealtime(['pend:3'], …)` would compile,
 * pass every other check, and simply never fire.
 *
 * Literal keys only: `depends('rt:<pattern>')`, `rtKey('<pattern>')`, and the
 * string literals inside `useRealtime([...], …)`. A key built at runtime
 * (`rtKey(\`project:${pid}\`)`) is checked by its shape: an interpolation
 * stands for any value, so only the entity and the segment count are held.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { isScopePattern } from './scopes';

const ROOT = process.cwd();
const SCAN = ['src/routes', 'src/lib'];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(svelte|ts|js)$/.test(name) && !/\.test\./.test(name)) out.push(p);
  }
  return out;
}

/** `${...}` → any value, so `decision:${kind}:${id}` reads as `decision:*:*`. */
const asPattern = (raw: string) => raw.replace(/\$\{[^}]*\}/g, '*');

function keysIn(src: string): string[] {
  const keys: string[] = [];
  for (const m of src.matchAll(/depends\(([^)]*)\)/g)) {
    for (const q of m[1].matchAll(/['"`](rt:[^'"`]+)['"`]/g)) keys.push(q[1].slice(3));
  }
  for (const m of src.matchAll(/rtKey\(\s*['"`]([^'"`]+)['"`]\s*\)/g)) keys.push(m[1]);
  for (const m of src.matchAll(/useRealtime\(\s*(?:\(\)\s*=>\s*)?\[([^\]]*)\]/g)) {
    for (const q of m[1].matchAll(/['"`]([^'"`]+)['"`]/g)) keys.push(q[1]);
  }
  return keys;
}

const found = SCAN.flatMap((d) => walk(join(ROOT, d))).flatMap((file) =>
  keysIn(readFileSync(file, 'utf8')).map((key) => ({ file: relative(ROOT, file).split(sep).join('/'), key }))
);

describe('realtime keys on screens', () => {
  it('every declared key is a scope pattern the bus can match', () => {
    const bad = found.filter(({ key }) => !isScopePattern(asPattern(key)));
    expect(bad, 'use an entity from $lib/realtime/scopes (entity:id, decision:kind:id, * for any)').toEqual([]);
  });

  it('the scanner sees the shapes it claims to', () => {
    expect(keysIn("depends('rt:project:12', 'app:x')")).toEqual(['project:12']);
    expect(keysIn('rtKey(`project:${pid}`)').map(asPattern)).toEqual(['project:*']);
    expect(keysIn("useRealtime(() => ['mission:*', `decision:pendm:${id}`], fn)").map(asPattern)).toEqual([
      'mission:*',
      'decision:pendm:*'
    ]);
  });

  it('a typo in an entity is caught', () => {
    const typo = keysIn("depends('rt:missions:*')").map(asPattern);
    expect(typo.every((k) => isScopePattern(k))).toBe(false);
  });
});
