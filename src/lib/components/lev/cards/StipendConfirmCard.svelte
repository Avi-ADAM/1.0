<script>
  /**
   * "Dana marked ₪2,100 as sent — did it arrive?" (PLAN_STIPEND §6, §8).
   *
   * The single event in the whole feature that moves a percentage. Until it is
   * answered — here, or by silence for the rikma's restime — the ledger row
   * exists but counts for nothing, exactly like a Sale whose holder claim is
   * still open.
   *
   * There is no reject button. "Nothing arrived" is a counter of amount 0, and
   * a partial arrival is the same move with the real number; either way the
   * pledge keeps running and the funder can send again.
   */
  import { t, isRtl } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import { stipendConfirmationsStore } from '$lib/stores/levStores';
  import CardHeader from './CardHeader.svelte';

  let { buble, isFirst = false, onProj, onUser, onDone } = $props();

  let busy = $state(false);
  let counterOpen = $state(false);
  // Null until the recipient types a correction, so the field always opens on
  // the amount that was actually sent even if the card is re-bound.
  let received = $state(null);
  const correction = $derived(received == null ? Number(buble?.amount ?? 0) : Number(received));

  function retire() {
    stipendConfirmationsStore.update((list) =>
      list.filter((c) => String(c.paymentId) !== String(buble.paymentId))
    );
    onDone?.();
  }

  async function send(amount) {
    if (busy) return;
    busy = true;
    try {
      const res = await executeAction('confirmStipendPayment', {
        paymentId: String(buble.paymentId),
        ...(amount != null ? { receivedAmount: Number(amount) } : {})
      });
      if (res?.success === false) throw new Error(String(res?.error?.message ?? res?.error ?? 'failed'));
      toast.success(
        res?.data?.status === 'cancelled'
          ? $t('stipend.confirm.reportedNothing')
          : $t('stipend.confirm.done')
      );
      retire();
    } catch (e) {
      console.error('[StipendConfirmCard] confirm failed:', e);
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
    cardType={$t('stipend.confirm.cardType')}
    cardTitle={`₪${Number(buble.amount).toFixed(2)}`}
    glowColor="teal"
    onProjectClick={() => onProj?.({ id: buble.projectId })}
  />

  <div
    class="{isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-200 dark:bg-slate-700'} transition-all-300 p-4 flex-1 overflow-y-auto flex flex-col gap-4"
  >
    <p class="text-sm text-gray-700 dark:text-gray-300">
      {$t('stipend.confirm.body', {
        name: buble.funderName,
        count: Number(buble.amount).toFixed(2)
      })}
    </p>

    <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-sm space-y-1">
      <p>{$t('stipend.pay.hours', { count: buble.hours })}</p>
      <p>{$t('stipend.pay.rate', { count: buble.stipendRate })}</p>
    </div>

    <p class="text-xs text-gray-600 dark:text-gray-300">{$t('stipend.confirm.equityNote')}</p>

    {#if counterOpen}
      <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex flex-col gap-2">
        <label class="flex flex-col gap-1">
          <span class="text-xs font-bold uppercase text-gray-600 dark:text-gray-300"
            >{$t('stipend.confirm.howMuchArrived')}</span
          >
          <input
            type="number"
            min="0"
            max={Number(buble.amount)}
            step="1"
            value={correction}
            oninput={(e) => (received = e.currentTarget.value)}
            class="rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-50 px-3 py-2"
          />
        </label>
        <p class="text-xs text-gray-600 dark:text-gray-300">{$t('stipend.confirm.zeroNote')}</p>
        <button
          type="button"
          class="rounded-xl border border-gray-300 dark:border-slate-600 py-2 text-sm"
          disabled={busy}
          onclick={() => send(correction)}
        >
          {$t('stipend.confirm.sendCorrection')}
        </button>
      </div>
    {/if}
  </div>

  <div
    class="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex gap-2"
  >
    <button
      type="button"
      class="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 py-3 text-sm"
      onclick={() => (counterOpen = !counterOpen)}
    >
      {$t('stipend.confirm.notExactly')}
    </button>
    <button
      type="button"
      class="flex-[2] rounded-xl bg-barbi text-gold py-3 text-sm font-bold disabled:opacity-60"
      disabled={busy}
      onclick={() => send(null)}
    >
      {busy ? $t('stipend.actions.sending') : $t('stipend.confirm.action')}
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
