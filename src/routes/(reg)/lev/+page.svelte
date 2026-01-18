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
  import { isCardsView } from '$lib/stores/levStores';
  import { initializeLevData } from '$lib/utils/levDataLoader';
  import { setupSocketListeners } from '$lib/utils/levSocketHandler';
  import {
    fetchTimers,
    initialWebSocketForTimer,
    cleanupTimerListener
  } from '$lib/stores/timers';

  // UI Components
  import Coinsui from '$lib/components/lev/newcoinui.svelte';
  import Cardsui from '$lib/components/lev/cards/cards.svelte';
  import Tooltip from '$lib/celim/tooltip.svelte';

  // Dialog components
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { fly } from 'svelte/transition';
  import Levchat from '$lib/components/lev/levchat.svelte';
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

  // Reactive subscriptions
  $effect(() => {
    displayItems = $finalSwiperArray;
    cards = $isCardsView;
  });

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

  function chat(event) {
    isOpen = false;
    mode = 3;
    isOpen = true;
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

    try {
      // Initialize data using new architecture (token is now handled by server cookies)
      await initializeLevData(page.data.uid, '', data.lang);

      // Fetch timers to populate timers store (needed for missionInProgress)
      await fetchTimers(page.data.uid, fetch);

      // Initialize WebSocket for timer updates (uses the new socketClient-based approach)
      timerCleanup = initialWebSocketForTimer(page.data.uid, '', fetch);

      // Setup socket listeners using new architecture
      unsubscribeSocket = setupSocketListeners(page.data.uid, '', data.lang);

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
          askmap: true
        }}
        onMesima={mesima}
        onUser={user}
        onProj={proj}
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
        nam={$userStore?.username || page.data.username}
        picLink={$userStore?.profilePic || ''}
        total={''}
      />
    {/if}
  </Tooltip>
{/if}

<style>
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
