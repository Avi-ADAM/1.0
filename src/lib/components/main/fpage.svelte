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
  let headlines = $derived([
    $t('home.hero.headline1'),
    $t('home.hero.headline2'),
    $t('home.hero.headline3')
  ]);

  let btna = $state(false);

  let btnb = $state(false);

  let scrolli = $state(false);

  let loading = $state(false),
    loadinga = $state(false),
    w = $state(0),
    h = $state(0),
    fi = $state(false),
    trans = $state(false);
  //רוצה להתפרנס מהתשוקה.אהבה שלך
  //w*1.8 < h ? w : h > 639 ? w*0.8 : h

  import { Head } from 'svead';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';

  let image = `https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png`;

  let projectsCount = $state(0);
  let membersCount = $state(0);
  let statsLoaded = $state(false);

  let pageurl = {
    ar: 'https://1lev1.com/ar',
    en: 'https://1lev1.com/en',
    he: 'https://1lev1.com/he'
  };
  let size = $derived({
    width: w < 320 ? w : Math.min(w * 1.15, h * 1.5), // הגבל רוחב לפי יחס גובה
    height: w > 320 ? Math.min(h, w * 0.8) : h / 2 // הגבל גובה לפי יחס רוחב
  });
  $effect(() => {
    console.log(size, h);
  });

  // פונקציה לטעינת נתוני הסטטיסטיקות
  async function loadStats() {
    try {
      // קבלת מספר הפרויקטים
      const projectsResult = await sendToSer(
        {},
        '66getProjectsCount',
        0,
        0,
        true, // isSer = true כדי לאפשר גישה למשתמשים לא רשומים
        fetch
      );

      // קבלת מספר החברים
      const membersResult = await sendToSer(
        {},
        '67getMembersCount',
        0,
        0,
        true, // isSer = true כדי לאפשר גישה למשתמשים לא רשומים
        fetch
      );

      if (projectsResult?.data?.projects?.meta?.pagination?.total) {
        projectsCount = projectsResult.data.projects.meta.pagination.total;
      }

      if (membersResult?.data?.chezins?.meta?.pagination?.total) {
        membersCount = membersResult.data.chezins.meta.pagination.total;
      }

      statsLoaded = true;
    } catch (error) {
      console.error('Error loading stats:', error);
      statsLoaded = true; // עדיין מציינים שהטעינה הסתיימה
    }
  }

  onMount(() => {
    loadStats();
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
  class="h-screen w-screen flex flex-col-reverse sm:flex-row button-whitegold overflow-hidden bg-[length:200%_auto] animate-gradientx"
>
  <div
    id="text"
    class="z-10 flex flex-col text-center align-middle justify-center items-center sm:w-1/2 h-2/3 sm:h-screen"
  >
    <img
      src="https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png"
      alt="logo"
      class="sm:w-24 mt-2 h-6 w-6 sm:h-24 z-0"
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
    <div
      class="overflow-auto d"
      dir={$locale === 'he' || $locale === 'ar' ? 'rtl' : 'ltr'}
      onscroll={() => {
        scrolli = true;
        setTimeout(() => (scrolli = false), 1500);
      }}
    >
      <h2
        class="font-bold mt-3 sm:text-5xl text-transparent bg-clip-text bg-[length:200%_auto] animate-gradientx bg-[linear-gradient(to_left,theme(colors.fuchsia.300),theme(colors.sky.400),theme(colors.barbi),theme(colors.mpink),theme(colors.barbi),theme(colors.sky.400),theme(colors.fuchsia.300))] overline decoration-mturk text-xl"
        style="text-shadow:none;"
      >
        {$t('home.hero.subtitle')}
      </h2>

      <h3
        class="sababa text-2xl sm:text-3xl p-2 px-2 text-transparent bg-clip-text bg-[length:200%_auto] animate-gradientx bg-goldGrad"
        style="font-family: Sababa, system-ui;text-shadow:none;"
      >
        <AnimatedHeadline
          texts={headlines}
          wait={3000}
          fade={500}
          slide={300}
          y={0}
        />
      </h3>

      <div
        class="intro-questions relative bg-gradient-to-r from-[#c67c7f] via-barbi to-[#c67c7f] p-4 my-4 rounded-lg shadow-lg border-2 border-"
      >
        <div class="absolute inset-0 overflow-hidden opacity-10">
          <span class="absolute text-6xl font-bold text-white">?</span>
          <span class="absolute right-0 text-6xl font-bold text-white">?</span>
        </div>
        <p
          class="text-xl sm:text-2xl mb-2 text-white font-semibold relative"
          style="font-family: 'Sababa', sans-serif;"
        >
          {$t('home.intro.q1')}
        </p>
        <p
          class="text-xl sm:text-2xl text-white font-semibold relative"
          style="font-family: 'Sababa', sans-serif;"
        >
          {$t('home.intro.q2')}
        </p>
      </div>

      <div dir={$locale === 'he' || $locale === 'ar' ? 'rtl' : 'ltr'}>
        <Tile
          bg={'neww'}
          big={true}
          sm={true}
          reverse={true}
          openi={true}
          word={$t('home.features.welcome')}
        />
        <Tile
          bg={'neww'}
          big={true}
          sm={true}
          reverse={true}
          openi={true}
          word={$t('home.features.createRikma')}
        />
        <Tile
          bg={'neww'}
          big={true}
          sm={true}
          reverse={true}
          openi={true}
          word={$t('home.features.joinRikma')}
        />
        <Tile
          bg={'neww'}
          big={true}
          sm={true}
          reverse={true}
          openi={true}
          word={$t('home.features.livelihood')}
        />
        <Tile
          bg={'neww'}
          big={true}
          sm={true}
          reverse={true}
          openi={true}
          word={$t('home.features.sharedManagement')}
        />
        <Tile
          bg={'neww'}
          big={true}
          sm={true}
          reverse={true}
          openi={true}
          word={$t('home.features.transparency')}
        />
        <Tile
          bg={'neww'}
          big={true}
          sm={true}
          reverse={true}
          openi={true}
          word={$t('home.features.tools')}
        />
        <Tile
          bg={'neww'}
          big={true}
          sm={true}
          reverse={true}
          openi={true}
          word={$t('home.features.ownership')}
        />
        <Tile
          bg={'neww'}
          big={true}
          sm={true}
          reverse={true}
          openi={true}
          word={$t('home.features.formula')}
        />
        <Tile
          bg={'gold'}
          big={true}
          sm={true}
          word={$t('home.features.mission')}
        />
      </div>
      <!-- סטטיסטיקות האתר -->
      <div
        class="bg-gradient-to-br from-sky-400 via-mturk to-sky-400 px-4 py-3 mt-2 rounded-lg border-2 border-gold shadow-lg"
      >
        {#if statsLoaded}
          <div class="text-center">
            <p
              class="text-white font-semibold text-lg mb-2"
              style="font-family: 'Sababa', sans-serif;"
            >
              {$t('home.stats.currently')}
            </p>
            <div class="flex justify-center items-center gap-4 flex-wrap">
              <div class="bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
                <div class="text-2xl font-bold text-gold">{projectsCount}</div>
                <div class="text-white text-sm">
                  {$t('home.stats.partnerships')}
                </div>
              </div>
              <div class="text-gold text-2xl">•</div>
              <div class="bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
                <div class="text-2xl font-bold text-gold">{membersCount}</div>
                <div class="text-white text-sm">{$t('home.stats.members')}</div>
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

      <div
        class="bg-gradient-to-br from-[#c67c7f] via-barbi to-[#c67c7f] px-3 py-4 mt-1 border-4 border-spacing-2"
      >
        <h2
          style="text-shadow:none;"
          class="text-bold sm:text-2xl text-xl mx-6 text-transparent bg-clip-text bg-[length:200%_auto] animate-gradientx bg-[linear-gradient(to_right,theme(colors.gra),theme(colors.grb),theme(colors.grc),theme(colors.grd),theme(colors.gre),theme(colors.grd),theme(colors.grc),theme(colors.grb),theme(colors.gra))]"
        >
          {$t('home.cta.agree')}<a
            class="text-gold hover:text-lturk font-bold underline"
            href="/love">{$t('home.cta.agreementMap')}</a
          >
          {$t('home.cta.agreeEnd')}
        </h2>
      </div>
    </div>
    <div style="font-family:Gan, Power;" class="flex flex-row">
      <button
        class="transition-all duration-300 flex flex-row text-barbi px-4 py-2 mx-2 my-4 text-2xl hover:text-slate-800 rounded-xl"
        onclick={() => {
          goto('/login');
          loadinga = true;
          fi = true;
        }}
        class:button-perl={btna == false}
        class:button-gold={btna == true}
        onfocus={() => (btna = true)}
        onmouseover={() => (btna = true)}
        onmouseleave={() => (btna = false)}
        >{$t('home.cta.login')}
        {#if btna == true && loadinga == false}
          <span class="mx-2 mb-0.5"
            ><Arrow
              back={$lang == 'he' || $lang == 'ar' ? false : true}
              height="32"
              color={'var(--gold)'}
              fill="var(--barbi-pink)"
            /></span
          >
        {/if}
        {#if loadinga == true}
          <Lowding width="24px" height="24px" />
        {/if}
      </button>
      <button
        class="transition-all duration-300 text-barbi px-4 py-2 mx-2 my-4 text-2xl hover:text-slate-800 rounded-xl flex flex-row"
        onclick={() => {
          goto(
            `${$locale == 'he' ? '/hascama' : $locale == 'ar' ? '/aitifaqia' : '/convention'}`
          );
          loading = true;
          fi = true;
        }}
        class:button-perl={btnb == false}
        class:button-gold={btnb == true}
        onfocus={() => (btnb = true)}
        onmouseover={() => (btnb = true)}
        onmouseleave={() => (btnb = false)}
        >{$t('home.cta.register')}
        {#if btnb == true && loading == false}
          <span class="mx-2 mb-0.5"
            ><Arrow
              back={$locale == 'he' || $locale == 'ar' ? false : true}
              height="32"
              color={'var(--gold)'}
              fill="var(--barbi-pink)"
            /></span
          >
        {/if}
        {#if loading == true}
          <Lowding width="24px" height="24px" />
        {/if}
      </button>
    </div>
  </div>
  <div
    id="levi"
    bind:clientHeight={h}
    bind:clientWidth={w}
    class:flex={$progress == 1}
    class="sm:w-1/2 h-1/3 sm:h-screen z-0 items-center justify-center sm:justify-end"
  >
    {#if $progress < 1}
      <div
        class="w-full h-full sm:h-screen flex flex-col items-center justify-end sm:justify-center"
        title={$t('home.loading.title')}
      >
        <img
          class="ani"
          src="https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png"
          alt="logo"
        />
        <CircleProgresBar progress={$progress} />
      </div>
    {/if}
    <div class=" z-0">
      <!--- "gold coin" (https://skfb.ly/oyPLs) by alex.yefremov is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).-->
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

  /* Keyframes */
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
