<script lang="ts" module>
  import type { ShiftPattern } from '$lib/shifts/types';

  /** What the mission form sends as `shiftPlan` (createMission, PLAN_SHIFTS §13.6). */
  export interface ShiftPlanDraft {
    enabled: boolean;
    pattern: ShiftPattern;
    /** One person's weekly hours — only for the "how many people" suggestion. */
    hoursPerPerson: number | null;
    cycleDays: number | null;
    closeOffsetHours: number | null;
    draftWindowHours: number | null;
    minRestHours: number | null;
  }

  export function emptyShiftPlan(): ShiftPlanDraft {
    return {
      enabled: false,
      pattern: { version: 1, days: [] },
      hoursPerPerson: null,
      cycleDays: null,
      closeOffsetHours: null,
      draftWindowHours: null,
      minRestHours: null
    };
  }
</script>

<script lang="ts">
  /**
   * "This mission has to be staffed at these hours" (docs/PLAN_SHIFTS.md §9.5).
   *
   * Replaces the seven-column table that used to sit in the mission form and
   * was never sent anywhere. One row per day (so it works on a phone), each
   * with its own windows; the number of windows is the list itself, so there
   * is no second counter to fall out of step with it.
   *
   * Under the days it answers the question the old form never asked: how
   * many people does it actually take to staff this? Weekly person-hours
   * over one person's hours, rounded up — handed to the form's headcount
   * only when the member presses "use it", and editable there afterwards.
   */
  import { t, locale } from '$lib/translations';
  import { suggestHeadcount, validatePattern, weeklyStaffedHours } from '$lib/shifts/pattern';

  interface Props {
    value: ShiftPlanDraft;
    /** "Use this number": hands the suggested headcount to the mission form. */
    onHeadcount?: (count: number) => void;
  }

  let { value = $bindable(), onHeadcount }: Props = $props();

  const DAYS = [0, 1, 2, 3, 4, 5, 6];
  // 2026-09-27 is a Sunday: dow d is that date + d days, for the weekday name.
  const weekday = (dow: number, loc: string) =>
    new Intl.DateTimeFormat(loc || 'he', { weekday: 'long', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2026, 8, 27 + dow, 12))
    );

  const dayOf = (dow: number) => value.pattern.days.find((d) => d.dow === dow);

  function toggleDay(dow: number) {
    if (dayOf(dow)) {
      value.pattern.days = value.pattern.days.filter((d) => d.dow !== dow);
    } else {
      value.pattern.days = [...value.pattern.days, { dow, windows: [{ start: '09:00', end: '13:00', need: 1 }] }].sort(
        (a, b) => a.dow - b.dow
      );
    }
  }

  function addWindow(dow: number) {
    const day = dayOf(dow);
    if (!day) return;
    const last = day.windows.at(-1);
    // The natural next window starts where the last one ended.
    const start = last?.end ?? '09:00';
    const [h, m] = start.split(':').map(Number);
    const end = `${String(Math.min(23, h + 4)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    day.windows = [...day.windows, { start, end: end === start ? '23:59' : end, need: last?.need ?? 1 }];
  }

  function removeWindow(dow: number, i: number) {
    const day = dayOf(dow);
    if (!day) return;
    day.windows = day.windows.filter((_, j) => j !== i);
    if (day.windows.length === 0) toggleDay(dow);
  }

  let weekly = $derived(weeklyStaffedHours(value.pattern));
  let suggested = $derived(
    value.hoursPerPerson && value.hoursPerPerson > 0 ? suggestHeadcount(value.pattern, value.hoursPerPerson) : null
  );
  let issues = $derived(value.enabled ? validatePattern(value.pattern) : []);
  let empty = $derived(value.enabled && !value.pattern.days.some((d) => d.windows.length));

  const fmt = (n: number) => (Math.round(n * 10) / 10).toLocaleString('en-US');
</script>

<section class="spf flex flex-col gap-3 rounded-xl border border-gold/50 p-3 text-barbie">
  <label class="flex items-center gap-2 font-semibold">
    <input type="checkbox" bind:checked={value.enabled} />
    <span>{$t('shifts.form.enable')}</span>
  </label>
  <p class="text-sm opacity-90">{$t('shifts.form.enableHint')}</p>

  {#if value.enabled}
    <ul class="flex flex-col gap-2" aria-label={$t('shifts.form.daysLabel')}>
      {#each DAYS as dow (dow)}
        {@const day = dayOf(dow)}
        <li class="rounded-lg border border-gold/30 p-2">
          <label class="flex items-center gap-2">
            <input type="checkbox" checked={!!day} onchange={() => toggleDay(dow)} />
            <span class="font-semibold">{weekday(dow, $locale)}</span>
            {#if !day}<span class="text-xs opacity-75">{$t('shifts.form.closed')}</span>{/if}
          </label>
          {#if day}
            <ul class="mt-2 flex flex-col gap-2">
              {#each day.windows as w, i (i)}
                <li class="flex flex-wrap items-end gap-2">
                  <label class="flex flex-col text-xs">
                    <span>{$t('shifts.form.from')}</span>
                    <input type="time" class="spf-input" bind:value={w.start} />
                  </label>
                  <label class="flex flex-col text-xs">
                    <span>{$t('shifts.form.to')}</span>
                    <input type="time" class="spf-input" bind:value={w.end} />
                  </label>
                  <label class="flex flex-col text-xs">
                    <span>{$t('shifts.form.needAtOnce')}</span>
                    <input type="number" min="1" step="1" class="spf-input w-20" bind:value={w.need} />
                  </label>
                  <button
                    type="button"
                    class="rounded-lg border border-gold/40 px-2 py-1 text-xs"
                    onclick={() => removeWindow(dow, i)}>{$t('shifts.form.removeWindow')}</button
                  >
                </li>
              {/each}
            </ul>
            <button type="button" class="mt-2 text-sm underline" onclick={() => addWindow(dow)}
              >+ {$t('shifts.form.addWindow')}</button
            >
          {/if}
        </li>
      {/each}
    </ul>

    {#if empty}
      <p class="text-sm font-semibold text-red-500" role="alert">{$t('shifts.form.noWindows')}</p>
    {:else if issues.length}
      <p class="text-sm font-semibold text-red-500" role="alert">{$t('shifts.form.invalid', { count: issues.length })}</p>
    {/if}

    <div class="flex flex-col gap-1 rounded-lg bg-black/10 p-2">
      <p>{$t('shifts.form.weeklyHours', { hours: fmt(weekly) })}</p>
      <label class="flex flex-wrap items-center gap-2">
        <span>{$t('shifts.form.hoursPerPerson')}</span>
        <input type="number" min="1" step="1" class="spf-input w-20" bind:value={value.hoursPerPerson} />
      </label>
      {#if suggested != null}
        <p class="font-semibold">
          {$t('shifts.form.suggested', { hours: fmt(weekly), per: String(value.hoursPerPerson), count: suggested })}
        </p>
        {#if onHeadcount}
          <button
            type="button"
            class="self-start rounded-lg border border-gold px-3 py-1 text-sm"
            onclick={() => onHeadcount?.(suggested ?? 1)}>{$t('shifts.form.useSuggestion', { count: suggested })}</button
          >
        {/if}
      {/if}
    </div>

    <details class="text-sm">
      <summary class="cursor-pointer">{$t('shifts.form.advanced')}</summary>
      <div class="mt-2 grid grid-cols-2 gap-2">
        <label class="flex flex-col text-xs">
          <span>{$t('shifts.form.cycleDays')}</span>
          <input type="number" min="1" step="1" class="spf-input" placeholder="7" bind:value={value.cycleDays} />
        </label>
        <label class="flex flex-col text-xs">
          <span>{$t('shifts.form.closeOffsetHours')}</span>
          <input type="number" min="0" step="1" class="spf-input" placeholder="48" bind:value={value.closeOffsetHours} />
        </label>
        <label class="flex flex-col text-xs">
          <span>{$t('shifts.form.draftWindowHours')}</span>
          <input type="number" min="0" step="1" class="spf-input" placeholder="24" bind:value={value.draftWindowHours} />
        </label>
        <label class="flex flex-col text-xs">
          <span>{$t('shifts.form.minRestHours')}</span>
          <input type="number" min="0" step="1" class="spf-input" placeholder="0" bind:value={value.minRestHours} />
        </label>
      </div>
      <p class="mt-1 text-xs opacity-80">{$t('shifts.form.advancedHint')}</p>
    </details>
  {/if}
</section>

<style>
  .spf-input {
    border-radius: 0.5rem;
    border: 1px solid rgb(212 175 55 / 0.6);
    background: transparent;
    padding: 0.25rem 0.5rem;
    color: inherit;
  }
</style>
