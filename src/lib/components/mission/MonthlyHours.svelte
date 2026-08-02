<script>
  /**
   * MonthlyHours — a mission's hours ledger, month by month, with the current
   * month counting up **live**.
   *
   * The stored `monter` rows only ever describe *closed* months, and the
   * `howmanyhoursalready` counter they are filed from carries no month at all —
   * that mismatch is what let a monthi run file August's hours under July. So
   * this reads the months back from the timer segments themselves
   * (`buildMonthlyLedger`, the same arithmetic /api/monthi writes and
   * /api/fixer repairs with), shows the open month as it accumulates, and
   * marks any past month where the stored row and the timers disagree.
   *
   * Used by the process page (moach/[projectId]/processes/[processId]) and the
   * progress board. It inherits the host's `--pcv-*` tokens when they exist and
   * falls back to a light-on-dark glass look otherwise.
   */
  import { onDestroy } from 'svelte';
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { buildMonthlyLedger, segmentsFromTimers } from '$lib/recurring/missionMonths.js';

  let {
    /** `monter` component rows as stored. */
    monter = [],
    /** Strapi Timer entities of the mission (with their `timers { start stop }`). */
    timers = [],
    /** Pre-flattened segments, when the caller already has them. */
    segments = null,
    /** Mission `hoursassinged` — the monthly plan when a row carries none. */
    hoursassinged = 0,
    /** `howmanyhoursalready`, the fallback for a mission with no timers at all. */
    counter = 0,
    /** Hide the heading when the host already titles the block. */
    showTitle = true
  } = $props();

  let allSegments = $derived(segments ?? segmentsFromTimers(timers));

  // A segment with no `stop` is a timer running right now: the open month grows
  // by itself, so re-read the clock while it does. Nothing ticks otherwise.
  let running = $derived(allSegments.some((s) => s?.start && !s.stop));
  let now = $state(new Date());
  let ticker = null;

  $effect(() => {
    clearInterval(ticker);
    if (!running) return;
    now = new Date();
    ticker = setInterval(() => (now = new Date()), 30_000);
    return () => clearInterval(ticker);
  });
  onDestroy(() => clearInterval(ticker));

  let ledger = $derived(
    buildMonthlyLedger({
      rows: monter,
      segments: allSegments,
      hoursassinged,
      counter,
      now
    })
  );

  let locale = $derived(
    $lang === 'he' ? 'he-IL' : $lang === 'ar' ? 'ar' : $lang === 'ru' ? 'ru-RU' : $lang === 'es' ? 'es-ES' : 'en-GB'
  );

  function monthLabel(key) {
    const [y, m] = String(key).split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    if (Number.isNaN(d.getTime())) return key;
    return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }

  function hrs(value) {
    return (Math.round((Number(value) || 0) * 100) / 100).toLocaleString('en-US', {
      maximumFractionDigits: 2
    });
  }

  /** How full the month's bar is. Over-delivery is capped at 100% but coloured. */
  function pct(month) {
    if (!(month.assigned > 0)) return month.hoursDone > 0 ? 100 : 0;
    return Math.min(100, (month.hoursDone / month.assigned) * 100);
  }

  // Literal $t() calls per state so `npm run check:i18n` can see every key.
  function stateLabel(state) {
    if (state === 'approved') return $t('process.months.stateApproved');
    if (state === 'live') return $t('process.months.stateLive');
    if (state === 'mismatch') return $t('process.months.stateMismatch');
    if (state === 'unverified') return $t('process.months.stateUnverified');
    return $t('process.months.stateFiled');
  }
</script>

<section class="mh">
  {#if showTitle}
    <header class="mh-head">
      <h4 class="mh-title">{$t('process.months.title')}</h4>
      <span class="mh-total">
        {$t('process.months.total')}
        <strong>{hrs(ledger.totalDone)}</strong>
        {$t('process.months.hours')}
      </span>
    </header>
  {/if}

  <ul class="mh-list">
    {#each ledger.months as month (month.key)}
      <li class="mh-row" class:mh-row--live={month.isOpen}>
        <div class="mh-line">
          <span class="mh-month">
            {#if month.isOpen && running}<span class="mh-dot" aria-hidden="true"></span>{/if}
            {monthLabel(month.key)}
          </span>

          <span class="mh-chip mh-chip--{month.state}">{stateLabel(month.state)}</span>

          <span class="mh-nums">
            <strong>{hrs(month.hoursDone)}</strong>
            {#if month.assigned > 0}<span class="mh-of">/ {hrs(month.assigned)}</span>{/if}
            <span class="mh-unit">{$t('process.months.hours')}</span>
          </span>
        </div>

        <div
          class="mh-bar"
          role="progressbar"
          aria-valuenow={Math.round(pct(month))}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label={monthLabel(month.key)}
        >
          <div class="mh-bar-fill mh-bar-fill--{month.state}" style="width: {pct(month)}%"></div>
        </div>

        {#if month.state === 'mismatch'}
          <!-- The stored row is what the monthly close wrote; the timers are the
               only month-aware record, so they win on screen. /api/fixer is what
               makes the stored ledger agree. -->
          <p class="mh-note">
            {month.filed == null
              ? $t('process.months.noteMissing')
              : $t('process.months.noteFiled', { hours: hrs(month.filed) })}
          </p>
        {:else if month.state === 'unverified'}
          <p class="mh-note">{$t('process.months.noteUnverified')}</p>
        {:else if month.isOpen}
          <p class="mh-note mh-note--soft">
            {running ? $t('process.months.noteRunning') : $t('process.months.noteOpen')}
          </p>
        {/if}
      </li>
    {/each}
  </ul>
</section>

<style>
  .mh {
    --mh-text: var(--pcv-text, #f8fafc);
    --mh-text-2: var(--pcv-text-2, rgba(255, 255, 255, 0.8));
    --mh-text-3: var(--pcv-text-3, rgba(255, 255, 255, 0.6));
    /* The fallbacks are a dark glass, not a white wash: this block also sits on
       the progress board's teal gradient, where a translucent white card and a
       tinted chip both wash out. Hosts with the `--pcv-*` cascade (the process
       page) override them. */
    --mh-surface: var(--pcv-node-bg, rgba(15, 23, 42, 0.38));
    --mh-border: var(--pcv-node-border, rgba(255, 255, 255, 0.22));
    --mh-track: rgba(2, 6, 23, 0.35);
    --mh-chip-bg: rgba(2, 6, 23, 0.5);

    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .mh-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }

  .mh-title {
    margin: 0;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--badge-sky-text, #67e8f9);
  }

  .mh-total {
    font-size: 11px;
    color: var(--mh-text-3);
  }
  .mh-total strong {
    font-size: 13px;
    font-weight: 700;
    color: var(--mh-text);
    font-variant-numeric: tabular-nums;
  }

  .mh-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .mh-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 9px 11px;
    border-radius: 12px;
    background: var(--mh-surface);
    border: 1px solid var(--mh-border);
  }

  /* The month in progress is the one the reader is standing in — give it the
     accent border so it reads as "now", not as one more archived row. */
  .mh-row--live {
    border-color: var(--badge-rose-text, #ff9ad5);
    background: var(--badge-rose-bg, rgba(255, 0, 146, 0.1));
  }

  .mh-line {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .mh-month {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: var(--mh-text);
  }

  .mh-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--badge-rose-text, #ff9ad5);
    box-shadow: 0 0 0 0 currentColor;
    animation: mh-pulse 1.8s ease-in-out infinite;
  }
  @keyframes mh-pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.45;
      transform: scale(0.8);
    }
  }

  .mh-nums {
    margin-inline-start: auto;
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    font-variant-numeric: tabular-nums;
    color: var(--mh-text-2);
    font-size: 12px;
  }
  .mh-nums strong {
    font-size: 15px;
    font-weight: 700;
    color: var(--mh-text);
  }
  .mh-of {
    color: var(--mh-text-3);
  }
  .mh-unit {
    font-size: 11px;
    color: var(--mh-text-3);
  }

  .mh-bar {
    height: 5px;
    border-radius: 9999px;
    background: var(--mh-track);
    overflow: hidden;
  }
  .mh-bar-fill {
    height: 100%;
    border-radius: 9999px;
    transition: width 0.4s ease;
    background: var(--badge-grey-text, #94a3b8);
  }
  .mh-bar-fill--live {
    background: var(--badge-rose-text, #ff9ad5);
  }
  .mh-bar-fill--approved {
    background: var(--badge-green-text, #2effa8);
  }
  .mh-bar-fill--filed {
    background: var(--badge-sky-text, #67e8f9);
  }
  .mh-bar-fill--mismatch {
    background: var(--badge-gold-text, #eee8aa);
  }
  .mh-bar-fill--unverified {
    background: var(--badge-grey-text, #94a3b8);
  }

  .mh-chip {
    display: inline-flex;
    align-items: center;
    padding: 1px 8px;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 700;
    white-space: nowrap;
  }
  .mh-chip--approved {
    background: var(--badge-green-bg, var(--mh-chip-bg));
    color: var(--badge-green-text, #2effa8);
  }
  .mh-chip--live {
    background: var(--badge-rose-bg, var(--mh-chip-bg));
    color: var(--badge-rose-text, #ff9ad5);
  }
  .mh-chip--filed {
    background: var(--badge-sky-bg, var(--mh-chip-bg));
    color: var(--badge-sky-text, #67e8f9);
  }
  .mh-chip--mismatch {
    background: var(--badge-gold-bg, var(--mh-chip-bg));
    color: var(--badge-gold-text, #eee8aa);
  }
  .mh-chip--unverified {
    background: var(--badge-grey-bg, var(--mh-chip-bg));
    color: var(--badge-grey-text, #cbd5e1);
  }

  .mh-note {
    margin: 0;
    font-size: 11px;
    line-height: 1.4;
    color: var(--mh-text-3);
  }
  .mh-note--soft {
    opacity: 0.85;
  }
</style>
