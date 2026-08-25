<script>
  /**
   * The heart's coin field.
   *
   * Two things live here and nothing else: **where the coins go** and **what
   * happens when you touch one**. Everything else was moved out —
   *
   * - placement and urgency ordering are `coins/coinLayout.ts`, a pure module
   *   with its own tests (§Stage 1 of docs/PLAN_LEV_COINS.md);
   * - a coin's face is `coins/LevCoin.svelte`, driven entirely by `cardKinds`
   *   metadata, so it is uniform across all 23 kinds the heart can render;
   * - the expanded card is `LevSheet.svelte`, the same one the list view uses.
   *
   * What used to be here was a 15-branch `{#each}` in which every coin mounted
   * the **whole card component** for its kind in coin mode — a Swiper 8
   * instance with EffectFlip, a 2.2s fly-in and its own modal, per coin, out of
   * files 2400–3300 lines long. Measured on the owner's own heart: 137 coins,
   * 129 Swipers, 31,540 DOM nodes, ~13s to a usable paint. It also meant a kind
   * without a hand-written branch had *no coin at all*, which is how every
   * money and consent flow added in the last year — sales, site-share,
   * stipends, wish offers — became invisible to anyone who preferred coins.
   * That was not cosmetic; it was missed consent.
   *
   * The rule that keeps it from rotting again: **a new heart kind is added to
   * `cardKinds.js` and to `LevCard`, and that is all.** Nothing in this file
   * knows any kind's name.
   */
  import { rankCoins, placeIndex, fieldExtent } from './coins/coinLayout.js';
  import { isCardVisible, kindAccent } from './cards/cardKinds.js';
  import LevCoin from './coins/LevCoin.svelte';
  import LevSheet from './LevSheet.svelte';
  import Mid from './midi.svelte';
  import Filter from './cards/filter.svelte';
  import FilterIcon from '$lib/celim/icons/filterIcon.svelte';
  import { flip } from 'svelte/animate';
  import { onDestroy, onMount, untrack } from 'svelte';
  import { t } from '$lib/translations';
  import { coinSize, coinSkin } from '$lib/stores/levStores';
  import { RIM_GILT } from './coins/coinSkin.js';
  import { confettiStore } from '$lib/stores/confettiStore';
  import { deckPosition, rememberCard } from './cards/deckPosition.svelte.js';
  import { isMobileOrTablet } from '$lib/utilities/device';

  /** Viewport (the scroll container). */
  let ow = $state(500);
  let oh = $state(500);

  /**
   * Coin diameter, in px, per step of the member's own size control.
   *
   * The floor is not taste: the old coins dropped to 75px on a phone with 8–10px
   * of text inside, which is under both the WCAG 2.5.8 target-size minimum and
   * anything an older member will read — the complaint this view was shelved
   * over. `LevCoin` scales its type with the diameter, so the L step is a
   * larger *word*, not just a larger circle.
   */
  const SIZES = { s: 96, m: 124, l: 160 };
  /** The three steps, in order, for the control in the field's chrome. */
  const SIZE_STEPS = /** @type {const} */ (['s', 'm', 'l']);
  /**
   * Phones get the same three steps, scaled to a screen a thumb has to reach
   * across. Not smaller than this: at 0.84 the middle step is 104px, which is
   * where `LevCoin`'s type still clears 12px — go lower and the title lands on
   * the same 8–10px that got this view shelved.
   */
  const NARROW_FACTOR = 0.84;

  let size = $derived(
    Math.round(
      (SIZES[$coinSize] ?? SIZES.m) * (ow > 550 ? 1 : NARROW_FACTOR)
    )
  );

  /**
   * The heart in the middle is roughly this wide, and the field keeps a hole
   * that size clear for it.
   */
  let heartRadius = $derived(ow > 550 ? 225 : 165);

  let layoutOptions = $derived({ size, centerHole: heartRadius });

  /** The scroll container. */
  let screenEl = $state();

  /**
   * Put a point of the field — measured from its centre, the way a placement
   * is — in the middle of the viewport.
   *
   * **`'instant'`, not `'auto'`, for anything the member did not ask for.**
   * `behavior: 'auto'` means "defer to CSS", and `.coin-container` sets
   * `scroll-behavior: smooth` — so every automatic re-centre started a ~700px
   * animation, and the next one (the field grows as the feed streams in)
   * restarted it from wherever it had crawled to. Measured: the scroll sat at
   * (0, 0) and then (271, 576) against a centre of (324, 719) — an animation
   * caught in flight, not a field that had been centred. The ⌘ button still
   * asks for `'smooth'`, because there the movement is the point.
   *
   * @param {number} x
   * @param {number} y
   * @param {ScrollBehavior} behavior
   */
  function centerOn(x, y, behavior = 'smooth') {
    if (!screenEl) return;
    screenEl.scrollTo({
      left: Math.max(0, w / 2 + x - screenEl.clientWidth / 2),
      top: Math.max(0, h / 2 + y - screenEl.clientHeight / 2),
      behavior
    });
  }

  /**
   * Put the heart in the middle of the viewport.
   *
   * @param {ScrollBehavior} behavior
   */
  function centerView(behavior = 'smooth') {
    centerOn(0, 0, behavior);
  }

  /**
   * Open on the heart, once.
   *
   * This used to be a `setTimeout(…, 300)` fired from `onMount`, and it was
   * simply losing the race: the field's size is derived from the coins, the
   * coins arrive with the data, and 300ms after mount the container was still
   * the wrong size — so the "centring" scrolled to the middle of a field that
   * no longer existed and the member landed in an empty corner. Measured on a
   * real heart: scroll (143, 216) where the centre was (598, 965).
   *
   * Waiting for the size to actually settle removes the race — and settling is
   * not one frame. The coins do not all arrive at once (the page loads the
   * urgent kinds first and streams the rest in behind them), so the field keeps
   * growing, and a single centring aims at a size that is about to change:
   * measured again on the same heart, it left the scroll at (271, 576) where
   * the centre had become (324, 691). So this re-aims on **every size change**
   * and stops the moment the member moves the field themselves. Neither flag is
   * `$state` on purpose — they must not re-trigger this effect.
   */
  let userMoved = false;
  $effect(() => {
    const ready = screenEl && w > 0 && h > 0;
    if (!ready || userMoved) return;
    // Arriving from another view, land on the item the member was on rather
    // than on the heart — `deckPosition` is the heart's shared "where I was",
    // not the deck's private one. Nothing remembered, or that item has since
    // left the feed: the heart, as before. Read untracked: `placed` is rebuilt
    // on every feed tick, and this must follow the field's *size*, not its data.
    const seat = untrack(() => {
      const wanted = deckPosition.id;
      return wanted ? placed.find((q) => q.id === wanted) : null;
    });
    // After the browser has laid the field out at its new size.
    requestAnimationFrame(() =>
      seat ? centerOn(seat.x, seat.y, 'instant') : centerView('instant')
    );
  });

  /** Any deliberate move of the field hands the scroll back to the member. */
  function takeOver() {
    userMoved = true;
  }

  /** @param {string} id */
  function openCoin(id) {
    rememberCard(id);
    openId = id;
  }

  function user(event) {
    onUser?.({ id: event.id });
  }

  function hover(event) {
    onHover?.({ id: event.id });
  }

  function chat(payload) {
    // Forward a card's chat request (e.g. saleClaim → { forumId }) to the page,
    // which opens the shared chat drawer.
    onChat?.(payload);
  }

  function proj(event) {
    onProj?.({ id: event.id });
  }

  /**
   * The filter belongs to the page, not to this view.
   *
   * These two used to mutate a `$bindable` `milon` **literal** that the page
   * passed in with every key hard-coded `true` — so the coin field had a filter
   * map of its own that no other view could see, could not be pre-set from a
   * deep link, and reset itself every time you switched away and back. They now
   * forward to the same `milon` store the deck and the list drive, which is
   * what makes one filter mean one thing across the three views.
   *
   * Both the strip's tiles and the centre's diamonds arrive here.
   */
  function showonly(event) {
    filterKind = false;
    filterProjects = false;
    onShowonly?.(event);
  }

  function showall() {
    filterKind = false;
    filterProjects = false;
    onShowall?.();
  }

  /** Which filter strip, if any, is open over the field. */
  let filterKind = $state(false);
  let filterProjects = $state(false);
  /**
   * @typedef {Object} Props
   * @property {any} [adder]
   * @property {any} [arr1]
   * @property {any} [askedarr]
   * @property {any} [declineddarr]
   * @property {number} [halu]
   * @property {number} [askma]
   * @property {number} [maap]
   * @property {number} [mashs]
   * @property {number} [pmashd]
   * @property {number} [fia]
   * @property {number} [beta]
   * @property {number} [pen]
   * @property {number} [sug]
   * @property {number} [saless]
   * @property {number} [sheirutps]
   * @property {number} [purchasesn]
   * @property {boolean} [low]
   * @property {any} nam
   * @property {number} [wel]
   * @property {number} [ask]
   * @property {any} picLink
   * @property {any} total
   * @property {any} [milon] - the shared card-type visibility map (`$milon`)
   * @property {any[]} [uniqueProjects] - projects present in the feed, for the project filter
   * @property {Record<string, number>} [counts] - per-milon-key counts for the filter panel
   * @property {(payload: { data: any, kind?: string, id?: any }) => void} [onShowonly] - filter panel selection
   * @property {() => void} [onShowall] - clear filters
   * @property {boolean} [sml]
   * @property {(payload: { cards: boolean, ani: any }) => void} [onStart] - Callback for 'start' event
   * @property {(payload: { id: any }) => void} [onUser] - Callback for 'user' event
   * @property {(payload: { id: any }) => void} [onMesima] - Callback for 'mesima' event
   * @property {(payload: { id: any }) => void} [onHover] - Callback for 'hover' event
   * @property {(view: 'list' | 'cards' | 'coins') => void} [onView] - the heart's three-way view switch
   * @property {(payload: { id: any }) => void} [onProj] - Callback for 'proj' event
   * @property {(payload: any) => void} [onChat] - Callback for 'chat' event
   */

  /** @type {Props} */
  let {
    onStart,
    onUser,
    onHover,
    onView,
    onProj,
    onChat,
    arr1 = $bindable([]),
    askedarr = [],
    declineddarr = [],
    halu = 17,
    askma = 17,
    maap = 13,
    mashs = 13,
    pmashd = 13,
    fia = 13,
    beta = 13,
    pen = 17,
    sug = 17,
    low = false,
    nam,
    wel = 13,
    ask = 13,
    picLink,
    total,
    milon = {},
    uniqueProjects = [],
    counts = {},
    onShowonly,
    onShowall,
    sml = false
  } = $props();

  /**
   * What the field is actually holding, in three steps.
   *
   * **De-duplicated**, because the deck already does and this view never did: a
   * double-delivered socket update used to paint the same coin twice, and with
   * a *keyed* `{#each}` a repeated `coinlapach` is no longer a cosmetic bug but
   * a crash.
   *
   * **Gated through `isCardVisible`**, the same predicate the deck and the list
   * use, instead of the per-branch `milon.x == true` the old markup carried.
   * That mismatch was real: the coin view gated `vidu` on `milon.desi` while
   * `LevCard` gates it on `milon.vidu`, so one filter chip hid different things
   * in different views.
   */
  let visible = $derived.by(() => {
    const seen = new Set();
    const out = [];
    for (const item of arr1) {
      const id = String(item?.coinlapach ?? '');
      if (!id || seen.has(id)) continue;
      if (!isCardVisible(item, milon)) continue;
      seen.add(id);
      out.push(item);
    }
    return out;
  });

  /**
   * Seating, then placing — deliberately two steps.
   *
   * **The seating must not depend on anything a card can write back.** Ranking
   * reads `already` and `pl` off each item, and the full cards write to exactly
   * those through `bind:already` / `bind:noofusersOk` as they initialise.
   * Deriving the seats straight off `arr1` therefore closes a loop: child
   * writes a bound prop → the ranking invalidates → the keyed `{#each}`
   * re-renders → the child initialises again → it writes again. On a heart with
   * 137 coins that pegs the main thread and the page never finishes loading —
   * which is exactly what it did the first time this was wired up. The old ring
   * loop was accidentally immune: it only ever read `arr1.length`.
   *
   * The coins themselves no longer bind to anything, but the open `LevSheet`
   * still does, so the hazard is real and the guard stays.
   *
   * So: `seating` is the **order of ids**, recomputed only when the *set* of ids
   * changes (`idsSig`), with the ranking itself run inside `untrack` so none of
   * those mutable fields become dependencies.
   *
   * `placed` then maps the **current** items onto those seats every time the
   * feed changes. That keeps the data fresh — a member who just voted sees the
   * new count — while the seat itself is stable. Memoising the whole placement
   * would have pinned each coin to a stale copy of its item.
   */
  let idsSig = $derived(visible.map((b) => b?.coinlapach).join('|'));
  let seating = $derived.by(() => {
    idsSig;
    layoutOptions;
    return untrack(
      () =>
        new Map(
          rankCoins(visible).map((b, index) => [String(b?.coinlapach), index])
        )
    );
  });

  let placed = $derived.by(() =>
    visible
      .map((item) => {
        const id = String(item?.coinlapach);
        const index = seating.get(id) ?? seating.size;
        return { item, id, index, ...placeIndex(index, layoutOptions) };
      })
      // Render in seat order, so the DOM order matches the field's own
      // reading order (nearest the heart first) for tab and screen-reader.
      .sort((a, b) => a.index - b.index)
  );

  /** The field is square and centred; every placement is relative to its middle. */
  let field = $derived(fieldExtent(placed.length, layoutOptions));
  let w = $derived(field.width);
  let h = $derived(field.height);

  /**
   * The absolute box for one placement: the field's centre, plus the coin's
   * offset, minus half a coin — placements are centres, CSS wants corners.
   * @param {{ x: number, y: number }} p
   */
  function slotStyle(p) {
    const left = w / 2 + p.x - size / 2;
    const top = h / 2 + p.y - size / 2;
    return `width:${size}px; height:${size}px; left:${left}px; top:${top}px`;
  }

  /**
   * A coin only changes seat when one nearer the heart is resolved and leaves,
   * so the whole field slides inward by one. `animate:flip` turns that jump
   * into a movement the eye can follow — on `transform`, so it composites
   * instead of re-laying out.
   *
   * Seeded synchronously (not in `onMount`) so the very first re-rank already
   * respects the preference, and kept live because someone can change it while
   * the heart is open.
   */
  let reduceMotion = $state(
    typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
  let flipMs = $derived(reduceMotion ? 0 : 420);

  // ── opening a coin ────────────────────────────────────────────────────────
  // Exactly one heavy card is mounted for the whole field, and it is tracked by
  // id rather than by object: the feed hands out a fresh array on every socket
  // message, so holding the item itself would pin a stale copy. Looking it up
  // each time also means the sheet closes by itself if the item leaves.
  let openId = $state(null);
  let openItem = $derived(
    openId === null
      ? null
      : (visible.find((b) => String(b?.coinlapach) === openId) ?? null)
  );

  // ── the pop ───────────────────────────────────────────────────────────────
  /**
   * A coin bursts when it is **decided — approved or rejected — and therefore
   * stops being shown**. What is celebrated is the circle closing, not the
   * direction it closed in; the consent model has no absolute "no" to mourn,
   * and countering is as much an answer as agreeing.
   *
   * It fires from one place only — a card reporting itself finished — so it can
   * never go off for a coin that merely disappeared: a filter change, a project
   * filter, a refetch that dropped it, or a view switch. That is what keeps the
   * signal meaning something.
   */
  let bursts = $state([]);
  let burstSeq = 0;
  const burstTimers = new Set();

  const BURST_MS = 700;
  const FADE_MS = 240;

  function burstAt(p) {
    const key = ++burstSeq;
    const ms = reduceMotion ? FADE_MS : BURST_MS;
    bursts = [
      ...bursts,
      {
        key,
        left: w / 2 + p.x - size / 2,
        top: h / 2 + p.y - size / 2,
        accent: kindAccent(p.item?.ani)
      }
    ];
    // One burst at a time: `confettiStore` is a single global flag with an 11s
    // reset, so re-triggering while it is already up would cut the running
    // animation short instead of adding to it. Under reduced motion the coin
    // fades out and nothing else happens.
    if (!reduceMotion && !$confettiStore) confettiStore.trigger();
    const timer = setTimeout(() => {
      burstTimers.delete(timer);
      bursts = bursts.filter((b) => b.key !== key);
    }, ms);
    burstTimers.add(timer);
  }

  /**
   * The card said it is done with itself. Close the sheet, pop the coin where
   * it stood, and tell the page — which drops it from the feed, at which point
   * the field closes ranks behind it (the `animate:flip` above).
   *
   * This replaces `delo()`, which spliced the `$bindable` `arr1` in place and
   * reassigned it — mutating the page's own array behind the store's back.
   */
  function cardFinished(payload) {
    const id = String(payload?.coinlapach ?? openId ?? '');
    const p = placed.find((q) => q.id === id);
    openId = null;
    if (p) burstAt(p);
    onStart?.(payload);
  }

  onDestroy(() => {
    for (const timer of burstTimers) clearTimeout(timer);
    burstTimers.clear();
  });

  onMount(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => (reduceMotion = motion.matches);
    motion.addEventListener('change', sync);
    sync();
    return () => motion.removeEventListener('change', sync);
  });

  onMount(() => {
    // האזנה לשינויי גודל החלון — with the teardown it never had. Every mount
    // used to leave a live listener behind. It only re-centres now: `ow`/`oh`
    // are `bind:clientWidth/clientHeight`, so the sizes follow the viewport by
    // themselves, and the field follows the sizes.
    const onResize = () => centerView('instant');
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });
</script>

<div
  id="screen"
  bind:this={screenEl}
  bind:clientWidth={ow}
  bind:clientHeight={oh}
  onwheel={takeOver}
  onpointerdown={takeOver}
  ontouchstart={takeOver}
  dir="ltr"
  style="position:fixed; width:100vw; height:100dvh; overflow: auto; top:0; left:0;
            max-width: 100vw; max-height:{isMobileOrTablet()
    ? 'calc(100dvh - 3rem)'
    : '100dvh'};"
  class="coin-container d"
>
  <!-- The same filter panel the deck and the list use, over the field.
       The coin view used to have its own: fourteen `if/else` branches inside
       `midi.svelte` driving a local map, with no project filter and no way to
       show two kinds at once. One panel, one store, three views. -->
  {#if filterKind || filterProjects}
    <div class="filter-strip">
      {#if filterKind}
        <Filter
          filterKind="kind"
          edgeToEdge
          onShowonly={showonly}
          onShowall={showall}
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
      {:else}
        <Filter
          filterKind="projects"
          allIds={uniqueProjects}
          edgeToEdge
          onShowonly={showonly}
          onShowall={showall}
        />
      {/if}
    </div>
  {/if}

  <!-- כפתורי שליטה -->
  <div class="control-buttons">
    <button
      type="button"
      class="control-button"
      aria-label={$t('lev.cards.nav.filter')}
      title={$t('lev.cards.nav.filter')}
      aria-pressed={filterKind}
      onclick={() =>
        filterKind ? showall() : ((filterProjects = false), (filterKind = true))}
    >
      <FilterIcon filterType="cardType" isX={filterKind} />
    </button>

    {#if uniqueProjects.length >= 2}
      <button
        type="button"
        class="control-button"
        aria-label={$t('lev.cards.nav.filter')}
        title={$t('lev.cards.nav.filter')}
        aria-pressed={filterProjects}
        onclick={() =>
          filterProjects
            ? showall()
            : ((filterKind = false), (filterProjects = true))}
      >
        <FilterIcon isX={filterProjects} />
      </button>
    {/if}

    <!-- The member's own coin size, remembered. The concrete answer to
         "אנשים מבוגרים שמתקשים": three dots, no words to translate wrong, and
         a label for anyone who cannot see them. -->
    <div class="size-control" role="group" aria-label={$t('lev.coins.size.label')}>
      {#each SIZE_STEPS as step}
        <button
          type="button"
          class="size-step"
          class:on={$coinSize === step}
          aria-pressed={$coinSize === step}
          aria-label={$t(`lev.coins.size.${step}`)}
          title={$t(`lev.coins.size.${step}`)}
          onclick={() => coinSize.set(step)}
        >
          <span class="dot dot-{step}" aria-hidden="true"></span>
        </button>
      {/each}
    </div>

    <!-- The face the coins wear, remembered per browser. Two states, so a
         toggle rather than a row of steps: the button shows the skin you would
         switch *to*. -->
    <button
      type="button"
      class="control-button skin-button"
      class:on={$coinSkin === 'classic'}
      aria-pressed={$coinSkin === 'classic'}
      aria-label={$t('lev.coins.skin.label')}
      title={$t(`lev.coins.skin.${$coinSkin === 'classic' ? 'plate' : 'classic'}`)}
      onclick={() => coinSkin.set($coinSkin === 'classic' ? 'plate' : 'classic')}
    >
      <span class="skin-dot" aria-hidden="true"></span>
    </button>

    <button
      class="control-button center-button"
      onclick={() => centerView()}
      aria-label={$t('lev.coins.center')}
      title={$t('lev.coins.center')}
    >
      <span aria-hidden="true">⌘</span>
    </button>

    <!-- The "פיזור מחדש" button that used to sit here recomputed the
         positions. Placement is deterministic now — recomputing produces the
         identical field — so the button had nothing left to do. Stage 6 of
         docs/PLAN_LEV_COINS.md puts the zoom controls in its place. -->
  </div>

  <!-- One gilt gradient for the whole field. The original coins defined one
       *per coin* — part of why 137 of them cost 31,540 DOM nodes — and an SVG
       paint server resolves document-wide, so a single hidden <defs> serves
       every coin's rim lettering. -->
  <svg class="coin-defs" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="lev-coin-gilt" x1="0" y1="0" x2="0" y2="1">
        {#each RIM_GILT as stop, i}
          <stop offset={i / (RIM_GILT.length - 1)} stop-color={stop} />
        {/each}
      </linearGradient>
    </defs>
  </svg>

  <div
    id="content-area"
    dir="ltr"
    style="position: relative; width: {w}px; height: {h}px;"
    class="screen d"
  >
    {#each placed as p (p.id)}
      <div class="normSml" style={slotStyle(p)} animate:flip={{ duration: flipMs }}>
        <LevCoin item={p.item} {size} onOpen={() => openCoin(p.id)} />
      </div>
    {/each}

    {#each bursts as b (b.key)}
      <span
        class="burst"
        class:still={reduceMotion}
        style="left:{b.left}px; top:{b.top}px; width:{size}px; height:{size}px; --accent:{b.accent}"
        aria-hidden="true"
      ></span>
    {/each}

    <div class="midCom">
      <Mid
        {sml}
        {onView}
        {milon}
        onHover={hover}
        onShowall={showall}
        onShowonly={showonly}
        {total}
        {picLink}
        {ask}
        {wel}
        name={nam}
        {low}
        {sug}
        {pen}
        {beta}
        {fia}
        pmash={pmashd}
        {mashs}
        {maap}
        {askma}
        des={halu}
      />
    </div>
  </div>
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
    onHover={hover}
    onProj={proj}
    onUser={user}
    onChat={chat}
  />
{/if}

<style>
  .coin-container {
    background-color: #000000;
    background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);
    overflow: auto;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    padding: 0;
  }

  .screen {
    background-color: #000000;
    background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);
    margin: 0 auto;
    transform-origin: center center;
  }

  .midCom {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
  }

  .midCom:hover {
    z-index: 444;
  }

  .normSml {
    position: absolute;
    border-radius: 50%;
    /* Placed by `left`/`top` from `slotStyle()`. Moving the whole field onto a
       single composited transform, so panning and zooming cost one layer
       instead of n repositioned elements, is Stage 6 of
       docs/PLAN_LEV_COINS.md. */
  }

  /* The pop: the coin's ghost, left behind for as long as the animation runs.
     A ghost rather than the coin itself because the item is already gone from
     the feed by then — that is what "decided" means. */
  .burst {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    z-index: 20;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--accent) 70%, transparent) 0%,
      transparent 70%
    );
    box-shadow: 0 0 0 3px var(--accent);
    animation: coin-burst 700ms ease-out forwards;
  }
  /* Reduced motion gets the fade and nothing else — no scale, no confetti. */
  .burst.still {
    animation: coin-fade 240ms linear forwards;
  }

  @keyframes coin-burst {
    0% {
      opacity: 0.95;
      transform: scale(1);
    }
    60% {
      opacity: 0.5;
      transform: scale(1.7);
    }
    100% {
      opacity: 0;
      transform: scale(2.1);
    }
  }

  @keyframes coin-fade {
    from {
      opacity: 0.8;
    }
    to {
      opacity: 0;
    }
  }

  /* Over the field, not inside it: the field is a scroll container the size of
     the whole heart, so a strip placed in it would scroll away from the member
     who opened it. */
  .filter-strip {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1001;
    padding: 0.4rem 0.5rem 0.5rem;
    background: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  }

  .control-buttons {
    position: fixed;
    /* Clear of the page's own bottom-right furniture — the demand map's chip
       (`.map-fab`) and the accessibility button both anchor there, and the ⌘
       button used to sit on top of them. Measured on a real heart: the chip's
       top edge is 109px off the bottom, so this stack starts above it. */
    bottom: 7.5rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    z-index: 999;
  }

  .control-button {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: white;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }

  .control-button:hover {
    background-color: rgba(255, 255, 255, 0.25);
    transform: scale(1.1);
  }

  .control-button:active {
    transform: scale(0.95);
  }

  /* Not `display: none` — Chrome and Safari stop resolving `url(#…)` paint
     servers that live inside a hidden subtree. Present, laid out, zero size. */
  .coin-defs {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
  }

  /* The skin toggle: the little coin on the button wears the *other* face, so
     it shows what you would switch to rather than what you have. */
  .skin-dot {
    display: block;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    background: #fdfcf4;
    border: 2px solid rgba(255, 255, 255, 0.75);
    box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.15);
  }
  .skin-button.on .skin-dot {
    background: radial-gradient(circle at 30% 30%, #fbec9b, #bd8328 60%, #6b4a14);
    border-color: #f6e9a0;
    box-shadow: none;
  }

  .size-control {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.35rem 0.25rem;
    border-radius: 9999px;
    background-color: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }

  /* 44px of target for a 12px dot — WCAG 2.5.8, and the reason this control
     exists at all is members who cannot hit small things. */
  .size-step {
    width: 2.4rem;
    height: 2.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    background: transparent;
    border: 0;
  }
  .size-step:hover,
  .size-step:focus-visible {
    background-color: rgba(255, 255, 255, 0.18);
  }
  .size-step.on {
    background-color: rgba(255, 255, 255, 0.35);
  }

  .dot {
    display: block;
    border-radius: 50%;
    background: #fff;
    opacity: 0.8;
  }
  .size-step.on .dot {
    opacity: 1;
  }
  .dot-s {
    width: 0.5rem;
    height: 0.5rem;
  }
  .dot-m {
    width: 0.8rem;
    height: 0.8rem;
  }
  .dot-l {
    width: 1.1rem;
    height: 1.1rem;
  }
</style>
