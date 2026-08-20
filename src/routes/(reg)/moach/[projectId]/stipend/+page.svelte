<script>
  /**
   * The rikma's subsistence-stipend tab (docs/PLAN_STIPEND.md §8).
   *
   * What it has to show, and why each part is not optional:
   *   - the programmes and what is **left** of their budgets, because the
   *     budget is the bound on the dilution and an exhausted one closes itself;
   *   - every pledge and both its ends, because "who is funding whom" in a
   *     rikma should never be a private arrangement nobody else can see;
   *   - the dilution actually incurred so far, because overlapping programmes
   *     can add up past what anyone expected (§11.4) and the only defence is
   *     that the running total is on one screen;
   *   - and the two buttons: propose a programme, and — when the rikma has no
   *     funder among its own members — publish the need as an open resource
   *     request so someone outside can join by funding it.
   */
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { t, isRtl } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import Lowding from '$lib/celim/lowding.svelte';
  import StipendButton from '$lib/components/stipend/StipendButton.svelte';
  import StipendFundingRequestDialog from '$lib/components/stipend/StipendFundingRequestDialog.svelte';
  // Every block here states its own ground and its own ink. The moach shell
  // paints a radial gradient that runs from slate-400 in the middle to almost
  // black at the edges, so a card with no background of its own is readable in
  // one half of the page and invisible in the other — which is exactly what a
  // bare `text-slate-300` on this page looked like. The palette in
  // $lib/components/stipend/ui.js exists for that reason; use it, don't
  // hand-pick colours here.
  import {
    SURFACE,
    WELL,
    TITLE,
    BODY,
    MUTED,
    FAINT,
    LABEL,
    ACCENT,
    BTN_PRIMARY,
    BTN_GHOST
  } from '$lib/components/stipend/ui.js';

  const BTN_SMALL = `${BTN_GHOST} px-3 py-1.5 text-xs font-bold flex items-center gap-1`;

  let projectId = $derived(page.params.projectId);
  let myId = $derived(String(page.data.uid ?? ''));
  let projectName = $derived(page.data.projectBase?.projectName ?? '');

  let loading = $state(true);
  let overview = $state(null);
  let fundingFor = $state(null);

  async function load() {
    loading = true;
    try {
      const res = await executeAction('getStipendOverview', { projectId });
      if (res?.success) overview = res.data;
      else toast.error($t('stipend.toast.error'));
    } catch (e) {
      console.error('[stipend tab] load failed:', e);
      toast.error($t('stipend.toast.error'));
    } finally {
      loading = false;
    }
  }

  onMount(load);

  const members = $derived(overview?.members ?? []);
  const totals = $derived(overview?.totals ?? null);
  const programs = $derived(overview?.programs ?? []);
  const pledges = $derived(overview?.pledges ?? []);
  const policy = $derived(overview?.policyIsDefault ? null : (overview?.policy ?? null));

  function money(n) {
    return `₪${Number(n ?? 0).toLocaleString()}`;
  }
</script>

<svelte:head>
  <title>{projectName ? `${projectName} · ` : ''}{$t('stipend.tab.title')} · 1lev1</title>
</svelte:head>

<div class="stipend-page" dir={$isRtl ? 'rtl' : 'ltr'}>
  {#if loading}
    <div class="flex justify-center p-12"><Lowding /></div>
  {:else if overview}
    <header class="{SURFACE} flex flex-wrap items-start justify-between gap-3 p-4">
      <div>
        <h1 class="text-xl {TITLE}">{$t('stipend.tab.title')}</h1>
        <p class="text-sm {BODY} max-w-prose">{$t('stipend.tab.intro')}</p>
        <p class="mt-1 {MUTED}">
          {$t('stipend.tab.policy')}:
          <b class={ACCENT}>{$t(`stipend.policy.${overview.policy}`)}</b>
          {#if overview.policyIsDefault}
            <span class={FAINT}>· {$t('stipend.tab.policyDefault')}</span>
          {/if}
        </p>
      </div>
      <StipendButton
        intent="program"
        {projectId}
        {projectName}
        {members}
        {myId}
        {policy}
        defaultRate={overview.defaultRate}
        defaultCostShare={overview.defaultCostShare}
        className="{BTN_PRIMARY} px-4 py-2 text-sm flex items-center gap-2"
        onDone={load}
      />
    </header>

    {#if totals}
      <section class="totals">
        <div class="stat {SURFACE}">
          <span class="stat-label {LABEL}">{$t('stipend.tab.paid')}</span>
          <span class="stat-value {ACCENT}">{money(totals.paid)}</span>
        </div>
        <div class="stat {SURFACE}">
          <span class="stat-label {LABEL}">{$t('stipend.tab.pending')}</span>
          <span class="stat-value {ACCENT}">{money(totals.pending)}</span>
        </div>
        <div class="stat {SURFACE}">
          <span class="stat-label {LABEL}">{$t('stipend.tab.budgetLeft')}</span>
          <span class="stat-value {ACCENT}">{money(totals.budgetLeft)}</span>
        </div>
        <div class="stat {SURFACE}">
          <!-- (k − α)·ΣP: what the stipends added to the rikma's total, i.e.
               how much everyone else was diluted, in shekels rather than in
               an abstract percentage. -->
          <span class="stat-label {LABEL}">{$t('stipend.tab.netAdded')}</span>
          <span class="stat-value {ACCENT}">{money(totals.netAdded)}</span>
        </div>
      </section>
    {/if}

    <!-- Programmes -->
    <section class="block {SURFACE} p-4">
      <h2 class="block-title {TITLE}">{$t('stipend.tab.programs')}</h2>
      {#if programs.length === 0}
        <p class="empty {FAINT}">{$t('stipend.tab.noPrograms')}</p>
      {:else}
        <ul class="list">
          {#each programs as p (p.id)}
            <li class="row {WELL}">
              <div class="grow">
                <p class={TITLE}>{p.name}</p>
                <p class={MUTED}>
                  ₪{p.stipendRate}/{$t('stipend.card.hour')} ·
                  {$t('stipend.terms.costShare')} {Math.round(Number(p.costShare) * 100)}% ·
                  {$t(`stipend.mode.${p.mode}`)} ·
                  {$t(`stipend.status.${p.status}`)}
                </p>
                <p class={MUTED}>
                  {$t('stipend.tab.spentOf', {
                    spent: money(p.spent),
                    cap: money(p.totalCap ?? 0)
                  })}
                </p>
              </div>
              <div class="flex flex-col gap-2 items-stretch">
                {#if !p.funderId}
                  <!-- §12.2 — no funder inside the rikma: go and find one. -->
                  <button
                    type="button"
                    class={BTN_SMALL}
                    onclick={() => (fundingFor = p)}
                  >
                    🔎 {$t('stipend.tab.findFunder')}
                  </button>
                {/if}
                {#if p.status === 'active'}
                  <StipendButton
                    intent="offer"
                    {projectId}
                    {projectName}
                    {members}
                    {myId}
                    {policy}
                    programId={p.id}
                    funderId={p.funderId ?? ''}
                    defaultRate={p.stipendRate}
                    defaultCostShare={p.costShare}
                    label={$t('stipend.tab.pledgeInside')}
                    className={BTN_SMALL}
                    onDone={load}
                  />
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <!-- Pledges -->
    <section class="block {SURFACE} p-4">
      <h2 class="block-title {TITLE}">{$t('stipend.tab.pledges')}</h2>
      {#if pledges.length === 0}
        <p class="empty {FAINT}">{$t('stipend.tab.noPledges')}</p>
      {:else}
        <ul class="list">
          {#each pledges as pl (pl.id)}
            <li class="row {WELL}">
              <div class="grow">
                <p class={TITLE}>{pl.funderName} → {pl.recipientName}</p>
                <p class={MUTED}>
                  ₪{pl.terms.stipendRate}/{$t('stipend.card.hour')} ·
                  {$t(`stipend.mode.${pl.terms.mode}`)} ·
                  {$t(`stipend.status.${pl.status}`)}
                </p>
                <p class={MUTED}>
                  {$t('stipend.tab.paidSoFar', { count: money(pl.paidTotal) })}
                  {#if pl.terms.totalCap}
                    · {$t('stipend.terms.totalCap')}: {money(pl.terms.totalCap)}
                  {/if}
                </p>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <!-- Per-member ledger: who gained and who gave up equity through stipends -->
    {#if overview.perMember?.length}
      <section class="block {SURFACE} p-4">
        <h2 class="block-title {TITLE}">{$t('stipend.tab.perMember')}</h2>
        <ul class="list">
          {#each overview.perMember as m (m.userId)}
            <li class="row {WELL}">
              <div class="grow">
                <p class={TITLE}>{m.username}</p>
                <p class={MUTED}>
                  {#if m.funded > 0}{$t('stipend.tab.funded', { count: money(m.funded) })}{/if}
                  {#if m.received > 0}
                    · {$t('stipend.tab.received', { count: money(m.received) })}
                  {/if}
                </p>
              </div>
              <span class="whitespace-nowrap font-bold {m.net >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}">
                {m.net >= 0 ? '+' : ''}{money(m.net)}
              </span>
            </li>
          {/each}
        </ul>
        <p class="mt-2 {FAINT}">{$t('stipend.tab.perMemberNote')}</p>
      </section>
    {/if}

    <!-- Member-to-member offer: the "another user in the rikma" entry point -->
    <section class="block {SURFACE} p-4">
      <h2 class="block-title {TITLE}">{$t('stipend.tab.members')}</h2>
      <ul class="list">
        {#each members as m (m.id)}
          <li class="row {WELL}">
            <span class="grow font-medium {BODY}">{m.username}</span>
            {#if String(m.id) !== myId}
              <StipendButton
                intent="offer"
                {projectId}
                {projectName}
                {members}
                {myId}
                funderId={myId}
                recipientId={String(m.id)}
                {policy}
                defaultRate={overview.defaultRate}
                defaultCostShare={overview.defaultCostShare}
                label={$t('stipend.tab.offerTo', { name: m.username })}
                className={BTN_SMALL}
                onDone={load}
              />
            {:else}
              <StipendButton
                intent="request"
                {projectId}
                {projectName}
                {members}
                {myId}
                recipientId={myId}
                {policy}
                defaultRate={overview.defaultRate}
                defaultCostShare={overview.defaultCostShare}
                className={BTN_SMALL}
                onDone={load}
              />
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</div>

<StipendFundingRequestDialog
  bind:program={fundingFor}
  {projectName}
  onDone={load}
/>

<style>
  .stipend-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 0.5rem 0 3rem;
  }
  .totals {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
  }
  /* Ground, edge and radius come from SURFACE; only the layout is here. */
  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.75rem 1rem;
  }
  .stat-label {
    font-size: 0.7rem;
    text-transform: uppercase;
  }
  .stat-value {
    font-size: 1.15rem;
    font-weight: 800;
  }
  .block-title {
    font-size: 0.95rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  /* Ground, edge and radius come from WELL; only the layout is here. */
  .row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }
  .grow {
    flex: 1 1 auto;
    min-width: 0;
  }
  .empty {
    font-size: 0.85rem;
  }
</style>
