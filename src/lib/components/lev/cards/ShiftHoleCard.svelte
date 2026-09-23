<script>
  /**
   * "Nobody is covering Tuesday 11:00–15:00" — the hole card
   * (docs/PLAN_SHIFTS.md §7.1, §14 #7).
   *
   * Two ways out, and either one closes the card:
   *   · "I'll take it" — allowed even beyond my agreed maximum: a person may
   *     always choose to do more; only the algorithm may not choose it for them.
   *   · "Open the mission to one more candidate" — recruiting forces nothing on
   *     anyone. If nobody answers before the cycle closes, this is what happens
   *     anyway (silence is consent).
   * There is deliberately no "we don't need it": dropping a staffed window
   * changes the mission's terms, and that is a vote (editObject), not a tap.
   */
  import { t, isRtl, locale } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { dayLabel, localDateKey, timeRange } from '$lib/shifts/format';
  import { shiftWorkStore } from '$lib/utils/levShifts';
  import CardHeader from './CardHeader.svelte';

  let { buble, isFirst = false, onProj, onDone } = $props();

  const tz = $derived(buble.timeZone || 'Asia/Jerusalem');
  const loc = $derived($locale || 'he');
  // `spare` is Infinity server-side for "no cap", which JSON carries as null.
  const unlimited = $derived(buble.spare == null || buble.spare === Infinity);
  let busy = $state(false);

  function handleProjectClick() {
    if (onProj && buble.projectId) onProj({ id: buble.projectId });
  }

  function dropCard() {
    shiftWorkStore.update((w) => ({ ...w, holes: w.holes.filter((h) => h.shiftId !== buble.shiftId) }));
    onDone?.({ coinlapach: buble.coinlapach });
  }

  async function take() {
    if (busy) return;
    busy = true;
    try {
      const res = await executeAction('claimShiftHole', { shiftId: String(buble.shiftId) });
      if (res?.success === false) throw new Error(actionErrorText(res, $t('shifts.cards.error')));
      toast.success(res?.data?.claimed === false ? $t('shifts.cards.hole.alreadyCovered') : $t('shifts.cards.hole.taken'));
      dropCard();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : $t('shifts.cards.error'));
    } finally {
      busy = false;
    }
  }

  async function reopen() {
    if (busy || !buble.periodId) return;
    busy = true;
    try {
      const res = await executeAction('reopenForShiftHole', {
        periodId: String(buble.periodId),
        shiftId: String(buble.shiftId)
      });
      if (res?.success === false) throw new Error(actionErrorText(res, $t('shifts.cards.error')));
      toast.success($t('shifts.cards.hole.reopened'));
      // Every hole of this cycle now shares the same answer.
      shiftWorkStore.update((w) => ({
        ...w,
        holes: w.holes.map((h) => (h.periodId === buble.periodId ? { ...h, reopened: true } : h))
      }));
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
  style:--glow-rgb="239, 68, 68"
>
  <CardHeader
    logoSrc={buble.src}
    projectName={buble.projectName}
    cardType={$t('shifts.cards.hole.type')}
    cardTitle={buble.planName}
    glowColor="red"
    onProjectClick={handleProjectClick}
  />
  <div class="flex flex-1 flex-col gap-3 overflow-y-auto bg-white p-4 dark:bg-slate-800">
    <p class="font-semibold">
      {dayLabel(localDateKey(buble.start, tz), loc)} ·
      <span dir="ltr">{timeRange(buble.start, buble.end, tz, loc)}</span>
    </p>
    <p class="text-sm text-gray-700 dark:text-gray-300">{$t('shifts.cards.hole.body', { count: buble.missing })}</p>
    {#if buble.nextInLine}
      <p class="rounded-lg bg-amber-100 p-2 text-sm font-semibold text-amber-900">{$t('shifts.cards.hole.nextInLine')}</p>
    {:else if !unlimited && buble.spare > 0}
      <p class="text-sm">{$t('shifts.cards.hole.spare', { count: buble.spare })}</p>
    {/if}

    {#if buble.clashes}
      <p class="text-xs text-gray-500">{$t('shifts.cards.hole.clashes')}</p>
    {:else}
      <button
        type="button"
        class="rounded-xl bg-gradient-to-r from-barbi to-mpink py-3 font-semibold text-white disabled:opacity-60"
        disabled={busy}
        onclick={take}>{$t('shifts.cards.hole.take')}</button
      >
    {/if}

    {#if buble.reopened}
      <p class="text-xs text-gray-500">{$t('shifts.cards.hole.alreadyReopened')}</p>
    {:else}
      <button
        type="button"
        class="rounded-xl border border-gray-300 py-2 text-sm dark:border-gray-600 disabled:opacity-60"
        disabled={busy}
        onclick={reopen}>{$t('shifts.cards.hole.reopen')}</button
      >
      <p class="text-xs text-gray-500 dark:text-gray-400">{$t('shifts.cards.hole.silenceNote')}</p>
    {/if}
  </div>
</div>
