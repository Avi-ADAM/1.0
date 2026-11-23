/**
 * The prospect store in Strapi — `api::growth-prospect`
 * (docs/inprogress/PLAN_GROWTH_AGENT.md §10.1). Same `ProspectRepository`
 * contract as the file store, so nothing outside the repository changes.
 *
 * Every call runs under the server token: the growth qids are serviceAdmin-only
 * (qidsGrowth.js), and only code that already passed the operator check reaches
 * a repository.
 *
 * Shape: the scalars a list or filter needs are columns; everything nested
 * (research, profile, outreach, the activity log, the hashed identity keys) is
 * JSON. `uid` is the app's prospect id — the one in /growth/b/[id] — so moving
 * from the file store keeps every link.
 *
 * `update` is read-modify-write. Calls on one prospect are serialised inside
 * this process (one API container owns the pipeline, as with the file store);
 * across processes the last write wins, which for an operator screen is the
 * same as two people saving one form.
 */

import type { Prospect } from '$lib/growth/types';
import type { Stage } from '$lib/growth/stages';
import type { ProspectRepository } from './repo';

export interface GrowthStrapi {
  execute: (qid: string, vars: Record<string, unknown>, jwt?: string, fetchFn?: typeof globalThis.fetch) => Promise<any>;
}

const PAGE = 200;

/** A GraphQL error must fail loudly: an empty list would read as "no businesses". */
function rows(res: any, qid: string): any[] {
  if (res?.errors?.length) {
    throw new Error(`[growth] ${qid}: ${res.errors.map((e: any) => e?.message).join('; ')}`);
  }
  const data = res?.data?.growthProspects?.data;
  if (!Array.isArray(data)) throw new Error(`[growth] ${qid}: unexpected answer`);
  return data;
}

function idOf(res: any, field: string, qid: string): string {
  if (res?.errors?.length) {
    throw new Error(`[growth] ${qid}: ${res.errors.map((e: any) => e?.message).join('; ')}`);
  }
  const id = res?.data?.[field]?.data?.id;
  if (id == null) throw new Error(`[growth] ${qid}: no id returned`);
  return String(id);
}

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const obj = <T>(v: unknown, fallback: T): T => (v && typeof v === 'object' && !Array.isArray(v) ? (v as T) : fallback);

export function fromStrapi(row: any): Prospect {
  const a = row?.attributes ?? {};
  const createdAt = a.openedAt ?? a.createdAt ?? new Date(0).toISOString();
  return {
    id: String(a.uid),
    createdAt,
    updatedAt: a.updatedAt ?? createdAt,
    createdBy: a.createdByUid ?? null,
    name: a.name ?? '',
    website: a.website ?? null,
    email: a.email ?? null,
    phone: a.phone ?? null,
    country: a.country ?? null,
    city: a.city ?? null,
    region: a.region ?? null,
    category: a.category ?? null,
    services: arr<string>(a.services),
    keywords: arr<string>(a.keywords),
    size: a.size ?? null,
    notes: a.notes ?? null,
    lang: a.lang ?? 'he',
    sources: arr(a.sources),
    fieldSources: obj(a.fieldSources, {}),
    dedupeKeys: arr<string>(a.dedupeKeys),
    stage: (a.stage ?? 'discovered') as Stage,
    furthest: (a.furthest ?? a.stage ?? 'discovered') as Stage,
    stageChangedAt: a.stageChangedAt ?? createdAt,
    followUpAt: a.followUpAt ?? null,
    nextAction: a.nextAction ?? null,
    research: a.research ?? null,
    profile: a.profile ?? null,
    outreach: a.outreach ?? null,
    onboarding: a.onboarding ?? null,
    activity: arr(a.activity)
  };
}

/** Every field the app owns. Strapi keeps its own createdAt/updatedAt beside them. */
export function toStrapi(p: Prospect): Record<string, unknown> {
  return {
    uid: p.id,
    name: p.name,
    website: p.website,
    email: p.email,
    phone: p.phone,
    country: p.country,
    city: p.city,
    region: p.region,
    category: p.category,
    size: p.size,
    notes: p.notes,
    lang: p.lang,
    stage: p.stage,
    furthest: p.furthest,
    stageChangedAt: p.stageChangedAt,
    followUpAt: p.followUpAt,
    nextAction: p.nextAction,
    createdByUid: p.createdBy,
    openedAt: p.createdAt,
    services: p.services,
    keywords: p.keywords,
    sources: p.sources,
    fieldSources: p.fieldSources,
    dedupeKeys: p.dedupeKeys,
    research: p.research,
    profile: p.profile,
    outreach: p.outreach,
    onboarding: p.onboarding,
    activity: p.activity
  };
}

export function strapiRepository(
  client: () => Promise<GrowthStrapi>,
  fetchFn?: typeof globalThis.fetch
): ProspectRepository {
  const run = async (qid: string, vars: Record<string, unknown>) => (await client()).execute(qid, vars, undefined, fetchFn);

  async function walk(qid: string): Promise<any[]> {
    const out: any[] = [];
    for (let start = 0; ; start += PAGE) {
      const page = rows(await run(qid, { start, limit: PAGE }), qid);
      out.push(...page);
      if (page.length < PAGE) return out;
    }
  }

  async function findRow(uid: string): Promise<any | null> {
    if (!uid) return null;
    const found = rows(await run('growthProspectByUid', { uid }), 'growthProspectByUid');
    return found[0] ?? null;
  }

  const locks = new Map<string, Promise<unknown>>();
  function locked<T>(uid: string, fn: () => Promise<T>): Promise<T> {
    const prev = locks.get(uid) ?? Promise.resolve();
    const next = prev.then(fn);
    const tail = next.catch(() => undefined);
    locks.set(uid, tail);
    tail.then(() => {
      if (locks.get(uid) === tail) locks.delete(uid);
    });
    return next;
  }

  return {
    list: async () => (await walk('growthProspects')).map(fromStrapi),
    get: async (id) => {
      const row = await findRow(String(id));
      return row ? fromStrapi(row) : null;
    },
    insert: async (list) => {
      // One row at a time, in order: a failure stops the import where it is,
      // and the rows already written are real rows, not a half-written file.
      for (const p of list) {
        idOf(await run('growthProspectCreate', { data: toStrapi(p) }), 'createGrowthProspect', 'growthProspectCreate');
      }
    },
    update: (id, fn) =>
      locked(String(id), async () => {
        const row = await findRow(String(id));
        if (!row) return null;
        const next = fn(fromStrapi(row));
        // The app's id never changes, whatever `fn` returned.
        const data = { ...toStrapi(next), uid: String(id) };
        idOf(await run('growthProspectUpdate', { id: String(row.id), data }), 'updateGrowthProspect', 'growthProspectUpdate');
        return { ...next, id: String(id) };
      }),
    knownKeys: async () =>
      new Set((await walk('growthProspectKeys')).flatMap((r) => arr<string>(r?.attributes?.dedupeKeys)))
  };
}
