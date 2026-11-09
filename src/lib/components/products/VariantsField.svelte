<script lang="ts">
  /**
   * Options (size, colour…) and the variant table they produce. Every decision
   * is made in `$lib/shop/variantEditor` — the same functions
   * `saveProductVariants` decides with — so what this field calls "goes to the
   * rikma" is exactly what the server sends there.
   */
  import { t } from '$lib/translations';
  import {
    buildMatrix,
    MAX_AXES,
    slugOf,
    type AxisError,
    type EditorAxis,
    type EditorVariant,
    type SavePlan,
    type VariantError,
    type VariantIssue,
    type VariantTerm
  } from '$lib/shop/variantEditor';
  import type { EditorPicture, EditorRow } from '$lib/shop/productEditor';
  import ShopSheet from '$lib/components/shop/ShopSheet.svelte';

  let {
    axes = $bindable([]),
    rows = $bindable([]),
    gallery,
    productId,
    productPrice,
    sovereign,
    rikmaAxes,
    clean,
    issues,
    plan,
    waiting = null,
    money
  }: {
    axes?: EditorAxis[];
    rows?: EditorRow[];
    gallery: EditorPicture[];
    /** null while the product does not exist yet. */
    productId: string | null;
    productPrice: number | null;
    sovereign: boolean;
    rikmaAxes: EditorAxis[];
    clean: { axes: EditorAxis[]; errors: AxisError[] };
    issues: VariantIssue[];
    plan: SavePlan;
    waiting?: { prices: Map<string, number | null>; creates: Extract<VariantTerm, { kind: 'create' }>[] } | null;
    money: (n: number | null) => string;
  } = $props();

  const copy = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
  const priceOf = (s: string): number | null => (s.trim() === '' ? null : Number(s.replace(',', '.')));

  let newValues = $state<Record<number, string>>({});
  let matrix = $derived(buildMatrix({ axes: clean.axes, existing: rows as EditorVariant[], productId }));
  let matrixDiffers = $derived(matrix.added > 0 || matrix.retired > 0);
  let issueOf = $derived(new Map(issues.filter((i) => i.index >= 0).map((i) => [i.index, i.code])));
  let pendingPrice = $derived(new Map(plan.terms.filter((x) => x.kind === 'price').map((x) => [x.id, x.to])));
  let unusedRikmaAxes = $derived(rikmaAxes.filter((r) => !axes.some((a) => slugOf(a.key || a.name) === r.key)));

  function addAxis() {
    if (axes.length >= MAX_AXES) return;
    axes.push({ optionId: null, key: '', name: '', values: [] });
  }

  function reuseAxis(e: Event) {
    const select = e.currentTarget as HTMLSelectElement;
    const found = rikmaAxes.find((a) => a.key === select.value);
    select.value = '';
    if (!found || axes.length >= MAX_AXES || axes.some((a) => slugOf(a.key || a.name) === found.key)) return;
    axes.push(copy(found));
  }

  function addValue(i: number) {
    const label = (newValues[i] ?? '').trim();
    if (!label) return;
    const value = slugOf(label);
    if (value && !axes[i].values.some((v) => v.value === value)) axes[i].values.push({ value, label, hex: null });
    newValues[i] = '';
  }

  function generate() {
    rows = matrix.variants.map((v) => ({ ...v, pictures: (v as EditorRow).pictures ?? [] }));
  }

  let samePrice = $state(false);
  let bulkPrice = $state('');
  function applyBulk() {
    const p = priceOf(bulkPrice);
    for (const r of rows) if (r.active) r.price = p;
  }

  let pickFor = $state<number | null>(null);
  let pickOpen = $state(false);
  function openPick(i: number) {
    pickFor = i;
    pickOpen = true;
  }
  function togglePic(id: string) {
    if (pickFor === null) return;
    const r = rows[pickFor];
    r.picIds = r.picIds.includes(id) ? r.picIds.filter((x) => x !== id) : [...r.picIds, id];
  }

  const ERR: Record<VariantError, string> = {
    skuMissing: 'shopEditor.err.skuMissing',
    skuDuplicate: 'shopEditor.err.skuDuplicate',
    skuTaken: 'shopEditor.err.skuTaken',
    variantDuplicate: 'shopEditor.err.variantDuplicate',
    priceInvalid: 'shopEditor.err.priceInvalid',
    stockInvalid: 'shopEditor.err.stockInvalid',
    tooManyVariants: 'shopEditor.err.tooManyVariants'
  };
</script>

<div class="vf">
  <section class="vf-block" aria-labelledby="vf-options">
    <h3 id="vf-options" class="vf-h">{$t('shopEditor.options.title')}</h3>
    <p class="vf-muted">{$t('shopEditor.options.hint')}</p>

    {#each axes as axis, i (i)}
      <div class="vf-axis">
        <label class="vf-axis-name">
          <span class="sr-only">{$t('shopEditor.options.name')}</span>
          <input class="sh-input" bind:value={axis.name} placeholder={$t('shopEditor.options.namePlaceholder')} />
        </label>
        <div class="vf-values">
          {#each axis.values as v, j (v.value)}
            <span class="vf-value">
              {v.label}
              <button type="button" class="vf-value-x" onclick={() => axis.values.splice(j, 1)} aria-label={$t('shopEditor.options.removeValue', { value: v.label })}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </span>
          {/each}
          <form class="vf-value-add" onsubmit={(e) => { e.preventDefault(); addValue(i); }}>
            <input class="sh-input vf-value-input" bind:value={newValues[i]} placeholder={$t('shopEditor.options.valuePlaceholder')} aria-label={$t('shopEditor.options.valueLabel', { name: axis.name || '…' })} />
            <button type="submit" class="sh-btn sh-btn-outline vf-small">{$t('shopEditor.options.addValue')}</button>
          </form>
        </div>
        <button type="button" class="sh-btn sh-btn-quiet sh-btn-icon" onclick={() => axes.splice(i, 1)} aria-label={$t('shopEditor.options.remove')} title={$t('shopEditor.options.remove')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
        </button>
      </div>
    {/each}

    {#if clean.errors.length}
      <ul class="vf-errors">
        {#each clean.errors as code (code)}<li>{$t(`shopEditor.options.err.${code}`)}</li>{/each}
      </ul>
    {/if}

    <div class="vf-actions">
      {#if axes.length < MAX_AXES}
        <button type="button" class="sh-btn sh-btn-outline" onclick={addAxis}>{$t('shopEditor.options.add')}</button>
        {#if unusedRikmaAxes.length}
          <label class="vf-reuse">
            <span>{$t('shopEditor.options.reuse')}</span>
            <select class="sh-input" onchange={reuseAxis}>
              <option value="">{$t('shopEditor.options.reusePick')}</option>
              {#each unusedRikmaAxes as a (a.key)}<option value={a.key}>{a.name}</option>{/each}
            </select>
          </label>
        {/if}
      {:else}
        <span class="vf-muted">{$t('shopEditor.options.max')}</span>
      {/if}
      {#if matrixDiffers && !clean.errors.length}
        <button type="button" class="sh-btn sh-btn-primary" onclick={generate}>
          {#if matrix.added === 1}{$t('shopEditor.options.generateOne')}
          {:else if matrix.added > 1}{$t('shopEditor.options.generate', { count: matrix.added })}
          {:else}{$t('shopEditor.options.refresh')}{/if}
        </button>
      {/if}
    </div>
    {#if matrixDiffers && matrix.retired}
      <p class="vf-muted">{matrix.retired === 1 ? $t('shopEditor.options.retiredOne') : $t('shopEditor.options.retired', { count: matrix.retired })}</p>
    {/if}
  </section>

  <section class="vf-block" aria-labelledby="vf-variants">
    <div class="vf-head">
      <h3 id="vf-variants" class="vf-h">{$t('shopEditor.variants.title')} <span class="vf-count">· {rows.length}</span></h3>
      {#if rows.length > 1}
        <label class="vf-check"><input type="checkbox" bind:checked={samePrice} /> {$t('shopEditor.variants.samePrice')}</label>
      {/if}
    </div>
    {#if samePrice}
      <div class="vf-bulk">
        <label class="vf-money">
          <span class="sr-only">{$t('shopEditor.variants.samePriceLabel')}</span>
          <input class="sh-input" inputmode="decimal" bind:value={bulkPrice} placeholder={$t('shopEditor.variants.pricePlaceholder')} />
        </label>
        <button type="button" class="sh-btn sh-btn-outline" onclick={applyBulk}>{$t('shopEditor.variants.applyAll')}</button>
      </div>
    {/if}

    {#if !rows.length}
      <p class="vf-muted">{$t('shopEditor.variants.empty')}</p>
    {:else}
      <div class="sh-table-wrap">
        <table class="sh-table vf-table">
          <thead>
            <tr>
              <th scope="col">{$t('shopEditor.variants.col.variant')}</th>
              <th scope="col">{$t('shopEditor.variants.col.price')}</th>
              <th scope="col">{$t('shopEditor.variants.col.stock')}</th>
              <th scope="col">{$t('shopEditor.variants.col.sku')}</th>
              <th scope="col">{$t('shopEditor.variants.col.pictures')}</th>
              <th scope="col">{$t('shopEditor.variants.col.shown')}</th>
            </tr>
          </thead>
          <tbody>
            {#each rows as r, i (r.axisKey || r.id || i)}
              {@const err = issueOf.get(i)}
              {@const waitingPrice = r.id ? waiting?.prices.get(r.id) : undefined}
              <tr class:vf-off={!r.active}>
                <td class="vf-combo">
                  {r.name}
                  {#if !r.id && !sovereign}<span class="vf-note vf-note-gold">{$t('shopEditor.variants.willPropose')}</span>{/if}
                  {#if err}<span class="vf-note vf-note-err">{$t(ERR[err])}</span>{/if}
                </td>
                <td>
                  <label class="vf-money" class:vf-money-pending={(r.id && pendingPrice.has(r.id)) || waitingPrice !== undefined}>
                    <span class="sr-only">{$t('shopEditor.variants.priceLabel', { name: r.name })}</span>
                    <input
                      class="sh-input"
                      inputmode="decimal"
                      value={r.price ?? ''}
                      placeholder={productPrice === null ? $t('shopEditor.variants.pricePlaceholder') : String(productPrice)}
                      oninput={(e) => (r.price = priceOf(e.currentTarget.value))}
                    />
                  </label>
                  {#if waitingPrice !== undefined}
                    <span class="vf-note vf-note-gold">{$t('shopEditor.variants.pendingPrice', { price: money(r.price ?? productPrice) })}</span>
                  {:else if r.id && pendingPrice.has(r.id)}
                    <span class="vf-note vf-note-gold">{$t('shopEditor.variants.willPropose')}</span>
                  {/if}
                </td>
                <td>
                  <div class="vf-stock">
                    {#if !r.unlimited}
                      <input
                        class="sh-input vf-qty"
                        inputmode="numeric"
                        value={r.quant}
                        aria-label={$t('shopEditor.variants.stockLabel', { name: r.name })}
                        oninput={(e) => (r.quant = Number(e.currentTarget.value || 0))}
                      />
                    {/if}
                    <label class="vf-check vf-tight">
                      <input type="checkbox" bind:checked={r.unlimited} aria-label={$t('shopEditor.variants.unlimitedLabel', { name: r.name })} />
                      {$t('shopEditor.variants.unlimited')}
                    </label>
                  </div>
                  {#if !r.unlimited && r.quant < 0}
                    <span class="vf-note vf-note-warn">{$t('shopEditor.variants.queue', { count: -r.quant })}</span>
                  {/if}
                </td>
                <td>
                  <input class="sh-input vf-sku" bind:value={r.sku} aria-label={$t('shopEditor.variants.skuLabel', { name: r.name })} dir="ltr" />
                </td>
                <td>
                  <button type="button" class="vf-link" onclick={() => openPick(i)}>
                    {r.picIds.length ? $t('shopEditor.variants.picturesOwn', { count: r.picIds.length }) : $t('shopEditor.variants.picturesProduct')}
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    role="switch"
                    class="vf-switch"
                    aria-checked={r.active}
                    aria-label={$t('shopEditor.variants.shownLabel', { name: r.name })}
                    onclick={() => (r.active = !r.active)}
                  ><span></span></button>
                </td>
              </tr>
            {/each}
            {#each waiting?.creates ?? [] as c (c.axisKey)}
              <tr class="vf-waiting-row">
                <td class="vf-combo">{c.name}<span class="vf-note vf-note-gold">{$t('shopEditor.variants.newPending')}</span></td>
                <td class="sh-num"><bdi>{money(c.price ?? productPrice)}</bdi></td>
                <td>{c.unlimited ? $t('shopEditor.variants.unlimited') : c.quant}</td>
                <td><bdi class="vf-mono">{c.sku}</bdi></td>
                <td></td>
                <td></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="vf-muted">{$t('shopEditor.variants.keepNote')}</p>
    {/if}
  </section>
</div>

<ShopSheet bind:open={pickOpen} label={pickFor !== null && rows[pickFor] ? $t('shopEditor.variants.pickPictures', { name: rows[pickFor].name }) : ''}>
  {#if pickFor !== null && rows[pickFor]}
    {@const r = rows[pickFor]}
    <div class="vf-pick">
      <h2 class="sh-title vf-h">{$t('shopEditor.variants.pickPictures', { name: r.name })}</h2>
      {#if !gallery.length}
        <p class="vf-muted">{$t('shopEditor.variants.noGallery')}</p>
      {:else}
        <p class="vf-muted">{$t('shopEditor.variants.pickHint')}</p>
        <ul class="vf-pick-grid">
          {#each gallery as pic (pic.id)}
            <li>
              <button type="button" class="vf-pick-pic" aria-pressed={r.picIds.includes(pic.id)} onclick={() => togglePic(pic.id)}>
                <img src={pic.thumb} alt={pic.alt ?? ''} loading="lazy" />
              </button>
            </li>
          {/each}
        </ul>
      {/if}
      <button type="button" class="sh-btn sh-btn-primary" onclick={() => (pickOpen = false)}>{$t('shopEditor.variants.done')}</button>
    </div>
  {/if}
</ShopSheet>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  .vf,
  .vf-block {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .vf {
    gap: 20px;
  }
  .vf-h {
    margin: 0;
    flex: 1 1 auto;
    font-size: 16px;
    font-weight: 700;
    color: var(--sh-ink);
  }
  .vf-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px 12px;
  }
  .vf-count {
    font-weight: 400;
    color: var(--sh-muted);
  }
  .vf-muted {
    margin: 0;
    font-size: 13px;
    color: var(--sh-muted);
  }
  .vf-axis {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
    border-radius: var(--sh-radius);
    border: 1px solid var(--sh-line);
    background: var(--sh-card-2);
  }
  .vf-axis-name {
    flex: 0 1 160px;
  }
  .vf-axis-name input {
    width: 100%;
    box-sizing: border-box;
    font-weight: 700;
  }
  .vf-values {
    flex: 1 1 240px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .vf-value {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 32px;
    padding-inline: 10px 2px;
    border-radius: 999px;
    border: 1px solid var(--sh-gold-line);
    background: var(--sh-card);
    color: var(--sh-ink);
    font-size: 13px;
  }
  .vf-value-x {
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--sh-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .vf-value-add {
    display: inline-flex;
    gap: 6px;
  }
  .vf-value-input {
    width: 120px;
    min-height: 36px;
  }
  .vf-small {
    min-height: 36px;
  }
  .vf-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .vf-reuse {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--sh-muted);
  }
  .vf-errors {
    margin: 0;
    padding-inline-start: 18px;
    font-size: 13px;
    color: var(--sh-accent-ink);
  }
  .vf-check {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--sh-muted);
    min-height: 32px;
  }
  .vf-tight {
    font-size: 12px;
  }
  .vf-bulk {
    display: flex;
    gap: 8px;
  }
  .vf-table {
    min-width: 760px;
  }
  .vf-table td {
    vertical-align: top;
  }
  .vf-combo {
    font-weight: 600;
    white-space: nowrap;
  }
  .vf-off .vf-combo {
    color: var(--sh-muted);
  }
  .vf-money {
    display: block;
    width: 120px;
  }
  .vf-money input {
    width: 100%;
    box-sizing: border-box;
  }
  .vf-money-pending input {
    border-color: var(--sh-gold);
  }
  .vf-stock {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .vf-qty {
    width: 72px;
    box-sizing: border-box;
  }
  .vf-sku {
    width: 150px;
    font-family: var(--sh-mono);
    font-size: 13px;
  }
  .vf-mono {
    font-family: var(--sh-mono);
    font-size: 13px;
    color: var(--sh-muted);
  }
  .vf-note {
    display: block;
    margin-top: 4px;
    font-size: 11px;
    font-weight: 700;
    white-space: normal;
  }
  .vf-note-gold {
    color: var(--sh-gold);
  }
  .vf-note-warn {
    color: var(--sh-on-warn);
    background: var(--sh-warn-tint);
    border-radius: 999px;
    padding: 2px 8px;
    display: inline-block;
  }
  .vf-note-err {
    color: var(--sh-accent-ink);
  }
  .vf-link {
    border: 0;
    background: transparent;
    padding: 0;
    min-height: 32px;
    color: var(--sh-gold);
    font-size: 13px;
    text-decoration: underline;
    cursor: pointer;
  }
  .vf-switch {
    border: 0;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    width: 44px;
    height: 26px;
    padding: 3px;
    box-sizing: border-box;
    border-radius: 999px;
    background: var(--sh-line);
    justify-content: flex-start;
  }
  .vf-switch[aria-checked='true'] {
    background: var(--sh-accent);
    justify-content: flex-end;
  }
  .vf-switch span {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
  }
  .vf-waiting-row td {
    color: var(--sh-muted);
  }
  .vf-pick {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 4px;
  }
  .vf-pick-grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
    gap: 8px;
  }
  .vf-pick-pic {
    width: 100%;
    aspect-ratio: 1;
    padding: 0;
    border-radius: var(--sh-radius-sm);
    border: 2px solid transparent;
    overflow: hidden;
    background: var(--sh-card-2);
    cursor: pointer;
  }
  .vf-pick-pic[aria-pressed='true'] {
    border-color: var(--sh-accent);
  }
  .vf-pick-pic img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
</style>
