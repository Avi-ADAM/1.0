<script>
  /**
   * Lev card for a shop promotion, or for the rikma's promotion envelope
   * (docs/inprogress/PLAN_SHOP_PROMOTIONS.md §3.3–3.4).
   *
   * Three answers, never a "no": approve the version on the table, talk it
   * over, or put another version up — a smaller cut, other dates, "0" for no
   * promotion at all. The card says what in the version goes beyond what the
   * rikma already agreed to, and — when the clock outlasts the start date —
   * that the promotion would start at approval and still end when agreed.
   */
  import { t, isRtl, locale } from '$lib/translations';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import CardHeader from './CardHeader.svelte';

  /**
   * @typedef {Object} Props
   * @property {any} promo - the PromoDecisionView built by the extractor
   * @property {string} projectId
   * @property {string} projectName
   * @property {string} [logoSrc]
   * @property {string} [timegramaDate]
   * @property {number} [memberCount]
   * @property {boolean} [isFirst]
   * @property {(arg: any) => void} [onProj]
   * @property {(arg: any) => void} [onUser]
   * @property {(arg: any) => void} [onChat]
   * @property {() => void} [onDone]
   */

  /** @type {Props} */
  let {
    promo,
    projectId,
    projectName,
    logoSrc = '',
    timegramaDate = '',
    memberCount = 0,
    isFirst = false,
    onProj,
    onUser,
    onChat,
    onDone
  } = $props();

  const isPolicy = $derived(promo?.kind === 'promoPolicy');
  const standing = $derived(promo?.standing ?? null);
  const policy = $derived(promo?.policy ?? null);
  const rule = $derived(standing?.rule ?? {});
  const mine = $derived(promo?.myTurn !== false);

  const fmtDate = (/** @type {string | null | undefined} */ iso) => {
    if (!iso) return $t('lev.promo.fromApproval');
    try {
      return new Intl.DateTimeFormat($locale || 'he', { day: 'numeric', month: 'numeric', timeZone: 'Asia/Jerusalem' }).format(new Date(iso));
    } catch {
      return String(iso).slice(0, 10);
    }
  };

  const what = $derived.by(() => {
    if (!standing) return '';
    const r = rule;
    switch (standing.kind) {
      case 'item':
        if (r.pct != null) return $t('lev.promo.what.pct', { value: r.pct });
        if (r.price != null) return $t('lev.promo.what.price', { value: r.price });
        return $t('lev.promo.what.off', { value: r.off });
      case 'store':
        return $t('lev.promo.what.pct', { value: r.pct });
      case 'bundle':
        return $t('lev.promo.what.bundle', { qty: r.qty, price: r.price });
      case 'bxgy':
        return $t('lev.promo.what.bxgy', { buy: r.buy, get: r.get, getPct: r.getPct });
      default:
        return r.pct != null
          ? $t('lev.promo.what.thresholdPct', { pct: r.pct, min: r.minSubtotal })
          : $t('lev.promo.what.thresholdOff', { off: r.off, min: r.minSubtotal });
    }
  });

  const scopeText = $derived.by(() => {
    const s = standing?.scope ?? {};
    if (s.all) return $t('lev.promo.scope.all');
    if (s.categories?.length && !s.products?.length) return $t('lev.promo.scope.categories', { count: s.categories.length });
    return $t('lev.promo.scope.products', { count: (s.products?.length ?? 0) + (s.variants?.length ?? 0) });
  });

  const breachLines = $derived(
    (promo?.breaches ?? []).map((/** @type {any} */ b) =>
      b.field === 'pct'
        ? b.value == null
          ? $t('lev.promo.breach.pctUnknown', { limit: b.limit })
          : $t('lev.promo.breach.pct', { value: b.value, limit: b.limit })
        : b.field === 'days'
          ? $t('lev.promo.breach.days', { value: b.value, limit: b.limit })
          : $t(`lev.promo.breach.${b.field}`)
    )
  );

  const cardType = $derived(
    isPolicy ? $t('lev.promo.type.policy') : promo?.isCounter ? $t('lev.promo.type.counter') : $t('lev.promo.type.promotion')
  );
  const cardTitle = $derived(
    isPolicy ? $t('lev.promo.policyTitle') : standing?.name || $t(`lev.promo.kind.${standing?.kind ?? 'item'}`)
  );

  // ── answering ──────────────────────────────────────────────────────────────

  let approving = $state(false);
  async function approve() {
    if (approving) return;
    approving = true;
    try {
      const res = await executeAction('voteOnDecision', { decisionId: promo.decisionId, projectId, kind: promo.kind });
      if (res?.success === false) throw new Error(actionErrorText(res, $t('lev.promo.toast.error')));
      toast.success(res?.data?.consensus ? $t('lev.promo.toast.applied') : $t('lev.promo.toast.signed'));
      onDone?.();
    } catch (e) {
      console.error('[PromotionDecisionCard] approve failed:', e);
      toast.error(e instanceof Error ? e.message : $t('lev.promo.toast.error'));
    } finally {
      approving = false;
    }
  }

  let forumId = $state(null);
  let openingChat = $state(false);
  async function openChat() {
    if (openingChat) return;
    openingChat = true;
    try {
      if (!forumId) {
        const res = await executeAction('ensureVoteForum', {
          entityType: 'decision',
          entityId: String(promo?.decisionId),
          projectId: String(projectId)
        });
        if (res?.success) forumId = res.data?.forumId ?? null;
      }
      if (forumId) onChat?.({ forumId: String(forumId), decisionId: promo?.decisionId, projectId });
      else toast.error($t('lev.promo.toast.error'));
    } catch (e) {
      console.error('[PromotionDecisionCard] opening the chat failed:', e);
      toast.error($t('lev.promo.toast.error'));
    } finally {
      openingChat = false;
    }
  }

  // The counter edits the one number a partner argues about, and the dates.
  const valueKey = $derived.by(() => {
    if (!standing) return null;
    const r = rule;
    if (standing.kind === 'bundle') return 'price';
    if (standing.kind === 'bxgy') return 'getPct';
    return r.pct != null ? 'pct' : r.price != null ? 'price' : 'off';
  });
  const valueLabel = $derived(
    valueKey === 'price' && standing?.kind === 'bundle'
      ? $t('lev.promo.counter.bundlePrice')
      : valueKey === 'off' && standing?.kind === 'threshold'
        ? $t('lev.promo.counter.thresholdOff')
        : valueKey
          ? $t(`lev.promo.counter.${valueKey}`)
          : ''
  );

  let counterOpen = $state(false);
  let sending = $state(false);
  let cValue = $state('');
  let cStart = $state('');
  let cEnd = $state('');
  let cMaxPct = $state('');
  let cMaxDays = $state('');
  let cWhy = $state('');

  const dateInput = (/** @type {string | null | undefined} */ iso) => (iso ? String(iso).slice(0, 10) : '');

  function openCounter() {
    if (isPolicy) {
      cMaxPct = String(policy?.maxPct ?? '');
      cMaxDays = String(policy?.maxDays ?? '');
    } else {
      cValue = valueKey ? String(rule[valueKey] ?? '') : '';
      cStart = dateInput(standing?.startsAt);
      cEnd = dateInput(standing?.endsAt);
    }
    cWhy = '';
    counterOpen = true;
  }

  async function sendCounter() {
    if (sending) return;
    sending = true;
    try {
      /** @type {Record<string, any>} */
      const params = { decisionId: promo.decisionId, projectId, why: cWhy || undefined };
      if (isPolicy) {
        params.policy = {
          ...policy,
          who: policy?.who?.roles ? `roles:${policy.who.roles.join(',')}` : 'members',
          maxPct: Number(cMaxPct),
          maxDays: Number(cMaxDays)
        };
      } else {
        params.rule = valueKey ? { ...rule, [valueKey]: Number(cValue) } : rule;
        // An end date means its whole last day.
        if (cStart) params.startsAt = new Date(`${cStart}T00:00:00`).toISOString();
        if (cEnd) params.endsAt = new Date(`${cEnd}T23:59:00`).toISOString();
      }
      const res = await executeAction('counterPromotion', params);
      if (res?.success === false) throw new Error(actionErrorText(res, $t('lev.promo.toast.error')));
      toast.success($t('lev.promo.toast.countered'));
      counterOpen = false;
      onDone?.();
    } catch (e) {
      console.error('[PromotionDecisionCard] counter failed:', e);
      toast.error(e instanceof Error ? e.message : $t('lev.promo.toast.error'));
    } finally {
      sending = false;
    }
  }
</script>

<div
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="{isMobileOrTablet()
    ? 'w-full h-full'
    : 'w-[90%] h-[90%]'} lg:w-[90%] {isFirst
    ? $isRtl
      ? 'boxleft'
      : 'boxright'
    : ''} flex d flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden {isFirst
    ? 'shadow-glow border-glow'
    : 'shadow-lg border border-gray-100 dark:border-gray-700'} transition-all duration-300 relative"
  style:--glow-rgb="251, 146, 60"
>
  <CardHeader
    {logoSrc}
    {projectName}
    {cardType}
    {cardTitle}
    {memberCount}
    glowColor="orange"
    onProjectClick={() => onProj?.({ id: projectId })}
  />

  <div class="bg-white dark:bg-slate-800 flex-1 overflow-y-auto d p-4 space-y-4">
    {#if isPolicy && policy}
      <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-1 text-sm text-gray-800 dark:text-gray-100">
        <p class="font-bold text-gray-900 dark:text-white">
          {$t('lev.promo.policy.line', { pct: policy.maxPct, days: policy.maxDays })}
        </p>
        <p>{policy.kinds.map((/** @type {string} */ k) => $t(`lev.promo.kind.${k}`)).join(' · ')}</p>
        <p>{policy.floor === 'none' ? $t('lev.promo.policy.floorNone') : $t('lev.promo.policy.floorCost')}</p>
        <p>{policy.who?.roles ? $t('lev.promo.policy.whoRoles') : $t('lev.promo.policy.whoMembers')}</p>
        {#if policy.arrangedDiscountPct}
          <p>{$t('lev.promo.policy.arranged', { pct: policy.arrangedDiscountPct })}</p>
        {/if}
      </div>
    {:else if standing}
      <div class="rounded-xl bg-gray-50 dark:bg-slate-900/60 p-3 space-y-1">
        <p class="text-xs text-gray-600 dark:text-gray-300">{$t(`lev.promo.kind.${standing.kind}`)} · {scopeText}</p>
        <p class="text-xl font-bold text-gray-900 dark:text-white">{what}</p>
        <p class="text-sm text-gray-800 dark:text-gray-100">
          {$t('lev.promo.dates', { from: fmtDate(standing.startsAt), to: fmtDate(standing.endsAt) })}
        </p>
        {#if standing.capUnits}
          <p class="text-xs text-gray-600 dark:text-gray-300">{$t('lev.promo.capUnits', { count: standing.capUnits })}</p>
        {/if}
        {#if standing.perOrderMax}
          <p class="text-xs text-gray-600 dark:text-gray-300">{$t('lev.promo.perOrderMax', { count: standing.perOrderMax })}</p>
        {/if}
      </div>

      {#if breachLines.length}
        <div class="rounded-xl border-2 border-goldink p-3 text-sm">
          <p class="text-xs uppercase font-bold text-goldink mb-1">{$t('lev.promo.beyond')}</p>
          {#each breachLines as line}
            <p class="text-gray-800 dark:text-gray-100">{line}</p>
          {/each}
        </div>
      {/if}

      {#if promo?.startsLate}
        <p class="text-xs font-semibold text-goldink">{$t('lev.promo.startsLate')}</p>
      {/if}
    {/if}

    {#if promo?.why || promo?.proposedByName}
      <div class="rounded-xl bg-gray-50 dark:bg-gray-900/60 p-3">
        {#if promo?.why}
          <p class="text-xs text-gray-600 dark:text-gray-300 mb-1">{$t('lev.promo.why')}</p>
          <p class="text-sm text-gray-800 dark:text-gray-200">{promo.why}</p>
        {/if}
        {#if promo?.proposedByName}
          <button type="button" class="text-xs text-gray-600 dark:text-gray-300 mt-2 underline" onclick={() => onUser?.({ id: promo.proposedById })}>
            {$t('lev.promo.by', { name: promo.proposedByName })}
          </button>
        {/if}
      </div>
    {/if}

    <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
      <span>{$t('lev.promo.signed', { ok: promo?.signedIds?.length ?? 0, total: memberCount })}</span>
      {#if timegramaDate}
        <span>{$t('lev.promo.silence', { date: fmtDate(timegramaDate) })}</span>
      {/if}
    </div>

    {#if counterOpen}
      <div class="rounded-xl border border-gray-300 dark:border-slate-600 p-3 space-y-2 text-sm">
        <p class="font-bold text-gray-900 dark:text-white">{$t('lev.promo.counter.title')}</p>
        {#if isPolicy}
          <label class="block">
            <span class="text-xs text-gray-600 dark:text-gray-300">{$t('lev.promo.counter.maxPct')}</span>
            <input type="number" min="0" max="100" bind:value={cMaxPct} class="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-2" />
          </label>
          <label class="block">
            <span class="text-xs text-gray-600 dark:text-gray-300">{$t('lev.promo.counter.maxDays')}</span>
            <input type="number" min="1" bind:value={cMaxDays} class="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-2" />
          </label>
        {:else}
          {#if valueKey}
            <label class="block">
              <span class="text-xs text-gray-600 dark:text-gray-300">{valueLabel}</span>
              <input type="number" min="0" bind:value={cValue} class="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-2" />
              <span class="text-xs text-gray-500 dark:text-gray-400">{$t('lev.promo.counter.zeroHint')}</span>
            </label>
          {/if}
          <div class="flex gap-2">
            <label class="block flex-1">
              <span class="text-xs text-gray-600 dark:text-gray-300">{$t('lev.promo.counter.startsAt')}</span>
              <input type="date" bind:value={cStart} class="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-2" />
            </label>
            <label class="block flex-1">
              <span class="text-xs text-gray-600 dark:text-gray-300">{$t('lev.promo.counter.endsAt')}</span>
              <input type="date" bind:value={cEnd} class="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-2" />
            </label>
          </div>
        {/if}
        <label class="block">
          <span class="text-xs text-gray-600 dark:text-gray-300">{$t('lev.promo.counter.why')}</span>
          <textarea rows="2" bind:value={cWhy} class="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-2"></textarea>
        </label>
      </div>
    {/if}
  </div>

  <div class="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex gap-2">
    {#if counterOpen}
      <button type="button" onclick={() => (counterOpen = false)} class="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 py-3 text-sm">
        {$t('lev.promo.btn.cancel')}
      </button>
      <button type="button" onclick={sendCounter} disabled={sending} class="flex-[2] rounded-xl bg-barbi text-gold font-bold py-3 text-sm disabled:opacity-60">
        {$t('lev.promo.btn.send')}
      </button>
    {:else}
      <button type="button" onclick={openChat} disabled={openingChat} class="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 py-3 text-sm disabled:opacity-60">
        {$t('lev.promo.btn.chat')}
      </button>
      {#if mine}
        <button type="button" onclick={openCounter} class="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 py-3 text-sm">
          ⚖️ {$t('lev.promo.btn.counter')}
        </button>
        <button type="button" onclick={approve} disabled={approving} class="flex-[2] rounded-xl bg-barbi text-gold font-bold py-3 text-sm disabled:opacity-60">
          {$t('lev.promo.btn.approve')}
        </button>
      {/if}
    {/if}
  </div>
</div>

<style>
  .shadow-glow {
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06),
      0 0 20px rgba(var(--glow-rgb), 0.4),
      0 0 40px rgba(var(--glow-rgb), 0.3),
      inset 0 0 20px rgba(var(--glow-rgb), 0.05);
  }

  .border-glow {
    border: 2px solid rgba(var(--glow-rgb), 0.5);
  }
</style>
