<script lang="ts">
  /**
   * The parcel's tracking number (`setOrderTracking`). Any member may add,
   * change or remove it. It is kept on the order; if the buyer left an email
   * they are told — at once when the order already shipped, otherwise with the
   * "shipped" mail. So the sheet says that before it asks for anything.
   */
  import { t } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { invalidate } from '$app/navigation';
  import { executeAction } from '$lib/client/actionClient';
  import type { ShopOrder } from '$lib/shop/manage';
  import { shopOrdersKey } from '$lib/shop/keys';
  import ShopSheet from './ShopSheet.svelte';

  let { open = $bindable(false), order, projectId }: { open?: boolean; order: ShopOrder; projectId: string } = $props();

  let carrier = $state('');
  let number = $state('');
  let url = $state('');
  let busy = $state(false);
  let failed = $state(false);
  let missing = $state(false);

  // Each time the sheet opens it starts from what the order has now.
  $effect(() => {
    if (open) {
      carrier = order.tracking?.carrier ?? '';
      number = order.tracking?.number ?? '';
      url = order.tracking?.url ?? '';
      failed = false;
      missing = false;
    }
  });

  async function send(params: Record<string, unknown>, doneKey: 'shop.tracking.saved' | 'shop.tracking.removed') {
    busy = true;
    failed = false;
    const res = await executeAction(
      'setOrderTracking' as any,
      { projectId, orderRef: order.ref, ...params },
      { showErrorToast: false }
    ).catch(() => null);
    busy = false;
    if (res?.success) {
      open = false;
      toast.success($t(doneKey, { number: order.number }));
      invalidate(shopOrdersKey(projectId));
    } else {
      failed = true;
    }
  }

  function save() {
    missing = !number.trim();
    if (missing) return;
    send({ number: number.trim(), carrier: carrier.trim() || undefined, url: url.trim() || undefined }, 'shop.tracking.saved');
  }

  function remove() {
    send({ clear: true }, 'shop.tracking.removed');
  }
</script>

<ShopSheet bind:open label={$t('shop.tracking.title', { number: order.number })}>
  <form
    class="td"
    onsubmit={(e) => {
      e.preventDefault();
      save();
    }}
  >
    <h2 class="sh-title td-title">{$t('shop.tracking.title', { number: order.number })}</h2>
    <p>{$t('shop.tracking.body')}</p>
    <label class="sh-field">
      {$t('shop.tracking.number')}
      <input class="sh-input" bind:value={number} maxlength="60" dir="ltr" autocomplete="off" aria-invalid={missing} />
    </label>
    {#if missing}<p class="td-err" role="alert">{$t('shop.tracking.missing')}</p>{/if}
    <label class="sh-field">
      {$t('shop.tracking.carrier')}
      <input class="sh-input" bind:value={carrier} maxlength="40" autocomplete="off" />
    </label>
    <label class="sh-field">
      {$t('shop.tracking.url')}
      <input class="sh-input" type="url" bind:value={url} maxlength="300" dir="ltr" autocomplete="off" inputmode="url" />
    </label>
    {#if failed}<p class="td-err" role="alert">{$t('shop.tracking.failed')}</p>{/if}
    <div class="td-actions">
      {#if order.tracking}
        <button type="button" class="sh-btn sh-btn-quiet td-remove" onclick={remove} disabled={busy}>{$t('shop.tracking.remove')}</button>
      {/if}
      <button type="button" class="sh-btn sh-btn-quiet" onclick={() => (open = false)} disabled={busy}>{$t('shop.tracking.close')}</button>
      <button type="submit" class="sh-btn sh-btn-primary" disabled={busy}>{$t('shop.tracking.save')}</button>
    </div>
  </form>
</ShopSheet>

<style>
  .td {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .td-title {
    font-size: 22px;
  }
  .td p {
    font-size: 14px;
    line-height: 1.6;
  }
  .td-err {
    color: var(--sh-accent-ink) !important;
    font-weight: 600;
  }
  .td-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
  .td-remove {
    margin-inline-end: auto;
    color: var(--sh-accent-ink);
  }
</style>
