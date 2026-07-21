<script>
  import { executeAction } from '$lib/client/actionClient';
  import { lang } from '$lib/stores/lang.js';
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

  const texts = {
    he: {
      month: 'חודש',
      expected: 'סכום צפוי',
      customerReported: (name, amt) => `${name || 'הלקוח'} דיווח שהעביר ${amt} ₪`,
      customerWaiting: 'הלקוח טרם דיווח על העברה החודש',
      amountLabelHolder: 'כמה נכנס החודש בפועל? (0 = לא נכנס)',
      amountLabelCustomer: 'כמה העברת החודש? (0 = לא העברתי)',
      report: 'דיווח',
      confirmReceived: 'אישור שהתקבל',
      closeEngine: 'לסגור את הוראת הקבע (לא ייפתחו חודשים נוספים)',
      reported: 'הדיווח נרשם — תודה!',
      customer: 'לקוח',
      seller: 'מוכר',
      invalid: 'נדרש סכום תקין (0 ומעלה)',
      error: 'שגיאה בשליחת הדיווח'
    },
    en: {
      month: 'Month',
      expected: 'Expected amount',
      customerReported: (name, amt) => `${name || 'The customer'} reported transferring ${amt} ₪`,
      customerWaiting: 'The customer has not reported a transfer this month yet',
      amountLabelHolder: 'How much actually came in this month? (0 = nothing)',
      amountLabelCustomer: 'How much did you transfer this month? (0 = nothing)',
      report: 'Report',
      confirmReceived: 'Confirm received',
      closeEngine: 'Close this standing order (no further monthly cycles)',
      reported: 'Report recorded — thanks!',
      customer: 'Customer',
      seller: 'Seller',
      invalid: 'A valid amount (0 or more) is required',
      error: 'Failed to submit the report'
    }
  };
  let t = $derived(texts[$lang] || texts.he);

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
      toast.error(t.invalid);
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
        throw new Error(result?.error?.message || t.error);
      }
      toast.success(t.reported);
      onDone();
    } catch (e) {
      toast.error(e?.message || t.error);
    } finally {
      busy = false;
    }
  }
</script>

<div class="cycle-card">
  <div class="cycle-head">
    <span class="cycle-name">
      {cycle.productName || '🔁'}
      {#if cycle.projectName}<span class="cycle-project">· {cycle.projectName}</span>{/if}
    </span>
    <span class="cycle-month">{t.month} {monthLabel}</span>
  </div>

  <div class="cycle-meta">
    {#if cycle.expectedAmount != null}
      <span>{t.expected}: <b>{cycle.expectedAmount} ₪</b></span>
    {/if}
    {#if role === 'holder' && cycle.customerName}
      <span>{t.customer}: <b>{cycle.customerName}</b></span>
    {/if}
    {#if role === 'customer' && cycle.sellerName}
      <span>{t.seller}: <b>{cycle.sellerName}</b></span>
    {/if}
  </div>

  {#if role === 'holder' && cycle.customerName}
    {#if cycle.customerReportedAt && cycle.customerAmount != null}
      <p class="cycle-customer-line ok">
        💳 {t.customerReported(cycle.customerName, cycle.customerAmount)}
      </p>
    {:else}
      <p class="cycle-customer-line">💳 {t.customerWaiting}</p>
    {/if}
  {/if}

  <label class="cycle-amount">
    <span>{role === 'customer' ? t.amountLabelCustomer : t.amountLabelHolder}</span>
    <input type="number" min="0" step="any" bind:value={amount} disabled={busy} />
  </label>

  {#if role === 'holder'}
    <label class="cycle-close">
      <input type="checkbox" bind:checked={closeEngine} disabled={busy} />
      <span>{t.closeEngine}</span>
    </label>
  {/if}

  <button class="cycle-submit" onclick={submit} disabled={busy}>
    {#if busy}⏳{:else}{confirmsCustomer ? `✔ ${t.confirmReceived}` : t.report}{/if}
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
