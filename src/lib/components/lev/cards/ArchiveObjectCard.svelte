<script>
  /**
   * Lev card for an archive / edit proposal (PLAN_OBJECT_ARCHIVAL — phase 2).
   *
   * Three ways to answer, never a "no": approve the version on the table,
   * open a discussion, or put a different version up — which for a removal
   * proposal means proposing to keep the object with changed terms.
   *
   * The card's job is to make the cost visible before anyone signs: what
   * happens to accrued hours, and whether approving also ends someone's
   * membership of the rikma.
   */
  import { t, isRtl } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import CardHeader from './CardHeader.svelte';
  import NegoArchive from '../negoArchive.svelte';

  /**
   * @typedef {Object} Props
   * @property {any} archive - the ArchiveDecisionView built by the extractor
   * @property {string} projectId
   * @property {string} projectName
   * @property {string} [logoSrc]
   * @property {number} [memberCount]
   * @property {string} [timegramaDate]
   * @property {boolean} [isFirst]
   * @property {(arg: any) => void} [onProj]
   * @property {(arg: any) => void} [onUser]
   * @property {(arg: any) => void} [onChat]
   * @property {() => void} [onDone]
   */

  /** @type {Props} */
  let {
    archive,
    projectId,
    projectName,
    logoSrc = '',
    memberCount = 0,
    timegramaDate = '',
    isFirst = false,
    onProj,
    onUser,
    onChat,
    onDone
  } = $props();

  let approving = $state(false);
  let negoOpen = $state(false);

  // On the heart a card only exists while it is my move. A focused vote page
  // (or the member who opened the proposal) can also land on one I have
  // already signed — then it is a status view: the chat stays open, but there
  // is nothing left for me to approve or counter until someone else moves.
  const mine = $derived(archive?.myTurn !== false);
  const standing = $derived(archive?.standing ?? {});
  const isKeep = $derived(standing.mode === 'keep');
  const isRelease = $derived(archive?.scope === 'release');
  const hasHours = $derived(Number(archive?.accruedHours ?? 0) > 0);

  const cardType = $derived(
    archive?.kind === 'editObject'
      ? $t('archive.card.typeEdit')
      : isRelease
        ? $t('archive.card.typeRelease')
        : $t('archive.card.typeArchive')
  );

  /** What approving actually does, in one line. */
  const outcomeLine = $derived(
    isKeep
      ? $t('archive.card.keepMode')
      : isRelease
        ? $t('archive.card.releaseMode')
        : $t('archive.card.archiveMode')
  );

  const targetLabel = $derived($t(`archive.card.target.${archive?.targetKind}`));

  // Same two colours the header glows with — keeping the object reads teal,
  // removing it reads orange.
  const glowColor = $derived(isKeep ? 'teal' : 'orange');
  const glowRgb = $derived(isKeep ? '20, 184, 166' : '254, 172, 49');

  const deadline = $derived(
    timegramaDate ? new Date(timegramaDate).toLocaleDateString() : ''
  );

  async function approve() {
    if (approving) return;
    approving = true;
    try {
      const res = await executeAction('voteOnDecision', {
        decisionId: archive.decisionId,
        projectId,
        kind: archive.kind
      });
      if (res?.success === false) throw new Error(String(res?.error ?? 'failed'));
      toast.success(
        res?.data?.consensus ? $t('archive.toast.matured') : $t('archive.toast.approved')
      );
      onDone?.();
    } catch (e) {
      console.error('[ArchiveObjectCard] approve failed:', e);
      toast.error($t('archive.toast.error'));
    } finally {
      approving = false;
    }
  }
</script>

<!--
  Card shell — the shared lev convention (see docs/LEV_CARD_CONVENTIONS.md):
  the slide centres its child, so the card must claim its own 90%/full size;
  a click toggles `isScrolable`, which both frees inner scrolling (Swiper stops
  eating the wheel) and moves the glow onto this card.
-->
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
  style:--glow-rgb={glowRgb}
>
  <CardHeader
    {logoSrc}
    {projectName}
    {cardType}
    cardTitle={archive?.targetName ?? ''}
    memberCount={memberCount || archive?.memberCount || 0}
    {glowColor}
    onProjectClick={() => onProj?.({ id: projectId })}
  />

  <div
    class="{isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-200 dark:bg-slate-700'} transition-all-300 flex-1 overflow-y-auto d p-4 space-y-4"
  >
    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
        {targetLabel}
      </span>
      <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
        {$t('archive.card.round', { count: archive?.standingOrder ?? 1 })}
      </span>
      {#if archive?.source === 'dormancy'}
        <span class="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
          {$t('archive.card.byDormancy')}
        </span>
      {/if}
    </div>

    <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">{outcomeLine}</p>

    <!-- The reason. A removal that touches accrued work must carry one. -->
    <div class="rounded-xl bg-gray-50 dark:bg-gray-900/60 p-3">
      <p class="text-xs text-gray-500 mb-1">{$t('archive.card.reason')}</p>
      <p class="text-sm text-gray-800 dark:text-gray-200">
        {standing.why || archive?.why || $t('archive.card.noReason')}
      </p>
      {#if standing.proposedByName}
        <button
          type="button"
          class="text-xs text-gray-500 mt-2 underline"
          onclick={() => onUser?.({ id: standing.proposedById })}
        >
          {$t('archive.card.proposedBy', { name: standing.proposedByName })}
        </button>
      {/if}
    </div>

    <!-- Approving is not free: this is what happens to the work already done. -->
    {#if hasHours}
      <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
        <p class="text-xs text-gray-500 mb-1">{$t('archive.hours.title')}</p>
        <p class="text-sm text-gray-800 dark:text-gray-200">
          {$t('archive.hours.accrued', { count: archive.accruedHours })}
        </p>
        {#if !isKeep && standing.hoursOutcome}
          <p class="text-sm font-semibold mt-1 text-gray-900 dark:text-gray-100">
            {$t(`archive.hours.${standing.hoursOutcome}`)}
            {#if standing.hoursOutcome === 'credit' && standing.hoursToCredit != null}
              — {$t('archive.hours.creditAmount', { count: standing.hoursToCredit })}
            {/if}
          </p>
          {#if standing.hoursOutcome === 'transfer' && standing.transferToName}
            <p class="text-xs text-gray-500">
              {$t('archive.hours.transferTo', { name: standing.transferToName })}
            </p>
          {/if}
          {#if standing.hoursOutcome === 'endOfCycle' && standing.effectiveFrom}
            <p class="text-xs text-gray-500">
              {$t('archive.hours.effectiveFrom', {
                date: new Date(standing.effectiveFrom).toLocaleDateString()
              })}
            </p>
          {/if}
        {/if}
      </div>
    {/if}

    <!-- Removing a person from a rikma must never be discovered afterwards. -->
    {#if archive?.endsMembership}
      <div class="rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/30 p-3">
        <p class="text-sm font-bold text-amber-900 dark:text-amber-100">
          {$t('archive.membership.warning', {
            name: archive.memberName || archive.ownerName || ''
          })}
        </p>
        <p class="text-xs text-amber-800 dark:text-amber-200 mt-1">
          {$t('archive.membership.explain')}
        </p>
      </div>
    {/if}

    <!-- The standing version, with the original beside it once they differ. -->
    {#if isKeep}
      <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-1">
        <p class="text-xs text-gray-500">{$t('archive.card.standing')}</p>
        {#if standing.name}<p class="text-sm">{standing.name}</p>{/if}
        {#if standing.hm != null}
          <p class="text-sm">{$t('archive.nego.hm')}: {standing.hm}</p>
        {/if}
        {#if standing.price != null}
          <p class="text-sm">{$t('archive.nego.price')}: {standing.price}</p>
        {/if}
      </div>
    {/if}

    <div class="flex items-center justify-between text-xs text-gray-500">
      <span>{$t('archive.card.signed', { count: archive?.signedIds?.length ?? 0 })}</span>
      <span>{$t('archive.card.awaiting', { count: archive?.awaitingIds?.length ?? 0 })}</span>
    </div>
    {#if deadline}
      <p class="text-xs text-gray-400">{$t('archive.card.autoApprove')} · {deadline}</p>
    {/if}
  </div>

  <div
    class="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex gap-2"
  >
    <button
      type="button"
      onclick={() => onChat?.({ decisionId: archive?.decisionId, projectId })}
      class="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 py-3 text-sm"
    >
      {$t('archive.actions.chat')}
    </button>
    {#if mine}
      <button
        type="button"
        onclick={() => (negoOpen = true)}
        class="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 py-3 text-sm"
        title={$t('archive.actions.negotiate')}
      >
        ⚖️ {$t('archive.actions.negotiate')}
      </button>
      <button
        type="button"
        onclick={approve}
        disabled={approving}
        class="flex-[2] rounded-xl bg-gradient-to-r from-barbi to-mpink text-white font-semibold py-3 text-sm disabled:opacity-60"
      >
        {approving ? $t('archive.actions.approving') : $t('archive.actions.approve')}
      </button>
    {:else}
      <p class="flex-[3] self-center text-center text-sm text-gray-500 dark:text-gray-400">
        {$t('archive.card.signedByMe')}
      </p>
    {/if}
  </div>
</div>

<NegoArchive bind:open={negoOpen} {archive} {projectId} onSent={onDone} />

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
