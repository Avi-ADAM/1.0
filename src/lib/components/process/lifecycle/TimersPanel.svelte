<script>
  /**
   * TimersPanel — the execution-time detail of a mesimabetahalich:
   *  · the monthly hours ledger (MonthlyHours — plan vs. actual per month, with
   *    the current month counting up live from the running timer), and
   *  · the actual timer entities grouped by month, each with its user, date,
   *    hours, save/approve state and what was worked on.
   */
  import { t } from '$lib/translations';
  import { lang as langStore } from '$lib/stores/lang.js';
  import { groupTimersByMonth, mediaUrl } from '$lib/utils/processLifecycle';
  import MonthlyHours from '$lib/components/mission/MonthlyHours.svelte';

  let { monter = [], timers = [], hoursassinged = 0, counter = 0 } = $props();

  let timerGroups = $derived(groupTimersByMonth(timers));

  let locale = $derived(
    $langStore === 'he'
      ? 'he-IL'
      : $langStore === 'ar'
        ? 'ar'
        : $langStore === 'ru'
          ? 'ru-RU'
          : $langStore === 'es'
            ? 'es-ES'
            : 'en-GB'
  );

  function monthLabel(value) {
    if (!value) return '—';
    try {
      // value is `YYYY-MM` (timer group), or '' for timers with no start date
      const date = new Date(`${value}-01`);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    } catch {
      return value;
    }
  }

  function dayLabel(value) {
    if (!value) return '';
    try {
      return new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  }

  function roundHours(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
  }
</script>

<div class="tp">
  <!-- ── Monthly ledger, current month live ─────────────────────────────── -->
  <MonthlyHours {monter} {timers} {hoursassinged} {counter} />

  <!-- ── Timer entities grouped by month ────────────────────────────────── -->
  <div class="tp-block">
    <h4 class="tp-heading">{$t('process.timers.title')}</h4>
    {#if timerGroups.length === 0}
      <p class="tp-empty">{$t('process.timers.none')}</p>
    {:else}
      {#each timerGroups as group (group.month)}
        <div class="tp-month">
          <div class="tp-month-head">
            <span class="tp-month-name">{monthLabel(group.month)}</span>
            <span class="tp-month-total">
              {$t('process.timers.monthTotal')}: {roundHours(group.totalHours)}
              {$t('process.timers.hours')}
            </span>
          </div>
          <ul class="tp-list">
            {#each group.entries as entry (entry.timer.id)}
              {@const attrs = entry.timer.attributes ?? {}}
              {@const timerUser = attrs.users_permissions_user?.data}
              <li class="tp-timer">
                {#if timerUser?.attributes?.profilePic?.data?.attributes?.url}
                  <img
                    class="tp-avatar"
                    src={mediaUrl(timerUser.attributes.profilePic.data.attributes.url)}
                    alt={timerUser.attributes.username}
                    loading="lazy"
                  />
                {:else}
                  <span class="tp-initials" aria-hidden="true">
                    {timerUser?.attributes?.username?.[0]?.toUpperCase() ?? '?'}
                  </span>
                {/if}
                <span class="tp-timer-user">{timerUser?.attributes?.username ?? ''}</span>
                <span class="tp-timer-date">{dayLabel(entry.from)}</span>
                <!-- this timer's hours *in this month*, not its lifetime total -->
                <span class="tp-timer-hours">
                  {roundHours(entry.hours)}
                  {$t('process.timers.hours')}
                </span>
                {#if attrs.isActive}
                  <span class="tp-badge tp-badge--active">{$t('process.timers.running')}</span>
                {:else if attrs.appruved}
                  <span class="tp-badge tp-badge--done">{$t('process.timers.approved')}</span>
                {:else if attrs.saved}
                  <span class="tp-badge tp-badge--saved">{$t('process.timers.saved')}</span>
                {:else}
                  <span class="tp-badge tp-badge--open">{$t('process.timers.awaiting')}</span>
                {/if}
                {#if attrs.saveText}
                  <p class="tp-timer-note">{attrs.saveText}</p>
                {/if}
                {#if (attrs.acts?.data ?? []).length > 0}
                  <p class="tp-timer-acts">
                    {(attrs.acts.data ?? []).map((act) => act.attributes?.shem).filter(Boolean).join(' · ')}
                  </p>
                {/if}
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .tp { display: flex; flex-direction: column; gap: 14px; }

  .tp-block { display: flex; flex-direction: column; gap: 6px; }

  .tp-heading {
    margin: 0;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--badge-sky-text, #0369a1);
  }

  .tp-empty {
    margin: 0;
    font-size: 12px;
    color: var(--pcv-text-3, #a8a29e);
    font-style: italic;
  }

  .tp-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 7px;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
  }
  .tp-badge--done {
    background: var(--badge-green-bg, rgba(5,150,105,.10));
    color: var(--badge-green-text, #065f46);
  }
  .tp-badge--open {
    background: var(--badge-gold-bg, rgba(217,119,6,.10));
    color: var(--badge-gold-text, #b45309);
  }
  .tp-badge--saved {
    background: var(--badge-sky-bg, rgba(2,132,199,.10));
    color: var(--badge-sky-text, #0369a1);
  }
  .tp-badge--active {
    background: var(--badge-rose-bg, rgba(225,29,72,.10));
    color: var(--badge-rose-text, #be123c);
    animation: tp-pulse 2s ease-in-out infinite;
  }
  @keyframes tp-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
  }

  .tp-month { display: flex; flex-direction: column; gap: 4px; margin-bottom: 6px; }

  .tp-month-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  .tp-month-name {
    font-size: 12px;
    font-weight: 700;
    color: var(--pcv-text, #1c1917);
  }

  .tp-month-total {
    font-size: 11px;
    color: var(--pcv-text-2, #78716c);
  }

  .tp-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .tp-timer {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 5px 8px;
    border-radius: 8px;
    background: var(--pcv-node-bg, #ffffff);
    border: 1px solid var(--pcv-node-border, #e7e5e4);
  }

  .tp-avatar {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .tp-initials {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    font-size: 10px;
    font-weight: 700;
    background: var(--badge-grey-bg, rgba(107,114,128,.10));
    color: var(--badge-grey-text, #6b7280);
    flex-shrink: 0;
  }

  .tp-timer-user {
    font-size: 12px;
    font-weight: 600;
    color: var(--pcv-text, #1c1917);
  }

  .tp-timer-date {
    font-size: 11px;
    color: var(--pcv-text-3, #a8a29e);
  }

  .tp-timer-hours {
    font-size: 11px;
    font-weight: 600;
    color: var(--pcv-text-2, #78716c);
    margin-inline-start: auto;
  }

  .tp-timer-note,
  .tp-timer-acts {
    flex-basis: 100%;
    margin: 0;
    font-size: 11px;
    line-height: 1.4;
    color: var(--pcv-text-2, #78716c);
  }

  .tp-timer-acts { color: var(--pcv-text-3, #a8a29e); }
</style>
