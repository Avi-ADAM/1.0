<!--
  /partnership - for people who already have a partnership, or are about to.

  The second of the three audience tracks. This is the reader the audits
  judged closest to converting: someone with a real partnership and a real
  argument about fifty-fifty, who does not need convincing that the problem
  exists.

  The division of labour with the homepage is deliberate. The homepage keeps
  the hook and the calculator - the claim, the four ways fifty-fifty breaks a
  partnership, and a number the reader produces themselves. It is the
  strongest thing on that page and moving it would have been a downgrade.
  What lives here is everything the homepage was explaining underneath it:
  why those four failures belong to the method rather than to the partners,
  the three steps the mechanism actually runs, and what transparency buys
  once it is in place.

  So this page is not a longer copy of that section - the two halves do not
  overlap, which is the rule the whole split exists to keep.
-->
<script>
  import { t, isRtl, locale } from '$lib/translations';
  import { breadcrumbs, jsonLdBody } from '$lib/seo/jsonLd.js';
  import { goto } from '$app/navigation';
  import { registerHref } from '$lib/nav/registerHref.js';
  import SplitDepth from '$lib/components/main/SplitDepth.svelte';
  import SplitCalculator from '$lib/components/main/SplitCalculator.svelte';

  /* The locale-to-agreement mapping was inline here and inline in fpage; it
     now lives in one module, and this is a link rather than a scripted goto
     so it behaves like every other navigation on the page. */
  let startHref = $derived(registerHref($locale, '/partnership'));

  /* Home > this page. Two levels is the whole trail - these pages hang
     directly off the homepage - but it is what puts the site name and the
     page's own name into the search result instead of a bare URL. */
  const crumbLd = $derived(
    breadcrumbs([
      { name: $t('home.crumb.home'), url: 'https://1lev1.com/' },
      { name: $t('partnership.hero.h1'), url: 'https://1lev1.com/partnership' }
    ])
  );
</script>

<svelte:head>
  <title>{$t('partnership.meta.title')}</title>
  <meta name="description" content={$t('partnership.meta.description')} />
  <meta property="og:title" content={$t('partnership.meta.title')} />
  <meta property="og:description" content={$t('partnership.meta.description')} />
  {@html `<script type="application/ld+json">${jsonLdBody(crumbLd)}<\/script>`}
</svelte:head>

<main
  class="min-h-screen w-full flex flex-col items-center px-4 py-10 sm:py-8"
  style="font-family:'Sababa',sans-serif;"
  dir={$isRtl ? 'rtl' : 'ltr'}
>
  <header class="w-full max-w-xl text-center">
    <p class="text-barbi font-bold text-base sm:text-sm tracking-widest mb-2">
      {$t('partnership.hero.eyebrow')}
    </p>
    <h1
      class="text-rose-700 font-bold text-3xl sm:text-2xl mb-3"
      style="text-shadow:1px 1px 2px rgba(0,0,0,0.15);"
    >
      {$t('partnership.hero.h1')}
    </h1>
    <p class="text-slate-800 text-lg sm:text-base leading-relaxed max-w-lg mx-auto">
      {$t('partnership.hero.sub')}
    </p>
  </header>

  <!-- Why it breaks, how the calculation works, what it gives you. -->
  <div class="w-full max-w-xl mt-8">
    <SplitDepth onConsensus={() => goto('/consensus')} />
  </div>

  <!-- The calculator again, at the bottom rather than the top: on the
       homepage it is the hook, here it is the close - the reader has just
       been through the mechanism and this is where they check it against
       their own numbers. -->
  <section class="w-full max-w-xl mt-10">
    <h2 class="text-rose-700 font-bold text-2xl sm:text-xl mb-1 text-center">
      {$t('partnership.calc.title')}
    </h2>
    <p class="text-center text-slate-700 text-base sm:text-sm mb-4">
      {$t('partnership.calc.sub')}
    </p>
    <SplitCalculator />
  </section>

  <!-- The questions a partnership asks before it moves its accounting. -->
  <section class="w-full max-w-xl mt-10">
    <h2 class="text-rose-700 font-bold text-2xl sm:text-xl mb-4 text-center">
      {$t('partnership.doubts.title')}
    </h2>
    <div class="flex flex-col gap-3">
      {#each ['q1', 'q2', 'q3'] as q}
        <details
          class="bg-cyan-50/60 backdrop-blur-sm border-2 border-gold/70 rounded-xl px-4 py-3 shadow-sm"
        >
          <!-- Content stays in the served HTML while closed - the L2 rule. -->
          <summary class="cursor-pointer text-rose-700 font-semibold text-base sm:text-sm">
            {$t(`partnership.doubts.${q}_q`)}
          </summary>
          <p class="mt-2 text-slate-800 text-base sm:text-sm leading-relaxed text-start">
            {$t(`partnership.doubts.${q}_a`)}
          </p>
        </details>
      {/each}
    </div>
  </section>

  <section class="w-full max-w-xl mt-12 text-center">
    <h2 class="text-rose-700 font-bold text-2xl sm:text-xl mb-2">
      {$t('partnership.close.title')}
    </h2>
    <p class="text-slate-800 text-base sm:text-sm leading-relaxed mb-5 max-w-lg mx-auto">
      {$t('partnership.close.sub')}
    </p>
    <a
      href={startHref}
      class="inline-block bg-barbi hover:bg-white hover:text-barbi text-gold font-bold text-lg sm:text-base px-7 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
    >
      {$t('partnership.close.cta')}
    </a>
    <p class="mt-6">
      <a
        href="/"
        class="text-barbi font-semibold text-base sm:text-sm underline decoration-barbi/40 underline-offset-4 hover:text-gold"
      >
        {$t('partnership.close.back')} {$isRtl ? '←' : '→'}
      </a>
    </p>
  </section>
</main>
