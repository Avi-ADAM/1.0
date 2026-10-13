<script lang="ts">
  /**
   * How one BOM line behaves when the product is bought by a group —
   * PLAN_POOL_PRODUCT §3.1. null stays null (legacy = perUnit) until the
   * seller picks something else, so an untouched row saves exactly as before.
   */
  import { t } from '$lib/translations';
  import type { CostShape } from '$lib/pooling/priceCurve';

  type Props = {
    costShape?: CostShape | null;
    stepCapacity?: number | null;
  };

  // No fallbacks: a row built before this field existed binds `undefined`, and
  // a bindable prop with a fallback refuses that (props_invalid_value).
  let { costShape = $bindable(), stepCapacity = $bindable() }: Props = $props();

  const shape = $derived<CostShape>(costShape ?? 'perUnit');

  function pick(next: CostShape) {
    costShape = next === 'perUnit' ? null : next;
    if (next === 'stepped' && !(Number(stepCapacity) > 1)) stepCapacity = 2;
  }

  const hint = $derived(
    shape === 'shared'
      ? $t('pooling.costShape.sharedHint')
      : shape === 'stepped'
        ? $t('pooling.costShape.steppedHint', { capacity: stepCapacity ?? 2 })
        : $t('pooling.costShape.perUnitHint')
  );
</script>

<div class="cs">
  <span class="cs-label">{$t('pooling.costShape.label')}</span>
  <div class="cs-opts" role="radiogroup" aria-label={$t('pooling.costShape.label')}>
    {#each ['perUnit', 'shared', 'stepped'] as const as opt (opt)}
      <button
        type="button"
        role="radio"
        aria-checked={shape === opt}
        class:on={shape === opt}
        onclick={() => pick(opt)}
      >
        {$t(`pooling.costShape.${opt}`)}
      </button>
    {/each}
    {#if shape === 'stepped'}
      <label class="cs-cap">
        <input
          type="number"
          min="2"
          step="1"
          bind:value={stepCapacity}
          aria-label={$t('pooling.costShape.stepCapacity')}
        />
        <span>{$t('pooling.costShape.stepCapacity')}</span>
      </label>
    {/if}
  </div>
  <p class="cs-hint">{hint}</p>
</div>

<style>
  .cs {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 6px;
  }
  .cs-label {
    font-size: 0.75rem;
    color: var(--gold-l, #f1c47a);
    font-weight: 600;
  }
  .cs-opts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
  .cs-opts button {
    background: transparent;
    color: var(--text, #f4ecd6);
    border: 1px solid var(--border, #3b3540);
    border-radius: 99px;
    padding: 3px 10px;
    font-size: 0.78rem;
    cursor: pointer;
  }
  .cs-opts button.on {
    border-color: var(--gold, #d8a64b);
    color: var(--gold-l, #f1c47a);
    background: rgba(216, 166, 75, 0.12);
  }
  .cs-cap {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    color: var(--text, #f4ecd6);
  }
  .cs-cap input {
    width: 4.5rem;
    background: var(--bg-22, #403151);
    color: var(--text, #f4ecd6);
    border: 1px solid var(--border, #3b3540);
    border-radius: 6px;
    padding: 3px 6px;
  }
  .cs-hint {
    margin: 0;
    font-size: 0.72rem;
    line-height: 1.45;
    color: var(--text, #f4ecd6);
    opacity: 0.8;
  }
</style>
