<script lang="ts">
  /**
   * Promotions — what the rikma's shop sells for less, and for how long
   * (docs/inprogress/PLAN_SHOP_PROMOTIONS.md P5).
   *
   * A new promotion is a three-step wizard (what · on what · when) whose last
   * step says, before anything is sent, what the server will decide: it goes
   * out at once (nobody else's income, or inside the envelope the rikma agreed
   * to) or it becomes a vote — and what in it goes beyond. Running promotions
   * can be paused (the 24-hour brake) or ended; another version of one is a
   * counter on its vote card, never a "no" here.
   */
  import { page } from '$app/state';
  import { invalidate } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { t, locale } from '$lib/translations';
  import { executeAction, actionErrorText, type ActionKey } from '$lib/client/actionClient';
  import { shopPromotionsKey } from '$lib/shop/keys';
  import { PROMO_KINDS, promoIneligible, type PromoPolicy } from '$lib/shop/promoTerms';
  import type { PromotionKind } from '$lib/shop/promotions';
  import {
    WIZARD_STEPS,
    draftProblems,
    draftToTerms,
    emptyDraft,
    groupPromotions,
    hasOpenCounter,
    kindIsStoreWide,
    previewDraft,
    type PromoDraft,
    type WizardStep
  } from '$lib/shop/promoManage';
  import ShopNotice from '$lib/components/shop/ShopNotice.svelte';
  import PromotionTerms from '$lib/components/shop/PromotionTerms.svelte';
  import type { PromoSetup } from '$lib/server/promotions/manage';
  import type { PromotionRow } from '$lib/server/promotions/store';

  let { data } = $props();
  let projectId = $derived(page.params.projectId ?? '');
  let setup = $derived<PromoSetup>(data.promo);
  let me = $derived(String(data.uid ?? ''));
  let groups = $derived(groupPromotions(setup.promotions));
  let active = $derived(setup.promotions.filter((p) => p.status === 'active'));

  const fmtDate = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat($locale || 'he', { day: 'numeric', month: 'numeric', timeZone: 'Asia/Jerusalem' }).format(new Date(iso));
    } catch {
      return String(iso).slice(0, 10);
    }
  };
  const voteHref = (decisionId: string) => `/moach/${projectId}/votes/decision/${decisionId}`;

  let busy = $state<string | null>(null);
  async function act(key: string, actionKey: ActionKey, params: Record<string, unknown>, okText: string) {
    if (busy) return false;
    busy = key;
    try {
      const res = await executeAction(actionKey, { projectId, ...params });
      if (res?.success === false) throw new Error(actionErrorText(res, $t('shop.promo.toast.error')));
      toast.success(okText);
      await invalidate(shopPromotionsKey(projectId));
      return res;
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : $t('shop.promo.toast.error'));
      return false;
    } finally {
      busy = null;
    }
  }

  // ── a running promotion ────────────────────────────────────────────────────
  let confirmEnd = $state<string | null>(null);
  const pause = (p: PromotionRow) => act(`pause:${p.id}`, 'pausePromotion', { promotionId: p.id }, $t('shop.promo.toast.paused'));
  const resume = (p: PromotionRow) =>
    act(`pause:${p.id}`, 'pausePromotion', { promotionId: p.id, paused: false }, $t('shop.promo.toast.resumed'));
  async function end(p: PromotionRow) {
    if (confirmEnd !== p.id) {
      confirmEnd = p.id;
      return;
    }
    confirmEnd = null;
    await act(`end:${p.id}`, 'endPromotion', { promotionId: p.id }, p.status === 'proposed' ? $t('shop.promo.toast.withdrawn') : $t('shop.promo.toast.ended'));
  }

  // ── the wizard ─────────────────────────────────────────────────────────────
  let wizardOpen = $state(false);
  let step = $state<WizardStep>('what');
  let draft = $state<PromoDraft>(emptyDraft());
  let tried = $state<Record<WizardStep, boolean>>({ what: false, scope: false, when: false });
  let now = $derived(new Date());
  let problems = $derived(draftProblems(draft, now));
  let preview = $derived(
    previewDraft($state.snapshot(draft) as PromoDraft, {
      shelf: setup.shelf,
      policy: setup.policy,
      memberIds: setup.memberIds,
      me,
      restimeMs: setup.restimeMs,
      now
    })
  );

  function openWizard() {
    draft = emptyDraft();
    step = 'what';
    tried = { what: false, scope: false, when: false };
    wizardOpen = true;
  }
  function setKind(kind: PromotionKind) {
    const keep = { name: draft.name, products: draft.products, startsOn: draft.startsOn, endsOn: draft.endsOn, capUnits: draft.capUnits, why: draft.why };
    draft = { ...emptyDraft(kind), ...keep, all: kindIsStoreWide(kind) || (draft.all && kind !== 'item') };
  }
  function next() {
    tried[step] = true;
    if (problems[step].length) return;
    const i = WIZARD_STEPS.indexOf(step);
    step = WIZARD_STEPS[Math.min(WIZARD_STEPS.length - 1, i + 1)];
  }
  function back() {
    const i = WIZARD_STEPS.indexOf(step);
    if (i === 0) wizardOpen = false;
    else step = WIZARD_STEPS[i - 1];
  }
  function toggleProduct(id: string) {
    draft.products = draft.products.includes(id) ? draft.products.filter((x) => x !== id) : [...draft.products, id];
  }
  async function send() {
    tried = { what: true, scope: true, when: true };
    const firstBad = WIZARD_STEPS.find((s) => problems[s].length);
    if (firstBad) {
      step = firstBad;
      return;
    }
    const res: any = await act(
      'propose',
      'proposePromotion',
      { terms: draftToTerms($state.snapshot(draft) as PromoDraft), ...(draft.why.trim() ? { why: draft.why.trim() } : {}) },
      preview.needsVote ? $t('shop.promo.toast.proposedVote') : $t('shop.promo.toast.proposedNow')
    );
    if (res) wizardOpen = false;
  }

  // ── the envelope ───────────────────────────────────────────────────────────
  let policyOpen = $state(false);
  let policyDraft = $state({ maxPct: 15, maxDays: 14, arrangedDiscountPct: 10, floor: 'cost' as 'cost' | 'none', kinds: [...PROMO_KINDS] as PromotionKind[] });
  function openPolicy(p: PromoPolicy | null) {
    policyDraft = p
      ? { maxPct: p.maxPct, maxDays: p.maxDays, arrangedDiscountPct: p.arrangedDiscountPct, floor: p.floor, kinds: [...p.kinds] }
      : { maxPct: 15, maxDays: 14, arrangedDiscountPct: 10, floor: 'cost', kinds: [...PROMO_KINDS] };
    policyOpen = true;
  }
  function toggleKind(k: PromotionKind) {
    policyDraft.kinds = policyDraft.kinds.includes(k) ? policyDraft.kinds.filter((x) => x !== k) : [...policyDraft.kinds, k];
  }
  let policyValid = $derived(
    policyDraft.kinds.length > 0 &&
      policyDraft.maxPct >= 0 &&
      policyDraft.maxPct <= 100 &&
      policyDraft.maxDays >= 1 &&
      policyDraft.arrangedDiscountPct >= 0 &&
      policyDraft.arrangedDiscountPct <= 100
  );
  async function sendPolicy() {
    if (!policyValid) return;
    const who = setup.policy && 'roles' in setup.policy.who ? `roles:${setup.policy.who.roles.join(',')}` : 'members';
    const res = await act('policy', 'proposePromoPolicy', { policy: { ...$state.snapshot(policyDraft), who } }, $t('shop.promo.toast.policySent'));
    if (res) policyOpen = false;
  }

  const ITEM_MODES = ['pct', 'price', 'off'] as const;
  const THRESHOLD_MODES = ['off', 'pct'] as const;
  const kindLabel = (k: PromotionKind) => $t(`lev.promo.kind.${k}`);
  const problemText = (p: string) => $t(`shop.promo.problem.${p}`);
  function breachText(b: any): string {
    switch (b.field) {
      case 'pct':
        return b.value == null ? $t('lev.promo.breach.pctUnknown', { limit: b.limit }) : $t('lev.promo.breach.pct', { value: b.value, limit: b.limit });
      case 'days':
        return $t('lev.promo.breach.days', { value: b.value, limit: b.limit });
      default:
        return $t(`lev.promo.breach.${b.field}`);
    }
  }
  const statusChip: Record<string, string> = {
    active: 'sh-chip-ok',
    paused: 'sh-chip-warn',
    scheduled: 'sh-chip-info',
    proposed: 'sh-chip-gold',
    ended: 'sh-chip-muted'
  };
</script>

{#snippet row(p: PromotionRow)}
  <li class="pm-row sh-card">
    <div class="pm-row-main">
      <div class="pm-row-chips">
        <span class="sh-chip {statusChip[p.status] ?? 'sh-chip-muted'}">{$t(`shop.promo.status.${p.status}`)}</span>
        <span class="sh-chip sh-chip-plain">{kindLabel(p.kind)}</span>
        {#if p.status === 'ended' && p.endedReason}
          <span class="pm-muted">{$t(`shop.promo.endedReason.${p.endedReason}`)}</span>
        {/if}
      </div>
      <PromotionTerms kind={p.kind} rule={p.rule} scope={p.scope} startsAt={p.startsAt} endsAt={p.endsAt} name={p.name} />
      {#if p.usedUnits || p.capUnits}
        <span class="pm-muted">
          {p.capUnits ? $t('shop.promo.usedOfCap', { used: p.usedUnits ?? 0, cap: p.capUnits }) : $t('shop.promo.used', { count: p.usedUnits ?? 0 })}
        </span>
      {/if}
      {#if p.status === 'paused' && p.pausedAt}
        <span class="pm-muted">{$t('shop.promo.pausedUntil', { date: fmtDate(new Date(Date.parse(p.pausedAt) + 24 * 3600_000).toISOString()) })}</span>
      {/if}
      {#if hasOpenCounter(p)}
        <a class="pm-link" href={voteHref(p.decisionId!)}>{$t('shop.promo.counterOpen')}</a>
      {/if}
    </div>
    <div class="pm-row-actions">
      {#if p.status === 'proposed' && p.decisionId}
        <a class="sh-btn sh-btn-outline" href={voteHref(p.decisionId)}>{$t('shop.promo.toVote')}</a>
      {/if}
      {#if p.status === 'active'}
        <button type="button" class="sh-btn sh-btn-quiet" disabled={!!busy} onclick={() => pause(p)}>{$t('shop.promo.pause')}</button>
      {:else if p.status === 'paused'}
        <button type="button" class="sh-btn sh-btn-quiet" disabled={!!busy} onclick={() => resume(p)}>{$t('shop.promo.resume')}</button>
      {/if}
      {#if ['active', 'paused', 'scheduled'].includes(p.status) || (p.status === 'proposed' && p.proposedById === me)}
        <button type="button" class="sh-btn" class:sh-btn-warn={confirmEnd === p.id} class:sh-btn-quiet={confirmEnd !== p.id} disabled={!!busy} onclick={() => end(p)}>
          {confirmEnd === p.id ? $t('shop.promo.endSure') : p.status === 'proposed' ? $t('shop.promo.withdraw') : $t('shop.promo.end')}
        </button>
      {/if}
    </div>
  </li>
{/snippet}

{#snippet section(title: string, rows: PromotionRow[])}
  {#if rows.length}
    <section class="pm-sec">
      <h2 class="sh-section-label">{title}</h2>
      <ul class="pm-list">
        {#each rows as p (p.id)}{@render row(p)}{/each}
      </ul>
    </section>
  {/if}
{/snippet}

{#if !setup.ready}
  <ShopNotice title={$t('shop.promo.notReady')} body={$t('shop.promo.notReadyBody')} />
{:else}
  {#if active.length}
    <section class="pm-banner sh-card" aria-label={$t('shop.promo.activeNow')}>
      <span class="sh-section-label">{$t('shop.promo.activeNow')}</span>
      <ul>
        {#each active as p (p.id)}
          <li><bdi>{p.name || kindLabel(p.kind)}</bdi> · {$t('shop.promo.until', { date: fmtDate(p.endsAt) })}</li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="pm-intro sh-card-2">
    <p>{$t('shop.promo.intro')}</p>
    {#if !wizardOpen}
      <button type="button" class="sh-btn sh-btn-primary" onclick={openWizard}>{$t('shop.promo.new')}</button>
    {/if}
  </section>

  {#if wizardOpen}
    <section class="pm-wizard sh-card" aria-label={$t('shop.promo.new')}>
      <ol class="pm-steps">
        {#each WIZARD_STEPS as s, i (s)}
          <li aria-current={step === s ? 'step' : undefined}>
            <span class="pm-step-n">{i + 1}</span>{$t(`shop.promo.step.${s}`)}
          </li>
        {/each}
      </ol>

      {#if step === 'what'}
        <div class="pm-kinds" role="group" aria-label={$t('shop.promo.step.what')}>
          {#each PROMO_KINDS as k (k)}
            <button type="button" class="sh-chip" class:sh-chip-accent={draft.kind === k} aria-pressed={draft.kind === k} onclick={() => setKind(k)}>{kindLabel(k)}</button>
          {/each}
        </div>
        <p class="pm-muted">{$t(`shop.promo.kindHint.${draft.kind}`)}</p>

        {#if draft.kind === 'item'}
          <div class="sh-seg" role="group">
            {#each ITEM_MODES as m (m)}
              <button type="button" aria-pressed={draft.itemMode === m} onclick={() => (draft.itemMode = m)}>{$t(`shop.promo.itemMode.${m}`)}</button>
            {/each}
          </div>
          <label class="sh-field">
            {$t(`shop.promo.value.${draft.itemMode}`)}
            <input class="sh-input sh-num" type="number" min="0" step="any" inputmode="decimal" bind:value={draft.value} />
          </label>
        {:else if draft.kind === 'store'}
          <label class="sh-field">
            {$t('shop.promo.value.pct')}
            <input class="sh-input sh-num" type="number" min="0" max="99" step="any" inputmode="decimal" bind:value={draft.value} />
          </label>
        {:else if draft.kind === 'bundle'}
          <div class="pm-grid2">
            <label class="sh-field">{$t('shop.promo.bundleQty')}<input class="sh-input sh-num" type="number" min="2" step="1" inputmode="numeric" bind:value={draft.qty} /></label>
            <label class="sh-field">{$t('shop.promo.bundlePrice')}<input class="sh-input sh-num" type="number" min="0" step="any" inputmode="decimal" bind:value={draft.price} /></label>
          </div>
        {:else if draft.kind === 'bxgy'}
          <div class="pm-grid3">
            <label class="sh-field">{$t('shop.promo.buy')}<input class="sh-input sh-num" type="number" min="1" step="1" inputmode="numeric" bind:value={draft.buy} /></label>
            <label class="sh-field">{$t('shop.promo.get')}<input class="sh-input sh-num" type="number" min="1" step="1" inputmode="numeric" bind:value={draft.get} /></label>
            <label class="sh-field">{$t('shop.promo.getPct')}<input class="sh-input sh-num" type="number" min="1" max="100" step="1" inputmode="numeric" bind:value={draft.getPct} /></label>
          </div>
        {:else}
          <label class="sh-field">{$t('shop.promo.minSubtotal')}<input class="sh-input sh-num" type="number" min="0" step="any" inputmode="decimal" bind:value={draft.minSubtotal} /></label>
          <div class="sh-seg" role="group">
            {#each THRESHOLD_MODES as m (m)}
              <button type="button" aria-pressed={draft.thresholdMode === m} onclick={() => (draft.thresholdMode = m)}>{$t(`shop.promo.thresholdMode.${m}`)}</button>
            {/each}
          </div>
          <label class="sh-field">
            {$t(draft.thresholdMode === 'pct' ? 'shop.promo.value.pct' : 'shop.promo.value.off')}
            <input class="sh-input sh-num" type="number" min="0" step="any" inputmode="decimal" bind:value={draft.value} />
          </label>
        {/if}
        <label class="sh-field">
          {$t('shop.promo.name')}
          <input class="sh-input" bind:value={draft.name} maxlength="80" placeholder={$t('shop.promo.namePh')} />
        </label>
      {:else if step === 'scope'}
        {#if kindIsStoreWide(draft.kind)}
          <p>{$t('lev.promo.scope.all')}</p>
        {:else}
          <div class="sh-seg" role="group">
            <button type="button" aria-pressed={!draft.all} onclick={() => (draft.all = false)}>{$t('shop.promo.pickProducts')}</button>
            <button type="button" aria-pressed={draft.all} onclick={() => (draft.all = true)}>{$t('lev.promo.scope.all')}</button>
          </div>
          {#if !draft.all}
            <p class="pm-muted">{$t('shop.promo.picked', { count: draft.products.length })}</p>
            <ul class="pm-products">
              {#each setup.shelf as p (p.id)}
                {@const why = promoIneligible(p)}
                <li>
                  <label class="pm-check" class:pm-disabled={!!why}>
                    <input type="checkbox" checked={draft.products.includes(p.id)} disabled={!!why} onchange={() => toggleProduct(p.id)} />
                    <span><bdi>{p.name}</bdi>{#if p.price != null}<span class="pm-muted"> · {p.price}</span>{/if}</span>
                    {#if why}<span class="pm-muted">{$t(`shop.promo.ineligible.${why}`)}</span>{/if}
                  </label>
                </li>
              {:else}
                <li class="pm-muted">{$t('shop.promo.noProducts')}</li>
              {/each}
            </ul>
          {/if}
        {/if}
      {:else}
        <div class="pm-grid2">
          <label class="sh-field">
            {$t('shop.promo.startsOn')}
            <input class="sh-input" type="date" bind:value={draft.startsOn} />
            <span class="pm-muted">{$t('shop.promo.startsOnHint')}</span>
          </label>
          <label class="sh-field">
            {$t('shop.promo.endsOn')}
            <input class="sh-input" type="date" bind:value={draft.endsOn} required />
          </label>
        </div>
        <label class="sh-field">
          {$t('shop.promo.capUnits')}
          <input class="sh-input sh-num" type="number" min="1" step="1" inputmode="numeric" bind:value={draft.capUnits} />
          <span class="pm-muted">{$t('shop.promo.capHint')}</span>
        </label>
        <label class="sh-field">
          {$t('shop.promo.why')}
          <textarea class="sh-input pm-why" rows="2" maxlength="500" bind:value={draft.why}></textarea>
        </label>

        {#if preview.terms}
          <div class="pm-preview" class:pm-preview-vote={preview.needsVote}>
            <strong>{preview.needsVote ? $t('shop.promo.preview.vote') : $t('shop.promo.preview.now')}</strong>
            <PromotionTerms kind={preview.terms.kind} rule={preview.terms.rule} scope={preview.terms.scope} startsAt={preview.terms.startsAt} endsAt={preview.terms.endsAt} name={preview.terms.name} />
            <span>{$t('shop.promo.preview.reaches', { count: preview.reaches.length })}</span>
            {#if preview.blocked.length}
              <span class="pm-muted">{$t('shop.promo.preview.blocked', { names: preview.blocked.map((p) => p.name).join(', ') })}</span>
            {/if}
            {#if preview.needsVote}
              <ul class="pm-breaches">
                {#each preview.breaches as b, i (i)}<li>{breachText(b)}</li>{/each}
              </ul>
              {#if preview.earliest}
                <span>{$t('shop.promo.preview.earliest', { date: fmtDate(preview.earliest) })}</span>
              {/if}
              {#if preview.startsLate}<span class="pm-muted">{$t('lev.promo.startsLate')}</span>{/if}
            {/if}
          </div>
        {/if}
      {/if}

      {#if tried[step] && problems[step].length}
        <ul class="pm-problems" role="alert">
          {#each problems[step] as p (p)}<li>{problemText(p)}</li>{/each}
        </ul>
      {/if}

      <div class="pm-nav">
        <button type="button" class="sh-btn sh-btn-quiet" onclick={back}>{step === 'what' ? $t('shop.promo.cancel') : $t('shop.promo.back')}</button>
        {#if step === 'when'}
          <button type="button" class="sh-btn sh-btn-primary" disabled={busy === 'propose'} onclick={send}>
            {preview.needsVote ? $t('shop.promo.sendVote') : $t('shop.promo.sendNow')}
          </button>
        {:else}
          <button type="button" class="sh-btn sh-btn-primary" onclick={next}>{$t('shop.promo.next')}</button>
        {/if}
      </div>
    </section>
  {/if}

  {@render section($t('shop.promo.sec.live'), groups.live)}
  {@render section($t('shop.promo.sec.upcoming'), groups.upcoming)}
  {@render section($t('shop.promo.sec.proposals'), groups.proposals)}
  {#if !setup.promotions.length && !wizardOpen}
    <ShopNotice title={$t('shop.promo.empty')} body={$t('shop.promo.emptyBody')} />
  {/if}

  <section class="pm-policy sh-card">
    <div class="pm-policy-head">
      <span class="sh-section-label">{$t('lev.promo.policyTitle')}</span>
      <span class="pm-muted">{$t('lev.promo.policySub')}</span>
    </div>
    {#if setup.policy}
      <ul class="pm-policy-lines">
        <li>{$t('lev.promo.policy.line', { pct: setup.policy.maxPct, days: setup.policy.maxDays })}</li>
        <li>{setup.policy.kinds.map(kindLabel).join(' · ')}</li>
        <li>{setup.policy.floor === 'none' ? $t('lev.promo.policy.floorNone') : $t('lev.promo.policy.floorCost')}</li>
        <li>{'roles' in setup.policy.who ? $t('lev.promo.policy.whoRoles') : $t('lev.promo.policy.whoMembers')}</li>
        <li>{$t('lev.promo.policy.arranged', { pct: setup.policy.arrangedDiscountPct })}</li>
      </ul>
    {:else}
      <p>{$t('shop.promo.policy.none')}</p>
    {/if}
    {#if setup.policyDecisionId}
      <a class="pm-link" href={voteHref(setup.policyDecisionId)}>{$t('shop.promo.policy.pending')}</a>
    {:else if !policyOpen}
      <button type="button" class="sh-btn sh-btn-outline" onclick={() => openPolicy(setup.policy)}>
        {setup.policy ? $t('shop.promo.policy.change') : $t('shop.promo.policy.propose')}
      </button>
    {/if}

    {#if policyOpen}
      <div class="pm-policy-form">
        <div class="pm-grid3">
          <label class="sh-field">{$t('lev.promo.counter.maxPct')}<input class="sh-input sh-num" type="number" min="0" max="100" step="1" inputmode="numeric" bind:value={policyDraft.maxPct} /></label>
          <label class="sh-field">{$t('lev.promo.counter.maxDays')}<input class="sh-input sh-num" type="number" min="1" step="1" inputmode="numeric" bind:value={policyDraft.maxDays} /></label>
          <label class="sh-field">{$t('shop.promo.policy.arranged')}<input class="sh-input sh-num" type="number" min="0" max="100" step="1" inputmode="numeric" bind:value={policyDraft.arrangedDiscountPct} /></label>
        </div>
        <fieldset class="sh-field pm-fs">
          <legend>{$t('shop.promo.policy.kinds')}</legend>
          <div class="pm-kinds">
            {#each PROMO_KINDS as k (k)}
              <button type="button" class="sh-chip" class:sh-chip-accent={policyDraft.kinds.includes(k)} aria-pressed={policyDraft.kinds.includes(k)} onclick={() => toggleKind(k)}>{kindLabel(k)}</button>
            {/each}
          </div>
        </fieldset>
        <div class="sh-seg" role="group">
          <button type="button" aria-pressed={policyDraft.floor === 'cost'} onclick={() => (policyDraft.floor = 'cost')}>{$t('lev.promo.policy.floorCost')}</button>
          <button type="button" aria-pressed={policyDraft.floor === 'none'} onclick={() => (policyDraft.floor = 'none')}>{$t('lev.promo.policy.floorNone')}</button>
        </div>
        <p class="pm-muted">{$t('shop.promo.policy.voteNote')}</p>
        <div class="pm-nav">
          <button type="button" class="sh-btn sh-btn-quiet" onclick={() => (policyOpen = false)}>{$t('shop.promo.cancel')}</button>
          <button type="button" class="sh-btn sh-btn-primary" disabled={!policyValid || busy === 'policy'} onclick={sendPolicy}>{$t('shop.promo.policy.send')}</button>
        </div>
      </div>
    {/if}
  </section>

  {@render section($t('shop.promo.sec.ended'), groups.ended)}
{/if}

<style>
  .pm-muted {
    color: var(--sh-muted);
    font-size: 13px;
  }
  .pm-link {
    color: var(--sh-gold);
    font-weight: 700;
    font-size: 14px;
  }
  .pm-banner {
    padding: 12px 16px;
    border-color: var(--sh-gold-line);
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: var(--sh-ink);
    margin-bottom: 14px;
  }
  .pm-banner ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 15px;
  }
  .pm-intro {
    padding: 14px 16px;
    border-radius: var(--sh-radius-sm);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    color: var(--sh-ink);
    font-size: 14px;
  }
  .pm-intro p {
    flex: 1 1 260px;
    margin: 0;
  }
  .pm-wizard,
  .pm-policy {
    margin-top: 16px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    color: var(--sh-ink);
  }
  .pm-steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    font-size: 14px;
    color: var(--sh-muted);
  }
  .pm-steps li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .pm-steps li[aria-current='step'] {
    color: var(--sh-ink);
    font-weight: 700;
  }
  .pm-step-n {
    width: 22px;
    height: 22px;
    border-radius: 9999px;
    border: 1px solid var(--sh-line);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }
  [aria-current='step'] .pm-step-n {
    background: var(--sh-gold);
    border-color: var(--sh-gold);
    color: var(--sh-card);
  }
  .pm-kinds {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .pm-grid2,
  .pm-grid3 {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }
  @media (min-width: 700px) {
    .pm-grid2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .pm-grid3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .pm-products {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 320px;
    overflow-y: auto;
  }
  .pm-check {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    min-height: 40px;
    font-size: 14px;
    cursor: pointer;
  }
  .pm-check input {
    width: 18px;
    height: 18px;
    flex: none;
  }
  .pm-disabled {
    cursor: default;
    opacity: 0.7;
  }
  .pm-why {
    min-height: 64px;
    padding-top: 10px;
  }
  .pm-preview {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 14px;
    border-radius: var(--sh-radius-sm);
    border: 1px solid var(--sh-line);
    background: var(--sh-card-2);
    font-size: 14px;
  }
  .pm-preview-vote {
    border-color: var(--sh-warn-line);
    background: var(--sh-warn-tint);
  }
  .pm-breaches,
  .pm-problems {
    margin: 0;
    padding-inline-start: 18px;
    font-size: 14px;
  }
  .pm-problems {
    color: var(--sh-warn, var(--sh-ink));
  }
  .pm-nav {
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }
  .pm-sec {
    margin-top: 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .pm-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .pm-row {
    padding: 12px 14px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    color: var(--sh-ink);
    font-size: 14px;
  }
  .pm-row-main {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    flex: 1 1 260px;
  }
  .pm-row-chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .pm-row-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .pm-policy-head {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .pm-policy-lines {
    margin: 0;
    padding-inline-start: 18px;
    font-size: 14px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .pm-policy-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    border-top: 1px solid var(--sh-line);
    padding-top: 12px;
  }
  .pm-fs {
    border: 0;
    padding: 0;
    margin: 0;
  }
</style>
