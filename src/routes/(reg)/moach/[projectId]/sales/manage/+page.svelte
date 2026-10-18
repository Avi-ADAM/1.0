<script lang="ts">
  /**
   * Orders — listed by what is left to do (UX_COPY_SHOP_SALES §3): "to ship"
   * first when anything is there. A phone gets cards with the one action on
   * each; a desktop gets the table with the chosen order beside it.
   */
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { t, locale } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { clock } from '$lib/stores/clock.svelte';
  import { formatWhen } from '$lib/time/formatWhen';
  import { useFormatMoney } from '$lib/money/context.svelte';
  import {
    ORDER_FILTERS,
    defaultOrderFilter,
    filterOrders,
    orderCounts,
    orderFilterOf,
    primaryActionOf,
    sortOrders,
    type OrderFilter,
    type ShopOrder
  } from '$lib/shop/manage';
  import { scheduleMark, shownStatus, isPending } from '$lib/shop/pendingMarks.svelte';
  import { TASK_CHIP, buyerName, deliveryText, itemsText, markMessages, shortTag, taskOfShown } from '$lib/shop/display';
  import OrderDetail from '$lib/components/shop/OrderDetail.svelte';
  import OrderActions from '$lib/components/shop/OrderActions.svelte';
  import ShopNotice from '$lib/components/shop/ShopNotice.svelte';

  let { data } = $props();
  const fmtMoney = useFormatMoney();

  let projectId = $derived(page.params.projectId ?? '');
  let base = $derived(`/moach/${projectId}/sales/manage`);
  let uid = $derived<string | null>(data.uid ?? null);
  let orders = $derived<ShopOrder[]>(data.shop?.orders ?? []);
  let shown = $derived(orders.map((o) => ({ ...o, status: shownStatus(o) })));
  let counts = $derived(orderCounts(shown));

  let query = $state('');
  let filter = $derived<OrderFilter>(orderFilterOf(page.url.searchParams.get('f')) ?? defaultOrderFilter(counts));
  let list = $derived(sortOrders(filterOrders(shown, filter, query), filter));
  let selectedId = $derived(page.url.searchParams.get('o'));
  let selected = $derived(
    shown.find((o) => o.id === selectedId) ?? list[0] ?? null
  );

  function setParam(key: string, value: string | null) {
    const url = new URL(page.url);
    if (value === null) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
    goto(url, { replaceState: true, noScroll: true, keepFocus: true });
  }

  function when(o: ShopOrder) {
    return formatWhen(o.paidAt ?? o.createdAt, clock.minutes, $locale || 'he');
  }

  function mark(o: ShopOrder) {
    const primary = primaryActionOf(o);
    if (primary) scheduleMark(o, primary, projectId, markMessages($t, o, primary.next), toast);
  }

  const COUNTED: OrderFilter[] = ['toShip', 'toHandOver'];
</script>

{#if !data.shop?.ready}
  <ShopNotice title={$t('shop.err.notReady')} body={$t('shop.err.notReadyBody')} />
{:else if data.shop?.failed}
  <ShopNotice title={$t('shop.err.load')} action={{ label: $t('shop.err.refresh'), href: page.url.pathname }} />
{:else if orders.length === 0}
  <ShopNotice
    title={$t('shop.empty.orders')}
    body={$t('shop.empty.ordersBody')}
    action={{ label: $t('shop.empty.ordersCta'), href: `${base}/connect` }}
  />
{:else}
  <div class="ol-tools">
    <div class="sh-pills" role="group" aria-label={$t('shop.orders.filterLabel')}>
      {#each ORDER_FILTERS as f (f)}
        <button type="button" class="sh-pill" aria-pressed={filter === f} onclick={() => setParam('f', f)}>
          {$t(`shop.orders.filter.${f}`)}
          {#if COUNTED.includes(f) && counts[f] > 0}<span class="sh-pill-count">{counts[f]}</span>{/if}
        </button>
      {/each}
    </div>
    <label class="sh-search ol-search">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
      <span class="sr-only">{$t('shop.orders.searchLabel')}</span>
      <input type="search" bind:value={query} placeholder={$t('shop.orders.search')} />
    </label>
  </div>

  {#if list.length === 0}
    {#if query}
      <ShopNotice title={$t('shop.empty.filtered')} action={{ label: $t('shop.empty.clearFilter'), onclick: () => (query = '') }} />
    {:else if filter === 'toShip' || filter === 'toHandOver'}
      <ShopNotice title={$t('shop.empty.toShip')} body={$t('shop.empty.toShipBody')} />
    {:else}
      <ShopNotice title={$t('shop.empty.filtered')} action={{ label: $t('shop.empty.clearFilter'), onclick: () => setParam('f', 'all') }} />
    {/if}
  {:else}
    <!-- phone: cards -->
    <ul class="ol-cards">
      {#each list as o (o.id)}
        {@const task = taskOfShown(o, o.status)}
        {@const primary = primaryActionOf(o)}
        <li class="ol-card">
          <a class="ol-card-top" href="{base}/orders/{o.id}">
            <span class="ol-card-title">
              {$t('shop.order.number', { number: '' })}<bdi>{o.number}</bdi> · {buyerName($t, o)}
            </span>
            <span class="ol-card-sum sh-num"><bdi>{fmtMoney(o.total, o.currency)}</bdi></span>
          </a>
          <div class="ol-card-tags">
            <span class="sh-chip {TASK_CHIP[task]}">{$t(`shop.status.${task}`)}</span>
            {#if o.shortUnits > 0}<span class="sh-chip sh-chip-warn">{shortTag($t, o.shortUnits)}</span>{/if}
            <time class="ol-when" datetime={when(o)?.iso} title={when(o)?.full}>{when(o)?.short}</time>
          </div>
          <div class="ol-card-foot">
            <span class="ol-card-meta">{itemsText($t, o)} · {deliveryText($t, o)}</span>
            {#if primary}
              <button type="button" class="sh-btn sh-btn-primary ol-quick" onclick={() => mark(o)} disabled={isPending(o.id)}>
                {$t(`shop.action.${primary.label}`)}
              </button>
            {/if}
          </div>
        </li>
      {/each}
    </ul>

    <!-- desktop: table + the chosen order -->
    <div class="ol-split">
      <div class="sh-table-wrap">
        <table class="sh-table">
          <thead>
            <tr>
              <th scope="col">{$t('shop.orders.col.order')}</th>
              <th scope="col">{$t('shop.orders.col.buyer')}</th>
              <th scope="col">{$t('shop.orders.col.when')}</th>
              <th scope="col">{$t('shop.orders.col.delivery')}</th>
              <th scope="col">{$t('shop.orders.col.total')}</th>
              <th scope="col">{$t('shop.orders.col.state')}</th>
              <th scope="col"><span class="sr-only">{$t('shop.orders.col.action')}</span></th>
            </tr>
          </thead>
          <tbody>
            {#each list as o (o.id)}
              {@const task = taskOfShown(o, o.status)}
              {@const primary = primaryActionOf(o)}
              <tr class="sh-row-link" aria-selected={selected?.id === o.id} onclick={() => setParam('o', o.id)}>
                <td>
                  <button type="button" class="ol-row-btn" onclick={(e) => { e.stopPropagation(); setParam('o', o.id); }}>
                    <bdi>{o.number}</bdi>
                  </button>
                  {#if o.source === 'api'}<span class="ol-src">{$t('shop.order.fromSite')}</span>{/if}
                </td>
                <td>{buyerName($t, o)}</td>
                <td class="ol-muted"><time datetime={when(o)?.iso} title={when(o)?.full}>{when(o)?.short}</time></td>
                <td class="ol-muted">{deliveryText($t, o)}</td>
                <td class="sh-num"><bdi>{fmtMoney(o.total, o.currency)}</bdi></td>
                <td>
                  <span class="ol-tags">
                    <span class="sh-chip {TASK_CHIP[task]}">{$t(`shop.status.${task}`)}</span>
                    {#if o.shortUnits > 0}<span class="sh-chip sh-chip-warn">{shortTag($t, o.shortUnits)}</span>{/if}
                  </span>
                </td>
                <td class="ol-act">
                  {#if primary}
                    <button type="button" class="sh-btn sh-btn-outline ol-quick" onclick={(e) => { e.stopPropagation(); mark(o); }} disabled={isPending(o.id)}>
                      {$t(`shop.action.${primary.label}`)}
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <aside class="ol-panel sh-card" aria-label={$t('shop.order.detailsLabel')}>
        {#if selected}
          {@const task = taskOfShown(selected, selected.status)}
          <div class="ol-panel-head">
            <h2 class="sh-title ol-panel-title">{$t('shop.order.number', { number: '' })}<bdi>{selected.number}</bdi></h2>
            <span class="sh-chip {TASK_CHIP[task]}">{$t(`shop.status.${task}`)}</span>
          </div>
          <OrderActions order={selected} {projectId} {uid} layout="inline" />
          <OrderDetail order={selected} {projectId} {uid} compact />
        {:else}
          <p class="ol-hint">{$t('shop.orders.selectHint')}</p>
        {/if}
      </aside>
    </div>
  {/if}
{/if}

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  .ol-tools {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 12px;
  }
  .ol-cards {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ol-card {
    background: var(--sh-card);
    border: 1px solid var(--sh-line);
    border-radius: var(--sh-radius);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ol-card-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    color: var(--sh-ink) !important;
  }
  .ol-card-title {
    font-size: 16px;
    font-weight: 700;
    min-width: 0;
  }
  .ol-card-sum {
    font-size: 16px;
    font-weight: 700;
    color: var(--sh-gold);
  }
  .ol-card-tags {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .ol-when,
  .ol-muted {
    font-size: 12px;
    color: var(--sh-muted);
  }
  .ol-muted {
    font-size: 13px;
  }
  .ol-card-foot {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ol-card-meta {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 13px;
    color: var(--sh-muted);
  }
  .ol-quick {
    min-height: 40px;
    padding: 0 14px;
  }
  .ol-split {
    display: none;
  }
  .ol-row-btn {
    border: 0;
    background: transparent;
    padding: 0;
    color: var(--sh-ink);
    font-weight: 700;
    font-size: 14px;
  }
  .ol-src {
    margin-inline-start: 6px;
    font-size: 11px;
    color: var(--sh-muted);
  }
  .ol-tags {
    display: inline-flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .ol-act {
    text-align: end;
  }
  .ol-panel {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    align-self: start;
    position: sticky;
    top: 16px;
    max-height: calc(100vh - 32px);
    overflow-y: auto;
  }
  .ol-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .ol-panel-title {
    font-size: 24px;
  }
  .ol-hint {
    font-size: 14px;
    text-align: center;
    padding: 40px 8px;
  }
  @media (min-width: 900px) {
    .ol-tools {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
    .ol-search {
      width: min(360px, 40%);
    }
    .ol-cards {
      display: none;
    }
    .ol-split {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 400px;
      gap: 16px;
      align-items: start;
    }
  }
</style>
