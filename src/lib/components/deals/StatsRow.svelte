<script lang="ts">
  import { currencySymbol } from '$lib/money/format.js';
  import { useMoney } from '$lib/money/context.svelte';
  import { useFormatMoney } from '$lib/money/context.svelte';
  import StatsCard from './StatsCard.svelte';
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import type { DashboardStats } from '$lib/types';

  let { stats }: { stats: DashboardStats } = $props();
  const fmtMoney = useFormatMoney();
  const money = useMoney();
</script>

<div class="row">
  <StatsCard
    label={$t('deals.activeDeals')}
    value={stats.activeDeals}
    sub={`<span style="color:#4ade80">↑ 1</span> ${$t('deals.fromLastMonth')}`}
    iconKind="urgent"
    variant="gold"
  />
  <StatsCard
    label={$t('deals.totalPaid')}
    value={fmtMoney(stats.totalPaid)}
    sub="{$t('deals.outOf')} {fmtMoney(stats.totalCost)}"
    icon={currencySymbol(money.currency, money.lang)}
  />
  <StatsCard
    label={$t('deals.pendingApprovalTitle')}
    value={stats.pendingApprovals}
    sub={$t('deals.newItems')}
    iconKind="waiting"
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
