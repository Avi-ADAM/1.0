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
  import { t, isRtl, locale } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { cycleLabel } from '$lib/stipend/cycleLabel.js';
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
  const payments = $derived(overview?.payments ?? []);

  /**
   * Live commitments first, history after.
   *
   * A rikma that has been through a few rounds ends up with far more closed
   * pledges than open ones — this test rikma renders 11 closed to 1 active —
   * and a closed pledge shown at full height, with three figures that all read
   * ₪0, buries the one commitment anybody is asking about. So terminal states
   * sort to the bottom and render as a single line (`isLive` below).
   */
  const LIVE = new Set(['active', 'proposed']);
  const RANK = { active: 0, proposed: 1, exhausted: 2, closed: 3, withdrawn: 4 };
  const pledges = $derived(
    [...(overview?.pledges ?? [])].sort(
      (a, b) => (RANK[a.status] ?? 9) - (RANK[b.status] ?? 9)
    )
  );
  const policy = $derived(overview?.policyIsDefault ? null : (overview?.policy ?? null));

  /**
   * The ledger gets long in a rikma that funds several people, and the question
   * a member arrives with is almost always about **one** of them ("what has
   * Dana actually received?"). So the filter is by recipient, and it only
   * appears once there is more than one.
   */
  let payFilter = $state('all');
  const recipientsWithPayments = $derived.by(() => {
    const seen = new Map();
    for (const p of payments) {
      if (p.recipientId && !seen.has(String(p.recipientId))) {
        seen.set(String(p.recipientId), { id: String(p.recipientId), name: p.recipientName || '—' });
      }
    }
    return Array.from(seen.values());
  });
  const visiblePayments = $derived(
    payFilter === 'all' ? payments : payments.filter((p) => String(p.recipientId) === payFilter)
  );

  function money(n) {
    return `₪${Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
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
          <!-- Approved work nobody has settled yet. The rikma could see what
               had already moved and nothing about what was still owed — the
               half of the question the person waiting actually asks. -->
          <span class="stat-label {LABEL}">{$t('stipend.tab.accrued')}</span>
          <span class="stat-value {ACCENT}">{money(totals.accrued)}</span>
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

    <!--
      Pledges — the answer to "who is funding whom, for what, and where does it
      stand right now". The old row said only rate/mode/status/paid-so-far,
      which left the two questions people actually ask unanswered: what work is
      this for, and what is owed that has not arrived yet (docs/FIXES.md §14).
    -->
    <section class="block {SURFACE} p-4">
      <h2 class="block-title {TITLE}">{$t('stipend.tab.pledges')}</h2>
      {#if pledges.length === 0}
        <p class="empty {FAINT}">{$t('stipend.tab.noPledges')}</p>
      {:else}
        <ul class="list">
          {#each pledges as pl (pl.id)}
            {@const st = pl.state ?? {}}
            {@const isLive = LIVE.has(pl.status)}
            {#if !isLive}
              <!-- History: one line. It happened, it is over, and the money it
                   moved is in the cycle ledger below. -->
              <li class="row {WELL}">
                <span class="chip chip-{pl.status}">{$t(`stipend.status.${pl.status}`)}</span>
                <div class="grow min-w-0">
                  <p class="{BODY} truncate text-sm">
                    {pl.funderName || $t('stipend.card.noFunderYet')}
                    <span class={ACCENT}>→</span>
                    {pl.recipientName}
                    <span class={FAINT}>· ₪{pl.terms.stipendRate}/{$t('stipend.card.hour')}</span>
                  </p>
                </div>
                <span class="{MUTED} whitespace-nowrap">
                  {$t('stipend.tab.paidSoFar', { count: money(pl.paidTotal) })}
                </span>
              </li>
            {:else}
            <li class="pledge {WELL}">
              <div class="pledge-head">
                <div class="min-w-0">
                  <p class="{TITLE} flex flex-wrap items-center gap-x-2">
                    <span>{pl.funderName || $t('stipend.card.noFunderYet')}</span>
                    <span class={ACCENT}>→</span>
                    <span>{pl.recipientName}</span>
                    {#if String(pl.recipientId) === myId || String(pl.funderId) === myId}
                      <span class="chip chip-mine">{$t('stipend.tab.mine')}</span>
                    {/if}
                  </p>
                  {#if pl.missionNames?.length}
                    <p class="{MUTED} truncate">
                      {$t('stipend.cycle.forWork')}: {pl.missionNames.join(' · ')}
                    </p>
                  {/if}
                </div>
                <span class="chip chip-{pl.status}">{$t(`stipend.status.${pl.status}`)}</span>
              </div>

              <p class={MUTED}>
                ₪{pl.terms.stipendRate}/{$t('stipend.card.hour')} ·
                {$t(`stipend.mode.${pl.terms.mode}`)} ·
                {pl.terms.costShare >= 1
                  ? $t('stipend.terms.costShareRecipient')
                  : pl.terms.costShare <= 0
                    ? $t('stipend.terms.costShareRikma')
                    : `α ${pl.terms.costShare}`}
              </p>

              <!--
                Three numbers, three different states of the same money:
                already settled and confirmed · sent and waiting on the
                recipient · approved and not settled by anyone yet.
              -->
              <div class="figures">
                <div class="figure">
                  <span class={LABEL}>{$t('stipend.tab.paid')}</span>
                  <b class={ACCENT}>{money(pl.paidTotal)}</b>
                  {#if pl.terms.totalCap}
                    <span class={FAINT}>{$t('stipend.tab.ofCap', { count: money(pl.terms.totalCap) })}</span>
                  {/if}
                </div>
                <div class="figure">
                  <span class={LABEL}>{$t('stipend.tab.pending')}</span>
                  <b class={st.awaitingConfirmation > 0 ? 'text-amber-700 dark:text-amber-300' : BODY}>
                    {money(st.awaitingConfirmation ?? 0)}
                  </b>
                  {#if st.awaitingConfirmation > 0}
                    <span class={FAINT}>{$t('stipend.tab.pendingHint')}</span>
                  {/if}
                </div>
                <div class="figure">
                  <span class={LABEL}>{$t('stipend.tab.accrued')}</span>
                  <b class={st.accruedUnpaid > 0 ? ACCENT : BODY}>{money(st.accruedUnpaid ?? 0)}</b>
                  {#if st.accruedUnpaid > 0}
                    <span class={FAINT}>
                      {$t('stipend.tab.accruedHint', {
                        hours: st.accruedHours,
                        period: cycleLabel(st.cycleStart, st.cycleEnd, $locale || 'he')
                      })}
                    </span>
                  {/if}
                </div>
              </div>
            </li>
            {/if}
          {/each}
        </ul>
      {/if}
    </section>

    <!--
      The cycle ledger. `payments` was fetched by getStipendOverview from the
      first day and never rendered, so "how much did this person receive, and
      for what" had no screen anywhere in the product (docs/FIXES.md §11).
      Every row is one month of one stipend, with what it did to the books.
    -->
    <section class="block {SURFACE} p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="block-title {TITLE}">{$t('stipend.tab.cycles')}</h2>
        {#if recipientsWithPayments.length > 1}
          <div class="filters">
            <button
              type="button"
              class="chip chip-filter {payFilter === 'all' ? 'chip-on' : ''}"
              onclick={() => (payFilter = 'all')}
            >
              {$t('stipend.tab.filterAll')}
            </button>
            {#each recipientsWithPayments as r (r.id)}
              <button
                type="button"
                class="chip chip-filter {payFilter === r.id ? 'chip-on' : ''}"
                onclick={() => (payFilter = r.id)}
              >
                {r.name}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      {#if visiblePayments.length === 0}
        <p class="empty {FAINT}">{$t('stipend.tab.noCycles')}</p>
      {:else}
        <ul class="list">
          {#each visiblePayments as p (p.id)}
            <li class="cycle {WELL}">
              <div class="cycle-when">
                <b class={BODY}>{cycleLabel(p.cycleStart, p.cycleEnd, $locale || 'he')}</b>
                <span class="chip chip-pay-{p.status}">{$t(`stipend.payStatus.${p.status}`)}</span>
              </div>
              <div class="cycle-what min-w-0">
                <p class={BODY}>
                  <span class="font-medium">{p.funderName}</span>
                  <span class={ACCENT}>→</span>
                  <span class="font-medium">{p.recipientName}</span>
                </p>
                <p class="{MUTED} truncate">
                  {#if p.missionNames?.length}{p.missionNames.join(' · ')} · {/if}
                  {$t('stipend.pay.hours', { count: p.hours })} × ₪{p.stipendRate}
                </p>
              </div>
              <div class="cycle-money">
                <b class="{ACCENT} whitespace-nowrap">{money(p.amount)}</b>
                {#if p.status === 'confirmed' && (p.equityCredit || p.equityDebit)}
                  <span class={FAINT}>
                    {$t('stipend.tab.cycleEquity', {
                      credit: money(p.equityCredit),
                      debit: money(p.equityDebit)
                    })}
                  </span>
                {:else if p.mode === 'gift'}
                  <span class={FAINT}>{$t('stipend.mode.gift')}</span>
                {/if}
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

  /* ── A pledge, as a small statement rather than a line of text ─────────── */
  .pledge {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.85rem 1rem;
  }
  .pledge-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
  }
  /* The three states of the same money, side by side and equally weighted —
     "paid", "sent but unconfirmed" and "earned but unsettled" are different
     answers to different questions and none of them is a footnote. */
  .figures {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(115px, 1fr));
    gap: 0.5rem;
    margin-top: 0.15rem;
  }
  .figure {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.5rem 0.65rem;
    border-radius: 0.6rem;
    /* A wash rather than a border: three bordered boxes inside a bordered
       well reads as a table nobody asked for. */
    background: rgb(148 163 184 / 0.12);
  }
  .figure b {
    font-size: 1.05rem;
    font-weight: 800;
    line-height: 1.2;
  }

  /* ── One cycle in the ledger ───────────────────────────────────────────── */
  .cycle {
    display: grid;
    grid-template-columns: minmax(120px, auto) 1fr auto;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 1rem;
  }
  @media (max-width: 640px) {
    .cycle {
      grid-template-columns: 1fr;
      gap: 0.35rem;
    }
  }
  .cycle-when {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  .cycle-money {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.15rem;
    text-align: end;
  }
  @media (max-width: 640px) {
    .cycle-money {
      align-items: flex-start;
      text-align: start;
    }
  }

  /* ── Chips: status, ownership, filter ──────────────────────────────────── */
  .chip {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 700;
    line-height: 1.5;
  }
  /* Every chip states both inks explicitly. A chip that inherits its colour is
     unreadable in one of the four identity × brightness combinations — the
     rule ./ui.js exists for. */
  .chip-active,
  .chip-pay-confirmed {
    background: rgb(16 185 129 / 0.16);
    color: rgb(4 108 78);
  }
  .chip-proposed,
  .chip-pay-sent {
    background: rgb(245 158 11 / 0.18);
    color: rgb(120 68 5);
  }
  .chip-exhausted,
  .chip-closed,
  .chip-withdrawn,
  .chip-pay-cancelled,
  .chip-pay-pending {
    background: rgb(148 163 184 / 0.22);
    color: rgb(51 65 85);
  }
  .chip-mine {
    background: rgb(148 163 184 / 0.22);
    color: rgb(51 65 85);
  }
  :global(.dark) .chip-active,
  :global(.dark) .chip-pay-confirmed {
    background: rgb(16 185 129 / 0.22);
    color: rgb(167 243 208);
  }
  :global(.dark) .chip-proposed,
  :global(.dark) .chip-pay-sent {
    background: rgb(245 158 11 / 0.22);
    color: rgb(253 230 138);
  }
  :global(.dark) .chip-exhausted,
  :global(.dark) .chip-closed,
  :global(.dark) .chip-withdrawn,
  :global(.dark) .chip-pay-cancelled,
  :global(.dark) .chip-pay-pending,
  :global(.dark) .chip-mine {
    background: rgb(148 163 184 / 0.25);
    color: rgb(226 232 240);
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-bottom: 0.5rem;
  }
  .chip-filter {
    cursor: pointer;
    border: 1px solid rgb(148 163 184 / 0.5);
    background: transparent;
    color: inherit;
    padding: 0.2rem 0.65rem;
    transition: border-color 0.15s ease;
  }
  .chip-filter:hover {
    border-color: var(--goldink);
  }
  .chip-on {
    border-color: var(--goldink);
    color: var(--goldink);
  }
</style>
