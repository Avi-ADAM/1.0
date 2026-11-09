<!--
  DealRecipePanel — the rikma needs more work to make what the customer asked for
  (PLAN_PRODUCT_FORM_UNIFIED, phase 3). A version that adds to the cost waits for her
  signature. She approves it, or keeps only what she needs, with a reason.
-->
<script lang="ts">
  import Money from '$lib/components/money/Money.svelte';
  import Panel from '$lib/components/Panel.svelte';
  import { t } from '$lib/translations';
  import { termCost, type BomTerm } from '$lib/shop/bomEditor';
  import type { DealRecipeView } from '$lib/sheirut/dealEdit';

  let {
    edits,
    isCustomer = false,
    busy = false,
    onSign,
    onCounter
  }: {
    edits: DealRecipeView[];
    isCustomer?: boolean;
    busy?: boolean;
    onSign?: (decisionId: string) => void | Promise<void>;
    onCounter?: (decisionId: string, keep: number[], why: string) => void | Promise<void>;
  } = $props();

  let openFor = $state<string | null>(null);
  let keep = $state<number[]>([]);
  let why = $state('');

  function openCounter(e: DealRecipeView) {
    openFor = e.decisionId;
    keep = [];
    why = '';
  }

  function toggle(i: number) {
    keep = keep.includes(i) ? keep.filter((k) => k !== i) : [...keep, i];
  }

  async function send(e: DealRecipeView) {
    await onCounter?.(e.decisionId, keep, why.trim());
    openFor = null;
  }

  const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '');
  const label = (term: BomTerm) =>
    term.kind === 'add'
      ? $t('deals.recipe.add', { name: term.name })
      : term.kind === 'remove'
        ? $t('deals.recipe.remove', { name: term.name })
        : $t('deals.recipe.change', { name: term.name });
</script>

<Panel title={$t('deals.recipe.title')}>
  <p class="dr-explain">{$t('deals.recipe.explain')}</p>

  {#each edits as e (e.decisionId)}
    <div class="dr-item">
      {#if openFor === e.decisionId}
        <p class="dr-explain">{$t('deals.recipe.keepHint')}</p>
      {/if}
      {#each e.terms as term, i (i)}
        <div class="dr-row">
          {#if openFor === e.decisionId}
            <label class="dr-keep">
              <input type="checkbox" checked={keep.includes(i)} onchange={() => toggle(i)} />
              <span dir="auto">{label(term)}</span>
            </label>
          {:else}
            <span dir="auto">{label(term)}</span>
          {/if}
          {#if term.kind !== 'remove'}<span><Money amount={termCost(term)} /></span>{/if}
        </div>
      {/each}
      {#if e.raise > 0}
        <div class="dr-raise">{$t('deals.recipe.raise')} <Money amount={e.raise} /></div>
      {/if}

      <p class="dr-status">
        {#if !e.needsCustomer}
          {$t('deals.edit.noRaise')}
        {:else if e.customersPending.length > 0}
          {isCustomer && !e.viewerSigned ? $t('deals.edit.waitsForYou') : $t('deals.edit.waitsForCustomer')}
        {:else if e.membersPending.length > 0 && !e.membersMatured}
          {$t('deals.edit.waitsForRikma', { when: fmtDate(e.deadline) })}
        {:else}
          {$t('deals.edit.applying')}
        {/if}
      </p>

      {#if isCustomer && e.needsCustomer && !e.viewerSigned}
        {#if openFor === e.decisionId}
          <label class="dr-why">
            <span>{$t('deals.edit.why')}</span>
            <textarea rows="2" bind:value={why} placeholder={$t('deals.edit.whyPh')}></textarea>
          </label>
          <div class="dr-actions">
            <button class="dr-btn primary" disabled={busy || why.trim().length < 8 || keep.length === e.terms.length} onclick={() => send(e)}>
              {$t('deals.edit.send')}
            </button>
            <button class="dr-btn" disabled={busy} onclick={() => (openFor = null)}>{$t('deals.edit.back')}</button>
          </div>
        {:else}
          <div class="dr-actions">
            <button class="dr-btn primary" disabled={busy} onclick={() => onSign?.(e.decisionId)}>{$t('deals.edit.approve')}</button>
            <button class="dr-btn" disabled={busy} onclick={() => openCounter(e)}>{$t('deals.edit.counter')}</button>
          </div>
        {/if}
      {/if}
    </div>
  {/each}
</Panel>

<style>
  .dr-explain { font-size: 12px; color: var(--gold); line-height: 1.5; margin: 0 0 12px; }
  .dr-item { padding: 12px 0; border-bottom: 1px solid var(--border); }
  .dr-item:last-child { border-bottom: none; }
  .dr-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 13px; color: var(--gold-l); padding: 3px 0; }
  .dr-keep { display: flex; align-items: center; gap: 8px; min-height: 44px; }
  .dr-raise { font-size: 12px; font-weight: 700; color: var(--pink-l); margin-top: 2px; }
  .dr-status { font-size: 11px; color: var(--gold-l); margin: 8px 0 0; }
  .dr-why { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: var(--gold); margin-top: 10px; }
  .dr-why textarea {
    background: var(--s3);
    color: var(--text);
    border: 1px solid var(--border-g);
    border-radius: 8px;
    padding: 6px 8px;
    font-size: 13px;
    font-family: inherit;
  }
  .dr-actions { display: flex; gap: 8px; margin-top: 10px; }
  .dr-btn {
    flex: 1;
    min-height: 44px;
    border-radius: 10px;
    border: 1px solid var(--border-g);
    background: transparent;
    color: var(--gold-l);
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
  }
  .dr-btn.primary { background: linear-gradient(135deg, var(--pink), var(--pink-l)); border: none; color: #fff; }
  .dr-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
