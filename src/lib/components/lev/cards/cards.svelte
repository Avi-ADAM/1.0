<script>
  import { isRtl, t } from '$lib/translations';
  import { page } from '$app/state';
  import Lowding from '$lib/celim/lowding.svelte';
  import { lang } from '$lib/stores/lang.js';
  // Every per-kind card now lives behind <LevCard>, so the swiper markup is a
  // single slide template instead of a 25-branch chain.
  import LevCard from './LevCard.svelte';
  import { isCardVisible } from './cardKinds.js';
  //import { fly } from 'svelte/transition';
  import { onMount } from 'svelte';
  import Header from './../../header/header.svelte';
  import { Swiper, SwiperSlide } from 'swiper/svelte';
  // Svelte 5: Define callback props instead of using createEventDispatcher
  let {
    onCards,
    onStart,
    onUser,
    onHover,
    onProj,
    onChat,
    low = false,
    cards = true,
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
  // Import Swiper styles
  import 'swiper/css';
  import 'swiper/css/navigation';

  import 'swiper/css/effect-fade';
  import 'swiper/css/keyboard';
  import 'swiper/css/mousewheel';
  import './stylec.css';
  let currentIndex = $state(0);
  let swiperInstance;

  // הוסף פונקציה לטיפול באירוע swiper
  function handleSwiper(e) {
    console.log('swiper event', e);
    const [swiper] = e.detail;
    swiperInstance = swiper;
    swiperRef = swiper;
    swiper.on('slideChange', () => {
      currentIndex = swiper.realIndex;
    });
  }

  // import required modules
  import {
    Manipulation,
    Mousewheel,
    Keyboard,
    EffectFade,
    Navigation
  } from 'swiper'; //, Virtual
  import Switch from './../../../celim/switch.svelte';
  import DecisionMaking from '../decisionMaking.svelte';
  import Filter from './filter.svelte';
  import FilterIcon from '$lib/celim/icons/filterIcon.svelte';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import Button from '$lib/celim/ui/button.svelte';
  import { goto } from '$app/navigation';
  let h = $state();

  let swiperRef = null;

  $effect(() => {
    if (swiperRef && indexi != -1) {
      swiperRef.slideTo(indexi);
      indexi = -1;
    }
  });
  function change() {
    console.log(cards, 'change');
    console.log('will change');
    onCards?.({ cards: false });
  }
  let slideIndex;
  $effect(() => {
    if (swiperRef) {
      // re-run when filteredArr changes
      filteredArr;
      swiperRef.update();
    }
  });
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
  // without changing `swiperKey` — Swiper kept a stale slide list until the
  // next unrelated rebuild. Gating here fixes that and keeps the swiper and the
  // list view agreeing on what "shown" means.
  let visibleArr = $derived(filteredArr.filter((b) => isCardVisible(b, milon)));

  // Stable identity signature for the Swiper #key. arr1/filteredArr get a NEW
  // array reference whenever a timer ticks or toggles (processedMtaha re-emits on
  // the timers store), which would otherwise tear down & rebuild the Swiper and
  // snap it back to slide 0. Keying on the *set of cards* (+ active project filter)
  // means the Swiper only rebuilds when cards are added/removed/reordered or the
  // filter changes — not when a card's live timer updates.
  let swiperKey = $derived(
    (currentProjectIdFilter ?? 'all') +
      '|' +
      visibleArr.map((b) => b.coinlapach).join(',')
  );
  $effect(() => {
    console.log(swiperRef, 'swiperREF');
    if (!isScrolable.value) {
      if (swiperRef && !swiperRef.destroyed) {
        swiperRef.allowTouchMove = false;
        swiperRef.allowSlideNext = false;
        swiperRef.allowSlidePrev = false;
        swiperRef.mousewheel?.disable();
        swiperRef.disable();
        swiperRef.update();
      }
    } else {
      if (swiperRef && !swiperRef.destroyed) {
        swiperRef.enable();
        swiperRef.allowTouchMove = true;
        swiperRef.allowSlideNext = true;
        swiperRef.allowSlidePrev = true;
        swiperRef.mousewheel?.enable();
        swiperRef.update();
      }
    }
  });
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
  import { isScrolable } from './isScrolable.svelte.js';
  $effect(() => {
    console.log(isScrolable.value, 'isScrolable');
  });
</script>

{#if arr1.length > 0}
  <div
    dir={$isRtl ? 'rtl' : 'ltr'}
    bind:clientWidth={h}
    class="body box-border h-screen"
  >
    {#if !isMobileOrTablet()}
      <img
        onmouseenter={() => hoverc($t('lev.cards.nav.next'))}
        onmouseleave={() => hoverc('0')}
        class={$isRtl ? 'perv' : 'next'}
        src={$t('lev.cards.nav.nextImage')}
        alt={$t('lev.cards.nav.back')}
      />
      <img
        onmouseenter={() => hoverc($t('lev.cards.nav.prev'))}
        onmouseleave={() => hoverc('0')}
        class={$isRtl ? 'next' : 'perv'}
        class:hidden={currentIndex == 0}
        src={$t('lev.cards.nav.prevImage')}
        alt={$t('lev.cards.nav.forward')}
      />
      <div
        dir="ltr"
        role="contentinfo"
        onmouseenter={() => hoverc('שינוי התצוגה מקלפים למטבעות')}
        onmouseleave={() => hoverc('0')}
        style:visibility={low == true ? 'hidden' : 'visible'}
        class="bg z-[1000] p-1 bg-white/70 backdrop-blur-md rounded-full shadow-md"
      >
        <Switch
          bind:value={cards}
          onChange={() => change()}
          design="multi"
          options={[true, false]}
        />
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
      <div
        class="fixed z-50 max-w-[95%] h-8 sm:max-w-lg -translate-x-1/2 bg-white border border-gray-200 rounded-full bottom-12 left-1/2 dark:bg-gray-700 dark:border-gray-600"
      >
        <div
          class=" h-full max-w-lg flex space-x-2 flex-row mx-auto justify-center align-middle items-center"
        >
          {#if !filter}
            <div
              dir="ltr"
              role="contentinfo"
              onmouseenter={() => hoverc('שינוי התצוגה מקלפים למטבעות')}
              onmouseleave={() => hoverc('0')}
              style:visibility={low == true ? 'hidden' : 'visible'}
              class="px-4 z-[1000]"
            >
              <Switch
                bind:value={cards}
                onChange={() => change()}
                design="multi"
                options={[true, false]}
              />
            </div>
          {/if}
          <div
            dir="ltr"
            role="contentinfo"
            onmouseenter={() => hoverc($t('lev.cards.nav.filter'))}
            onmouseleave={() => hoverc('0')}
            style:visibility={low == true ? 'hidden' : 'visible'}
            class="z-[1000] px-4 flex flex-row items-center justify-center"
          >
            <button
              class="w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-full border-1 border-barbi shadow-lg"
              onclick={() => (filter ? showall() : (filter = true))}
            >
              <FilterIcon isX={filter} filterType="cardType" /></button
            >
            {#if filter}
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
                {purchasesn}
                filterKind="kind"
              />
            {/if}
            <button
              class="w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-md hover:bg-gold/80 rounded-full border-1 border-barbi shadow-lg"
              onclick={() => (filter2 ? showall() : (filter2 = true))}
            >
              <FilterIcon isX={filter2} /></button
            >
            {#if filter2}
              <Filter
                allIds={uniqueProjects}
                filterKind="projects"
                onShowonly={showonly}
              />
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <div
      role="contentinfo"
      class="swi"
      onmouseenter={() => hoverede()}
      onmouseleave={() => hoverede()}
    >
      {#key swiperKey}
        <Swiper
          releaseOnEdges={true}
          direction={!isMobileOrTablet() ? 'horizontal' : 'vertical'}
          slidesPerView={isMobileOrTablet() ? 1 : 'auto'}
          spaceBetween={isMobileOrTablet() ? 0 : null}
          on:swiper={(e) => handleSwiper(e)}
          keyboard={{
            enabled: true
          }}
          mousewheel={true}
          effect={'slide'}
          grabCursor={true}
          modules={[Manipulation, Mousewheel, Keyboard, Navigation]}
          class="mySwiperc {!isMobileOrTablet() ? 'swiperc' : 'swipermobile'}"
          dir={$isRtl ? 'rtl' : 'ltr'}
          navigation={isMobileOrTablet()
            ? false
            : {
                nextEl: $isRtl ? '.perv' : '.next',
                prevEl: $isRtl ? '.next' : '.perv'
              }}
        >
          {#each visibleArr as buble, i}
            <SwiperSlide
              class={isMobileOrTablet() ? 'swipr-slidemobile' : 'swiper-slidec'}
            >
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
            </SwiperSlide>
          {/each}
          <SwiperSlide
            class={isMobileOrTablet() ? 'swipr-slidemobile' : 'swiper-slidec'}
          >
            <div
              class="flex flex-col items-center justify-center h-full w-full"
            >
              <h2 class="text-2xl font-bold mb-4">
                {$t('lev.endOfLine')}
              </h2>
              <Button
                onClick={() => swiperRef?.slideTo(0)}
                text={$t('common.buttons.backToStart')}
              />
            </div>
          </SwiperSlide>
          <!--- <SwiperSlide class="{isMobileOrTablet() ? "swipr-slidemobile" : "swiper-slidec"}">Slide 1</SwiperSlide><SwiperSlide class="{isMobileOrTablet() ? "swipr-slidemobile" : "swiper-slidec"}">Slide 2</SwiperSlide
  ><SwiperSlide class="{isMobileOrTablet() ? "swipr-slidemobile" : "swiper-slidec"}">Slide 3</SwiperSlide><SwiperSlide class="{isMobileOrTablet() ? "swipr-slidemobile" : "swiper-slidec"}">Slide 4</SwiperSlide
  ><SwiperSlide class="{isMobileOrTablet() ? "swipr-slidemobile" : "swiper-slidec"}">Slide 5</SwiperSlide><SwiperSlide class="{isMobileOrTablet() ? "swipr-slidemobile" : "swiper-slidec"}">Slide 6</SwiperSlide
  ><SwiperSlide class="{isMobileOrTablet() ? "swipr-slidemobile" : "swiper-slidec"}">Slide 7</SwiperSlide><SwiperSlide class="{isMobileOrTablet() ? "swipr-slidemobile" : "swiper-slidec"}">Slide 8</SwiperSlide
  ><SwiperSlide class="{isMobileOrTablet() ? "swipr-slidemobile" : "swiper-slidec"}">Slide 9</SwiperSlide>-->
        </Swiper>
      {/key}
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
