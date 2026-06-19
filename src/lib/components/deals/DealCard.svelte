<script lang="ts">
  import { isRtl } from '$lib/translations';
  import { goto } from '$app/navigation';
  import tr from '$lib/translations/tr.json';
  import { lang } from '$lib/stores/lang.js';
  import type { Deal } from '$lib/types';

  let { deal }: { deal: Deal } = $props();

  const STATUS = $derived({
    active: { label: tr.deals.statusInProgress[$lang], cls: 'active' },
    pending: { label: tr.deals.statusCoordination[$lang], cls: 'pending' },
    approval: { label: tr.deals.pendingApproval[$lang], cls: 'approval' },
    done: { label: tr.deals.statusDone[$lang], cls: 'done' }
  });

  const progressVariant = $derived(
    deal.status === 'done' ? 'green' : deal.status === 'pending' ? 'pink' : ''
  );

  function navigate() {
    goto(`/deals/${deal.id}`);
  }
</script>

<div
  class="card"
  class:faded={deal.status === 'done'}
  dir={$isRtl ? 'rtl' : 'ltr'}
  role="button"
  tabindex="0"
  onclick={navigate}
  onkeydown={(e) => e.key === 'Enter' && navigate()}
>
  <!-- Top row: icon + status badge -->
  <div class="toper">
    <div class="icon" style="background:{deal.iconBg}">{deal.icon}</div>
    <span class="badge {STATUS[deal.status].cls}"
      >{STATUS[deal.status].label}</span
    >
  </div>

  <!-- Chips -->
  <div class="chips">
    <span class="chip">{deal.category}</span>
    {#if deal.pendingApprovalCount > 0}
      <span class="chip warn">⚡ {deal.pendingApprovalCount} {tr.deals.approvalCount[$lang]}</span>
    {/if}
  </div>

  <!-- Names -->
  <div class="product">{deal.product}</div>
  <div class="project">{deal.project}</div>

  <!-- Progress -->
  <div class="prog-header">
    <span class="prog-label">{tr.deals.missionsCompleted[$lang]}</span>
    <span class="prog-pct">{deal.progressPct}%</span>
  </div>
  <div class="prog-track">
    <div
      class="prog-fill {progressVariant}"
      style="width:{deal.progressPct}%"
    ></div>
  </div>

  <!-- Meta -->
  <div class="meta">
    <div class="meta-item">
      <div class="ml">{tr.deals.totalCost[$lang]}</div>
      <div class="mv gold">₪ {deal.totalCost.toLocaleString()}</div>
    </div>
    <div class="meta-item">
      <div class="ml">{tr.deals.paid[$lang]}</div>
      <div class="mv">₪ {deal.paid.toLocaleString()}</div>
    </div>
    <div class="meta-item">
      <div class="ml">{tr.deals.estimatedEnd[$lang]}</div>
      <div class="mv">{deal.endDate}</div>
    </div>
  </div>
</div>

<style>
  .card {
    background: var(--s1);
    border: 1px solid var(--border);
    border-radius: var(--rl);
    padding: 24px;
    cursor: pointer;
    transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    outline: none;
  }
  /* Gradient border on hover */
  .card::after {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    background: linear-gradient(
      135deg,
      var(--gold),
      transparent 50%,
      var(--pink) 100%
    );
    opacity: 0;
    transition: opacity 0.28s;
    z-index: -1;
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    padding: 1px;
  }
  .card:hover,
  .card:focus-visible {
    transform: translateY(-4px);
    border-color: transparent;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  }
  .card:hover::after,
  .card:focus-visible::after {
    opacity: 1;
  }
  .card.faded {
    opacity: 0.65;
  }

  .toper {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 14px;
  }
  .icon {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  .badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 4px 12px;
    border-radius: 20px;
  }
  .badge.active {
    background: rgba(74, 222, 128, 0.1);
    color: #4ade80;
    border: 1px solid rgba(74, 222, 128, 0.25);
  }
  .badge.pending {
    background: var(--gold-d);
    color: var(--gold-l);
    border: 1px solid var(--border-g);
  }
  .badge.approval {
    background: var(--pink-d);
    color: var(--pink-l);
    border: 1px solid rgba(200, 21, 95, 0.3);
  }
  .badge.done {
    background: rgba(148, 163, 184, 0.1);
    color: #94a3b8;
    border: 1px solid rgba(148, 163, 184, 0.2);
  }

  .chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }
  .chip {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 6px;
    background: var(--s3);
    color: var(--tm);
    border: 1px solid var(--border);
  }
  .chip.warn {
    background: var(--pink-d);
    color: var(--pink-l);
    border-color: rgba(200, 21, 95, 0.2);
  }

  .product {
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 4px;
  }
  .project {
    font-size: 12px;
    color: var(--tm);
    margin-bottom: 16px;
  }

  .prog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .prog-label {
    font-size: 11px;
    color: var(--tm);
  }
  .prog-pct {
    font-size: 12px;
    font-weight: 700;
    color: var(--gold-l);
  }
  .prog-track {
    height: 4px;
    background: var(--s3);
    border-radius: 99px;
    overflow: hidden;
    margin-bottom: 14px;
  }
  .prog-fill {
    height: 100%;
    border-radius: 99px;
    background: linear-gradient(90deg, var(--gold), var(--gold-l));
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .prog-fill.pink {
    background: linear-gradient(90deg, var(--pink), var(--pink-l));
  }
  .prog-fill.green {
    background: linear-gradient(90deg, #16a34a, #4ade80);
  }

  .meta {
    display: flex;
    gap: 16px;
    border-top: 1px solid var(--border);
    padding-top: 14px;
  }
  .meta-item {
    flex: 1;
  }
  .ml {
    font-size: 10px;
    color: var(--td);
    margin-bottom: 2px;
    font-weight: 600;
  }
  .mv {
    font-size: 13px;
    font-weight: 700;
    color: var(--text);
  }
  .mv.gold {
    color: var(--gold-l);
  }
</style>
