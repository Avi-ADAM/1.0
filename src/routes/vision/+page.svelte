<!--
  /vision - for the founder who has a dream and is looking for partners.

  /partnership answers "how should we split" for people who already have a
  partnership. This page answers the question one step earlier, which is the
  one founders actually ask: how does a vision become a working partnership
  at all? The usual route is a form, a WhatsApp group, a lot of enthusiasm and
  then a stall - nobody knows who does what, who gets what, and the contract
  that would settle it is expensive and frozen on day one.

  So the page walks the path in order: the gap, the steps a rikma takes from
  a written vision to shared income, the four things that make it fast
  (transparency, anyone can initiate, order, no complex contracts), the AI
  agent route, one worked example, and the doubts.

  Same shape and surface tokens as /no-boss, so the track pages read as one
  family.
-->
<script>
  import { t, isRtl, locale } from '$lib/translations';
  import { registerHref } from '$lib/nav/registerHref.js';
  import { breadcrumbs, jsonLdBody } from '$lib/seo/jsonLd.js';
  import DemoRequest from '$lib/components/main/DemoRequest.svelte';

  let demoOpen = $state(false);

  let startHref = $derived(registerHref($locale, '/vision'));

  const crumbLd = $derived(
    breadcrumbs([
      { name: $t('home.crumb.home'), url: 'https://1lev1.com/' },
      { name: $t('vision.hero.h1'), url: 'https://1lev1.com/vision' }
    ])
  );

  const gaps = ['g1', 'g2', 'g3', 'g4'];
  const steps = ['s1', 's2', 's3', 's4', 's5', 's6'];
  const pillars = ['transparency', 'initiative', 'order', 'contracts'];
  const exampleRows = ['missions', 'resources', 'products'];
  const doubts = ['q1', 'q2', 'q3', 'q4'];
</script>

<svelte:head>
  <title>{$t('vision.meta.title')}</title>
  <meta name="description" content={$t('vision.meta.description')} />
  <meta property="og:title" content={$t('vision.meta.title')} />
  <meta property="og:description" content={$t('vision.meta.description')} />
  {@html `<script type="application/ld+json">${jsonLdBody(crumbLd)}<\/script>`}
</svelte:head>

<main
  class="min-h-screen w-full flex flex-col items-center px-4 py-10 sm:py-8 bg-surface text-surfaceInk"
  style="font-family:'Sababa',sans-serif;"
  dir={$isRtl ? 'rtl' : 'ltr'}
>
  <header class="w-full max-w-xl text-center">
    <p class="text-barbi dark:text-gold font-bold text-base sm:text-sm tracking-widest mb-2">
      {$t('vision.hero.eyebrow')}
    </p>
    <h1
      class="text-rose-700 dark:text-gold font-bold text-3xl sm:text-2xl mb-3"
      style="text-shadow:1px 1px 2px rgba(0,0,0,0.15);"
    >
      {$t('vision.hero.h1')}
    </h1>
    <p class="text-slate-800 dark:text-surfaceInk text-lg sm:text-base leading-relaxed max-w-lg mx-auto">
      {$t('vision.hero.sub')}
    </p>

    <div class="mt-6 flex flex-wrap justify-center gap-3">
      <a
        href={startHref}
        class="bg-barbi hover:bg-white hover:text-barbi text-gold font-bold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
      >
        {$t('vision.hero.ctaStart')}
      </a>
      <button
        type="button"
        onclick={() => (demoOpen = true)}
        class="bg-cyan-50/70 dark:bg-surface2 backdrop-blur-sm border-2 border-gold hover:bg-gold/25 text-slate-800 dark:text-surfaceInk hover:text-rose-800 font-semibold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-sm transition-colors"
      >
        {$t('vision.hero.ctaTalk')}
      </button>
    </div>
  </header>

  <!-- Where dreams like this usually stall. Named once, then the page moves on. -->
  <section class="w-full max-w-xl mt-12">
    <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-2 text-center">
      {$t('vision.gap.title')}
    </h2>
    <p class="text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed text-center mb-4">
      {$t('vision.gap.sub')}
    </p>
    <ul class="flex flex-col gap-2">
      {#each gaps as g}
        <li
          class="bg-cyan-50/60 dark:bg-surface2 border-2 border-gold/50 rounded-xl px-4 py-3 text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed text-start"
        >
          {$t(`vision.gap.${g}`)}
        </li>
      {/each}
    </ul>
  </section>

  <!-- The path, in order. -->
  <section class="w-full max-w-xl mt-12">
    <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-4 text-center">
      {$t('vision.steps.title')}
    </h2>
    <ol class="flex flex-col gap-3">
      {#each steps as step, i}
        <li
          class="flex items-start gap-3 bg-cyan-50/60 dark:bg-surface2 backdrop-blur-sm border-2 border-gold/70 rounded-xl px-4 py-3 shadow-sm"
        >
          <span
            class="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-gold text-barbi flex items-center justify-center text-sm font-bold"
            >{i + 1}</span
          >
          <div class="text-start">
            <h3 class="text-rose-700 dark:text-gold font-semibold text-base sm:text-sm">
              {$t(`vision.steps.${step}_t`)}
            </h3>
            <p class="text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed">
              {$t(`vision.steps.${step}_b`)}
            </p>
          </div>
        </li>
      {/each}
    </ol>
  </section>

  <!-- What makes it fast. -->
  <section class="w-full max-w-xl mt-12">
    <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-4 text-center">
      {$t('vision.pillars.title')}
    </h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each pillars as p}
        <div
          class="bg-cyan-50/60 dark:bg-surface2 border-2 border-gold/70 rounded-xl px-4 py-3 shadow-sm text-start"
        >
          <h3 class="text-rose-700 dark:text-gold font-semibold text-base sm:text-sm mb-1">
            {$t(`vision.pillars.${p}_t`)}
          </h3>
          <p class="text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed">
            {$t(`vision.pillars.${p}_b`)}
          </p>
        </div>
      {/each}
    </div>
  </section>

  <!-- The AI agent route. -->
  <section
    class="w-full max-w-xl mt-12 bg-cyan-50/70 dark:bg-surface2 border-2 border-gold rounded-2xl px-5 py-5 text-center"
  >
    <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-2">
      {$t('vision.ai.title')}
    </h2>
    <p class="text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed mb-2">
      {$t('vision.ai.body')}
    </p>
    <p class="text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed italic mb-4">
      {$t('vision.ai.example')}
    </p>
    <a
      href="/mcp"
      class="text-barbi dark:text-gold font-semibold text-base sm:text-sm underline decoration-barbi/40 underline-offset-4 hover:text-rose-800 dark:hover:text-surfaceInk"
    >
      {$t('vision.ai.cta')} {$isRtl ? '←' : '→'}
    </a>
  </section>

  <!-- One worked example, so the steps have something to hold on to. -->
  <section class="w-full max-w-xl mt-12">
    <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-2 text-center">
      {$t('vision.example.title')}
    </h2>
    <p class="text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed text-center mb-4">
      {$t('vision.example.sub')}
    </p>
    <dl class="flex flex-col gap-3">
      {#each exampleRows as row}
        <div class="bg-cyan-50/60 dark:bg-surface2 border-2 border-gold/50 rounded-xl px-4 py-3 text-start">
          <dt class="text-rose-700 dark:text-gold font-semibold text-base sm:text-sm">
            {$t(`vision.example.${row}_t`)}
          </dt>
          <dd class="text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed">
            {$t(`vision.example.${row}_b`)}
          </dd>
        </div>
      {/each}
    </dl>
  </section>

  <section class="w-full max-w-xl mt-12">
    <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-4 text-center">
      {$t('vision.doubts.title')}
    </h2>
    <div class="flex flex-col gap-3">
      {#each doubts as q}
        <details
          class="bg-cyan-50/60 dark:bg-surface2 backdrop-blur-sm border-2 border-gold/70 rounded-xl px-4 py-3 shadow-sm"
        >
          <summary class="cursor-pointer text-rose-700 dark:text-gold font-semibold text-base sm:text-sm">
            {$t(`vision.doubts.${q}_q`)}
          </summary>
          <p class="mt-2 text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed text-start">
            {$t(`vision.doubts.${q}_a`)}
          </p>
        </details>
      {/each}
    </div>
  </section>

  <section class="w-full max-w-xl mt-12 text-center">
    <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-2">
      {$t('vision.close.title')}
    </h2>
    <p class="text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed mb-5 max-w-lg mx-auto">
      {$t('vision.close.sub')}
    </p>
    <div class="flex flex-wrap justify-center gap-3">
      <a
        href={startHref}
        class="inline-block bg-barbi hover:bg-white hover:text-barbi text-gold font-bold text-lg sm:text-base px-7 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
      >
        {$t('vision.hero.ctaStart')}
      </a>
      <button
        type="button"
        onclick={() => (demoOpen = true)}
        class="inline-block bg-cyan-50/70 dark:bg-surface2 backdrop-blur-sm border-2 border-gold hover:bg-gold/25 text-slate-800 dark:text-surfaceInk hover:text-rose-800 font-semibold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-sm transition-colors"
      >
        {$t('vision.hero.ctaTalk')}
      </button>
    </div>
    <p class="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2">
      <a
        href="/partnership"
        class="text-barbi dark:text-gold font-semibold text-base sm:text-sm underline decoration-barbi/40 underline-offset-4 hover:text-rose-800 dark:hover:text-surfaceInk"
      >
        {$t('vision.close.split')}
      </a>
      <a
        href="/"
        class="text-barbi dark:text-gold font-semibold text-base sm:text-sm underline decoration-barbi/40 underline-offset-4 hover:text-rose-800 dark:hover:text-surfaceInk"
      >
        {$t('vision.close.back')}
      </a>
    </p>
  </section>
</main>

<DemoRequest bind:open={demoOpen} source="vision" />
