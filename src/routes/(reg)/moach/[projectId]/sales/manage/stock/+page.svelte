<script lang="ts">
  /**
   * Stock — one row per variant (or per product sold without variants),
   * "what needs me" first: short for paid orders, sold out, low (UX_COPY §5).
   * Tapping a row opens the update sheet for the whole product. Below, the
   * shelves of the rikma's resources (A3): what a sale takes, what a receipt adds.
   */
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { t } from '$lib/translations';
  import {
    filterStock,
    stockCounts,
    stockRowsOf,
    type ShopProductRow,
    type StockFilter,
    type StockRow
  } from '$lib/shop/manage';
  import { STOCK_CHIP, stockText } from '$lib/shop/display';
  import StockSheet from '$lib/components/shop/StockSheet.svelte';
  import ShopNotice from '$lib/components/shop/ShopNotice.svelte';
  import ResourceStock from '$lib/components/shop/ResourceStock.svelte';

  let { data } = $props();
  let projectId = $derived(page.params.projectId ?? '');
  let products = $derived<ShopProductRow[]>(data.catalog?.products ?? []);
  let rows = $derived(stockRowsOf(products));
  let counts = $derived(stockCounts(rows));

  const FILTERS: StockFilter[] = ['attention', 'short', 'out', 'low', 'all'];
  let query = $state('');
  let filter = $derived.by<StockFilter>(() => {
    const f = page.url.searchParams.get('f') as StockFilter | null;
    if (f && FILTERS.includes(f)) return f;
    return counts.attention > 0 ? 'attention' : 'all';
  });
  let list = $derived(filterStock(rows, filter, query));
  let anyThreshold = $derived(products.some((p) => p.lowStockAt !== null));

  function setFilter(f: StockFilter) {
    const url = new URL(page.url);
    url.searchParams.set('f', f);
    goto(url, { replaceState: true, noScroll: true, keepFocus: true });
  }

  let sheetOpen = $state(false);
  let sheetProduct = $state<{ id: string; name: string; rows: StockRow[] } | null>(null);
  function openSheet(r: StockRow) {
    sheetProduct = { id: r.productId, name: r.name, rows: rows.filter((x) => x.productId === r.productId) };
    sheetOpen = true;
  }
</script>

{#if data.catalog?.failed}
  <ShopNotice title={$t('shop.err.load')} action={{ label: $t('shop.err.refresh'), href: page.url.pathname }} />
{:else if rows.length === 0}
  <ShopNotice title={$t('shop.empty.products')} body={$t('shop.empty.productsBody')} />
{:else}
  <div class="st-tools">
    <div class="sh-pills" role="group" aria-label={$t('shop.stock.filterLabel')}>
      {#each FILTERS as f (f)}
        <button type="button" class="sh-pill" aria-pressed={filter === f} onclick={() => setFilter(f)}>
          {$t(`shop.stock.filter.${f}`)}
          {#if f !== 'all' && counts[f] > 0}<span class="sh-pill-count">{counts[f]}</span>{/if}
        </button>
      {/each}
    </div>
    <label class="sh-search st-search">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
      <span class="sr-only">{$t('shop.products.searchLabel')}</span>
      <input type="search" bind:value={query} placeholder={$t('shop.products.search')} />
    </label>
  </div>

  {#if filter === 'low' && !anyThreshold}
    <p class="st-hint">{$t('shop.stock.noThreshold')}</p>
  {/if}

  {#if list.length === 0}
    <ShopNotice title={$t('shop.empty.stock')} action={filter !== 'all' ? { label: $t('shop.empty.clearFilter'), onclick: () => setFilter('all') } : null} />
  {:else}
    <div class="sh-table-wrap st-wrap">
      <table class="sh-table st-table">
        <thead>
          <tr>
            <th scope="col">{$t('shop.stock.col.product')}</th>
            <th scope="col" class="st-wide">{$t('shop.stock.col.sku')}</th>
            <th scope="col">{$t('shop.stock.col.qty')}</th>
            <th scope="col" class="st-wide"><span class="sr-only">{$t('shop.stock.col.action')}</span></th>
          </tr>
        </thead>
        <tbody>
          {#each list as r (r.key)}
            <tr class="sh-row-link" onclick={() => openSheet(r)}>
              <td>
                <button type="button" class="st-name" onclick={(e) => { e.stopPropagation(); openSheet(r); }}>
                  {#if r.imageUrl}
                    <img src={r.imageUrl} alt="" width="40" height="40" loading="lazy" />
                  {:else}
                    <span class="st-img-empty" aria-hidden="true"></span>
                  {/if}
                  <span class="st-name-text">
                    <span class="st-product">{r.name}</span>
                    {#if r.label}<span class="st-variant">{r.label}</span>{/if}
                  </span>
                </button>
              </td>
              <td class="st-wide"><bdi class="st-sku">{r.sku ?? ''}</bdi></td>
              <td>
                <span class="sh-chip {STOCK_CHIP[r.state]}">{stockText($t, r.quant, r.state)}</span>
              </td>
              <td class="st-wide st-act">
                <span class="sh-btn sh-btn-outline st-btn" aria-hidden="true">{$t('shop.stock.adjust')}</span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
{/if}

<!-- The shelves of the rikma's resources (PLAN_SHOP_OPERATIONS A3) — absent until 1.0b deploys them. -->
{#if data.resources?.ready}
  <ResourceStock {projectId} uid={String(data.uid ?? '')} resources={data.resources.resources} {products} />
{/if}

{#if sheetProduct}
  <StockSheet bind:open={sheetOpen} productId={sheetProduct.id} productName={sheetProduct.name} rows={sheetProduct.rows} {projectId} />
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
  .st-tools {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 12px;
  }
  .st-hint {
    font-size: 13px;
    margin-bottom: 10px;
  }
  .st-wrap {
    border-radius: var(--sh-radius);
  }
  .st-name {
    display: flex;
    align-items: center;
    gap: 10px;
    border: 0;
    background: transparent;
    padding: 0;
    color: var(--sh-ink);
    text-align: start;
    min-height: 44px;
  }
  .st-name img,
  .st-img-empty {
    width: 40px;
    height: 40px;
    border-radius: var(--sh-radius-xs);
    object-fit: cover;
    border: 1px solid var(--sh-line);
    background: var(--sh-card-2);
    flex-shrink: 0;
  }
  .st-name-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .st-product {
    font-weight: 600;
    font-size: 14px;
  }
  .st-variant {
    font-size: 12px;
    color: var(--sh-muted);
  }
  .st-sku {
    font-family: var(--sh-mono);
    font-size: 12px;
    color: var(--sh-muted);
  }
  .st-act {
    text-align: end;
  }
  .st-btn {
    min-height: 36px;
    font-size: 13px;
  }
  .st-wide {
    display: none;
  }
  @media (min-width: 700px) {
    .st-wide {
      display: table-cell;
    }
  }
  @media (min-width: 900px) {
    .st-tools {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
    .st-search {
      width: min(360px, 40%);
    }
  }
</style>
