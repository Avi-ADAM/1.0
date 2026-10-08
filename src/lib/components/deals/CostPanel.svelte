<script lang="ts">
  import Money from '$lib/components/money/Money.svelte';
  import Panel from '$lib/components/Panel.svelte';
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import type { CostBreakdown } from '$lib/types';
  import type { Snippet } from 'svelte';
  import type { PaymentState } from '$lib/sheirut/paymentState';

  let {
    totalCost,
    paid,
    costBreakdown,
    pendingCost = 0,
    remaining: owed = null,
    inTransit = 0,
    pay = null,
    payment = undefined,
  }: {
    totalCost:     number;
    paid:          number;
    costBreakdown: CostBreakdown;
    pendingCost?:  number;
    /** What is still to be sent, when the deal knows it (a wish deal, C-14/C-19). */
    remaining?:    number | null;
    /** Sent but not confirmed by the providers yet (C-19) — neither paid nor owed. */
    inTransit?:    number;
    /** Where the payment stands for the viewer (`paymentState`); null = no payment row. */
    pay?:          PaymentState | null;
    /** The customer's payment flow itself (CustomerPayment), opened by the button. */
    payment?:      Snippet;
  } = $props();

  let payOpen = $state(false);
  // The flow follows the transfer it opened (`sent`); nothing to open once it is paid.
  const canOpen = $derived((pay === 'open' || pay === 'sent') && !!payment);

  const remaining = $derived(owed ?? Math.max(0, totalCost - paid));
  // A deal paid by approved hours can owe 0 before any hour is approved (C-14).
  const paidPct   = $derived(totalCost > 0 ? Math.min(100, Math.round((paid / totalCost) * 100)) : 0);
</script>

<Panel title={$t('deals.costsTitle')}>
  <!-- Total box -->
  <div class="total-box">
    <span class="total-label">{$t('deals.totalCost')}</span>
    <span class="total-value"><Money amount={totalCost} /></span>
  </div>

  <!-- Breakdown rows -->
  <div class="rows">
    <div class="row">
      <span class="l">{$t('deals.missions')}</span>
      <span class="v"><Money amount={costBreakdown.missions} /></span>
    </div>
    <div class="row">
      <span class="l">{$t('deals.resources')}</span>
      <span class="v"><Money amount={costBreakdown.resources} /></span>
    </div>

    <div class="divider"></div>

    <div class="row">
      <span class="l">{$t('deals.paidSoFar')}</span>
      <span class="v paid"><Money amount={paid} /></span>
    </div>
    {#if inTransit > 0}
      <div class="row">
        <span class="l">{$t('deals.inTransit')}</span>
        <span class="v approval"><Money amount={inTransit} /></span>
      </div>
    {/if}
    <div class="row">
      <span class="l">{$t('deals.remaining')}</span>
      <span class="v pending"><Money amount={remaining} /></span>
    </div>
    {#if pendingCost > 0}
      <div class="row">
        <span class="l">{$t('deals.pendingApproval')}</span>
        <span class="v approval"><Money amount={pendingCost} /></span>
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

  <!-- Pay CTA — only as open as the payment itself (CustomerPayment / paymentState) -->
  {#if canOpen}
    <button class="pay-btn" aria-expanded={payOpen} onclick={() => (payOpen = !payOpen)}>
      {payOpen ? $t('deals.pay.hide') : pay === 'sent' ? $t('deals.pay.track') : $t('deals.nextPayment')}
    </button>
    {#if payOpen}
      <div class="pay-flow">{@render payment?.()}</div>
    {/if}
  {:else if pay === 'notYet'}
    <button class="pay-btn" disabled aria-describedby="pay-note">{$t('deals.pay.closed')}</button>
    <p class="pay-note" id="pay-note">{$t('deals.due.payWhenFinal')}</p>
  {:else if pay === 'nothingLeft'}
    <p class="pay-note done">{$t('deals.due.nothingLeft')}</p>
  {:else if pay === 'paid'}
    <p class="pay-note done">{$t('deals.pay.paidNote')}</p>
  {:else if pay === 'supplier'}
    <p class="pay-note">{$t('deals.pay.supplierNote')}</p>
  {/if}
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
  .pay-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 26px rgba(200, 21, 95, 0.5);
  }
  .pay-btn:disabled {
    background: var(--s3);
    color: var(--tm);
    box-shadow: none;
    cursor: not-allowed;
  }
  .pay-flow { margin-top: 14px; }
  .pay-note {
    margin: 14px 0 0;
    font-size: 12px;
    line-height: 1.55;
    color: var(--gold-l);
  }
  .pay-note.done { color: #4ade80; }
</style>
