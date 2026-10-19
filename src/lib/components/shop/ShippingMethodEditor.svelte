<script lang="ts">
  /**
   * One delivery method of a zone (PLAN_SHOP_SHIPPING §2): the price people
   * expect to see first — base fee, free over, how long — and the rest
   * (per item, per kg, tiers, minimum, weight cap, weekdays) one tap away.
   */
  import { t, locale } from '$lib/translations';
  import type { ShippingMethod, TierBasis } from '$lib/shop/shipping';

  let { method = $bindable(), onremove }: { method: ShippingMethod; onremove: () => void } = $props();

  const TIER_BASES: TierBasis[] = ['none', 'subtotal', 'weight'];
  // 2026-10-18 was a Sunday: weekday names in the reader's language, no keys.
  let weekdays = $derived(
    Array.from({ length: 7 }, (_, d) =>
      new Intl.DateTimeFormat($locale || 'he', { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 9, 18 + d)))
    )
  );
  let more = $state(
    !!(method.perItem || method.perKg || method.minSubtotal || method.maxWeightKg || method.days.length || method.tiers.length || method.note)
  );

  function toggleDay(d: number) {
    method.days = method.days.includes(d) ? method.days.filter((x) => x !== d) : [...method.days, d].sort();
  }
  function setBasis(b: TierBasis) {
    method.tiersBy = b;
    if (b !== 'none' && method.tiers.length === 0) method.tiers = [{ from: 0, fee: method.fee }];
  }
</script>

<div class="me">
  <div class="me-row">
    <label class="sh-field me-grow">
      {$t('shop.ship.methodName')}
      <input class="sh-input" bind:value={method.name} maxlength="80" placeholder={$t('shop.ship.methodNamePh')} />
    </label>
    <button type="button" class="sh-btn sh-btn-quiet me-x" onclick={onremove} aria-label={$t('shop.ship.removeMethod')}>✕</button>
  </div>
  <div class="me-grid">
    <label class="sh-field">
      {$t('shop.ship.fee')}
      <input class="sh-input sh-num" type="number" min="0" step="0.01" inputmode="decimal" bind:value={method.fee} />
    </label>
    <label class="sh-field">
      {$t('shop.ship.freeOver')}
      <input class="sh-input sh-num" type="number" min="0" step="1" inputmode="decimal" bind:value={method.freeOver} />
    </label>
    <label class="sh-field">
      {$t('shop.ship.etaFrom')}
      <input class="sh-input sh-num" type="number" min="0" max="90" step="1" inputmode="numeric" bind:value={method.etaMinDays} />
    </label>
    <label class="sh-field">
      {$t('shop.ship.etaTo')}
      <input class="sh-input sh-num" type="number" min="0" max="90" step="1" inputmode="numeric" bind:value={method.etaMaxDays} />
    </label>
  </div>

  {#if !more}
    <button type="button" class="sh-btn sh-btn-quiet me-more" onclick={() => (more = true)}>{$t('shop.ship.more')}</button>
  {:else}
    <div class="me-grid">
      <label class="sh-field">
        {$t('shop.ship.perItem')}
        <input class="sh-input sh-num" type="number" min="0" step="0.01" inputmode="decimal" bind:value={method.perItem} />
      </label>
      <label class="sh-field">
        {$t('shop.ship.perKg')}
        <input class="sh-input sh-num" type="number" min="0" step="0.01" inputmode="decimal" bind:value={method.perKg} />
      </label>
      <label class="sh-field">
        {$t('shop.ship.minSubtotal')}
        <input class="sh-input sh-num" type="number" min="0" step="1" inputmode="decimal" bind:value={method.minSubtotal} />
      </label>
      <label class="sh-field">
        {$t('shop.ship.maxWeight')}
        <input class="sh-input sh-num" type="number" min="0" step="0.1" inputmode="decimal" bind:value={method.maxWeightKg} />
      </label>
    </div>

    <fieldset class="sh-field me-fs">
      <legend>{$t('shop.ship.days')}</legend>
      <div class="me-days" role="group">
        {#each weekdays as name, d (d)}
          <button type="button" class="sh-chip" class:sh-chip-accent={method.days.includes(d)} aria-pressed={method.days.includes(d)} onclick={() => toggleDay(d)}>{name}</button>
        {/each}
      </div>
      <span class="me-hint">{$t('shop.ship.daysHint')}</span>
    </fieldset>

    <fieldset class="sh-field me-fs">
      <legend>{$t('shop.ship.tiers')}</legend>
      <div class="sh-seg" role="group">
        {#each TIER_BASES as b (b)}
          <button type="button" aria-pressed={method.tiersBy === b} onclick={() => setBasis(b)}>{$t(`shop.ship.tiers_${b}`)}</button>
        {/each}
      </div>
      {#if method.tiersBy !== 'none'}
        <span class="me-hint">{$t(`shop.ship.tiersHint_${method.tiersBy}`)}</span>
        {#each method.tiers as tier, i (i)}
          <div class="me-tier">
            <label class="sh-field">
              {method.tiersBy === 'weight' ? $t('shop.ship.tierFromKg') : $t('shop.ship.tierFrom')}
              <input class="sh-input sh-num" type="number" min="0" step="0.01" inputmode="decimal" bind:value={tier.from} />
            </label>
            <label class="sh-field">
              {$t('shop.ship.tierFee')}
              <input class="sh-input sh-num" type="number" min="0" step="0.01" inputmode="decimal" bind:value={tier.fee} />
            </label>
            <button type="button" class="sh-btn sh-btn-quiet me-x" aria-label={$t('shop.ship.removeTier')} onclick={() => (method.tiers = method.tiers.filter((_, j) => j !== i))}>✕</button>
          </div>
        {/each}
        <button type="button" class="sh-btn sh-btn-quiet me-more" onclick={() => (method.tiers = [...method.tiers, { from: 0, fee: 0 }])}>{$t('shop.ship.addTier')}</button>
      {/if}
    </fieldset>

    <label class="sh-field">
      {$t('shop.ship.note')}
      <input class="sh-input" bind:value={method.note} maxlength="200" placeholder={$t('shop.ship.notePh')} />
    </label>
  {/if}
</div>

<style>
  .me {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border: 1px solid var(--sh-line);
    border-radius: var(--sh-radius-sm);
  }
  .me-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }
  .me-grow {
    flex: 1;
    min-width: 0;
  }
  .me-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  @media (min-width: 700px) {
    .me-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  .me-x {
    flex: none;
  }
  .me-more {
    align-self: flex-start;
  }
  .me-fs {
    border: 0;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .me-days {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .me-days button {
    cursor: pointer;
    border: 1px solid var(--sh-line);
  }
  .me-hint {
    color: var(--sh-muted);
    font-size: 12px;
  }
  .me-tier {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 8px;
    align-items: end;
  }
</style>
