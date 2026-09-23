<script>
  /**
   * "The cycle of 4–10 Oct is open: when can you come?" (docs/PLAN_SHIFTS.md §7, §9.4)
   *
   * An invitation, not a demand: answering is the consent the roster is built
   * from (§1.1), and "can't" is a full answer. The card leads to the member's
   * own availability grid; it disappears once every shift has an answer.
   */
  import { t, isRtl, locale } from '$lib/translations';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { dayLabel, localDateKey, moment } from '$lib/shifts/format';
  import CardHeader from './CardHeader.svelte';

  let { buble, isFirst = false, onProj } = $props();

  const tz = $derived(buble.timeZone || 'Asia/Jerusalem');
  const loc = $derived($locale || 'he');
  const range = $derived(
    $t('shifts.cycle.range', {
      from: dayLabel(localDateKey(buble.cycleStart, tz), loc),
      to: dayLabel(localDateKey(new Date(new Date(buble.cycleEnd).getTime() - 1).toISOString(), tz), loc)
    })
  );

  function handleProjectClick() {
    if (onProj && buble.projectId) onProj({ id: buble.projectId });
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
    cardType={$t('shifts.cards.declare.type')}
    cardTitle={buble.planName}
    glowColor="teal"
    onProjectClick={handleProjectClick}
  />
  <div class="flex flex-1 flex-col gap-4 overflow-y-auto bg-white p-4 dark:bg-slate-800">
    <p class="text-sm text-gray-700 dark:text-gray-300">
      {$t('shifts.cards.declare.body', { count: buble.undeclared, range })}
    </p>
    <p class="text-xs text-gray-500 dark:text-gray-400">
      {$t('shifts.cards.declare.deadline', { date: moment(buble.draftAt, tz, loc) })}
    </p>
    <a
      href="/moach/{buble.projectId}/shifts"
      class="mt-auto rounded-xl bg-gradient-to-r from-barbi to-mpink py-3 text-center font-semibold text-white"
      >{$t('shifts.cards.declare.cta')}</a
    >
  </div>
</div>
