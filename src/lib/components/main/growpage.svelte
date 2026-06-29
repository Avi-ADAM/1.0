<script>
  import { locale, t, isRtl } from '$lib/translations';
  import { fly } from 'svelte/transition';
  import { cubicIn, cubicOut } from 'svelte/easing';
  import { goto } from '$app/navigation';
  import { Head } from 'svead';
  import { onMount } from 'svelte';

  // נתיב ההרשמה לפי שפה — זהה לדף הראשי (ביקוש‑תחילה: הספק נרשם, הלקוח מאחל).
  const regPath = $derived(
    $locale === 'he' ? '/hascama' : $locale === 'ar' ? '/aitifaqia' : '/convention'
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
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // כותרת מתחלפת — כמו בדף הראשי, נסיעה אופקית לפי כיוון השפה.
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
</script>

<Head
  title={$t('grow.meta.title')}
  description={$t('grow.meta.description')}
  {image}
  url={pageurl[$locale] ?? pageurl.he}
/>

<div
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="grow-page min-h-screen w-full overflow-x-hidden text-emerald-950 bg-gradient-to-b from-[#f5fbf2] via-[#eef7ec] to-[#f3f6e9]"
  style="font-family:'Sababa',sans-serif;"
>
  <!-- ===== Sticky header ===== -->
  <header
    class="sticky top-0 z-50 flex items-center gap-3 px-4 sm:px-8 py-2.5 bg-[#f5fbf2]/80 backdrop-blur-md border-b border-emerald-200/70 shadow-sm"
  >
    <img
      src={image}
      alt="1lev1"
      class="w-9 h-9 shrink-0 drop-shadow"
    />
    <span class="font-bold text-emerald-800 text-lg select-none">1💗1</span>
    <nav
      class="hidden md:flex flex-1 items-center justify-center gap-5 text-emerald-800 font-semibold text-sm lg:text-base"
    >
      <button type="button" class="hover:text-amber-600 transition-colors" onclick={() => scrollToId('barriers')}>{$t('grow.nav.barriers')}</button>
      <button type="button" class="hover:text-amber-600 transition-colors" onclick={() => scrollToId('weave')}>{$t('grow.nav.weave')}</button>
      <button type="button" class="hover:text-amber-600 transition-colors" onclick={() => scrollToId('demand')}>{$t('grow.nav.demand')}</button>
      <button type="button" class="hover:text-amber-600 transition-colors" onclick={() => scrollToId('how')}>{$t('grow.nav.how')}</button>
      <button type="button" class="hover:text-amber-600 transition-colors" onclick={() => scrollToId('who')}>{$t('grow.nav.who')}</button>
    </nav>
    <div class="flex-1 md:flex-none"></div>
    <button
      type="button"
      class="shrink-0 bg-emerald-700 text-amber-50 hover:bg-emerald-800 font-bold px-4 py-1.5 rounded-xl shadow-md hover:scale-105 transition-all duration-300 whitespace-nowrap text-sm"
      onclick={gotoRegister}
    >
      {$t('grow.nav.join')}
    </button>
  </header>

  <!-- ===== Hero ===== -->
  <section
    class="relative overflow-hidden px-4 sm:px-8 pt-12 pb-16 sm:pt-20 sm:pb-24 text-center"
  >
    <!-- decorative soft blobs -->
    <div class="pointer-events-none absolute -top-24 -start-24 w-80 h-80 rounded-full bg-emerald-300/30 blur-3xl"></div>
    <div class="pointer-events-none absolute -bottom-24 -end-24 w-96 h-96 rounded-full bg-amber-300/30 blur-3xl"></div>

    <div class="relative max-w-3xl mx-auto">
      <p class="text-emerald-700 font-semibold tracking-wide text-sm sm:text-base mb-5">
        {$t('grow.hero.eyebrow')}
      </p>

      <div class="relative min-h-[5.5rem] sm:min-h-[7rem] mb-6 overflow-hidden">
        {#key current}
          <h1
            class="absolute inset-0 flex items-center justify-center text-center font-extrabold leading-tight
              text-3xl sm:text-5xl
              bg-clip-text text-transparent bg-gradient-to-br from-emerald-700 via-emerald-600 to-amber-600"
            in:fly={{ x: dir * 60, duration: 450, easing: cubicOut }}
            out:fly={{ x: dir * -60, duration: 450, easing: cubicIn }}
          >
            {headlines[current]}
          </h1>
        {/key}
      </div>

      <p class="text-emerald-900/80 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-9">
        {$t('grow.hero.sub')}
      </p>

      <div class="flex flex-wrap gap-3 justify-center">
        <button
          type="button"
          class="bg-emerald-700 text-amber-50 hover:bg-emerald-800 font-bold text-lg px-7 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
          onclick={gotoRegister}
        >
          {$t('grow.hero.ctaPrimary')}
        </button>
        <button
          type="button"
          class="bg-amber-400 text-emerald-950 hover:bg-amber-300 font-bold text-lg px-7 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
          onclick={gotoWish}
        >
          {$t('grow.hero.ctaSecondary')}
        </button>
      </div>
    </div>
  </section>

  <div class="max-w-5xl mx-auto px-4 sm:px-8 flex flex-col gap-20 sm:gap-28 pb-24">
    <!-- ===== Barriers ===== -->
    <section id="barriers" class="scroll-mt-20">
      <h2 class="text-emerald-800 font-extrabold text-2xl sm:text-4xl text-center mb-2">
        {$t('grow.problem.title')}
      </h2>
      <p class="text-center text-emerald-900/70 text-base sm:text-lg max-w-2xl mx-auto mb-8">
        {$t('grow.problem.lead')}
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
        {#each ['b1', 'b2', 'b3', 'b4'] as b}
          <div
            class="flex items-start gap-3 bg-white/70 backdrop-blur-sm border border-rose-200 rounded-2xl px-5 py-4 shadow-sm"
          >
            <span
              class="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-sm font-bold"
              >✕</span
            >
            <p class="text-emerald-950 text-base leading-relaxed text-start">{$t(`grow.problem.${b}`)}</p>
          </div>
        {/each}
      </div>
      <p class="text-center text-rose-600 italic text-lg mt-6">{$t('grow.problem.cost')}</p>
      <div class="mt-6 text-center">
        <p
          class="inline-block bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 bg-[length:200%_auto] animate-gradientx text-white font-bold text-lg sm:text-xl px-7 py-3 rounded-2xl shadow-lg"
        >
          {$t('grow.problem.turn')}
        </p>
      </div>
    </section>

    <!-- ===== Weave (ריקמה) ===== -->
    <section id="weave" class="scroll-mt-20">
      <h2 class="text-emerald-800 font-extrabold text-2xl sm:text-4xl text-center mb-2">
        {$t('grow.weave.title')}
      </h2>
      <p class="text-center text-emerald-900/70 text-base sm:text-lg max-w-2xl mx-auto mb-9">
        {$t('grow.weave.sub')}
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each ['r1', 'r2', 'r3', 'r4', 'r5'] as r}
          <div
            class="relative flex flex-col rounded-3xl p-6 shadow-md border transition-transform duration-300 hover:-translate-y-1
              {r === 'r5'
                ? 'bg-gradient-to-br from-amber-200 via-amber-100 to-emerald-100 border-amber-300 lg:col-span-1'
                : 'bg-white/80 backdrop-blur-sm border-emerald-200'}"
          >
            <h3 class="font-bold text-xl text-emerald-800 mb-2">{$t(`grow.weave.${r}_t`)}</h3>
            <p class="text-emerald-950/80 text-base leading-relaxed">{$t(`grow.weave.${r}_d`)}</p>
          </div>
        {/each}
        <div
          class="flex items-center justify-center rounded-3xl p-6 bg-emerald-700 text-amber-50 shadow-md"
        >
          <p class="text-center text-lg font-semibold leading-relaxed">{$t('grow.weave.note')}</p>
        </div>
      </div>
    </section>

    <!-- ===== Demand-first ===== -->
    <section id="demand" class="scroll-mt-20">
      <div
        class="rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 text-amber-50 px-6 sm:px-12 py-10 sm:py-14 shadow-xl"
      >
        <h2 class="font-extrabold text-2xl sm:text-4xl text-center mb-3">{$t('grow.demand.title')}</h2>
        <p class="text-center text-amber-50/90 text-base sm:text-lg max-w-2xl mx-auto mb-9">
          {$t('grow.demand.sub')}
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {#each ['p1', 'p2', 'p3'] as p, i}
            <div class="bg-white/10 backdrop-blur-sm border border-amber-50/20 rounded-2xl p-5">
              <div
                class="w-9 h-9 rounded-full bg-amber-400 text-emerald-900 font-bold flex items-center justify-center mb-3"
              >
                {i + 1}
              </div>
              <p class="text-amber-50/95 text-base leading-relaxed">{$t(`grow.demand.${p}`)}</p>
            </div>
          {/each}
        </div>
        <p
          class="mt-9 text-center text-emerald-900 font-bold text-lg sm:text-xl bg-amber-300 inline-block px-6 py-3 rounded-2xl mx-auto w-full max-w-2xl"
        >
          {$t('grow.demand.basket')}
        </p>
      </div>
    </section>

    <!-- ===== Two paths ===== -->
    <section class="scroll-mt-20">
      <h2 class="text-emerald-800 font-extrabold text-2xl sm:text-4xl text-center mb-9">
        {$t('grow.paths.title')}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="bg-white/80 backdrop-blur-sm border-2 border-emerald-200 rounded-3xl p-7 shadow-md flex flex-col">
          <div class="text-4xl mb-3">💰</div>
          <h3 class="font-bold text-xl text-emerald-800 mb-2">{$t('grow.paths.simple_t')}</h3>
          <p class="text-emerald-950/80 text-base leading-relaxed">{$t('grow.paths.simple_d')}</p>
        </div>
        <div class="bg-gradient-to-br from-amber-100 to-emerald-50 border-2 border-amber-300 rounded-3xl p-7 shadow-md flex flex-col">
          <div class="text-4xl mb-3">🤝</div>
          <h3 class="font-bold text-xl text-emerald-800 mb-2">{$t('grow.paths.economy_t')}</h3>
          <p class="text-emerald-950/80 text-base leading-relaxed">{$t('grow.paths.economy_d')}</p>
        </div>
      </div>
      <p class="text-center text-emerald-700 font-semibold text-base sm:text-lg mt-6">
        {$t('grow.paths.note')}
      </p>
    </section>

    <!-- ===== How it works ===== -->
    <section id="how" class="scroll-mt-20">
      <h2 class="text-emerald-800 font-extrabold text-2xl sm:text-4xl text-center mb-9">
        {$t('grow.how.title')}
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {#each ['s1', 's2', 's3', 's4'] as s, i}
          <div
            class="relative bg-white/80 backdrop-blur-sm border-2 border-emerald-200 rounded-2xl p-6 shadow-md"
          >
            <div
              class="absolute -top-3 {$isRtl ? '-start-3' : '-end-3'} w-9 h-9 rounded-full bg-emerald-700 text-amber-50 font-bold flex items-center justify-center shadow"
            >
              {i + 1}
            </div>
            <h3 class="font-bold text-lg text-emerald-800 mb-1">{$t(`grow.how.${s}_t`)}</h3>
            <p class="text-emerald-950/80 text-base leading-relaxed">{$t(`grow.how.${s}_d`)}</p>
          </div>
        {/each}
      </div>
    </section>

    <!-- ===== Who it's for ===== -->
    <section id="who" class="scroll-mt-20">
      <h2 class="text-emerald-800 font-extrabold text-2xl sm:text-4xl text-center mb-2">
        {$t('grow.who.title')}
      </h2>
      <p class="text-center text-emerald-900/70 text-base sm:text-lg max-w-2xl mx-auto mb-9">
        {$t('grow.who.sub')}
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each [['🌍', 'w1'], ['🌿', 'w2'], ['🧑‍🌾', 'w3'], ['🏡', 'w4'], ['🥗', 'w5']] as [icon, w]}
          <div
            class="bg-white/80 backdrop-blur-sm border border-emerald-200 rounded-2xl p-6 shadow-sm flex flex-col text-center items-center"
          >
            <div class="text-4xl mb-2">{icon}</div>
            <h3 class="font-bold text-lg text-emerald-800 mb-1">{$t(`grow.who.${w}_t`)}</h3>
            <p class="text-emerald-950/80 text-base leading-relaxed">{$t(`grow.who.${w}_d`)}</p>
          </div>
        {/each}
      </div>
    </section>

    <!-- ===== Values ===== -->
    <section class="scroll-mt-20">
      <h2 class="text-emerald-800 font-extrabold text-2xl sm:text-4xl text-center mb-9">
        {$t('grow.values.title')}
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {#each ['v1', 'v2', 'v3'] as v}
          <div
            class="bg-gradient-to-br from-emerald-50 to-amber-50 border border-emerald-200 rounded-3xl p-7 shadow-sm text-center"
          >
            <h3 class="font-bold text-xl text-emerald-800 mb-2">{$t(`grow.values.${v}_t`)}</h3>
            <p class="text-emerald-950/80 text-base leading-relaxed">{$t(`grow.values.${v}_d`)}</p>
          </div>
        {/each}
      </div>
    </section>

    <!-- ===== Stats (live, shared with homepage) ===== -->
    {#if statsLoaded && (projectsCount || usersCount || membersCount)}
      <section class="flex justify-center items-stretch gap-3 flex-wrap">
        <div class="bg-emerald-700 text-amber-50 rounded-2xl px-6 py-4 shadow min-w-[120px] text-center">
          <div class="text-3xl font-extrabold">{projectsCount}</div>
          <div class="text-amber-50/90 text-sm">{$t('home.sections.proofStatProjects')}</div>
        </div>
        <div class="bg-emerald-700 text-amber-50 rounded-2xl px-6 py-4 shadow min-w-[120px] text-center">
          <div class="text-3xl font-extrabold">{usersCount}</div>
          <div class="text-amber-50/90 text-sm">{$t('home.sections.proofStatMembers')}</div>
        </div>
        <div class="bg-emerald-700 text-amber-50 rounded-2xl px-6 py-4 shadow min-w-[120px] text-center">
          <div class="text-3xl font-extrabold">{membersCount}</div>
          <div class="text-amber-50/90 text-sm">{$t('home.sections.proofStatSigners')}</div>
        </div>
      </section>
    {/if}

    <!-- ===== Final CTA ===== -->
    <section>
      <div
        class="rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-amber-600 px-6 sm:px-12 py-12 shadow-xl text-center"
      >
        <h2 class="text-amber-50 font-extrabold text-2xl sm:text-4xl mb-3">{$t('grow.cta.title')}</h2>
        <p class="text-amber-50/90 text-lg max-w-2xl mx-auto mb-8">{$t('grow.cta.sub')}</p>
        <div class="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            class="bg-amber-50 text-emerald-800 font-bold text-lg px-7 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
            onclick={gotoRegister}
          >
            {$t('grow.cta.register')}
          </button>
          <button
            type="button"
            class="bg-amber-400 text-emerald-950 font-bold text-lg px-7 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
            onclick={gotoWish}
          >
            {$t('grow.cta.wish')}
          </button>
          <button
            type="button"
            class="bg-transparent border-2 border-amber-50 text-amber-50 font-semibold text-lg px-7 py-3 rounded-2xl hover:bg-amber-50/10 transition-all duration-300"
            onclick={gotoLogin}
          >
            {$t('grow.cta.login')}
          </button>
        </div>
      </div>
    </section>
  </div>
</div>
