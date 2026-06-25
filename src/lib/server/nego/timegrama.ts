/**
 * Candidacy timegrama lifecycle for open-offer negotiation (Ask / Askm).
 *
 * Per docs/PLAN_NEGOTIATION_CANDIDATES.md §A.1, the deadline timegrama is NOT
 * created when an external candidate first applies/proposes — it is created when
 * a rikma member first engages (a favorable vote or a counter), and reset when a
 * counter opens a fresh response window. This helper centralizes that so the
 * vote/counter/accept/customize actions stay consistent.
 */

type StrapiExecutor = {
  execute: (
    queryId: string,
    variables: Record<string, unknown>,
    userJwt?: string,
    fetchFn?: typeof globalThis.fetch
  ) => Promise<any>;
};

type Ctx = { jwt?: string; fetch?: typeof globalThis.fetch };

const RESTIME_HOURS: Record<string, number> = { feh: 48, sth: 72, nsh: 96, sevend: 168 };

function deadlineFrom(restime: string | undefined): string {
  const hours = RESTIME_HOURS[restime ?? 'feh'] ?? 48;
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

export interface EnsureTimegramaOpts {
  side: 'ask' | 'askm';
  id: string | number;
  /** Known project id (counters pass it). When absent, fetched from the entity. */
  projectId?: string | number;
  /** Known restime — skips the project fetch when provided. */
  restime?: string;
  /** When true, reset an existing active timegrama's date (fresh response window). */
  reset?: boolean;
}

/**
 * Ensure a candidacy timegrama exists for an Ask/Askm. Creates one if none is
 * active; with `reset`, pushes an existing one's deadline forward. No-op-safe:
 * returns the timegrama id (or null on failure) and never throws.
 */
export async function ensureCandidacyTimegrama(
  strapi: StrapiExecutor,
  context: Ctx,
  opts: EnsureTimegramaOpts
): Promise<string | null> {
  const { side, id } = opts;
  const idStr = String(id);
  const jwt = context.jwt;
  const fetchFn = context.fetch;

  try {
    // Resolve restime (deadline window) if not supplied.
    let restime = opts.restime;
    if (restime == null) {
      const qid = side === 'ask' ? 'getAskProjectRestime' : 'getAskmProjectRestime';
      const res = await strapi.execute(qid, { id: idStr }, jwt, fetchFn).catch(() => null);
      const entity = side === 'ask' ? res?.data?.ask : res?.data?.askm;
      restime = entity?.data?.attributes?.project?.data?.attributes?.restime ?? 'feh';
    }
    const date = deadlineFrom(restime);

    // Look for an already-active timegrama.
    const getActive = side === 'ask' ? 'getActiveTimegramaForAsk' : 'getActiveTimegramaForAskm';
    const activeRes = await strapi.execute(getActive, { id: idStr }, jwt, fetchFn).catch(() => null);
    const activeId = activeRes?.data?.timegramas?.data?.[0]?.id;

    if (activeId) {
      if (opts.reset) {
        await strapi.execute('mrResetTimegrama', { id: String(activeId), date }, jwt, fetchFn).catch(() => null);
      }
      return String(activeId);
    }

    // None active → create one.
    if (side === 'ask') {
      const c = await strapi
        .execute('82createTimegramaForAsk', { date, whatami: 'ask', askId: idStr }, jwt, fetchFn)
        .catch(() => null);
      return c?.data?.createTimegrama?.data?.id ?? null;
    }
    const c = await strapi
      .execute('127createTimegramaForAskm', { date, askmId: idStr }, jwt, fetchFn)
      .catch(() => null);
    return c?.data?.createTimegrama?.data?.id ?? null;
  } catch (e) {
    console.error('ensureCandidacyTimegrama failed', e);
    return null;
  }
}

/**
 * Cancel (mark done) the active candidacy timegrama for an Ask/Askm — used when a
 * candidate raises a counter, handing the turn back to the members. The gate
 * would block it anyway, but cancelling keeps a stale clock from lingering. A
 * subsequent member vote recreates a fresh one. No-op-safe; never throws.
 */
export async function cancelCandidacyTimegrama(
  strapi: StrapiExecutor,
  context: Ctx,
  side: 'ask' | 'askm',
  id: string | number
): Promise<void> {
  try {
    const getActive = side === 'ask' ? 'getActiveTimegramaForAsk' : 'getActiveTimegramaForAskm';
    const activeRes = await strapi
      .execute(getActive, { id: String(id) }, context.jwt, context.fetch)
      .catch(() => null);
    const activeId = activeRes?.data?.timegramas?.data?.[0]?.id;
    if (activeId) {
      await strapi
        .execute('mrSetTimegramaDone', { id: String(activeId), done: true }, context.jwt, context.fetch)
        .catch(() => null);
    }
  } catch (e) {
    console.error('cancelCandidacyTimegrama failed', e);
  }
}
