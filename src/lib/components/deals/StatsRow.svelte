<script lang="ts">
  import StatsCard from './StatsCard.svelte';
  import tr from '$lib/translations/tr.json';
  import { lang } from '$lib/stores/lang.js';
  import type { DashboardStats } from '$lib/types';

  let { stats }: { stats: DashboardStats } = $props();
</script>

<div class="row">
  <StatsCard
    label={tr.deals.activeDeals[$lang]}
    value={stats.activeDeals}
    sub={`<span style="color:#4ade80">↑ 1</span> ${tr.deals.fromLastMonth[$lang]}`}
    icon="⚡"
    variant="gold"
  />
  <StatsCard
    label={tr.deals.totalPaid[$lang]}
    value="₪ {stats.totalPaid.toLocaleString()}"
    sub="{tr.deals.outOf[$lang]} {stats.totalCost.toLocaleString()} ₪"
    icon="₪"
  />
  <StatsCard
    label={tr.deals.pendingApprovalTitle[$lang]}
    value={stats.pendingApprovals}
    sub={tr.deals.newItems[$lang]}
    icon="⏳"
    variant="pink"
  />
  <StatsCard
    label={tr.deals.completed[$lang]}
    value={stats.completedDeals}
    sub={tr.deals.fullProduct[$lang]}
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
