<script>
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { RingLoader } from 'svelte-loading-spinners';

  // Language stores
  import { lang, langUs, doesLang } from '$lib/stores/lang.js';
  import { locale } from '$lib/translations';

  // New architecture imports
  import { finalSwiperArray } from '$lib/stores/levDerived';
  import { isCardsView, projectFilter } from '$lib/stores/levStores';
  import { initializeLevData, hasValidSnapshot } from '$lib/utils/levDataLoader';
  import { setupSocketListeners } from '$lib/utils/levSocketHandler';
  import { loadLevSlice } from '$lib/utils/levSliceLoader';
  import {
    sliceKeysForFocus,
    anisForFocus,
    runnableSliceKeys
  } from '$lib/utils/levSliceRegistry';
  import { dataMode } from '$lib/stores/levStores';
  import { get } from 'svelte/store';
  import {
    nowChatId,
    isChatOpen
  } from '$lib/stores/pendMisMes.js';
  import {
    fetchTimers,
    initialWebSocketForTimer,
    cleanupTimerListener
  } from '$lib/stores/timers';

  // UI Components
  import Coinsui from '$lib/components/lev/newcoinui.svelte';
  import Cardsui from '$lib/components/lev/cards/cards.svelte';
  import Tooltip from '$lib/celim/tooltip.svelte';
  import { siteSharePayablesStore, openSiteShareDecisionsStore } from '$lib/stores/levStores';
  import { executeAction } from '$lib/client/actionClient';

  // Dialog components
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { fly } from 'svelte/transition';
  import Levchat from '$lib/components/lev/levchat.svelte';
  import LevDemandPanel from '$lib/components/lev/LevDemandPanel.svelte';
  import Hevel from '$lib/components/lev/hevel.svelte';
  import Rikma from '$lib/components/lev/rikma.svelte';
  import Mesima from '$lib/components/lev/mesima.svelte';
  import { userStore } from '$lib/stores/levStores';
  /** @type {{ data: any }} */
  let { data } = $props();

  // UI State
  let loading = $state(true);
  let error = $state(null);
  let unsubscribeSocket = null;
  let timerCleanup = null;

  // Subscribe to finalSwiperArray from new architecture
  let displayItems = $state([]);

  // Subscribe to view mode
  let cards = $state(true);

  // Focused view (?focus= deep-link from hub): show only these ani values.
  // Kept as a view-level filter so the background full load can complete the
  // stores without flooding the screen with every card type.
  let focusFilter = $state(null);

  // Reactive subscriptions
  $effect(() => {
    displayItems = focusFilter
      ? $finalSwiperArray.filter((i) => focusFilter.has(i.ani))
      : $finalSwiperArray;
    cards = $isCardsView;
  });

  const focusChipText = { he: 'תצוגה ממוקדת', en: 'Focused view' };
  const showAllText = { he: 'הצג הכל', en: 'Show all' };
  const stillLoadingText = { he: 'טוען את שאר הנתונים…', en: 'Loading the rest…' };

  function clearFocus() {
    focusFilter = null;
    projectFilter.set(null);
  }

  // Dialog state
  let isOpen = $state(false);
  let mode = $state(0);
  let eizeish = $state();
  let eizep = $state();
  let eizeme = $state();

  // Tooltip state
  const defaulti = { he: 'מסך הלב', en: 'heart of 1💗1' };
  let u = $state(defaulti[$lang]);

  function close() {
    if (mode !== 4) {
      isOpen = false;
    }
  }

  function user(event) {
    isOpen = false;
    eizeish = event.id;
    mode = 1;
    isOpen = true;
  }

  function chat(payload) {
    console.log('[saleClaim][chat] page.chat received', payload);
    if (payload && payload.forumId) {
      nowChatId.set(payload.forumId);
      isChatOpen.set(true);
      console.log('[saleClaim][chat] page.chat set stores', {
        nowChatId: get(nowChatId),
        isChatOpen: get(isChatOpen)
      });
    } else {
      // Fallback for components that don't pass a payload
      isOpen = false;
      mode = 3;
      isOpen = true;
    }
  }

  function proj(event) {
    isOpen = false;
    eizep = event.id;
    mode = 2;
    isOpen = true;
  }

  function mesima(event) {
    isOpen = false;
    eizeme = event.id;
    mode = 5;
    isOpen = true;
  }

  function hover(event) {
    u = event.id;
  }

  function handleViewChange(event) {
    isCardsView.set(event.cards);
  }

  // M4 receiving side: load committed-but-unpaid site-share contributions so they
  // surface as cards in the swiper (replaces the old top-of-page banner).
  async function loadSiteSharePayables() {
    try {
      const res = await executeAction('getSiteSharePayables', {});
      if (res?.success) {
        siteSharePayablesStore.set(res.data?.payables ?? []);
      }
    } catch (e) {
      console.error('[SiteShare] load payables failed:', e);
    }
  }

  // Gate 3 (§3): open (pending) decisions whose split already auto-approved.
  // The pipeline only surfaces a card for those NOT shown as a haluka card.
  async function loadOpenSiteShareDecisions() {
    try {
      const res = await executeAction('getOpenSiteShareDecisions', {});
      if (res?.success) {
        openSiteShareDecisionsStore.set(res.data?.decisions ?? []);
      }
    } catch (e) {
      console.error('[SiteShare] load open decisions failed:', e);
    }
  }

  function handleCoinLapach(event) {
    // Remove item from display optimistically
    displayItems = displayItems.filter(
      (item) => item.coinlapach !== event.coinlapach
    );

    // The actual data update will come through socket or next refresh
  }

  onMount(async () => {
    console.log('=== LEV PAGE MOUNTED (NEW ARCHITECTURE) ===');

    // Sync language stores
    lang.set(data.lang);
    locale.set(data.lang);
    langUs.set(data.lang);
    doesLang.set(true);

    // Check authentication (uid is provided by server if session is valid)
    if (!page.data.uid) {
      goto('/login?from=lev');
      return;
    }

    // Read deep-link params set by hub chips
    const focusAni = page.url.searchParams.get('focus');
    const focusProject = page.url.searchParams.get('project');

    // Apply the focused view regardless of how the data gets loaded — the
    // whole point of the deep-link is seeing only the requested cards.
    if (focusAni) {
      const anis = anisForFocus(focusAni);
      if (anis.length > 0) {
        focusFilter = new Set(anis);
      }
      if (focusProject) {
        projectFilter.set(focusProject);
      }
    }

    // Side channels that don't depend on the lev dataset — start them right
    // away instead of after the (potentially long) data load. The timers store
    // and socket upserts populate reactively whenever they arrive.
    fetchTimers(page.data.uid, fetch).catch((e) =>
      console.warn('[lev] fetchTimers failed:', e?.message)
    );
    timerCleanup = initialWebSocketForTimer(page.data.uid, fetch);
    unsubscribeSocket = setupSocketListeners(page.data.uid, '', data.lang);
    loadSiteSharePayables();
    loadOpenSiteShareDecisions();

    // Errors of a background refresh must not blank an already-rendered page —
    // only an expired session needs action.
    const handleBackgroundError = (e) => {
      console.warn('[lev] Background full load failed:', e?.message);
      if (e instanceof Error && e.message.includes('Authentication failed')) {
        toast.error('Your session has expired. Please log in again.');
        goto('/login?from=lev');
      }
    };

    try {
      if (focusAni && get(dataMode) !== 'full') {
        // Quantum (fast) path: load only the requested slice(s), then kick off
        // the full query 83 in the background so the page becomes complete
        // quietly. Skipped when full data is already in memory (client-side
        // nav back from hub) — nothing to speed up.
        const sliceKeys = sliceKeysForFocus(focusAni).filter((k) =>
          runnableSliceKeys().includes(k)
        );

        if (sliceKeys.length > 0) {
          // Load slice(s) first — shows cards immediately with one small request
          await Promise.all(
            sliceKeys.map((key) =>
              loadLevSlice(key, page.data.uid, focusProject ? [focusProject] : null, data.lang)
            )
          );

          loading = false; // show cards right away

          // Full load in background — stores will update reactively when done
          initializeLevData(page.data.uid, '', data.lang).catch(handleBackgroundError);
        } else {
          // Focus type not yet sliceable — fall through to full load
          await initializeLevData(page.data.uid, '', data.lang);
        }
      } else if (get(dataMode) === 'full' || hasValidSnapshot()) {
        // Warm path: full data already in memory (client-side nav back) or a
        // valid localStorage snapshot exists. initializeLevData restores the
        // snapshot synchronously before its network fetch, so the page can
        // render immediately and the fresh query 83 streams in behind it.
        const refresh = initializeLevData(page.data.uid, '', data.lang);
        loading = false;
        refresh.catch(handleBackgroundError);
      } else {
        // Cold path (no snapshot, no focus): progressive first paint. Load the
        // small vote-urgent slices first — the first one to land paints the
        // page — then run the full query 83 in the background. Same pattern as
        // the hub deep-link path, just with the 'votes' group and no filter.
        const sliceKeys = sliceKeysForFocus('votes').filter((k) =>
          runnableSliceKeys().includes(k)
        );

        let anySliceLoaded = false;
        if (sliceKeys.length > 0) {
          await Promise.allSettled(
            sliceKeys.map((key) =>
              loadLevSlice(key, page.data.uid, null, data.lang).then(() => {
                anySliceLoaded = true;
                loading = false; // first slice to arrive paints the page
              })
            )
          );
        }

        if (anySliceLoaded) {
          initializeLevData(page.data.uid, '', data.lang).catch(handleBackgroundError);
        } else {
          // No runnable slices or all of them failed — original blocking load
          await initializeLevData(page.data.uid, '', data.lang);
        }
      }

      loading = false;
      console.log('✅ LEV PAGE INITIALIZED SUCCESSFULLY');
    } catch (e) {
      console.error('❌ Failed to initialize lev page:', e);
      error = e.message;

      // Handle authentication errors
      if (e instanceof Error && e.message.includes('Authentication failed')) {
        toast.error('Your session has expired. Please log in again.');
        await goto('/login?from=lev');
      } else {
        toast.error('Failed to load data. Please try again.');
      }
    }
  });

  onDestroy(() => {
    // Clean up socket listener
    if (unsubscribeSocket) {
      unsubscribeSocket();
    }
    // Clean up timer listener
    if (timerCleanup) {
      timerCleanup();
    }
    cleanupTimerListener();
    console.log('🧹 LEV PAGE CLEANUP COMPLETE');
  });

  const title = { he: 'לב 1💗1', en: 'heart of 1💗1' };
</script>

<svelte:head>
  <title>{title[$lang]}</title>
</svelte:head>

{#if loading}
  <div class="loading-container">
    <RingLoader size="60" color="#ff00ff" />
  </div>
{:else if error}
  <div class="error-container">
    <p>Error: {error}</p>
  </div>
{:else}
  <!-- Dialog Overlay -->
  <DialogOverlay class="overlay" {isOpen} onDismiss={close}>
    <div transition:fly={{ y: 450, opacity: 0.5, duration: 1000 }}>
      <DialogContent aria-label="form" class="user">
        <div
          dir="rtl"
          class="grid items-center justify-center text-center bg-gradient-to-br from-black via-slate-900 via-slate-800 via-slate-600 to-slate-400"
        >
          <button
            style="margin: 0 auto;"
            onclick={close}
            class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
            title="סגירה"
            aria-label="סגירה"
          >
            <svg
              style="width:24px;height:24px;z-index:999;"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
              />
            </svg>
          </button>
          {#if mode == 1}
            <span>
              <Hevel userId={eizeish} onProj={proj} />
            </span>
          {:else if mode == 2}
            <Rikma projectId={eizep} onUser={user} onMesima={mesima} />
          {:else if mode == 3}
            <Levchat />
          {:else if mode == 4}
            <RingLoader size="260" color="#ff00ae" unit="px" duration="2s" />
          {:else if mode == 5}
            <Mesima missionId={eizeme} onProject={proj} />
          {/if}
        </div>
      </DialogContent>
    </div>
  </DialogOverlay>

  <!-- Focused-view chip: visible while a ?focus= deep-link filter is active -->
  {#if focusFilter}
    <div class="focus-chip" dir="auto">
      <span>{focusChipText[$lang] ?? focusChipText.he}</span>
      <button type="button" onclick={clearFocus}>
        {showAllText[$lang] ?? showAllText.he}
      </button>
    </div>
  {:else if $dataMode !== 'full'}
    <!-- Progressive load in progress: urgent cards are on screen, the full
         dataset is still streaming in behind them -->
    <div class="focus-chip" dir="auto" role="status">
      <span class="loading-dot"></span>
      <span>{stillLoadingText[$lang] ?? stillLoadingText.he}</span>
    </div>
  {/if}
  
  <!-- Main Content -->
  <Tooltip title={u} ispic={true}>
    {#if cards}
      <div class="cards-ui">
        <Cardsui
          low={false}
          onHover={hover}
          onCards={handleViewChange}
          onUser={user}
          onProj={proj}
          onChat={chat}
          onStart={handleCoinLapach}
          arr1={displayItems}
          askedarr={[]}
          declineddarr={[]}
          sug={displayItems.filter((i) => i.ani === 'meData').length}
          pen={displayItems.filter((i) => i.ani === 'pends').length}
          ask={displayItems.filter((i) => i.ani === 'askedcoin').length}
          wel={displayItems.filter((i) => i.ani === 'walcomen').length}
          beta={displayItems.filter((i) => i.ani === 'mtaha').length}
          des={displayItems.filter((i) => i.ani === 'hachla').length}
          fia={displayItems.filter((i) => i.ani === 'fiapp').length}
          pmash={displayItems.filter((i) => i.ani === 'pmashes').length}
          mashs={displayItems.filter((i) => i.ani === 'huca').length}
          maap={displayItems.filter((i) => i.ani === 'wegets').length}
          askma={displayItems.filter((i) => i.ani === 'askedm').length}
          hachlot={displayItems.filter((i) => i.ani === 'hachlatot').length}
          saless={displayItems.filter((i) => i.ani === 'sale').length}
          sheirutps={displayItems.filter((i) => i.ani === 'sheirutp').length}
          purchasesn={displayItems.filter((i) => i.ani === 'buy').length}
        />
      </div>
    {:else}
      <Coinsui
        onHover={hover}
        low={false}
        milon={{
          hachla: true,
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
          sheirutp: true,
          sales: true,
          purchases: true
        }}
        onMesima={mesima}
        onUser={user}
        onProj={proj}
        onChat={chat}
        onStart={handleCoinLapach}
        onCards={handleViewChange}
        adder={[]}
        arr1={displayItems}
        askedarr={[]}
        declineddarr={[]}
        halu={displayItems.filter((i) => i.ani === 'haluk').length}
        askma={displayItems.filter((i) => i.ani === 'askedm').length}
        maap={displayItems.filter((i) => i.ani === 'wegets').length}
        mashs={displayItems.filter((i) => i.ani === 'huca').length}
        pmashd={displayItems.filter((i) => i.ani === 'pmashes').length}
        fia={displayItems.filter((i) => i.ani === 'fiapp').length}
        beta={displayItems.filter((i) => i.ani === 'mtaha').length}
        pen={displayItems.filter((i) => i.ani === 'pends').length}
        sug={displayItems.filter((i) => i.ani === 'meData').length}
        wel={displayItems.filter((i) => i.ani === 'walcomen').length}
        ask={displayItems.filter((i) => i.ani === 'askedcoin').length}
        saless={displayItems.filter((i) => i.ani === 'sale').length}
        sheirutps={displayItems.filter((i) => i.ani === 'sheirutp').length}
        purchasesn={displayItems.filter((i) => i.ani === 'buy').length}
        nam={$userStore?.username || page.data.username}
        picLink={$userStore?.profilePic || ''}
        total={''}
      />
    {/if}
  </Tooltip>

  <!-- The maagad's discovery map, one tap away from the heart
       (PLAN_HUB_LEV_DEMAND_SYNC) -->
  <LevDemandPanel />
{/if}

<style>
  .focus-chip {
    position: fixed;
    /* Below the cards/coins switch, which owns top:1rem center (z-[1000]) */
    top: 4.5rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 40;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0.9rem;
    border-radius: 9999px;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(179, 135, 40, 0.6);
    color: #fff;
    font-size: 0.75rem;
    backdrop-filter: blur(6px);
  }
  .loading-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 9999px;
    background: #ff00ae;
    animation: loading-dot-pulse 1.2s ease-in-out infinite;
  }

  @keyframes loading-dot-pulse {
    0%,
    100% {
      opacity: 0.35;
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
  }

  .focus-chip button {
    border: none;
    border-radius: 9999px;
    padding: 0.15rem 0.6rem;
    background: rgba(179, 135, 40, 0.85);
    color: #fff;
    font-size: 0.7rem;
    font-weight: 600;
    cursor: pointer;
  }

  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }

  .error-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    color: red;
  }

  :global([data-svelte-dialog-content].user) {
    width: 90vw;
    z-index: 1000;
    padding: 0px;
    margin-top: 10px;
    margin-bottom: 10px;
  }

  :global([data-svelte-dialog-overlay].overlay) {
    z-index: 1000;
  }

  @media (min-width: 568px) {
    :global([data-svelte-dialog-content].user) {
      width: 80vw;
      margin-top: 10px;
      margin-bottom: 10px;
      z-index: 1000;
    }

    :global([data-svelte-dialog-overlay].overlay) {
      z-index: 1000;
      height: 100vh;
    }
  }

  .cards-ui {
    max-height: 100vh;
    max-width: 100vw;
    overflow: hidden;
  }
</style>
