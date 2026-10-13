<script lang="ts">
  /**
   * A departure's price on its offer card — PLAN_POOL_PRODUCT §4, B9.
   *
   * "Now · at most · at N it drops to", the lines it is made of, and the note
   * that nobody signs a number here. Never "your price" before the lock: the
   * price moves with the group, inside the ceiling each participant saw.
   */
  import Money from '$lib/components/money/Money.svelte';
  import { t } from '$lib/translations';
  import { departureReadout, lineTag, type DepartureLine, type PriceTier } from '$lib/pooling/departure';

  type Props = {
    tiers: PriceTier[] | null;
    envelope: number | null;
    signedCount: number;
    min: number;
    currency?: string | null;
    lines?: DepartureLine[];
    lockAt?: string | null;
  };

  let { tiers, envelope, signedCount, min, currency = null, lines = [], lockAt = null }: Props = $props();

  const readout = $derived(departureReadout(tiers, envelope, signedCount, min));
  const cur = $derived(currency ?? undefined);

  function tagOf(line: DepartureLine) {
    const { shape, capacity } = lineTag(line);
    return shape === 'stepped'
      ? $t('pooling.tag.stepped', { capacity })
      : $t(`pooling.tag.${shape}`);
  }

  function fmtDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso;
    }
  }
</script>

<div class="dep">
  <div class="dep-prices">
    {#if readout.now != null}
      <span class="dep-now">
        <span class="dep-k">{$t('pooling.departure.now')}</span>
        <strong><Money amount={readout.now} currency={cur} /></strong>
      </span>
    {/if}
    {#if readout.ceiling != null}
      <span class="dep-sep" aria-hidden="true">·</span>
      <span>
        <span class="dep-k">{$t('pooling.departure.ceiling')}</span>
        <Money amount={readout.ceiling} currency={cur} />
      </span>
    {/if}
    {#if readout.nextDrop}
      <span class="dep-sep" aria-hidden="true">·</span>
      <span>
        <span class="dep-k">{$t('pooling.departure.dropAt', { count: readout.nextDrop.min })}</span>
        <Money amount={readout.nextDrop.price} currency={cur} />
      </span>
    {/if}
  </div>

  {#if lines.length}
    <details class="dep-lines">
      <summary>{$t('pooling.departure.linesTitle')}</summary>
      <ul>
        {#each lines as line, i (i)}
          <li>
            <span>{line.name || '—'}</span>
            <span class="dep-tag">{tagOf(line)}</span>
          </li>
        {/each}
      </ul>
    </details>
  {/if}

  <p class="dep-note">{$t('pooling.departure.note')}</p>
  {#if lockAt}
    <p class="dep-note">{$t('pooling.departure.lockAt', { date: fmtDate(lockAt) })}</p>
  {/if}
</div>

<style>
  .dep {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.85rem;
  }
  .dep-prices {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.35rem;
  }
  .dep-now strong {
    font-size: 1.05rem;
  }
  .dep-k {
    opacity: 0.7;
    margin-inline-end: 0.2rem;
  }
  .dep-sep {
    opacity: 0.45;
  }
  .dep-lines summary {
    cursor: pointer;
    font-size: 0.8rem;
    opacity: 0.8;
  }
  .dep-lines ul {
    list-style: none;
    margin: 0.35rem 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .dep-lines li {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .dep-tag {
    font-size: 0.72rem;
    border: 1px solid rgba(120, 120, 160, 0.35);
    border-radius: 9999px;
    padding: 0 0.5rem;
    white-space: nowrap;
  }
  .dep-note {
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.45;
    opacity: 0.75;
  }
</style>
