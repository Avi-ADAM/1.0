<script>
  import { locale, t, isRtl } from '$lib/translations';
  import { fly } from 'svelte/transition';
  import { cubicIn, cubicOut } from 'svelte/easing';
  import { goto } from '$app/navigation';
  import { Head } from 'svead';
  import { onMount } from 'svelte';
  import { lang, langUs, doesLang } from '$lib/stores/lang';

  const regPath = $derived(
    $locale === 'he'
      ? '/hascama'
      : $locale === 'ar'
        ? '/aitifaqia'
        : '/convention'
  );

  function gotoRegister() {
    goto(regPath);
  }
  function gotoWish() {
    goto('/wish/new');
  }
  function gotoLogin() {
    goto('/login');
  }

  function scrollToId(id) {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  let headlines = $derived([
    $t('grow.hero.h1'),
    $t('grow.hero.h2'),
    $t('grow.hero.h3'),
    $t('grow.hero.h4'),
    $t('grow.hero.h5')
  ]);
  let current = $state(0);
  let dir = $derived($locale === 'he' || $locale === 'ar' ? 1 : -1);
  $effect(() => {
    if (headlines.length <= 1) return;
    const id = setInterval(() => {
      current = (current + 1) % headlines.length;
    }, 3800);
    return () => clearInterval(id);
  });

  const image =
    'https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png';
  const pageurl = {
    ar: 'https://1lev1.com/grow',
    en: 'https://1lev1.com/grow',
    he: 'https://1lev1.com/grow',
    ru: 'https://1lev1.com/grow'
  };

  let projectsCount = $state(0);
  let membersCount = $state(0);
  let usersCount = $state(0);
  let statsLoaded = $state(false);

  async function loadStats() {
    try {
      const res = await fetch('/api/stat');
      if (!res.ok) throw new Error('stat fetch failed');
      const data = await res.json();
      projectsCount = data.projects ?? 0;
      membersCount = data.members ?? 0;
      usersCount = data.users ?? 0;
    } catch (e) {
      console.error('Error loading stats:', e);
    } finally {
      statsLoaded = true;
    }
  }

  onMount(loadStats);

  let trans = $state(false);

  function change(lan) {
    doesLang.set(true);
    langUs.set(lan);
    lang.set(lan);
    locale.set(lan);
    document.cookie = `lang=${lan}; expires=` + new Date(2027, 0, 1).toUTCString();
    trans = false;
  }
</script>

{#snippet utilityNav(compact = false)}
  {#if trans === false}
    <button type="button" onclick={() => (trans = !trans)}>
      <img
        class="shadow-xl rounded {compact ? 'w-7 h-7' : ''}"
        alt="translat-icon"
        src="https://res.cloudinary.com/love1/image/upload/v1639345051/icons8-translate-app_gwpwcn.svg"
      />
    </button>
  {:else}
    <button
      type="button"
      onclick={() => (trans = !trans)}
      class="text-emerald-700 hover:text-amber-600 p-0.5"
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
        class="text-emerald-900 border-2 border-emerald-300 font-bold hover:text-amber-50 bg-amber-200 text-center hover:bg-emerald-700 px-1.5 py-0.5 rounded text-base sm:text-sm whitespace-nowrap"
      >
        {$t('home.languages.en')}
      </button>
    {/if}
    {#if $lang != 'ar'}
      <button
        type="button"
        onclick={() => change('ar')}
        title="change language to Arabic"
        class="text-emerald-900 border-2 border-emerald-300 font-bold hover:text-amber-50 bg-amber-200 text-center hover:bg-emerald-700 px-1.5 py-0.5 rounded text-base sm:text-sm whitespace-nowrap"
      >
        {$t('home.languages.ar')}
      </button>
    {/if}
    {#if $lang != 'he'}
      <button
        type="button"
        onclick={() => change('he')}
        title="change language to Hebrew"
        class="text-emerald-900 border-2 border-emerald-300 font-bold hover:text-amber-50 bg-amber-200 text-center hover:bg-emerald-700 px-1.5 py-0.5 rounded text-base sm:text-sm whitespace-nowrap"
      >
        {$t('home.languages.he')}
      </button>
    {/if}
    {#if $lang != 'ru'}
      <button
        type="button"
        onclick={() => change('ru')}
        title="change language to Russian"
        class="text-emerald-900 border-2 border-emerald-300 font-bold hover:text-amber-50 bg-amber-200 text-center hover:bg-emerald-700 px-1.5 py-0.5 rounded text-base sm:text-sm whitespace-nowrap"
      >
        {$t('home.languages.ru')}
      </button>
    {/if}
  {/if}
{/snippet}

<!-- Mobile lang selector (floating) -->
<div class="md:hidden fixed top-16 left-2 z-[699] flex flex-col gap-1">
  {@render utilityNav()}
</div>

<Head
  title={$t('grow.meta.title')}
  description={$t('grow.meta.description')}
  {image}
  url={pageurl[$locale] ?? pageurl.he}
/>

<div
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="grow-page min-h-screen w-full overflow-x-hidden text-emerald-950 bg-gradient-to-b from-[#f4faf1] via-[#ebf6e7] to-[#f0f4e3] selection:bg-emerald-200 selection:text-emerald-900"
  style="font-family:'Sababa', sans-serif;"
>
  <!-- ===== Sticky header ===== -->
  <header
    class="sticky top-0 z-50 flex items-center gap-3 px-4 sm:px-8 py-3 bg-[#f4faf1]/90 backdrop-blur-md border-b border-emerald-200/50 shadow-sm"
  >
    <a href="/" class="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
      <img
        src={image}
        alt="1lev1"
        class="w-10 h-10 drop-shadow transition-transform hover:rotate-6 duration-300"
      />
      <span class="font-bold text-emerald-800 text-xl tracking-tight select-none">1💗1</span>
    </a>
    <nav
      class="hidden md:flex flex-1 items-center justify-center gap-6 text-emerald-800 font-semibold text-sm lg:text-base"
    >
      <button
        type="button"
        class="hover:text-amber-600 transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-amber-500 hover:after:w-full after:transition-all"
        onclick={() => scrollToId('barriers')}>{$t('grow.nav.barriers')}</button
      >
      <button
        type="button"
        class="hover:text-amber-600 transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-amber-500 hover:after:w-full after:transition-all"
        onclick={() => scrollToId('weave')}>{$t('grow.nav.weave')}</button
      >
      <button
        type="button"
        class="hover:text-amber-600 transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-amber-500 hover:after:w-full after:transition-all"
        onclick={() => scrollToId('demand')}>{$t('grow.nav.demand')}</button
      >
      <button
        type="button"
        class="hover:text-amber-600 transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-amber-500 hover:after:w-full after:transition-all"
        onclick={() => scrollToId('how')}>{$t('grow.nav.how')}</button
      >
      <button
        type="button"
        class="hover:text-amber-600 transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-amber-500 hover:after:w-full after:transition-all"
        onclick={() => scrollToId('who')}>{$t('grow.nav.who')}</button
      >
    </nav>
    <div class="flex-1 md:flex-none"></div>
    <!-- Desktop lang selector -->
    <div
      class="hidden md:flex items-center gap-2"
      class:flex-row={trans}
      class:flex-wrap={trans}
    >
      {@render utilityNav(true)}
    </div>
    <button
      type="button"
      class="shrink-0 bg-emerald-700 text-amber-50 hover:bg-emerald-800 font-bold px-5 py-2 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 whitespace-nowrap text-sm"
      onclick={gotoRegister}
    >
      {$t('grow.nav.join')}
    </button>
  </header>

  <!-- ===== Hero ===== -->
  <section
    class="relative overflow-hidden px-4 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center"
  >
    <div
      class="pointer-events-none absolute -top-40 -start-40 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl"
    ></div>
    <div
      class="pointer-events-none absolute -bottom-40 -end-40 w-[30rem] h-[30rem] rounded-full bg-amber-200/20 blur-3xl"
    ></div>

    <div class="relative max-w-4xl mx-auto">
      <div
        class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/60 border border-emerald-200/50 text-emerald-800 font-medium text-xs sm:text-sm mb-6"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
        ></span>
        {$t('grow.hero.eyebrow')}
      </div>

      <div
        class="relative min-h-[6rem] sm:min-h-[8rem] mb-8 flex items-center justify-center"
      >
        {#key current}
          <h1
            class="absolute inset-x-0 mx-auto max-w-3xl font-extrabold leading-tight text-3xl sm:text-5xl lg:text-6xl
              bg-clip-text text-transparent bg-gradient-to-r from-emerald-800 via-emerald-700 to-amber-700"
            in:fly={{ x: dir * 50, duration: 500, easing: cubicOut }}
            out:fly={{ x: dir * -50, duration: 450, easing: cubicIn }}
          >
            {headlines[current]}
          </h1>
        {/key}
      </div>

      <p
        class="text-emerald-900/80 text-lg sm:text-xl leading-relaxed max-w-3xl mx-auto mb-10 font-normal"
      >
        {$t('grow.hero.sub')}
      </p>

      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button
          type="button"
          class="w-full sm:w-auto bg-emerald-700 text-amber-50 hover:bg-emerald-800 font-bold text-lg px-8 py-4 rounded-2xl shadow-xl hover:shadow-emerald-900/20 hover:-translate-y-0.5 transition-all duration-300"
          onclick={gotoRegister}
        >
          {$t('grow.hero.ctaPrimary')}
        </button>
        <button
          type="button"
          class="w-full sm:w-auto bg-white hover:bg-amber-50 text-emerald-900 border-2 border-emerald-700/20 font-bold text-lg px-8 py-4 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          onclick={gotoWish}
        >
          {$t('grow.hero.ctaSecondary')}
        </button>
      </div>
    </div>
  </section>

  <div
    class="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col gap-24 sm:gap-32 pb-32"
  >
    <!-- ===== Barriers (האתגרים) ===== -->
    <section id="barriers" class="scroll-mt-24">
      <div class="text-center mb-12">
        <h2 class="text-emerald-900 font-extrabold text-3xl sm:text-4xl mb-4">
          {$t('grow.problem.title')}
        </h2>
        <p class="text-emerald-900/70 text-lg max-w-2xl mx-auto">
          {$t('grow.problem.lead')}
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {#each ['b1', 'b2', 'b3', 'b4'] as b}
          <div
            class="flex items-start gap-4 bg-white/60 backdrop-blur-sm border border-rose-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-rose-200 transition-all duration-300"
          >
            <span
              class="shrink-0 w-7 h-7 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-xs font-bold border border-rose-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </span>
            <p
              class="text-emerald-950 text-base leading-relaxed text-start font-medium"
            >
              {$t(`grow.problem.${b}`)}
            </p>
          </div>
        {/each}
      </div>

      <div class="mt-12 text-center max-w-2xl mx-auto">
        <p class="text-rose-600/90 font-medium italic text-lg sm:text-xl mb-6">
          {$t('grow.problem.cost')}
        </p>
        <div
          class="inline-block p-0.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600 shadow-xl"
        >
          <p
            class="bg-[#f4faf1] text-emerald-900 font-bold text-lg sm:text-xl px-8 py-3.5 rounded-[14px]"
          >
            {$t('grow.problem.turn')}
          </p>
        </div>
      </div>
    </section>

    <!-- ===== Weave (ריקמה כשותפות חיה) - Cellular Bento Layout ===== -->
    <section id="weave" class="scroll-mt-24">
      <div class="text-center mb-12">
        <h2 class="text-emerald-900 font-extrabold text-3xl sm:text-4xl mb-4">
          {$t('grow.weave.title')}
        </h2>
        <p
          class="text-emerald-900/70 text-lg max-w-3xl mx-auto leading-relaxed"
        >
          {$t('grow.weave.sub')}
        </p>
      </div>

      <!-- Bento-style Grid layout with cellular (asymmetric rounded) shapes -->
      <div class="grid grid-cols-1 md:grid-cols-6 gap-6">
        <!-- r1 -->
        <div
          class="md:col-span-3 bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-[2.5rem] rounded-tr-xl rounded-bl-xl p-8 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <div
              class="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5 text-emerald-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 class="font-bold text-xl text-emerald-900 mb-2">
              {$t('grow.weave.r1_t')}
            </h3>
            <p class="text-emerald-950/80 text-base leading-relaxed">
              {$t('grow.weave.r1_d')}
            </p>
          </div>
        </div>

        <!-- r2 -->
        <div
          class="md:col-span-3 bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-[2.5rem] rounded-tl-xl rounded-br-xl p-8 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <div
              class="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5 text-emerald-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </div>
            <h3 class="font-bold text-xl text-emerald-900 mb-2">
              {$t('grow.weave.r2_t')}
            </h3>
            <p class="text-emerald-950/80 text-base leading-relaxed">
              {$t('grow.weave.r2_d')}
            </p>
          </div>
        </div>

        <!-- r3 -->
        <div
          class="md:col-span-2 bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-[2.5rem] rounded-tr-xl rounded-bl-xl p-8 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <div
              class="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5 text-emerald-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 class="font-bold text-xl text-emerald-900 mb-2">
              {$t('grow.weave.r3_t')}
            </h3>
            <p class="text-emerald-950/80 text-base leading-relaxed">
              {$t('grow.weave.r3_d')}
            </p>
          </div>
        </div>

        <!-- r4 -->
        <div
          class="md:col-span-2 bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-[2.5rem] rounded-tl-xl rounded-br-xl p-8 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <div
              class="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5 text-emerald-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h3 class="font-bold text-xl text-emerald-900 mb-2">
              {$t('grow.weave.r4_t')}
            </h3>
            <p class="text-emerald-950/80 text-base leading-relaxed">
              {$t('grow.weave.r4_d')}
            </p>
          </div>
        </div>

        <!-- r5 (Nervous system highlighted layout) -->
        <div
          class="md:col-span-2 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-300/60 rounded-[2.5rem] rounded-tr-xl rounded-bl-xl p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <div
              class="w-12 h-12 rounded-2xl bg-amber-200/50 flex items-center justify-center mb-5 text-amber-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 class="font-bold text-xl text-amber-900 mb-2">
              {$t('grow.weave.r5_t')}
            </h3>
            <p class="text-emerald-950/90 text-base leading-relaxed">
              {$t('grow.weave.r5_d')}
            </p>
          </div>
        </div>

        <!-- Full width statement -->
        <div
          class="md:col-span-6 bg-emerald-800 text-amber-50 rounded-[2.5rem] rounded-tl-xl rounded-br-xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row items-center gap-6 justify-between border border-emerald-900"
        >
          <p
            class="text-lg font-medium leading-relaxed max-w-4xl text-center md:text-start"
          >
            {$t('grow.weave.note')}
          </p>
          <button
            type="button"
            class="bg-amber-400 text-emerald-950 hover:bg-amber-300 font-bold px-7 py-3.5 rounded-2xl shadow-md transition-all whitespace-nowrap hover:scale-105 duration-300"
            onclick={gotoRegister}
          >
            {$t('grow.nav.join')}
          </button>
        </div>
      </div>
    </section>

    <!-- ===== Demand-first (ביקוש תחילה) ===== -->
    <section id="demand" class="scroll-mt-24">
      <div
        class="rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 text-amber-50 px-6 sm:px-12 py-12 sm:py-16 shadow-xl relative overflow-hidden border border-emerald-900"
      >
        <div
          class="pointer-events-none absolute -bottom-24 -start-24 w-72 h-72 rounded-full bg-emerald-600/30 blur-2xl"
        ></div>

        <div class="relative z-10">
          <h2 class="font-extrabold text-3xl sm:text-4xl text-center mb-4">
            {$t('grow.demand.title')}
          </h2>
          <p
            class="text-center text-amber-50/85 text-lg max-w-2xl mx-auto mb-12"
          >
            {$t('grow.demand.sub')}
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {#each ['p1', 'p2', 'p3'] as p, i}
              <div
                class="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/15 hover:scale-[1.02]"
              >
                <div
                  class="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 font-bold flex items-center justify-center mb-4 shadow"
                >
                  {i + 1}
                </div>
                <p class="text-amber-50/95 text-base leading-relaxed">
                  {$t(`grow.demand.${p}`)}
                </p>
              </div>
            {/each}
          </div>

          <div class="mt-12 text-center">
            <p
              class="inline-block text-emerald-950 font-bold text-lg sm:text-xl bg-amber-300 px-8 py-4 rounded-2xl shadow-lg max-w-2xl"
            >
              {$t('grow.demand.basket')}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Two paths (שתי דרכים) ===== -->
    <section class="scroll-mt-24">
      <h2
        class="text-emerald-900 font-extrabold text-3xl sm:text-4xl text-center mb-10"
      >
        {$t('grow.paths.title')}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <!-- Path 1 -->
        <div
          class="bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <div
              class="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5 text-emerald-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 class="font-bold text-xl text-emerald-900 mb-3">
              {$t('grow.paths.simple_t')}
            </h3>
            <p class="text-emerald-950/80 text-base leading-relaxed mb-6">
              {$t('grow.paths.simple_d')}
            </p>
          </div>
        </div>

        <!-- Path 2 -->
        <div
          class="bg-gradient-to-br from-amber-50 to-emerald-50 border border-amber-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <div
              class="w-12 h-12 rounded-2xl bg-amber-100/50 flex items-center justify-center mb-5 text-amber-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 class="font-bold text-xl text-emerald-900 mb-3">
              {$t('grow.paths.economy_t')}
            </h3>
            <p class="text-emerald-950/80 text-base leading-relaxed mb-6">
              {$t('grow.paths.economy_d')}
            </p>
          </div>
        </div>
      </div>

      <p
        class="text-center text-emerald-700 font-semibold text-base sm:text-lg mt-8 bg-emerald-50/60 border border-emerald-100 inline-block px-6 py-2.5 rounded-full mx-auto left-0 right-0"
      >
        {$t('grow.paths.note')}
      </p>
    </section>

    <!-- ===== How it works (איך מתחילים) ===== -->
    <section id="how" class="scroll-mt-24">
      <h2
        class="text-emerald-900 font-extrabold text-3xl sm:text-4xl text-center mb-12"
      >
        {$t('grow.how.title')}
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {#each ['s1', 's2', 's3', 's4'] as s, i}
          <div
            class="relative bg-white/70 backdrop-blur-sm border border-emerald-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div
              class="absolute -top-3 {$isRtl
                ? '-start-3'
                : '-end-3'} w-8 h-8 rounded-xl bg-emerald-700 text-amber-50 font-bold flex items-center justify-center shadow-md"
            >
              {i + 1}
            </div>
            <h3 class="font-bold text-lg text-emerald-900 mb-2 mt-1">
              {$t(`grow.how.${s}_t`)}
            </h3>
            <p class="text-emerald-950/80 text-base leading-relaxed">
              {$t(`grow.how.${s}_d`)}
            </p>
          </div>
        {/each}
      </div>
    </section>

    <!-- ===== Who it's for (למי זה מתאים) ===== -->
    <section id="who" class="scroll-mt-24">
      <div class="text-center mb-12">
        <h2 class="text-emerald-900 font-extrabold text-3xl sm:text-4xl mb-4">
          {$t('grow.who.title')}
        </h2>
        <p class="text-emerald-900/70 text-lg max-w-2xl mx-auto">
          {$t('grow.who.sub')}
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each [{ key: 'w1', color: 'bg-emerald-50 text-emerald-700', svg: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }, { key: 'w2', color: 'bg-amber-50 text-amber-800', svg: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' }, { key: 'w3', color: 'bg-emerald-50 text-emerald-700', svg: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' }, { key: 'w4', color: 'bg-amber-50 text-amber-800', svg: 'M17 20h5-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }, { key: 'w5', color: 'bg-emerald-50 text-emerald-700', svg: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' }] as w}
          <div
            class="bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 flex flex-col items-center text-center"
          >
            <div
              class="w-12 h-12 rounded-2xl {w.color} flex items-center justify-center mb-4 shadow-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d={w.svg}
                />
              </svg>
            </div>
            <h3 class="font-bold text-lg text-emerald-900 mb-2">
              {$t(`grow.who.${w.key}_t`)}
            </h3>
            <p class="text-emerald-950/80 text-base leading-relaxed">
              {$t(`grow.who.${w.key}_d`)}
            </p>
          </div>
        {/each}
      </div>
    </section>

    <!-- ===== Values (ערכים) ===== -->
    <section class="scroll-mt-24">
      <h2
        class="text-emerald-900 font-extrabold text-3xl sm:text-4xl text-center mb-12"
      >
        {$t('grow.values.title')}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {#each [{ key: 'v1', svg: 'M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2M7 9a5 5 0 117.5-3' }, { key: 'v2', svg: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }, { key: 'v3', svg: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' }] as v}
          <div
            class="bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-100 rounded-3xl p-8 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 text-center flex flex-col items-center"
          >
            <div
              class="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5 text-emerald-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d={v.svg}
                />
              </svg>
            </div>
            <h3 class="font-bold text-xl text-emerald-900 mb-3">
              {$t(`grow.values.${v.key}_t`)}
            </h3>
            <p class="text-emerald-950/80 text-base leading-relaxed">
              {$t(`grow.values.${v.key}_d`)}
            </p>
          </div>
        {/each}
      </div>
    </section>

    <!-- ===== Stats ===== -->
    {#if statsLoaded && (projectsCount || usersCount || membersCount)}
      <section
        class="flex justify-center items-stretch gap-4 flex-wrap max-w-2xl mx-auto"
      >
        <div
          class="bg-emerald-800 text-amber-50 rounded-2xl px-6 py-5 shadow-md flex-1 min-w-[140px] text-center border border-emerald-900/40"
        >
          <div class="text-4xl font-extrabold text-amber-300 mb-1">
            {projectsCount}
          </div>
          <div class="text-amber-50/90 text-xs sm:text-sm font-semibold">
            {$t('home.sections.proofStatProjects')}
          </div>
        </div>
        <div
          class="bg-emerald-800 text-amber-50 rounded-2xl px-6 py-5 shadow-md flex-1 min-w-[140px] text-center border border-emerald-900/40"
        >
          <div class="text-4xl font-extrabold text-amber-300 mb-1">
            {usersCount}
          </div>
          <div class="text-amber-50/90 text-xs sm:text-sm font-semibold">
            {$t('home.sections.proofStatMembers')}
          </div>
        </div>
        <div
          class="bg-emerald-800 text-amber-50 rounded-2xl px-6 py-5 shadow-md flex-1 min-w-[140px] text-center border border-emerald-900/40"
        >
          <div class="text-4xl font-extrabold text-amber-300 mb-1">
            {membersCount}
          </div>
          <div class="text-amber-50/90 text-xs sm:text-sm font-semibold">
            {$t('home.sections.proofStatSigners')}
          </div>
        </div>
      </section>
    {/if}

    <!-- ===== Final CTA ===== -->
    <section>
      <div
        class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-amber-700 px-6 sm:px-12 py-16 shadow-xl text-center border border-emerald-900"
      >
        <div
          class="pointer-events-none absolute -top-24 -end-24 w-80 h-80 rounded-full bg-amber-500/20 blur-3xl"
        ></div>

        <div class="relative z-10">
          <h2 class="text-amber-50 font-extrabold text-3xl sm:text-4xl mb-4">
            {$t('grow.cta.title')}
          </h2>
          <p
            class="text-amber-50/90 text-lg sm:text-xl max-w-2xl mx-auto mb-10"
          >
            {$t('grow.cta.sub')}
          </p>
          <div
            class="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto"
          >
            <button
              type="button"
              class="w-full sm:flex-1 bg-amber-400 text-emerald-950 font-bold text-lg px-7 py-4 rounded-2xl shadow-lg hover:bg-amber-300 hover:scale-105 transition-all duration-300"
              onclick={gotoRegister}
            >
              {$t('grow.cta.register')}
            </button>
            <button
              type="button"
              class="w-full sm:flex-1 bg-white text-emerald-950 font-bold text-lg px-7 py-4 rounded-2xl shadow-md hover:bg-amber-50 hover:scale-105 transition-all duration-300"
              onclick={gotoWish}
            >
              {$t('grow.cta.wish')}
            </button>
            <button
              type="button"
              class="w-full sm:w-auto bg-transparent border-2 border-amber-50/50 text-amber-50 font-semibold text-base px-6 py-4 rounded-2xl hover:bg-amber-50/10 transition-all duration-300"
              onclick={gotoLogin}
            >
              {$t('grow.cta.login')}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</div>
