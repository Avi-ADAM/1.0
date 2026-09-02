<script>
  import { t } from '$lib/translations';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
  import { executeAction } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';

  /**
   * Monthly recurring-sale cycle card (PLAN_RECURRING_SALES).
   *
   * role 'holder'   — the money-holder reports how much actually came in this
   *                   month (0 allowed) and may close the standing order.
   *                   Confirming the customer's exact reported amount doubles
   *                   as the "received" confirmation.
   * role 'customer' — the paying customer reports how much they transferred.
   *
   * @typedef {Object} Cycle
   * @property {string} id
   * @property {string} [cycleStart]
   * @property {string} [note]
   * @property {number | null} [customerAmount]
   * @property {string | null} [customerReportedAt]
   * @property {string} [customerName]
   * @property {string} [sellerName]
   * @property {string} [productName]
   * @property {string} [projectName]
   * @property {number | null} [expectedAmount]
   */

  /** @type {{ cycle: Cycle, role?: 'holder' | 'customer', onDone?: () => void }} */
  let { cycle, role = 'holder', onDone = () => {} } = $props();

  // Seed once from the cycle — the card is keyed by cycle.id, so a data
  // refresh remounts it with fresh values.
  // svelte-ignore state_referenced_locally
  let amount = $state(
    cycle.customerAmount != null
      ? String(cycle.customerAmount)
      : cycle.expectedAmount != null
        ? String(cycle.expectedAmount)
        : ''
  );
  let closeEngine = $state(false);
  let busy = $state(false);

  let monthLabel = $derived.by(() => {
    if (!cycle.cycleStart) return '';
    const d = new Date(cycle.cycleStart);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  });

  // Holder confirming exactly what the customer reported = "received" ✓
  let confirmsCustomer = $derived(
    role === 'holder' &&
      cycle.customerAmount != null &&
      amount !== '' &&
      Number(amount) === Number(cycle.customerAmount)
  );

  async function submit() {
    const num = Number(amount);
    if (amount === '' || Number.isNaN(num) || num < 0) {
      toast.error($t('project.recurringCycle.invalid'));
      return;
    }
    busy = true;
    try {
      const key =
        role === 'customer' ? 'customerReportRecurringSaleCycle' : 'reportRecurringSaleCycle';
      /** @type {Record<string, any>} */
      const params = { cycleSaleId: cycle.id, amount: num };
      if (role === 'holder' && closeEngine) params.closeEngine = true;
      const result = await executeAction(key, params);
      if (result?.success === false) {
        throw new Error(result?.error?.message || $t('project.recurringCycle.error'));
      }
      toast.success($t('project.recurringCycle.reported'));
      onDone();
    } catch (e) {
      toast.error(e?.message || $t('project.recurringCycle.error'));
    } finally {
      busy = false;
    }
  }
</script>

<div class="cycle-card">
  <div class="cycle-head">
    <span class="cycle-name">
      {cycle.productName || '—'}
      {#if cycle.projectName}<span class="cycle-project">· {cycle.projectName}</span>{/if}
    </span>
    <span class="cycle-month">{$t('project.recurringCycle.month')} {monthLabel}</span>
  </div>

  <div class="cycle-meta">
    {#if cycle.expectedAmount != null}
      <span>{$t('project.recurringCycle.expected')}: <b>{cycle.expectedAmount} ₪</b></span>
    {/if}
    {#if role === 'holder' && cycle.customerName}
      <span>{$t('project.recurringCycle.customer')}: <b>{cycle.customerName}</b></span>
    {/if}
    {#if role === 'customer' && cycle.sellerName}
      <span>{$t('project.recurringCycle.seller')}: <b>{cycle.sellerName}</b></span>
    {/if}
  </div>

  {#if role === 'holder' && cycle.customerName}
    {#if cycle.customerReportedAt && cycle.customerAmount != null}
      <p class="cycle-customer-line ok">
        <EntityIcon kind="card" size={13} /> {$t('project.recurringCycle.customerReported', { name: cycle.customerName || $t('project.recurringCycle.customer'), amt: cycle.customerAmount })}
      </p>
    {:else}
      <p class="cycle-customer-line"><EntityIcon kind="card" size={13} /> {$t('project.recurringCycle.customerWaiting')}</p>
    {/if}
  {/if}

  <label class="cycle-amount">
    <span>{role === 'customer' ? $t('project.recurringCycle.amountLabelCustomer') : $t('project.recurringCycle.amountLabelHolder')}</span>
    <input type="number" min="0" step="any" bind:value={amount} disabled={busy} />
  </label>

  {#if role === 'holder'}
    <label class="cycle-close">
      <input type="checkbox" bind:checked={closeEngine} disabled={busy} />
      <span>{$t('project.recurringCycle.closeEngine')}</span>
    </label>
  {/if}

  <button class="cycle-submit" onclick={submit} disabled={busy}>
    {#if busy}<EntityIcon kind="waiting" size={13} />{:else}{confirmsCustomer ? `✔ ${$t('project.recurringCycle.confirmReceived')}` : $t('project.recurringCycle.report')}{/if}
  </button>
</div>

<style>
  .cycle-card {
    background: var(--s1);
    border: 1px solid var(--border-g, var(--border));
    border-radius: var(--rl, 12px);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .cycle-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }
  .cycle-name {
    font-weight: 700;
    color: var(--text);
  }
  .cycle-project {
    color: var(--tm);
    font-weight: 400;
    font-size: 0.85em;
  }
  .cycle-month {
    font-size: 12px;
    color: var(--gold-l);
    background: var(--gold-d);
    border: 1px solid var(--border-g, var(--gold));
    border-radius: 999px;
    padding: 2px 10px;
    white-space: nowrap;
  }
  .cycle-meta {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    font-size: 13px;
    color: var(--tm);
  }
  .cycle-meta b {
    color: var(--text);
  }
  .cycle-customer-line {
    margin: 0;
    font-size: 13px;
    color: var(--tm);
  }
  .cycle-customer-line.ok {
    color: var(--gold-l);
    font-weight: 600;
  }
  .cycle-amount {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    color: var(--tm);
  }
  .cycle-amount input {
    padding: 8px 12px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--s2);
    color: var(--text);
    font-size: 15px;
    max-width: 200px;
  }
  .cycle-amount input:focus {
    outline: none;
    border-color: var(--gold);
  }
  .cycle-close {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--tm);
    cursor: pointer;
  }
  .cycle-submit {
    align-self: flex-start;
    padding: 8px 22px;
    border-radius: 10px;
    background: var(--gold-d);
    border: 1px solid var(--border-g, var(--gold));
    color: var(--gold-l);
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .cycle-submit:hover:enabled {
    background: rgba(200, 150, 12, 0.28);
  }
  .cycle-submit:disabled {
    opacity: 0.6;
    cursor: default;
  }
</style>
