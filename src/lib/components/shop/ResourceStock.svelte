<script lang="ts">
  /**
   * Stock from a resource (PLAN_SHOP_OPERATIONS §2.4, A3) — the shelves of the
   * rikma's resources, beside the shop's own stock.
   *
   * A product linked to a resource takes it off the shelf when it sells, and a
   * cancel before shipping gives it back. "I bought another 50 jars at 4" is a
   * receipt: it goes on the shelf, and its value to the giver, once the rikma
   * agrees — or by silence after the giver signed. Until stage A5 the shop's
   * own count stays its own: the two numbers live side by side on purpose, and
   * each link shows how many units the shelf still covers (§8 risk 4).
   */
  import { invalidate } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { t, locale } from '$lib/translations';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { shopResourcesKey } from '$lib/shop/keys';
  import { unitsCovered, type ResourceStockView } from '$lib/fulfillment/stockView';
  import type { ShopProductRow } from '$lib/shop/manage';

  let {
    projectId,
    uid,
    resources,
    products
  }: { projectId: string; uid: string; resources: ResourceStockView[]; products: ShopProductRow[] } = $props();

  let busy = $state(false);
  /** Which resource has which form open. */
  let open = $state<{ id: string; form: 'receive' | 'link' } | null>(null);
  let receive = $state({ quantity: '' as string | number, price: '' as string | number, opening: false });
  let link = $state({ productId: '', variantId: '', quantityPerUnit: 1 as string | number });
  /** Threshold drafts, by resource id. */
  let lowDraft = $state<Record<string, string | number>>({});

  const fmt = (n: number) => new Intl.NumberFormat($locale || 'he', { maximumFractionDigits: 3 }).format(n);
  const productById = $derived(new Map(products.map((p) => [p.id, p])));
  const linkVariants = $derived(productById.get(link.productId)?.variants.filter((v) => v.active) ?? []);
  /** What a link can name: the products still on sale. */
  const linkable = $derived(products.filter((p) => p.status !== 'archived'));

  function fmtWhen(iso: string): string {
    try {
      return new Intl.DateTimeFormat($locale || 'he', {
        timeZone: 'Asia/Jerusalem',
        weekday: 'short',
        day: 'numeric',
        month: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  async function call(key: Parameters<typeof executeAction>[0], params: Record<string, unknown>): Promise<any | null> {
    if (busy) return null;
    busy = true;
    try {
      const res = await executeAction(key, { projectId, ...params });
      if (res?.success === false) throw new Error(actionErrorText(res, $t('shop.stock.res.error')));
      await invalidate(shopResourcesKey(projectId));
      return res?.data ?? {};
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : $t('shop.stock.res.error'));
      return null;
    } finally {
      busy = false;
    }
  }

  function openReceive(r: ResourceStockView) {
    receive = { quantity: '', price: r.pricePerUnit ?? '', opening: !r.tracked };
    open = { id: r.id, form: 'receive' };
  }

  function openLink(r: ResourceStockView) {
    link = { productId: linkable[0]?.id ?? '', variantId: '', quantityPerUnit: 1 };
    open = { id: r.id, form: 'link' };
  }

  async function submitReceive(e: SubmitEvent, r: ResourceStockView) {
    e.preventDefault();
    const quantity = Number(receive.quantity);
    if (!(quantity > 0)) return;
    const price = receive.opening ? 0 : receive.price === '' ? null : Number(receive.price);
    const data = await call('receiveStock', {
      resourceId: r.id,
      quantity,
      ...(price != null && Number.isFinite(price) ? { unitPrice: price } : {})
    });
    if (!data) return;
    toast.success(
      data.settled
        ? $t('shop.stock.res.receivedSettled')
        : data.waitingForGiver
          ? $t('shop.stock.res.receivedGiver')
          : $t('shop.stock.res.receivedWaiting', { when: data.deadline ? fmtWhen(data.deadline) : '' })
    );
    open = null;
  }

  async function submitLink(e: SubmitEvent, r: ResourceStockView) {
    e.preventDefault();
    const quantityPerUnit = Number(link.quantityPerUnit);
    if (!link.productId || !(quantityPerUnit > 0)) return;
    const data = await call('linkProductResource', {
      resourceId: r.id,
      productId: link.productId,
      ...(link.variantId ? { variantId: link.variantId } : {}),
      quantityPerUnit
    });
    if (!data) return;
    toast.success(data.updated ? $t('shop.stock.res.linkUpdated') : $t('shop.stock.res.linked'));
    open = null;
  }

  async function unlink(recipeId: string) {
    const data = await call('unlinkProductResource', { recipeId });
    if (data) toast.success($t('shop.stock.res.unlinked'));
  }

  async function saveLow(e: SubmitEvent, r: ResourceStockView) {
    e.preventDefault();
    const raw = lowDraft[r.id];
    const lowStockAt = raw === '' || raw == null ? null : Number(raw);
    const data = await call('setResourceStock', { resourceId: r.id, lowStockAt });
    if (data) {
      toast.success($t('shop.stock.res.lowSaved'));
      delete lowDraft[r.id];
    }
  }

  async function setAccounting(r: ResourceStockView, accounting: 'owned' | 'perUse') {
    if (accounting === r.accounting) return;
    const data = await call('setResourceStock', { resourceId: r.id, accounting });
    if (data) toast.success($t('shop.stock.res.accountingSaved'));
  }

  function stateChip(r: ResourceStockView): { cls: string; label: string } {
    if (!r.tracked) return { cls: 'sh-chip-muted', label: $t('shop.stock.res.untracked') };
    if (r.state === 'out') return { cls: 'sh-chip-warn', label: $t('shop.stock.res.out') };
    if (r.state === 'low') return { cls: 'sh-chip-warn-soft', label: $t('shop.stock.res.low') };
    return { cls: 'sh-chip-ok', label: $t('shop.stock.res.ok') };
  }

  /** The shop's own count for a link — the gap between the two is the point (§8 risk 4). */
  function shopCount(productId: string | null, variantId: string | null): number | null | undefined {
    const p = productId ? productById.get(productId) : null;
    if (!p) return undefined;
    if (variantId) return p.variants.find((v) => v.id === variantId)?.quant;
    return p.variants.length ? p.variants.reduce<number | null>((s, v) => (v.quant == null || s == null ? null : s + v.quant), 0) : p.quant;
  }
</script>

<section class="rs" aria-labelledby="rs-title">
  <h2 id="rs-title" class="sh-section-label">{$t('shop.stock.res.title')}</h2>
  <p class="rs-muted">{$t('shop.stock.res.intro')}</p>

  {#if resources.length === 0}
    <p class="rs-muted">{$t('shop.stock.res.none')}</p>
  {:else}
    <ul class="rs-list">
      {#each resources as r (r.id)}
        {@const chip = stateChip(r)}
        {@const isGiver = r.giverId === uid}
        <li class="sh-card rs-card">
          <div class="rs-head">
            <strong class="rs-name"><bdi>{r.name}</bdi></strong>
            <span class="sh-chip {chip.cls}">{chip.label}</span>
          </div>

          <p class="rs-onhand">
            {$t('shop.stock.res.onHand', { count: fmt(r.onHand) })}
            <span class="rs-muted"> · {$t('shop.stock.res.flow', { delivered: fmt(r.delivered), consumed: fmt(r.consumed) })}</span>
          </p>
          <p class="rs-muted">
            {r.giverName ? $t('shop.stock.res.giver', { name: r.giverName }) : $t('shop.stock.res.noGiver')}
            {#if r.pricePerUnit != null} · {$t('shop.stock.res.price', { price: fmt(r.pricePerUnit) })}{/if}
            {#if r.accounting === 'perUse'} · {$t('shop.stock.res.perUse')}{/if}
          </p>

          {#if r.pending.length}
            <ul class="rs-pending">
              {#each r.pending as p (p.maapId)}
                <li>
                  {p.unitPrice > 0
                    ? $t('shop.stock.res.pending', { count: fmt(p.quantity), price: fmt(p.unitPrice) })
                    : $t('shop.stock.res.pendingOpening', { count: fmt(p.quantity) })}
                  {#if p.deadline}<span class="rs-muted"> · {$t('shop.stock.res.pendingUntil', { when: fmtWhen(p.deadline) })}</span>{/if}
                </li>
              {/each}
            </ul>
          {/if}

          {#if r.links.length}
            <ul class="rs-links">
              {#each r.links as l (l.recipeId)}
                {@const own = shopCount(l.productId, l.variantId)}
                <li>
                  <span>
                    <bdi>{l.productName}</bdi>{#if l.variantName} · <bdi>{l.variantName}</bdi>{/if}
                    — {$t('shop.stock.res.perUnit', { count: fmt(l.quantityPerUnit) })}
                  </span>
                  <span class="rs-muted">
                    {$t('shop.stock.res.covers', { count: unitsCovered(r.onHand, l.quantityPerUnit) })}{#if own !== undefined} · {own === null
                        ? $t('shop.stock.res.shopUnlimited')
                        : $t('shop.stock.res.shopCount', { count: own })}{/if}
                  </span>
                  <button type="button" class="sh-btn sh-btn-quiet rs-small" disabled={busy} onclick={() => unlink(l.recipeId)}>
                    {$t('shop.stock.res.unlink')}
                  </button>
                </li>
              {/each}
            </ul>
          {/if}

          <form class="rs-low" onsubmit={(e) => saveLow(e, r)}>
            <label class="rs-inline">
              {$t('shop.stock.res.lowAt')}
              <input
                class="sh-input sh-num rs-num"
                type="number"
                min="0"
                step="any"
                inputmode="decimal"
                value={lowDraft[r.id] ?? r.lowStockAt ?? ''}
                oninput={(e) => (lowDraft[r.id] = e.currentTarget.value)}
              />
            </label>
            {#if lowDraft[r.id] !== undefined}
              <button type="submit" class="sh-btn sh-btn-outline rs-small" disabled={busy}>{$t('shop.stock.res.save')}</button>
            {/if}
          </form>

          {#if isGiver}
            <div class="rs-inline">
              <span>{$t('shop.stock.res.accounting')}</span>
              <div class="sh-seg" role="group">
                <button type="button" aria-pressed={r.accounting === 'owned'} disabled={busy} onclick={() => setAccounting(r, 'owned')}>
                  {$t('shop.stock.res.owned')}
                </button>
                <button type="button" aria-pressed={r.accounting === 'perUse'} disabled={busy} onclick={() => setAccounting(r, 'perUse')}>
                  {$t('shop.stock.res.perUseShort')}
                </button>
              </div>
            </div>
            {#if r.accounting === 'perUse'}<p class="rs-muted">{$t('shop.stock.res.perUseHint')}</p>{/if}
          {/if}

          {#if open?.id === r.id && open.form === 'receive'}
            <form class="rs-form" onsubmit={(e) => submitReceive(e, r)}>
              <label class="sh-field">
                {$t('shop.stock.res.qty')}
                <input class="sh-input sh-num" type="number" min="0.001" step="any" inputmode="decimal" required bind:value={receive.quantity} />
              </label>
              <label class="rs-inline">
                <input type="checkbox" bind:checked={receive.opening} />
                {$t('shop.stock.res.opening')}
              </label>
              {#if !receive.opening}
                <label class="sh-field">
                  {$t('shop.stock.res.unitPrice')}
                  <input class="sh-input sh-num" type="number" min="0" step="any" inputmode="decimal" bind:value={receive.price} />
                </label>
              {/if}
              <p class="rs-muted">{receive.opening ? $t('shop.stock.res.openingHint') : $t('shop.stock.res.receiveHint')}</p>
              <div class="rs-actions">
                <button type="submit" class="sh-btn sh-btn-primary" disabled={busy || !(Number(receive.quantity) > 0)}>{$t('shop.stock.res.receiveSubmit')}</button>
                <button type="button" class="sh-btn sh-btn-quiet" onclick={() => (open = null)}>{$t('shop.stock.res.cancel')}</button>
              </div>
            </form>
          {:else if open?.id === r.id && open.form === 'link'}
            <form class="rs-form" onsubmit={(e) => submitLink(e, r)}>
              <label class="sh-field">
                {$t('shop.stock.res.product')}
                <select class="sh-input" bind:value={link.productId} onchange={() => (link.variantId = '')} required>
                  {#each linkable as p (p.id)}
                    <option value={p.id}>{p.name}</option>
                  {/each}
                </select>
              </label>
              {#if linkVariants.length}
                <label class="sh-field">
                  {$t('shop.stock.res.variant')}
                  <select class="sh-input" bind:value={link.variantId}>
                    <option value="">{$t('shop.stock.res.allVariants')}</option>
                    {#each linkVariants as v (v.id)}
                      <option value={v.id}>{v.label}</option>
                    {/each}
                  </select>
                </label>
              {/if}
              <label class="sh-field">
                {$t('shop.stock.res.qpu')}
                <input class="sh-input sh-num" type="number" min="0.001" step="any" inputmode="decimal" required bind:value={link.quantityPerUnit} />
              </label>
              <p class="rs-muted">{$t('shop.stock.res.linkHint')}</p>
              <div class="rs-actions">
                <button type="submit" class="sh-btn sh-btn-primary" disabled={busy || !link.productId}>{$t('shop.stock.res.linkSubmit')}</button>
                <button type="button" class="sh-btn sh-btn-quiet" onclick={() => (open = null)}>{$t('shop.stock.res.cancel')}</button>
              </div>
            </form>
          {:else}
            <div class="rs-actions">
              <button type="button" class="sh-btn sh-btn-outline" disabled={busy || !r.giverId} onclick={() => openReceive(r)}>
                {r.tracked ? $t('shop.stock.res.receive') : $t('shop.stock.res.start')}
              </button>
              {#if linkable.length}
                <button type="button" class="sh-btn sh-btn-quiet" disabled={busy} onclick={() => openLink(r)}>{$t('shop.stock.res.link')}</button>
              {/if}
            </div>
            {#if !r.giverId}<p class="rs-muted">{$t('shop.stock.res.noGiverHint')}</p>{/if}
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .rs {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 24px;
  }
  .rs-muted {
    color: var(--sh-muted);
    font-size: 13px;
  }
  .rs-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .rs-card {
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: var(--sh-ink);
  }
  .rs-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .rs-name {
    font-size: 16px;
  }
  .rs-onhand {
    font-size: 15px;
    font-weight: 600;
  }
  .rs-pending,
  .rs-links {
    display: flex;
    flex-direction: column;
    gap: 4px;
    list-style: none;
    padding: 8px 10px;
    margin: 0;
    border-radius: var(--sh-radius-sm);
    background: var(--sh-card-2);
    font-size: 14px;
  }
  .rs-links li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
  }
  .rs-low,
  .rs-inline {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 14px;
  }
  .rs-num {
    max-width: 7rem;
  }
  .rs-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border: 1px solid var(--sh-line);
    border-radius: var(--sh-radius-sm);
    padding: 10px 12px;
  }
  .rs-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .rs-small {
    min-height: 32px;
    font-size: 13px;
  }
</style>
