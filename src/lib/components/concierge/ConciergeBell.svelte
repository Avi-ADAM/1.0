<script>
  import { t } from '$lib/translations';
  import NoticeRow from '$lib/components/notices/NoticeRow.svelte';
  import { invalidateAll } from '$app/navigation';

  /**
   * The concierge header's bell: opens a small panel of what is waiting for
   * the customer, or says there is nothing. The dot on the bell shows only
   * while there is something to open.
   *
   * Two shapes of content, newest first:
   *   - `notices` (docs/inprogress/PLAN_SMART_NOTICES.md) — one sentence per proposal
   *     whose move is the viewer's, as wisher or as provider, with its terms
   *     and an "expand" into the wish. `[]` means nothing waits for her.
   *   - `items` — one row per wish with unanswered offers and a count
   *     (`notificationItems` in $lib/concierge/summary.js). Shown only when the
   *     notices could not be read (`null` / absent): we then still know *that*
   *     offers wait, just not what they say.
   *
   * The bell's glyph is 🔔 unless the caller passes its own as children.
   *
   * @type {{
   *   items?: { id: string, name: string, count: number }[],
   *   notices?: import('$lib/notices').Notice[] | null,
   *   children?: import('svelte').Snippet
   * }}
   */
  let { items = [], notices = null, children } = $props();

  let open = $state(false);
  /** @type {HTMLElement | undefined} */
  let root = $state();

  // The server's list, which hiding/restoring then edits in place. A writable
  // $derived: a fresh load (new `notices`) replaces the local edits.
  /** @type {import('$lib/notices').Notice[] | null} */
  let list = $derived(notices);
  let showHidden = $state(false);

  const visible = $derived((list ?? []).filter((n) => !n.hidden));
  const hiddenOnes = $derived((list ?? []).filter((n) => n.hidden));
  const total = $derived(items.reduce((sum, i) => sum + i.count, 0));
  // What she hid is not news: the dot counts only what still asks for her.
  const hasNews = $derived(list ? visible.length > 0 : total > 0);

  /** @param {import('$lib/notices').Notice} n @param {boolean} hidden */
  function mark(n, hidden) {
    list = (list ?? []).map((x) => (x.key === n.key ? { ...x, hidden } : x));
  }

  // After a signature the row says "signed" for a moment, then the page reloads
  // its data — the proposal's own status on the page has moved too.
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let refresh;
  function afterApproved() {
    clearTimeout(refresh);
    refresh = setTimeout(() => invalidateAll(), 2500);
  }

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
    aria-label={$t('notices.bell.title')}
    aria-haspopup="true"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    {#if children}{@render children()}{:else}🔔{/if}{#if hasNews}<span class="notif-pip"></span>{/if}
  </button>

  {#if open}
    <div class="bell-panel" role="region" aria-label={$t('notices.bell.title')}>
      <div class="bell-title">{$t('notices.bell.title')}</div>
      {#if list}
        {#if visible.length === 0}
          <p class="bell-empty">{$t('notices.bell.empty')}</p>
        {:else}
          <ul class="bell-list">
            {#each visible as notice (notice.key)}
              <li>
                <NoticeRow
                  {notice}
                  onfollow={() => (open = false)}
                  onapproved={afterApproved}
                  onhidden={(n) => mark(n, true)}
                />
              </li>
            {/each}
          </ul>
        {/if}
        {#if hiddenOnes.length}
          <button type="button" class="bell-hidden-toggle" aria-expanded={showHidden} onclick={() => (showHidden = !showHidden)}>
            {$t('notices.ui.showHidden', { count: hiddenOnes.length })}
          </button>
          {#if showHidden}
            <ul class="bell-list">
              {#each hiddenOnes as notice (notice.key)}
                <li><NoticeRow {notice} onrestored={(n) => mark(n, false)} /></li>
              {/each}
            </ul>
          {/if}
        {/if}
      {:else if items.length === 0}
        <p class="bell-empty">{$t('notices.bell.empty')}</p>
      {:else}
        <ul class="bell-list">
          {#each items as item (item.id)}
            <li>
              <a href="/concierge/{item.id}" class="bell-row" onclick={() => (open = false)}>
                <span class="bell-name">{item.name || $t('notices.bell.untitled')}</span>
                <span class="bell-count">{$t('notices.bell.pendingOffers', { count: item.count })}</span>
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
  .bell-hidden-toggle {
    display: block;
    width: 100%;
    margin: 8px 0 4px;
    padding: 6px 4px;
    border: 0;
    background: none;
    font: inherit;
    font-size: 12px;
    color: var(--cg-muted);
    text-align: start;
    text-decoration: underline;
    cursor: pointer;
  }
  @media (prefers-reduced-motion: reduce) {
    .bell-row {
      transition: none;
    }
  }
</style>
