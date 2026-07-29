<script>
  /**
   * EquityPreview — reusable "what share of the rikma will this mission be
   * worth" widget. Display-only; the math lives in the pure
   * `computeMissionEquity` module and the rikma summary is fetched (once per
   * rikma) through `projectValueStore`.
   *
   * See docs/PLAN_MISSION_EQUITY_PREVIEW.md §4. Fails silent — if the summary
   * query errors or the viewer lacks read access, the widget renders nothing so
   * a host card never breaks.
   */
  import { t, isRtl } from '$lib/translations';
  import {
    computeEquityScenarios,
    computeEquityHorizons,
    formatSharePct,
    INCOME_WINDOW_MONTHS
  } from '$lib/equity/computeMissionEquity.js';
  import { getProjectValueSummary } from '$lib/equity/projectValueStore.svelte.js';

  /**
   * @typedef {import('$lib/equity/computeMissionEquity.js').ProjectValueSummary} ProjectValueSummary
   *
   * @typedef {Object} Props
   * @property {string|number|null|undefined} projectId - rikma id; falsy ⇒ render nothing (e.g. concierge missions with no project).
   * @property {number} missionValue - the mission's value V (₪). For a recurring mission this is **one month's** worth.
   * @property {number|null} [monthlyValue] - ₪/month for an open-ended recurring mission (`iskvua`), which unlocks the 1/2/5-year rows. Usually the same number as `missionValue`; pass the per-month equivalent when the cycle isn't monthly. Null/0 ⇒ one-off, no horizons.
   * @property {'none'|'approved'|'pipeline'} [alreadyCountedIn] - where the mission already lives, to avoid double-counting.
   * @property {ProjectValueSummary|null} [summary] - preloaded summary; skips the fetch when provided.
   * @property {boolean} [compact] - single-line chip that expands on click.
   * @property {boolean} [isSer] - use the service token (public availableMission page).
   * @property {string} [titleKey] - i18n key for the heading (default 'equity.title').
   * @property {((x: any) => void)|null} [onHover] - passthrough for the lev cards' hover hint.
   */

  /** @type {Props} */
  let {
    projectId,
    missionValue,
    monthlyValue = null,
    alreadyCountedIn = 'none',
    summary = null,
    compact = false,
    isSer = false,
    titleKey = 'equity.title',
    onHover = null
  } = $props();

  /** @type {ProjectValueSummary|null} */
  let fetchedState = $state(null);
  let failed = $state(false);
  let expanded = $state(false);

  // A preloaded `summary` prop always wins; otherwise use what we fetched.
  const fetched = $derived(summary ?? fetchedState);

  // Fetch the rikma summary once per projectId (skipped when preloaded).
  $effect(() => {
    if (summary) return;
    const pid = projectId != null ? String(projectId) : '';
    if (!pid) {
      fetchedState = null;
      return;
    }
    let cancelled = false;
    failed = false;
    getProjectValueSummary(pid, { isSer })
      .then((s) => {
        if (!cancelled) fetchedState = s;
      })
      .catch(() => {
        if (!cancelled) failed = true;
      });
    return () => {
      cancelled = true;
    };
  });

  const value = $derived(Number(missionValue) || 0);

  const scenarios = $derived(
    fetched ? computeEquityScenarios(fetched, value, { alreadyCountedIn }) : []
  );
  const current = $derived(scenarios.find((s) => s.baseline === 'current') ?? null);
  const approved = $derived(scenarios.find((s) => s.baseline === 'approved') ?? null);
  const pipeline = $derived(scenarios.find((s) => s.baseline === 'pipeline') ?? null);

  // Only show the pipeline row when there's actually an open pipeline to speak
  // of and it changes the picture beyond the approved baseline.
  const showPipeline = $derived(
    !!fetched && fetched.openPipelineValue > 0 && !!pipeline
  );

  // A recurring mission keeps earning share every month, so the rows above —
  // which price a single month — are only the first step. Project 1/2/5 years.
  const perMonth = $derived(Number(monthlyValue) || 0);
  const horizons = $derived(
    fetched && perMonth > 0
      ? computeEquityHorizons(fetched, perMonth, { alreadyCountedIn })
      : []
  );

  function fmtNum(n) {
    return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  // True when the V the baselines price *is* the monthly figure (a monthly
  // mission). A recurring resource billed per year passes a cycle as V and a
  // twelfth of it as monthlyValue — there "monthly value" would be a lie.
  const valueIsMonthly = $derived(perMonth > 0 && Math.abs(perMonth - value) < 0.5);
  function detail(scenario) {
    return valueIsMonthly
      ? $t('equity.ofTotalMonthly', { value: fmtNum(value), total: fmtNum(scenario.base) })
      : $t('equity.ofTotal', { value: fmtNum(value), total: fmtNum(scenario.base) });
  }
  function horizonDetail(h) {
    return $t('equity.ofTotalCumulative', {
      value: fmtNum(h.cumulativeValue),
      total: fmtNum(h.base)
    });
  }
  // Literal $t() calls (not a key map) so `npm run check:i18n` can see them.
  function horizonLabel(months) {
    if (months <= 12) return $t('equity.horizon1y');
    if (months <= 24) return $t('equity.horizon2y');
    return $t('equity.horizon5y');
  }
  function monthly(scenario) {
    if (scenario?.monthlyEstimate == null) return null;
    return $t('equity.perMonthEstimate', { amount: fmtNum(scenario.monthlyEstimate) });
  }
  // The ₪/month figure is a projection, not a promise. Say so in visible text
  // (a tooltip is invisible on touch): which basis it used, and that it can
  // change.
  const estimateNote = $derived(
    fetched?.monthlyIncomeSource === 'commitments'
      ? $t('equity.estimateNoteCommitments')
      : $t('equity.estimateNote', { months: INCOME_WINDOW_MONTHS })
  );
  const showEstimateNote = $derived(fetched?.monthlyIncomeEstimate != null);

  function hover(x) {
    onHover?.(x);
  }
</script>

<!-- render nothing until we have data, or if it failed / value is non-positive -->
{#if fetched && !failed && value > 0}
  {@const heading = $t(titleKey)}
  {#if compact && !expanded}
    <button
      type="button"
      dir={$isRtl ? 'rtl' : 'ltr'}
      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-600 hover:border-gold transition-colors"
      onclick={(e) => {
        e.stopPropagation();
        expanded = true;
      }}
      onmouseenter={() => hover(heading)}
      onmouseleave={() => hover('0')}
    >
      <span class="text-gray-500 dark:text-gray-400">{heading}</span>
      <span class="text-gold font-bold">{formatSharePct(current?.sharePct ?? 0)}</span>
    </button>
  {:else}
    <div
      dir={$isRtl ? 'rtl' : 'ltr'}
      class="rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 p-3 space-y-1.5 text-sm"
    >
      <div class="flex items-center gap-1.5 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
        <span>💠</span>
        <span>{heading}</span>
      </div>

      <!-- 1. current value -->
      {#if current}
        <div
          class="flex flex-wrap items-baseline gap-x-2 cursor-help"
          onmouseenter={() => hover($t('equity.baselineCurrent'))}
          onmouseleave={() => hover('0')}
          role="contentinfo"
        >
          <span class="text-gray-700 dark:text-gray-200">{$t('equity.baselineCurrent')}</span>
          <span class="font-bold text-gold">{formatSharePct(current.sharePct)}</span>
          <span class="text-xs text-gray-400 dark:text-gray-500">({detail(current)})</span>
          {#if monthly(current)}
            <span class="text-xs text-emerald-600 dark:text-emerald-400" title={estimateNote}>
              {monthly(current)}
            </span>
          {/if}
        </div>
      {/if}

      <!-- 2. including approved & in-progress -->
      {#if approved}
        <div
          class="flex flex-wrap items-baseline gap-x-2 cursor-help"
          onmouseenter={() => hover($t('equity.baselineApproved'))}
          onmouseleave={() => hover('0')}
          role="contentinfo"
        >
          <span class="text-gray-700 dark:text-gray-200">{$t('equity.baselineApproved')}</span>
          <span class="font-bold text-gray-800 dark:text-gray-100">{formatSharePct(approved.sharePct)}</span>
          <span class="text-xs text-gray-400 dark:text-gray-500">({detail(approved)})</span>
          {#if monthly(approved)}
            <span class="text-xs text-emerald-600 dark:text-emerald-400" title={estimateNote}>
              {monthly(approved)}
            </span>
          {/if}
        </div>
      {/if}

      <!-- 3. optional: whole open pipeline -->
      {#if showPipeline && pipeline}
        <div
          class="flex flex-wrap items-baseline gap-x-2 text-gray-500 dark:text-gray-400 cursor-help"
          onmouseenter={() => hover($t('equity.baselinePipeline'))}
          onmouseleave={() => hover('0')}
          role="contentinfo"
        >
          <span>{$t('equity.baselinePipeline')}</span>
          <span class="font-semibold">{formatSharePct(pipeline.sharePct)}</span>
          <span class="text-xs text-gray-400 dark:text-gray-500">({detail(pipeline)})</span>
          {#if monthly(pipeline)}
            <span class="text-xs text-emerald-600 dark:text-emerald-400" title={estimateNote}>
              {monthly(pipeline)}
            </span>
          {/if}
        </div>
      {/if}

      <!-- 4. recurring mission with no end date — where it lands over time -->
      {#if horizons.length > 0}
        <div class="pt-1.5 mt-1 border-t border-gray-200 dark:border-slate-600 space-y-1">
          <div
            class="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400"
            onmouseenter={() => hover($t('equity.horizonsTitle'))}
            onmouseleave={() => hover('0')}
            role="contentinfo"
          >
            <span>🔁</span>
            <span>{$t('equity.horizonsTitle')}</span>
          </div>
          {#each horizons as h (h.months)}
            <div class="flex flex-wrap items-baseline gap-x-2">
              <span class="text-gray-700 dark:text-gray-200">{horizonLabel(h.months)}</span>
              <span class="font-bold text-gold">{formatSharePct(h.sharePct)}</span>
              <span class="text-xs text-gray-400 dark:text-gray-500">({horizonDetail(h)})</span>
              {#if monthly(h)}
                <span class="text-xs text-emerald-600 dark:text-emerald-400">{monthly(h)}</span>
              {/if}
            </div>
          {/each}
          <p class="text-[11px] leading-snug text-gray-500 dark:text-gray-400">
            {$t('equity.horizonNote')}
          </p>
        </div>
      {/if}

      <!-- 5. the money column is an estimate — spell it out, always visible -->
      {#if showEstimateNote}
        <p
          class="pt-1.5 mt-1 border-t border-gray-200 dark:border-slate-600 text-[11px] leading-snug text-gray-500 dark:text-gray-400"
        >
          {estimateNote}
        </p>
      {/if}
    </div>
  {/if}
{/if}
