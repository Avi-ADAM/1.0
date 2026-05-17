<script lang="ts">
  import AppHeader from '$lib/components/AppHeader.svelte';
  import StatsRow from '$lib/components/deals/StatsRow.svelte';
  import DealCard from '$lib/components/deals/DealCard.svelte';
  import PendingRequestCard from '$lib/components/deals/PendingRequestCard.svelte';
  import { t } from '$lib/translations';
  import {
    saleToDeal,
    salesToStats,
    type DealKind
  } from '$lib/services/dealsService';

  let { data } = $props();

  type TabKind = DealKind | 'pending';
  let tab = $state<TabKind>('purchase');

  const purchases = $derived(data.purchases ?? []);
  const sales = $derived(data.sales ?? []);
  const pendingBuy = $derived(data.pendingBuy ?? []);
  const pendingSell = $derived(data.pendingSell ?? []);
  const pendingAll = $derived([...pendingBuy, ...pendingSell]);

  const activeList = $derived(tab === 'purchase' ? purchases : tab === 'sale' ? sales : []);
  const deals = $derived(
    tab !== 'pending' ? activeList.map((s) => saleToDeal(s, tab as DealKind)) : []
  );
  const stats = $derived(salesToStats(activeList));
</script>

<svelte:head>
  <title>{$t('deals.title')}</title>
  <meta property="og:image" content="/deals%20logo.png" />
  <meta property="og:title" content={$t('deals.title')} />
</svelte:head>

<AppHeader />

<main class="page-wrap">
  <div class="page-top anim">
    <div>
      <h1 class="page-title">{$t('deals.title')} <span class="accent"></span></h1>
      <p class="page-sub">{$t('deals.subtitle')}</p>
    </div>
    <img src="/deals%20logo.png" alt={$t('deals.logo_alt')} class="page-logo" />
  </div>

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
  </div>

  {#if tab !== 'pending'}
    <StatsRow {stats} />

    <div class="section-label">
      {tab === 'purchase' ? $t('deals.active_purchases') : $t('deals.active_sales')}
    </div>

    {#if deals.length === 0}
      <div class="empty">
        {tab === 'purchase'
          ? $t('deals.no_active_purchases')
          : $t('deals.no_active_sales')}
      </div>
    {:else}
      <div class="deals-grid">
        {#each deals as deal (deal.id)}
          <DealCard {deal} />
        {/each}
      </div>
    {/if}
  {:else}
    <div class="section-label">{$t('deals.pending_requests_label')}</div>

    {#if pendingAll.length === 0}
      <div class="empty">{$t('deals.no_pending_requests')}</div>
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
  {/if}
</main>

<style>
  .page-top {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 24px;
    gap: 16px;
  }
  .page-title {
    font-size: 28px;
    font-weight: 800;
    color: var(--text);
    margin-bottom: 4px;
  }
  .accent {
    color: var(--gold-l);
  }
  .page-logo {
    width: 90px;
    height: 90px;
    object-fit: contain;
    flex-shrink: 0;
  }
  .page-sub {
    font-size: 13px;
    color: var(--tm);
  }

  .tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    border-bottom: 1px solid var(--border);
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
    bottom: -1px;
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

  .empty {
    text-align: center;
    color: var(--tm);
    font-size: 14px;
    padding: 60px 20px;
    background: var(--s2);
    border: 1px dashed var(--border);
    border-radius: 12px;
  }

  @media (max-width: 600px) {
    .page-top {
      flex-direction: column;
      align-items: flex-start;
    }
    .deals-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
