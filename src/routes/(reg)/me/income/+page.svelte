<script>
  /**
   * /me/income — the homepage's "three ways to earn a living" graph, drawn from
   * the member's own rows.
   *
   * The pitch on the front page is a model. This page is the receipt: what
   * actually arrived, from which rikma, in which month, and how much of it came
   * in after the work was already done. It is allowed to be a small number —
   * a real small number is a better argument than an impressive model, and the
   * empty state says so rather than hiding the page.
   */
  import { t, isRtl } from '$lib/translations';
  import MyIncomeChart from '$lib/components/income/MyIncomeChart.svelte';

  let { data } = $props();

  let series = $derived(data.summary.series ?? []);
  /** Which currency is on screen. Amounts in different currencies never mix. */
  let picked = $state(0);
  let current = $derived(series[Math.min(picked, Math.max(series.length - 1, 0))] ?? null);

  const fmtNumber = (/** @type {number} */ n, /** @type {string} */ loc) =>
    new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(n);

  let money = $derived((/** @type {number} */ n) =>
    current ? `${fmtNumber(n, $isRtl ? 'he' : 'en')} ${current.currency}`.trim() : ''
  );

  /** 'YYYY-MM' → a month the reader recognises. */
  let monthName = $derived((/** @type {string | null} */ key) => {
    if (!key) return '';
    const [y, m] = key.split('-').map(Number);
    return new Intl.DateTimeFormat($isRtl ? 'he' : 'en', {
      month: 'short',
      year: 'numeric'
    }).format(new Date(Date.UTC(y, m - 1, 1)));
  });

  let tiles = $derived(
    current === null
      ? []
      : [
          { key: 'total', value: money(current.total) },
          { key: 'rikmas', value: String(current.rikmas.length) },
          { key: 'span', value: String(current.monthsSpanned) },
          { key: 'best', value: money(current.bestMonth?.total ?? 0) }
        ]
  );
</script>

<svelte:head>
  <title>{$t('me.income.title')}</title>
</svelte:head>

<div dir={$isRtl ? 'rtl' : 'ltr'} class="max-w-2xl pb-20 mx-auto px-3 py-4 space-y-4">
  <header class="text-center">
    <h1 class="text-2xl font-extrabold text-barbi">💗 {$t('me.income.title')}</h1>
    <p class="text-sm text-gray-500 dark:text-gray-400">{$t('me.income.sub')}</p>
    <a href="/me" class="text-xs text-gray-400 hover:text-barbi">← {$t('me.income.backToMe')}</a>
  </header>

  {#if data.failed}
    <p
      class="rounded-2xl border border-amber-300 bg-amber-50 text-amber-800 px-4 py-3 text-sm text-center"
    >
      {$t('me.income.loadFailed')}
    </p>
  {:else if data.summary.empty}
    <!-- Nothing yet is a real answer, and the honest thing to do with it is to
         say what would change it rather than to dress it up. -->
    <div
      class="rounded-3xl border-2 border-barbi/40 bg-white/70 px-5 py-6 text-center space-y-3"
    >
      <p class="text-slate-800 font-semibold">{$t('me.income.emptyTitle')}</p>
      <p class="text-slate-600 text-sm leading-relaxed">{$t('me.income.emptyBody')}</p>
      <div class="flex flex-wrap justify-center gap-2 pt-1">
        <a
          href="/lev"
          class="bg-barbi hover:bg-white hover:text-barbi text-gold font-bold px-5 py-2 rounded-2xl shadow transition-colors"
          >{$t('me.income.emptyCtaLev')}</a
        >
        <a
          href="/availableMission"
          class="border-2 border-barbi text-barbi hover:bg-barbi hover:text-gold font-bold px-5 py-2 rounded-2xl transition-colors"
          >{$t('me.income.emptyCtaMissions')}</a
        >
      </div>
    </div>
  {:else if current}
    {#if series.length > 1}
      <!-- One tab per currency. Converting them would invent an exchange rate
           nobody agreed to, so they simply stay apart. -->
      <div class="flex flex-wrap justify-center gap-2">
        {#each series as s, i (s.currency)}
          <button
            type="button"
            onclick={() => (picked = i)}
            aria-pressed={picked === i}
            class="px-3 py-1 rounded-full text-sm font-semibold transition-colors {picked === i
              ? 'bg-barbi text-gold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
          >
            {s.currencyName || s.currency || $t('me.income.noCurrency')}
          </button>
        {/each}
      </div>
    {/if}

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {#each tiles as tile (tile.key)}
        <div class="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center">
          <p class="text-xl font-bold text-slate-800 leading-tight break-words">
            {tile.value}
          </p>
          <p class="text-[11px] text-slate-500 mt-1 leading-tight">
            {$t(`me.income.tile.${tile.key}`)}
          </p>
        </div>
      {/each}
    </div>

    <section class="rounded-3xl border-2 border-barbi/40 bg-white/70 px-3 py-4">
      <h2 class="text-center font-bold text-slate-800 mb-1">
        {$t('me.income.chartTitle')}
      </h2>
      <p class="text-center text-xs text-slate-500 mb-3">
        {$t('me.income.chartSub', {
          from: monthName(current.firstMonth),
          to: monthName(current.lastMonth)
        })}
      </p>
      <MyIncomeChart series={current} />
    </section>

    {#if current.concurrentPeak > 1}
      <p
        class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 text-center"
      >
        {$t('me.income.concurrent', { count: current.concurrentPeak })}
      </p>
    {/if}

    {#if current.afterWorkTotal > 0}
      <!-- The one claim the homepage graph makes that a bar chart cannot show
           on its own: money that arrived long after the work was finished. -->
      <div class="rounded-2xl border-2 border-barbi bg-barbi/5 px-4 py-4 text-center">
        <p class="text-2xl font-bold text-barbi">{money(current.afterWorkTotal)}</p>
        <p class="text-sm text-slate-700 mt-1">
          {$t('me.income.afterWork', {
            percent: Math.round(current.afterWorkShare * 100)
          })}
        </p>
        <p class="text-xs text-slate-500 mt-1">{$t('me.income.afterWorkNote')}</p>
      </div>
    {/if}

    {#if current.pending.amount > 0}
      <p
        class="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 text-center"
      >
        {$t('me.income.pending', {
          amount: money(current.pending.amount),
          count: current.pending.count
        })}
      </p>
    {/if}

    {#if data.hoursLogged > 0}
      <p class="text-center text-xs text-slate-500">
        {$t('me.income.hours', { hours: Math.round(data.hoursLogged) })}
      </p>
    {/if}

    <p class="text-center text-xs text-slate-400 leading-relaxed">
      {$t('me.income.method')}
    </p>
  {/if}
</div>
