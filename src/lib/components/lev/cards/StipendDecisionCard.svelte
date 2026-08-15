<script>
  /**
   * Lev card for a stipend proposal — pledge or program (PLAN_STIPEND §8).
   *
   * Three ways to answer, never a "no": approve the terms on the table, open a
   * discussion, or put different terms up. Countering a stipend is how a member
   * says "not at that rate" or "not that much dilution" without ending the
   * conversation.
   *
   * The card's job is to make the consequence visible before anyone signs:
   * for a program, what the budget does to *my* percentage; for a pledge, what
   * the recipient trades away for the cash.
   */
  import { t, isRtl } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import CardHeader from './CardHeader.svelte';
  import StipendCounterDrawer from '../StipendCounterDrawer.svelte';
  import { dilutionForVoter } from '$lib/stipend/decisionView.js';

  /**
   * @typedef {Object} Props
   * @property {any} stipend - the StipendDecisionView built by the extractor
   * @property {string} projectId
   * @property {string} projectName
   * @property {string} [logoSrc]
   * @property {string} [timegramaDate]
   * @property {number|null} [myTotal] - my contribution total, for the dilution line
   * @property {number|null} [rikmaTotal]
   * @property {boolean} [isFirst]
   * @property {(arg: any) => void} [onProj]
   * @property {(arg: any) => void} [onUser]
   * @property {(arg: any) => void} [onChat]
   * @property {() => void} [onDone]
   */

  /** @type {Props} */
  let {
    stipend,
    projectId,
    projectName,
    logoSrc = '',
    timegramaDate = '',
    myTotal = null,
    rikmaTotal = null,
    isFirst = false,
    onProj,
    onUser,
    onChat,
    onDone
  } = $props();

  let approving = $state(false);
  let counterOpen = $state(false);

  const mine = $derived(stipend?.myTurn !== false);
  const standing = $derived(stipend?.standing ?? {});
  const isProgram = $derived(stipend?.kind === 'stipendProgram');

  const cardType = $derived(
    isProgram ? $t('stipend.card.typeProgram') : $t('stipend.card.typePledge')
  );

  const cardTitle = $derived(
    isProgram
      ? `₪${standing.stipendRate ?? 0} / ${$t('stipend.card.hour')}`
      : `${stipend?.funderName ?? ''} → ${stipend?.recipientName ?? ''}`
  );

  // The number that must be on the ballot: what the whole budget does to my
  // share. Null when there is nothing to show — no budget, or terms that move
  // nobody, which is an answer in itself.
  const dilution = $derived(
    myTotal != null && rikmaTotal != null
      ? dilutionForVoter(stipend, Number(myTotal), Number(rikmaTotal))
      : null
  );

  const deadline = $derived(
    timegramaDate ? new Date(timegramaDate).toLocaleDateString() : ''
  );

  async function approve() {
    if (approving) return;
    approving = true;
    try {
      const res = await executeAction('voteOnDecision', {
        decisionId: stipend.decisionId,
        projectId,
        kind: stipend.kind
      });
      if (res?.success === false) throw new Error(String(res?.error ?? 'failed'));
      toast.success(
        res?.data?.consensus ? $t('stipend.toast.matured') : $t('stipend.toast.signed')
      );
      onDone?.();
    } catch (e) {
      console.error('[StipendDecisionCard] approve failed:', e);
      toast.error($t('stipend.toast.error'));
    } finally {
      approving = false;
    }
  }
</script>

<div
  onclick={toggleScrollable}
  role="button"
  tabindex="0"
  onkeypress={(e) => {
    e.key === 'Enter' && toggleScrollable();
  }}
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="{isMobileOrTablet()
    ? 'w-full h-full'
    : 'w-[90%] h-[90%]'} lg:w-[90%] {isFirst
    ? $isRtl
      ? 'boxleft'
      : 'boxright'
    : ''} flex d flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden {isScrolable.value
    ? 'shadow-glow border-glow'
    : 'shadow-lg border border-gray-100 dark:border-gray-700'} transition-all duration-300 relative"
  style:--glow-rgb="52, 211, 153"
>
  <CardHeader
    {logoSrc}
    {projectName}
    {cardType}
    {cardTitle}
    memberCount={stipend?.signerCount ?? 0}
    glowColor="teal"
    onProjectClick={() => onProj?.({ id: projectId })}
  />

  <div
    class="{isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-200 dark:bg-slate-700'} transition-all-300 flex-1 overflow-y-auto d p-4 space-y-4"
  >
    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
        {$t(`stipend.mode.${standing.mode ?? 'equity'}`)}
      </span>
      <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
        {$t('stipend.card.round', { count: stipend?.standingOrder ?? 1 })}
      </span>
      <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
        {isProgram ? $t('stipend.terms.scopeRikma') : $t('stipend.terms.scopeBilateral')}
      </span>
    </div>

    <!-- The terms, in the order a person asks about them. -->
    <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-1 text-sm">
      <p>{$t('stipend.terms.rate')}: <b>₪{standing.stipendRate ?? 0}</b></p>
      {#if standing.mode === 'equity'}
        <p>
          {$t('stipend.terms.costShare')}:
          <b>{Math.round(Number(standing.costShare ?? 1) * 100)}%</b>
          <span class="text-xs text-gray-500">
            {Number(standing.costShare ?? 1) >= 0.999
              ? $t('stipend.terms.costShareExplainFull')
              : Number(standing.costShare ?? 1) <= 0.001
                ? $t('stipend.terms.costShareExplainNone')
                : $t('stipend.terms.costShareExplainMixed')}
          </span>
        </p>
      {/if}
      {#if standing.totalCap != null}
        <p>{$t('stipend.terms.totalCap')}: <b>₪{standing.totalCap}</b></p>
      {/if}
      {#if standing.monthlyCap != null}
        <p>{$t('stipend.terms.monthlyCap')}: <b>₪{standing.monthlyCap}</b></p>
      {/if}
      {#if standing.revenueTrigger != null}
        <p class="text-xs text-gray-500">
          {$t('stipend.terms.revenueTriggerSet', { count: standing.revenueTrigger })}
        </p>
      {/if}
    </div>

    <!-- What approving does to me. Abstract percentages are how people agree to
         things they would not agree to in shekels. -->
    {#if dilution}
      <div class="rounded-xl border-2 border-teal-400/70 bg-teal-50 dark:bg-teal-900/20 p-3">
        <p class="text-xs uppercase font-bold text-teal-700 dark:text-teal-200 mb-1">
          {$t('stipend.card.dilutionTitle')}
        </p>
        {#if dilution.moves}
          <p class="text-sm text-gray-800 dark:text-gray-100">
            {$t('stipend.card.dilutionNow', { count: dilution.currentPct.toFixed(1) })}
          </p>
          <p class="text-sm font-bold text-gray-900 dark:text-white">
            {$t('stipend.card.dilutionAfter', {
              count: dilution.projectedPct.toFixed(1),
              points: dilution.deltaPoints.toFixed(1)
            })}
          </p>
        {:else}
          <p class="text-sm text-gray-800 dark:text-gray-100">
            {$t('stipend.card.dilutionNone')}
          </p>
        {/if}
      </div>
    {/if}

    {#if standing.why || stipend?.why}
      <div class="rounded-xl bg-gray-50 dark:bg-gray-900/60 p-3">
        <p class="text-xs text-gray-500 mb-1">{$t('stipend.card.reason')}</p>
        <p class="text-sm text-gray-800 dark:text-gray-200">{standing.why || stipend?.why}</p>
        {#if standing.proposedByName}
          <button
            type="button"
            class="text-xs text-gray-500 mt-2 underline"
            onclick={() => onUser?.({ id: standing.proposedById })}
          >
            {$t('stipend.card.proposedBy', { name: standing.proposedByName })}
          </button>
        {/if}
      </div>
    {/if}

    <div class="flex items-center justify-between text-xs text-gray-500">
      <span>{$t('stipend.card.signed', { count: stipend?.signedIds?.length ?? 0 })}</span>
      <span>{$t('stipend.card.awaiting', { count: stipend?.awaitingIds?.length ?? 0 })}</span>
    </div>
    {#if deadline}
      <p class="text-xs text-gray-400">{$t('stipend.card.autoApprove')} · {deadline}</p>
    {/if}
  </div>

  <div
    class="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex gap-2"
  >
    <button
      type="button"
      onclick={() => onChat?.({ decisionId: stipend?.decisionId, projectId })}
      class="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 py-3 text-sm"
    >
      {$t('stipend.actions.chat')}
    </button>
    {#if mine}
      <button
        type="button"
        onclick={() => (counterOpen = true)}
        class="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 py-3 text-sm"
      >
        ⚖️ {$t('stipend.actions.negotiate')}
      </button>
      <button
        type="button"
        onclick={approve}
        disabled={approving}
        class="flex-[2] rounded-xl bg-gradient-to-r from-barbi to-mpink text-white font-semibold py-3 text-sm disabled:opacity-60"
      >
        {approving ? $t('stipend.actions.approving') : $t('stipend.actions.approve')}
      </button>
    {:else}
      <p class="flex-[3] self-center text-center text-sm text-gray-500 dark:text-gray-400">
        {$t('stipend.card.signedByMe')}
      </p>
    {/if}
  </div>
</div>

<StipendCounterDrawer bind:open={counterOpen} {stipend} {projectId} onSent={onDone} />

<style>
  .shadow-glow {
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06),
      0 0 20px rgba(var(--glow-rgb), 0.4),
      0 0 40px rgba(var(--glow-rgb), 0.3),
      0 0 60px rgba(var(--glow-rgb), 0.2),
      inset 0 0 20px rgba(var(--glow-rgb), 0.05);
  }

  .border-glow {
    border: 2px solid rgba(var(--glow-rgb), 0.5);
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06),
      0 0 20px rgba(var(--glow-rgb), 0.4),
      0 0 40px rgba(var(--glow-rgb), 0.3),
      0 0 60px rgba(var(--glow-rgb), 0.2),
      inset 0 0 20px rgba(var(--glow-rgb), 0.05),
      0 0 0 1px rgba(var(--glow-rgb), 0.3);
  }
</style>
