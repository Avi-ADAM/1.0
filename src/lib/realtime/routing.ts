/**
 * Where a change lands on the client — the one table between "what an action
 * says changed" (scopes) and "what each screen shows"
 * (docs/inprogress/PLAN_REALTIME_MIGRATION.md §3.4). Pure: the bus and the
 * adapters call it, the tests pin it.
 *
 * Three consumers:
 * - kit  — a load that declared `depends(rtKey(pattern))` runs again when a
 *          scope under that pattern changed (`rtDependencyMatches`);
 * - lev  — the heart page's slices (`levSlicesForScopes`, keys of LEV_SLICES);
 * - moach — the rikma tabs' cached sections (`moachSectionsForChange`).
 */

import { RT_PREFIX, scopeMatches, projectIdsOf, type RealtimeChange } from './scopes';

/** Does a `depends()` key (as SvelteKit hands it to `invalidate(fn)`) cover any of these scopes? */
export function rtDependencyMatches(href: string, scopes: readonly string[]): boolean {
  if (!href.startsWith(RT_PREFIX)) return false;
  const pattern = href.slice(RT_PREFIX.length);
  return scopes.some((s) => scopeMatches(pattern, s));
}

/** Does any of these patterns cover any of these scopes? */
export function anyMatch(patterns: readonly string[], scopes: readonly string[]): boolean {
  return patterns.some((p) => scopes.some((s) => scopeMatches(p, s)));
}

// ── lev ─────────────────────────────────────────────────────────────────────

/**
 * The heart page's slices each scope touches. Keys are LEV_SLICES keys; a key
 * with no qid yet makes the lev adapter fall back to a full load, so nothing
 * is lost while the registry fills in.
 */
const LEV_BY_ENTITY: Record<string, string[]> = {
  mission: ['mtaha', 'pends'],
  act: ['mtaha'],
  resource: ['wegets', 'askedResources'],
  sale: ['sales'],
  split: ['halukas'],
  deal: ['sheirutpends', 'purchases']
};

const LEV_BY_DECISION_KIND: Record<string, string[]> = {
  pendm: ['pends'],
  pmash: ['pmashes'],
  maap: ['wegets'],
  decision: ['decisions'],
  ask: ['asked'],
  askm: ['askedResources'],
  finiapruval: ['fiapp'],
  tosplit: ['halukas']
};

export function levSlicesForScopes(scopes: readonly string[]): string[] {
  const out = new Set<string>();
  for (const s of scopes) {
    const [entity, a] = s.split(':');
    const keys = entity === 'decision' ? LEV_BY_DECISION_KIND[a] : LEV_BY_ENTITY[entity];
    for (const k of keys ?? []) out.add(k);
  }
  return [...out];
}

/** The patterns the heart page listens to. */
export const LEV_PATTERNS = ['mission:*', 'act:*', 'resource:*', 'sale:*', 'split:*', 'deal:*', 'decision:*:*'];

// ── moach ───────────────────────────────────────────────────────────────────

export type MoachSection = 'base' | 'missions' | 'financials';

const MOACH_BY_ENTITY: Record<string, MoachSection[]> = {
  mission: ['missions'],
  // The acts tab reads the rikma's acts from `base` (getProjectBaseInfoWithAuth).
  act: ['missions', 'base'],
  resource: ['missions'],
  shift: ['missions'],
  process: ['missions'],
  timer: ['missions'],
  sale: ['financials'],
  split: ['financials'],
  deal: ['financials'],
  product: ['financials'],
  stipend: ['financials']
};

const MOACH_BY_DECISION_KIND: Record<string, MoachSection[]> = {
  // A consensus creates the mission / resource it proposed.
  pendm: ['missions'],
  pmash: ['missions'],
  ask: ['missions'],
  askm: ['missions'],
  finiapruval: ['missions', 'financials'],
  maap: ['missions', 'financials'],
  tosplit: ['financials'],
  // name, picture, links, address, look, archive/edit of an object…
  decision: ['base', 'missions', 'financials']
};

/**
 * The sections of rikma `pid` one change touches — none when the change is
 * not about that rikma. Changes are read one by one, never merged: a batch
 * can hold changes of two rikmas, and `mission:7` belongs to its own.
 */
export function moachSectionsForChange(change: Pick<RealtimeChange, 'scopes'>, pid: string | number): MoachSection[] {
  const scopes = change.scopes ?? [];
  if (!projectIdsOf(scopes).includes(String(pid))) return [];
  const out = new Set<MoachSection>();
  for (const s of scopes) {
    const [entity, a] = s.split(':');
    if (entity === 'project') continue;
    const sections = entity === 'decision' ? MOACH_BY_DECISION_KIND[a] : MOACH_BY_ENTITY[entity];
    for (const sec of sections ?? []) out.add(sec);
  }
  // The rikma itself changed and nothing more specific was said.
  if (out.size === 0) out.add('base');
  return [...out];
}

/** Did this change open, move or close a vote of rikma `pid`? (the votes badge) */
export function touchesVotes(change: Pick<RealtimeChange, 'scopes'>, pid: string | number): boolean {
  const scopes = change.scopes ?? [];
  return projectIdsOf(scopes).includes(String(pid)) && scopes.some((s) => s.startsWith('decision:'));
}
