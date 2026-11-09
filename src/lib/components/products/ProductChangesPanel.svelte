<script lang="ts">
  /** Beside the form while editing: what already waits for the rikma, and what this save will send it. */
  import { t, locale } from '$lib/translations';
  import { clock } from '$lib/stores/clock.svelte';
  import { formatWhen } from '$lib/time/formatWhen';
  import type { DetailTerms, EditorProduct } from '$lib/shop/productEditor';
  import type { SavePlan } from '$lib/shop/variantEditor';
  import { bomAssignees, termCost, termCostBefore, type BomTerm } from '$lib/shop/bomEditor';
  import BomApproval from './BomApproval.svelte';
  import { executeAction } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';

  let {
    projectId,
    product,
    plan,
    details,
    bom,
    base,
    baseMoves,
    proposing,
    why = $bindable(''),
    money,
    viewerId = '',
    onChanged
  }: {
    projectId: string;
    product: EditorProduct;
    plan: SavePlan;
    details: DetailTerms;
    bom: BomTerm[];
    base: number | null;
    baseMoves: boolean;
    proposing: boolean;
    why?: string;
    money: (n: number | null) => string;
    viewerId?: string;
    onChanged?: () => unknown;
  } = $props();

  let releasing = $state(false);

  let approval = $state<ReturnType<typeof BomApproval>>();
  let mustSign = $derived(
    !!viewerId && bomAssignees(product.pending?.bom).includes(viewerId) && !(product.pending?.signedIds ?? []).includes(viewerId)
  );

  async function approved() {
    toast.success($t('shopEditor.pending.bomApproved'));
    await onChanged?.();
  }

  async function release(decisionId: string, index: number) {
    if (releasing) return;
    releasing = true;
    const res: any = await executeAction('releaseBomAssignment' as any, { decisionId, indexes: [index] }, { showErrorToast: false }).catch(() => null);
    releasing = false;
    if (!res?.success) {
      toast.error($t('shopEditor.err.generic'));
      return;
    }
    toast.success($t('shopEditor.pending.bomReleased'));
    await onChanged?.();
  }

  let deadlineWhen = $derived(
    product.pending?.deadline ? (formatWhen(product.pending.deadline, clock.minutes, $locale || 'he')?.short ?? '') : ''
  );
  let detailsMove = $derived(Object.keys(details).length > 0);
</script>

{#snippet bomTerms(terms: BomTerm[], decisionId: string | null = null)}
  {#each terms as term, k (k)}
    <li>
      {#if term.kind === 'add'}
        {$t('shopEditor.pending.bomAdd', { name: term.name, cost: money(termCost(term)) })}
        {#if term.assigneeName}· {$t('shopEditor.pending.bomOwner', { name: term.assigneeName })}{/if}
        {#if decisionId && term.assignedMemberId}
          <button type="button" class="cp-release" disabled={releasing} onclick={() => release(decisionId, k)}>
            {term.assignedMemberId === viewerId ? $t('shopEditor.pending.bomReleaseMine') : $t('shopEditor.pending.bomRelease')}
          </button>
        {/if}
      {:else if term.kind === 'remove'}
        {$t('shopEditor.pending.bomRemove', { name: term.name })}
      {:else}
        {$t('shopEditor.pending.bomChange', { name: term.name, from: money(termCostBefore(term)), to: money(termCost(term)) })}
      {/if}
    </li>
  {/each}
{/snippet}

{#if product.pending}
  {@const p = product.pending}
  <section class="sh-card cp-card cp-gold" aria-labelledby="cp-pending">
    <h3 id="cp-pending" class="sh-section-label cp-title">{$t('shopEditor.pending.title')}</h3>
    <ul class="cp-terms">
      {#if p.basePrice !== null}
        <li>{$t('shopEditor.pending.base', { from: money(product.price), to: money(p.basePrice) })}</li>
      {/if}
      {#if p.details?.name}<li>{$t('shopEditor.pending.name', { name: p.details.name })}</li>{/if}
      {#if p.details?.descrip}<li>{$t('shopEditor.pending.descrip')}</li>{/if}
      {#if p.details?.kindOf}<li>{$t('shopEditor.pending.kindOf', { kind: $t(`shopEditor.details.kind.${p.details.kindOf}`) })}</li>{/if}
      {#if p.details?.startDate || p.details?.endDate}<li>{$t('shopEditor.pending.period')}</li>{/if}
      {#each p.terms as term, k (k)}
        <li>
          {#if term.kind === 'price'}
            {$t('shopEditor.pending.price', { name: term.name, from: money(term.from), to: money(term.to) })}
          {:else}
            {$t('shopEditor.pending.create', { name: term.name })}
          {/if}
        </li>
      {/each}
      {@render bomTerms(p.bom ?? [], p.decisionId)}
    </ul>
    {#if mustSign}
      <button type="button" class="sh-btn" disabled={releasing} onclick={() => approval?.start()}>{$t('shopEditor.pending.bomApprove')}</button>
    {/if}
    <p class="cp-muted">{$t('shopEditor.pending.buyers')}</p>
    {#if deadlineWhen}<p class="cp-muted">{$t('shopEditor.pending.silence', { when: deadlineWhen })}</p>{/if}
    <div class="cp-foot">
      <span class="cp-muted">{$t('shopEditor.pending.signed', { signed: p.signed, members: p.members })}</span>
      <a href="/moach/{projectId}/votes/decision/{p.decisionId}">{$t('shopEditor.pending.vote')}</a>
    </div>
  </section>
{/if}

{#if product.pending}
  <BomApproval bind:this={approval} terms={product.pending.bom ?? []} {viewerId} {projectId} decisionId={product.pending.decisionId} onSigned={approved} />
{/if}

{#if proposing}
  <section class="sh-card cp-card cp-gold" aria-labelledby="cp-propose">
    <h3 id="cp-propose" class="sh-section-label cp-title">{$t('shopEditor.propose.title')}</h3>
    <ul class="cp-terms">
      {#if baseMoves}
        <li>{$t('shopEditor.pending.base', { from: money(product.price), to: money(base) })}</li>
      {/if}
      {#if details.name}<li>{$t('shopEditor.pending.name', { name: details.name })}</li>{/if}
      {#if details.descrip !== undefined}<li>{$t('shopEditor.pending.descrip')}</li>{/if}
      {#if details.kindOf}<li>{$t('shopEditor.pending.kindOf', { kind: $t(`shopEditor.details.kind.${details.kindOf}`) })}</li>{/if}
      {#if details.sqadualed !== undefined || details.sqadualedf !== undefined}<li>{$t('shopEditor.pending.period')}</li>{/if}
      {#each plan.terms as term, k (k)}
        <li>
          {#if term.kind === 'price'}
            {$t('shopEditor.pending.price', { name: term.name, from: money(term.from), to: money(term.to) })}
          {:else}
            {$t('shopEditor.pending.create', { name: term.name })}
          {/if}
        </li>
      {/each}
      {@render bomTerms(bom)}
    </ul>
    <p class="cp-muted">{$t('shopEditor.propose.hint')}</p>
    <label class="sh-field">
      {$t('shopEditor.propose.why')}
      <textarea class="sh-input" bind:value={why} maxlength="500" placeholder={$t('shopEditor.propose.whyPlaceholder')}></textarea>
    </label>
  </section>
{:else if product.sovereign && (plan.terms.length || baseMoves || plan.creates.length || detailsMove || bom.length)}
  <p class="cp-sovereign">{product.origin === 'personal' ? $t('shopEditor.propose.personal') : $t('shopEditor.propose.alone')}</p>
{/if}

<style>
  .cp-release {
    display: block;
    min-height: 44px;
    background: none;
    border: 0;
    padding: 0;
    font: inherit;
    font-weight: 700;
    color: var(--sh-accent-ink);
    text-decoration: underline;
    cursor: pointer;
  }
  .cp-card {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .cp-gold {
    border-color: var(--sh-gold-line);
  }
  .cp-title {
    margin: 0;
    color: var(--sh-gold);
  }
  .cp-muted {
    margin: 0;
    font-size: 13px;
    color: var(--sh-muted);
  }
  .cp-sovereign {
    margin: 0;
    padding: 0 4px;
    font-size: 13px;
    color: #e9dfe4;
  }
  .cp-terms {
    margin: 0;
    padding-inline-start: 18px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
    color: var(--sh-ink);
  }
  .cp-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }
  .cp-foot a {
    font-weight: 700;
    color: var(--sh-gold);
  }
</style>
