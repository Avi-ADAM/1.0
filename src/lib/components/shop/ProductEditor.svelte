<script lang="ts">
  /**
   * The seller's product editor (PLAN_SHOP_CUSTOMER_EXPERIENCE §7 S4, canvas
   * "מוח · מכירות — עם מה שקיים" › "DesktopProduct"): pictures, options,
   * variants, and what is waiting for the rikma.
   *
   * Every decision is made in `$lib/shop/variantEditor` — the same functions
   * `saveProductVariants` decides with — so what this screen calls "goes to the
   * rikma" is exactly what the server sends there. Stock, pictures, SKU, order
   * and visibility save at once; a new variant or a moved price is a term of the
   * product and is proposed to the partners (§4 principle 6), unless the product
   * is personal or the rikma has one member.
   */
  import { untrack } from 'svelte';
  import { beforeNavigate, invalidate } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { t, locale } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { useFormatMoney } from '$lib/money/context.svelte';
  import { clock } from '$lib/stores/clock.svelte';
  import { formatWhen } from '$lib/time/formatWhen';
  import { shopOrdersKey, shopProductsKey } from '$lib/shop/keys';
  import {
    buildMatrix,
    GALLERY_LIMIT,
    MAX_AXES,
    movePicture,
    normaliseAxes,
    pendingByVariant,
    planVariantSave,
    slugOf,
    validateVariants,
    type EditorAxis,
    type VariantError
  } from '$lib/shop/variantEditor';
  import type { EditorPicture, EditorProduct, EditorRow } from '$lib/shop/productEditor';
  import ShopSheet from './ShopSheet.svelte';

  let {
    projectId,
    product,
    rikmaAxes,
    takenSkus
  }: { projectId: string; product: EditorProduct; rikmaAxes: EditorAxis[]; takenSkus: string[] } = $props();

  const fmtMoney = useFormatMoney();

  // ── the draft ──────────────────────────────────────────────────────────
  const copy = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

  let gallery = $state<EditorPicture[]>([]);
  let axes = $state<EditorAxis[]>([]);
  let rows = $state<EditorRow[]>([]);
  let basePrice = $state('');
  let lowAt = $state('');
  let why = $state('');
  let newValues = $state<Record<number, string>>({});
  let saved = $state('');

  function reset(p: EditorProduct) {
    gallery = copy(p.gallery);
    axes = copy(p.axes);
    rows = copy(p.variants);
    basePrice = p.price === null ? '' : String(p.price);
    lowAt = p.lowStockAt === null ? '' : String(p.lowStockAt);
    why = '';
    newValues = {};
  }

  // A fresh load (after a save, or the rikma approving) starts from what is stored.
  // `untrack`: the effect follows `product` only — not the draft it writes.
  $effect(() => {
    const p = product;
    untrack(() => {
      reset(p);
      saved = snapshot();
    });
  });

  // ── what it means ──────────────────────────────────────────────────────
  const priceOf = (s: string): number | null => (s.trim() === '' ? null : Number(s.replace(',', '.')));

  let clean = $derived(normaliseAxes(axes));
  let matrix = $derived(buildMatrix({ axes: clean.axes, existing: rows, productId: product.id }));
  let matrixDiffers = $derived(matrix.added > 0 || matrix.retired > 0);
  let stored = $derived(
    new Map(product.variants.filter((v) => v.id && !v.unlimited).map((v) => [v.id as string, v.quant]))
  );
  let issues = $derived(validateVariants(rows, takenSkus, stored));
  let issueOf = $derived(new Map(issues.filter((i) => i.index >= 0).map((i) => [i.index, i.code])));
  let base = $derived(priceOf(basePrice));
  let baseInvalid = $derived(base !== null && (!Number.isFinite(base) || base < 0));
  let plan = $derived(
    planVariantSave({ existing: product.variants, desired: rows, productPrice: product.price, sovereign: product.sovereign })
  );
  let baseMoves = $derived(base !== null && Number.isFinite(base) && base !== product.price);
  let proposing = $derived(!product.sovereign && (plan.terms.length > 0 || baseMoves));
  let pendingPrice = $derived(new Map(plan.terms.filter((t) => t.kind === 'price').map((t) => [t.id, t.to])));

  let waiting = $derived(product.pending ? pendingByVariant(product.pending.terms) : null);
  let deadlineWhen = $derived(
    product.pending?.deadline ? (formatWhen(product.pending.deadline, clock.minutes, $locale || 'he')?.short ?? '') : ''
  );

  function snapshot(): string {
    return JSON.stringify({ g: gallery.map((p) => p.id), a: axes, r: rows, basePrice, lowAt });
  }
  let dirty = $derived(snapshot() !== saved);

  beforeNavigate((nav) => {
    if (dirty && !busy && !confirm($t('shopEditor.leave'))) nav.cancel();
  });

  const money = (n: number | null) => (n === null ? '—' : fmtMoney(n));

  // ── gallery ────────────────────────────────────────────────────────────
  let uploading = $state(false);
  let fileInput: HTMLInputElement | undefined = $state();

  async function addPictures(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const files = [...(input.files ?? [])];
    input.value = '';
    if (!files.length) return;
    uploading = true;
    for (const file of files) {
      if (gallery.length >= GALLERY_LIMIT) {
        toast.error($t('shopEditor.gallery.full'));
        break;
      }
      // Raster only — an SVG can carry script, and the server refuses it anyway.
      if (!/^image\/(png|jpeg|webp|gif|avif)$/.test(file.type)) {
        toast.error($t('shopEditor.gallery.badType'));
        continue;
      }
      try {
        const fd = new FormData();
        fd.append('files', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error(String(res.status));
        const f = (await res.json())?.[0];
        if (!f?.id || !f?.url) throw new Error('no file');
        const thumb = f.formats?.small?.url ?? f.formats?.thumbnail?.url ?? f.url;
        gallery.push({ id: String(f.id), url: f.url, thumb, width: f.width ?? null, height: f.height ?? null, alt: null });
      } catch {
        toast.error($t('shopEditor.gallery.failed'));
      }
    }
    uploading = false;
  }

  function removePicture(i: number) {
    const [gone] = gallery.splice(i, 1);
    if (gone) for (const r of rows) r.picIds = r.picIds.filter((id) => id !== gone.id);
  }

  // ── options ────────────────────────────────────────────────────────────
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

  let unusedRikmaAxes = $derived(rikmaAxes.filter((r) => !axes.some((a) => slugOf(a.key || a.name) === r.key)));

  function generate() {
    rows = matrix.variants.map((v) => ({ ...v, pictures: (v as EditorRow).pictures ?? [] }));
  }

  // ── variants ───────────────────────────────────────────────────────────
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

  // ── save ───────────────────────────────────────────────────────────────
  let busy = $state(false);
  let canSave = $derived(dirty && !busy && !uploading && !issues.length && !clean.errors.length && !baseInvalid);

  async function save() {
    if (!canSave) {
      if (dirty && (issues.length || clean.errors.length || baseInvalid)) toast.error($t('shopEditor.err.fix'));
      return;
    }
    busy = true;
    const res: any = await executeAction(
      'saveProductVariants' as any,
      {
        projectId,
        productId: product.id,
        axes: clean.axes,
        variants: rows.map((r, i) => ({
          id: r.id,
          optionValues: r.optionValues.map(({ key, value }) => ({ key, value })),
          name: r.name,
          sku: r.sku,
          price: r.price,
          compareAtPrice: r.compareAtPrice,
          quant: r.quant,
          unlimited: r.unlimited,
          active: r.active,
          position: i,
          picIds: r.picIds
        })),
        gallery: gallery.map((p) => p.id),
        ...(baseMoves ? { basePrice: base } : {}),
        lowStockAt: priceOf(lowAt),
        why: why.trim()
      },
      { showErrorToast: false }
    ).catch(() => null);
    busy = false;

    if (!res?.success) {
      toast.error($t('shopEditor.err.generic'));
      return;
    }
    const d = res.data ?? {};
    if (d.blocked === 'OPEN_PROPOSAL') toast.warning($t('shopEditor.err.openProposal'));
    else if (d.blocked === 'VARIANT_TERMS_NOT_READY') toast.warning($t('shopEditor.err.notReady'));
    else toast.success(d.proposed ? $t('shopEditor.savedProposed') : $t('shopEditor.saved'));
    if (d.lowStockSaved === false) toast.message($t('shopEditor.stock.lowNotSaved'));
    saved = snapshot();
    await Promise.all([invalidate(shopProductsKey(projectId)), invalidate(shopOrdersKey(projectId))]);
  }
</script>

<div class="pe">
  <header class="pe-head">
    <div class="pe-head-text">
      <a class="pe-crumb" href="/moach/{projectId}/sales/manage/products">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="sh-flip"><path d="M9 18l6-6-6-6" /></svg>
        {$t('shopEditor.crumbProducts')}
      </a>
      <div class="pe-title-row">
        <h2 class="sh-title pe-title">{product.name}</h2>
        <span class="sh-chip sh-chip-gold">{product.origin === 'personal' ? $t('shopEditor.badge.personal') : $t('shopEditor.badge.rikma')}</span>
      </div>
    </div>
    <div class="pe-head-actions">
      <a class="sh-btn sh-btn-outline" href="/gift/{product.id}">{$t('shopEditor.view')}</a>
      <button type="button" class="sh-btn sh-btn-primary" onclick={save} disabled={!dirty || busy || uploading} aria-busy={busy}>
        {busy ? $t('shopEditor.saving') : proposing ? $t('shopEditor.saveAndPropose') : $t('shopEditor.save')}
      </button>
    </div>
  </header>

  <div class="pe-cols">
    <div class="pe-main">
      <!-- ── pictures ── -->
      <section class="sh-card pe-card" aria-labelledby="pe-gallery">
        <div class="pe-card-head">
          <h3 id="pe-gallery" class="pe-h">{$t('shopEditor.gallery.title', { count: gallery.length })}</h3>
          <span class="pe-muted">{$t('shopEditor.gallery.hint')}</span>
        </div>
        {#if !gallery.length}
          <p class="pe-muted">{$t('shopEditor.gallery.empty')}</p>
        {/if}
        <ul class="pe-gallery">
          {#each gallery as pic, i (pic.id)}
            <li class="pe-pic" class:pe-pic-cover={i === 0}>
              <img src={pic.thumb} alt={pic.alt ?? ''} loading="lazy" />
              {#if i === 0}<span class="pe-cover-tag">{$t('shopEditor.gallery.cover')}</span>{/if}
              <div class="pe-pic-tools">
                {#if i > 0}
                  <button type="button" class="pe-tool" onclick={() => (gallery = movePicture(gallery, i, 0))} aria-label={$t('shopEditor.gallery.makeCover')} title={$t('shopEditor.gallery.makeCover')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" /></svg>
                  </button>
                  <button type="button" class="pe-tool" onclick={() => (gallery = movePicture(gallery, i, i - 1))} aria-label={$t('shopEditor.gallery.earlier')} title={$t('shopEditor.gallery.earlier')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="sh-flip"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                {/if}
                {#if i < gallery.length - 1}
                  <button type="button" class="pe-tool" onclick={() => (gallery = movePicture(gallery, i, i + 1))} aria-label={$t('shopEditor.gallery.later')} title={$t('shopEditor.gallery.later')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="sh-flip"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                {/if}
                <button type="button" class="pe-tool" onclick={() => removePicture(i)} aria-label={$t('shopEditor.gallery.remove')} title={$t('shopEditor.gallery.remove')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </div>
            </li>
          {/each}
          {#if gallery.length < GALLERY_LIMIT}
            <li>
              <button type="button" class="pe-add-pic" onclick={() => fileInput?.click()} disabled={uploading}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                {uploading ? $t('shopEditor.gallery.uploading') : $t('shopEditor.gallery.add')}
              </button>
            </li>
          {/if}
        </ul>
        <input bind:this={fileInput} class="pe-hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" multiple onchange={addPictures} tabindex="-1" aria-hidden="true" />
      </section>

      <!-- ── options ── -->
      <section class="sh-card pe-card" aria-labelledby="pe-options">
        <div class="pe-card-head pe-stack">
          <h3 id="pe-options" class="pe-h">{$t('shopEditor.options.title')}</h3>
          <p class="pe-muted">{$t('shopEditor.options.hint')}</p>
        </div>

        {#each axes as axis, i (i)}
          <div class="pe-axis">
            <label class="pe-axis-name">
              <span class="sr-only">{$t('shopEditor.options.name')}</span>
              <input class="sh-input" bind:value={axis.name} placeholder={$t('shopEditor.options.namePlaceholder')} />
            </label>
            <div class="pe-values">
              {#each axis.values as v, j (v.value)}
                <span class="pe-value">
                  {v.label}
                  <button type="button" class="pe-value-x" onclick={() => axis.values.splice(j, 1)} aria-label={$t('shopEditor.options.removeValue', { value: v.label })}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </button>
                </span>
              {/each}
              <form class="pe-value-add" onsubmit={(e) => { e.preventDefault(); addValue(i); }}>
                <input class="sh-input pe-value-input" bind:value={newValues[i]} placeholder={$t('shopEditor.options.valuePlaceholder')} aria-label={$t('shopEditor.options.valueLabel', { name: axis.name || '…' })} />
                <button type="submit" class="sh-btn sh-btn-outline pe-small">{$t('shopEditor.options.addValue')}</button>
              </form>
            </div>
            <button type="button" class="sh-btn sh-btn-quiet sh-btn-icon" onclick={() => axes.splice(i, 1)} aria-label={$t('shopEditor.options.remove')} title={$t('shopEditor.options.remove')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
            </button>
          </div>
        {/each}

        {#if clean.errors.length}
          <ul class="pe-errors">
            {#each clean.errors as code (code)}<li>{$t(`shopEditor.options.err.${code}`)}</li>{/each}
          </ul>
        {/if}

        <div class="pe-row-actions">
          {#if axes.length < MAX_AXES}
            <button type="button" class="sh-btn sh-btn-outline" onclick={addAxis}>{$t('shopEditor.options.add')}</button>
            {#if unusedRikmaAxes.length}
              <label class="pe-reuse">
                <span>{$t('shopEditor.options.reuse')}</span>
                <select class="sh-input" onchange={reuseAxis}>
                  <option value="">{$t('shopEditor.options.reusePick')}</option>
                  {#each unusedRikmaAxes as a (a.key)}<option value={a.key}>{a.name}</option>{/each}
                </select>
              </label>
            {/if}
          {:else}
            <span class="pe-muted">{$t('shopEditor.options.max')}</span>
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
          <p class="pe-muted">{matrix.retired === 1 ? $t('shopEditor.options.retiredOne') : $t('shopEditor.options.retired', { count: matrix.retired })}</p>
        {/if}
      </section>

      <!-- ── variants ── -->
      <section class="sh-card pe-card" aria-labelledby="pe-variants">
        <div class="pe-card-head">
          <h3 id="pe-variants" class="pe-h">{$t('shopEditor.variants.title')} <span class="pe-count">· {rows.length}</span></h3>
          {#if rows.length > 1}
            <label class="pe-check"><input type="checkbox" bind:checked={samePrice} /> {$t('shopEditor.variants.samePrice')}</label>
          {/if}
        </div>
        {#if samePrice}
          <div class="pe-bulk">
            <label class="pe-money">
              <span class="sr-only">{$t('shopEditor.variants.samePriceLabel')}</span>
              <input class="sh-input" inputmode="decimal" bind:value={bulkPrice} placeholder={$t('shopEditor.variants.pricePlaceholder')} />
            </label>
            <button type="button" class="sh-btn sh-btn-outline" onclick={applyBulk}>{$t('shopEditor.variants.applyAll')}</button>
          </div>
        {/if}

        {#if !rows.length}
          <p class="pe-muted">{$t('shopEditor.variants.empty')}</p>
        {:else}
          <div class="sh-table-wrap">
            <table class="sh-table pe-table">
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
                  <tr class:pe-off={!r.active}>
                    <td class="pe-combo">
                      {r.name}
                      {#if !r.id && !product.sovereign}<span class="pe-note pe-note-gold">{$t('shopEditor.variants.willPropose')}</span>{/if}
                      {#if err}<span class="pe-note pe-note-err">{$t(ERR[err])}</span>{/if}
                    </td>
                    <td>
                      <label class="pe-money" class:pe-money-pending={(r.id && pendingPrice.has(r.id)) || waitingPrice !== undefined}>
                        <span class="sr-only">{$t('shopEditor.variants.priceLabel', { name: r.name })}</span>
                        <input
                          class="sh-input"
                          inputmode="decimal"
                          value={r.price ?? ''}
                          placeholder={product.price === null ? $t('shopEditor.variants.pricePlaceholder') : String(product.price)}
                          oninput={(e) => (r.price = priceOf(e.currentTarget.value))}
                        />
                      </label>
                      {#if waitingPrice !== undefined}
                        <span class="pe-note pe-note-gold">{$t('shopEditor.variants.pendingPrice', { price: money(r.price ?? product.price) })}</span>
                      {:else if r.id && pendingPrice.has(r.id)}
                        <span class="pe-note pe-note-gold">{$t('shopEditor.variants.willPropose')}</span>
                      {/if}
                    </td>
                    <td>
                      <div class="pe-stock">
                        {#if !r.unlimited}
                          <input
                            class="sh-input pe-qty"
                            inputmode="numeric"
                            value={r.quant}
                            aria-label={$t('shopEditor.variants.stockLabel', { name: r.name })}
                            oninput={(e) => (r.quant = Number(e.currentTarget.value || 0))}
                          />
                        {/if}
                        <label class="pe-check pe-tight">
                          <input type="checkbox" bind:checked={r.unlimited} aria-label={$t('shopEditor.variants.unlimitedLabel', { name: r.name })} />
                          {$t('shopEditor.variants.unlimited')}
                        </label>
                      </div>
                      {#if !r.unlimited && r.quant < 0}
                        <span class="pe-note pe-note-warn">{$t('shopEditor.variants.queue', { count: -r.quant })}</span>
                      {/if}
                    </td>
                    <td>
                      <input class="sh-input pe-sku" bind:value={r.sku} aria-label={$t('shopEditor.variants.skuLabel', { name: r.name })} dir="ltr" />
                    </td>
                    <td>
                      <button type="button" class="pe-link" onclick={() => openPick(i)}>
                        {r.picIds.length ? $t('shopEditor.variants.picturesOwn', { count: r.picIds.length }) : $t('shopEditor.variants.picturesProduct')}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        role="switch"
                        class="pe-switch"
                        aria-checked={r.active}
                        aria-label={$t('shopEditor.variants.shownLabel', { name: r.name })}
                        onclick={() => (r.active = !r.active)}
                      ><span></span></button>
                    </td>
                  </tr>
                {/each}
                {#each waiting?.creates ?? [] as c (c.axisKey)}
                  <tr class="pe-waiting-row">
                    <td class="pe-combo">{c.name}<span class="pe-note pe-note-gold">{$t('shopEditor.variants.newPending')}</span></td>
                    <td class="sh-num"><bdi>{money(c.price ?? product.price)}</bdi></td>
                    <td>{c.unlimited ? $t('shopEditor.variants.unlimited') : c.quant}</td>
                    <td><bdi class="pe-mono">{c.sku}</bdi></td>
                    <td></td>
                    <td></td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <p class="pe-muted">{$t('shopEditor.variants.keepNote')}</p>
        {/if}
      </section>
    </div>

    <aside class="pe-side">
      {#if product.pending}
        {@const p = product.pending}
        <section class="sh-card pe-card pe-pending" aria-labelledby="pe-pending">
          <h3 id="pe-pending" class="sh-section-label pe-gold">{$t('shopEditor.pending.title')}</h3>
          <ul class="pe-terms">
            {#if p.basePrice !== null}
              <li>{$t('shopEditor.pending.base', { from: money(product.price), to: money(p.basePrice) })}</li>
            {/if}
            {#each p.terms as term, k (k)}
              <li>
                {#if term.kind === 'price'}
                  {$t('shopEditor.pending.price', { name: term.name, from: money(term.from), to: money(term.to) })}
                {:else}
                  {$t('shopEditor.pending.create', { name: term.name })}
                {/if}
              </li>
            {/each}
          </ul>
          <p class="pe-muted">{$t('shopEditor.pending.buyers')}</p>
          {#if deadlineWhen}<p class="pe-muted">{$t('shopEditor.pending.silence', { when: deadlineWhen })}</p>{/if}
          <div class="pe-pending-foot">
            <span class="pe-muted">{$t('shopEditor.pending.signed', { signed: p.signed, members: p.members })}</span>
            <a href="/moach/{projectId}/votes/decision/{p.decisionId}">{$t('shopEditor.pending.vote')}</a>
          </div>
        </section>
      {/if}

      {#if proposing}
        <section class="sh-card pe-card pe-propose" aria-labelledby="pe-propose">
          <h3 id="pe-propose" class="sh-section-label pe-gold">{$t('shopEditor.propose.title')}</h3>
          <ul class="pe-terms">
            {#if baseMoves}
              <li>{$t('shopEditor.pending.base', { from: money(product.price), to: money(base) })}</li>
            {/if}
            {#each plan.terms as term, k (k)}
              <li>
                {#if term.kind === 'price'}
                  {$t('shopEditor.pending.price', { name: term.name, from: money(term.from), to: money(term.to) })}
                {:else}
                  {$t('shopEditor.pending.create', { name: term.name })}
                {/if}
              </li>
            {/each}
          </ul>
          <p class="pe-muted">{$t('shopEditor.propose.hint')}</p>
          <label class="sh-field">
            {$t('shopEditor.propose.why')}
            <textarea class="sh-input" bind:value={why} maxlength="500" placeholder={$t('shopEditor.propose.whyPlaceholder')}></textarea>
          </label>
        </section>
      {:else if product.sovereign && (plan.terms.length || baseMoves || plan.creates.length)}
        <p class="pe-muted pe-sovereign">{product.origin === 'personal' ? $t('shopEditor.propose.personal') : $t('shopEditor.propose.alone')}</p>
      {/if}

      <section class="sh-card pe-card" aria-labelledby="pe-stock">
        <h3 id="pe-stock" class="pe-h pe-h-sm">{$t('shopEditor.stock.title')}</h3>
        <label class="sh-field">
          {$t('shopEditor.stock.basePrice')}
          <input class="sh-input" inputmode="decimal" bind:value={basePrice} aria-invalid={baseInvalid} />
          <span class="pe-hint">{$t('shopEditor.stock.basePriceHint')}</span>
        </label>
        <label class="sh-field">
          {$t('shopEditor.stock.lowAt')}
          <span class="pe-inline">
            <input class="sh-input pe-qty" inputmode="numeric" bind:value={lowAt} />
            <span>{$t('shopEditor.stock.units')}</span>
          </span>
          <span class="pe-hint">{$t('shopEditor.stock.lowHint')}</span>
        </label>
      </section>
    </aside>
  </div>
</div>

<ShopSheet bind:open={pickOpen} label={pickFor !== null && rows[pickFor] ? $t('shopEditor.variants.pickPictures', { name: rows[pickFor].name }) : ''}>
  {#if pickFor !== null && rows[pickFor]}
    {@const r = rows[pickFor]}
    <div class="pe-pick">
      <h2 class="sh-title pe-h">{$t('shopEditor.variants.pickPictures', { name: r.name })}</h2>
      {#if !gallery.length}
        <p class="pe-muted">{$t('shopEditor.variants.noGallery')}</p>
      {:else}
        <p class="pe-muted">{$t('shopEditor.variants.pickHint')}</p>
        <ul class="pe-pick-grid">
          {#each gallery as pic (pic.id)}
            <li>
              <button type="button" class="pe-pick-pic" aria-pressed={r.picIds.includes(pic.id)} onclick={() => togglePic(pic.id)}>
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
  .sr-only,
  .pe-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  .pe {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .pe-head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 12px;
  }
  .pe-head-text {
    flex: 1 1 260px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .pe-crumb {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: var(--sh-muted);
    text-decoration: none;
    min-height: 32px;
  }
  .pe-title-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .pe-title {
    margin: 0;
    font-size: 26px;
    line-height: 1.15;
  }
  .pe-head-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .pe-cols {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-start;
  }
  .pe-main {
    flex: 999 1 560px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .pe-side {
    flex: 1 1 300px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .pe-card {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .pe-card-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px 12px;
  }
  .pe-stack {
    flex-direction: column;
    gap: 4px;
  }
  .pe-h {
    margin: 0;
    flex: 1 1 auto;
    font-size: 17px;
    font-weight: 700;
    color: var(--sh-ink);
  }
  .pe-h-sm {
    font-size: 15px;
  }
  .pe-count {
    font-weight: 400;
    color: var(--sh-muted);
  }
  .pe-muted,
  .pe-hint {
    margin: 0;
    font-size: 13px;
    color: var(--sh-muted);
  }
  .pe-hint {
    font-size: 12px;
  }
  .pe-gold {
    margin: 0;
    color: var(--sh-gold);
  }

  /* gallery */
  .pe-gallery {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: 10px;
  }
  .pe-pic {
    position: relative;
    aspect-ratio: 1;
    border-radius: var(--sh-radius-sm);
    overflow: hidden;
    border: 1px solid var(--sh-line);
    background: var(--sh-card-2);
  }
  .pe-pic-cover {
    grid-column: span 2;
    grid-row: span 2;
    border: 2px solid var(--sh-gold);
  }
  .pe-pic img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .pe-cover-tag {
    position: absolute;
    top: 6px;
    inset-inline-start: 6px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--sh-gold);
    color: var(--sh-on-accent);
    font-size: 11px;
    font-weight: 700;
  }
  .pe-pic-tools {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    gap: 4px;
    padding: 4px;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.55));
  }
  .pe-tool {
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.92);
    color: #1d1a16;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .pe-add-pic {
    width: 100%;
    aspect-ratio: 1;
    border: 1px dashed var(--sh-gold-line);
    border-radius: var(--sh-radius-sm);
    background: transparent;
    color: var(--sh-gold);
    font-size: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
  }

  /* options */
  .pe-axis {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
    border-radius: var(--sh-radius);
    border: 1px solid var(--sh-line);
    background: var(--sh-card-2);
  }
  .pe-axis-name {
    flex: 0 1 160px;
  }
  .pe-axis-name input {
    width: 100%;
    box-sizing: border-box;
    font-weight: 700;
  }
  .pe-values {
    flex: 1 1 240px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .pe-value {
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
  .pe-value-x {
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
  .pe-value-add {
    display: inline-flex;
    gap: 6px;
  }
  .pe-value-input {
    width: 120px;
    min-height: 36px;
  }
  .pe-small {
    min-height: 36px;
  }
  .pe-row-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .pe-reuse {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--sh-muted);
  }
  .pe-errors {
    margin: 0;
    padding-inline-start: 18px;
    font-size: 13px;
    color: var(--sh-accent-ink);
  }

  /* variants */
  .pe-check {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--sh-muted);
    min-height: 32px;
  }
  .pe-tight {
    font-size: 12px;
  }
  .pe-bulk {
    display: flex;
    gap: 8px;
  }
  .pe-table {
    min-width: 760px;
  }
  .pe-table td {
    vertical-align: top;
  }
  .pe-combo {
    font-weight: 600;
    white-space: nowrap;
  }
  .pe-off .pe-combo {
    color: var(--sh-muted);
  }
  .pe-money {
    display: block;
    width: 120px;
  }
  .pe-money input {
    width: 100%;
    box-sizing: border-box;
  }
  .pe-money-pending input {
    border-color: var(--sh-gold);
  }
  .pe-stock {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .pe-qty {
    width: 72px;
    box-sizing: border-box;
  }
  .pe-sku {
    width: 150px;
    font-family: var(--sh-mono);
    font-size: 13px;
  }
  .pe-mono {
    font-family: var(--sh-mono);
    font-size: 13px;
    color: var(--sh-muted);
  }
  .pe-note {
    display: block;
    margin-top: 4px;
    font-size: 11px;
    font-weight: 700;
    white-space: normal;
  }
  .pe-note-gold {
    color: var(--sh-gold);
  }
  .pe-note-warn {
    color: var(--sh-on-warn);
    background: var(--sh-warn-tint);
    border-radius: 999px;
    padding: 2px 8px;
    display: inline-block;
  }
  .pe-note-err {
    color: var(--sh-accent-ink);
  }
  .pe-link {
    border: 0;
    background: transparent;
    padding: 0;
    min-height: 32px;
    color: var(--sh-gold);
    font-size: 13px;
    text-decoration: underline;
    cursor: pointer;
  }
  .pe-switch {
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
  .pe-switch[aria-checked='true'] {
    background: var(--sh-accent);
    justify-content: flex-end;
  }
  .pe-switch span {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
  }
  .pe-waiting-row td {
    color: var(--sh-muted);
  }

  /* side */
  .pe-pending,
  .pe-propose {
    border-color: var(--sh-gold-line);
  }
  .pe-terms {
    margin: 0;
    padding-inline-start: 18px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
    color: var(--sh-ink);
  }
  .pe-pending-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }
  .pe-pending-foot a {
    font-weight: 700;
    color: var(--sh-gold);
  }
  .pe-sovereign {
    padding: 0 4px;
  }
  .pe-inline {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  /* picture picker */
  .pe-pick {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 4px;
  }
  .pe-pick-grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
    gap: 8px;
  }
  .pe-pick-pic {
    width: 100%;
    aspect-ratio: 1;
    padding: 0;
    border-radius: var(--sh-radius-sm);
    border: 2px solid transparent;
    overflow: hidden;
    background: var(--sh-card-2);
    cursor: pointer;
  }
  .pe-pick-pic[aria-pressed='true'] {
    border-color: var(--sh-accent);
  }
  .pe-pick-pic img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
</style>
