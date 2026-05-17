<script lang="ts">
  import StatsCard from './StatsCard.svelte';
  import type { DashboardStats } from '$lib/types';

  let { stats }: { stats: DashboardStats } = $props();
</script>

<div class="row">
  <StatsCard
    label="עסקאות פעילות"
    value={stats.activeDeals}
    sub='<span style="color:#4ade80">↑ 1</span> מהחודש שעבר'
    icon="⚡"
    variant="gold"
  />
  <StatsCard
    label='סה״כ שולם'
    value="₪ {stats.totalPaid.toLocaleString()}"
    sub="מתוך {stats.totalCost.toLocaleString()} ₪"
    icon="₪"
  />
  <StatsCard
    label="ממתין לאישורך"
    value={stats.pendingApprovals}
    sub="פריטים חדשים"
    icon="⏳"
    variant="pink"
  />
  <StatsCard
    label="הושלמו"
    value={stats.completedDeals}
    sub="מוצר במלואו"
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
