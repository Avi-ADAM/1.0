<script>
  /**
   * "You have earned ₪600 this month and it has not been paid yet."
   * (PLAN_STIPEND §6, §8 — docs/FIXES.md §10.)
   *
   * The one card in this feature with no button, on purpose. The next move
   * belongs to the funder: the recipient cannot settle their own stipend, and
   * a button that only pretends to do something would be worse than none.
   *
   * It exists because the number did not exist anywhere the recipient could
   * see it. The funder's pay card held the only copy — so the person living on
   * the money found out how much was coming when (or whether) it arrived. It
   * is computed by the same `computeStipendCycle` the settlement uses, from
   * approved hours only, so what it promises is what will actually be sent.
   */
  import { t, isRtl } from '$lib/translations';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import CardHeader from './CardHeader.svelte';
  import CycleFacts from '$lib/components/stipend/CycleFacts.svelte';

  let { buble, isFirst = false, onProj, onUser } = $props();
</script>

<div
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="{isMobileOrTablet()
    ? 'w-full h-full'
    : 'w-[90%] h-[90%]'} lg:w-[90%] {isFirst
    ? $isRtl
      ? 'boxleft'
      : 'boxright'
    : ''} flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden {isFirst
    ? 'shadow-glow border-glow'
    : 'shadow-lg border border-gray-100 dark:border-gray-700'} transition-all duration-300 relative"
  style:--glow-rgb="167, 139, 250"
>
  <CardHeader
    logoSrc={buble.src}
    projectName={buble.projectName}
    cardType={$t('stipend.accrued.cardType')}
    cardTitle={`₪${Number(buble.amount ?? 0).toFixed(2)}`}
    glowColor="purple"
    onProjectClick={() => onProj?.({ id: buble.projectId })}
  />

  <div
    class="bg-white dark:bg-slate-800 transition-all-300 p-4 flex-1 overflow-y-auto flex flex-col gap-4"
  >
    <p class="text-sm text-gray-700 dark:text-gray-300">
      {$t('stipend.accrued.body', { name: buble.funderName })}
    </p>

    <CycleFacts
      side="recipient"
      missionNames={buble.missionNames}
      cycleStart={buble.cycleStart}
      cycleEnd={buble.cycleEnd}
      hours={buble.hours}
      stipendRate={buble.stipendRate}
      amount={buble.amount}
      gross={buble.gross}
      cappedBy={buble.cappedBy}
      mode={buble.mode}
      equityDebit={buble.equityDebit}
    />

    <p class="text-xs text-gray-600 dark:text-gray-300">{$t('stipend.accrued.note')}</p>
  </div>

  <!--
    No footer button. Settling is the funder's act; the recipient's only move
    here is to know. When the money is sent this card is replaced by the
    confirmation card, which does have one.
  -->
  <div
    class="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300"
  >
    {$t('stipend.accrued.waiting', { name: buble.funderName })}
  </div>
</div>

<style>
  .shadow-glow {
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 0 20px rgba(var(--glow-rgb), 0.4),
      0 0 40px rgba(var(--glow-rgb), 0.3),
      inset 0 0 20px rgba(var(--glow-rgb), 0.05);
  }
  .border-glow {
    border: 2px solid rgba(var(--glow-rgb), 0.5);
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 0 20px rgba(var(--glow-rgb), 0.4),
      0 0 40px rgba(var(--glow-rgb), 0.3),
      inset 0 0 20px rgba(var(--glow-rgb), 0.05),
      0 0 0 1px rgba(var(--glow-rgb), 0.3);
  }
</style>
