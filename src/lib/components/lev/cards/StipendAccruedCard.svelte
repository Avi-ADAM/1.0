<script>
  import { useFormatMoney } from '$lib/money/context.svelte';
  /**
   * "You have earned ₪600 this month and it has not been paid yet."
   * (PLAN_STIPEND §6, §8 — docs/inprogress/FIXES.md §10.)
   *
   * It exists because the number did not exist anywhere the recipient could
   * see it. The funder's pay card held the only copy — so the person living on
   * the money found out how much was coming when (or whether) it arrived. It
   * is computed by the same `computeStipendCycle` the settlement uses, from
   * approved hours only, so what it promises is what will actually be sent.
   *
   * Settling is still the funder's act — but **receiving** is the recipient's.
   * A funder who transferred and never came back to press "pay" left the
   * recipient holding money the books did not know about, with no way to close
   * the matter. So the card offers one move: "it arrived". That receipt closes
   * the cycle at once (`settleStipendCycle` as the recipient), and a smaller
   * figure leaves the rest of the hours owed rather than lost.
   */
  import { t, isRtl } from '$lib/translations';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { stipendAccrualsStore } from '$lib/stores/levStores';
  import CardHeader from './CardHeader.svelte';
  import CycleFacts from '$lib/components/stipend/CycleFacts.svelte';
  import OverCapBalance from '$lib/components/stipend/OverCapBalance.svelte';

  let { buble, isFirst = false, onProj, onUser, onDone } = $props();
  const fmtMoney = useFormatMoney();

  let busy = $state(false);
  /** The "you're confirming X arrived" step between the button and the write. */
  let asking = $state(false);
  /** Typing another figure than the one due. */
  let otherAmount = $state(false);
  let received = $state('');

  const due = $derived(Number(buble.amount ?? 0));
  const receivedNum = $derived(otherAmount ? Number(received) : due);
  /**
   * The most that can have arrived for these hours: what they come to, past
   * the ceiling too — a funder who paid the extra hours agreed to by paying.
   */
  const most = $derived(due + Number(buble.overCap ?? 0));
  const receivedValid = $derived(Number.isFinite(receivedNum) && receivedNum > 0 && receivedNum <= most);
  const balance = $derived(buble.overCapBalance ?? null);

  /** What the ceiling is holding back in this window — open, like the balance. */
  const windowOver = $derived(
    Number(buble.overCap ?? 0) > 0 ? { hours: Number(buble.overCapHours ?? 0), amount: Number(buble.overCap) } : null
  );

  /**
   * A decision on this window's over-cap hours. A receipt closed the whole
   * cycle, so the card goes; a release leaves the cycle due at the ceiling.
   * @param {string} how
   */
  function windowDone(how) {
    if (how === 'received') {
      stipendAccrualsStore.update((list) => list.filter((a) => String(a.pledgeId) !== String(buble.pledgeId)));
      onDone?.();
      return;
    }
    stipendAccrualsStore.update((list) =>
      list.map((a) =>
        String(a.pledgeId) === String(buble.pledgeId) ? { ...a, overCap: 0, overCapHours: 0 } : a
      )
    );
  }

  /** The open balance was decided on — drop it, and the card if nothing else is due. */
  function balanceDone() {
    const keep = due > 0;
    stipendAccrualsStore.update((list) =>
      keep
        ? list.map((a) => (String(a.pledgeId) === String(buble.pledgeId) ? { ...a, overCapBalance: null } : a))
        : list.filter((a) => String(a.pledgeId) !== String(buble.pledgeId))
    );
    if (!keep) onDone?.();
  }

  async function declareReceived() {
    if (busy || !receivedValid) return;
    busy = true;
    try {
      const res = await executeAction('settleStipendCycle', {
        pledgeId: String(buble.pledgeId),
        ...(otherAmount && receivedNum !== due ? { receivedAmount: receivedNum } : {})
      });
      if (res?.success === false) throw new Error(actionErrorText(res, $t('stipend.toast.error')));
      if (res?.data?.settled === false) {
        toast($t('stipend.pay.nothingThisCycle'));
      } else {
        toast.success($t('stipend.accrued.received'));
      }
      stipendAccrualsStore.update((list) =>
        list.filter((a) => String(a.pledgeId) !== String(buble.pledgeId))
      );
      onDone?.();
    } catch (e) {
      console.error('[StipendAccruedCard] declare received failed:', e);
      toast.error(e instanceof Error ? e.message : $t('stipend.toast.error'));
    } finally {
      busy = false;
      asking = false;
    }
  }
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
    cardTitle={fmtMoney(due > 0 ? due : Number(balance?.amount ?? 0), null, { fraction: 'full' })}
    glowColor="purple"
    onProjectClick={() => onProj?.({ id: buble.projectId })}
  />

  <div
    class="bg-white dark:bg-slate-800 transition-all-300 p-4 flex-1 overflow-y-auto flex flex-col gap-4"
  >
    {#if due > 0}
    <p class="text-sm text-gray-700 dark:text-gray-300">
      {$t('stipend.accrued.body', { name: buble.funderName })}
    </p>

    <CycleFacts
      side="recipient"
      missionNames={buble.missionNames}
      missions={buble.missions}
      projectId={buble.projectId}
      cycleStart={buble.cycleStart}
      cycleEnd={buble.cycleEnd}
      hours={buble.hours}
      stipendRate={buble.stipendRate}
      amount={buble.amount}
      gross={buble.gross}
      cappedBy={buble.cappedBy}
      capMonths={buble.capMonths ?? 1}
      monthlyCap={buble.monthlyCap ?? null}
      mode={buble.mode}
      equityDebit={buble.equityDebit}
    />

    {#if windowOver}
      <!-- The hours past the ceiling this month: not erased, open for both. -->
      <OverCapBalance
        pledgeId={buble.pledgeId}
        side="recipient"
        scope="window"
        {due}
        balance={windowOver}
        otherName={buble.funderName}
        onDone={windowDone}
      />
    {/if}

    <p class="text-xs text-gray-600 dark:text-gray-300">{$t('stipend.accrued.note')}</p>
    {/if}

    {#if balance}
      <OverCapBalance
        pledgeId={buble.pledgeId}
        side="recipient"
        {balance}
        otherName={buble.funderName}
        onDone={balanceDone}
      />
    {/if}
  </div>

  {#if due > 0}

  <div
    class="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-2"
  >
    {#if asking}
      <!-- A receipt moves the shares at once, so it is said back before it is written. -->
      <p class="text-sm font-bold text-gray-800 dark:text-gray-100">
        {$t('stipend.accrued.confirmAsk', {
          count: fmtMoney(receivedNum, null, { fraction: 'full' }),
          name: buble.funderName
        })}
      </p>
      <p class="text-xs text-gray-600 dark:text-gray-300">{$t('stipend.accrued.confirmNote')}</p>
      {#if otherAmount}
        <label class="flex flex-col gap-1 text-xs text-gray-700 dark:text-gray-200">
          {$t('stipend.accrued.otherAmountLabel')}
          <input
            type="number"
            inputmode="decimal"
            min="0"
            max={most}
            step="0.01"
            bind:value={received}
            class="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          />
          {#if received !== '' && !receivedValid}
            <span class="text-amber-700 dark:text-amber-300">
              {$t('stipend.accrued.otherAmountInvalid', { count: fmtMoney(most, null, { fraction: 'full' }) })}
            </span>
          {:else if receivedValid && receivedNum < due}
            <span class="text-gray-600 dark:text-gray-300">{$t('stipend.accrued.otherAmountRest')}</span>
          {:else if receivedValid && receivedNum > due}
            <span class="text-gray-600 dark:text-gray-300">{$t('stipend.overCap.receivedPastCeiling', { name: buble.funderName })}</span>
          {/if}
        </label>
      {:else}
        <button
          type="button"
          onclick={() => {
            otherAmount = true;
            received = '';
          }}
          class="self-start text-xs underline decoration-dotted underline-offset-2 text-gray-700 dark:text-gray-200"
        >
          {$t('stipend.accrued.otherAmount')}
        </button>
      {/if}
      <div class="flex gap-2">
        <button
          type="button"
          onclick={() => {
            asking = false;
            otherAmount = false;
          }}
          disabled={busy}
          class="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 py-3 text-sm text-gray-800 dark:text-gray-100 disabled:opacity-60"
        >
          {$t('stipend.accrued.back')}
        </button>
        <button
          type="button"
          onclick={declareReceived}
          disabled={busy || !receivedValid}
          class="flex-[2] rounded-xl bg-barbi text-gold py-3 text-sm font-bold disabled:opacity-60"
        >
          {busy ? $t('stipend.actions.sending') : $t('stipend.accrued.confirmYes')}
        </button>
      </div>
    {:else}
      <p class="text-xs text-gray-600 dark:text-gray-300">
        {$t('stipend.accrued.waiting', { name: buble.funderName })}
      </p>
      <button
        type="button"
        onclick={() => (asking = true)}
        disabled={busy}
        class="w-full rounded-xl bg-barbi text-gold py-3 text-sm font-bold disabled:opacity-60"
      >
        {$t('stipend.accrued.iReceived')}
      </button>
    {/if}
  </div>
  {/if}
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
