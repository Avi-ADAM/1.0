<!--
  /join - for people looking for a venture to join.

  The third audience track, and the only one with no existing copy to move:
  the homepage had a link strip for this reader but never an argument. The
  strip stays where it is - it is a good gateway - and the case for joining
  lives here.

  This is also the track most exposed to the empty-directory failure, because
  its whole purpose is to send someone into a listing. So the page has two
  shapes and the server decides which one renders: with real listings it
  leads with them, and with nothing published it never shows a link into
  emptiness - it offers the conversation instead. Neither shape is a
  consolation prize; the manual match is how a small network actually places
  its first people.
-->
<script>
  import { t, isRtl, locale } from '$lib/translations';
  import { registerHref } from '$lib/nav/registerHref.js';
  import { breadcrumbs, jsonLdBody } from '$lib/seo/jsonLd.js';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
  import DemoRequest from '$lib/components/main/DemoRequest.svelte';

  let { data } = $props();

  let demoOpen = $state(false);

  /* Signing up is offered next to every "we'll match you by hand" prompt.
     Having us look on your behalf is a service, not a turnstile - a reader
     who already knows what they want should not have to book a call to get
     started. */
  let startHref = $derived(registerHref($locale, '/join'));

  /* Hoisted out of the `{#each}` for the same reason fpage hoists its icon
     tables: a JSDoc cast written inside a template expression does not reach
     the checker, so the kind degrades to a bare string. */
  /** @type {[import('$lib/celim/icons/entityIcons').EntityIconKind, string][]} */
  const DEAL_CARDS = [
    ['mission', 'give'],
    ['opportunity', 'get']
  ];

  /** @type {{ icon: import('$lib/celim/icons/entityIcons').EntityIconKind, count: number, key: string, href: string }[]} */
  const allDoors = $derived([
    { icon: 'mission', count: data.stats?.openMissions ?? 0, key: 'missions', href: '/availableMission' },
    { icon: 'resource', count: data.stats?.openResources ?? 0, key: 'resources', href: '/availiableResorce' },
    { icon: 'rikma', count: data.stats?.projects ?? 0, key: 'projects', href: '/project' }
  ]);

  /* Only doors with something behind them. A zero count is not a smaller
     number to show - it is a link that wastes the one visit. */
  let doors = $derived(allDoors.filter((d) => d.count > 0));
  let hasListings = $derived(doors.length > 0);

  /* Home > this page. Two levels is the whole trail - these pages hang
     directly off the homepage - but it is what puts the site name and the
     page's own name into the search result instead of a bare URL. */
  const crumbLd = $derived(
    breadcrumbs([
      { name: $t('home.crumb.home'), url: 'https://1lev1.com/' },
      { name: $t('join.hero.h1'), url: 'https://1lev1.com/join' }
    ])
  );
</script>

<svelte:head>
  <title>{$t('join.meta.title')}</title>
  <meta name="description" content={$t('join.meta.description')} />
  <meta property="og:title" content={$t('join.meta.title')} />
  <meta property="og:description" content={$t('join.meta.description')} />
  {@html `<script type="application/ld+json">${jsonLdBody(crumbLd)}<\/script>`}
</svelte:head>

<!-- bg-surface, not a bare page. `body` paints --bg, which in the personal
     theme is #070606 in BOTH modes (only `dark:` utilities move), so text
     laid straight onto it was dark-grey on near-black. --surface is the one
     card colour resolved per theme AND per mode, and --surface-ink is the ink
     guaranteed to read on it, so the whole page now has a ground instead of
     borrowing the app's. -->
<main
  class="min-h-screen w-full flex flex-col items-center px-4 py-10 sm:py-8 bg-surface text-surfaceInk"
  style="font-family:'Sababa',sans-serif;"
  dir={$isRtl ? 'rtl' : 'ltr'}
>
  <header class="w-full max-w-xl text-center">
    <p class="text-barbi font-bold text-base sm:text-sm tracking-widest mb-2">
      {$t('join.hero.eyebrow')}
    </p>
    <h1
      class="text-rose-700 dark:text-gold font-bold text-3xl sm:text-2xl mb-3"
      style="text-shadow:1px 1px 2px rgba(0,0,0,0.15);"
    >
      {$t('join.hero.h1')}
    </h1>
    <p class="text-slate-800 dark:text-surfaceInk text-lg sm:text-base leading-relaxed max-w-lg mx-auto">
      {$t('join.hero.sub')}
    </p>
  </header>

  <!-- What you put in and what you get back, before anything asks for a click. -->
  <section class="w-full max-w-xl mt-8">
    <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-4 text-center">
      {$t('join.deal.title')}
    </h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each DEAL_CARDS as [icon, key] (key)}
        <div
          class="bg-cyan-50/70 dark:bg-surface2 backdrop-blur-sm border-2 border-gold rounded-lg p-4 shadow flex flex-col"
        >
          <div class="mb-1"><EntityIcon kind={icon} size={24} tone="brand" /></div>
          <h3 class="text-rose-700 dark:text-gold font-bold text-lg sm:text-base mb-1">
            {$t(`join.deal.${key}_t`)}
          </h3>
          <p class="text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed">
            {$t(`join.deal.${key}_d`)}
          </p>
        </div>
      {/each}
    </div>
    <p
      class="mt-4 text-center bg-cyan-50/60 dark:bg-surface2 backdrop-blur-sm border-2 border-gold rounded-2xl px-4 py-3 text-slate-900 dark:text-surfaceInk text-base sm:text-sm leading-relaxed shadow"
    >
      {$t('join.deal.note')}
    </p>
  </section>

  <!-- How joining actually happens. -->
  <section class="w-full max-w-xl mt-10">
    <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-4 text-center">
      {$t('join.how.title')}
    </h2>
    <ol class="flex flex-col gap-3">
      {#each ['s1', 's2', 's3', 's4'] as step, i}
        <li
          class="flex items-start gap-3 bg-cyan-50/60 dark:bg-surface2 backdrop-blur-sm border-2 border-gold/70 rounded-xl px-4 py-3 shadow-sm"
        >
          <span
            class="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-gold text-barbi flex items-center justify-center text-sm font-bold"
            >{i + 1}</span
          >
          <p class="text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed text-start">
            {$t(`join.how.${step}`)}
          </p>
        </li>
      {/each}
    </ol>
  </section>

  <!-- The two shapes. Which one renders is decided on the server. -->
  <section class="w-full max-w-xl mt-10">
    {#if hasListings}
      <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-1 text-center">
        {$t('join.open.title')}
      </h2>
      <p class="text-center text-slate-700 dark:text-surfaceMuted text-base sm:text-sm mb-4">
        {$t('join.open.sub')}
      </p>
      <div class="flex flex-col gap-2">
        {#each doors as { icon, count, key, href } (key)}
          <a
            {href}
            data-sveltekit-prefetch
            class="group flex items-center gap-3 bg-cyan-50/80 dark:bg-surface2 hover:bg-gold/20 border border-gold/60 rounded-lg px-3 py-2 transition-colors"
          >
            <EntityIcon kind={icon} size={24} tone="brand" />
            <span class="flex-1 text-slate-800 dark:text-surfaceInk text-lg sm:text-base text-start">
              <strong class="text-rose-700 dark:text-gold">{count}</strong>
              {$t(`join.open.${key}`)}
            </span>
            <span
              class="text-barbi font-semibold text-base sm:text-sm group-hover:underline whitespace-nowrap"
            >
              {$t('join.open.view')} {$isRtl ? '‹' : '›'}
            </span>
          </a>
        {/each}
      </div>
      <p class="mt-4 text-center text-slate-700 dark:text-surfaceMuted text-base sm:text-sm">
        {$t('join.open.orMatch')}
        <button
          type="button"
          onclick={() => (demoOpen = true)}
          class="text-barbi font-bold underline underline-offset-4 hover:text-rose-700 dark:text-gold"
        >
          {$t('join.open.matchCta')}
        </button>
      </p>
      <div class="mt-4 text-center">
        <a
          href={startHref}
          class="inline-block bg-barbi hover:bg-white hover:text-barbi text-gold font-bold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
        >
          {$t('join.hero.ctaStart')}
        </a>
      </div>
    {:else}
      <!-- Nothing published. Not a dead end and not an apology - the same
           door the audits recommended, which is a person rather than a list. -->
      <div
        class="rounded-2xl border-2 border-gold bg-gradient-to-br from-amber-100 via-amber-50 to-rose-50 px-4 py-5 shadow-lg text-center"
      >
        <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-2">
          {$t('join.match.title')}
        </h2>
        <p class="text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed mb-4 max-w-lg mx-auto">
          {$t('join.match.sub')}
        </p>
        <div class="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onclick={() => (demoOpen = true)}
            class="bg-barbi hover:bg-white hover:text-barbi text-gold font-bold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
          >
            {$t('join.match.cta')}
          </button>
          <a
            href={startHref}
            class="bg-cyan-50/80 dark:bg-surface2 hover:bg-white border-2 border-barbi text-barbi font-semibold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-sm transition-colors"
          >
            {$t('join.hero.ctaStart')}
          </a>
        </div>
      </div>
    {/if}
  </section>

  <!-- What stops people from joining someone else's venture. -->
  <section class="w-full max-w-xl mt-10">
    <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-4 text-center">
      {$t('join.doubts.title')}
    </h2>
    <div class="flex flex-col gap-3">
      {#each ['q1', 'q2', 'q3'] as q}
        <details
          class="bg-cyan-50/60 dark:bg-surface2 backdrop-blur-sm border-2 border-gold/70 rounded-xl px-4 py-3 shadow-sm"
        >
          <!-- Content stays in the served HTML while closed - the L2 rule. -->
          <summary class="cursor-pointer text-rose-700 dark:text-gold font-semibold text-base sm:text-sm">
            {$t(`join.doubts.${q}_q`)}
          </summary>
          <p class="mt-2 text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed text-start">
            {$t(`join.doubts.${q}_a`)}
          </p>
        </details>
      {/each}
    </div>
  </section>

  <section class="w-full max-w-xl mt-12 text-center">
    <p>
      <a
        href="/"
        class="text-barbi font-semibold text-base sm:text-sm underline decoration-barbi/40 underline-offset-4 hover:text-gold"
      >
        {$t('join.back')} {$isRtl ? '←' : '→'}
      </a>
    </p>
  </section>
</main>

<DemoRequest bind:open={demoOpen} source="join" />
