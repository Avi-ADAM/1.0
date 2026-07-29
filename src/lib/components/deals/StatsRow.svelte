<script lang="ts">
  import StatsCard from './StatsCard.svelte';
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import type { DashboardStats } from '$lib/types';

  let { stats }: { stats: DashboardStats } = $props();
</script>

<div class="row">
  <StatsCard
    label={$t('deals.activeDeals')}
    value={stats.activeDeals}
    sub={`<span style="color:#4ade80">↑ 1</span> ${$t('deals.fromLastMonth')}`}
    icon="⚡"
    variant="gold"
  />
  <StatsCard
    label={$t('deals.totalPaid')}
    value="₪ {stats.totalPaid.toLocaleString()}"
    sub="{$t('deals.outOf')} {stats.totalCost.toLocaleString()} ₪"
    icon="₪"
  />
  <StatsCard
    label={$t('deals.pendingApprovalTitle')}
    value={stats.pendingApprovals}
    sub={$t('deals.newItems')}
    icon="⏳"
    variant="pink"
  />
  <StatsCard
    label={$t('deals.completed')}
    value={stats.completedDeals}
    sub={$t('deals.fullProduct')}
    icon="✓"
  />
</div>

<style>
  .row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }
  @media (max-width: 900px) { .row { grid-template-columns: repeat(2, 1fr); } }
</style>
