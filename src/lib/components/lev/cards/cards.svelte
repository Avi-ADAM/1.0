<script>
  import { isRtl, t } from '$lib/translations';
  import { page } from '$app/state';
  import Lowding from '$lib/celim/lowding.svelte';
  // Every per-kind card now lives behind <LevCard>, so the deck markup is a
  // single slide template instead of a 25-branch chain.
  import LevCard from './LevCard.svelte';
  import { isCardVisible } from './cardKinds.js';
  //import { fly } from 'svelte/transition';
  import { onMount, untrack } from 'svelte';
  import { deckPosition, rememberCard } from './deckPosition.svelte.js';
  // Svelte 5: Define callback props instead of using createEventDispatcher
  let {
    onStart,
    onUser,
    onHover,
    onProj,
    onChat,
    onView,
    low = false,
    askedarr = [],
    declineddarr = [],
    arr1 = [],
    indexi = -1,
    sug = 13,
    pen = 13,
    ask = 17,
    wel = 17,
    beta = 13,
    des = 13,
    fia = 99,
    pmash = 99,
    mashs = 17,
    maap = 17,
    askma = 13,
    hachlot = 99,
    saless = 99,
    sheirutps = 99,
    purchasesn = 0
  } = $props();

  let milon = $state({
    fiap: true,
    welc: true,
    sugg: true,
    pend: true,
    asks: true,
    betaha: true,
    desi: true,
    ppmash: true,
    pmashs: true,
    pmaap: true,
    askmap: true,
    hachla: true,
    vidu: true,
    sheirutp: true,
    sales: true,
    purchases: true
  });
  // Kept for the `.swiper-slidec` / `.d` globals that the per-kind cards still
  // reference from their own markup — the deck below no longer uses it.
  import './stylec.css';
  import LevViewSwitch from '../LevViewSwitch.svelte';
  import Filter from './filter.svelte';
  import FilterIcon from '$lib/celim/icons/filterIcon.svelte';
  import Button from '$lib/celim/ui/button.svelte';
  import { goto } from '$app/navigation';
  let h = $state();

  let slideIndex;
  async function delo(event) {
    console.log('slideIndex');
    slideIndex = event.coinlapach;

    // swiperRef.removeSlide(slideIndex)
    //

    onStart?.({ cards: false, ani: event.ani, coinlapach: event.coinlapach }); // Svelte 5: Replaced dispatch with callback prop
    // let oldob = arr1;
    // const x = oldob.map(c => c.coinlapach);
    // const indexy = x.indexOf(event.coinlapach);
    // oldob.splice(indexy, 1);
    // arr1 = oldob

    // arr1 = [...arr1]
  }
  function user(event) {
    onUser?.({ id: event.id }); // Svelte 5: Replaced dispatch with callback prop
  }

  function hover(event) {
    onHover?.({ id: event.id }); // Svelte 5: Replaced dispatch with callback prop
  }
  function chat(payload) {
    // Forward a card's chat request (e.g. saleClaim → { forumId }) to the page,
    // which opens the shared chat widget. Was a no-op, so chat never opened in
    // the list/card view.
    console.log('[saleClaim][chat] cards.chat forwarding to page', {
      payload,
      hasOnChat: typeof onChat === 'function'
    });
    onChat?.(payload);
  }

  function proj(event) {
    console.log(event.id);
    onProj?.({ id: event.id }); // Svelte 5: Replaced dispatch with callback prop
  }
  let hovered = false;
  let u = $state('');
  function hoverede() {
    hovered = !hovered;
    if (hovered == false) {
      u = $t('lev.cards.nav.heart');
    }
    onHover?.({ id: u }); // Svelte 5: Replaced dispatch with callback prop
  }
  function hoverc(id) {
    if (id == '0') {
      u = $t('lev.cards.nav.heart');
    } else {
      u = id;
    }

    onHover?.({ id: u }); // Svelte 5: Replaced dispatch with callback prop
  }
  //exclude meData huca
  function showonly(event) {
    console.log(event, 'event');
    if (event.kind !== 'projects') {
      const value = event.data;
      for (const key in milon) {
        milon[key] = false;
      }

      milon[value] = true;
    } else {
      const id = event.id;
      console.log(id, 'FILTER+id');
      filterByProjectId(id);
    }
  }

  function showall(event) {
    filter = false;
    filter2 = false;
    clearFilters();
    for (const key in milon) {
      milon[key] = true;
    }
  }
  let filter = $state(false),
    filter2 = $state(false);
    let filteredArr = $state(arr1); // Initialize with arr1
  let currentProjectIdFilter = $state(null);

  // Effect to keep filteredArr in sync with arr1 or apply project filter
  $effect(() => {
    if (currentProjectIdFilter !== null) {
      filteredArr = arr1.filter(
        (item) => item.projectId && item.projectId === currentProjectIdFilter
      );
    } else {
      filteredArr = arr1;
    }
  });

  // What actually becomes a slide. The milon gate used to live inside each
  // {:else if}, which meant a card-type filter changed the rendered slides
  // without the deck noticing. Gating here keeps the deck and the list view
  // agreeing on what "shown" means.
  // The dedupe is a guard, not a feature: `coinlapach` is unique by
  // construction (`kind-id`), but the {#each} below is keyed on it now, and
  // Svelte throws on a duplicate key — which on this page means a blank heart.
  // Dropping a repeat is the survivable failure.
  let visibleArr = $derived.by(() => {
    const seen = new Set();
    return filteredArr.filter((b) => {
      if (!isCardVisible(b, milon)) return false;
      const k = String(b.coinlapach);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  });

  // ===================================================================
  // The deck — native CSS scroll-snap, no Swiper.
  //
  // arr1/filteredArr get a NEW array reference whenever a timer ticks (the
  // processed feeds re-emit on the clock store). Swiper had to be torn down and
  // rebuilt behind a `{#key}` on those, which is what snapped the user back to
  // card 0 several times a minute. A keyed {#each} over a plain scroll
  // container patches only the row that actually changed, so a live countdown
  // no longer costs the reader their place.
  //
  // Everything Swiper's modules did is re-implemented below against the scroll
  // container: Navigation → goTo/step + the two arrow buttons, Keyboard →
  // onKeydown, Mousewheel → onWheel (the one thing native scrolling genuinely
  // cannot do: turn a vertical wheel into horizontal paging).
  // ===================================================================

  /** @type {HTMLDivElement | undefined} */
  let deckEl = $state();
  let currentIndex = $state(0);

  // Identity of the *set* of slides. The re-anchor below runs on this, not on
  // every feed re-emit.
  let idsSig = $derived(
    (currentProjectIdFilter ?? 'all') +
      '|' +
      visibleArr.map((b) => b.coinlapach).join(',')
  );

  // The trailing "end of the line" slide is index `visibleArr.length`.
  let lastIndex = $derived(visibleArr.length);

  // Orientation. Deliberately a media query rather than `isMobileOrTablet()`:
  // the UA test puts an iPad in the phone lane, and it never re-evaluates on
  // rotate or resize. Phone → vertical full-bleed (TikTok); tablet and desktop
  // → horizontal paging with arrows.
  const media = (q) =>
    typeof window !== 'undefined' && !!window.matchMedia?.(q).matches;
  // Seeded synchronously so the very first paint is already in the right
  // orientation — reading it only in onMount rendered one horizontal frame on
  // every phone.
  let narrow = $state(media('(max-width: 767px)'));
  let reduceMotion = $state(media('(prefers-reduced-motion: reduce)'));

  onMount(() => {
    const layout = window.matchMedia('(max-width: 767px)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncLayout = () => (narrow = layout.matches);
    const syncMotion = () => (reduceMotion = motion.matches);
    layout.addEventListener('change', syncLayout);
    motion.addEventListener('change', syncMotion);
    syncLayout();
    syncMotion();
    return () => {
      layout.removeEventListener('change', syncLayout);
      motion.removeEventListener('change', syncMotion);
    };
  });

  /**
   * Scroll slide `i` to the middle of the deck. `scrollIntoView` rather than
   * arithmetic on scrollLeft: in RTL `scrollLeft` is negative and its origin
   * differs between engines, while `inline: 'center'` is direction-agnostic.
   * @param {number} i
   * @param {ScrollBehavior} [behavior]
   */
  function goTo(i, behavior) {
    const child = deckEl?.children?.[i];
    if (!(child instanceof HTMLElement)) return;
    // Optimistic: the observer confirms within a frame, but two quick clicks on
    // the arrow must not both compute their target from the same stale index.
    currentIndex = i;
    child.scrollIntoView({
      behavior: behavior ?? (reduceMotion ? 'auto' : 'smooth'),
      // 'nearest' on the cross axis so this can never nudge an ancestor (or the
      // document) that happens to be scrollable.
      block: narrow ? 'center' : 'nearest',
      inline: narrow ? 'nearest' : 'center'
    });
  }

  /** @param {number} dir +1 = next card, -1 = previous, in reading order */
  function step(dir) {
    goTo(Math.min(Math.max(currentIndex + dir, 0), lastIndex));
  }

  // The deep link from the page ("open the heart on this card").
  $effect(() => {
    if (deckEl && indexi != -1) {
      const target = indexi;
      indexi = -1;
      untrack(() => goTo(target, 'auto'));
    }
  });

  // Which card is the user looking at. A -45% inset on all four sides leaves
  // only the centre 10% of the deck as the observer's root, so exactly one
  // slide can ever be intersecting — in either orientation, without having to
  // know which one is active.
  $effect(() => {
    const el = deckEl;
    idsSig; // re-observe when slides are added/removed/reordered
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const node = /** @type {HTMLElement} */ (entry.target);
          const idx = Number(node.dataset.idx);
          if (Number.isNaN(idx)) continue;
          currentIndex = idx;
          // The end-of-line slide has no id; keep the last real card
          // remembered so a reload lands on something readable.
          if (node.dataset.id) rememberCard(node.dataset.id);
        }
      },
      { root: el, rootMargin: '-45% -45% -45% -45%', threshold: 0 }
    );
    for (const child of el.children) io.observe(child);
    return () => io.disconnect();
  });

  /**
   * Put the reader back on the card they were on after the slide set changed.
   *
   * A keyed {#each} already preserves the DOM, but not the scroll offset: if a
   * card *before* the current one resolves and leaves the feed, the content
   * slides up under an unchanged scrollTop and the reader silently ends up on a
   * different card. Re-anchoring by id fixes that, and the same code restores
   * the position on mount (from sessionStorage) — see deckPosition.svelte.js.
   */
  function reanchor() {
    const wanted = deckPosition.id;
    if (!wanted || !deckEl) return;
    // Parked on the end-of-line slide: that is where the reader chose to be,
    // and `deckPosition` still holds the last card they passed. Leave them.
    if (currentIndex >= visibleArr.length) return;
    const idx = visibleArr.findIndex((b) => String(b.coinlapach) === wanted);
    if (idx < 0) return; // that card left the feed — stay where we are
    const child = deckEl.children[idx];
    if (!(child instanceof HTMLElement)) return;
    // Already centred (the common case): touching the scroll offset here would
    // be exactly the jitter this replaced.
    const deckBox = deckEl.getBoundingClientRect();
    const box = child.getBoundingClientRect();
    const off = narrow
      ? Math.abs(box.top + box.height / 2 - (deckBox.top + deckBox.height / 2))
      : Math.abs(box.left + box.width / 2 - (deckBox.left + deckBox.width / 2));
    if (off < 4) return;
    child.scrollIntoView({
      behavior: 'auto',
      block: narrow ? 'center' : 'nearest',
      inline: narrow ? 'nearest' : 'center'
    });
    currentIndex = idx;
  }

  $effect(() => {
    const el = deckEl;
    idsSig;
    // Rotating the device swaps the scroll axis, so the offset the browser kept
    // means nothing any more — re-anchor on that too.
    narrow;
    if (!el) return;
    untrack(() => reanchor());
  });

  /**
   * Does something between `node` and the deck still have room to scroll in the
   * wheel's direction? If so the wheel belongs to the card's own content and we
   * keep our hands off it. This is what replaced `isScrolable`: a global toggle
   * the reader had to click before a card would scroll, because Swiper ate the
   * wheel unconditionally.
   * @param {EventTarget | null} node
   * @param {number} delta
   */
  function contentConsumesWheel(node, delta) {
    let el = node instanceof Element ? node : null;
    while (el && el !== deckEl) {
      const oy = getComputedStyle(el).overflowY;
      if (
        (oy === 'auto' || oy === 'scroll') &&
        el.scrollHeight > el.clientHeight + 1
      ) {
        const atTop = el.scrollTop <= 0;
        const atBottom =
          el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
        if (!(delta < 0 && atTop) && !(delta > 0 && atBottom)) return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  // Wheel → horizontal paging (desktop/tablet only; the vertical deck is
  // handled natively). One card per gesture, like Swiper's mousewheel module,
  // with an accumulator so a trackpad's stream of small deltas doesn't fly
  // through ten cards.
  let wheelAcc = 0;
  let wheelLockUntil = 0;
  let wheelIdleAt = 0;

  /** @param {WheelEvent} e */
  function onWheel(e) {
    if (narrow || e.ctrlKey) return;
    const dy = e.deltaY;
    const dx = e.deltaX;
    const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
    if (!delta) return;
    if (Math.abs(dy) >= Math.abs(dx) && contentConsumesWheel(e.target, dy))
      return;
    e.preventDefault();
    const now = performance.now();
    if (now > wheelIdleAt) wheelAcc = 0;
    wheelIdleAt = now + 200;
    if (now < wheelLockUntil) return;
    wheelAcc += delta;
    if (Math.abs(wheelAcc) < 40) return;
    const dir = wheelAcc > 0 ? 1 : -1;
    wheelAcc = 0;
    wheelLockUntil = now + 350;
    step(dir);
  }

  // Svelte does not delegate `wheel`, but attaching it by hand is the only way
  // to be certain the listener is non-passive — preventDefault is the whole
  // point of it.
  $effect(() => {
    const el = deckEl;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  /** @param {KeyboardEvent} e */
  function onKeydown(e) {
    const tgt = e.target;
    if (
      tgt instanceof Element &&
      tgt.closest('input, textarea, select, [contenteditable="true"]')
    )
      return;
    if (e.key === 'Home') {
      e.preventDefault();
      goTo(0);
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      goTo(lastIndex);
      return;
    }
    if (e.key === 'PageDown') {
      e.preventDefault();
      step(1);
      return;
    }
    if (e.key === 'PageUp') {
      e.preventDefault();
      step(-1);
      return;
    }
    // Up/Down in the vertical deck stay native: they belong to whatever the
    // card's own content is doing, and the snap catches them at the boundary.
    if (narrow) return;
    const forward = $isRtl ? 'ArrowLeft' : 'ArrowRight';
    const back = $isRtl ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === forward) {
      e.preventDefault();
      step(1);
    } else if (e.key === back) {
      e.preventDefault();
      step(-1);
    }
  }

  function filterByProjectId(projectId) {
    currentProjectIdFilter = projectId; // Setting this will trigger the effect
    console.log(filteredArr);
  }

  function clearFilters() {
    currentProjectIdFilter = null; // Setting this will trigger the effect
  }
  let uniqueProjects = $derived(
    Array.from(
      arr1.reduce((map, item) => {
        if (item.projectId && item.projectName) {
          if (!map.has(item.projectId)) {
            map.set(item.projectId, {
              projectName: item.projectName,
              count: 0
            });
          }
          map.get(item.projectId).count++;
        }
        return map;
      }, new Map())
    ).map(([projectId, { projectName, count }]) => ({
      projectId,
      projectName,
      count
    }))
  );
  $effect(() => {
    console.log(filter, filter2, 'uniqueProjects');
  });
</script>

{#if arr1.length > 0}
  <div
    dir={$isRtl ? 'rtl' : 'ltr'}
    bind:clientWidth={h}
    style:--lev-head-h={narrow && !low ? '3rem' : '0rem'}
    class="body box-border h-screen"
  >
    {#if !narrow}
      <!-- Was Swiper's Navigation module pointed at these two images by CSS
           selector; they are real buttons now, so they are reachable by keyboard
           and announced by a screen reader. -->
      <button
        type="button"
        onclick={() => step(1)}
        onmouseenter={() => hoverc($t('lev.cards.nav.next'))}
        onmouseleave={() => hoverc('0')}
        class={$isRtl ? 'perv' : 'next'}
        class:hidden={currentIndex >= lastIndex}
        aria-label={$t('lev.cards.nav.next')}
      >
        <img src={$t('lev.cards.nav.nextImage')} alt="" />
      </button>
      <button
        type="button"
        onclick={() => step(-1)}
        onmouseenter={() => hoverc($t('lev.cards.nav.prev'))}
        onmouseleave={() => hoverc('0')}
        class={$isRtl ? 'next' : 'perv'}
        class:hidden={currentIndex == 0}
        aria-label={$t('lev.cards.nav.prev')}
      >
        <img src={$t('lev.cards.nav.prevImage')} alt="" />
      </button>
      <div
        role="contentinfo"
        onmouseenter={() => hoverc($t('lev.list.switchLabel'))}
        onmouseleave={() => hoverc('0')}
        style:visibility={low == true ? 'hidden' : 'visible'}
        class="bg z-[1000]"
      >
        <LevViewSwitch value="cards" onChange={(v) => onView?.(v)} />
      </div>
      <!-- Left Filter (Card Type) -->
      <div
        dir="ltr"
        role="contentinfo"
        onmouseenter={() => hoverc($t('lev.cards.nav.filter'))}
        onmouseleave={() => hoverc('0')}
        style:visibility={low == true ? 'hidden' : 'visible'}
        class="z-[1000] top-4 absolute left-4 flex flex-row items-start justify-start"
      >
        <button
          class="w-12 h-12 flex items-center justify-center bg-white/90 backdrop-blur-md hover:bg-gold/80 rounded-full border-1 border-barbi shadow-lg transition-all duration-300"
          onclick={() => (filter ? showall() : (filter = true))}
        >
          <FilterIcon filterType="cardType" isX={filter} /></button
        >
        {#if filter}
          <div class="mt-2 ml-2">
            <Filter
              onShowonly={showonly}
              {sug}
              {pen}
              {ask}
              {wel}
              {beta}
              {des}
              {fia}
              {pmash}
              {mashs}
              {maap}
              {askma}
              {hachlot}
              {saless}
              {sheirutps}
              filterKind="kind"
            />
          </div>
        {/if}
      </div>

      <!-- Right Filter (Projects) -->
      <div
        dir="ltr"
        role="contentinfo"
        onmouseenter={() => hoverc($t('lev.cards.nav.filter'))}
        onmouseleave={() => hoverc('0')}
        style:visibility={low == true ? 'hidden' : 'visible'}
        class="z-[1000] top-4 absolute right-4 flex flex-row-reverse items-start justify-start"
      >
        {#if uniqueProjects.length >= 2}
          <button
            class="w-12 h-12 flex items-center justify-center bg-white/90 backdrop-blur-md hover:bg-gold/80 rounded-full border-1 border-barbi shadow-lg transition-all duration-300"
            onclick={() => (filter2 ? showall() : (filter2 = true))}
          >
            <FilterIcon isX={filter2} /></button
          >
          {#if filter2}
            <div class="mt-2 mr-2">
              <Filter
                allIds={uniqueProjects}
                filterKind="projects"
                onShowonly={showonly}
              />
            </div>
          {/if}
        {/if}
      </div>
    {:else if !low}
      <!--
        The phone chrome used to be a pill fixed at `bottom-12`: directly above
        the site footer, overlapping the bottom of every card, so the action
        buttons a card exists for were the part it covered. Same controls, moved
        to a header the deck reserves room for — the shape the list view already
        uses.
      -->
      <header class="deck-head">
        <LevViewSwitch compact value="cards" onChange={(v) => onView?.(v)} />

        <div class="head-actions">
          <button
            type="button"
            class="head-icon"
            aria-label={$t('lev.cards.nav.filter')}
            onclick={() => (filter ? showall() : ((filter2 = false), (filter = true)))}
          >
            <FilterIcon isX={filter} filterType="cardType" />
          </button>
          {#if uniqueProjects.length >= 2}
            <button
              type="button"
              class="head-icon"
              aria-label={$t('lev.cards.nav.filter')}
              onclick={() =>
                filter2 ? showall() : ((filter = false), (filter2 = true))}
            >
              <FilterIcon isX={filter2} />
            </button>
          {/if}
        </div>
      </header>

      {#if filter}
        <div class="filter-drop">
          <Filter
            onShowonly={showonly}
            edgeToEdge
            {sug}
            {pen}
            {ask}
            {wel}
            {beta}
            {des}
            {fia}
            {pmash}
            {mashs}
            {maap}
            {askma}
            {hachlot}
            {saless}
            {sheirutps}
            {purchasesn}
            filterKind="kind"
          />
        </div>
      {:else if filter2}
        <div class="filter-drop">
          <Filter
            allIds={uniqueProjects}
            filterKind="projects"
            edgeToEdge
            onShowonly={showonly}
          />
        </div>
      {/if}
    {/if}

    <div
      role="contentinfo"
      class="swi"
      onmouseenter={() => hoverede()}
      onmouseleave={() => hoverede()}
    >
      <!-- A scrollable region has to be reachable and operable by keyboard
           (WCAG 2.1.1), which means tabindex="0" and a key handler on an
           element with a non-interactive role. That is the correct pattern
           here, not an oversight. -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div
        bind:this={deckEl}
        class="deck"
        class:deck-vertical={narrow}
        dir={$isRtl ? 'rtl' : 'ltr'}
        tabindex="0"
        role="region"
        aria-label={$t('lev.cards.nav.heart')}
        onkeydown={onKeydown}
      >
        {#each visibleArr as buble, i (buble.coinlapach)}
          <div class="deck-slide" data-idx={i} data-id={buble.coinlapach}>
            <LevCard
              {buble}
              {milon}
              {i}
              {low}
              {askedarr}
              {declineddarr}
              isVisible={currentIndex === i}
              onHover={hover}
              onProj={proj}
              onUser={user}
              onCoinLapach={delo}
              onChat={chat}
            />
          </div>
        {/each}
        <div class="deck-slide" data-idx={visibleArr.length}>
          <div class="flex flex-col items-center justify-center h-full w-full">
            <h2 class="text-2xl font-bold mb-4">
              {$t('lev.endOfLine')}
            </h2>
            <Button
              onClick={() => goTo(0)}
              text={$t('common.buttons.backToStart')}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
{:else if low == true}
  <div class="body grid items-center justify-center">
    <Lowding height="50vh" />
  </div>
{:else}
  <div class="body flex flex-col items-center justify-center">
    <h1 class="text-2xl font-bold text-barbi text-center">
      {$t('lev.cards.nav.nothing')}
    </h1>
    <Button onClick={() => goto('/me')} text={$t('lev.cards.toProfile')} />
  </div>
{/if}

<style>
  .body {
    /* Set inline: the phone header only exists when it is actually rendered,
       and the deck's top inset has to agree. */
    --lev-head-h: 0rem;
    height: 100dvh;
    width: 100vw;
    border: none;
    position: relative;
    /* Royal Gold & Pink Mesh Gradient */
    background:
      radial-gradient(at 0% 0%, rgba(255, 0, 146, 0.07) 0%, transparent 50%),
      radial-gradient(at 100% 0%, rgba(179, 135, 40, 0.12) 0%, transparent 50%),
      radial-gradient(
        at 100% 100%,
        rgba(255, 0, 146, 0.07) 0%,
        transparent 50%
      ),
      radial-gradient(at 0% 100%, rgba(179, 135, 40, 0.12) 0%, transparent 50%),
      radial-gradient(at 50% 50%, rgba(255, 255, 255, 0.9) 0%, transparent 80%),
      #fdfcf4; /* Very light creamy gold */
    background-size: 100% 100%;
    overflow: hidden;
    transition: background 0.5s ease;
  }

  :global(html.dark) .body {
    background:
      radial-gradient(at 0% 0%, rgba(255, 0, 146, 0.2) 0%, transparent 50%),
      radial-gradient(
        at 100% 0%,
        rgba(179, 135, 40, 0.25) 0%,
        transparent 50%
      ),
      radial-gradient(
        at 100% 100%,
        rgba(255, 0, 146, 0.2) 0%,
        transparent 50%
      ),
      radial-gradient(
        at 0% 100%,
        rgba(179, 135, 40, 0.25) 0%,
        transparent 50%
      ),
      radial-gradient(at 50% 50%, rgba(15, 12, 0, 0.95) 0%, transparent 80%),
      #0a0904; /* Very dark charcoal gold */
  }

  /* Support for manual .dark class if needed */
  :global(.dark) .body {
    background:
      radial-gradient(at 0% 0%, rgba(255, 0, 146, 0.2) 0%, transparent 50%),
      radial-gradient(at 100% 0%, rgba(179, 135, 40, 0.25) 0%, transparent 50%),
      radial-gradient(at 100% 100%, rgba(255, 0, 146, 0.2) 0%, transparent 50%),
      radial-gradient(at 0% 100%, rgba(179, 135, 40, 0.25) 0%, transparent 50%),
      radial-gradient(at 50% 50%, rgba(15, 12, 0, 0.95) 0%, transparent 80%),
      #0a0904;
  }

  /* Premium Gold Shimmer Effect */
  .body::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      transparent 0%,
      transparent 45%,
      rgba(179, 135, 40, 0.05) 50%,
      transparent 55%,
      transparent 100%
    );
    background-size: 300% 300%;
    animation: goldShimmer 15s linear infinite;
    pointer-events: none;
    z-index: 0;
  }

  @keyframes goldShimmer {
    0% {
      background-position: -150% -150%;
    }
    100% {
      background-position: 150% 150%;
    }
  }

  .bg {
    position: absolute;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
  }

  /* --- phone header ------------------------------------------------------ */
  .deck-head {
    position: absolute;
    top: 0;
    inset-inline: 0;
    height: var(--lev-head-h);
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0 0.6rem;
    background: rgba(253, 252, 244, 0.85);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
  :global(html.dark) .deck-head {
    background: rgba(10, 9, 4, 0.85);
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  .head-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .head-icon {
    width: 2.25rem;
    height: 2.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    color: #4b5563;
  }
  :global(html.dark) .head-icon {
    color: #d1d5db;
  }

  /* The filter panel hangs off the header instead of floating over the card. */
  .filter-drop {
    position: absolute;
    top: var(--lev-head-h);
    inset-inline: 0;
    z-index: 59;
    max-height: 50%;
    overflow-y: auto;
    padding: 0.25rem 0.5rem 0.5rem;
    background: rgba(253, 252, 244, 0.97);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
  :global(html.dark) .filter-drop {
    background: rgba(10, 9, 4, 0.97);
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  /* ---------------------------------------------------------------
     The deck.

     Centred with `inset: 0; margin: auto` rather than the
     `top/left: 50% + translate(-50%, -50%)` the old `.swiperc` used, and
     Swiper's own transform on the wrapper is gone too. That matters beyond
     tidiness: a transformed ancestor is a containing block, which is the only
     reason a card's modal had to be portalled out to <body> to stop resolving
     `position: fixed` against its own slide (LEV_CARD_CONVENTIONS §8).
     --------------------------------------------------------------- */
  .deck {
    position: absolute;
    /* 4% top, 4% bottom, 2.5% each side — the old 92%x95% box — plus whatever
       the site footer is currently reserving. The footer is `position: fixed`
       and this page fills the viewport exactly, so `--foot-pad` (which only
       applies to pages that scroll) reads 0 here and the bar was clipping the
       bottom of every card: its action row, which is the part with the
       buttons. `--foot-h` is published unconditionally for exactly this. */
    inset: 1% 1% calc(var(--foot-h, 0px) - 14px) 1%;
    margin: 0;
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    /* Don't hand the gesture to the page (or to pull-to-refresh) at the edges. */
    overscroll-behavior: contain;
    outline: none;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .deck::-webkit-scrollbar {
    display: none;
  }
  /* The deck is focusable (that is what makes the arrow keys work), so it needs
     a focus ring — but only for keyboard users; clicking a card should not
     outline the whole deck. */
  .deck:focus-visible {
    outline: 2px solid rgb(255, 0, 146);
    outline-offset: -2px;
    border-radius: 12px;
  }

  /* Phone: full bleed side to side, between the header and the footer. */
  .deck.deck-vertical {
    inset: var(--lev-head-h) 0 var(--foot-h, 0px) 0;
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: auto;
    scroll-snap-type: y mandatory;
  }

  .deck-slide {
    /* 100% of the deck's main axis — width when horizontal, height when the
       deck is a column. One card per view either way. */
    flex: 0 0 100%;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    scroll-snap-align: center;
    /* A hard fling must not skip past a card unread. */
    scroll-snap-stop: always;
  }

  .next,
  .perv {
    padding: 0;
    border: none;
    background: none;
  }
  .next img,
  .perv img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .next {
    position: absolute;
    top: calc(50% - 14px);
    left: calc(100% - 50px);
    height: 30px;
    width: 50px;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1)) brightness(1.1);
    z-index: 50;
    cursor: pointer;
  }
  .perv {
    position: absolute;
    top: calc(50% - 14px);
    right: calc(100% - 50px);
    height: 30px;
    width: 50px;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1)) brightness(1.1);
    z-index: 50;
    cursor: pointer;
  }
  .next:hover,
  .perv:hover {
    transform: translateY(-2px);
    filter: drop-shadow(0 10px 15px rgba(255, 0, 146, 0.3)) brightness(1.2);
  }
  .next:active,
  .perv:active {
    transform: scale(0.95);
  }
  @media (min-width: 528px) {
    .next {
      position: absolute;
      top: calc(50% - 35px);
      left: calc(100% - 90px);
      height: 70px;
      width: 90px;
    }
    .perv {
      position: absolute;
      top: calc(50% - 35px);
      right: calc(100% - 90px);
      height: 70px;
      width: 90px;
    }
  }
</style>
