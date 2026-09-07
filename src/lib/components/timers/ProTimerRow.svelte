<script>
  /**
   * One mission timer, drawn as a row.
   *
   * The personal theme's `timer.svelte` draws the same record as a clock face
   * on an orbit; this is the business theme's answer to it — a dense line in a
   * ledger. Both talk to the same store through `$lib/timers/timerControls.js`
   * and open the same `TimerDialogs`, so starting a timer here and stopping it
   * on the dial is one timer, not two views that drifted.
   *
   * No local interval: the elapsed clock reads the shared `clock` store, which
   * ticks once for the whole page instead of once per row.
   */
  import { page } from '$app/state';
  import { t } from '$lib/translations';
  import { timers, updateTimers, lockTimerForEdit } from '$lib/stores/timers';
  import { clock } from '$lib/stores/clock.svelte';
  import {
    startMissionTimer,
    stopMissionTimer,
    applyTimerState
  } from '$lib/timers/timerControls.js';
  import { elapsedMs, hoursDone as computeHoursDone, formatClock } from '$lib/timers/elapsed.js';
  import TimerDialogs from './TimerDialogs.svelte';

  /**
   * @typedef {Object} Props
   * @property {string|number} missionId
   */

  /** @type {Props} */
  let { missionId } = $props();

  let showSaveDialog = $state(false);
  let showClearDialog = $state(false);
  let showSaveFinal = $state(false);
  let dialogEdit = $state(true);
  let elapsedTime = $state('00:00:00');
  let selectedTasks = $state([]);
  let taskSearchTerm = $state('');
  let busy = $state(false);

  // Read through the store, never off a snapshot prop: a socket refresh
  // replaces the array and the row has to follow it.
  let timer = $derived($timers?.find((x) => x.mId == missionId));
  let isRunning = $derived(!!timer?.running);

  /* `clock.seconds` is the shared tick — one interval for the whole page. It
     only changes when the wall-clock second does, which is exactly the
     resolution `hh:mm:ss` can show, so a stopped row never re-renders. */
  let now = $derived(isRunning ? clock.seconds : 0);
  let elapsed = $derived(elapsedMs(timer, now));
  let readout = $derived(formatClock(elapsed));

  let hoursDone = $derived(computeHoursDone(timer, now));
  let hoursAssigned = $derived(Number(timer?.hoursAssigned) || 0);
  // Only ever a bar when there is something to fill it against.
  let progress = $derived(
    hoursAssigned > 0 ? Math.min(100, (hoursDone / hoursAssigned) * 100) : null
  );
  let overBudget = $derived(hoursAssigned > 0 && hoursDone > hoursAssigned);

  /** One decimal is the resolution the rikma approves hours at. */
  const oneDecimal = (n) => (Math.round(n * 10) / 10).toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  async function toggle() {
    if (!timer || busy) return;
    busy = true;
    try {
      if (isRunning) {
        const stopped = await stopMissionTimer(timer, page.data.uid);
        if (stopped) {
          elapsedTime = readout;
          showSaveDialog = true;
          lockTimerForEdit(missionId);
          dialogEdit = false;
        }
      } else {
        await startMissionTimer(timer, page.data.uid);
      }
    } finally {
      busy = false;
    }
  }

  function manage() {
    showSaveDialog = true;
    lockTimerForEdit(missionId);
    dialogEdit = false;
  }
</script>

<TimerDialogs
  {timer}
  bind:showSaveDialog
  bind:showClearDialog
  bind:showSaveFinal
  bind:dialogEdit
  bind:elapsedTime
  bind:selectedTasks
  bind:taskSearchTerm
  onUpdateTimer={(detail) => {
    if (!detail?.timer) {
      applyTimerState(missionId, false);
      return;
    }
    applyTimerState(missionId, detail.running, detail.timer);
    if (detail.hoursdon !== undefined) {
      updateTimers(
        $timers.map((x) =>
          x.mId === missionId
            ? { ...x, attributes: { ...x.attributes, howmanyhoursalready: detail.hoursdon } }
            : x
        )
      );
    }
  }}
/>

<div class="row" class:running={isRunning}>
  <span class="state" aria-hidden="true"></span>

  <div class="who">
    <span class="mission">{timer?.missionName ?? ''}</span>
    <span class="project">{timer?.projectName ?? ''}</span>
  </div>

  <div class="meter">
    {#if progress !== null}
      <div
        class="track"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax={hoursAssigned}
        aria-valuenow={Math.round(hoursDone * 10) / 10}
        aria-label={$t('timers.proProgressLabel')}
      >
        <span class="fill" class:over={overBudget} style="width:{progress}%"></span>
      </div>
      <span class="hours" class:over={overBudget}>
        {$t('timers.proHoursOf', { done: oneDecimal(hoursDone), target: oneDecimal(hoursAssigned) })}
      </span>
    {:else}
      <span class="hours">{$t('timers.proHours', { done: oneDecimal(hoursDone) })}</span>
    {/if}
  </div>

  <span class="readout" class:live={isRunning}>{readout}</span>

  <div class="actions">
    <button
      type="button"
      class="act primary"
      class:stop={isRunning}
      disabled={busy || !timer}
      onclick={toggle}
    >
      {#if isRunning}
        <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4" y="4" width="8" height="8" rx="1" /></svg>
        {$t('timers.proStop')}
      {:else}
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5 12.5 8 5 12.5Z" /></svg>
        {$t('timers.proStart')}
      {/if}
    </button>

    <button type="button" class="act" onclick={manage} disabled={!timer}>
      {$t('timers.proManage')}
    </button>
  </div>
</div>

<style>
  /* One grid, one row. The columns collapse in order of how much they earn
     their place: the meter goes first, then the readout moves under the name. */
  .row {
    display: grid;
    grid-template-columns: 3px minmax(0, 1fr) minmax(8rem, 15rem) auto auto;
    align-items: center;
    gap: 0 14px;
    padding: 10px 14px;
    border: 1px solid var(--surface-line);
    border-radius: var(--radius-theme, 4px);
    background: var(--surface);
    color: var(--surface-ink);
  }

  /* The state rail. A colour AND a width change, so "running" survives a
     greyscale print and a colour-blind reader. */
  .state {
    align-self: stretch;
    min-height: 34px;
    border-radius: 2px;
    background: var(--surface-line);
  }
  .row.running .state {
    background: var(--success, #047857);
  }

  .who {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 2px;
  }
  .mission {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .project {
    font-size: 12px;
    color: var(--surface-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meter {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }
  .track {
    height: 4px;
    border-radius: 2px;
    background: var(--surface-line);
    overflow: hidden;
  }
  .fill {
    display: block;
    height: 100%;
    background: var(--barbi-pink);
  }
  .fill.over {
    background: var(--oranges, #b45309);
  }
  .hours {
    font-size: 11.5px;
    color: var(--surface-muted);
    font-variant-numeric: tabular-nums;
  }
  .hours.over {
    color: var(--oranges, #b45309);
  }

  /* Tabular figures so the digits do not shuffle sideways once a second. */
  .readout {
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 16px;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
    color: var(--surface-muted);
    direction: ltr;
    unicode-bidi: isolate;
  }
  .readout.live {
    color: var(--surface-ink);
    font-weight: 600;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .act {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: 1px solid var(--border-g);
    border-radius: var(--radius-theme, 4px);
    background: transparent;
    color: var(--goldink);
    font-size: 12.5px;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.12s, border-color 0.12s;
  }
  .act svg {
    width: 12px;
    height: 12px;
    fill: currentColor;
  }
  .act:hover:not(:disabled) {
    background: var(--gold-dd);
  }
  .act:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .act:focus-visible {
    outline: 2px solid var(--barbi-pink);
    outline-offset: 1px;
  }
  .act.primary {
    background: var(--barbi-pink);
    border-color: var(--barbi-pink);
    color: var(--gold);
  }
  .act.primary:hover:not(:disabled) {
    filter: brightness(1.08);
    background: var(--barbi-pink);
  }
  /* Stopping is the one destructive-feeling action here, and it is the button
     under the cursor while a timer runs — it says so rather than staying the
     same blue it was before the run started. */
  .act.primary.stop {
    background: transparent;
    border-color: var(--destructive, #b91c1c);
    color: var(--destructive, #b91c1c);
  }
  .act.primary.stop:hover:not(:disabled) {
    background: rgb(185 28 28 / 0.08);
    filter: none;
  }

  @media (max-width: 860px) {
    .row {
      grid-template-columns: 3px minmax(0, 1fr) auto;
      row-gap: 8px;
    }
    /* The rail is the row's left edge, so it has to run the full height of the
       stacked layout — not just the line the name is on. */
    .state {
      grid-row: 1 / -1;
    }
    .meter {
      grid-column: 2 / -1;
      grid-row: 2;
    }
    .actions {
      grid-column: 2 / -1;
      grid-row: 3;
    }
  }
</style>
