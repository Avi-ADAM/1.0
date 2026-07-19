<script lang="ts">
  import StatsRow from '$lib/components/deals/StatsRow.svelte';
  import DealCard from '$lib/components/deals/DealCard.svelte';
  import PendingRequestCard from '$lib/components/deals/PendingRequestCard.svelte';
  import IncomingWishCard from '$lib/components/deals/IncomingWishCard.svelte';
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { invalidateAll } from '$app/navigation';
  import RecurringCycleCard from '$lib/components/sales/RecurringCycleCard.svelte';
  import {
    saleToDeal,
    salesToStats,
    type DealKind
  } from '$lib/services/dealsService';

  let { data } = $props();

  type TabKind = DealKind | 'pending' | 'wishes';
  let tab = $state<TabKind>('purchase');

  const purchases = $derived(data.purchases ?? []);
  const sales = $derived(data.sales ?? []);
  const pendingBuy = $derived(data.pendingBuy ?? []);
  const pendingSell = $derived(data.pendingSell ?? []);
  const pendingAll = $derived([...pendingBuy, ...pendingSell]);
  const incomingWishes = $derived(data.incomingWishes ?? []);
  const newWishCount = $derived(incomingWishes.filter((w) => w.status === 'suggested').length);

  // PLAN_RECURRING_SALES — standing orders where I'm the paying customer:
  // one open cycle per month, asking how much I transferred.
  const customerCycles = $derived(data.customerCycles ?? []);

  const activeList = $derived(tab === 'purchase' ? purchases : tab === 'sale' ? sales : []);
  const deals = $derived(
    tab === 'purchase' || tab === 'sale'
      ? activeList.map((s) => saleToDeal(s, tab as DealKind))
      : []
  );
  const stats = $derived(salesToStats(activeList));
</script>

<svelte:head>
  <title>{$t('deals.title')}</title>
  <meta property="og:image" content="/deals%20logo.png" />
  <meta property="og:title" content={$t('deals.title')} />
</svelte:head>

<main class="page-wrap">
  <div class="page-top anim">
    <div>
      <h1 class="page-title">{$t('deals.title')} <span class="accent"></span></h1>
      <p class="page-sub">{$t('deals.subtitle')}</p>
    </div>
    <img src="/deals%20logo.png" alt={$t('deals.logo_alt')} class="page-logo" />
  </div>

  <!-- Quick Action Links -->
  <div class="quick-links anim">
    <a href="/deals/sales-center" class="quick-card quick-card--gold">
      <span class="quick-icon">🏪</span>
      <span class="quick-body">
        <span class="quick-title">{$t('deals.quick_sales_center')}</span>
        <span class="quick-hint">{$t('deals.quick_sales_center_hint')}</span>
      </span>
      <span class="quick-arrow">←</span>
    </a>
    <a href="/concierge" class="quick-card quick-card--pink">
      <span class="quick-icon">🎩</span>
      <span class="quick-body">
        <span class="quick-title">{$t('deals.quick_concierge')}</span>
        <span class="quick-hint">{$t('deals.quick_concierge_hint')}</span>
      </span>
      <span class="quick-arrow">←</span>
    </a>
  </div>

  {#if customerCycles.length > 0}
    <section class="cycles-section anim">
      <h2 class="cycles-title">
        {$lang === 'he'
          ? `💳 הוראות קבע — עדכון חודשי (${customerCycles.length})`
          : `💳 Standing orders — monthly update (${customerCycles.length})`}
      </h2>
      <p class="cycles-sub">
        {$lang === 'he'
          ? 'כמה העברת החודש? העדכון שלך יאפשר למוכר לאשרר שהתקבל. גם 0 הוא עדכון.'
          : 'How much did you transfer this month? Your update lets the seller confirm receipt. 0 counts too.'}
      </p>
      <div class="cycles-grid">
        {#each customerCycles as cycle (cycle.id)}
          <RecurringCycleCard {cycle} role="customer" onDone={() => invalidateAll()} />
        {/each}
      </div>
    </section>
  {/if}

  <!-- Tabs -->
  <div class="tabs anim">
    <button
      class="tab"
      class:active={tab === 'purchase'}
      onclick={() => (tab = 'purchase')}
    >
      {$t('deals.my_purchases')}
      <span class="count">{purchases.length}</span>
    </button>
    <button
      class="tab"
      class:active={tab === 'sale'}
      onclick={() => (tab = 'sale')}
    >
      {$t('deals.my_sales')}
      <span class="count">{sales.length}</span>
    </button>
    <button
      class="tab"
      class:active={tab === 'pending'}
      onclick={() => (tab = 'pending')}
    >
      {$t('deals.pending_requests')}
      {#if pendingAll.length > 0}
        <span class="count warn">{pendingAll.length}</span>
      {:else}
        <span class="count">{pendingAll.length}</span>
      {/if}
    </button>
    <button
      class="tab"
      class:active={tab === 'wishes'}
      onclick={() => (tab = 'wishes')}
    >
      {$t('deals.incoming_wishes')}
      {#if newWishCount > 0}
        <span class="count warn">{newWishCount}</span>
      {:else}
        <span class="count">{incomingWishes.length}</span>
      {/if}
    </button>
  </div>

  {#if tab === 'purchase' || tab === 'sale'}
    <StatsRow {stats} />

    <div class="section-label">
      {tab === 'purchase' ? $t('deals.active_purchases') : $t('deals.active_sales')}
    </div>

    {#if deals.length === 0}
      <div class="empty">
        <p class="empty-text">
          {tab === 'purchase'
            ? $t('deals.no_active_purchases')
            : $t('deals.no_active_sales')}
        </p>
        <p class="empty-sub">
          {tab === 'purchase'
            ? $t('deals.cta_concierge_desc')
            : $t('deals.cta_sales_center_desc')}
        </p>
        {#if tab === 'purchase'}
          <a href="/concierge" class="empty-cta empty-cta--pink">
            🎩 {$t('deals.cta_find_products')}
          </a>
        {:else}
          <a href="/deals/sales-center" class="empty-cta empty-cta--gold">
            🏪 {$t('deals.cta_start_selling')}
          </a>
        {/if}
      </div>
    {:else}
      <div class="deals-grid">
        {#each deals as deal (deal.id)}
          <DealCard {deal} />
        {/each}
      </div>
    {/if}
  {:else if tab === 'pending'}
    <div class="section-label">{$t('deals.pending_requests_label')}</div>

    {#if pendingAll.length === 0}
      <div class="empty">
        <p class="empty-text">{$t('deals.no_pending_requests')}</p>
        <p class="empty-sub">{$t('deals.cta_concierge_desc')}</p>
        <a href="/concierge" class="empty-cta empty-cta--pink">
          🎩 {$t('deals.cta_find_products')}
        </a>
      </div>
    {:else}
      <div class="deals-grid">
        {#each pendingBuy as req (req.id)}
          <PendingRequestCard {req} kind="buy" />
        {/each}
        {#each pendingSell as req (req.id)}
          <PendingRequestCard {req} kind="sell" />
        {/each}
      </div>
    {/if}
  {:else}
    <div class="section-label">{$t('deals.incoming_wishes_label')}</div>

    {#if incomingWishes.length === 0}
      <div class="empty">
        <p class="empty-text">{$t('deals.no_incoming_wishes')}</p>
        <p class="empty-sub">{$t('deals.incoming_wishes_hint')}</p>
        <a href="/concierge" class="empty-cta empty-cta--pink">
          🎩 {$t('deals.cta_find_products')}
        </a>
      </div>
    {:else}
      <div class="deals-grid">
        {#each incomingWishes as wish (wish.proposalId)}
          <IncomingWishCard {wish} />
        {/each}
      </div>
    {/if}
  {/if}
</main>

<style>
  /* .page-top / .page-title / .page-sub / .page-logo / .accent are global — see app.postcss */

  /* ── Standing orders — monthly customer update ── */
  .cycles-section {
    margin-bottom: 24px;
  }
  .cycles-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--gold-l);
    margin: 0 0 4px;
  }
  .cycles-sub {
    font-size: 13px;
    color: var(--tm);
    margin: 0 0 14px;
  }
  .cycles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
    gap: 16px;
  }
  @media (max-width: 600px) {
    .cycles-grid {
      grid-template-columns: 1fr;
    }
  }

  /* ── Quick Action Links ── */
  .quick-links {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
  }
  .quick-card {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    padding: 12px 16px;
    border-radius: 12px;
    text-decoration: none;
    border: 1px solid transparent;
    transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    cursor: pointer;
  }
  .quick-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
  .quick-card--gold {
    background: var(--gold-d, rgba(212, 175, 55, 0.12));
    border-color: var(--gold, rgba(212, 175, 55, 0.3));
  }
  .quick-card--gold:hover {
    background: rgba(212, 175, 55, 0.2);
  }
  .quick-card--pink {
    background: var(--pink-d, rgba(255, 100, 150, 0.1));
    border-color: var(--pink, rgba(255, 100, 150, 0.3));
  }
  .quick-card--pink:hover {
    background: rgba(255, 100, 150, 0.18);
  }
  .quick-icon {
    font-size: 22px;
    flex-shrink: 0;
  }
  .quick-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }
  .quick-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .quick-hint {
    font-size: 11px;
    color: var(--tm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .quick-arrow {
    font-size: 14px;
    color: var(--tm);
    flex-shrink: 0;
    opacity: 0.6;
  }

  .tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    border-bottom: 1px solid var(--border);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .tabs::-webkit-scrollbar {
    display: none;
  }
  .tab {
    background: transparent;
    border: none;
    padding: 10px 18px;
    font-size: 14px;
    font-weight: 600;
    color: var(--tm);
    cursor: pointer;
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    white-space: nowrap;
    transition: color 0.2s;
    font-family: 'Heebo', sans-serif;
  }
  .tab:hover {
    color: var(--text);
  }
  .tab.active {
    color: var(--gold-l);
  }
  .tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--gold), var(--pink));
  }
  .count {
    font-size: 11px;
    font-weight: 700;
    background: var(--s3);
    color: var(--tm);
    padding: 2px 8px;
    border-radius: 99px;
  }
  .tab.active .count {
    background: var(--gold-d);
    color: var(--gold-l);
  }
  .count.warn {
    background: var(--pink-d);
    color: var(--pink-l);
  }

  .section-label {
    font-size: 13px;
    font-weight: 700;
    color: var(--tm);
    margin-bottom: 16px;
    letter-spacing: 0.5px;
  }

  .deals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
    gap: 18px;
  }

  /* ── Enhanced Empty State ── */
  .empty {
    text-align: center;
    color: var(--tm);
    font-size: 14px;
    padding: 48px 24px;
    background: var(--s2);
    border: 1px dashed var(--border);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  .empty-text {
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
    margin: 0;
  }
  .empty-sub {
    font-size: 13px;
    color: var(--tm);
    margin: 0;
  }
  .empty-cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding: 10px 22px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .empty-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
  }
  .empty-cta--gold {
    background: var(--gold-d, rgba(212, 175, 55, 0.18));
    color: var(--gold-l, #d4af37);
    border: 1px solid var(--gold, rgba(212, 175, 55, 0.4));
  }
  .empty-cta--pink {
    background: var(--pink-d, rgba(255, 100, 150, 0.12));
    color: var(--pink-l, #ff6496);
    border: 1px solid var(--pink, rgba(255, 100, 150, 0.35));
  }

  @media (max-width: 600px) {
    .quick-links {
      flex-direction: column;
    }
    .deals-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
