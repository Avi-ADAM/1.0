/**
 * "Is this part of the Strapi schema deployed yet?" — one cached answer per
 * question (PLAN_SHOP_CUSTOMER_EXPERIENCE §6.8).
 *
 * Columns land in `1.0b` on a different day than the code that reads them, and
 * asking for a field that does not exist fails the *whole* GraphQL query. So a
 * caller asks a tiny probe first and, while the answer is "not yet", serves
 * exactly what it served before the columns were designed.
 *
 * The verdict is process state, deliberately: one tiny query per ten minutes,
 * and a deployment that adds the columns starts serving them without a restart
 * (the shorter retry on "not there yet").
 *
 * Its own module — no imports — so an action config can ask too without pulling
 * the catalog (and, through it, the action registry) into a cycle.
 */

export type ProbeRun = (qid: string, vars: Record<string, unknown>) => Promise<any>;

const SHOP_SCHEMA_TTL_MS = 10 * 60 * 1000;
const SHOP_SCHEMA_RETRY_MS = 60 * 1000;

export function errorText(e: any): string {
  return String(e?.getMessages ? e.getMessages().join(' ') : (e?.message ?? e));
}

/**
 * One cached "is this part of the schema readable?" question.
 *
 * A field that does not exist and a Strapi that is briefly unhappy both land
 * here as "not live" — the difference is only how long we believe it. A
 * validation error means the schema is absent (check again in ten minutes); a
 * network error means we do not know (check again in one minute).
 */
export function schemaProbe(opts: {
  qid: string;
  /** Given the probe's answer — is the schema there? */
  isLive: (res: any) => boolean;
  /** What callers do meanwhile, for the warning on an unexpected failure. */
  meanwhile: string;
}) {
  let verdict: { live: boolean; until: number } | null = null;
  return {
    reset() {
      verdict = null;
    },
    async live(run: ProbeRun): Promise<boolean> {
      const now = Date.now();
      if (verdict && verdict.until > now) return verdict.live;

      let live = false;
      let retryMs = SHOP_SCHEMA_RETRY_MS;
      try {
        live = opts.isLive(await run(opts.qid, {}));
        retryMs = live ? SHOP_SCHEMA_TTL_MS : SHOP_SCHEMA_RETRY_MS;
      } catch (e) {
        const message = errorText(e);
        // "The columns are not there yet" is the expected state during the
        // rollout described in §6.8 — it is not a warning, it is a schedule.
        // Anything else (a network failure, an unreadable deployment) *is*
        // worth saying out loud.
        const schemaMissing = /GRAPHQL_VALIDATION_FAILED|Cannot query field/i.test(message);
        const qidMissing = /QUERY_NOT_FOUND|not found in QIDS/i.test(message);
        retryMs = schemaMissing ? SHOP_SCHEMA_TTL_MS : SHOP_SCHEMA_RETRY_MS;
        if (!schemaMissing && !qidMissing) {
          console.warn(`[apiPublic] ${opts.qid} could not be checked — ${opts.meanwhile}:`, message);
        }
      }
      verdict = { live, until: now + retryMs };
      return live;
    }
  };
}
