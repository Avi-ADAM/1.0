<script>
  /**
   * The P2P pilot's consent and status card (docs/PLAN_P2P_PILOT.md §2).
   *
   * Opt-in per device, because joining costs the member something real: their
   * upload bandwidth, some browser storage, and — with plain STUN — their
   * public IP address becomes visible to the rikma's other members. The card
   * says all three before the switch, not after. Off, the pilot does nothing.
   *
   * Hidden entirely when the server has no pilot configured (`unavailable`).
   */
  import { t } from '$lib/translations';
  import { formatSize } from '$lib/spaceDocs/spaceDocs.js';

  /** @type {{ pilot: import('$lib/p2p/pilot.svelte.js').RikmaP2p }} */
  let { pilot } = $props();

  let busy = $state(false);
  let expanded = $state(false);

  async function toggle() {
    busy = true;
    await pilot.setOptIn(!pilot.optedIn);
    busy = false;
  }

  async function clear() {
    if (!confirm($t('rikmaDocs.p2p.clearConfirm'))) return;
    busy = true;
    await pilot.clearLocalCache();
    busy = false;
  }

  let statusKey = $derived(
    pilot.status === 'joined'
      ? pilot.peers > 0
        ? 'rikmaDocs.p2p.statusPeers'
        : 'rikmaDocs.p2p.statusAlone'
      : `rikmaDocs.p2p.status.${pilot.status}`
  );
</script>

{#if pilot.status !== 'unavailable'}
  <section class="pilot" class:on={pilot.optedIn} aria-labelledby="p2p-pilot-title">
    <div class="top">
      <span class="badge">{$t('rikmaDocs.p2p.badge')}</span>
      <h3 id="p2p-pilot-title">{$t('rikmaDocs.p2p.title')}</h3>
      <button
        type="button"
        class="switch"
        role="switch"
        aria-checked={pilot.optedIn}
        aria-label={$t('rikmaDocs.p2p.title')}
        disabled={busy}
        onclick={toggle}
      >
        <span class="knob"></span>
      </button>
    </div>

    <p class="lead">{$t('rikmaDocs.p2p.lead')}</p>

    {#if pilot.optedIn}
      <p class="status" role="status">
        <span class="dot" class:live={pilot.status === 'joined'}></span>
        {$t(statusKey, { count: pilot.peers })}
      </p>
      <p class="stats">
        {$t('rikmaDocs.p2p.cache', { count: pilot.usage.count, size: formatSize(pilot.usage.bytes) || '0 B' })}
        {#if pilot.served > 0}· {$t('rikmaDocs.p2p.served', { count: pilot.served })}{/if}
      </p>
      <button type="button" class="link-btn" onclick={clear} disabled={busy || pilot.usage.count === 0}>
        {$t('rikmaDocs.p2p.clear')}
      </button>
    {/if}

    <button type="button" class="link-btn" aria-expanded={expanded} onclick={() => (expanded = !expanded)}>
      {expanded ? $t('rikmaDocs.p2p.lessInfo') : $t('rikmaDocs.p2p.moreInfo')}
    </button>
    {#if expanded}
      <ul class="terms">
        <li>{$t('rikmaDocs.p2p.termIp')}</li>
        <li>{$t('rikmaDocs.p2p.termBandwidth')}</li>
        <li>{$t('rikmaDocs.p2p.termVerify')}</li>
        <li>{$t('rikmaDocs.p2p.termMeasure')}</li>
      </ul>
    {/if}
  </section>
{/if}

<style>
  .pilot {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    padding: 0.9rem 1rem;
    border-radius: 0.75rem;
    background: var(--surface-2);
    border: 1px dashed var(--surface-line);
    color: var(--surface-ink);
  }
  .pilot.on {
    border-style: solid;
    border-color: rgb(16 185 129 / 0.55);
  }
  .top {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .badge {
    padding: 0.1rem 0.5rem;
    border-radius: 9999px;
    background: var(--gold);
    color: #1a1408;
    font-size: 0.7rem;
    font-weight: 800;
  }
  h3 {
    flex: 1;
    font-size: 0.98rem;
    font-weight: 800;
  }
  .switch {
    position: relative;
    flex: none;
    width: 2.6rem;
    height: 1.5rem;
    border-radius: 9999px;
    background: var(--surface-line);
    box-shadow: inset 0 0 0 1px var(--surface-line);
    transition: background 0.15s;
  }
  .switch[aria-checked='true'] {
    background: rgb(16 185 129);
  }
  .knob {
    position: absolute;
    top: 0.2rem;
    inset-inline-start: 0.2rem;
    width: 1.1rem;
    height: 1.1rem;
    border-radius: 9999px;
    background: var(--surface);
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.3);
    transition: inset-inline-start 0.15s;
  }
  .switch[aria-checked='true'] .knob {
    inset-inline-start: 1.3rem;
  }
  .switch:focus-visible,
  .link-btn:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }
  .switch:disabled {
    opacity: 0.6;
  }
  .lead {
    font-size: 0.85rem;
    color: var(--surface-muted);
  }
  .status {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.85rem;
    font-weight: 700;
  }
  .dot {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 9999px;
    background: var(--surface-muted);
  }
  .dot.live {
    background: rgb(16 185 129);
    box-shadow: 0 0 0 3px rgb(16 185 129 / 0.25);
  }
  .stats {
    font-size: 0.78rem;
    color: var(--surface-muted);
  }
  .link-btn {
    align-self: flex-start;
    padding: 0;
    color: var(--surface-ink);
    font-size: 0.8rem;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .link-btn:disabled {
    opacity: 0.5;
    text-decoration: none;
  }
  .terms {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding-inline-start: 1.1rem;
    list-style: disc;
    font-size: 0.8rem;
    color: var(--surface-ink);
  }
</style>
