/**
 * Where prospects are kept (docs/inprogress/PLAN_GROWTH_AGENT.md §3.4, §10).
 *
 * Phase 1 keeps them in one JSON file under GROWTH_STATE_DIR — the /api
 * service is one long-running container on the VPS (as /api/vision-preview and
 * the translation governor already assume), so one process owns the file. The
 * Strapi content-type this should become is specified in §10.1; everything
 * outside this file talks to `ProspectRepository`, so moving is one module.
 *
 * Writes are serialised through one promise chain and land by write-then-rename,
 * so a crash mid-write leaves the previous file, never half of one.
 *
 * Identity keys are stored hashed: a "do not contact" business must stay
 * recognisable without the store keeping its phone or email in clear.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Prospect } from '$lib/growth/types';
import { growthStateDir } from './config';

export interface ProspectRepository {
  list(): Promise<Prospect[]>;
  get(id: string): Promise<Prospect | null>;
  /** Insert many at once (one write for a whole CSV import). */
  insert(rows: Prospect[]): Promise<void>;
  /** Read-modify-write under the store's lock. Returns null when there is no such prospect. */
  update(id: string, fn: (p: Prospect) => Prospect): Promise<Prospect | null>;
  /** Every hashed identity key in the store — for duplicate checks. */
  knownKeys(): Promise<Set<string>>;
}

export function hashKey(key: string): string {
  return createHash('sha256').update(`growth:${key}`).digest('hex').slice(0, 24);
}

export function hashKeys(keys: string[]): string[] {
  return keys.map(hashKey);
}

interface FileShape {
  version: 1;
  prospects: Prospect[];
}

const FILE = 'prospects.json';

export function memoryRepository(seed: Prospect[] = []): ProspectRepository {
  let rows = seed.map((p) => structuredClone(p));
  return makeRepo(
    () => rows,
    (next) => {
      rows = next;
    }
  );
}

function makeRepo(read: () => Prospect[], write: (rows: Prospect[]) => void): ProspectRepository {
  let chain: Promise<unknown> = Promise.resolve();
  const locked = <T>(fn: () => T): Promise<T> => {
    const run = chain.then(fn);
    chain = run.catch(() => undefined);
    return run;
  };
  return {
    list: async () => read(),
    get: async (id) => read().find((p) => p.id === id) ?? null,
    insert: (rows) =>
      locked(() => {
        write([...rows, ...read()]);
      }),
    update: (id, fn) =>
      locked(() => {
        const all = read();
        const i = all.findIndex((p) => p.id === id);
        if (i < 0) return null;
        const next = fn(all[i]);
        const copy = all.slice();
        copy[i] = next;
        write(copy);
        return next;
      }),
    knownKeys: async () => new Set(read().flatMap((p) => p.dedupeKeys))
  };
}

export function fileRepository(dir: string): ProspectRepository {
  const path = join(dir, FILE);
  let cache: Prospect[] | null = null;
  const read = (): Prospect[] => {
    if (cache) return cache;
    if (!existsSync(path)) return (cache = []);
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as FileShape;
    // A file we did not write is not a list of businesses to contact.
    if (parsed?.version !== 1 || !Array.isArray(parsed.prospects)) {
      throw new Error(`[growth] ${path} is not a prospect store (version ${parsed?.version})`);
    }
    return (cache = parsed.prospects);
  };
  const write = (rows: Prospect[]) => {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const tmp = `${path}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify({ version: 1, prospects: rows } satisfies FileShape), 'utf8');
    renameSync(tmp, path);
    cache = rows;
  };
  return makeRepo(read, write);
}

let shared: { dir: string; repo: ProspectRepository } | null = null;
let override: ProspectRepository | null = null;

/** The configured store, or null when the module is off. */
export function growthRepository(): ProspectRepository | null {
  if (override) return override;
  const dir = growthStateDir();
  if (!dir) return null;
  if (!shared || shared.dir !== dir) shared = { dir, repo: fileRepository(dir) };
  return shared.repo;
}

/** Tests only. */
export function setGrowthRepositoryForTests(repo: ProspectRepository | null): void {
  override = repo;
}
