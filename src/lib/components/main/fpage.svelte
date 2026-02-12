<script>
  import { locale, t } from '$lib/translations';
  import { AnimatedHeadline } from 'svelte-animated-headline';
  import { goto } from '$app/navigation';
  import Arrow from '$lib/celim/icons/arrow.svelte';
  import Lowding from '$lib/celim/lowding.svelte';
  import Tile from '$lib/celim/tile.svelte';
  import { Canvas } from '@threlte/core';
  import Scene from '$lib/components/main/1lev1.svelte';
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
    }
    trans = false;
  }

  // Derived value for headlines array
  let headlines = [
    $t('home.hero.headline1'),
    $t('home.hero.headline2'),
    $t('home.hero.headline3')
  ];

  let btna = $state(false);

  let btnb = $state(false);

  let scrolli = $state(false);

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
    he: 'https://1lev1.com/he'
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
<div
  style="position:absolute ; left: 1%; top: 1%; display: flex; flex-direction: column ; z-index: 699;"
>
  {#if trans === false}
    <button onclick={() => (trans = !trans)}
      ><img
        class="shadow-xl rounded"
        alt="translat-icon-by-barbi"
        src="https://res.cloudinary.com/love1/image/upload/v1639345051/icons8-translate-app_gwpwcn.svg"
      /></button
    >
  {:else}
    <button
      onclick={() => (trans = !trans)}
      class=" text-barbi hover:text-gold p-0.5"
      ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
        />
      </svg></button
    >
    {#if $lang != 'en'}
      <button
        onclick={() => change('en')}
        title="change language to English"
        class="text-barbi border-2 border-lturk text-bold hover:text-gold bg-gold text-center hover:bg-barbi px-1 py-0.5"
        >{$t('home.languages.en')}</button
      >
    {/if}

    {#if $lang != 'ar'}
      <button
        onclick={() => change('ar')}
        title="change language to Arabic"
        class="text-barbi border-2 border-lturk text-bold hover:text-gold bg-gold text-center hover:bg-barbi px-1 py-0.5"
        >{$t('home.languages.ar')}</button
      >
    {/if}
    {#if $lang != 'he'}
      <button
        onclick={() => change('he')}
        title="change language to Hebrew"
        class="text-barbi border-2 border-lturk text-bold hover:text-gold bg-gold text-center hover:bg-barbi px-1 py-0.5"
        >{$t('home.languages.he')}</button
      >
    {/if}
    {#if $lang == 'he'}
      <a
        class="text-barbi border-2 border-lturk text-bold hover:text-gold bg-gold text-center hover:bg-barbi px-1 py-0.5"
        title=" 1💗1 אודות "
        data-sveltekit-prefetch
        href="/about"
      >
        {$t('home.nav.about')}</a
      >
    {/if}
    <a
      class="text-barbi border-2 border-lturk text-bold hover:text-gold text-center bg-gold hover:bg-barbi px-1 py-0.5"
      data-sveltekit-prefetch
      href="/love">{$t('home.nav.agreementMap')}</a
    >
  {/if}
</div>

<div
  dir={$locale === 'he' || $locale === 'ar' ? 'rtl' : 'ltr'}
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
    <div class="w-full h-full">
      <Canvas {size}>
        <ResizeHandler {size} />
        <Scene
          {fi}
          {size}
          hover={btna == true || btnb == true ? true : false}
          {scrolli}
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
        class="pt-2 sm:pt-6 font-bold sm:text-2xl text-xl text-transparent
          bg-clip-text bg-[length:auto_200%] animate-gradienty
          bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.mturk),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.barbi))]
          flex-wrap flex flex-row"
      >
        <div class="flip">
          <h1
            class="font-bold sm:text-4xl text-2xl text-transparent bg-clip-text bg-[length:auto_200%] animate-gradienty
            bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.mturk),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.barbi))]"
          >
            1
          </h1>
        </div>
        <div>
          <h1
            class="font-bold mt-2 sm:text-xl text-lg text-transparent bg-clip-text bg-[length:auto_200%] animate-gradienty
          bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.mturk),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.barbi))]"
          >
            💗
          </h1>
        </div>
        <div>
          <h1
            class="font-bold sm:text-4xl text-2xl text-transparent bg-clip-text bg-[length:auto_200%] animate-gradienty
            bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.sky.400),theme(colors.mturk),theme(colors.sky.400),theme(colors.fuchsia.400),theme(colors.barbi))]"
          >
            1
          </h1>
        </div>
      </div>

      <div class="sababa mt-2 mb-8">
        <AnimatedHeadline
          wordWrapperClass="overflow-hidden inline-block align-bottom transition-all duration-500 ease-in-out"
          wordClass="font-['Sababa'] font-bold sm:text-2xl text-lg overflow-hidden inline-block align-bottom text-transparent bg-clip-text bg-[length:200%_auto] animate-gradientx 
          bg-[linear-gradient(to_right,theme(colors.gra),theme(colors.grb),theme(colors.grc),theme(colors.grd),theme(colors.gre),theme(colors.grd),theme(colors.grc),theme(colors.grb),theme(colors.gra))]"
          type="rotate-1"
          texts={headlines}
        />
      </div>

      <!-- Content Cards -->
      <div class="w-full max-w-xl flex flex-col gap-6">
        <div
          class="bg-gradient-to-br from-amber-200 via-amber-300 to-rose-200 opacity-80 px-4 py-3 mt-2 rounded-lg border-2 border-gold shadow-xl backdrop-blur-sm"
        >
          <h2
            class="text-rose-700 font-bold text-xl mb-2 text-center"
            style="font-family: 'Sababa', sans-serif; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);"
          >
            {#if $locale === 'he'}
              💗 למה אנחנו שונים?
            {:else if $locale === 'ar'}
              💗 لماذا نحن مختلفون؟
            {:else}
              💗 Why We're Different
            {/if}
          </h2>
          <p
            class="text-slate-900 text-md leading-relaxed text-center"
            style="font-family: 'Sababa', sans-serif;"
          >
            {#if $locale === 'he'}
              1💗1 היא לא סתם פלטפורמה עסקית - <strong class="text-rose-600"
                >אנחנו חלק מתנועה עולמית</strong
              >
              של אנשים שבוחרים ליצור יחד בהסכמה וללא כפיה. כל ריקמה שנוצרת כאן היא
              הוכחה חיה שאפשר ליצור אחרת.
            {:else if $locale === 'ar'}
              1💗1 ليست مجرد منصة عمل - <strong class="text-rose-600"
                >نحن جزء من حركة عالمية</strong
              >
              من الأشخاص الذين يختارون العمل بالتوافق وليس بالإكراه. كل شراكة هنا
              هي دليل حي على إمكانية العمل بشكل مختلف.
            {:else}
              1💗1 isn't just a business platform - <strong
                class="text-rose-600">we're part of a global movement</strong
              >
              of people choosing to work in mutual agreement, not coercion. Every
              partnership here is living proof that working differently is possible.
            {/if}
          </p>
          <div class="mt-3 text-center">
            <a
              href={$locale === 'he'
                ? '/hascama'
                : $locale === 'ar'
                  ? '/aitifaqia'
                  : '/convention'}
              class="inline-block bg-barbi hover:bg-white hover:text-barbi text-gold font-semibold px-4 py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              style="font-family: 'Sababa', sans-serif;"
            >
              {#if $locale === 'he'}
                גלו את ההסכמה העולמית ←
              {:else if $locale === 'ar'}
                اكتشف الاتفاق العالمي ←
              {:else}
                Discover the Global Agreement ➜
              {/if}
            </a>
          </div>
        </div>

        <div
          class="flex flex-col gap-2 items-center sm:text-md text-xs my-4 px-2"
        >
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

        <!-- Stats -->
        <div
          class="bg-gradient-to-br from-gold via-barbi to-gold opacity-80 px-4 py-3 mt-2 rounded-lg border-2 border-gold shadow-lg"
        >
          {#if statsLoaded}
            <div class="text-center">
              <p
                class="text-white font-semibold text-lg mb-2"
                style="font-family: 'Sababa', sans-serif;"
              >
                {$t('home.stats.currently')}
              </p>
              <div class="flex justify-center items-center gap-3 flex-wrap">
                <div class="bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
                  <div class="text-2xl font-bold text-gold">
                    {projectsCount}
                  </div>
                  <div class="text-white text-sm">
                    {$t('home.stats.partnerships')}
                  </div>
                </div>
                <div class="text-gold text-2xl">•</div>
                <div class="bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
                  <div class="text-2xl font-bold text-gold">{usersCount}</div>
                  <div class="text-white text-sm">
                    {$t('home.stats.members')}
                  </div>
                </div>
                <div class="text-gold text-2xl">•</div>
                <div class="bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
                  <div class="text-2xl font-bold text-gold">{membersCount}</div>
                  <div class="text-white text-sm">חתמו על ההסכמה</div>
                </div>
              </div>
            </div>
          {:else}
            <div
              class="text-center text-white font-semibold"
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
              class="transition-all duration-300 flex flex-row justify-center items-center text-barbi px-4 py-2 text-xl bg-white hover:text-slate-800 rounded-xl shadow-lg"
              onclick={() => {
                goto('/login');
                loadinga = true;
                fi = true;
              }}
            >
              {$t('home.cta.login')}
            </button>
            <button
              class="transition-all duration-300 text-barbi px-4 py-2 text-xl bg-gold hover:text-slate-800 rounded-xl flex flex-row justify-center items-center shadow-lg"
              onclick={() => {
                goto(
                  `${$locale == 'he' ? '/hascama' : $locale == 'ar' ? '/aitifaqia' : '/convention'}`
                );
                loading = true;
                fi = true;
              }}
            >
              {$t('home.cta.register')}
            </button>
          </div>
        </div>
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
  .sababa > span,
  .sababa > div > span {
    font-family: 'Sababa', system-ui !important;
    text-shadow: none;
  }
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
