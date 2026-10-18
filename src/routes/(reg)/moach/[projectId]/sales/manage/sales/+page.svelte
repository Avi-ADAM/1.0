<script lang="ts">
  /**
   * The full sales table (canvas "DesktopSales", UX_COPY §6): product and
   * variant, source, who holds the money, where it stands with the split; a
   * date range, a total for it, and CSV. Reads the layout's streamed sales —
   * the KPI strip and this tab share one query.
   */
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { t, locale } from '$lib/translations';
  import { clock } from '$lib/stores/clock.svelte';
  import { useFormatMoney } from '$lib/money/context.svelte';
  import Spinner from '$lib/celim/Spinner.svelte';
  import {
    SALES_RANGES,
    filterSales,
    salesTotal,
    splitStateOf,
    toCsv,
    type SalesRange,
    type ShopOrder,
    type ShopSaleRow,
    type SourceFilter,
    type SplitState
  } from '$lib/shop/manage';
  import { downloadCsv } from '$lib/shop/download';
  import ShopNotice from '$lib/components/shop/ShopNotice.svelte';

  let { data } = $props();
  const fmtMoney = useFormatMoney();
  let base = $derived(`/moach/${page.params.projectId}/sales/manage`);

  let sales = $state<ShopSaleRow[] | null>(null);
  let failed = $state(false);
  $effect(() => {
    const p = data.sales;
    let live = true;
    Promise.resolve(p).then((r) => {
      if (!live) return;
      sales = r?.sales ?? [];
      failed = !!r?.failed;
    });
    return () => {
      live = false;
    };
  });

  /** An order's number by id — the sales row links its order. */
  let orderNumber = $derived(
    new Map<string, string>((data.shop?.orders ?? []).map((o: ShopOrder) => [o.id, o.number]))
  );

  const RANGE_KEY: Record<SalesRange, string> = { '7': 'd7', '30': 'd30', '90': 'd90', year: 'year', all: 'all' };
  const SOURCES: SourceFilter[] = ['all', 'api', 'ui'];
  const SPLIT_CHIP: Record<SplitState, string> = {
    waiting: 'sh-chip-gold',
    inSplit: 'sh-chip-info',
    claimOpen: 'sh-chip-accent',
    split: 'sh-chip-ok'
  };

  let range = $derived.by<SalesRange>(() => {
    const r = page.url.searchParams.get('r') as SalesRange | null;
    return r && SALES_RANGES.includes(r) ? r : '30';
  });
  let source = $derived.by<SourceFilter>(() => {
    const s = page.url.searchParams.get('s') as SourceFilter | null;
    return s && SOURCES.includes(s) ? s : 'all';
  });
  let query = $state('');
  let list = $derived(sales ? filterSales(sales, { range, source, query, now: clock.minutes }) : []);
  let total = $derived(salesTotal(list));

  function setParam(key: string, value: string) {
    const url = new URL(page.url);
    url.searchParams.set(key, value);
    goto(url, { replaceState: true, noScroll: true, keepFocus: true });
  }

  function day(at: string | null) {
    if (!at) return '';
    const d = new Date(at);
    return Number.isFinite(d.getTime())
      ? new Intl.DateTimeFormat($locale || 'he', { day: 'numeric', month: 'numeric', year: '2-digit' }).format(d)
      : '';
  }

  function exportCsv() {
    const head = [
      $t('shop.sales.col.date'),
      $t('shop.sales.col.product'),
      $t('shop.sales.col.amount'),
      $t('shop.sales.col.units'),
      $t('shop.sales.col.holder'),
      $t('shop.sales.col.source'),
      $t('shop.sales.col.split'),
      $t('shop.sales.col.order')
    ];
    const rows = list.map((s) => [
      s.date ? s.date.slice(0, 10) : '',
      [s.productName, s.variantLabel].filter(Boolean).join(' · '),
      s.amount,
      s.units ?? '',
      s.holderName ?? '',
      $t(`shop.sales.source.${s.source}`),
      $t(`shop.sales.split.${splitStateOf(s)}`),
      s.orderId ? (orderNumber.get(s.orderId) ?? s.orderId) : ''
    ]);
    const slug = (data.projectBase?.projectName ?? 'rikma').replace(/[^\p{L}\p{N}]+/gu, '-');
    downloadCsv(`${slug}-sales.csv`, toCsv([head, ...rows]));
  }
</script>

{#if sales === null}
  <div class="sa-loading"><Spinner /></div>
{:else if failed}
  <ShopNotice title={$t('shop.err.load')} action={{ label: $t('shop.err.refresh'), href: page.url.pathname }} />
{:else}
  <div class="sa-tools">
    <div class="sh-pills" role="group" aria-label={$t('shop.sales.rangeLabel')}>
      {#each SALES_RANGES as r (r)}
        <button type="button" class="sh-pill" aria-pressed={range === r} onclick={() => setParam('r', r)}>
          {$t(`shop.sales.range.${RANGE_KEY[r]}`)}
        </button>
      {/each}
    </div>
    <div class="sa-row">
      <label class="sh-search sa-search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        <span class="sr-only">{$t('shop.sales.searchLabel')}</span>
        <input type="search" bind:value={query} placeholder={$t('shop.sales.search')} />
      </label>
      <label class="sa-source">
        <span class="sr-only">{$t('shop.sales.sourceLabel')}</span>
        <select class="sh-input" value={source} onchange={(e) => setParam('s', e.currentTarget.value)}>
          {#each SOURCES as s (s)}
            <option value={s}>{$t(`shop.sales.source.${s}`)}</option>
          {/each}
        </select>
      </label>
      <button type="button" class="sh-btn sh-btn-outline" onclick={exportCsv} disabled={list.length === 0}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M5 21h14" /></svg>
        {$t('shop.sales.export')}
      </button>
    </div>
  </div>

  <div class="sa-sum sh-card-2">
    <strong class="sh-num"><bdi>{$t('shop.sales.total', { amount: fmtMoney(total) })}</bdi></strong>
    <span>{list.length === 1 ? $t('shop.sales.countOne') : $t('shop.sales.count', { count: list.length })}</span>
  </div>

  {#if list.length === 0}
    <ShopNotice title={$t('shop.empty.sales')} />
  {:else}
    <div class="sh-table-wrap">
      <table class="sh-table sa-table">
        <thead>
          <tr>
            <th scope="col">{$t('shop.sales.col.date')}</th>
            <th scope="col">{$t('shop.sales.col.product')}</th>
            <th scope="col">{$t('shop.sales.col.amount')}</th>
            <th scope="col" class="sa-wide">{$t('shop.sales.col.holder')}</th>
            <th scope="col" class="sa-wide">{$t('shop.sales.col.source')}</th>
            <th scope="col">{$t('shop.sales.col.split')}</th>
          </tr>
        </thead>
        <tbody>
          {#each list as s (s.id)}
            {@const split = splitStateOf(s)}
            <tr>
              <td class="sh-num sa-muted"><bdi>{day(s.date)}</bdi></td>
              <td>
                <span class="sa-product">{s.productName ?? '—'}</span>
                {#if s.variantLabel}<span class="sa-variant"> · {s.variantLabel}</span>{/if}
                {#if s.orderId && orderNumber.has(s.orderId)}
                  <a class="sa-order" href="{base}/orders/{s.orderId}">{$t('shop.order.number', { number: '' })}<bdi>{orderNumber.get(s.orderId)}</bdi></a>
                {/if}
              </td>
              <td class="sh-num sa-amount"><bdi>{fmtMoney(s.amount)}</bdi></td>
              <td class="sa-wide sa-muted">{s.holderName ?? ''}</td>
              <td class="sa-wide sa-muted">{$t(`shop.sales.source.${s.source}`)}</td>
              <td><span class="sh-chip {SPLIT_CHIP[split]}">{$t(`shop.sales.split.${split}`)}</span></td>
            </tr>
          {/each}
        </tbody>
      </table>
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
  .sa-loading {
    display: flex;
    justify-content: center;
    padding: 48px;
  }
  .sa-tools {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 12px;
  }
  .sa-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .sa-search {
    flex: 1 1 220px;
  }
  .sa-source select {
    min-width: 140px;
  }
  .sa-sum {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    padding: 12px 14px;
    margin-bottom: 12px;
    font-size: 14px;
    color: var(--sh-muted);
  }
  .sa-sum strong {
    color: var(--sh-gold);
    font-size: 16px;
  }
  .sa-product {
    font-weight: 600;
  }
  .sa-variant,
  .sa-muted {
    color: var(--sh-muted);
    font-size: 13px;
  }
  .sa-order {
    display: block;
    font-size: 12px;
    margin-top: 2px;
  }
  .sa-amount {
    font-weight: 600;
  }
  .sa-wide {
    display: none;
  }
  @media (min-width: 760px) {
    .sa-wide {
      display: table-cell;
    }
  }
  @media (min-width: 900px) {
    .sa-tools {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
    .sa-row {
      flex-wrap: nowrap;
    }
    .sa-search {
      flex: 0 1 300px;
    }
  }
</style>
