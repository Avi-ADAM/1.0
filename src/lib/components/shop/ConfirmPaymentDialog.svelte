<script lang="ts">
  /**
   * "The payment reached me" — for an order the buyer asked to pay by
   * arrangement (PLAN_SHOP_OPERATIONS §5.2). Whoever confirms is the money's
   * holder: the sales are recorded in their name, so the text asks exactly
   * that, and a buyer who paid another member is theirs to confirm.
   *
   * What arrived is what is recorded: a discount given on the phone is typed
   * here, and the order is marked as sold under the catalog price.
   */
  import { t } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { invalidate } from '$app/navigation';
  import { executeAction } from '$lib/client/actionClient';
  import { useFormatMoney } from '$lib/money/context.svelte';
  import { type ShopOrder } from '$lib/shop/manage';
  import { shopOrdersKey } from '$lib/shop/keys';
  import ShopSheet from './ShopSheet.svelte';

  let { open = $bindable(false), order, projectId }: { open?: boolean; order: ShopOrder; projectId: string } = $props();

  const METHODS = ['bit', 'paybox', 'transfer', 'cash', 'other'] as const;
  const fmtMoney = useFormatMoney();

  let amount = $state<number | null>(null);
  let method = $state<(typeof METHODS)[number]>('bit');
  let note = $state('');
  let busy = $state(false);
  let failed = $state(false);
  let under = $derived(amount !== null && order.total !== null && amount < order.total);
  let valid = $derived(amount !== null && Number.isFinite(amount) && amount >= 0);

  $effect(() => {
    if (open) {
      amount = order.total;
      method = 'bit';
      note = '';
      failed = false;
    }
  });

  async function confirm() {
    if (!valid) return;
    busy = true;
    failed = false;
    const res = await executeAction(
      'confirmOrderPayment' as any,
      { projectId, orderRef: order.ref, amount, method, note: note.trim() || undefined },
      { showErrorToast: false }
    ).catch(() => null);
    busy = false;
    if (res?.success) {
      open = false;
      toast.success($t('shop.toast.paid', { number: order.number }));
      invalidate(shopOrdersKey(projectId));
    } else {
      failed = true;
    }
  }
</script>

<ShopSheet bind:open label={$t('shop.pay.title', { number: order.number })}>
  <div class="cp">
    <h2 class="sh-title cp-title">{$t('shop.pay.title', { number: order.number })}</h2>
    <p>{$t('shop.pay.body')}</p>
    <label class="sh-field">
      {$t('shop.pay.amount')}
      <input class="sh-input sh-num" type="number" inputmode="decimal" min="0" step="0.01" bind:value={amount} />
      <small class="cp-hint">{$t('shop.pay.amountHint')}</small>
    </label>
    {#if under}
      <p class="cp-under">{$t('shop.pay.under', { amount: fmtMoney(order.total, order.currency) })}</p>
    {/if}
    <fieldset class="cp-methods">
      <legend class="sh-section-label">{$t('shop.pay.method')}</legend>
      <div class="sh-pills">
        {#each METHODS as m (m)}
          <button type="button" class="sh-pill" aria-pressed={method === m} onclick={() => (method = m)}>
            {$t(`shop.pay.methods.${m}`)}
          </button>
        {/each}
      </div>
    </fieldset>
    <label class="sh-field">
      {$t('shop.pay.note')}
      <input class="sh-input" type="text" maxlength="300" bind:value={note} />
    </label>
    {#if failed}<p class="cp-err" role="alert">{$t('shop.pay.failed')}</p>{/if}
    <div class="cp-actions">
      <button type="button" class="sh-btn sh-btn-quiet" onclick={() => (open = false)} disabled={busy}>{$t('shop.pay.keep')}</button>
      <button type="button" class="sh-btn sh-btn-primary" onclick={confirm} disabled={busy || !valid}>{$t('shop.pay.confirm')}</button>
    </div>
  </div>
</ShopSheet>

<style>
  .cp {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .cp-title {
    font-size: 22px;
  }
  .cp p {
    font-size: 14px;
    line-height: 1.6;
  }
  .cp-hint {
    display: block;
    font-size: 12px;
    color: var(--sh-muted);
  }
  .cp-under {
    padding: 10px 12px;
    border-radius: var(--sh-radius-sm);
    background: var(--sh-warn-tint);
    border: 1px solid var(--sh-warn-line);
    color: var(--sh-ink) !important;
  }
  .cp-methods {
    border: 0;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .cp-err {
    color: var(--sh-accent-ink) !important;
    font-weight: 600;
  }
  .cp-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
</style>
