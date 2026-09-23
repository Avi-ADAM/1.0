<script>
  /**
   * "The draft is out — this is where you are, and why" (docs/PLAN_SHIFTS.md §7).
   *
   * Every place carries its reason (§1.5). The only action is "I can't make
   * this one after all" — a release, never a veto on the roster (§1.2): the
   * place goes back, the next person in line is told, and nobody is judged for
   * it. Silence until the window closes confirms the draft.
   */
  import { t, isRtl, locale } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { describeShiftError } from '$lib/shifts/errors';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { dayLabel, localDateKey, moment, timeRange } from '$lib/shifts/format';
  import { reasonKey } from '$lib/shifts/explain';
  import { shiftWorkStore } from '$lib/utils/levShifts';
  import CardHeader from './CardHeader.svelte';

  let { buble, isFirst = false, onProj, onDone } = $props();

  const tz = $derived(buble.timeZone || 'Asia/Jerusalem');
  const loc = $derived($locale || 'he');
  let releasing = $state(/** @type {string|null} */ (null));

  function handleProjectClick() {
    if (onProj && buble.projectId) onProj({ id: buble.projectId });
  }

  /** @param {{ assignmentId: string|null }} place */
  async function release(place) {
    if (!place.assignmentId || releasing) return;
    releasing = place.assignmentId;
    try {
      const res = await executeAction('releaseShiftAssignment', { assignmentId: String(place.assignmentId) });
      if (res?.success === false) throw new Error(describeShiftError(actionErrorText(res, ''), $t, $t('shifts.cards.error')));
      toast.success($t('shifts.cards.draft.released'));
      shiftWorkStore.update((w) => ({
        ...w,
        drafts: w.drafts
          .map((d) =>
            d.periodId === buble.periodId ? { ...d, mine: d.mine.filter((m) => m.assignmentId !== place.assignmentId) } : d
          )
          .filter((d) => d.mine.length > 0)
      }));
      onDone?.({ coinlapach: buble.coinlapach });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : $t('shifts.cards.error'));
    } finally {
      releasing = null;
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
    cardType={$t('shifts.cards.draft.type')}
    cardTitle={buble.planName}
    glowColor="teal"
    onProjectClick={handleProjectClick}
  />
  <div class="flex flex-1 flex-col gap-3 overflow-y-auto bg-white p-4 dark:bg-slate-800">
    <p class="text-sm text-gray-700 dark:text-gray-300">
      {$t('shifts.cards.draft.body', { date: moment(buble.closesAt, tz, loc) })}
    </p>
    <ul class="flex flex-col gap-2">
      {#each buble.mine as place (place.assignmentId ?? place.shiftId)}
        <li class="rounded-xl border border-gray-200 p-2 dark:border-gray-600">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="font-semibold">
              {dayLabel(localDateKey(place.start, tz), loc)} ·
              <span dir="ltr">{timeRange(place.start, place.end, tz, loc)}</span>
            </span>
            <span class="text-xs font-semibold">
              {place.rank === 1 ? $t('shifts.grid.youComing') : $t('shifts.grid.youBackup', { rank: place.rank })}
            </span>
          </div>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{$t(reasonKey(place.reason))}</p>
          <button
            type="button"
            class="mt-2 rounded-lg border border-gray-300 px-3 py-1 text-xs dark:border-gray-600"
            disabled={!place.assignmentId || releasing === place.assignmentId}
            onclick={() => release(place)}>{$t('shifts.cards.draft.release')}</button
          >
        </li>
      {/each}
    </ul>
    {#if buble.holes > 0}
      <p class="text-xs font-semibold text-red-600">{$t('shifts.cards.draft.holes', { count: buble.holes })}</p>
    {/if}
    <a href="/moach/{buble.projectId}/shifts" class="mt-auto text-center text-sm underline"
      >{$t('shifts.cards.fullRoster')}</a
    >
  </div>
</div>
