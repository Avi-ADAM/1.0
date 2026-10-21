<script lang="ts">
  /**
   * Products (canvas "MobileProducts"): picture · name · price · stock, and a
   * tap opens the stock sheet. Export in Shopify's CSV format — the one every
   * sales system reads, so moving in or out never means typing it all again
   * (PLAN §7.3).
   */
  import { page } from '$app/state';
  import { t } from '$lib/translations';
  import { useFormatMoney } from '$lib/money/context.svelte';
  import {
    matchesProduct,
    priceRangeOfRow,
    shopifyCsvRows,
    stockRowsOf,
    stockStateOf,
    stockTotalOfRow,
    toCsv,
    type ShopProductRow,
    type StockRow
  } from '$lib/shop/manage';
  import { STOCK_CHIP, shortTag, stockText } from '$lib/shop/display';
  import { downloadCsv } from '$lib/shop/download';
  import StockSheet from '$lib/components/shop/StockSheet.svelte';
  import ShopNotice from '$lib/components/shop/ShopNotice.svelte';

  let { data } = $props();
  const fmtMoney = useFormatMoney();
  let projectId = $derived(page.params.projectId ?? '');
  // One "new product" form for the whole rikma (simple or complex); saving it
  // opens this tab's editor, where variants, pictures and stock are added.
  let newHref = $derived(`/moach/${projectId}/sales/new?from=manage`);
  let products = $derived<(ShopProductRow & { options: { name: string; values: string[] }[] })[]>(
    (data.catalog?.products ?? []).filter((p: ShopProductRow) => p.status !== 'archived')
  );
  let query = $state('');
  let list = $derived(products.filter((p) => matchesProduct(p, query)));
  let rows = $derived(stockRowsOf(products));

  function priceText(p: ShopProductRow): string {
    if (p.pricingMode && p.pricingMode !== 'fixed' && p.price === null) return $t('shop.products.priceQuote');
    const r = priceRangeOfRow(p);
    if (!r) return '—';
    return r.min === r.max ? fmtMoney(r.min) : $t('shop.products.priceFrom', { price: fmtMoney(r.min) });
  }

  function variantsText(p: ShopProductRow): string {
    const n = p.variants.filter((v) => v.active).length;
    if (!n) return $t('shop.products.noVariants');
    return n === 1 ? $t('shop.products.variantsOne') : $t('shop.products.variants', { count: n });
  }

  /** The product's own stock line — the worst of its variants decides the colour. */
  function stockOf(p: ShopProductRow) {
    const mine = rows.filter((r) => r.productId === p.id);
    const rank = { short: 0, out: 1, low: 2, ok: 3, unlimited: 4 } as const;
    const worst = mine.reduce<StockRow | null>((w, r) => (!w || rank[r.state] < rank[w.state] ? r : w), null);
    const total = stockTotalOfRow(p);
    if (worst?.state === 'short') {
      // The short tag, not the stock tab's sentence: it has to fit a phone row.
      return { cls: STOCK_CHIP.short, text: shortTag($t, Math.abs(worst.quant ?? 0)) };
    }
    if (worst?.state === 'low') {
      return { cls: STOCK_CHIP[worst.state], text: stockText($t, worst.quant, worst.state) };
    }
    const state = stockStateOf(total, p.lowStockAt);
    return { cls: STOCK_CHIP[state], text: stockText($t, total, state) };
  }

  let sheetOpen = $state(false);
  let sheet = $state<{ id: string; name: string; rows: StockRow[] } | null>(null);
  function open(p: ShopProductRow) {
    sheet = { id: p.id, name: p.name, rows: rows.filter((r) => r.productId === p.id) };
    sheetOpen = true;
  }

  function exportCsv() {
    const slug = (data.projectBase?.projectName ?? 'rikma').replace(/[^\p{L}\p{N}]+/gu, '-');
    downloadCsv(`${slug}-products.csv`, toCsv(shopifyCsvRows(products)));
  }
</script>

{#if data.catalog?.failed}
  <ShopNotice title={$t('shop.err.load')} action={{ label: $t('shop.err.refresh'), href: page.url.pathname }} />
{:else if products.length === 0}
  <ShopNotice
    title={$t('shop.empty.products')}
    body={$t('shop.empty.productsBody')}
    action={{ label: $t('shop.products.new'), href: newHref }}
  />
{:else}
  <div class="pr-tools">
    <a class="sh-btn sh-btn-primary" href={newHref}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      {$t('shop.products.new')}
    </a>
    <label class="sh-search pr-search">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
      <span class="sr-only">{$t('shop.products.searchLabel')}</span>
      <input type="search" bind:value={query} placeholder={$t('shop.products.search')} />
    </label>
    <button type="button" class="sh-btn sh-btn-outline" onclick={exportCsv} title={$t('shop.products.exportHint')}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M5 21h14" /></svg>
      {$t('shop.products.export')}
    </button>
  </div>

  {#if list.length === 0}
    <ShopNotice title={$t('shop.empty.filtered')} action={{ label: $t('shop.empty.clearFilter'), onclick: () => (query = '') }} />
  {:else}
    <div class="sh-table-wrap">
      <table class="sh-table">
        <thead>
          <tr>
            <th scope="col">{$t('shop.products.col.product')}</th>
            <th scope="col" class="pr-wide">{$t('shop.products.col.variants')}</th>
            <th scope="col" class="pr-wide">{$t('shop.products.col.price')}</th>
            <th scope="col" class="pr-wide">{$t('shop.products.col.stock')}</th>
            <th scope="col" class="pr-narrow-cell">{$t('shop.products.col.price')}</th>
          </tr>
        </thead>
        <tbody>
          {#each list as p (p.id)}
            {@const s = stockOf(p)}
            <tr class="sh-row-link" onclick={() => open(p)}>
              <td>
                <button type="button" class="pr-name" onclick={(e) => { e.stopPropagation(); open(p); }}>
                  {#if p.imageUrl}
                    <img src={p.imageUrl} alt="" width="48" height="48" loading="lazy" />
                  {:else}
                    <span class="pr-img-empty" aria-hidden="true"></span>
                  {/if}
                  <span class="pr-name-text">
                    <span class="pr-title">{p.name}</span>
                    <span class="pr-meta">
                      <span class="pr-narrow">{variantsText(p)}</span>
                      {#if p.status === 'draft'}<span class="sh-chip sh-chip-gold">{$t('shop.products.draft')}</span>{/if}
                    </span>
                  </span>
                </button>
                <a
                  class="pr-edit"
                  href="/moach/{projectId}/sales/manage/products/{p.id}"
                  onclick={(e) => e.stopPropagation()}
                >{$t('shopEditor.edit')}</a>
              </td>
              <td class="pr-wide pr-muted">{variantsText(p)}</td>
              <td class="sh-num pr-price pr-wide"><bdi>{priceText(p)}</bdi></td>
              <td class="pr-wide"><span class="sh-chip {s.cls}">{s.text}</span></td>
              <td class="pr-narrow-cell">
                <span class="pr-stack">
                  <span class="sh-num pr-price"><bdi>{priceText(p)}</bdi></span>
                  <span class="sh-chip {s.cls}">{s.text}</span>
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
{/if}

{#if sheet}
  <StockSheet bind:open={sheetOpen} productId={sheet.id} productName={sheet.name} rows={sheet.rows} {projectId} />
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
  .pr-tools {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  .pr-search {
    flex: 1 1 auto;
  }
  .pr-name {
    display: flex;
    align-items: center;
    gap: 12px;
    border: 0;
    background: transparent;
    padding: 0;
    color: var(--sh-ink);
    text-align: start;
    min-height: 52px;
  }
  .pr-name img,
  .pr-img-empty {
    width: 48px;
    height: 48px;
    border-radius: var(--sh-radius-sm);
    object-fit: cover;
    border: 1px solid var(--sh-line);
    background: var(--sh-card-2);
    flex-shrink: 0;
  }
  .pr-edit {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    margin-inline-start: 60px;
    font-size: 13px;
    font-weight: 600;
    color: var(--sh-gold);
  }
  .pr-name-text {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .pr-title {
    font-size: 15px;
    font-weight: 600;
  }
  .pr-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    font-size: 12px;
    color: var(--sh-muted);
  }
  .pr-muted {
    font-size: 13px;
    color: var(--sh-muted);
  }
  .pr-price {
    font-weight: 600;
  }
  .pr-wide {
    display: none;
  }
  .pr-stack {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }
  .pr-narrow-cell {
    text-align: end;
  }
  @media (min-width: 700px) {
    .pr-wide {
      display: table-cell;
    }
    .pr-narrow,
    .pr-narrow-cell {
      display: none;
    }
  }
  @media (min-width: 900px) {
    .pr-tools {
      justify-content: space-between;
    }
    .pr-search {
      flex: 0 1 360px;
    }
  }
</style>
