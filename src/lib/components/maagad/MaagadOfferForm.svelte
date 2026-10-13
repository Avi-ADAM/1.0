<script lang="ts">
  import { t } from '$lib/translations';
  import Money from '$lib/components/money/Money.svelte';
  import { departureTerms, type PoolableProduct } from '$lib/pooling/departure';

  type Props = {
    maagadId: string;
    /** The composed products of the viewer's rikmas (PLAN_POOL_PRODUCT §4). */
    products?: PoolableProduct[];
    onDone?: (offerId: string) => void;
    onCancel?: () => void;
  };

  let { maagadId, products = [], onDone, onCancel }: Props = $props();

  let title = $state('');
  let description = $state('');
  let unitPrice = $state<number | null>(null);
  let minParticipants = $state<number | null>(null);
  let maxParticipants = $state<number | null>(null);
  let signDeadline = $state('');
  let recurrence = $state<'one_time' | 'weekly' | 'biweekly' | 'monthly'>('one_time');
  let cancellationTerms = $state('');

  // A departure of a product: the price is derived from its BOM — nothing to type.
  let pricing = $state<'fixed' | 'product'>('fixed');
  let productId = $state<string>('');
  const product = $derived(
    pricing === 'product' ? (products.find((p) => p.id === productId) ?? null) : null
  );
  const terms = $derived(
    product && minParticipants != null && minParticipants >= 2
      ? departureTerms(product.lines, product.marginPct, minParticipants, maxParticipants)
      : null
  );
  // A few points of the curve: the floor, every rise and the size before it, the top.
  const preview = $derived.by(() => {
    if (!terms) return [];
    const keep = new Set<number>([terms.tiers[0]?.min, terms.tiers.at(-1)?.min]);
    for (const n of terms.rising) {
      keep.add(n - 1);
      keep.add(n);
    }
    const step = Math.max(1, Math.round(terms.tiers.length / 4));
    terms.tiers.forEach((tier, i) => i % step === 0 && keep.add(tier.min));
    return terms.tiers.filter((tier) => keep.has(tier.min));
  });

  let submitting = $state(false);
  let errorMsg = $state('');

  const priceOk = $derived(
    pricing === 'product' ? !!product : unitPrice !== null && unitPrice >= 0
  );

  const valid = $derived(
    (title.trim().length > 0 || !!product) &&
      priceOk &&
      minParticipants !== null &&
      minParticipants >= 2 &&
      (maxParticipants === null || maxParticipants >= (minParticipants ?? 2)) &&
      signDeadline !== '' &&
      new Date(signDeadline).getTime() > Date.now()
  );

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!valid || submitting) return;
    submitting = true;
    errorMsg = '';
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'createMaagadOffer',
          params: {
            maagadId,
            title: title.trim() || undefined,
            description: description.trim() || undefined,
            // A departure sends no price: the server derives it from the BOM.
            ...(product
              ? { matanotId: product.id, proposerProjectId: product.projectId }
              : { unitPrice }),
            minParticipants,
            maxParticipants: maxParticipants ?? undefined,
            signDeadline: new Date(signDeadline).toISOString(),
            recurrence,
            cancellationTerms: cancellationTerms.trim() || undefined
          }
        })
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || json?.message || 'failed');
      }
      onDone?.(json?.data?.offerId ?? '');
    } catch (e: any) {
      errorMsg = e?.message || String(e);
    } finally {
      submitting = false;
    }
  }
</script>

<form class="offer-form" onsubmit={submit}>
  <h3>{$t('demand.offer_form_title')}</h3>

  <div class="pricing" role="radiogroup" aria-label={$t('demand.field_price')}>
    <button
      type="button"
      role="radio"
      aria-checked={pricing === 'fixed'}
      class:on={pricing === 'fixed'}
      onclick={() => (pricing = 'fixed')}
    >
      {$t('pooling.departure.fixedPrice')}
    </button>
    <button
      type="button"
      role="radio"
      aria-checked={pricing === 'product'}
      class:on={pricing === 'product'}
      onclick={() => (pricing = 'product')}
    >
      {$t('pooling.departure.fromProduct')}
    </button>
  </div>

  {#if pricing === 'product'}
    {#if products.length === 0}
      <p class="hint">{$t('pooling.departure.noProducts')}</p>
    {:else}
      <label>
        <span>{$t('pooling.departure.pickProduct')} *</span>
        <select bind:value={productId}>
          <option value="">—</option>
          {#each products as p (p.id)}
            <option value={p.id}>{p.name} · {p.projectName}</option>
          {/each}
        </select>
      </label>
      <p class="hint">{$t('pooling.departure.priceDerived')}</p>
    {/if}
  {/if}

  <label>
    <span>{$t('demand.field_title')} {product ? '' : '*'}</span>
    <input
      type="text"
      bind:value={title}
      required={!product}
      maxlength="120"
      placeholder={product?.name ?? ''}
    />
  </label>

  <label>
    <span>{$t('demand.field_desc')}</span>
    <textarea bind:value={description} rows="3"></textarea>
  </label>

  <div class="grid2">
    {#if pricing === 'fixed'}
      <label>
        <span>{$t('demand.field_price')} *</span>
        <input type="number" bind:value={unitPrice} min="0" step="0.01" required />
      </label>
    {/if}
    <label>
      <span>{$t('demand.field_deadline')} *</span>
      <input type="datetime-local" bind:value={signDeadline} required />
    </label>
    <label>
      <span>{$t('demand.field_min')} *</span>
      <input type="number" bind:value={minParticipants} min="2" step="1" required />
    </label>
    <label>
      <span>{$t('demand.field_max')}</span>
      <input type="number" bind:value={maxParticipants} min={minParticipants ?? 2} step="1" />
    </label>
  </div>

  {#if terms && product}
    <div class="curve">
      <div class="curve-head">
        <span>{$t('pooling.departure.ceilingShown')}</span>
        <strong><Money amount={terms.envelope} currency={product.currencyCode} /></strong>
      </div>
      <table>
        <caption>{$t('pooling.departure.curveTitle')}</caption>
        <thead>
          <tr>
            <th scope="col">{$t('pooling.departure.participants')}</th>
            <th scope="col">{$t('pooling.departure.pricePer')}</th>
          </tr>
        </thead>
        <tbody>
          {#each preview as p (p.min)}
            <tr class:rise={terms.rising.includes(p.min)}>
              <td>{p.min}</td>
              <td><Money amount={p.price} currency={product.currencyCode} /></td>
            </tr>
          {/each}
        </tbody>
      </table>
      {#each terms.rising as n (n)}
        <p class="warn">{$t('pooling.departure.riseWarn', { count: n })}</p>
      {/each}
    </div>
  {/if}

  <label>
    <span>{$t('demand.field_recurrence')}</span>
    <select bind:value={recurrence}>
      <option value="one_time">{$t('demand.rec_one_time')}</option>
      <option value="weekly">{$t('demand.rec_weekly')}</option>
      <option value="biweekly">{$t('demand.rec_biweekly')}</option>
      <option value="monthly">{$t('demand.rec_monthly')}</option>
    </select>
  </label>

  <label>
    <span>{$t('demand.field_cancellation')}</span>
    <textarea bind:value={cancellationTerms} rows="2" placeholder={$t('demand.cancellation_ph')}></textarea>
  </label>

  {#if errorMsg}
    <p class="error">{errorMsg}</p>
  {/if}

  <div class="actions">
    <button type="submit" class="primary" disabled={!valid || submitting}>
      {submitting ? '…' : $t('demand.submit_offer')}
    </button>
    {#if onCancel}
      <button type="button" class="ghost" onclick={() => onCancel?.()}>
        {$t('demand.cancel')}
      </button>
    {/if}
  </div>
</form>

<style>
  .offer-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: rgba(120, 120, 160, 0.07);
    border: 1px solid rgba(120, 120, 160, 0.2);
    border-radius: 1rem;
    padding: 1rem;
  }
  h3 {
    font-weight: 700;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.85rem;
  }
  input,
  textarea,
  select {
    border: 1px solid rgba(120, 120, 160, 0.3);
    border-radius: 0.6rem;
    padding: 0.45rem 0.6rem;
    background: white;
    /* Its own ink: the page text is light in dark mode, and the field stays white. */
    color: #1f1b2e;
    font: inherit;
  }
  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
  }
  @media (max-width: 560px) {
    .grid2 {
      grid-template-columns: 1fr;
    }
  }
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  .primary {
    background: #7c3aed;
    color: white;
    border: none;
    border-radius: 9999px;
    padding: 0.5rem 1.25rem;
    cursor: pointer;
    font-weight: 600;
  }
  .primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .ghost {
    background: transparent;
    border: 1px solid rgba(120, 120, 160, 0.35);
    border-radius: 9999px;
    padding: 0.5rem 1.1rem;
    cursor: pointer;
  }
  .error {
    color: #dc2626;
    font-size: 0.85rem;
  }
  .pricing {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .pricing button {
    background: transparent;
    border: 1px solid rgba(120, 120, 160, 0.35);
    border-radius: 9999px;
    padding: 0.3rem 0.9rem;
    cursor: pointer;
    font: inherit;
    font-size: 0.85rem;
  }
  .pricing button.on {
    border-color: #7c3aed;
    background: rgba(124, 58, 237, 0.1);
    font-weight: 600;
  }
  .hint {
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.45;
    opacity: 0.8;
  }
  .curve {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    border: 1px dashed rgba(120, 120, 160, 0.35);
    border-radius: 0.75rem;
    padding: 0.6rem 0.75rem;
    font-size: 0.85rem;
  }
  .curve-head {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .curve table {
    width: 100%;
    border-collapse: collapse;
  }
  .curve caption {
    text-align: start;
    font-size: 0.8rem;
    opacity: 0.75;
    padding-bottom: 0.2rem;
  }
  .curve th {
    text-align: start;
    font-weight: 600;
    padding: 0.15rem 0.25rem;
  }
  .curve td {
    padding: 0.15rem 0.25rem;
    border-top: 1px solid rgba(120, 120, 160, 0.2);
  }
  /* personal is dark in both modes; business is light (7:1 / 6:1). */
  .curve tr.rise td,
  .warn {
    color: #f472b6;
  }
  :global(html.business) .curve tr.rise td,
  :global(html.business) .warn {
    color: #be185d;
  }
  .warn {
    margin: 0;
    font-size: 0.8rem;
  }
</style>
