<script>
  /**
   * "The cycle closed: 42 hours × ₪50 = ₪2,100 — pay" (PLAN_STIPEND §6, §8).
   *
   * The funder confirms a **derived** number. There is no amount field, on
   * purpose: a hand-typed figure would separate the money book from the equity
   * book within two cycles. The hours behind it are approved hours only — a
   * finiapruval that later gets refused must never have been paid for.
   *
   * Pressing pay creates the Haluka (marked as sent by the funder) and the
   * ledger row, which stays `sent` until the recipient confirms it arrived.
   */
  import { t, isRtl } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import { stipendPayablesStore } from '$lib/stores/levStores';
  import CardHeader from './CardHeader.svelte';

  let { buble, isFirst = false, onProj, onDone } = $props();

  let busy = $state(false);

  const capped = $derived(buble?.cappedBy ?? null);

  function handleProjectClick() {
    if (onProj && buble.projectId) onProj({ id: buble.projectId });
  }

  async function pay() {
    if (busy) return;
    busy = true;
    try {
      const res = await executeAction('settleStipendCycle', {
        pledgeId: String(buble.pledgeId)
      });
      if (res?.success === false) throw new Error(String(res?.error?.message ?? res?.error ?? 'failed'));
      if (res?.data?.settled === false) {
        toast($t('stipend.pay.nothingThisCycle'));
      } else {
        toast.success($t('stipend.pay.sent'));
      }
      stipendPayablesStore.update((list) =>
        list.filter((p) => String(p.pledgeId) !== String(buble.pledgeId))
      );
      onDone?.();
    } catch (e) {
      console.error('[StipendPayCard] settle failed:', e);
      toast.error(e instanceof Error ? e.message : $t('stipend.toast.error'));
    } finally {
      busy = false;
    }
  }
</script>

<div
  onclick={toggleScrollable}
  role="button"
  tabindex="0"
  onkeypress={(e) => {
    e.key === 'Enter' && toggleScrollable();
  }}
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="{isMobileOrTablet()
    ? 'w-full h-full'
    : 'w-[90%] h-[90%]'} lg:w-[90%] {isFirst
    ? $isRtl
      ? 'boxleft'
      : 'boxright'
    : ''} flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden {isScrolable.value
    ? 'shadow-glow border-glow'
    : 'shadow-lg border border-gray-100 dark:border-gray-700'} transition-all duration-300 relative"
  style:--glow-rgb="52, 211, 153"
>
  <CardHeader
    logoSrc={buble.src}
    projectName={buble.projectName}
    cardType={$t('stipend.pay.cardType')}
    cardTitle={`₪${Number(buble.amount).toFixed(2)}`}
    glowColor="teal"
    onProjectClick={handleProjectClick}
  />

  <div
    class="{isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-200 dark:bg-slate-700'} transition-all-300 p-4 flex-1 overflow-y-auto flex flex-col gap-4"
  >
    <p class="text-sm text-gray-700 dark:text-gray-300">
      {$t('stipend.pay.body', { name: buble.recipientName })}
    </p>

    <!-- The whole calculation, visible. Nothing here is typed by anyone. -->
    <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-sm space-y-1">
      <p>{$t('stipend.pay.hours', { count: buble.hours })}</p>
      <p>{$t('stipend.pay.rate', { count: buble.stipendRate })}</p>
      <p class="font-bold">
        {$t('stipend.pay.total', { count: Number(buble.amount).toFixed(2) })}
      </p>
      {#if capped}
        <p class="text-xs text-amber-700 dark:text-amber-300">
          {$t(`stipend.pay.capped.${capped}`, { count: Number(buble.gross).toFixed(2) })}
        </p>
      {/if}
      {#if buble.exhausts}
        <p class="text-xs text-amber-700 dark:text-amber-300">{$t('stipend.pay.lastCycle')}</p>
      {/if}
    </div>

    <p class="text-xs text-gray-600 dark:text-gray-300">
      {$t(`stipend.pay.modeNote.${buble.mode ?? 'equity'}`)}
    </p>
  </div>

  <div class="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
    <button
      type="button"
      onclick={pay}
      disabled={busy}
      class="w-full rounded-xl bg-barbi text-gold py-3 text-sm font-bold disabled:opacity-60"
    >
      {busy ? $t('stipend.actions.sending') : $t('stipend.pay.action')}
    </button>
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
