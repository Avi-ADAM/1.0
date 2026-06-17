/**
 * Platform site-share income Sheirut (PLAN_SITE_SHARE_PER_MEMBER §5/§6, M4).
 *
 * The receiving side models the platform's income as ONE Sheirut per source split
 * (the `source_tosplit` is the aggregation key), accumulating the decided
 * contributions of that split. Members volunteer to receive it via the existing
 * `iCanGetMonay` flow, and each member's personal transfer Haluka points at the
 * chosen volunteer (NOT `user_1s[0]`).
 *
 * `ensurePlatformIncomeSheirut` is idempotent: it recomputes the running total
 * from the live contributions (so re-decisions stay correct) and upserts the
 * single income Sheirut. Called lazily from `decideSiteShare` whenever a
 * contribution lands as `decided & amount>0`.
 *
 * 0/skip invariant (§5): only `decided & amount>0` rows feed the total — a
 * `skipped`/0 record never opens a transfer window, so it adds nothing here.
 */

type StrapiExec = (qid: string, vars: Record<string, unknown>) => Promise<any>;

/** Sum the decided (amount>0) contributions for one tosplit — the income total. */
async function sumDecidedForTosplit(exec: StrapiExec, tosplitId: string): Promise<number> {
  const res = await exec('210getSiteShareContributionsByTosplit', { tosplit: String(tosplitId) });
  const rows = res?.data?.siteShareContributions?.data ?? [];
  let sum = 0;
  for (const row of rows) {
    const a = row.attributes ?? {};
    if (a.des_status === 'decided') sum += Number(a.amount) || 0;
  }
  return Math.round((sum + Number.EPSILON) * 100) / 100;
}

export interface EnsureIncomeArgs {
  tosplitId: string;
  platformProjectId: string;
  sourceProjectId?: string | null;
  /** Source rikma name — only used to brand a freshly created income Sheirut. */
  sourceProjectName?: string | null;
}

/**
 * Ensure the platform income Sheirut for a source split exists and carries the
 * up-to-date running total. Returns its id (or null if nothing to record — e.g.
 * the split has no decided contribution yet, so we don't create an empty income).
 */
export async function ensurePlatformIncomeSheirut(
  exec: StrapiExec,
  { tosplitId, platformProjectId, sourceProjectId, sourceProjectName }: EnsureIncomeArgs,
): Promise<string | null> {
  const total = await sumDecidedForTosplit(exec, tosplitId);

  // Find the single existing income Sheirut for this source split.
  const found = await exec('212getSiteShareIncomeSheirutByTosplit', { tosplit: String(tosplitId) });
  const existingId = found?.data?.sheiruts?.data?.[0]?.id ?? null;

  // Nothing decided yet — don't materialise an empty income line.
  if (!existingId && total <= 0) return null;

  if (existingId) {
    await exec('213updateSheirut', {
      id: String(existingId),
      data: { price: total, total },
    });
    return String(existingId);
  }

  // Create the income Sheirut on the platform project. No publishedAt (matching
  // createSheirutFromPending — Sheirut reads live without it). The chosen
  // receiver/volunteer is resolved later via iCanGetMonay (empty-state until then).
  const name = sourceProjectName
    ? `חלק האתר — ${sourceProjectName}`
    : 'חלק האתר';
  const created = await exec('87createSheirut', {
    data: {
      project: String(platformProjectId),
      isSiteShareIncome: true,
      source_tosplit: String(tosplitId),
      source_project: sourceProjectId ? String(sourceProjectId) : undefined,
      name,
      descrip: 'הכנסת שירות הניהול והשותפות של 1💗1 — מאוגדת לכל חלוקת מקור.',
      price: total,
      total,
      isApruved: true,
      archived: false,
      oneTime: true,
    },
  });
  const newId = created?.data?.createSheirut?.data?.id ?? null;
  return newId ? String(newId) : null;
}
