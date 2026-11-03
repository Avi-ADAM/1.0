<!--
  DealReceiptPanel — has she received what she bought? (PLAN_DEAL_PRICING_TRACKS P6)

  Only a fixed-price deal: she bought an outcome, so the deal is done when she has it.
  A member of the rikma says it was delivered; she approves, or writes what is still
  missing — a counter, never a "no" — and the rikma delivers again. Her silence on a
  delivery for the rikma's restime is her receipt, and the panel says until when.
-->
<script lang="ts">
  import Panel from '$lib/components/Panel.svelte';
  import { t } from '$lib/translations';
  import type { ReceiptView } from '$lib/sheirut/dealReceipt';

  let {
    receipt,
    busy = false,
    onDeliver,
    onAccept,
    onDefects
  }: {
    receipt: ReceiptView;
    busy?: boolean;
    onDeliver: (why: string) => void;
    onAccept: () => void;
    onDefects: (why: string) => void;
  } = $props();

  let note = $state('');
  let writingDefects = $state(false);

  const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '');
  const statusText = $derived(
    receipt.status === 'accepted'
      ? $t('deals.receipt.accepted')
      : receipt.status === 'delivered'
        ? $t('deals.receipt.delivered')
        : receipt.status === 'defects'
          ? $t('deals.receipt.defects')
          : $t('deals.receipt.none')
  );

  function deliver() {
    onDeliver(note.trim());
    note = '';
  }
  function sendDefects() {
    if (!note.trim()) return;
    onDefects(note.trim());
    note = '';
    writingDefects = false;
  }
</script>

<Panel title={$t('deals.receipt.title')}>
  <p class="dr-explain">{$t('deals.receipt.explain')}</p>

  <p class="dr-status {receipt.status}">{statusText}</p>
  {#if receipt.deadline}
    <p class="dr-deadline">{$t('deals.receipt.silenceUntil', { when: when(receipt.deadline) })}</p>
  {/if}

  {#if receipt.history.length > 0}
    <ol class="dr-history">
      {#each receipt.history as h, i (i)}
        <li class="dr-round {h.kind}">
          <span class="dr-who">
            {h.kind === 'delivered'
              ? $t('deals.receipt.roundDelivered', { name: h.byName })
              : $t('deals.receipt.roundDefects', { name: h.byName })}
          </span>
          {#if h.why}<span class="dr-why">{h.why}</span>{/if}
          {#if h.zman}<span class="dr-when">{when(h.zman)}</span>{/if}
        </li>
      {/each}
    </ol>
  {/if}

  {#if receipt.canDeliver}
    <label class="dr-label" for="dr-deliver">{$t('deals.receipt.deliverNote')}</label>
    <textarea id="dr-deliver" class="dr-input" rows="2" bind:value={note} disabled={busy}></textarea>
    <button type="button" class="dr-btn primary" onclick={deliver} disabled={busy}>{$t('deals.receipt.deliver')}</button>
  {/if}

  {#if receipt.canAnswer}
    {#if writingDefects}
      <label class="dr-label" for="dr-defects">{$t('deals.receipt.defectsNote')}</label>
      <textarea id="dr-defects" class="dr-input" rows="3" bind:value={note} disabled={busy}></textarea>
      <div class="dr-actions">
        <button type="button" class="dr-btn primary" onclick={sendDefects} disabled={busy || !note.trim()}>
          {$t('deals.receipt.sendDefects')}
        </button>
        <button type="button" class="dr-btn" onclick={() => (writingDefects = false)} disabled={busy}>
          {$t('deals.receipt.back')}
        </button>
      </div>
    {:else}
      <div class="dr-actions">
        <button type="button" class="dr-btn primary" onclick={onAccept} disabled={busy}>{$t('deals.receipt.accept')}</button>
        <button type="button" class="dr-btn" onclick={() => (writingDefects = true)} disabled={busy}>
          {$t('deals.receipt.writeDefects')}
        </button>
      </div>
    {/if}
  {:else if receipt.canConfirm}
    <button type="button" class="dr-btn" onclick={onAccept} disabled={busy}>{$t('deals.receipt.confirmOwn')}</button>
  {/if}
</Panel>

<style>
  .dr-explain { font-size: 12px; color: var(--gold); line-height: 1.5; margin: 0 0 10px; }
  .dr-status { font-size: 14px; font-weight: 700; color: var(--text); margin: 0 0 4px; }
  .dr-status.accepted { color: #4ade80; }
  .dr-status.defects { color: #fbbf24; }
  .dr-deadline { font-size: 12px; color: var(--gold-l); margin: 0 0 10px; }
  .dr-history { list-style: none; margin: 0 0 12px; padding: 0; }
  .dr-round { display: flex; flex-direction: column; gap: 2px; padding: 8px 0; border-bottom: 1px solid var(--border); }
  .dr-round:last-child { border-bottom: none; }
  .dr-who { font-size: 12px; font-weight: 700; color: var(--gold-l); }
  .dr-round.defects .dr-who { color: #fbbf24; }
  .dr-why { font-size: 13px; color: var(--text); white-space: pre-wrap; }
  .dr-when { font-size: 11px; color: var(--gold); }
  .dr-label { display: block; font-size: 12px; color: var(--gold-l); margin: 6px 0 4px; }
  .dr-input {
    width: 100%;
    box-sizing: border-box;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text);
    padding: 8px;
    font: inherit;
    font-size: 13px;
  }
  .dr-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  .dr-btn {
    margin-top: 8px;
    padding: 8px 14px;
    border-radius: 99px;
    border: 1px solid var(--gold);
    background: transparent;
    color: var(--gold-l);
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
  }
  .dr-actions .dr-btn { margin-top: 0; }
  .dr-btn.primary { background: var(--gold); color: #111; }
  .dr-btn:disabled { opacity: 0.5; cursor: default; }
</style>
