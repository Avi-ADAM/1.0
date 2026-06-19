<script>
  import { locale, t, isRtl} from '$lib/translations';
  import { fly } from 'svelte/transition';
  import { cubicIn, cubicOut } from 'svelte/easing';
  import { goto } from '$app/navigation';
  import Arrow from '$lib/celim/icons/arrow.svelte';
  import Lowding from '$lib/celim/lowding.svelte';
  import Tile from '$lib/celim/tile.svelte';
  import { Canvas } from '@threlte/core';
  import Scene from '$lib/components/main/1lev1.svelte';
  import ProductPeek from '$lib/components/main/ProductPeek.svelte';
  import ResizeHandler from '$lib/components/ResizeHandler.svelte';
  import { useProgress } from '@threlte/extras';
  import CircleProgresBar from '$lib/celim/ui/circleProgresBar.svelte';
  import { lang, langUs, doesLang } from '$lib/stores/lang';
  const { progress } = useProgress();
  const url = 'https://1lev1.com/';
  const title = '1️💗1️';
  function change(lan) {
    if (lan == 'en') {
      doesLang.set(true);
      langUs.set('en');
      lang.set('en');
      locale.set('en');
      document.cookie =
        `lang=${$lang}; expires=` + new Date(2027, 0, 1).toUTCString();
    } else if (lan == 'he') {
      doesLang.set(true);
      langUs.set('he');
      lang.set('he');
      locale.set('he');
      document.cookie =
        `lang=${$lang}; expires=` + new Date(2027, 0, 1).toUTCString();
    } else if (lan == 'ar') {
      doesLang.set(true);
      langUs.set('ar');
      lang.set('ar');
      locale.set('ar');
      document.cookie =
        `lang=${$lang}; expires=` + new Date(2027, 0, 1).toUTCString();
    } else if (lan == 'ru') {
      doesLang.set(true);
      langUs.set('ru');
      lang.set('ru');
      locale.set('ru');
      document.cookie =
        `lang=${$lang}; expires=` + new Date(2027, 0, 1).toUTCString();
    }
    trans = false;
  }

  // Derived value for headlines array
  let headlines = $derived([
    $t('home.hero.headline1'),
    $t('home.hero.headline2'),
    $t('home.hero.headline3'),
    $t('home.hero.headline4'),
    $t('home.hero.headline5')
  ]);

  // כותרת מתחלפת: נסיעה אופקית לפי כיוון השפה, ללא reflow
  let currentHeadline = $state(0);
  let headlineDir = $derived($locale === 'he' || $locale === 'ar' ? 1 : -1);
  $effect(() => {
    if (headlines.length <= 1) return;
    const id = setInterval(() => {
      currentHeadline = (currentHeadline + 1) % headlines.length;
    }, 3500);
    return () => clearInterval(id);
  });

  let btna = $state(false);

  let btnb = $state(false);

  let scrolli = $state(false);

  // התקדמות גלילה (0..1) של פאנל התוכן — מניע שינוי עדין בסצנת ה‑3D
  let scrollProgress = $state(0);

  // גלילה חלקה לעוגן בתוך פאנל התוכן (#text)
  function scrollToId(id) {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  let loading = $state(false),
    loadinga = $state(false),
    w = $state(0),
    h = $state(0),
    fi = $state(false),
    trans = $state(false);

  import { Head } from 'svead';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';

  let image = `https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png`;

  let projectsCount = $state(0);
  let membersCount = $state(0);
  let usersCount = $state(0);
  let statsLoaded = $state(false);

  let pageurl = {
    ar: 'https://1lev1.com/ar',
    en: 'https://1lev1.com/en',
    he: 'https://1lev1.com/he',
    ru: 'https://1lev1.com/ru'
  };
  let size = $derived({
    width: w,
    height: h
  });

  // פונקציה לטעינת נתוני הסטטיסטיקות
  async function loadStats() {
    try {
      const projectsResult = await sendToSer(
        {},
        '66getProjectsCount',
        0,
        0,
        true,
        fetch
      );

      const membersResult = await sendToSer(
        {},
        '67getMembersCount',
        0,
        0,
        true,
        fetch
      );
      const usersResult = await sendToSer(
        {},
        '89getUsersCount',
        0,
        0,
        true,
        fetch
      );

      if (projectsResult?.data?.projects?.meta?.pagination?.total) {
        projectsCount = projectsResult.data.projects.meta.pagination.total;
      }

      if (membersResult?.data?.chezins?.meta?.pagination?.total) {
        membersCount = membersResult.data.chezins.meta.pagination.total;
      }

      if (usersResult?.data?.usersPermissionsUsers?.meta?.pagination?.total) {
        usersCount =
          usersResult.data.usersPermissionsUsers.meta.pagination.total;
      }
      // TODO: עדכן משתנה agreementCount כשהשאילתה תהיה מוכנה

      statsLoaded = true;
    } catch (error) {
      console.error('Error loading stats:', error);
      statsLoaded = true;
    }
  }

  onMount(() => {
    loadStats();
    console.log($t('home.hero.headline1'));
  });
</script>

<Head
  title={$t('home.meta.title')}
  description={$t('home.meta.description')}
  {image}
  url={pageurl[$lang]}
/>
{#snippet utilityNav(compact = false)}
  {#if trans === false}
    <button type="button" onclick={() => (trans = !trans)}>
      <img
        class="shadow-xl rounded {compact ? 'w-7 h-7' : ''}"
        alt="translat-icon-by-barbi"
        src="https://res.cloudinary.com/love1/image/upload/v1639345051/icons8-translate-app_gwpwcn.svg"
      />
    </button>
  {:else}
    <button
      type="button"
      onclick={() => (trans = !trans)}
      class="text-barbi hover:text-gold p-0.5"
    >
      <svg class="w-6 h-6" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
        />
      </svg>
    </button>
    {#if $lang != 'en'}
      <button
        type="button"
        onclick={() => change('en')}
        title="change language to English"
        class="text-barbi border-2 border-lturk font-bold hover:text-gold bg-gold text-center hover:bg-barbi px-1.5 py-0.5 rounded text-base sm:text-sm whitespace-nowrap"
      >
        {$t('home.languages.en')}
      </button>
    {/if}
    {#if $lang != 'ar'}
      <button
        type="button"
        onclick={() => change('ar')}
        title="change language to Arabic"
        class="text-barbi border-2 border-lturk font-bold hover:text-gold bg-gold text-center hover:bg-barbi px-1.5 py-0.5 rounded text-base sm:text-sm whitespace-nowrap"
      >
        {$t('home.languages.ar')}
      </button>
    {/if}
    {#if $lang != 'he'}
      <button
        type="button"
        onclick={() => change('he')}
        title="change language to Hebrew"
        class="text-barbi border-2 border-lturk font-bold hover:text-gold bg-gold text-center hover:bg-barbi px-1.5 py-0.5 rounded text-base sm:text-sm whitespace-nowrap"
      >
        {$t('home.languages.he')}
      </button>
    {/if}
    {#if $lang != 'ru'}
      <button
        type="button"
        onclick={() => change('ru')}
        title="change language to Russian"
        class="text-barbi border-2 border-lturk font-bold hover:text-gold bg-gold text-center hover:bg-barbi px-1.5 py-0.5 rounded text-base sm:text-sm whitespace-nowrap"
      >
        {$t('home.languages.ru')}
      </button>
    {/if}
    {#if $lang == 'he'}
      <a
        class="text-barbi border-2 border-lturk font-bold hover:text-gold bg-gold text-center hover:bg-barbi px-1.5 py-0.5 rounded text-base sm:text-sm whitespace-nowrap"
        title=" ההסכמה אודות "
        target="_blank"
        href="https://agreement.1lev1.com"
      >
        {$t('home.nav.about')}
      </a>
    {/if}
    <a
      class="text-barbi border-2 border-lturk font-bold hover:text-gold bg-gold text-center hover:bg-barbi px-1.5 py-0.5 rounded text-base sm:text-sm whitespace-nowrap"
      data-sveltekit-prefetch
      href="/faq"
    >
      {$t('home.nav.faq')}
    </a>
    <a
      class="text-barbi border-2 border-lturk font-bold hover:text-gold text-center bg-gold hover:bg-barbi px-1.5 py-0.5 rounded text-base sm:text-sm whitespace-nowrap"
      target="_blank"
      href="https://agreement.1lev1.com/love"
    >
      {$t('home.nav.agreementMap')}
    </a>
  {/if}
{/snippet}

<!-- Sticky header: anchor nav + שפות/קישורים + CTA (מחשב) -->
<header
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="hidden sm:flex fixed top-0 inset-x-0 z-[600] items-center gap-4 px-6 py-2 bg-white/40 backdrop-blur-md border-b border-white/40 shadow-sm"
  style="font-family:'Sababa',sans-serif;"
>
  <img
    src="https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png"
    alt="1lev1"
    class="w-9 h-9 shrink-0 drop-shadow"
    style="animation:none;"
  />
  <nav class="flex flex-1 items-center justify-center gap-4 min-w-0 text-barbi font-bold text-sm lg:text-base">
    <button type="button" class="hover:text-gold transition-colors whitespace-nowrap" onclick={() => scrollToId('demo')}>{$t('home.sections.navDemo')}</button>
    <button type="button" class="hover:text-gold transition-colors whitespace-nowrap" onclick={() => scrollToId('features')}>{$t('home.sections.navFeatures')}</button>
    <button type="button" class="hover:text-gold transition-colors whitespace-nowrap" onclick={() => scrollToId('how')}>{$t('home.sections.navHow')}</button>
    <button type="button" class="hover:text-gold transition-colors whitespace-nowrap" onclick={() => scrollToId('concierge')}>{$t('home.sections.navConcierge')}</button>
    <button type="button" class="hover:text-gold transition-colors whitespace-nowrap" onclick={() => scrollToId('who')}>{$t('home.sections.whoTitle')}</button>
    <button type="button" class="hover:text-gold transition-colors whitespace-nowrap" onclick={() => scrollToId('faq')}>{$t('home.sections.navFaq')}</button>
  </nav>
  <div
    class="flex shrink-0 items-center gap-2"
    class:flex-row={trans}
    class:flex-wrap={trans}
  >
    {@render utilityNav(true)}
  </div>
  <button
    type="button"
    class="shrink-0 bg-barbi text-gold hover:bg-white hover:text-barbi font-bold px-4 py-1.5 rounded-xl shadow-md hover:scale-105 transition-all duration-300 whitespace-nowrap"
    onclick={() => {
      goto(
        $locale == 'he' ? '/hascama' : $locale == 'ar' ? '/aitifaqia' : '/convention'
      );
      fi = true;
    }}
  >
    {$t('home.sections.ctaTop')}
  </button>
</header>

<!-- תפריט שפה/קישורים צף — מובייל בלבד -->
<div
  class="sm:hidden absolute left-[1%] top-[1%] z-[699] flex flex-col"
>
  {@render utilityNav()}
</div>

<div
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="relative h-screen w-screen overflow-hidden bg-[length:200%_auto] animate-gradientx bg-gradient-to-br from-[#e0e7ff] via-[#f3e8ff] to-[#e0e7ff]"
>
  <!-- 3D Scene Background -->
  <div
    id="levi"
    bind:clientHeight={h}
    bind:clientWidth={w}
    class:flex={$progress == 1}
    class="fixed inset-0 w-full h-full z-0 pointer-events-none sm:pointer-events-auto transition-all duration-300"
  >
    {#if $progress < 1}
      <div
        class="w-full h-full flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-50 absolute inset-0"
        title={$t('home.loading.title')}
      >
        <img
          class="ani w-20 h-20 mb-4"
          src="https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png"
          alt="logo"
        />
        <CircleProgresBar progress={$progress} />
      </div>
    {/if}
    <div
      class="w-full h-full transition-transform duration-300 ease-out"
      style="transform: translateY({scrollProgress * -5}%) scale({1 + scrollProgress * 0.1});"
    >
      <Canvas {size}>
        <ResizeHandler {size} />
        <Scene
          {fi}
          {size}
          hover={btna == true || btnb == true ? true : false}
          {scrolli}
          {scrollProgress}
        />
      </Canvas>
    </div>
  </div>

  <!-- Main Scrollable Content -->
  <div
    id="text"
    class="relative d z-10 w-full h-screen overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-barbi scrollbar-track-transparent"
    onscroll={(e) => {
      scrolli = true;
      const el = e.currentTarget;
      const max = el.scrollHeight - el.clientHeight;
      scrollProgress = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0;
      if (window.scrollTimer) clearTimeout(window.scrollTimer);
      window.scrollTimer = setTimeout(() => (scrolli = false), 150);
    }}
  >
    <div
      class="flex flex-col items-center w-full min-h-full pb-24 sm:pb-10 sm:w-1/2 p-4 transition-all duration-300"
      class:sm:ml-auto={$locale === 'he' || $locale === 'ar'}
      class:sm:mr-0={$locale === 'he' || $locale === 'ar'}
      class:sm:mr-auto={$locale !== 'he' && $locale !== 'ar'}
      class:sm:ml-0={$locale !== 'he' && $locale !== 'ar'}
    >
      <!-- Logo & Header -->
      <img
        src="https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png"
        alt="logo"
        class="w-8 h-8 sm:w-24 sm:h-24 mt-12 sm:mt-8 mb-2 drop-shadow-lg"
      />

      <div
        dir="ltr"
        style="text-shadow:none;"
        class="pt-2 sm:pt-6 font-bold sm:text-2xl text-2xl text-transparent
          bg-clip-text bg-[length:auto_200%] animate-gradienty
          bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.mturk),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.barbi))]
          flex-wrap flex flex-row"
      >
        <div class="flip">
          <h1
            class="font-bold sm:text-4xl text-3xl text-transparent bg-clip-text bg-[length:auto_200%] animate-gradienty
            bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.mturk),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.barbi))]"
          >
            1
          </h1>
        </div>
        <div>
          <h1
            class="font-bold mt-2 sm:text-xl text-xl text-transparent bg-clip-text bg-[length:auto_200%] animate-gradienty
          bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.mturk),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.barbi))]"
          >
            💗
          </h1>
        </div>
        <div>
          <h1
            class="font-bold sm:text-4xl text-3xl text-transparent bg-clip-text bg-[length:auto_200%] animate-gradienty
            bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.mturk),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.barbi))]"
          >
            1
          </h1>
        </div>
      </div>

      <div class="relative w-full min-h-[4rem] sm:min-h-[5rem] mt-2 mb-8 overflow-hidden">
        {#key currentHeadline}
          <div
            class="absolute inset-0 flex items-center justify-center text-center font-bold text-transparent
              bg-clip-text bg-[length:auto_200%] animate-gradienty
              bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.mturk),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.barbi))]
              {$lang === 'he' ? 'sm:text-2xl text-xl' : 'sm:text-lg text-base'}"
            style="text-shadow:none;"
            in:fly={{ x: headlineDir * 60, duration: 450, easing: cubicOut }}
            out:fly={{ x: headlineDir * -60, duration: 450, easing: cubicIn }}
          >
            {headlines[currentHeadline]}
          </div>
        {/key}
      </div>

      <!-- ===== מוביל: הבעיה / הכאב ===== -->
      <section
        class="w-full max-w-xl mt-4 animate-fade-in-up"
        style="font-family:'Sababa',sans-serif;"
      >
        <h2
          class="text-rose-700 font-bold text-3xl sm:text-2xl mb-1 text-center"
          style="text-shadow:1px 1px 2px rgba(0,0,0,0.15);"
        >
          {$t('home.sections.problemTitle')}
        </h2>
        <p class="text-center text-rose-500 text-base sm:text-sm mb-4">
          {$t('home.sections.painLead')}
        </p>
        <div class="flex flex-col gap-2.5">
          {#each ['pain1', 'pain2', 'pain3', 'pain4'] as p}
            <div
              class="flex items-start gap-3 bg-white/55 backdrop-blur-sm border border-rose-300/70 rounded-xl px-4 py-3 shadow-sm"
            >
              <span
                class="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-sm font-bold"
                >✕</span
              >
              <p class="text-slate-800 text-base sm:text-sm leading-relaxed text-start">
                {$t(`home.sections.${p}`)}
              </p>
            </div>
          {/each}
        </div>
        <p
          class="text-center text-rose-700 font-semibold italic text-lg sm:text-base mt-4"
        >
          {$t('home.sections.painCost')}
        </p>
        <div class="mt-5 text-center">
          <p
            class="inline-block bg-gradient-to-r from-gold via-barbi to-gold bg-[length:200%_auto] animate-gradientx text-white font-bold text-xl sm:text-lg px-6 py-3 rounded-2xl shadow-lg"
          >
            {$t('home.sections.painTurn')}
          </p>
        </div>
      </section>

      <!-- ===== הדרך השלישית: שכיר / יזם בודד / ריקמה ===== -->
      <section
        class="w-full max-w-xl mt-10 animate-fade-in-up"
        style="font-family:'Sababa',sans-serif;"
      >
        <h2
          class="text-rose-700 font-bold text-3xl sm:text-2xl mb-1 text-center"
        >
          {$t('home.sections.oldWayTitle')}
        </h2>
        <p class="text-center text-slate-700 text-base sm:text-sm mb-5">
          {$t('home.sections.oldWaySub')}
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
          {#each [['colEmployee', false], ['colSolo', false], ['colRikma', true]] as [key, highlight]}
            <div
              class="relative flex flex-col rounded-2xl p-4 {highlight
                ? 'bg-gradient-to-br from-amber-200 via-gold to-rose-200 border-2 border-gold shadow-xl ring-2 ring-gold/50'
                : 'bg-slate-100/70 backdrop-blur-sm border border-slate-300 shadow-sm'}"
            >
              {#if highlight}
                <span
                  class="absolute -top-3 left-1/2 -translate-x-1/2 bg-barbi text-gold text-xs font-bold px-3 py-1 rounded-full shadow whitespace-nowrap"
                  >{$t('home.sections.colRikma_badge')}</span
                >
              {/if}
              <h3
                class="font-bold text-lg sm:text-base mb-3 text-center {highlight
                  ? 'text-rose-700 mt-1'
                  : 'text-slate-500'}"
              >
                {$t(`home.sections.${key}_t`)}
              </h3>
              <ul class="flex flex-col gap-2">
                {#each $t(`home.sections.${key}_d`).split('•') as item}
                  <li
                    class="flex items-start gap-2 text-sm text-start {highlight
                      ? 'text-slate-900 font-medium'
                      : 'text-slate-600'}"
                  >
                    <span
                      class="shrink-0 {highlight
                        ? 'text-emerald-600'
                        : 'text-rose-400'}">{highlight ? '✓' : '✕'}</span
                    >
                    <span>{item.trim()}</span>
                  </li>
                {/each}
              </ul>
            </div>
          {/each}
        </div>
      </section>

      <!-- ===== הצצה חיה למערכת (דמו לפני הרשמה) ===== -->
      <section
        id="demo"
        class="w-full max-w-xl mt-10 scroll-mt-16 animate-fade-in-up"
        style="font-family:'Sababa',sans-serif;"
      >
        <ProductPeek />
      </section>

      <!-- ===== גשר: שאלות הזדהות ===== -->
      <section
        class="w-full max-w-xl mt-10 animate-fade-in-up"
        style="font-family:'Sababa',sans-serif;"
      >
        <div class="flex flex-col gap-3">
          <p
            class="bg-white/60 backdrop-blur-sm border-2 border-gold rounded-lg px-4 py-3 text-slate-900 text-lg sm:text-base shadow text-center"
          >
            {$t('home.intro.q1')}
          </p>
          <p
            class="bg-white/60 backdrop-blur-sm border-2 border-gold rounded-lg px-4 py-3 text-slate-900 text-lg sm:text-base shadow text-center"
          >
            {$t('home.intro.q2')}
          </p>
        </div>
      </section>

      <!-- Content Cards: Stats + Mobile CTA -->
      <div class="w-full max-w-xl flex flex-col gap-6 mt-10">
        <!-- Stats -->
        <div
          class="bg-gradient-to-br from-gold via-barbi to-gold opacity-80 px-4 py-3 mt-2 rounded-lg border-2 border-gold shadow-lg"
        >
          {#if statsLoaded}
            <div class="text-center">
              <p
                class="text-white font-semibold text-xl sm:text-lg mb-2"
                style="font-family: 'Sababa', sans-serif;"
              >
                {$t('home.stats.currently')}
              </p>
              <div class="flex justify-center items-center gap-3 flex-wrap">
                <div class="bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
                  <div class="text-2xl font-bold text-gold">
                    {projectsCount}
                  </div>
                  <div class="text-white text-base sm:text-sm">
                    {$t('home.stats.partnerships')}
                  </div>
                </div>
                <div class="text-gold text-2xl">•</div>
                <div class="bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
                  <div class="text-2xl font-bold text-gold">{usersCount}</div>
                  <div class="text-white text-base sm:text-sm">
                    {$t('home.stats.members')}
                  </div>
                </div>
                <div class="text-gold text-2xl">•</div>
                <div class="bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
                  <div class="text-2xl font-bold text-gold">{membersCount}</div>
                  <div class="text-white text-sm">{$t('home.fpage.agreedOnAgreement')}</div>
                </div>
              </div>
            </div>
          {:else}
            <div
              class="text-center text-white font-semibold text-lg sm:text-base"
              style="font-family: 'Sababa', sans-serif;"
            >
              {$t('home.stats.loading')}
            </div>
          {/if}
        </div>

        <!-- Mobile CTA (Original style) -->
        <div
          class="block sm:hidden bg-gradient-to-br from-[#c67c7f] via-barbi to-[#c67c7f] px-3 py-4 mt-6 border-4 border-spacing-2 rounded-lg"
        >
          <div style="font-family:Gan, Power;" class="flex flex-col gap-3">
            <button
              class="transition-all duration-300 flex flex-row justify-center items-center text-barbi px-4 py-2 text-2xl sm:text-xl bg-white hover:text-slate-800 rounded-xl shadow-lg"
              onclick={() => {
                goto('/login');
                loadinga = true;
                fi = true;
              }}
            >
              {$t('home.cta.login')}
            </button>
            <button
              class="transition-all duration-300 text-barbi px-4 py-2 text-2xl sm:text-xl bg-gold hover:text-slate-800 rounded-xl flex flex-row justify-center items-center shadow-lg"
              onclick={() => {
                goto('/hascama');
                loading = true;
                fi = true;
              }}
            >
              {$t('home.cta.register')}
            </button>
          </div>
        </div>
      </div>

      <!-- ===== גלילה ארוכה: בלוקים אינפורמטיביים וממירים ===== -->
      <div
        class="w-full max-w-xl flex flex-col gap-10 mt-12"
        style="font-family:'Sababa',sans-serif;"
      >
        <!-- בלוק: יכולות הפלטפורמה -->
        <section id="features" class="scroll-mt-16">
          <h2 class="text-rose-700 font-bold text-3xl sm:text-2xl mb-1 text-center">
            {$t('home.sections.featuresTitle')}
          </h2>
          <p class="text-center text-slate-700 text-base sm:text-sm mb-5">
            {$t('home.sections.featuresSub')}
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {#each [['🗂️', 'projectMgmt'], ['🤝', 'negotiation'], ['🚀', 'onboarding'], ['📲', 'telegram'], ['🤖', 'aiBot'], ['🔍', 'transparency']] as [icon, key]}
              <div
                class="bg-white/70 backdrop-blur-sm border-2 border-gold rounded-lg p-4 shadow flex flex-col"
              >
                <div class="text-2xl mb-1">{icon}</div>
                <h3 class="text-rose-700 font-bold text-lg sm:text-base mb-1">
                  {$t(`home.platform.${key}_t`)}
                </h3>
                <p class="text-slate-800 text-base sm:text-sm leading-relaxed">
                  {$t(`home.platform.${key}_d`)}
                </p>
              </div>
            {/each}
          </div>
        </section>

        <!-- בלוק: איך זה עובד ב‑4 צעדים -->
        <section id="how" class="scroll-mt-16">
          <h2 class="text-rose-700 font-bold text-3xl sm:text-2xl mb-4 text-center">
            {$t('home.sections.howTitle')}
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {#each ['s1', 's2', 's3', 's4'] as s, i}
              <div
                class="relative bg-gradient-to-br from-amber-100 via-amber-200 to-rose-100 border-2 border-gold rounded-lg p-4 shadow"
              >
                <div
                  class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-barbi text-gold font-bold flex items-center justify-center shadow-md"
                >
                  {i + 1}
                </div>
                <h3 class="text-rose-700 font-bold text-lg sm:text-base mb-1">
                  {$t(`home.maze.flow.${s}.title`)}
                </h3>
                <p class="text-slate-800 text-base sm:text-sm leading-relaxed">
                  {$t(`home.maze.flow.${s}.desc`)}
                </p>
              </div>
            {/each}
          </div>
        </section>

        <!-- בלוק: הקונסיירז' (דו‑קהלי) -->
        <section id="concierge" class="scroll-mt-16">
          <p class="text-center text-barbi font-bold text-base sm:text-sm tracking-widest mb-1">
            {$t('home.concierge.eyebrow')}
          </p>
          <h2 class="text-rose-700 font-bold text-3xl sm:text-2xl mb-2 text-center">
            {$t('home.concierge.title')}
          </h2>
          <p class="text-center text-slate-800 text-lg sm:text-base mb-2">
            {$t('home.concierge.subtitle')}
          </p>
          <p class="text-center text-rose-600 text-base sm:text-sm mb-5">
            {$t('home.concierge.flow')}
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              class="bg-white/70 backdrop-blur-sm border-2 border-gold rounded-lg p-4 shadow flex flex-col"
            >
              <h3 class="text-rose-700 font-bold text-xl sm:text-lg mb-2">
                {$t('home.concierge.customerTitle')}
              </h3>
              <p class="text-slate-800 text-base sm:text-sm leading-relaxed mb-4 grow">
                {$t('home.concierge.customerDesc')}
              </p>
              <button
                class="bg-barbi hover:bg-white hover:text-barbi text-gold font-semibold text-lg sm:text-base px-4 py-2 rounded-lg transition-all duration-300 shadow-md hover:scale-105"
                onclick={() => goto('/concierge/new')}
              >
                {$t('home.concierge.customerCta')}
              </button>
            </div>
            <div
              class="bg-white/70 backdrop-blur-sm border-2 border-gold rounded-lg p-4 shadow flex flex-col"
            >
              <h3 class="text-rose-700 font-bold text-xl sm:text-lg mb-2">
                {$t('home.concierge.providerTitle')}
              </h3>
              <p class="text-slate-800 text-base sm:text-sm leading-relaxed mb-4 grow">
                {$t('home.concierge.providerDesc')}
              </p>
              <button
                class="bg-gold hover:bg-barbi hover:text-gold text-barbi font-semibold text-lg sm:text-base px-4 py-2 rounded-lg transition-all duration-300 shadow-md hover:scale-105"
                onclick={() => goto('/concierge')}
              >
                {$t('home.concierge.providerCta')}
              </button>
            </div>
          </div>
        </section>

        <!-- בלוק: למי זה מתאים -->
        <section id="who" class="scroll-mt-16">
          <h2 class="text-rose-700 font-bold text-3xl sm:text-2xl mb-1 text-center">
            {$t('home.sections.whoTitle')}
          </h2>
          <p class="text-center text-slate-700 text-base sm:text-sm mb-5">
            {$t('home.sections.whoSub')}
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {#each [['🧑‍🎨', 'whoFreelancer'], ['🏪', 'whoBusiness'], ['🌱', 'whoCreators']] as [icon, key]}
              <div
                class="bg-white/70 backdrop-blur-sm border-2 border-gold rounded-lg p-4 shadow flex flex-col text-center"
              >
                <div class="text-3xl mb-1">{icon}</div>
                <h3 class="text-rose-700 font-bold text-lg sm:text-base mb-1">
                  {$t(`home.sections.${key}_t`)}
                </h3>
                <p class="text-slate-800 text-base sm:text-sm leading-relaxed">
                  {$t(`home.sections.${key}_d`)}
                </p>
              </div>
            {/each}
          </div>
        </section>

        <!-- בלוק: ערך הליבה — מה באמת מקבלים -->
        <section class="scroll-mt-16">
          <p
            class="text-center text-slate-800 text-lg sm:text-base leading-relaxed mb-5 max-w-lg mx-auto"
          >
            {$t('home.features.welcome')}
          </p>
          <div class="flex flex-col gap-2 items-center sm:text-md text-xs px-2">
            <Tile
              bg={'roseGold'}
              big={true}
              sm={true}
              reverse={true}
              openi={true}
              word={$t('home.features.livelihood')}
            />
            <Tile
              bg={'roseGold'}
              big={true}
              sm={true}
              reverse={true}
              openi={true}
              word={$t('home.features.sharedManagement')}
            />
            <Tile
              bg={'roseGold'}
              big={true}
              sm={true}
              reverse={true}
              openi={true}
              word={$t('home.features.transparency')}
            />
            <Tile
              bg={'roseGold'}
              big={true}
              sm={true}
              reverse={true}
              openi={true}
              word={$t('home.features.tools')}
            />
            <Tile
              bg={'roseGold'}
              big={true}
              sm={true}
              reverse={true}
              openi={true}
              word={$t('home.features.ownership')}
            />
            <Tile
              bg={'roseGold'}
              big={true}
              sm={true}
              reverse={true}
              openi={true}
              word={$t('home.features.formula')}
            />
            <Tile
              bg={'roseGold'}
              big={true}
              sm={true}
              word={$t('home.features.mission')}
            />
          </div>
        </section>

        <!-- בלוק: למה אנחנו שונים (תנועה עולמית) -->
        <section class="text-center">
          <div
            class="bg-gradient-to-br from-amber-200 via-amber-300 to-rose-200 opacity-90 px-4 py-4 rounded-2xl border-2 border-gold shadow-xl backdrop-blur-sm"
          >
            <h2
              class="text-rose-700 font-bold text-2xl sm:text-xl mb-2 text-center"
              style="text-shadow: 1px 1px 2px rgba(0,0,0,0.3);"
            >
              {$t('home.fpage.whyDifferentTitle')}
            </h2>
            <p
              class="text-slate-900 text-lg sm:text-base leading-relaxed text-center"
            >
              {@html $t('home.fpage.whyDifferentDesc')}
            </p>
            <div class="mt-3 text-center">
              <a
                href={$locale === 'he'
                  ? '/hascama'
                  : $locale === 'ar'
                    ? '/aitifaqia'
                    : '/convention'}
                class="inline-block bg-barbi hover:bg-white hover:text-barbi text-gold font-semibold text-lg sm:text-base px-4 py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                {$t('home.fpage.discoverAgreement')}
              </a>
            </div>
          </div>
        </section>

        <!-- בלוק: הוכחה חברתית / תנועה עולמית -->
        <section class="text-center">
          <h2 class="text-rose-700 font-bold text-3xl sm:text-2xl mb-1">
            {$t('home.sections.proofTitle')}
          </h2>
          <p class="text-slate-700 text-base sm:text-sm mb-4 max-w-md mx-auto">
            {$t('home.sections.proofSub')}
          </p>
          <div class="flex justify-center items-stretch gap-3 flex-wrap">
            <div class="bg-gradient-to-br from-gold via-barbi to-gold rounded-lg px-4 py-3 shadow min-w-[110px]">
              <div class="text-2xl font-bold text-white">{projectsCount}</div>
              <div class="text-white/90 text-sm sm:text-xs">{$t('home.sections.proofStatProjects')}</div>
            </div>
            <div class="bg-gradient-to-br from-gold via-barbi to-gold rounded-lg px-4 py-3 shadow min-w-[110px]">
              <div class="text-2xl font-bold text-white">{usersCount}</div>
              <div class="text-white/90 text-sm sm:text-xs">{$t('home.sections.proofStatMembers')}</div>
            </div>
            <div class="bg-gradient-to-br from-gold via-barbi to-gold rounded-lg px-4 py-3 shadow min-w-[110px]">
              <div class="text-2xl font-bold text-white">{membersCount}</div>
              <div class="text-white/90 text-sm sm:text-xs">{$t('home.sections.proofStatSigners')}</div>
            </div>
          </div>
        </section>

        <!-- בלוק: מפת ההסכמה הגלובלית -->
        <section class="text-center">
          <h2 class="text-rose-700 font-bold text-3xl sm:text-2xl mb-1">
            {$t('home.sections.mapTitle')}
          </h2>
          <p class="text-slate-700 text-base sm:text-sm mb-4 max-w-md mx-auto">
            {$t('home.sections.mapSub')}
          </p>
          <a
            href="/love"
            data-sveltekit-prefetch
            class="inline-block bg-barbi hover:bg-white hover:text-barbi text-gold font-semibold text-lg sm:text-base px-5 py-2 rounded-lg shadow-md hover:scale-105 transition-all duration-300"
          >
            🗺️ {$t('home.sections.mapCta')}
          </a>
        </section>

        <!-- בלוק: מודל / תמחור -->
        <section class="text-center">
          <div class="bg-white/70 backdrop-blur-sm border-2 border-gold rounded-2xl px-5 py-5 shadow">
            <h2 class="text-rose-700 font-bold text-3xl sm:text-2xl mb-1">
              {$t('home.sections.modelTitle')}
            </h2>
            <p class="text-slate-800 text-lg sm:text-base leading-relaxed max-w-md mx-auto">
              {$t('home.sections.modelSub')}
            </p>
          </div>
        </section>

        <!-- בלוק: שאלות נפוצות -->
        <section id="faq" class="scroll-mt-16">
          <h2 class="text-rose-700 font-bold text-3xl sm:text-2xl mb-4 text-center">
            {$t('home.sections.faqTitle')}
          </h2>
          <div class="flex flex-col gap-2">
            {#each ['1', '2', '3', '5', '6'] as q}
              <details
                class="bg-white/60 backdrop-blur-sm border-2 border-gold rounded-lg px-4 py-2 shadow"
              >
                <summary class="text-rose-700 font-semibold text-lg sm:text-base cursor-pointer py-1">
                  {$t(`home.maze.faq.q${q}`)}
                </summary>
                <p class="text-slate-800 text-base sm:text-sm leading-relaxed pt-2">
                  {$t(`home.maze.faq.a${q}`)}
                </p>
              </details>
            {/each}
          </div>
        </section>

        <!-- בלוק: קריאה לפעולה סופית -->
        <section class="mb-8">
          <div
            class="bg-gradient-to-br from-gold via-barbi to-gold px-5 py-6 rounded-2xl border-2 border-gold shadow-xl text-center"
          >
            <h2 class="text-3xl sm:text-2xl font-bold text-white mb-2">
              {$t('home.sections.ctaFinalTitle')}
            </h2>
            <p class="text-white/90 text-lg sm:text-base mb-4">
              {$t('home.sections.ctaFinalSub')}
            </p>
            <div class="flex gap-3 justify-center flex-wrap">
              <button
                class="bg-white text-barbi font-bold text-lg sm:text-base px-5 py-2 rounded-xl shadow-lg hover:scale-105 transition-all duration-300"
                onclick={() => {
                  goto('/login');
                  fi = true;
                }}
              >
                {$t('home.cta.login')}
              </button>
              <button
                class="bg-barbi text-gold font-bold text-lg sm:text-base px-5 py-2 rounded-xl shadow-lg hover:scale-105 transition-all duration-300"
                onclick={() => {
                  goto(
                    $locale == 'he'
                      ? '/hascama'
                      : $locale == 'ar'
                        ? '/aitifaqia'
                        : '/convention'
                  );
                  fi = true;
                }}
              >
                {$t('home.cta.register')}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>

  <!-- Float Buttons Desktop -->
  <div
    class="hidden sm:flex fixed top-1/2 -translate-y-1/2 flex-col gap-6 z-50 transition-all duration-500"
    class:left-8={$locale == 'he' || $locale == 'ar'}
    class:right-8={$locale !== 'he' && $locale !== 'ar'}
  >
    <button
      class="group flex flex-row items-center gap-3 px-6 py-3 rounded-2xl bg-white/40 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] hover:bg-white/60 hover:scale-105 transition-all duration-300 min-w-[160px]"
      onclick={() => {
        goto('/login');
        loadinga = true;
        fi = true;
      }}
      onfocus={() => (btna = true)}
      onmouseover={() => (btna = true)}
      onmouseleave={() => (btna = false)}
    >
      {#if loadinga == true}
        <div class="mx-auto"><Lowding width="24px" height="24px" /></div>
      {:else}
        <span class="text-3xl">🔑</span>
        <span class="text-xl text-barbi font-bold font-['Sababa']"
          >{$t('home.cta.login')}</span
        >
      {/if}
    </button>

    <button
      class="group flex text-barbi flex-row items-center gap-3 px-6 py-3 rounded-2xl bg-barbi/80 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] hover:text-gold hover:bg-barbi hover:scale-105 transition-all duration-300 min-w-[160px]"
      onclick={() => {
        goto(
          `${$locale == 'he' ? '/hascama' : $locale == 'ar' ? '/aitifaqia' : '/convention'}`
        );
        loading = true;
        fi = true;
      }}
      onfocus={() => (btnb = true)}
      onmouseover={() => (btnb = true)}
      onmouseleave={() => (btnb = false)}
    >
      {#if loading == true}
        <div class="mx-auto"><Lowding width="24px" height="24px" /></div>
      {:else}
        <span class="text-3xl">✍️</span>
        <span class="text-xl font-bold font-['Sababa']"
          >{$t('home.cta.register')}</span
        >
      {/if}
    </button>
  </div>
</div>

<style>
  .flip {
    -moz-transform: scale(-1, 1);
    -webkit-transform: scale(-1, 1);
    -o-transform: scale(-1, 1);
    -ms-transform: scale(-1, 1);
    transform: scale(-1, 1);
  }
  img {
    animation: wiggle 2s linear infinite;
    max-height: 25vh;
  }
  @media (min-width: 640px) {
    img {
      animation: wiggle 2s linear infinite;
      max-height: 50vh;
    }
  }

  @keyframes wiggle {
    0%,
    7% {
      transform: rotateZ(0);
    }
    15% {
      transform: rotateZ(-15deg);
    }
    20% {
      transform: rotateZ(10deg);
    }
    25% {
      transform: rotateZ(-10deg);
    }
    30% {
      transform: rotateZ(6deg);
    }
    35% {
      transform: rotateZ(-4deg);
    }
    40%,
    100% {
      transform: rotateZ(0);
    }
  }
</style>
