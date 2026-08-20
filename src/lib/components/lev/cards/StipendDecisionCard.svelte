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
  import { getProjectValueSummary } from '$lib/equity/projectValueStore.svelte.js';
  import { getMemberValueTotal } from '$lib/equity/memberValueStore.svelte.js';

  /**
   * @typedef {Object} Props
   * @property {any} stipend - the StipendDecisionView built by the extractor
   * @property {string} projectId
   * @property {string} projectName
   * @property {string} [logoSrc]
   * @property {string} [timegramaDate]
   * @property {number|null} [myTotal] - my contribution total, for the dilution
   *   line. Left out by every call site on purpose: the card fetches both
   *   numbers itself (cached + deduped) rather than making the heart and the
   *   moach vote page each thread an equity payload they have no other use for.
   * @property {number|null} [rikmaTotal]
   * @property {string} [myId] - the viewer, for the "my share" numerator
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
    myId = '',
    isFirst = false,
    onProj,
    onUser,
    onChat,
    onDone
  } = $props();

  let approving = $state(false);
  let counterOpen = $state(false);

  // The discussion hangs off the Decision itself (`Decision.forums`), created
  // on first use by `ensureVoteForum` — the same path the saleClaim and
  // pendm/pmash cards take. Handing the page a bare `{ decisionId }` dropped it
  // into its no-payload fallback, which is a chat that opens on nothing.
  let forumId = $state(null);
  let openingChat = $state(false);

  async function openChat() {
    if (openingChat) return;
    openingChat = true;
    try {
      if (!forumId) {
        const res = await executeAction('ensureVoteForum', {
          entityType: 'decision',
          entityId: String(stipend?.decisionId),
          projectId: String(projectId)
        });
        if (res?.success) forumId = res.data?.forumId ?? null;
      }
      if (forumId) {
        onChat?.({
          forumId: String(forumId),
          decisionId: stipend?.decisionId,
          projectId
        });
      } else {
        toast.error($t('stipend.toast.error'));
      }
    } catch (e) {
      console.error('[StipendDecisionCard] opening the chat failed:', e);
      toast.error($t('stipend.toast.error'));
    } finally {
      openingChat = false;
    }
  }

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

  // Who pays and who receives, spelled out rather than implied by the title.
  // A member asked to approve "₪20 an hour" without being told that *they* are
  // the one paying it has not been asked anything.
  const funderLabel = $derived(
    stipend?.funderName || (stipend?.seekingFunder ? $t('stipend.card.noFunderYet') : '—')
  );
  // A stipend *should* name the person it is for; when it does not, say why.
  // There are two different reasons, and they mean different things: the work
  // is still open and waiting for a taker, or the rikma is approving a budget
  // before there is anyone to spend it on.
  const awaitingTaker = $derived((stipend?.missions ?? []).some((m) => m.kind === 'open'));
  const recipientLabel = $derived(
    stipend?.recipientName ||
      (awaitingTaker
        ? $t('stipend.card.noTakerYet')
        : isProgram
          ? $t('stipend.card.noRecipientYet')
          : '—')
  );

  /** No closed budget: it renews every month until somebody stops it. */
  const openEnded = $derived(stipend?.openEnded === true);

  // What approving costs *me*, in the currency of my own role: shekels for the
  // funder, share for everyone else.
  const monthlyCommitment = $derived(
    standing.monthlyCap != null && Number(standing.monthlyCap) > 0
      ? Number(standing.monthlyCap)
      : null
  );

  const missions = $derived(stipend?.missions ?? []);

  // The number that must be on the ballot: what the budget does to my share.
  // Both inputs are fetched here (cached module-side, so N cards on the heart
  // make one request each) unless a caller passed them in.
  let fetchedMyTotal = $state(/** @type {number|null} */ (null));
  let fetchedRikmaTotal = $state(/** @type {number|null} */ (null));

  const viewerId = $derived(String(myId || stipend?.myId || ''));

  $effect(() => {
    // No viewer id means no "my share" to compute — and `uid: ""` would be a
    // GraphQL error, not an empty answer.
    if (!projectId || !viewerId || myTotal != null) return;
    let alive = true;
    getMemberValueTotal(String(projectId), viewerId)
      .then((v) => alive && (fetchedMyTotal = v))
      .catch(() => {});
    return () => (alive = false);
  });

  $effect(() => {
    if (!projectId || rikmaTotal != null) return;
    let alive = true;
    getProjectValueSummary(String(projectId))
      .then((s) => alive && (fetchedRikmaTotal = s.currentValue))
      .catch(() => {});
    return () => (alive = false);
  });

  const effectiveMyTotal = $derived(myTotal != null ? Number(myTotal) : fetchedMyTotal);
  const effectiveRikmaTotal = $derived(
    rikmaTotal != null ? Number(rikmaTotal) : fetchedRikmaTotal
  );

  // Null when there is nothing to show — no budget and no monthly ceiling, or
  // terms that move nobody, which is an answer in itself.
  const dilution = $derived(
    effectiveMyTotal != null && effectiveRikmaTotal != null
      ? dilutionForVoter(stipend, effectiveMyTotal, effectiveRikmaTotal)
      : null
  );

  const deadline = $derived(
    timegramaDate ? new Date(timegramaDate).toLocaleDateString() : ''
  );

  /**
   * The funder's second click. Not friction for its own sake: every other
   * signature on this card costs a percentage, and this one costs money every
   * month — the one place in the flow where "I didn't realise" is a real risk.
   */
  let confirmingFunder = $state(false);

  async function approve() {
    if (approving) return;
    if (stipend?.iAmFunder && !confirmingFunder) {
      confirmingFunder = true;
      return;
    }
    confirmingFunder = false;
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

    <!-- Who pays whom. First, before any number: every other line on this card
         means something different depending on which side of it you are on. -->
    <div class="rounded-xl bg-gray-50 dark:bg-slate-900/60 p-3 flex items-center justify-between gap-2 text-sm">
      <button
        type="button"
        class="flex-1 text-start"
        onclick={() => stipend?.funderId && onUser?.({ id: stipend.funderId })}
      >
        <span class="block text-xs text-gray-600 dark:text-gray-300">{$t('stipend.card.funder')}</span>
        <span class="font-bold text-gray-900 dark:text-white">{funderLabel}</span>
      </button>
      <span class="text-lg text-goldink">{$isRtl ? '←' : '→'}</span>
      <button
        type="button"
        class="flex-1 text-end"
        onclick={() => stipend?.recipientId && onUser?.({ id: stipend.recipientId })}
      >
        <span class="block text-xs text-gray-600 dark:text-gray-300">{$t('stipend.card.recipient')}</span>
        <span class="font-bold text-gray-900 dark:text-white">{recipientLabel}</span>
      </button>
    </div>

    <!-- What approving means for *me*. The funder's version is the one that
         must never be implicit: approving is committing to pay. -->
    {#if stipend?.iAmFunder}
      <div class="rounded-xl border-2 border-barbi bg-barbi/5 p-3 text-sm">
        <p class="font-bold text-gray-900 dark:text-white">{$t('stipend.card.youPayTitle')}</p>
        <p class="text-gray-800 dark:text-gray-100">
          {$t('stipend.card.youPayBody', { count: standing.stipendRate ?? 0 })}
        </p>
        {#if monthlyCommitment}
          <p class="text-gray-800 dark:text-gray-100">
            {$t('stipend.card.youPayMonthly', { count: monthlyCommitment })}
          </p>
        {/if}
        {#if openEnded}
          <p class="font-semibold text-gray-900 dark:text-white">{$t('stipend.card.youPayOpenEnded')}</p>
        {:else if standing.totalCap != null}
          <p class="text-gray-800 dark:text-gray-100">
            {$t('stipend.card.youPayTotal', { count: standing.totalCap })}
          </p>
        {/if}
      </div>
    {:else if stipend?.iAmRecipient}
      <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-sm">
        <p class="font-bold text-gray-900 dark:text-white">{$t('stipend.card.youReceiveTitle')}</p>
        <p class="text-gray-800 dark:text-gray-100">
          {$t('stipend.card.youReceiveBody', {
            count: standing.stipendRate ?? 0,
            name: stipend?.funderName ?? ''
          })}
        </p>
      </div>
    {/if}

    <!-- Which work is being funded. A stipend is a claim on the rikma's value,
         and "for what" is half of whether it is worth it. -->
    {#if missions.length > 0}
      <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-2 text-sm">
        <p class="text-xs uppercase font-bold text-gray-600 dark:text-gray-300">
          {$t('stipend.card.missionsTitle')}
        </p>
        {#each missions as m (m.id)}
          <div class="border-t first:border-t-0 border-gray-100 dark:border-gray-700 pt-2 first:pt-0">
            <p class="font-bold text-gray-900 dark:text-white">
              {m.kind === 'open' ? '🔓 ' : ''}{m.name}
            </p>
            {#if m.kind === 'open'}
              <p class="text-xs font-semibold text-goldink">{$t('stipend.card.missionOpen')}</p>
            {/if}
            {#if m.descrip}
              <p class="text-xs text-gray-700 dark:text-gray-200 line-clamp-3">{m.descrip}</p>
            {/if}
            <p class="text-xs text-gray-600 dark:text-gray-300">
              {#if m.hours != null && m.perhour != null}
                {$t('stipend.card.missionValue', {
                  hours: m.hours,
                  rate: m.perhour,
                  value: Math.round(Number(m.value))
                })}
              {:else if m.perhour != null}
                {$t('stipend.terms.marketRate', { count: m.perhour })}
              {/if}
              {#if m.recurring}
                · {$t('stipend.card.missionRecurring')}
              {/if}
            </p>
            {#if m.hoursDone != null && m.hoursDone > 0}
              <p class="text-xs text-gray-600 dark:text-gray-300">
                {$t('stipend.card.missionHoursDone', { count: m.hoursDone })}
              </p>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <!-- No linked mission row: either a legacy "every approved hour" stipend,
           or a stipend on a mission nobody has taken yet — which has no
           `mesimabetahalich` to link to, and is named in the proposal instead. -->
      <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-1 text-sm">
        <p class="text-xs uppercase font-bold text-gray-600 dark:text-gray-300">
          {$t('stipend.card.missionsTitle')}
        </p>
        {#if stipend?.decisionName}
          <p class="font-bold text-gray-900 dark:text-white">{stipend.decisionName}</p>
        {/if}
        <p class="text-xs text-gray-600 dark:text-gray-300">
          {standing.scope === 'allMissions'
            ? isProgram
              ? $t('stipend.card.coversAllRikma')
              : $t('stipend.card.coversAllMine')
            : $t('stipend.card.missionOpen')}
        </p>
      </div>
    {/if}

    <!-- The terms, in the order a person asks about them. -->
    <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-1 text-sm">
      <p>{$t('stipend.terms.rate')}: <b>₪{standing.stipendRate ?? 0}</b></p>
      {#if standing.mode === 'equity'}
        <p>
          {$t('stipend.terms.costShare')}:
          <b>{Math.round(Number(standing.costShare ?? 1) * 100)}%</b>
          <span class="text-xs text-gray-600 dark:text-gray-300">
            {Number(standing.costShare ?? 1) >= 0.999
              ? $t('stipend.terms.costShareExplainFull')
              : Number(standing.costShare ?? 1) <= 0.001
                ? $t('stipend.terms.costShareExplainNone')
                : $t('stipend.terms.costShareExplainMixed')}
          </span>
        </p>
      {/if}
      {#if standing.totalCap != null && Number(standing.totalCap) > 0}
        <p>{$t('stipend.terms.totalCap')}: <b>₪{standing.totalCap}</b></p>
      {/if}
      {#if standing.monthlyCap != null && Number(standing.monthlyCap) > 0}
        <p>{$t('stipend.terms.monthlyCap')}: <b>₪{standing.monthlyCap}</b></p>
      {/if}
      {#if openEnded}
        <!-- No final number to show, so say that instead of leaving a gap. -->
        <p class="font-semibold text-goldink">{$t('stipend.card.openEnded')}</p>
      {/if}
      {#if standing.revenueTrigger != null}
        <p class="text-xs text-gray-600 dark:text-gray-300">
          {$t('stipend.terms.revenueTriggerSet', { count: standing.revenueTrigger })}
        </p>
      {/if}
    </div>

    <!-- What approving does to me. Abstract percentages are how people agree to
         things they would not agree to in shekels. -->
    {#if dilution}
      <div class="rounded-xl border-2 border-goldink bg-gray-50 dark:bg-slate-900/60 p-3">
        <p class="text-xs uppercase font-bold text-goldink mb-1">
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
        {#if dilution.openEnded && dilution.moves}
          <!-- There is no "if the budget is spent" for an open-ended stipend;
               the number above is one year of it, and it does not stop there. -->
          <p class="mt-1 text-xs text-gray-700 dark:text-gray-200">
            {$t('stipend.card.dilutionPerYear', { count: dilution.horizonMonths })}
          </p>
        {/if}
      </div>
    {/if}

    {#if standing.why || stipend?.why}
      <div class="rounded-xl bg-gray-50 dark:bg-gray-900/60 p-3">
        <p class="text-xs text-gray-600 dark:text-gray-300 mb-1">{$t('stipend.card.reason')}</p>
        <p class="text-sm text-gray-800 dark:text-gray-200">{standing.why || stipend?.why}</p>
        {#if standing.proposedByName}
          <button
            type="button"
            class="text-xs text-gray-600 dark:text-gray-300 mt-2 underline"
            onclick={() => onUser?.({ id: standing.proposedById })}
          >
            {$t('stipend.card.proposedBy', { name: standing.proposedByName })}
          </button>
        {/if}
      </div>
    {/if}

    <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
      <span>{$t('stipend.card.signed', { count: stipend?.signedIds?.length ?? 0 })}</span>
      <span>{$t('stipend.card.awaiting', { count: stipend?.awaitingIds?.length ?? 0 })}</span>
    </div>
    <!-- Silence approves this only while the funder has already signed. Saying
         so on the card is half the protection: the other half is the server
         refusing to mature it (src/lib/server/stipend/apply.ts). -->
    {#if stipend?.awaitingFunder}
      <p class="text-xs font-semibold text-goldink">
        {$t('stipend.card.needsFunderSignature', { name: stipend?.funderName ?? '' })}
      </p>
    {:else if deadline}
      <p class="text-xs text-gray-500 dark:text-gray-400">{$t('stipend.card.autoApprove')} · {deadline}</p>
    {/if}
  </div>

  {#if confirmingFunder}
    <div class="p-4 border-t-2 border-barbi bg-barbi/5 text-sm">
      <p class="font-bold text-gray-900 dark:text-white">{$t('stipend.card.confirmFunderTitle')}</p>
      <p class="text-gray-800 dark:text-gray-100">
        {$t('stipend.card.confirmFunderBody', {
          count: standing.stipendRate ?? 0,
          name: recipientLabel
        })}
      </p>
    </div>
  {/if}

  <div
    class="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex gap-2"
  >
    <button
      type="button"
      onclick={() => (confirmingFunder ? (confirmingFunder = false) : openChat())}
      disabled={openingChat}
      class="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 py-3 text-sm disabled:opacity-60"
    >
      {confirmingFunder ? $t('stipend.actions.cancel') : $t('stipend.actions.chat')}
    </button>
    {#if mine}
      <button
        type="button"
        onclick={() => (counterOpen = true)}
        class="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 py-3 text-sm"
      >
        ⚖️ {$t('stipend.actions.negotiate')}
      </button>
      <!-- The funder's button says what the funder is actually doing. "אישור"
           is what you click on a logo vote; committing to pay every month
           deserves its own word. -->
      <button
        type="button"
        onclick={approve}
        disabled={approving}
        class="flex-[2] rounded-xl bg-barbi text-gold font-bold py-3 text-sm disabled:opacity-60"
      >
        {approving
          ? $t('stipend.actions.approving')
          : confirmingFunder
            ? $t('stipend.actions.confirmPay')
            : stipend?.iAmFunder
              ? $t('stipend.actions.approveAsFunder')
              : $t('stipend.actions.approve')}
      </button>
    {:else}
      <p class="flex-[3] self-center text-center text-sm text-gray-500 dark:text-gray-500 dark:text-gray-400">
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
