<script lang="ts">
  /**
   * Update stock — one product, all its variants at once (canvas
   * "MobileProducts" sheet, UX_COPY_SHOP_SALES §5). Two questions people
   * actually ask: "I counted the shelf" (in stock now) and "a delivery came
   * in" (add). Big steppers for a thumb; "unlimited" is a switch, never `-1`.
   *
   * Stock is operational — it saves at once (`setShopStock`). A price is a
   * term of the product and goes through the rikma's approval, so this sheet
   * shows the price and says where it is changed, without an input for it.
   */
  import { t } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { invalidate } from '$app/navigation';
  import { executeAction } from '$lib/client/actionClient';
  import { nextStock, stockWouldChange, type StockMode, type StockRow } from '$lib/shop/manage';
  import type { StockWrite } from '$lib/shop/stock';
  import { shopOrdersKey, shopProductsKey } from '$lib/shop/keys';
  import ShopSheet from './ShopSheet.svelte';

  let {
    open = $bindable(false),
    productName,
    productId,
    rows,
    projectId
  }: { open?: boolean; productName: string; productId: string; rows: StockRow[]; projectId: string } = $props();

  type Draft = { value: number; unlimited: boolean; error: boolean };
  let mode = $state<StockMode>('set');
  let drafts = $state<Record<string, Draft>>({});
  let busy = $state(false);

  function reset() {
    const d: Record<string, Draft> = {};
    for (const r of rows) {
      // `null` is unlimited; any number — `-1` included — is a count.
      const unlimited = r.quant === null;
      // The current count as it is — below zero is the production queue, and an
      // untouched row must read as unchanged, so it is not clamped here.
      d[r.key] = { value: mode === 'set' && !unlimited ? (r.quant ?? 0) : 0, unlimited, error: false };
    }
    drafts = d;
  }

  $effect(() => {
    if (open) {
      mode = 'set';
      reset();
    }
  });

  function setMode(m: StockMode) {
    mode = m;
    reset();
  }

  function after(r: StockRow): StockWrite | null {
    const d = drafts[r.key];
    if (!d) return null;
    return nextStock(r.quant, mode, Number(d.value), d.unlimited);
  }

  function changed(r: StockRow): boolean {
    const n = after(r);
    return n !== null && stockWouldChange(r.quant, n);
  }

  let dirty = $derived(rows.filter(changed));

  function step(r: StockRow, by: number) {
    const d = drafts[r.key];
    if (!d || d.unlimited) return;
    d.value = Math.max(0, Math.round(Math.max(0, Number(d.value) || 0) + by));
  }

  async function save() {
    busy = true;
    let failed = 0;
    for (const r of dirty) {
      const d = drafts[r.key];
      const res: any = await executeAction(
        'setShopStock' as any,
        {
          projectId,
          productId: r.productId,
          variantId: r.variantId ?? undefined,
          mode: d.unlimited ? 'set' : mode,
          value: Number(d.value),
          unlimited: d.unlimited
        },
        { showErrorToast: false }
      ).catch(() => null);
      d.error = !res?.success;
      if (d.error) failed++;
    }
    busy = false;
    invalidate(shopProductsKey(projectId));
    invalidate(shopOrdersKey(projectId));
    if (failed) {
      toast.error($t('shop.stock.failed'));
    } else {
      toast.success($t('shop.stock.saved'));
      open = false;
    }
  }
</script>

<ShopSheet bind:open label={$t('shop.stock.adjust')}>
  <div class="ss">
    <div class="ss-head">
      <h2 class="sh-title ss-title">{productName}</h2>
      <a class="ss-view" href="/gift/{productId}">{$t('shop.products.view')}</a>
    </div>

    <div class="sh-seg" role="group" aria-label={$t('shop.stock.modeLabel')}>
      <button type="button" aria-pressed={mode === 'set'} onclick={() => setMode('set')}>{$t('shop.stock.set')}</button>
      <button type="button" aria-pressed={mode === 'add'} onclick={() => setMode('add')}>{$t('shop.stock.add')}</button>
    </div>
    <p class="ss-hint">{mode === 'set' ? $t('shop.stock.setHint') : $t('shop.stock.addHint')}</p>

    <ul class="ss-rows">
      {#each rows as r (r.key)}
        {@const d = drafts[r.key]}
        {@const next = after(r)}
        {#if d}
          <li class="ss-row" class:ss-row-err={d.error}>
            <div class="ss-row-text">
              <span class="ss-label">{r.label ?? productName}</span>
              <span class="ss-now">
                {r.quant === null ? $t('shop.stock.nowUnlimited') : $t('shop.stock.now', { count: r.quant })}
                {#if r.sku} · <bdi class="ss-mono">{r.sku}</bdi>{/if}
              </span>
              {#if changed(r) && next !== null && !next.unlimited}
                <span class="ss-after">{$t('shop.stock.after', { count: next.quant })}</span>
              {/if}
            </div>
            <div class="ss-ctrl">
              {#if !d.unlimited}
                <div class="ss-stepper">
                  <button type="button" aria-label={$t('shop.stock.decrease')} onclick={() => step(r, -1)}>−</button>
                  <input
                    type="number"
                    inputmode="numeric"
                    min="0"
                    step="1"
                    aria-label="{$t('shop.stock.amount')} · {r.label ?? productName}"
                    bind:value={d.value}
                  />
                  <button type="button" aria-label={$t('shop.stock.increase')} onclick={() => step(r, 1)}>+</button>
                </div>
              {/if}
              {#if mode === 'set'}
                <label class="ss-unl">
                  <input type="checkbox" bind:checked={d.unlimited} />
                  {$t('shop.stock.unlimited')}
                </label>
              {/if}
            </div>
          </li>
        {/if}
      {/each}
    </ul>

    <p class="ss-note">{$t('shop.stock.priceNote')}</p>

    <button type="button" class="sh-btn sh-btn-primary sh-btn-lg" onclick={save} disabled={busy || dirty.length === 0}>
      {$t('shop.stock.save')}
    </button>
  </div>
</ShopSheet>

<style>
  .ss {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .ss-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    padding-inline-end: 44px;
  }
  .ss-title {
    font-size: 22px;
  }
  .ss-view {
    font-size: 13px;
    white-space: nowrap;
  }
  .ss-hint {
    font-size: 13px;
  }
  .ss-rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ss-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-radius: var(--sh-radius-sm);
    background: var(--sh-card-2);
    border: 1px solid var(--sh-line);
    flex-wrap: wrap;
  }
  .ss-row-err {
    border-color: var(--sh-accent-ink);
  }
  .ss-row-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .ss-label {
    font-size: 15px;
    font-weight: 600;
  }
  .ss-now,
  .ss-after {
    font-size: 12px;
    color: var(--sh-muted);
  }
  .ss-after {
    color: var(--sh-gold);
    font-weight: 700;
  }
  .ss-mono {
    font-family: var(--sh-mono);
  }
  .ss-ctrl {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ss-stepper {
    display: flex;
    align-items: center;
    height: 44px;
    border-radius: var(--sh-radius-xs);
    background: var(--sh-card);
    border: 1px solid var(--sh-line);
  }
  .ss-stepper button {
    width: 44px;
    height: 44px;
    border: 0;
    background: transparent;
    color: var(--sh-gold);
    font-size: 22px;
    line-height: 1;
  }
  .ss-stepper input {
    width: 56px;
    height: 40px;
    border: 0;
    background: transparent;
    color: var(--sh-ink);
    text-align: center;
    font-size: 16px;
    font-weight: 700;
    -moz-appearance: textfield;
    appearance: textfield;
  }
  .ss-stepper input::-webkit-outer-spin-button,
  .ss-stepper input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .ss-unl {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    font-size: 13px;
    color: var(--sh-muted);
  }
  .ss-unl input {
    width: 18px;
    height: 18px;
    accent-color: var(--sh-accent);
  }
  .ss-note {
    font-size: 12px;
    text-align: center;
  }
</style>
