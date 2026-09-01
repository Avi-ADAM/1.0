<script>
  /**
   * TimerSessions — the mission's timer log, one row per actual sitting.
   *
   * Everywhere else the platform shows *totals*: `howmanyhoursalready`, the
   * monthly ledger, a Timer's `totalHours`. None of them answers the question a
   * member actually asks when they read "37 hours" — when was that? This lists
   * every `timers { start stop }` component behind the number: the day, the
   * start time, the stop time, the length, who ran it, whether it has been
   * saved/approved and what they said they did.
   *
   * Presentational: the host loads the Timer entities (qid
   * `missionTimerSessions`) and hands them over. A session still running ticks
   * off the shared `clock` — no interval of its own (see clock.svelte.ts).
   */
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { clock } from '$lib/stores/clock.svelte';
  import { buildTimerSessions } from '$lib/timers/timerSessions.js';

  /**
   * @typedef {Object} Props
   * @property {any[]} [timers] - Strapi Timer entities of this mission.
   * @property {boolean} [loading]
   * @property {string} [error] - message to show instead of the list.
   * @property {boolean} [showTitle]
   * @property {number} [initialDays] - days shown before "show all".
   */

  /** @type {Props} */
  let { timers = [], loading = false, error = '', showTitle = true, initialDays = 4 } = $props();

  const FALLBACK_AVATAR =
    'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png';

  let expanded = $state(false);

  // Only a mission with a timer running right now needs the ticking clock; for
  // everything else the sessions are fixed and reading `clock.seconds` would
  // rebuild the list once a second for nothing.
  let nowMs = $derived.by(() => {
    const open = (timers ?? []).some((timer) => {
      const a = timer?.attributes ?? timer ?? {};
      const parts = Array.isArray(a.timers) ? a.timers : [];
      return parts.length
        ? parts.some((p) => p?.start && !p?.stop)
        : Boolean(a.start && !a.finnish);
    });
    return open ? clock.seconds : Date.now();
  });

  let log = $derived(buildTimerSessions(timers, nowMs));
  let days = $derived(expanded ? log.days : log.days.slice(0, initialDays));
  let hiddenDays = $derived(Math.max(0, log.days.length - days.length));

  let locale = $derived(
    $lang === 'he'
      ? 'he-IL'
      : $lang === 'ar'
        ? 'ar'
        : $lang === 'ru'
          ? 'ru-RU'
          : $lang === 'es'
            ? 'es-ES'
            : 'en-GB'
  );

  /** @type {Intl.DateTimeFormatOptions} */
  const DAY_OPTS = { weekday: 'long', day: 'numeric', month: 'long' };
  /** @type {Intl.DateTimeFormatOptions} */
  const TIME_OPTS = { hour: '2-digit', minute: '2-digit' };

  function dayLabel(date) {
    const opts = date.getFullYear() === new Date().getFullYear()
      ? DAY_OPTS
      : { ...DAY_OPTS, year: 'numeric' };
    return date.toLocaleDateString(locale, opts);
  }

  function timeLabel(ms) {
    return new Date(ms).toLocaleTimeString(locale, TIME_OPTS);
  }

  /** `2:30` — hours and minutes, the way a work log reads. */
  function span(hours) {
    const total = Math.max(0, Math.round((Number(hours) || 0) * 60));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }

  /** A running session shows its seconds, because they are moving. */
  function liveSpan(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function avatarOf(session) {
    const url = session.user?.avatar;
    if (!url) return FALLBACK_AVATAR;
    if (/^(https?:|data:)/.test(url)) return url;
    const base = (import.meta.env.VITE_URL || '').replace(/\/$/, '');
    return `${base}${url.startsWith('/') ? url : `/${url}`}`;
  }

  // Literal $t() per state, so `npm run check:i18n` can see every key.
  function stateLabel(state) {
    if (state === 'running') return $t('timers.sessionsRunning');
    if (state === 'approved') return $t('timers.sessionsApproved');
    if (state === 'saved') return $t('timers.sessionsSaved');
    return $t('timers.sessionsOpen');
  }
</script>

<section class="ts">
  <!-- The total stays even when the host supplies the heading: it is the figure
       the rest of the mission page shows, and this list is what it is made of. -->
  {#if showTitle || log.sessions.length > 0}
    <header class="ts-head">
      {#if showTitle}
        <h4 class="ts-title">{$t('timers.sessionsTitle')}</h4>
      {/if}
      {#if log.sessions.length > 0}
        <span class="ts-total">
          <strong>{span(log.totalHours)}</strong>
          {$t('timers.sessionsHours')}
          <span class="ts-count">{$t('timers.sessionsCount', { count: log.sessions.length })}</span>
        </span>
      {/if}
    </header>
  {/if}

  {#if loading}
    <p class="ts-note">{$t('timers.editorLoading')}</p>
  {:else if error}
    <p class="ts-note ts-note--bad">{error}</p>
  {:else if log.sessions.length === 0}
    <p class="ts-note">{$t('timers.sessionsEmpty')}</p>
  {:else}
    <p class="ts-note ts-note--soft">{$t('timers.sessionsHint')}</p>

    <ol class="ts-days">
      {#each days as day (day.key)}
        <li class="ts-day">
          <div class="ts-day-head">
            <span class="ts-day-name">{dayLabel(day.date)}</span>
            <span class="ts-day-hours">
              <strong>{span(day.hours)}</strong>
              {$t('timers.sessionsHours')}
            </span>
          </div>

          <ul class="ts-list">
            {#each day.sessions as session (session.key)}
              <li class="ts-row" class:ts-row--live={session.running}>
                <span class="ts-time">
                  {#if session.running}<span class="ts-dot" aria-hidden="true"></span>{/if}
                  <time datetime={session.start}>{timeLabel(session.startMs)}</time>
                  <span class="ts-sep" aria-hidden="true">–</span>
                  {#if session.running}
                    <span class="ts-open">{$t('timers.sessionsRunning')}</span>
                  {:else}
                    <time datetime={session.stop}>{timeLabel(session.stopMs)}</time>
                    {#if session.crossesDay}
                      <span class="ts-next">{$t('timers.sessionsNextDay')}</span>
                    {/if}
                  {/if}
                </span>

                <span class="ts-span">
                  {session.running ? liveSpan(session.stopMs - session.startMs) : span(session.hours)}
                </span>

                <span class="ts-chip ts-chip--{session.state}">{stateLabel(session.state)}</span>

                {#if session.user}
                  <span class="ts-who">
                    <img src={avatarOf(session)} alt="" loading="lazy" />
                    {session.user.username}
                  </span>
                {/if}

                {#if session.legacy}
                  <span class="ts-legacy">{$t('timers.sessionsLegacy')}</span>
                {/if}

                {#if session.note}
                  <p class="ts-text">{session.note}</p>
                {/if}
                {#if session.acts.length}
                  <p class="ts-acts">{session.acts.join(' · ')}</p>
                {/if}
              </li>
            {/each}
          </ul>
        </li>
      {/each}
    </ol>

    {#if hiddenDays > 0 || expanded}
      <button type="button" class="ts-more" onclick={() => (expanded = !expanded)}>
        {expanded
          ? $t('timers.sessionsShowLess')
          : $t('timers.sessionsShowAll', { count: hiddenDays })}
      </button>
    {/if}
  {/if}
</section>

<style>
  .ts {
    /* Inherits the host's tokens where they exist (the process page's `--pcv-*`
       cascade), and otherwise paints its own dark glass — the same fallbacks
       MonthlyHours uses, so the two blocks sit together on the mission page. */
    --ts-text: var(--pcv-text, #f8fafc);
    --ts-text-2: var(--pcv-text-2, rgba(255, 255, 255, 0.8));
    --ts-text-3: var(--pcv-text-3, rgba(255, 255, 255, 0.6));
    --ts-surface: var(--pcv-node-bg, rgba(15, 23, 42, 0.38));
    --ts-border: var(--pcv-node-border, rgba(255, 255, 255, 0.22));
    --ts-chip-bg: rgba(2, 6, 23, 0.5);

    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }

  .ts-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }
  .ts-title {
    margin: 0;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--badge-sky-text, #67e8f9);
  }
  .ts-total {
    font-size: 11px;
    color: var(--ts-text-3);
  }
  .ts-total strong {
    font-size: 13px;
    color: var(--ts-text);
    font-variant-numeric: tabular-nums;
  }
  .ts-count {
    margin-inline-start: 6px;
  }

  .ts-note {
    margin: 0;
    font-size: 11px;
    line-height: 1.4;
    color: var(--ts-text-3);
  }
  .ts-note--soft {
    opacity: 0.85;
  }
  .ts-note--bad {
    color: var(--badge-rose-text, #ff9ad5);
  }

  .ts-days,
  .ts-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .ts-days {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ts-day {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ts-day-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    padding-inline: 2px;
  }
  .ts-day-name {
    font-size: 12px;
    font-weight: 700;
    color: var(--ts-text-2);
  }
  .ts-day-hours {
    font-size: 11px;
    color: var(--ts-text-3);
    font-variant-numeric: tabular-nums;
  }
  .ts-day-hours strong {
    color: var(--ts-text);
  }

  .ts-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ts-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 10px;
    padding: 7px 10px;
    border-radius: 10px;
    background: var(--ts-surface);
    border: 1px solid var(--ts-border);
  }
  .ts-row--live {
    border-color: var(--badge-rose-text, #ff9ad5);
    background: var(--badge-rose-bg, rgba(255, 0, 146, 0.1));
  }

  .ts-time {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--ts-text);
  }
  .ts-sep {
    color: var(--ts-text-3);
    font-weight: 400;
  }
  .ts-open {
    font-size: 11px;
    font-weight: 700;
    color: var(--badge-rose-text, #ff9ad5);
  }
  .ts-next {
    font-size: 10px;
    font-weight: 600;
    color: var(--ts-text-3);
  }

  .ts-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--badge-rose-text, #ff9ad5);
    animation: ts-pulse 1.8s ease-in-out infinite;
  }
  @keyframes ts-pulse {
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
  @media (prefers-reduced-motion: reduce) {
    .ts-dot {
      animation: none;
    }
  }

  .ts-span {
    font-size: 12px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--ts-text-2);
  }

  .ts-chip {
    display: inline-flex;
    align-items: center;
    padding: 1px 8px;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 700;
    white-space: nowrap;
    background: var(--ts-chip-bg);
    color: var(--ts-text-2);
  }
  .ts-chip--running {
    background: var(--badge-rose-bg, var(--ts-chip-bg));
    color: var(--badge-rose-text, #ff9ad5);
  }
  .ts-chip--approved {
    background: var(--badge-green-bg, var(--ts-chip-bg));
    color: var(--badge-green-text, #2effa8);
  }
  .ts-chip--saved {
    background: var(--badge-sky-bg, var(--ts-chip-bg));
    color: var(--badge-sky-text, #67e8f9);
  }
  .ts-chip--open {
    background: var(--badge-gold-bg, var(--ts-chip-bg));
    color: var(--badge-gold-text, #eee8aa);
  }

  .ts-who {
    margin-inline-start: auto;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: var(--ts-text-3);
  }
  .ts-who img {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    object-fit: cover;
  }

  .ts-legacy {
    font-size: 10px;
    color: var(--ts-text-3);
    opacity: 0.8;
  }

  .ts-text,
  .ts-acts {
    flex-basis: 100%;
    margin: 0;
    font-size: 11px;
    line-height: 1.4;
    color: var(--ts-text-3);
    overflow-wrap: anywhere;
  }
  .ts-acts {
    opacity: 0.8;
  }

  .ts-more {
    align-self: flex-start;
    padding: 3px 10px;
    border-radius: 9999px;
    border: 1px solid var(--ts-border);
    background: transparent;
    font-size: 11px;
    font-weight: 600;
    color: var(--ts-text-2);
    cursor: pointer;
  }
  .ts-more:hover {
    border-color: var(--badge-gold-text, #eee8aa);
    color: var(--badge-gold-text, #eee8aa);
  }
</style>
