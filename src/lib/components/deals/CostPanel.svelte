<script lang="ts">
  import Panel from '$lib/components/Panel.svelte';
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import type { CostBreakdown } from '$lib/types';

  let {
    totalCost,
    paid,
    costBreakdown,
    pendingCost = 0,
  }: {
    totalCost:     number;
    paid:          number;
    costBreakdown: CostBreakdown;
    pendingCost?:  number;
  } = $props();

  const remaining = $derived(totalCost - paid);
  const paidPct   = $derived(Math.round((paid / totalCost) * 100));
</script>

<Panel title={$t('deals.costsTitle')}>
  <!-- Total box -->
  <div class="total-box">
    <span class="total-label">{$t('deals.totalCost')}</span>
    <span class="total-value"><span class="sym">₪</span>{totalCost.toLocaleString()}</span>
  </div>

  <!-- Breakdown rows -->
  <div class="rows">
    <div class="row">
      <span class="l">{$t('deals.missions')}</span>
      <span class="v">₪ {costBreakdown.missions.toLocaleString()}</span>
    </div>
    <div class="row">
      <span class="l">{$t('deals.resources')}</span>
      <span class="v">₪ {costBreakdown.resources.toLocaleString()}</span>
    </div>

    <div class="divider"></div>

    <div class="row">
      <span class="l">{$t('deals.paidSoFar')}</span>
      <span class="v paid">₪ {paid.toLocaleString()}</span>
    </div>
    <div class="row">
      <span class="l">{$t('deals.remaining')}</span>
      <span class="v pending">₪ {remaining.toLocaleString()}</span>
    </div>
    {#if pendingCost > 0}
      <div class="row">
        <span class="l">{$t('deals.pendingApproval')}</span>
        <span class="v approval">₪ {pendingCost.toLocaleString()}</span>
      </div>
    {/if}
  </div>

  <!-- Progress -->
  <div class="prog-section">
    <div class="prog-track">
      <div class="prog-fill" style="width:{paidPct}%"></div>
    </div>
    <div class="prog-labels">
      <span>{$t('deals.paid')} {paidPct}%</span>
      <span>{$t('deals.balance')} {100 - paidPct}%</span>
    </div>
  </div>

  <!-- Pay CTA -->
  <button class="pay-btn">{$t('deals.nextPayment')}</button>
</Panel>

<style>
  .total-box {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    background: var(--gold-d);
    border: 1px solid var(--border-g);
    border-radius: 12px;
    padding: 16px 18px;
    margin-bottom: 18px;
  }
  .total-label { font-size: 11px; color: var(--gold); font-weight: 700; }
  .total-value { font-size: 24px; font-weight: 800; color: var(--gold-l); }
  .sym { font-size: 14px; margin-left: 3px; }

  .rows {}
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
  }
  .row:last-child { border-bottom: none; }
  .l { font-size: 12px; color: var(--tm); }
  .v { font-size: 13px; font-weight: 700; color: var(--text); }
  .v.paid     { color: #4ade80; }
  .v.pending  { color: var(--gold-l); }
  .v.approval { color: var(--pink-l); }
  .divider { height: 1px; background: var(--border-g); margin: 4px 0; }

  .prog-section { margin-top: 18px; }
  .prog-track {
    height: 6px;
    background: var(--s3);
    border-radius: 99px;
    overflow: hidden;
  }
  .prog-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--gold), var(--gold-l));
    border-radius: 99px;
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .prog-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    font-size: 10px;
    color: var(--td);
  }

  .pay-btn {
    width: 100%;
    margin-top: 18px;
    background: linear-gradient(135deg, var(--pink), var(--pink-l));
    border: none;
    color: #fff;
    font-family: 'Heebo', sans-serif;
    font-size: 14px;
    font-weight: 700;
    padding: 13px;
    border-radius: 10px;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(200, 21, 95, 0.35);
    transition: all 0.2s;
  }
  .pay-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 26px rgba(200, 21, 95, 0.5);
  }
</style>
