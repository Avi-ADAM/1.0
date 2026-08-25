<script>
  /**
   * LevList — the heart as a fast overview.
   *
   * The swiper mounts every card at once: forty full card components, each 400
   * to 1000 lines of markup, live in the DOM whether or not you can see them.
   * This view mounts none of them. It renders one cheap condensed row per item
   * and mounts a single <LevCard> only when the user opens one, so the cost of
   * scrolling the heart no longer scales with how much is waiting there.
   *
   * The expanded card itself — the overlay, its five ways out, and the history
   * entry that makes the Android back gesture behave — is `../LevSheet.svelte`,
   * shared with the coin field so the two cheap views cannot drift apart.
   */
  import { t, isRtl } from '$lib/translations';
  import LevRow from './LevRow.svelte';
  import LevSheet from '../LevSheet.svelte';
  import { isCardVisible } from '../cards/cardKinds.js';
  import { deckPosition, rememberCard } from '../cards/deckPosition.svelte.js';
  import Filter from '../cards/filter.svelte';
  import FilterIcon from '$lib/celim/icons/filterIcon.svelte';
  import LevViewSwitch from '../LevViewSwitch.svelte';
  import '../cards/stylec.css';

  /**
   * @typedef {Object} Props
   * @property {any[]} [arr1] - the display items (already milon/project filtered upstream)
   * @property {any} [milon] - card-type visibility map
   * @property {boolean} [low]
   * @property {any[]} [askedarr]
   * @property {any[]} [declineddarr]
   * @property {(payload: any) => void} [onHover]
   * @property {(payload: any) => void} [onProj]
   * @property {(payload: any) => void} [onUser]
   * @property {(payload: any) => void} [onChat]
   * @property {(payload: any) => void} [onStart] - a card finished with itself
   * @property {(payload: any) => void} [onShowonly] - filter panel selection
   * @property {() => void} [onShowall] - clear filters
   * @property {(view: 'list' | 'cards' | 'coins') => void} [onView] - leave the list
   * @property {any[]} [uniqueProjects]
   * @property {Record<string, number>} [counts] - per-milon-key counts for the filter panel
   */

  /** @type {Props} */
  let {
    arr1 = [],
    milon = {},
    low = false,
    askedarr = [],
    declineddarr = [],
    onHover,
    onProj,
    onUser,
    onChat,
    onStart,
    onShowonly,
    onShowall,
    onView,
    uniqueProjects = [],
    counts = {}
  } = $props();

  let rows = $derived(arr1.filter((item) => isCardVisible(item, milon)));

  // The open card is tracked by id, not by object: the feed hands out a fresh
  // array on every socket message and clock-driven re-emit, so holding the item
  // itself would pin a stale copy. Looking it up each time also means the
  // overlay closes by itself if the item leaves the feed.
  let openId = $state(null);
  let openItem = $derived(
    openId === null ? null : (rows.find((r) => r.coinlapach === openId) ?? null)
  );

  let filterKind = $state(false);
  let filterProjects = $state(false);

  /**
   * Where the member is, so switching view does not lose it.
   *
   * `deckPosition` was the deck's own memory of which card it was parked on;
   * it is the heart's now. Opening a row marks the item, and arriving in this
   * view scrolls that item into sight — so list → cards → coins and back keeps
   * you on the same object instead of dropping you at the top three times.
   */
  let scroller = $state();
  let restored = false;
  $effect(() => {
    const el = scroller;
    const wanted = deckPosition.id;
    if (!el || restored || !wanted || rows.length === 0) return;
    restored = true;
    const idx = rows.findIndex((r) => String(r.coinlapach) === wanted);
    if (idx < 0) return;
    const child = el.children[idx];
    if (child instanceof HTMLElement)
      child.scrollIntoView({ behavior: 'auto', block: 'center' });
  });

  /** @param {any} item */
  function openRow(item) {
    rememberCard(item.coinlapach);
    openId = item.coinlapach;
  }

  // A card that reports itself done (voted, accepted, dismissed) has left the
  // feed; drop the overlay with it rather than waiting for the lookup to miss.
  function cardFinished(payload) {
    openId = null;
    onStart?.(payload);
  }

  function pickFilter(payload) {
    filterKind = false;
    filterProjects = false;
    onShowonly?.(payload);
  }
  function clearFilter() {
    filterKind = false;
    filterProjects = false;
    onShowall?.();
  }
</script>

<div class="lev-list-root" dir={$isRtl ? 'rtl' : 'ltr'}>
  <header class="bar">
    <span class="count">{$t('lev.list.count', { count: rows.length })}</span>

    <div class="bar-actions">
      <button
        type="button"
        class="icon"
        aria-label={$t('lev.cards.nav.filter')}
        onclick={() => (filterKind ? clearFilter() : (filterKind = true))}
      >
        <FilterIcon filterType="cardType" isX={filterKind} />
      </button>

      {#if uniqueProjects.length >= 2}
        <button
          type="button"
          class="icon"
          aria-label={$t('lev.cards.nav.filter')}
          onclick={() =>
            filterProjects ? clearFilter() : (filterProjects = true)}
        >
          <FilterIcon isX={filterProjects} />
        </button>
      {/if}

      <LevViewSwitch
        compact
        value="list"
        onChange={(v) => onView?.(v)}
      />
    </div>
  </header>

  {#if filterKind}
    <div class="filter-strip">
      <Filter
        filterKind="kind"
        edgeToEdge
        onShowonly={pickFilter}
        onShowall={clearFilter}
        sug={counts.sugg ?? 0}
        pen={counts.pend ?? 0}
        ask={counts.asks ?? 0}
        wel={counts.welc ?? 0}
        beta={counts.betaha ?? 0}
        des={counts.desi ?? 0}
        fia={counts.fiap ?? 0}
        pmash={counts.ppmash ?? 0}
        mashs={counts.pmashs ?? 0}
        maap={counts.pmaap ?? 0}
        askma={counts.askmap ?? 0}
        hachlot={counts.hachla ?? 0}
        sheirutps={counts.sheirutp ?? 0}
        purchasesn={counts.purchases ?? 0}
      />
    </div>
  {:else if filterProjects}
    <div class="filter-strip">
      <Filter
        filterKind="projects"
        allIds={uniqueProjects}
        edgeToEdge
        onShowonly={pickFilter}
        onShowall={clearFilter}
      />
    </div>
  {/if}

  {#if rows.length === 0}
    <p class="empty">{$t('lev.cards.nav.nothing')}</p>
  {:else}
    <div class="scroller" bind:this={scroller}>
      {#each rows as item (item.coinlapach)}
        <div class="cell">
          <LevRow
            {item}
            onOpen={() => openRow(item)}
            {onProj}
            {onChat}
          />
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if openItem}
  <LevSheet
    item={openItem}
    {milon}
    {low}
    {askedarr}
    {declineddarr}
    onClose={() => (openId = null)}
    onFinished={cardFinished}
    {onHover}
    {onProj}
    {onUser}
    {onChat}
  />
{/if}

<style>
  .lev-list-root {
    /* The user's ask: about a third of a phone screen per card, clamped so it
       neither collapses on a short viewport nor becomes a full-page card on a
       tall one. */
    /* The floor is set by what the row must always show — the header strip,
       one line of title, the chips and the bottom line — not by taste. */
    --lev-row-h: clamp(190px, 30vh, 240px);
    height: 100dvh;
    display: flex;
    flex-direction: column;
    background: #fdfcf4;
  }
  :global(html.dark) .lev-list-root {
    background: #0a0904;
  }

  .bar {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
  :global(html.dark) .bar {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  .count {
    font-size: 0.8rem;
    font-weight: 600;
    color: #6b7280;
  }
  :global(html.dark) .count {
    color: #9ca3af;
  }

  .bar-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .icon {
    width: 2.25rem;
    height: 2.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    color: #4b5563;
  }
  :global(html.dark) .icon {
    color: #d1d5db;
  }

  .filter-strip {
    flex: none;
    padding: 0.25rem 0.5rem 0.5rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .scroller {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding: 0.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    /* No scroll-snap: the point of this view is to flick through it. */
  }

  .cell {
    /* The browser skips layout, style and paint for rows outside the viewport
       and reserves exactly one row's height for them, so a long heart scrolls
       at the same cost as a short one without a hand-written virtualiser. */
    content-visibility: auto;
    contain-intrinsic-size: auto var(--lev-row-h);
    flex: none;
  }

  .empty {
    flex: 1;
    display: grid;
    place-items: center;
    padding: 2rem;
    text-align: center;
    color: #6b7280;
  }

</style>
