<script lang="ts">
  /**
   * Price negotiation on a product request — both sides see the same panel
   * (docs/PLAN_CONCIERGE_LOCAL_PROVIDERS.md §6). The rules are
   * src/lib/sheirut/quoteState.ts; this only shows them and calls the actions.
   *
   * Seller: an open price asks for a quote; any version the customer put on the
   *   table can be answered with another (approving it is the page's existing
   *   approve button, which the server now allows only when it is theirs to).
   * Customer: the seller's version can be accepted, or answered with another.
   * Either way, the waiting side sees who holds the turn and when silence
   * turns the last version into the deal.
   */
  import Money from '$lib/components/money/Money.svelte';
  import { t, isRtl } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { invalidateAll } from '$app/navigation';
  import { customerCanAccept, totalOf, type QuoteState, type QuoteSide } from '$lib/sheirut/quoteState';

  let {
    sheirutpendId,
    side,
    quote,
    silenceAt = null
  }: {
    sheirutpendId: string;
    side: QuoteSide;
    quote: QuoteState;
    /** When the rikma's clock runs out, if one is running. */
    silenceAt?: string | null;
  } = $props();

  let formOpen = $state(false);
  let price = $state<number | null>(null);
  let quant = $state<number>(1);
  let note = $state('');
  let busy = $state(false);

  const myTurn = $derived(quote.turn === side && !(side === 'customer' && quote.acceptedByCustomer));
  const canAccept = $derived(side === 'customer' && customerCanAccept(quote));
  const draftTotal = $derived(totalOf(price, quant));

  const status = $derived.by(() => {
    if (quote.acceptedByCustomer) {
      return side === 'customer' ? $t('deals.quote.youAcceptedWaitRikma') : $t('deals.quote.acceptedWaitRikma');
    }
    if (myTurn) return $t('deals.quote.yourTurn');
    return quote.turn === 'customer' ? $t('deals.quote.waitingCustomer') : $t('deals.quote.waitingProvider');
  });

  function who(roundSide: QuoteSide): string {
    if (roundSide === side) return $t('deals.quote.whoYou');
    return roundSide === 'provider' ? $t('deals.quote.whoShop') : $t('deals.quote.whoCustomer');
  }

  function fmtDate(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate()}.${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function openForm() {
    price = quote.price;
    quant = quote.quant || 1;
    note = '';
    formOpen = true;
  }

  async function run(actionKey: string, params: Record<string, unknown>, okMsg: string) {
    if (busy) return;
    busy = true;
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionKey, params })
      });
      const out = await res.json();
      if (!out?.success) {
        const msg = typeof out?.error === 'string' ? out.error : out?.error?.message;
        throw new Error(msg || $t('deals.quote.error'));
      }
      toast.success(out?.data?.settled ? $t('deals.quote.settledToast') : okMsg);
      formOpen = false;
      await invalidateAll();
    } catch (err) {
      console.error('[QuotePanel]', actionKey, err);
      toast.error(err instanceof Error ? err.message : $t('deals.quote.error'));
    } finally {
      busy = false;
    }
  }

  const send = () => {
    if (price === null || !Number.isFinite(Number(price)) || Number(price) < 0) return;
    run(
      'quoteSheirutpend',
      { sheirutpendId, price: Number(price), quant: Number(quant) || 1, note: note.trim() },
      $t('deals.quote.sent')
    );
  };
  const accept = () => run('acceptSheirutQuote', { sheirutpendId }, $t('deals.quote.acceptedToast'));
</script>

<section class="quote" dir={$isRtl ? 'rtl' : 'ltr'}>
  <div class="head">
    <span class="title">{$t('deals.quote.title')}</span>
    <span class="status" class:mine={myTurn}>{status}</span>
  </div>

  <div class="now">
    {#if quote.openPrice}
      <span class="amount open">{$t('deals.quote.byQuote')}</span>
    {:else}
      <span class="amount"><Money amount={quote.total ?? 0} /></span>
      {#if quote.quant !== 1}
        <span class="calc"><Money amount={quote.price ?? 0} /> × {quote.quant}</span>
      {/if}
    {/if}
  </div>

  {#if quote.openPrice}
    <p class="hint">
      {side === 'provider' ? $t('deals.quote.openHintProvider') : $t('deals.quote.openHintCustomer')}
    </p>
  {/if}

  {#if silenceAt && quote.rounds.length > 0 && !quote.openPrice}
    <p class="hint">{$t('deals.quote.silence', { date: fmtDate(silenceAt) })}</p>
  {/if}

  {#if quote.rounds.length > 0}
    <details class="rounds">
      <summary>{$t('deals.quote.history')} · {quote.rounds.length}</summary>
      <ol>
        {#each quote.rounds as r (r.order)}
          <li>
            <span>{$t('deals.quote.roundBy', { order: r.order, who: who(r.side) })}</span>
            <span class="r-amount">
              {#if r.price === null}{$t('deals.quote.byQuote')}{:else}<Money
                  amount={totalOf(r.price, r.quant) ?? 0}
                />{/if}
            </span>
          </li>
        {/each}
      </ol>
    </details>
  {/if}

  {#if formOpen}
    <div class="form">
      <label>
        <span>{$t('deals.quote.unitPrice')}</span>
        <input type="number" min="0" step="0.5" bind:value={price} />
      </label>
      <label>
        <span>{$t('deals.quote.quantity')}</span>
        <input type="number" min="1" step="1" bind:value={quant} />
      </label>
      <label class="wide">
        <span>{$t('deals.quote.note')}</span>
        <input type="text" maxlength="300" placeholder={$t('deals.quote.notePlaceholder')} bind:value={note} />
      </label>
      {#if draftTotal !== null}
        <div class="draft-total">{$t('deals.quote.total')}: <Money amount={draftTotal} /></div>
      {/if}
      <div class="btns">
        <button class="ghost" type="button" onclick={() => (formOpen = false)} disabled={busy}
          >{$t('deals.quote.cancel')}</button
        >
        <button class="primary" type="button" onclick={send} disabled={busy || price === null}
          >{busy ? '⏳' : $t('deals.quote.send')}</button
        >
      </div>
    </div>
  {:else}
    <div class="btns">
      {#if canAccept}
        <button class="primary" type="button" onclick={accept} disabled={busy}
          >{busy ? '⏳' : $t('deals.quote.accept')}</button
        >
      {/if}
      <button class="ghost" type="button" onclick={openForm} disabled={busy}>
        {quote.openPrice && side === 'provider' ? $t('deals.quote.propose') : $t('deals.quote.counter')}
      </button>
    </div>
  {/if}
</section>

<style>
  .quote {
    margin: 0 0 20px;
    padding: 16px 18px;
    border-radius: 16px;
    border: 1px solid var(--border, rgba(127, 127, 127, 0.25));
    background: var(--surface, transparent);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .title {
    font-weight: 700;
    font-size: 15px;
  }
  .status {
    font-size: 12px;
    padding: 3px 10px;
    border-radius: 999px;
    background: rgba(127, 127, 127, 0.12);
  }
  .status.mine {
    background: rgba(255, 0, 146, 0.12);
    color: #ff0092;
    font-weight: 600;
  }
  .now {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }
  .amount {
    font-size: 24px;
    font-weight: 800;
  }
  .amount.open {
    font-size: 18px;
    opacity: 0.8;
  }
  .calc {
    font-size: 13px;
    opacity: 0.7;
  }
  .hint {
    margin: 0;
    font-size: 13px;
    opacity: 0.8;
    line-height: 1.5;
  }
  .rounds summary {
    cursor: pointer;
    font-size: 13px;
    opacity: 0.8;
  }
  .rounds ol {
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
  }
  .rounds li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .form label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
  }
  .form label.wide,
  .form .draft-total,
  .form .btns {
    grid-column: 1 / -1;
  }
  .form input {
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid rgba(127, 127, 127, 0.35);
    background: transparent;
    color: inherit;
    font-size: 14px;
  }
  .draft-total {
    font-size: 14px;
    font-weight: 600;
  }
  .btns {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .btns button {
    padding: 9px 16px;
    border-radius: 12px;
    font-size: 14px;
    cursor: pointer;
    border: 1px solid transparent;
  }
  .primary {
    background: #ff0092;
    color: #fff;
  }
  .ghost {
    background: transparent;
    border-color: rgba(127, 127, 127, 0.4) !important;
    color: inherit;
  }
  .btns button:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
