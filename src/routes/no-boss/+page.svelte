<!--
  /no-boss - for people who are done working for someone else.

  The homepage segments visitors four ways and then walks all four down the
  same long page. This is the first of the three tracks to get its own
  address: the reader who is not a partner yet and not an entrepreneur yet,
  who is employed and has stopped wanting to be.

  Two constraints shape it, both from the audits:

  1. It is not built on resentment. A page whose whole message is "your boss
     is exploiting you" recruits people looking for somewhere to complain,
     and a bad partner in a rikma damages every other member - which is to
     say, the product. So the pain is the headline and everything after it is
     the positive case.

  2. It never hands a convinced reader an empty list. The primary path is the
     personal demo, which is a person following up, not a directory. The
     "rikmas looking for partners" link renders only when the server-side
     counts say there is something behind it.

  The argument itself is <NoBossCase>, moved here from the middle of the
  homepage with its copy unchanged.
-->
<script>
  import { t, isRtl } from '$lib/translations';
  import { breadcrumbs, jsonLdBody } from '$lib/seo/jsonLd.js';
  import NoBossCase from '$lib/components/main/NoBossCase.svelte';
  import DemoRequest from '$lib/components/main/DemoRequest.svelte';

  let { data } = $props();

  let demoOpen = $state(false);

  /* Only what a guest can actually walk into. `stats` is null when the count
     could not be fetched, and null reads as zero on purpose. */
  let openMissions = $derived(data.stats?.openMissions ?? 0);
  let activeRikmas = $derived(data.stats?.projects ?? 0);
  let hasSomewhereToGo = $derived(openMissions > 0 || activeRikmas > 0);

  /* Home > this page. Two levels is the whole trail - these pages hang
     directly off the homepage - but it is what puts the site name and the
     page's own name into the search result instead of a bare URL. */
  const crumbLd = $derived(
    breadcrumbs([
      { name: $t('home.crumb.home'), url: 'https://1lev1.com/' },
      { name: $t('noboss.hero.h1'), url: 'https://1lev1.com/no-boss' }
    ])
  );
</script>

<svelte:head>
  <title>{$t('noboss.meta.title')}</title>
  <meta name="description" content={$t('noboss.meta.description')} />
  <meta property="og:title" content={$t('noboss.meta.title')} />
  <meta property="og:description" content={$t('noboss.meta.description')} />
  {@html `<script type="application/ld+json">${jsonLdBody(crumbLd)}<\/script>`}
</svelte:head>

<main
  class="min-h-screen w-full flex flex-col items-center px-4 py-10 sm:py-8"
  style="font-family:'Sababa',sans-serif;"
  dir={$isRtl ? 'rtl' : 'ltr'}
>
  <!-- Hero. The pain is here and nowhere after it. -->
  <header class="w-full max-w-xl text-center">
    <p
      class="text-barbi font-bold text-base sm:text-sm tracking-widest mb-2"
    >
      {$t('noboss.hero.eyebrow')}
    </p>
    <h1
      class="text-rose-700 font-bold text-3xl sm:text-2xl mb-3"
      style="text-shadow:1px 1px 2px rgba(0,0,0,0.15);"
    >
      {$t('noboss.hero.h1')}
    </h1>
    <p
      class="text-slate-800 text-lg sm:text-base leading-relaxed max-w-lg mx-auto"
    >
      {$t('noboss.hero.sub')}
    </p>

    <!-- The reassurance line goes directly under the promise, because the
         reason someone stays with a boss is not that they like it - it is
         that leaving looks binary. It is not: this starts at a few hours a
         week, alongside the job. -->
    <p
      class="mt-4 inline-block bg-cyan-50/70 backdrop-blur-sm border-2 border-gold rounded-2xl px-5 py-3 text-slate-800 text-base sm:text-sm"
    >
      {$t('noboss.hero.risk')}
    </p>

    <div class="mt-6 flex flex-wrap justify-center gap-3">
      <button
        type="button"
        onclick={() => (demoOpen = true)}
        class="bg-barbi hover:bg-white hover:text-barbi text-gold font-bold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
      >
        {$t('noboss.hero.ctaPrimary')}
      </button>
      {#if hasSomewhereToGo}
        <a
          href="/availableMission"
          data-sveltekit-prefetch
          class="bg-cyan-50/70 backdrop-blur-sm border-2 border-gold hover:bg-gold/25 text-slate-800 hover:text-rose-800 font-semibold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-sm transition-colors"
        >
          {$t('noboss.hero.ctaSecondary')}
        </a>
      {/if}
    </div>
  </header>

  <!-- The argument, moved here from the homepage. -->
  <div class="w-full max-w-xl mt-10">
    <NoBossCase />
  </div>

  <!-- "What actually happens if I say yes" - the question the audits found
       unanswered, and the last thing between reading and acting. -->
  <section class="w-full max-w-xl mt-12">
    <h2 class="text-rose-700 font-bold text-2xl sm:text-xl mb-4 text-center">
      {$t('noboss.next.title')}
    </h2>
    <ol class="flex flex-col gap-3">
      {#each ['s1', 's2', 's3'] as step, i}
        <li
          class="flex items-start gap-3 bg-cyan-50/60 backdrop-blur-sm border-2 border-gold/70 rounded-xl px-4 py-3 shadow-sm"
        >
          <span
            class="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-gold text-barbi flex items-center justify-center text-sm font-bold"
            >{i + 1}</span
          >
          <p class="text-slate-800 text-base sm:text-sm leading-relaxed text-start">
            {$t(`noboss.next.${step}`)}
          </p>
        </li>
      {/each}
    </ol>
  </section>

  <!-- The three objections that actually stop people, answered plainly. -->
  <section class="w-full max-w-xl mt-10">
    <h2 class="text-rose-700 font-bold text-2xl sm:text-xl mb-4 text-center">
      {$t('noboss.doubts.title')}
    </h2>
    <div class="flex flex-col gap-3">
      {#each ['q1', 'q2', 'q3'] as q}
        <details
          class="bg-cyan-50/60 backdrop-blur-sm border-2 border-gold/70 rounded-xl px-4 py-3 shadow-sm"
        >
          <!-- Open by default would be four screens of text; closed keeps the
               answer in the served HTML either way, which is the point - a
               crawler reads <details> content, an on-click fetch it would
               never see. -->
          <summary
            class="cursor-pointer text-rose-700 font-semibold text-base sm:text-sm"
          >
            {$t(`noboss.doubts.${q}_q`)}
          </summary>
          <p
            class="mt-2 text-slate-800 text-base sm:text-sm leading-relaxed text-start"
          >
            {$t(`noboss.doubts.${q}_a`)}
          </p>
        </details>
      {/each}
    </div>
  </section>

  <!-- Closing CTA. Same door as the top: a person, not a directory. -->
  <section class="w-full max-w-xl mt-12 text-center">
    <h2 class="text-rose-700 font-bold text-2xl sm:text-xl mb-2">
      {$t('noboss.close.title')}
    </h2>
    <p class="text-slate-800 text-base sm:text-sm leading-relaxed mb-5 max-w-lg mx-auto">
      {$t('noboss.close.sub')}
    </p>
    <button
      type="button"
      onclick={() => (demoOpen = true)}
      class="bg-barbi hover:bg-white hover:text-barbi text-gold font-bold text-lg sm:text-base px-7 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
    >
      {$t('noboss.hero.ctaPrimary')}
    </button>
    <p class="mt-6">
      <a
        href="/"
        class="text-barbi font-semibold text-base sm:text-sm underline decoration-barbi/40 underline-offset-4 hover:text-gold"
      >
        {$t('noboss.close.back')} {$isRtl ? '←' : '→'}
      </a>
    </p>
  </section>
</main>

<DemoRequest bind:open={demoOpen} source="no-boss" />
