<script lang="ts">
  /**
   * "Start the work — they don't have to sign up" (docs/inprogress/PLAN_OFFSITE_CLIENT.md
   * P1): one product of the rikma, how many, at what price ⇒ `startOffsiteDeal`. The
   * product's BOM becomes the work in the rikma (a line already being worked on keeps its
   * mission and timer), and the deal page follows it. Nothing waits on the customer.
   */
  import { t } from '$lib/translations';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';

  interface ProductOption {
    id: string;
    name: string;
    price: number | null;
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
    onDone: (sheirutId: string) => void;
  } = $props();

  const first = () => preselect.find((id) => products.some((p) => p.id === id)) ?? '';
  let productId = $state(first());
  let quantity = $state(1);
  let price = $state<number | null>(products.find((p) => p.id === first())?.price ?? null);
  let busy = $state(false);
  let error = $state('');

  function pick(id: string) {
    productId = id;
    price = products.find((p) => p.id === id)?.price ?? null;
  }

  let ready = $derived(!!productId && quantity > 0 && (price == null || price >= 0));

  async function start(e: SubmitEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    busy = true;
    error = '';
    try {
      const res = await executeAction(
        'startOffsiteDeal',
        { projectId, leadId, productId, quantity, price: price ?? undefined },
        { showErrorToast: false }
      );
      const id = (res.data as { sheirutId?: string } | undefined)?.sheirutId;
      if (!res.success || !id) {
        error = actionErrorText(res, $t('shop.leads.err.save'));
        return;
      }
      onDone(String(id));
    } finally {
      busy = false;
    }
  }
</script>

<form class="os" onsubmit={start}>
  <h2 class="sh-title os-title">{$t('shop.leads.offsite.title')}</h2>
  <p class="os-hint">{$t('shop.leads.offsite.hint')}</p>
  <label class="sh-field">
    {$t('shop.leads.offer.product')}
    <select class="sh-input" value={productId} onchange={(e) => pick(e.currentTarget.value)}>
      <option value="">{$t('shop.leads.offer.pickProduct')}</option>
      {#each products as p (p.id)}<option value={p.id}>{p.name}</option>{/each}
    </select>
  </label>
  <div class="os-row">
    <label class="sh-field">
      {$t('shop.leads.offer.quantity')}
      <input class="sh-input" type="number" min="1" step="1" bind:value={quantity} />
    </label>
    <label class="sh-field">
      {$t('shop.leads.offer.unitPrice')}
      <input class="sh-input" type="number" min="0" step="0.01" bind:value={price} />
    </label>
  </div>
  <p class="os-hint">{$t('shop.leads.offsite.bomHint')}</p>
  {#if error}<p class="os-err" role="alert">{error}</p>{/if}
  <button type="submit" class="sh-btn sh-btn-primary sh-btn-lg" disabled={!ready || busy}>{$t('shop.leads.offsite.start')}</button>
</form>

<style>
  .os {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .os-title {
    font-size: 22px;
  }
  .os-hint {
    margin: 0;
    font-size: 13px;
    color: var(--sh-muted);
  }
  .os-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .os-err {
    margin: 0;
    color: var(--sh-warn);
    font-size: 14px;
  }
</style>
