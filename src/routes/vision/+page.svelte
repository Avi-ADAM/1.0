<!--
  /vision - for the founder with an idea who needs people to build it.

  /partnership answers "how should we split" for people who already have a
  partnership. This page answers the question one step earlier, the one a
  founder actually has: how do I get this built? The default answer is a deck,
  investors and salaries; this page offers the other road - the people who
  would have been the first hires become partners, paid in a share of what
  they build.

  The reader is busy and practical, so the page leads with what changes for
  them (the two roads side by side), lets them try it on their own idea at
  once (<VisionDemo>), and only then explains the steps. Five examples from
  different fields, so no single story reads as the page's subject. It sells a
  tool, not an ideology.

  Same shape and surface tokens as /no-boss, so the track pages read as one
  family.
-->
<script>
  import { t, isRtl, locale } from '$lib/translations';
  import { registerHref } from '$lib/nav/registerHref.js';
  import { breadcrumbs, jsonLdBody } from '$lib/seo/jsonLd.js';
  import DemoRequest from '$lib/components/main/DemoRequest.svelte';
  import VisionDemo from '$lib/components/vision/VisionDemo.svelte';
  import VisionArt from '$lib/components/vision/VisionArt.svelte';

  let demoOpen = $state(false);

  let startHref = $derived(registerHref($locale, '/vision'));

  const crumbLd = $derived(
    breadcrumbs([
      { name: $t('home.crumb.home'), url: 'https://1lev1.com/' },
      { name: $t('vision.hero.h1'), url: 'https://1lev1.com/vision' }
    ])
  );

  const roads = ['r1', 'r2', 'r3', 'r4', 'r5'];
  const gaps = ['g1', 'g2', 'g3', 'g4'];
  const steps = ['s1', 's2', 's3', 's4', 's5', 's6'];
  const examples = ['retreat', 'cafe', 'app', 'food', 'school'];
  const exampleRows = ['who', 'bring', 'sell'];
  const pillars = ['transparency', 'initiative', 'order', 'contracts'];
  const doubts = ['q1', 'q2', 'q3', 'q4', 'q5'];

  const card = 'bg-cyan-50/60 dark:bg-surface2 border-2 border-gold/60 rounded-xl px-4 py-3 shadow-sm text-start';
  const h2 = 'text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-2 text-center';
  const lede = 'text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed text-center mb-4';
  const body = 'text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed';
  const h3 = 'text-rose-700 dark:text-gold font-semibold text-base sm:text-sm';
  const primary =
    'bg-barbi hover:bg-white hover:text-barbi text-gold font-bold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300';
  const secondary =
    'bg-cyan-50/70 dark:bg-surface2 backdrop-blur-sm border-2 border-gold hover:bg-gold/25 text-slate-800 dark:text-surfaceInk hover:text-rose-800 font-semibold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-sm transition-colors';
  const link =
    'text-barbi dark:text-gold font-semibold text-base sm:text-sm underline decoration-barbi/40 underline-offset-4 hover:text-rose-800 dark:hover:text-surfaceInk';
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
      <a href="#try" class={primary}>{$t('vision.hero.ctaTry')}</a>
      <a href={startHref} class={secondary}>{$t('vision.hero.ctaStart')}</a>
    </div>
    <div class="mt-8">
      <VisionArt />
    </div>
  </header>

  <!-- The two roads, side by side: what actually changes for the founder. -->
  <section class="w-full max-w-2xl mt-12">
    <h2 class={h2}>{$t('vision.roads.title')}</h2>
    <p class={lede}>{$t('vision.roads.sub')}</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each ['usual', 'rikma'] as side}
        <div class="{card} {side === 'rikma' ? 'border-barbi/70' : ''}">
          <h3 class="{h3} mb-2">{$t(`vision.roads.${side}`)}</h3>
          <ul class="flex flex-col gap-2 list-disc ps-5">
            {#each roads as r}
              <li class={body}>{$t(`vision.roads.${side}_${r}`)}</li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
    <p class="{body} mt-4 text-center">{$t('vision.roads.fit')}</p>
  </section>

  <!-- Try it on your own idea. -->
  <section id="try" class="w-full max-w-xl mt-12 scroll-mt-20">
    <h2 class={h2}>{$t('vision.demo.title')}</h2>
    <p class={lede}>{$t('vision.demo.sub')}</p>
    <VisionDemo />
  </section>

  <section class="w-full max-w-xl mt-12">
    <h2 class={h2}>{$t('vision.gap.title')}</h2>
    <p class={lede}>{$t('vision.gap.sub')}</p>
    <ul class="flex flex-col gap-2">
      {#each gaps as g}
        <li class="{card} {body}">{$t(`vision.gap.${g}`)}</li>
      {/each}
    </ul>
  </section>

  <section class="w-full max-w-xl mt-12">
    <h2 class="{h2} mb-4">{$t('vision.steps.title')}</h2>
    <ol class="flex flex-col gap-3">
      {#each steps as step, i}
        <li class="flex items-start gap-3 {card}">
          <span
            class="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-gold text-barbi flex items-center justify-center text-sm font-bold"
            >{i + 1}</span
          >
          <div>
            <h3 class={h3}>{$t(`vision.steps.${step}_t`)}</h3>
            <p class={body}>{$t(`vision.steps.${step}_b`)}</p>
          </div>
        </li>
      {/each}
    </ol>
  </section>

  <!-- Five ideas from five fields, so the page is about the method, not one story. -->
  <section class="w-full max-w-2xl mt-12">
    <h2 class={h2}>{$t('vision.examples.title')}</h2>
    <p class={lede}>{$t('vision.examples.sub')}</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each examples as ex}
        <article class={card}>
          <h3 class="{h3} mb-1">{$t(`vision.examples.${ex}_t`)}</h3>
          <p class="{body} mb-2">{$t(`vision.examples.${ex}_idea`)}</p>
          <dl class="flex flex-col gap-1">
            {#each exampleRows as row}
              <div>
                <dt class="inline text-rose-700 dark:text-gold font-semibold text-sm">
                  {$t(`vision.examples.${row}`)}:
                </dt>
                <dd class="inline text-slate-800 dark:text-surfaceInk text-sm">
                  {$t(`vision.examples.${ex}_${row}`)}
                </dd>
              </div>
            {/each}
          </dl>
        </article>
      {/each}
    </div>
  </section>

  <section class="w-full max-w-xl mt-12">
    <h2 class="{h2} mb-4">{$t('vision.pillars.title')}</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each pillars as p}
        <div class={card}>
          <h3 class="{h3} mb-1">{$t(`vision.pillars.${p}_t`)}</h3>
          <p class={body}>{$t(`vision.pillars.${p}_b`)}</p>
        </div>
      {/each}
    </div>
  </section>

  <!-- Two AI doors: ours, on this page and at signup; or the visitor's own agent. -->
  <section class="w-full max-w-xl mt-12">
    <h2 class={h2}>{$t('vision.ai.title')}</h2>
    <p class={lede}>{$t('vision.ai.sub')}</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div class={card}>
        <h3 class="{h3} mb-1">{$t('vision.ai.ours_t')}</h3>
        <p class="{body} mb-2">{$t('vision.ai.ours_b')}</p>
        <a href="#try" class={link}>{$t('vision.ai.ours_cta')}</a>
      </div>
      <div class={card}>
        <h3 class="{h3} mb-1">{$t('vision.ai.agent_t')}</h3>
        <p class="{body} mb-2">{$t('vision.ai.agent_b')}</p>
        <p class="text-slate-700 dark:text-surfaceMuted text-sm italic mb-2">{$t('vision.ai.example')}</p>
        <a href="/mcp" class={link}>{$t('vision.ai.agent_cta')} {$isRtl ? '←' : '→'}</a>
      </div>
    </div>
    <p class="text-slate-700 dark:text-surfaceMuted text-sm leading-relaxed text-center mt-3">
      {$t('vision.ai.humans')}
    </p>
  </section>

  <section class="w-full max-w-xl mt-12">
    <h2 class="{h2} mb-4">{$t('vision.doubts.title')}</h2>
    <div class="flex flex-col gap-3">
      {#each doubts as q}
        <details class={card}>
          <summary class="cursor-pointer {h3}">{$t(`vision.doubts.${q}_q`)}</summary>
          <p class="mt-2 {body}">{$t(`vision.doubts.${q}_a`)}</p>
        </details>
      {/each}
    </div>
  </section>

  <section class="w-full max-w-xl mt-12 text-center">
    <h2 class={h2}>{$t('vision.close.title')}</h2>
    <p class="{body} mb-5 max-w-lg mx-auto">{$t('vision.close.sub')}</p>
    <div class="flex flex-wrap justify-center gap-3">
      <a href={startHref} class={primary}>{$t('vision.hero.ctaStart')}</a>
      <button type="button" onclick={() => (demoOpen = true)} class={secondary}>
        {$t('vision.hero.ctaTalk')}
      </button>
    </div>
    <p class="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2">
      <a href="/partnership" class={link}>{$t('vision.close.split')}</a>
      <a href="/" class={link}>{$t('vision.close.back')}</a>
    </p>
  </section>
</main>

<DemoRequest bind:open={demoOpen} source="vision" />
