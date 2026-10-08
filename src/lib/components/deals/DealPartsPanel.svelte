<!--
  DealPartsPanel — has every provider received their part? (QA_CONCIERGE_E2E C-19)

  A wish deal reads "paid" only when each provider has confirmed, themselves, receiving
  their part in full. Everyone on the deal sees who has; a provider who has not yet
  confirmed gets the button. Someone still waiting for money does not press anything —
  they say so in the deal's chat.
-->
<script lang="ts">
  import Money from '$lib/components/money/Money.svelte';
  import Panel from '$lib/components/Panel.svelte';
  import { t } from '$lib/translations';
  import type { PartsView } from '$lib/sheirut/partsReceived';

  let {
    parts,
    viewerId,
    busy = false,
    onConfirm
  }: {
    parts: PartsView;
    viewerId: string;
    busy?: boolean;
    onConfirm: () => void;
  } = $props();

  const isConfirmed = (id: string) => parts.confirmed.includes(id);
  const iAmPending = $derived(parts.pending.includes(String(viewerId)));
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
  .dp-hint { margin: 6px 0 0; font-size: 11px; color: var(--gold); line-height: 1.5; }
</style>
