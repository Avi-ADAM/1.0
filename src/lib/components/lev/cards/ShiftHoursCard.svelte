<script>
  /**
   * A shift and its hours (docs/PLAN_SHIFTS.md §10) — two moments, one card:
   *
   *   shiftStarting — "your shift starts at 08:00": start the mission's
   *                   ordinary timer, exactly as the timer dial would.
   *   shiftLog      — "your shift ended and no timer ran": log its hours in
   *                   one tap — an ordinary record the rikma approves — or say
   *                   it was not worked.
   *
   * The shift never becomes hours by itself; this card only offers.
   */
  import { get } from 'svelte/store';
  import { page } from '$app/state';
  import { t, isRtl, locale } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { describeShiftError } from '$lib/shifts/errors';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { dayLabel, localDateKey, timeRange } from '$lib/shifts/format';
  import { shiftWorkStore } from '$lib/utils/levShifts';
  import { timers } from '$lib/stores/timers';
  import { startMissionTimer } from '$lib/timers/timerControls.js';
  import CardHeader from './CardHeader.svelte';

  let { buble, isFirst = false, onProj, onDone } = $props();

  const tz = $derived(buble.timeZone || 'Asia/Jerusalem');
  const loc = $derived($locale || 'he');
  const starting = $derived(buble.ani === 'shiftStarting');
  let busy = $state(false);

  function handleProjectClick() {
    if (onProj && buble.projectId) onProj({ id: buble.projectId });
  }

  function dropCard() {
    const key = starting ? 'starting' : 'toLog';
    shiftWorkStore.update((w) => ({ ...w, [key]: w[key].filter((x) => x.assignmentId !== buble.assignmentId) }));
    onDone?.({ coinlapach: buble.coinlapach });
  }

  async function startTimer() {
    if (busy) return;
    const row = get(timers).find((x) => String(x.mId) === String(buble.missionId));
    if (!row) {
      toast.error($t('shifts.hours.noTimer'));
      return;
    }
    busy = true;
    try {
      const ok = await startMissionTimer(row, page.data.uid);
      if (!ok) throw new Error($t('shifts.cards.error'));
      // Tie the timer to the shift; a failure here costs nothing but the tie.
      await executeAction('linkShiftTimer', { assignmentId: String(buble.assignmentId) }).catch(() => null);
      toast.success($t('shifts.hours.started'));
      dropCard();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : $t('shifts.cards.error'));
    } finally {
      busy = false;
    }
  }

  /** @param {boolean} worked */
  async function log(worked) {
    if (busy) return;
    busy = true;
    try {
      const res = await executeAction('logShiftHours', { assignmentId: String(buble.assignmentId), worked });
      if (res?.success === false) throw new Error(describeShiftError(actionErrorText(res, ''), $t, $t('shifts.cards.error')));
      toast.success(worked ? $t('shifts.hours.logged') : $t('shifts.hours.notWorkedDone'));
      dropCard();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : $t('shifts.cards.error'));
    } finally {
      busy = false;
    }
  }
</script>

<div
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="{isMobileOrTablet() ? 'w-full h-full' : 'w-[90%] h-[90%]'} lg:w-[90%] {isFirst
    ? $isRtl
      ? 'boxleft'
      : 'boxright'
    : ''} flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden {isFirst
    ? 'shadow-glow border-glow'
    : 'shadow-lg border border-gray-100 dark:border-gray-700'} transition-all duration-300 relative"
  style:--glow-rgb="20, 184, 166"
>
  <CardHeader
    logoSrc={buble.src}
    projectName={buble.projectName}
    cardType={starting ? $t('shifts.hours.startingType') : $t('shifts.hours.logType')}
    cardTitle={buble.planName}
    glowColor="teal"
    onProjectClick={handleProjectClick}
  />
  <div class="flex flex-1 flex-col gap-3 overflow-y-auto bg-white p-4 dark:bg-slate-800">
    <p class="font-semibold">
      {dayLabel(localDateKey(buble.start, tz), loc)} ·
      <span dir="ltr">{timeRange(buble.start, buble.end, tz, loc)}</span>
    </p>

    {#if starting}
      <p class="text-sm text-gray-700 dark:text-gray-300">{$t('shifts.hours.startingBody')}</p>
      <button
        type="button"
        class="rounded-xl bg-gradient-to-r from-barbi to-mpink py-3 font-semibold text-white disabled:opacity-60"
        disabled={busy}
        onclick={startTimer}>{$t('shifts.hours.start')}</button
      >
    {:else}
      <p class="text-sm text-gray-700 dark:text-gray-300">{$t('shifts.hours.logBody', { hours: buble.hours })}</p>
      <button
        type="button"
        class="rounded-xl bg-gradient-to-r from-barbi to-mpink py-3 font-semibold text-white disabled:opacity-60"
        disabled={busy}
        onclick={() => log(true)}>{$t('shifts.hours.log', { hours: buble.hours })}</button
      >
      <button
        type="button"
        class="rounded-xl border border-gray-300 py-2 text-sm dark:border-gray-600 disabled:opacity-60"
        disabled={busy}
        onclick={() => log(false)}>{$t('shifts.hours.notWorked')}</button
      >
      <p class="text-xs text-gray-500 dark:text-gray-400">{$t('shifts.hours.approvalNote')}</p>
    {/if}
  </div>
</div>
