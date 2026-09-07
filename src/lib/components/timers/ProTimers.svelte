<script>
  /**
   * The timers page, business theme.
   *
   * The personal theme puts every timer on an orbit around a big dial — an
   * identity, and the one the user asked to keep. This is the same data for the
   * reader who wants a work log: one line per mission, grouped by rikma,
   * running ones first, no motion beyond a single live pulse on what is
   * actually counting.
   *
   * It renders the SAME store as the dial and opens the SAME dialogs, so the
   * two are two skins of one page, not two pages.
   */
  import { t, isRtl } from '$lib/translations';
  import { timers } from '$lib/stores/timers';
  import { clock } from '$lib/stores/clock.svelte';
  import { hoursDone as computeHoursDone } from '$lib/timers/elapsed.js';
  import ProTimerRow from './ProTimerRow.svelte';

  /**
   * @typedef {Object} Props
   * @property {boolean} [loading] true until the first fetch has answered
   */

  /** @type {Props} */
  let { loading = false } = $props();

  let query = $state('');
  /** @type {'all' | 'running'} */
  let filter = $state('all');

  let runningCount = $derived($timers.filter((x) => x.running).length);

  /* Only the running rows need the ticking `now`; a page of stopped timers
     recomputes its totals once and then sits still. */
  let now = $derived(runningCount > 0 ? clock.seconds : 0);
  let totalHours = $derived(
    $timers.reduce((sum, x) => sum + computeHoursDone(x, now), 0)
  );

  let visible = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return $timers.filter((x) => {
      if (filter === 'running' && !x.running) return false;
      if (!q) return true;
      return (
        String(x.missionName ?? '').toLowerCase().includes(q) ||
        String(x.projectName ?? '').toLowerCase().includes(q)
      );
    });
  });

  /**
   * Grouped by rikma, running rows first inside each group, and the group that
   * has something running floats to the top — the reader's eye should land on
   * what is counting against them right now.
   */
  let groups = $derived.by(() => {
    /** @type {Map<string, { name: string, rows: any[] }>} */
    const byProject = new Map();
    for (const row of visible) {
      const key = String(row.projectId ?? row.projectName ?? '—');
      if (!byProject.has(key)) {
        byProject.set(key, { name: row.projectName || '', rows: [] });
      }
      byProject.get(key)?.rows.push(row);
    }
    const out = [...byProject.entries()].map(([key, group]) => ({
      key,
      name: group.name,
      running: group.rows.some((r) => r.running),
      hours: group.rows.reduce((sum, r) => sum + computeHoursDone(r, now), 0),
      rows: [...group.rows].sort((a, b) => {
        if (!!a.running !== !!b.running) return a.running ? -1 : 1;
        return String(a.missionName ?? '').localeCompare(String(b.missionName ?? ''));
      })
    }));
    out.sort((a, b) => {
      if (a.running !== b.running) return a.running ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return out;
  });

  const oneDecimal = (/** @type {number} */ n) =>
    (Math.round(n * 10) / 10).toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
</script>

<div class="pro" dir={$isRtl ? 'rtl' : 'ltr'}>
  <header class="head">
    <div class="titles">
      <h1>{$t('timers.proTitle')}</h1>
      <p>{$t('timers.proSubtitle')}</p>
    </div>

    <dl class="stats">
      <div class="stat" class:live={runningCount > 0}>
        <dt>{$t('timers.proStatRunning')}</dt>
        <dd>{runningCount}</dd>
      </div>
      <div class="stat">
        <dt>{$t('timers.proStatMissions')}</dt>
        <dd>{$timers.length}</dd>
      </div>
      <div class="stat">
        <dt>{$t('timers.proStatHours')}</dt>
        <dd>{oneDecimal(totalHours)}</dd>
      </div>
    </dl>
  </header>

  <div class="toolbar">
    <input
      class="search"
      type="search"
      bind:value={query}
      placeholder={$t('timers.proSearch')}
      aria-label={$t('timers.proSearch')}
    />
    <div class="filters" role="group" aria-label={$t('timers.proFilterLabel')}>
      <button
        type="button"
        class="chip"
        class:on={filter === 'all'}
        aria-pressed={filter === 'all'}
        onclick={() => (filter = 'all')}
      >
        {$t('timers.proFilterAll')}
      </button>
      <button
        type="button"
        class="chip"
        class:on={filter === 'running'}
        aria-pressed={filter === 'running'}
        onclick={() => (filter = 'running')}
      >
        {$t('timers.proFilterRunning')}
      </button>
    </div>
  </div>

  {#if loading && $timers.length === 0}
    <p class="empty">{$t('timers.proLoading')}</p>
  {:else if $timers.length === 0}
    <p class="empty">{$t('timers.proEmpty')}</p>
  {:else if visible.length === 0}
    <p class="empty">{$t('timers.proNoMatch')}</p>
  {:else}
    {#each groups as group (group.key)}
      <section class="group">
        <div class="group-head">
          <h2>{group.name}</h2>
          <span class="group-hours">{$t('timers.proHours', { done: oneDecimal(group.hours) })}</span>
        </div>
        <div class="rows">
          {#each group.rows as row (row.mId)}
            <ProTimerRow missionId={row.mId} />
          {/each}
        </div>
      </section>
    {/each}
  {/if}
</div>

<style>
  .pro {
    max-width: 68rem;
    margin: 0 auto;
    padding: 28px 20px 96px;
    color: var(--text);
  }

  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }
  .titles h1 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .titles p {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--tm);
  }

  /* Three numbers, no cards around them. The rule between them is enough
     separation and costs no visual weight. */
  .stats {
    display: flex;
    margin: 0;
    gap: 22px;
  }
  .stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-inline-start: 14px;
    border-inline-start: 2px solid var(--border);
  }
  .stat.live {
    border-inline-start-color: var(--success, #047857);
  }
  .stat dt {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--tm);
  }
  .stat dd {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin: 16px 0 18px;
  }
  .search {
    flex: 1 1 16rem;
    min-width: 0;
    padding: 8px 12px;
    border: 1px solid var(--input, var(--border));
    border-radius: var(--radius-theme, 4px);
    background: var(--surface);
    color: var(--surface-ink);
    font-size: 13px;
  }
  .search::placeholder {
    color: var(--surface-muted);
  }
  .search:focus-visible {
    outline: 2px solid var(--barbi-pink);
    outline-offset: 1px;
  }

  .filters {
    display: flex;
    gap: 4px;
    padding: 3px;
    border: 1px solid var(--border);
    border-radius: var(--radius-theme, 4px);
    background: var(--surface);
  }
  .chip {
    padding: 5px 12px;
    border: none;
    border-radius: calc(var(--radius-theme, 4px) - 1px);
    background: transparent;
    color: var(--surface-muted);
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
  }
  .chip:hover {
    color: var(--surface-ink);
  }
  .chip.on {
    background: var(--barbi-pink);
    color: var(--gold);
  }
  .chip:focus-visible {
    outline: 2px solid var(--barbi-pink);
    outline-offset: 1px;
  }

  .group + .group {
    margin-top: 22px;
  }
  .group-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }
  .group-head h2 {
    margin: 0;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--tm);
  }
  .group-hours {
    font-size: 11.5px;
    color: var(--tm);
    font-variant-numeric: tabular-nums;
  }

  .rows {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .empty {
    margin: 40px 0;
    padding: 28px;
    border: 1px dashed var(--border);
    border-radius: var(--radius-theme, 4px);
    text-align: center;
    font-size: 13.5px;
    color: var(--tm);
  }

  @media (max-width: 640px) {
    .pro {
      padding: 20px 14px 96px;
    }
    .stats {
      gap: 16px;
    }
    .stat dd {
      font-size: 17px;
    }
  }
</style>
