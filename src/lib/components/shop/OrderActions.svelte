<script lang="ts">
  /**
   * What the seller can do with an order (UX_COPY_SHOP_SALES §3.5–§3.6):
   *
   * - one primary action, by delivery kind (ship → deliver, pick up, deliver),
   *   with a 5-second undo window (`pendingMarks`);
   * - print the delivery note;
   * - "more" (⋯): cancel — only for the member whose till took the money; the
   *   others are told whom to ask.
   *
   * `bar` is the phone's sticky bottom bar (one button, thumb height); `inline`
   * is the desktop panel's row.
   */
  import { t } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { primaryActionOf, mayCancel, type ShopOrder } from '$lib/shop/manage';
  import { scheduleMark, shownStatus, isPending } from '$lib/shop/pendingMarks.svelte';
  import { markMessages } from '$lib/shop/display';
  import CancelOrderDialog from './CancelOrderDialog.svelte';
  import DeliveryNote from './DeliveryNote.svelte';

  let {
    order,
    projectId,
    uid = null,
    layout = 'inline'
  }: { order: ShopOrder; projectId: string; uid?: string | null; layout?: 'bar' | 'inline' } = $props();

  let status = $derived(shownStatus(order));
  let primary = $derived(primaryActionOf({ status, delivery: order.delivery }));
  let waiting = $derived(isPending(order.id));
  let canCancel = $derived(mayCancel({ status, holderId: order.holderId }, uid));
  let cancelOpen = $state(false);
  let moreEl: HTMLDetailsElement | undefined = $state();

  function mark() {
    if (!primary) return;
    scheduleMark(order, primary, projectId, markMessages($t, order, primary.next), toast);
  }

  function print() {
    if (moreEl) moreEl.open = false;
    window.print();
  }

  function openCancel() {
    if (moreEl) moreEl.open = false;
    cancelOpen = true;
  }

  function closeMenuOnOutside(e: MouseEvent) {
    if (moreEl?.open && !moreEl.contains(e.target as Node)) moreEl.open = false;
  }
</script>

<svelte:window onclick={closeMenuOnOutside} />

<div class="oa oa-{layout}">
  <button type="button" class="sh-btn sh-btn-outline sh-btn-icon oa-print" onclick={print} aria-label={$t('shop.order.print')} title={$t('shop.order.print')}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V3h12v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M6 14h12v7H6z" /></svg>
  </button>

  {#if primary}
    <button type="button" class="sh-btn sh-btn-primary oa-primary" class:sh-btn-lg={layout === 'bar'} onclick={mark} disabled={waiting}>
      {$t(`shop.action.${primary.label}`)}
    </button>
  {:else}
    <span class="oa-spacer"></span>
  {/if}

  {#if status !== 'cancelled'}
    <details class="oa-more" bind:this={moreEl}>
      <summary class="sh-btn sh-btn-quiet sh-btn-icon" aria-label={$t('shop.order.more')} title={$t('shop.order.more')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
      </summary>
      <div class="oa-menu sh-card">
        <button type="button" class="oa-item" onclick={print}>{$t('shop.order.print')}</button>
        {#if canCancel}
          <button type="button" class="oa-item oa-danger" onclick={openCancel}>{$t('shop.cancel.action')}</button>
        {:else if order.holderName}
          <p class="oa-note">{$t('shop.cancel.holderOnly', { name: order.holderName })}</p>
        {/if}
      </div>
    </details>
  {/if}
</div>

{#if canCancel}
  <CancelOrderDialog bind:open={cancelOpen} {order} {projectId} />
{/if}
<DeliveryNote {order} />

<style>
  .oa {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .oa-primary {
    flex: 1 1 auto;
  }
  .oa-inline .oa-primary {
    flex: 0 1 auto;
    order: -1;
  }
  .oa-inline .oa-spacer {
    display: none;
  }
  .oa-spacer {
    flex: 1 1 auto;
  }
  .oa-bar {
    position: fixed;
    inset-inline: 0;
    /* Above the site's bottom bar (folded to its pill here — mobileFooter publishes its height). */
    bottom: var(--foot-h, 0px);
    z-index: 40;
    padding: 12px 16px calc(14px + env(safe-area-inset-bottom));
    background: color-mix(in srgb, var(--sh-card) 90%, transparent);
    backdrop-filter: blur(18px);
    border-top: 1px solid var(--sh-line);
  }
  .oa-bar .sh-btn-icon {
    width: 52px;
    min-height: 52px;
    border-radius: var(--sh-radius);
  }
  .oa-more {
    position: relative;
  }
  .oa-more summary {
    list-style: none;
  }
  .oa-more summary::-webkit-details-marker {
    display: none;
  }
  .oa-menu {
    position: absolute;
    inset-inline-end: 0;
    bottom: calc(100% + 8px);
    min-width: 220px;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    z-index: 50;
  }
  .oa-inline .oa-menu {
    bottom: auto;
    top: calc(100% + 8px);
  }
  .oa-item {
    min-height: 44px;
    padding: 0 12px;
    border: 0;
    border-radius: var(--sh-radius-sm);
    background: transparent;
    color: var(--sh-ink);
    text-align: start;
    font-size: 14px;
  }
  .oa-item:hover {
    background: var(--sh-card-2);
  }
  .oa-danger {
    color: var(--sh-accent-ink);
    font-weight: 700;
  }
  .oa-note {
    padding: 8px 12px;
    font-size: 13px;
    line-height: 1.5;
  }
  @media (min-width: 900px) {
    .oa-bar {
      position: static;
      padding: 0;
      background: transparent;
      backdrop-filter: none;
      border: 0;
    }
  }
</style>
