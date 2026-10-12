<script>
  /**
   * Hours the monthly ceiling held back — still open, for both sides to decide.
   * (PLAN_STIPEND §6; `resolveStipendOverCap`.)
   *
   * The ceiling used to make them simply fall. They are approved work, so they
   * stay here instead, on both cards, until the two of them decide:
   *
   *   funder    — "pay them too". The recipient's receipt is still their yes.
   *   recipient — "the money for them arrived", "ask {name} to pay them", or
   *               "let them go" — the only side that can close them unpaid,
   *               because they are the only one it costs.
   *
   * No "no" for the funder on purpose: not paying past the agreed ceiling is
   * already the default, so the balance just stays visible.
   */
  import { t } from '$lib/translations';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import { useFormatMoney } from '$lib/money/context.svelte';
  import { WELL, LABEL, BODY, MUTED, INPUT, BTN_PRIMARY, BTN_GHOST } from './ui.js';

  /**
   * @typedef {Object} Props
   * @property {string} pledgeId
   * @property {'funder'|'recipient'} side
   * @property {{hours: number, amount: number}} balance
   * @property {string} [otherName] - the other party
   * @property {(how: string) => void} [onDone] - called with what was done
   * @property {'balance'|'window'} [scope] - held back earlier, or by the window still open
   * @property {number} [due] - window only: what the open cycle pays within the ceiling
   */

  /** @type {Props} */
  let { pledgeId, side, balance, otherName = '', onDone, scope = 'balance', due = 0 } = $props();
  const inWindow = $derived(scope === 'window');
  const fmtMoney = useFormatMoney();
  const money = (n) => fmtMoney(Number(n ?? 0), null, { fraction: 'full' });

  let busy = $state(false);
  /** @type {null | 'pay' | 'received' | 'release'} */
  let step = $state(null);
  let otherAmount = $state(false);
  let typed = $state('');

  const total = $derived(Number(balance?.amount ?? 0));
  const chosen = $derived(otherAmount ? Number(typed) : total);
  const chosenValid = $derived(Number.isFinite(chosen) && chosen > 0 && chosen <= total);

  /**
   * @param {'pay'|'received'|'release'|'ask'} how
   * @param {boolean} [transferred]
   */
  async function run(how, transferred = true) {
    if (busy) return;
    if ((how === 'pay' || how === 'received') && !chosenValid) return;
    busy = true;
    try {
      const extra = otherAmount && chosen < total ? chosen : total;
      // Inside the open window a receipt closes the whole cycle, past the
      // ceiling by what arrived for these hours — the settlement's own path.
      const res =
        inWindow && how === 'received'
          ? await executeAction('settleStipendCycle', {
              pledgeId: String(pledgeId),
              receivedAmount: Math.round((Number(due) + extra) * 100) / 100
            })
          : await executeAction('resolveStipendOverCap', {
        pledgeId: String(pledgeId),
        how,
        ...(inWindow ? { scope: 'window' } : {}),
        ...(how === 'pay' ? { transferred } : {}),
        ...((how === 'pay' || how === 'received') && otherAmount && chosen < total ? { amount: chosen } : {})
      });
      if (res?.success === false) throw new Error(actionErrorText(res, $t('stipend.toast.error')));
      if ((res?.data?.resolved === false && !res?.data?.asked) || res?.data?.settled === false) {
        toast($t('stipend.overCap.nothingOpen'));
      } else {
        toast.success($t(`stipend.overCap.done.${how}`, { name: otherName }));
      }
      if (how !== 'ask') onDone?.(how);
    } catch (e) {
      console.error('[OverCapBalance] resolve failed:', e);
      toast.error(e instanceof Error ? e.message : $t('stipend.toast.error'));
    } finally {
      busy = false;
      step = null;
      otherAmount = false;
    }
  }
</script>

{#if total > 0}
  <div class="{WELL} p-3 space-y-2">
    <span class={LABEL}>{inWindow ? $t('stipend.overCap.titleWindow') : $t('stipend.overCap.title')}</span>
    <p class="{BODY} text-sm">
      {inWindow
        ? $t('stipend.overCap.bodyWindow', { hours: balance.hours, count: money(total) })
        : $t('stipend.overCap.body', { hours: balance.hours, count: money(total) })}
    </p>
    <p class={MUTED}>
      {side === 'funder'
        ? $t('stipend.overCap.funderNote', { name: otherName })
        : $t('stipend.overCap.recipientNote', { name: otherName })}
    </p>

    {#if step === 'pay' || step === 'received'}
      {#if otherAmount}
        <label class="flex flex-col gap-1 {MUTED}">
          {$t('stipend.overCap.partLabel')}
          <input type="number" inputmode="decimal" min="0" max={total} step="0.01" bind:value={typed} class="{INPUT} text-sm" />
          {#if typed !== '' && !chosenValid}
            <span class="text-amber-700 dark:text-amber-300">{$t('stipend.accrued.otherAmountInvalid', { count: money(total) })}</span>
          {/if}
        </label>
      {:else}
        <button
          type="button"
          class="text-xs underline decoration-dotted underline-offset-2 {BODY}"
          onclick={() => {
            otherAmount = true;
            typed = '';
          }}
        >
          {$t('stipend.overCap.part')}
        </button>
      {/if}
    {/if}

    {#if step === 'pay'}
      <!-- Same question the cycle asks: paying and having paid are two claims. -->
      <p class="{BODY} text-sm font-bold">{$t('stipend.transfer.ask', { name: otherName })}</p>
      <div class="flex gap-2">
        <button type="button" class="{BTN_GHOST} flex-1 py-2 text-sm" disabled={busy || !chosenValid} onclick={() => run('pay', false)}>
          {$t('stipend.transfer.notYet')}
        </button>
        <button type="button" class="{BTN_PRIMARY} flex-[2] py-2 text-sm" disabled={busy || !chosenValid} onclick={() => run('pay', true)}>
          {busy ? $t('stipend.actions.sending') : $t('stipend.transfer.alreadySent')}
        </button>
      </div>
      <button type="button" class="text-xs {MUTED}" onclick={() => (step = null)}>{$t('stipend.accrued.back')}</button>
    {:else if step === 'received' || step === 'release'}
      <p class="{BODY} text-sm font-bold">
        {step === 'received'
          ? inWindow
            ? $t('stipend.overCap.confirmReceivedWindow', {
                count: money(Number(due) + (chosenValid ? chosen : total)),
                name: otherName
              })
            : $t('stipend.overCap.confirmReceived', { count: money(chosenValid ? chosen : total), name: otherName })
          : $t('stipend.overCap.confirmRelease', { hours: balance.hours })}
      </p>
      <p class={MUTED}>
        {step === 'received' ? $t('stipend.accrued.confirmNote') : $t('stipend.overCap.releaseNote')}
      </p>
      <div class="flex gap-2">
        <button type="button" class="{BTN_GHOST} flex-1 py-2 text-sm" disabled={busy} onclick={() => ((step = null), (otherAmount = false))}>
          {$t('stipend.accrued.back')}
        </button>
        <button
          type="button"
          class="{BTN_PRIMARY} flex-[2] py-2 text-sm"
          disabled={busy || (step === 'received' && !chosenValid)}
          onclick={() => run(step === 'received' ? 'received' : 'release')}
        >
          {busy ? $t('stipend.actions.sending') : $t('stipend.overCap.confirmYes')}
        </button>
      </div>
    {:else if side === 'funder'}
      <button type="button" class="{BTN_PRIMARY} w-full py-2 text-sm" disabled={busy} onclick={() => (step = 'pay')}>
        {$t('stipend.overCap.pay', { count: money(total) })}
      </button>
    {:else}
      <div class="flex flex-col gap-2">
        <button type="button" class="{BTN_PRIMARY} w-full py-2 text-sm" disabled={busy} onclick={() => (step = 'received')}>
          {inWindow ? $t('stipend.overCap.receivedWindow') : $t('stipend.overCap.received')}
        </button>
        <div class="flex gap-2">
          <button type="button" class="{BTN_GHOST} flex-1 py-2 text-xs" disabled={busy} onclick={() => run('ask')}>
            {$t('stipend.overCap.ask', { name: otherName })}
          </button>
          <button type="button" class="{BTN_GHOST} flex-1 py-2 text-xs" disabled={busy} onclick={() => (step = 'release')}>
            {$t('stipend.overCap.release')}
          </button>
        </div>
      </div>
    {/if}
  </div>
{/if}
