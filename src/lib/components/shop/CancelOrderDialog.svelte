<script lang="ts">
  /**
   * Cancel and refund a paid order (UX_COPY_SHOP_SALES §3.6). Shown only to
   * the order's holder — `cancelOrder` refuses everyone else. It records a
   * refund already agreed with the buyer and made on the site: the holder's
   * sales not yet in a split are reset, ones already in a split stay and the
   * rikma is told. No undo — the text says so by what it asks first.
   *
   * An order still waiting for an arranged payment (PLAN_SHOP_OPERATIONS §5)
   * has nothing to refund or restock: any member may call it off, and the
   * sheet says only that.
   */
  import { t } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { invalidate } from '$app/navigation';
  import { executeAction } from '$lib/client/actionClient';
  import { salesInSplit, type ShopOrder } from '$lib/shop/manage';
  import { shopOrdersKey } from '$lib/shop/keys';
  import ShopSheet from './ShopSheet.svelte';

  let { open = $bindable(false), order, projectId }: { open?: boolean; order: ShopOrder; projectId: string } = $props();

  let reason = $state('');
  // Stock comes back by default only for an order that never left the shelf.
  let restock = $state(true);
  let busy = $state(false);
  let failed = $state(false);
  let inSplit = $derived(salesInSplit(order));
  let beforePayment = $derived(order.status === 'pendingPayment');

  $effect(() => {
    if (open) {
      restock = order.status === 'paid';
      failed = false;
    }
  });

  async function confirm() {
    busy = true;
    failed = false;
    const res = await executeAction(
      'cancelOrder' as any,
      { projectId, orderRef: order.ref, reason: reason.trim() || undefined, ...(beforePayment ? {} : { restock }) },
      { showErrorToast: false }
    ).catch(() => null);
    busy = false;
    if (res?.success) {
      open = false;
      toast.success($t('shop.toast.cancelled', { number: order.number }));
      invalidate(shopOrdersKey(projectId));
    } else {
      failed = true;
    }
  }
</script>

<ShopSheet bind:open label={$t(beforePayment ? 'shop.cancel.pendingTitle' : 'shop.cancel.title', { number: order.number })}>
  <div class="cd">
    <h2 class="sh-title cd-title">{$t(beforePayment ? 'shop.cancel.pendingTitle' : 'shop.cancel.title', { number: order.number })}</h2>
    <p>{$t(beforePayment ? 'shop.cancel.pendingBody' : 'shop.cancel.body')}</p>
    {#if !beforePayment && inSplit > 0}
      <p class="cd-split">
        {inSplit === 1 ? $t('shop.cancel.inSplitOne') : $t('shop.cancel.inSplit', { count: inSplit })}
      </p>
    {/if}
    {#if !beforePayment}
    <label class="cd-check">
      <input type="checkbox" bind:checked={restock} />
      <span>
        {$t('shop.cancel.restock')}
        <small>{$t('shop.cancel.restockHint')}</small>
      </span>
    </label>
    {/if}
    <label class="sh-field">
      {$t('shop.cancel.reason')}
      <textarea class="sh-input" bind:value={reason} maxlength="500" rows="3"></textarea>
    </label>
    {#if failed}<p class="cd-err" role="alert">{$t('shop.cancel.failed')}</p>{/if}
    <div class="cd-actions">
      <button type="button" class="sh-btn sh-btn-quiet" onclick={() => (open = false)} disabled={busy}>{$t('shop.cancel.keep')}</button>
      <button type="button" class="sh-btn sh-btn-primary" onclick={confirm} disabled={busy}>{$t('shop.cancel.confirm')}</button>
    </div>
  </div>
</ShopSheet>

<style>
  .cd {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .cd-title {
    font-size: 22px;
  }
  .cd p {
    font-size: 14px;
    line-height: 1.6;
  }
  .cd-split {
    padding: 10px 12px;
    border-radius: var(--sh-radius-sm);
    background: var(--sh-warn-tint);
    border: 1px solid var(--sh-warn-line);
    color: var(--sh-ink) !important;
  }
  .cd-check {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    font-size: 14px;
    min-height: 44px;
  }
  .cd-check input {
    width: 20px;
    height: 20px;
    margin-top: 2px;
    accent-color: var(--sh-accent);
  }
  .cd-check small {
    display: block;
    font-size: 12px;
    color: var(--sh-muted);
  }
  .cd-err {
    color: var(--sh-accent-ink) !important;
    font-weight: 600;
  }
  .cd-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
</style>
