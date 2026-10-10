<!--
  DealPartsPanel — has every provider received their part? (QA_CONCIERGE_E2E C-19)

  A wish deal reads "paid" only when each provider has confirmed, themselves, receiving
  their part in full. Everyone on the deal sees who has; a provider who has not yet
  confirmed gets the button. Someone still waiting for money does not press anything —
  they say so in the deal's chat.

  When the customer paid one member and the rikma's split carries each provider their
  part, there is no generic button for those providers: the panel holds one card per
  transfer, between its two people — "I received it from Y", with its own chat with Y —
  and that confirmation is their part's (`$lib/sheirut/splitCarriage`).
-->
<script lang="ts">
  import Money from '$lib/components/money/Money.svelte';
  import Panel from '$lib/components/Panel.svelte';
  import { t } from '$lib/translations';
  import SheirutHalukaCard from '$lib/components/lev/cards/SheirutHalukaCard.svelte';
  import type { PartsView } from '$lib/sheirut/partsReceived';
  import type { SplitTransfer } from '$lib/sheirut/splitCarriage';

  let {
    parts,
    viewerId,
    busy = false,
    onConfirm,
    onTransfer
  }: {
    parts: PartsView;
    viewerId: string;
    busy?: boolean;
    onConfirm: () => void;
    /** A side of a split transfer confirms it (`confirmHaluka`); true when it was written. */
    onTransfer: (t: SplitTransfer, kind: 'send' | 'receive') => Promise<boolean>;
  } = $props();

  const me = $derived(String(viewerId));
  const isConfirmed = (id: string) => parts.confirmed.includes(id);
  const transfers = $derived(parts.transfers ?? []);
  const transfersOf = (providerId: string) => transfers.filter((t) => t.receiverId === providerId);
  // Her part travels through the split: she confirms its transfers, never the generic button.
  const iAmViaSplit = $derived((parts.viaSplit ?? []).includes(me));
  const iAmPending = $derived(parts.pending.includes(me) && !iAmViaSplit);
  // The transfers she is a side of — each its own card, with its own chat.
  const myTransfers = $derived(transfers.filter((t) => t.senderId === me || t.receiverId === me));
</script>

<Panel title={$t('deals.parts.title')}>
  <p class="dp-explain">{$t('deals.parts.explain')}</p>

  <ul class="dp-list">
    {#each parts.parts as p (p.providerId)}
      <li class="dp-row">
        <span class="dp-name">{p.name}</span>
        <span class="dp-due">{$t('deals.parts.partLabel')} <Money amount={p.due} /></span>
        <span class="dp-chip {isConfirmed(p.providerId) ? 'ok' : ''}">
          {isConfirmed(p.providerId) ? $t('deals.parts.confirmed') : $t('deals.parts.pending')}
        </span>
        {#each transfersOf(p.providerId) as tr (tr.id)}
          <span class="dp-via">
            <Money amount={tr.amount} />
            {$t('deals.parts.transferFrom', { name: tr.senderName })} ·
            <span class={tr.confirmed ? 'dp-ok' : ''}>
              {tr.confirmed ? $t('deals.parts.transferArrived') : $t('deals.parts.transferWaiting')}
            </span>
          </span>
        {/each}
      </li>
    {/each}
  </ul>

  <p class="dp-status {parts.allConfirmed ? 'ok' : ''}">
    {#if parts.allConfirmed}
      {$t('deals.parts.allPaid')}
    {:else}
      {$t('deals.parts.count', { count: parts.confirmed.length, total: parts.parts.length })}
      {#if parts.customerPaid}· {$t('deals.parts.customerPaid')}{/if}
    {/if}
  </p>

  {#if myTransfers.length > 0}
    <div class="dp-split">
      <p class="dp-split-title">{$t('deals.parts.viaSplitTitle')}</p>
      <p class="dp-hint">{$t('deals.parts.viaSplitExplain')}</p>
      {#each myTransfers as tr (tr.id)}
        <SheirutHalukaCard
          halukaId={tr.id}
          senderId={String(tr.senderId ?? '')}
          receiverId={String(tr.receiverId ?? '')}
          senderName={tr.senderName}
          receiverName={tr.receiverName}
          amount={tr.amount}
          forumId={tr.forumId}
          senderconf={tr.senderconf}
          confirmed={tr.confirmed}
          myId={me}
          projectId={String(tr.projectId ?? '')}
          senderLabel={$t('deals.parts.sentTo', { name: tr.receiverName })}
          receiverLabel={$t('deals.parts.receivedFrom', { name: tr.senderName })}
          onSenderConfirm={() => onTransfer(tr, 'send')}
          onReceiverConfirm={() => onTransfer(tr, 'receive')}
        />
      {/each}
    </div>
  {/if}

  {#if iAmPending}
    <button class="dp-mine" disabled={busy} onclick={onConfirm}>
      {busy ? $t('deals.parts.confirming') : $t('deals.parts.mine')}
    </button>
    <p class="dp-hint">{$t('deals.parts.mineHint')}</p>
  {/if}
</Panel>

<style>
  .dp-explain { font-size: 12px; color: var(--gold); line-height: 1.5; margin: 0 0 12px; }
  .dp-list { list-style: none; margin: 0; padding: 0; }
  .dp-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--border); }
  .dp-row:last-child { border-bottom: none; }
  .dp-name { flex: 1; min-width: 0; font-size: 13px; font-weight: 700; color: var(--text); }
  .dp-due { font-size: 12px; color: var(--gold-l); }
  .dp-chip { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px; background: var(--gold-d); color: var(--gold-l); }
  .dp-chip.ok { background: rgba(74, 222, 128, 0.15); color: #4ade80; }
  .dp-status { margin: 10px 0 0; font-size: 12px; color: var(--gold); line-height: 1.5; }
  .dp-status.ok { color: #4ade80; font-weight: 700; }
  .dp-mine {
    margin-top: 12px; width: 100%; padding: 10px 14px; border-radius: 10px; border: none; cursor: pointer;
    background: linear-gradient(135deg, var(--gold), var(--gold-l)); color: #1a1408;
    font-weight: 800; font-size: 13px; font-family: inherit;
  }
  .dp-mine:disabled { opacity: 0.6; cursor: wait; }
  .dp-via { flex-basis: 100%; font-size: 11px; color: var(--gold); padding-inline-start: 4px; }
  .dp-ok { color: #4ade80; font-weight: 700; }
  .dp-split { margin-top: 14px; display: flex; flex-direction: column; gap: 10px; }
  .dp-split-title { margin: 0; font-size: 13px; font-weight: 800; color: var(--gold-l); }
  .dp-hint { margin: 6px 0 0; font-size: 11px; color: var(--gold); line-height: 1.5; }
</style>
