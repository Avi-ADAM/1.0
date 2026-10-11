/**
 * The realtime vocabulary — what an action says changed, and what a screen
 * says it is looking at (docs/inprogress/PLAN_REALTIME_MIGRATION.md §3.2).
 *
 * Pure and shared by server and client. A scope is `entity:id`; a decision
 * carries its kind too (`decision:pendm:12`). The server never knows which
 * page is open where, and an action never knows which pages exist: it states
 * scopes, a screen states patterns, and they meet in `scopeMatches`.
 *
 * A pattern may put `*` in any id position — `mission:*` is every mission,
 * `decision:*:12` is decision 12 of any kind. A scope itself never has one.
 */

export const SCOPE_ENTITIES = [
  'project',
  'mission',
  'act',
  'resource',
  'product',
  'sale',
  'split',
  'decision',
  'timer',
  'forum',
  'meeting',
  'wish',
  'deal',
  'stipend',
  'shift',
  'process',
  'maagad',
  'user',
  // A rikma's planning board (PlanBoards) and an entry in its shared library (/docs).
  'plan',
  'doc'
] as const;

export type ScopeEntity = (typeof SCOPE_ENTITIES)[number];

/** How many id segments follow the entity. */
const ARITY: Record<ScopeEntity, number> = Object.fromEntries(
  SCOPE_ENTITIES.map((e) => [e, e === 'decision' ? 2 : 1])
) as Record<ScopeEntity, number>;

/** The kinds a `decision:<kind>:<id>` scope can name. */
export const DECISION_KINDS = ['pendm', 'pmash', 'maap', 'decision', 'ask', 'askm', 'finiapruval', 'tosplit'] as const;
export type DecisionKind = (typeof DECISION_KINDS)[number];

/** An id segment: a Strapi id, a uid — never empty, never a separator. */
const ID = /^[A-Za-z0-9_-]{1,64}$/;

const ENTITY_SET: ReadonlySet<string> = new Set(SCOPE_ENTITIES);
const DECISION_KIND_SET: ReadonlySet<string> = new Set(DECISION_KINDS);

function segmentsValid(parts: string[], allowWildcard: boolean): boolean {
  const [entity, ...ids] = parts;
  if (!ENTITY_SET.has(entity)) return false;
  if (ids.length !== ARITY[entity as ScopeEntity]) return false;
  return ids.every((id, i) => {
    if (allowWildcard && id === '*') return true;
    if (entity === 'decision' && i === 0) return DECISION_KIND_SET.has(id);
    return ID.test(id);
  });
}

/** A concrete scope an action may publish: known entity, right arity, no `*`. */
export function isKnownScope(s: unknown): s is string {
  return typeof s === 'string' && segmentsValid(s.split(':'), false);
}

/** A pattern a screen may listen to — a scope, or one with `*` segments. */
export function isScopePattern(s: unknown): s is string {
  return typeof s === 'string' && segmentsValid(s.split(':'), true);
}

/** Does this scope fall under this pattern? */
export function scopeMatches(pattern: string, scope: string): boolean {
  const p = pattern.split(':');
  const s = scope.split(':');
  if (p.length !== s.length) return false;
  return p.every((seg, i) => seg === '*' || seg === s[i]);
}

type IdLike = string | number | null | undefined;

const clean = (id: IdLike): string | null => {
  if (id === null || id === undefined) return null;
  const s = String(id).trim();
  return ID.test(s) ? s : null;
};

/**
 * Build a scope; null when an id is missing, so a config can write
 * `[scope('project', params.projectId), scope('mission', result?.data?.id)]`
 * and let `scopeList` drop what was not there.
 */
export function scope(entity: Exclude<ScopeEntity, 'decision'>, id: IdLike): string | null {
  const c = clean(id);
  return c ? `${entity}:${c}` : null;
}

export function decisionScope(kind: DecisionKind, id: IdLike): string | null {
  const c = clean(id);
  return c ? `decision:${kind}:${c}` : null;
}

/** Drop missing / malformed entries and duplicates, keep order. */
export function scopeList(items: Array<string | null | undefined | false>): string[] {
  const out: string[] = [];
  for (const it of items) if (it && isKnownScope(it) && !out.includes(it)) out.push(it);
  return out;
}

/** The project ids among these scopes — the default audience. */
export function projectIdsOf(scopes: readonly string[]): string[] {
  return scopes.filter((s) => s.startsWith('project:')).map((s) => s.slice('project:'.length));
}

/**
 * SvelteKit `depends()` key for a pattern. `depends('rt:project:12')` in a
 * load, and the client bus invalidates every key whose pattern matches a
 * scope that changed.
 */
export const RT_PREFIX = 'rt:';
export const rtKey = (pattern: string): `rt:${string}` => `rt:${pattern}`;

/** The socket event that carries a change, apart from human notifications. */
export const RT_EVENT = 'rt:changed' as const;

/** What travels on `rt:changed`. */
export interface RealtimeChange {
  scopes: string[];
  actionKey: string;
  /** The tab that ran the action — it already has the result and skips the echo. */
  originClientId?: string;
  at: string;
}
