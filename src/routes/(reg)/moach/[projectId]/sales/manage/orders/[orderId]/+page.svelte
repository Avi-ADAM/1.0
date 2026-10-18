<script lang="ts">
  /**
   * One order on a phone (canvas "MobileOrder"): the details scroll, the one
   * action stays under the thumb. On a desktop the same order opens beside the
   * table instead — this page still works there, for a link someone shared.
   */
  import { page } from '$app/state';
  import { t, locale } from '$lib/translations';
  import { clock } from '$lib/stores/clock.svelte';
  import { formatWhen } from '$lib/time/formatWhen';
  import type { ShopOrder } from '$lib/shop/manage';
  import { shownStatus } from '$lib/shop/pendingMarks.svelte';
  import { TASK_CHIP, taskOfShown } from '$lib/shop/display';
  import OrderDetail from '$lib/components/shop/OrderDetail.svelte';
  import OrderActions from '$lib/components/shop/OrderActions.svelte';
  import ShopNotice from '$lib/components/shop/ShopNotice.svelte';

  let { data } = $props();
  let projectId = $derived(page.params.projectId ?? '');
  let base = $derived(`/moach/${projectId}/sales/manage`);
  let order = $derived<ShopOrder | undefined>((data.shop?.orders ?? []).find((o: ShopOrder) => o.id === page.params.orderId));
  let task = $derived(order ? taskOfShown(order, shownStatus(order)) : null);
  let when = $derived(order ? formatWhen(order.paidAt ?? order.createdAt, clock.minutes, $locale || 'he') : null);
</script>

<svelte:head>
  {#if order}<title>{$t('shop.order.number', { number: order.number })} · 1lev1</title>{/if}
</svelte:head>

{#if !order}
  <ShopNotice title={$t('shop.order.notFound')} action={{ label: $t('shop.order.back'), href: base }} />
{:else}
  <div class="op">
    <div class="op-head">
      <a class="sh-btn sh-btn-quiet sh-btn-icon" href={base} aria-label={$t('shop.order.back')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="op-flip"><path d="M9 18l6-6-6-6" /></svg>
      </a>
      <div class="op-head-text">
        <h2 class="sh-title op-title">{$t('shop.order.number', { number: '' })}<bdi>{order.number}</bdi></h2>
        <div class="op-sub">
          {#if task}<span class="sh-chip {TASK_CHIP[task]}">{$t(`shop.status.${task}`)}</span>{/if}
          <span>{order.source === 'api' ? $t('shop.order.fromSite') : $t('shop.order.manual')}{#if when} · <time datetime={when.iso} title={when.full}>{when.short}</time>{/if}</span>
        </div>
      </div>
    </div>
    <OrderDetail {order} {projectId} uid={data.uid ?? null} />
  </div>
  <OrderActions {order} {projectId} uid={data.uid ?? null} layout="bar" />
{/if}

<style>
  .op {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 760px;
    padding-bottom: 24px;
  }
  .op-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .op-head-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .op-title {
    font-size: 24px;
  }
  .op-sub {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--sh-muted);
  }
  :global([dir='ltr']) .op-flip {
    transform: scaleX(-1);
  }
</style>
