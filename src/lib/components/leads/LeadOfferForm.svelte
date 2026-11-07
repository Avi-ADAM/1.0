<script lang="ts">
  /**
   * "Send an offer" (docs/inprogress/PLAN_LEADS.md §4.0, L4): products, how
   * many, at what price — written as an order waiting for an arranged payment
   * (`sendLeadOffer`). The buyer's details come from the lead. The member
   * types the price they offered; it starts from the catalogue price.
   */
  import { t } from '$lib/translations';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';

  interface ProductOption {
    id: string;
    name: string;
    price: number | null;
    variants: Array<{ id: string; label: string; price: number | null; active: boolean }>;
  }

  let {
    projectId,
    leadId,
    products,
    preselect = [],
    onDone
  }: {
    projectId: string;
    leadId: string;
    products: ProductOption[];
    preselect?: string[];
    onDone: () => void;
  } = $props();

  interface Line {
    productId: string;
    variantId: string;
    quantity: number;
    unitPrice: number | null;
  }

  const blank = (productId = ''): Line => {
    const p = products.find((x) => x.id === productId);
    return { productId, variantId: '', quantity: 1, unitPrice: p?.price ?? null };
  };
  let lines = $state<Line[]>(preselect.length ? preselect.filter((id) => products.some((p) => p.id === id)).map(blank) : [blank()]);
  if (!lines.length) lines = [blank()];
  let note = $state('');
  let busy = $state(false);
  let error = $state('');

  const productOf = (id: string) => products.find((p) => p.id === id) ?? null;
  const activeVariants = (id: string) => (productOf(id)?.variants ?? []).filter((v) => v.active);

  function pickProduct(i: number, id: string) {
    lines[i] = blank(id);
  }
  function pickVariant(i: number, variantId: string) {
    const v = activeVariants(lines[i].productId).find((x) => x.id === variantId);
    lines[i] = { ...lines[i], variantId, unitPrice: v?.price ?? productOf(lines[i].productId)?.price ?? lines[i].unitPrice };
  }

  let ready = $derived(
    lines.length > 0 &&
      lines.every(
        (l) =>
          l.productId &&
          l.quantity > 0 &&
          l.unitPrice != null &&
          l.unitPrice >= 0 &&
          (activeVariants(l.productId).length === 0 || l.variantId)
      )
  );
  let total = $derived(lines.reduce((s, l) => s + (l.unitPrice ?? 0) * (l.quantity || 0), 0));

  async function send(e: SubmitEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    busy = true;
    error = '';
    try {
      const res = await executeAction(
        'sendLeadOffer',
        {
          projectId,
          leadId,
          note: note.trim() || undefined,
          lines: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId || undefined,
            quantity: l.quantity,
            unitPrice: l.unitPrice
          }))
        },
        { showErrorToast: false }
      );
      if (!res.success) {
        error = actionErrorText(res, $t('shop.leads.err.save'));
        return;
      }
      onDone();
    } finally {
      busy = false;
    }
  }
</script>

<form class="of" onsubmit={send}>
  <h2 class="sh-title of-title">{$t('shop.leads.offer.title')}</h2>
  <p class="of-hint">{$t('shop.leads.offer.hint')}</p>
  {#each lines as line, i (i)}
    <fieldset class="of-line">
      <legend class="sr-only">{$t('shop.leads.offer.line', { count: i + 1 })}</legend>
      <label class="sh-field">
        {$t('shop.leads.offer.product')}
        <select class="sh-input" value={line.productId} onchange={(e) => pickProduct(i, e.currentTarget.value)}>
          <option value="">{$t('shop.leads.offer.pickProduct')}</option>
          {#each products as p (p.id)}<option value={p.id}>{p.name}</option>{/each}
        </select>
      </label>
      {#if activeVariants(line.productId).length}
        <label class="sh-field">
          {$t('shop.leads.offer.variant')}
          <select class="sh-input" value={line.variantId} onchange={(e) => pickVariant(i, e.currentTarget.value)}>
            <option value="">{$t('shop.leads.offer.pickVariant')}</option>
            {#each activeVariants(line.productId) as v (v.id)}<option value={v.id}>{v.label}</option>{/each}
          </select>
        </label>
      {/if}
      <div class="of-row">
        <label class="sh-field">
          {$t('shop.leads.offer.quantity')}
          <input class="sh-input" type="number" min="1" step="1" bind:value={lines[i].quantity} />
        </label>
        <label class="sh-field">
          {$t('shop.leads.offer.unitPrice')}
          <input class="sh-input" type="number" min="0" step="0.01" bind:value={lines[i].unitPrice} />
        </label>
      </div>
      {#if lines.length > 1}
        <button type="button" class="sh-btn sh-btn-quiet" onclick={() => (lines = lines.filter((_, j) => j !== i))}>
          {$t('shop.leads.offer.removeLine')}
        </button>
      {/if}
    </fieldset>
  {/each}
  <button type="button" class="sh-btn sh-btn-outline" onclick={() => (lines = [...lines, blank()])}>+ {$t('shop.leads.offer.addLine')}</button>
  <label class="sh-field">
    {$t('shop.leads.offer.note')}
    <textarea class="sh-input" bind:value={note} maxlength="1000"></textarea>
  </label>
  <p class="of-total">{$t('shop.leads.offer.total')}: <bdi class="sh-num">{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</bdi></p>
  {#if error}<p class="of-err" role="alert">{error}</p>{/if}
  <button type="submit" class="sh-btn sh-btn-primary sh-btn-lg" disabled={!ready || busy}>{$t('shop.leads.offer.send')}</button>
</form>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  .of {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .of-title {
    font-size: 22px;
  }
  .of-hint {
    margin: 0;
    font-size: 13px;
    color: var(--sh-muted);
  }
  .of-line {
    border: 1px solid var(--sh-line);
    border-radius: var(--sh-radius-sm);
    padding: 12px;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .of-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .of-total {
    margin: 0;
    font-weight: 700;
  }
  .of-err {
    margin: 0;
    color: var(--sh-warn);
    font-size: 14px;
  }
</style>
