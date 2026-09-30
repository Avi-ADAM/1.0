<script>
  import { t } from '$lib/translations';

  /**
   * The concierge header's bell: opens a small panel of what is waiting for
   * the customer — one row per wish that has offers still unanswered, each a
   * link to that wish — or says there is nothing. The dot on the bell shows
   * only while there is something to open.
   *
   * The rows come from `notificationItems` in $lib/concierge/summary.js, the
   * same offers the profile badge counts as "updates".
   *
   * The bell's glyph is 🔔 unless the caller passes its own as children.
   *
   * @type {{
   *   items?: { id: string, name: string, count: number }[],
   *   children?: import('svelte').Snippet
   * }}
   */
  let { items = [], children } = $props();

  let open = $state(false);
  /** @type {HTMLElement | undefined} */
  let root = $state();

  const total = $derived(items.reduce((sum, i) => sum + i.count, 0));

  /** @param {MouseEvent} e */
  function onWindowClick(e) {
    if (open && root && !root.contains(/** @type {Node} */ (e.target))) open = false;
  }
  /** @param {KeyboardEvent} e */
  function onWindowKey(e) {
    if (open && e.key === 'Escape') open = false;
  }
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKey} />

<div class="bell" bind:this={root}>
  <button
    type="button"
    class="notif-btn"
    aria-label={$t('concierge.notifications')}
    aria-haspopup="true"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    {#if children}{@render children()}{:else}🔔{/if}{#if total > 0}<span class="notif-pip"></span>{/if}
  </button>

  {#if open}
    <div class="bell-panel" role="region" aria-label={$t('concierge.notifications')}>
      <div class="bell-title">{$t('concierge.notifications')}</div>
      {#if items.length === 0}
        <p class="bell-empty">{$t('concierge.no_notifications')}</p>
      {:else}
        <ul class="bell-list">
          {#each items as item (item.id)}
            <li>
              <a href="/concierge/{item.id}" class="bell-row" onclick={() => (open = false)}>
                <span class="bell-name">{item.name || $t('concierge.notif_untitled')}</span>
                <span class="bell-count">{$t('concierge.pending_offers', { count: item.count })}</span>
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>

<style>
  .bell {
    position: relative;
  }
  .notif-btn {
    position: relative;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: var(--cg-s2);
    border: 1px solid rgb(var(--cg-fg-rgb) / calc(0.06 * var(--cg-fg-k)));
    cursor: pointer;
    font-size: 14px;
    color: var(--cg-goldhi);
    padding: 0;
  }
  .notif-pip {
    position: absolute;
    top: 6px;
    left: 6px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--cg-pink);
    box-shadow: 0 0 8px var(--cg-pink);
  }
  .bell-panel {
    position: absolute;
    top: calc(100% + 8px);
    inset-inline-end: 0;
    width: min(320px, calc(100vw - 28px));
    max-height: min(60vh, 420px);
    overflow-y: auto;
    background: var(--cg-s1);
    border: 1px solid rgb(var(--cg-amber-rgb) / 0.3);
    border-radius: 14px;
    box-shadow: 0 12px 32px rgb(var(--cg-shade-rgb) / calc(0.35 * var(--cg-shade-k)));
    padding: 12px;
    z-index: 110;
    text-align: start;
  }
  .bell-title {
    margin: 0 0 8px;
    padding: 0 4px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--cg-goldhi);
  }
  .bell-empty {
    margin: 0;
    padding: 14px 4px 10px;
    font-size: 13px;
    color: var(--cg-muted);
    text-align: center;
  }
  .bell-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .bell-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 10px;
    background: var(--cg-s2);
    color: var(--cg-ink);
    text-decoration: none;
    font-size: 13px;
    transition: background 0.15s;
  }
  .bell-row:hover,
  .bell-row:focus-visible {
    background: var(--cg-s3);
  }
  .bell-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }
  .bell-count {
    flex-shrink: 0;
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--cg-pink-d);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
  }
  @media (prefers-reduced-motion: reduce) {
    .bell-row {
      transition: none;
    }
  }
</style>
