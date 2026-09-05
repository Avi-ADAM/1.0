<!--
  /flexible-work - for people the ordinary job market keeps turning down.

  Someone let go at 55 with two hundred unanswered applications. Someone who
  raised children for fifteen years and finds the gap is the first question.
  Someone whose body has good days and bad days. Someone who can give three
  hours, not eight, and cannot find a frame that accepts three.

  These readers have motivation and real skill, a genuine need for income,
  and no capacity to build a business alone. What the site can honestly offer
  them is not a job - it is a way to set their own terms and find partners
  who accept them.

  Four rules shaped every line here, and they are why this page reads
  differently from the others:

  1. NEVER NAME THE PAGE AFTER THE LIMITATION. The address, the H1 and the
     headings describe what the reader gets - flexibility, terms of their own
     - not what they lack. Nobody wants to arrive at "the page for people
     nobody will hire". The audience includes former managers and career
     professionals; they are addressed as such.

  2. NO "EVEN YOU CAN". Pity converts worse than respect and is worse to
     receive. The case is capability and terms, never generosity.

  3. TELL THE TRUTH ABOUT REJECTION. It would be very easy - and completely
     false - to write "here nobody can turn you down". `declineMissionRequest`
     adds a candidate to OpenMission.declined, and the self-nomination card
     carries a "not right now" button. The system's "no absolute no" is about
     content decisions inside a rikma, not about candidacy. Promising a reader
     who has been rejected a hundred times that this place cannot reject them,
     and then having them declined, is the cruellest thing this site could do.
     So the page says plainly what is and is not different.

  4. SAY THE ALLOWANCE SENTENCE. Many readers here receive a disability, old
     age or unemployment allowance, where added income can reduce or end the
     payment. Sending them to earn without raising it would be actively
     harmful. The page raises it, tells them to check before they start, and
     does not pretend to know their case - this is a flag, not advice.

  The shape (conditional listings, personal-demo primary CTA, <details> for
  depth) follows /join, for the same reasons documented there.
-->
<script>
  import { t, isRtl, locale } from '$lib/translations';
  import { registerHref } from '$lib/nav/registerHref.js';
  import { breadcrumbs, jsonLdBody } from '$lib/seo/jsonLd.js';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
  import DemoRequest from '$lib/components/main/DemoRequest.svelte';

  let { data } = $props();

  let demoOpen = $state(false);

  /* Both doors, side by side, and neither one hidden.

     The conversation genuinely helps this reader - which is exactly why it
     was tempting to make it the only way in, and why that would have been
     wrong. Someone who has spent a year being told to wait for a callback
     does not need one more gate; and being able to start alone, right now,
     is the whole claim the page makes about who is in charge. Offering only
     a booked call would contradict the headline. */
  let startHref = $derived(registerHref($locale, '/flexible-work'));

  /* Hoisted so the @type annotation reaches the checker - a JSDoc cast inside
     a template expression does not. */
  /** @type {[import('$lib/celim/icons/entityIcons').EntityIconKind, string][]} */
  const FIT_CARDS = [
    ['mission', 'terms'],
    ['timer', 'hours'],
    ['members', 'mixed'],
    ['concierge', 'demand']
  ];

  /** @type {{ icon: import('$lib/celim/icons/entityIcons').EntityIconKind, count: number, key: string, href: string }[]} */
  const allDoors = $derived([
    { icon: 'mission', count: data.stats?.openMissions ?? 0, key: 'missions', href: '/availableMission' },
    { icon: 'rikma', count: data.stats?.projects ?? 0, key: 'projects', href: '/project' }
  ]);
  let doors = $derived(allDoors.filter((d) => d.count > 0));
  let hasListings = $derived(doors.length > 0);

  const crumbLd = $derived(
    breadcrumbs([
      { name: $t('home.crumb.home'), url: 'https://1lev1.com/' },
      { name: $t('flexible.hero.h1'), url: 'https://1lev1.com/flexible-work' }
    ])
  );
</script>

<svelte:head>
  <title>{$t('flexible.meta.title')}</title>
  <meta name="description" content={$t('flexible.meta.description')} />
  <meta property="og:title" content={$t('flexible.meta.title')} />
  <meta property="og:description" content={$t('flexible.meta.description')} />
  {@html `<script type="application/ld+json">${jsonLdBody(crumbLd)}<\/script>`}
</svelte:head>

<main
  class="min-h-screen w-full flex flex-col items-center px-4 py-10 sm:py-8"
  style="font-family:'Sababa',sans-serif;"
  dir={$isRtl ? 'rtl' : 'ltr'}
>
  <header class="w-full max-w-xl text-center">
    <p class="text-barbi font-bold text-base sm:text-sm tracking-widest mb-2">
      {$t('flexible.hero.eyebrow')}
    </p>
    <h1
      class="text-rose-700 font-bold text-3xl sm:text-2xl mb-3"
      style="text-shadow:1px 1px 2px rgba(0,0,0,0.15);"
    >
      {$t('flexible.hero.h1')}
    </h1>
    <p class="text-slate-800 text-lg sm:text-base leading-relaxed max-w-lg mx-auto">
      {$t('flexible.hero.sub')}
    </p>
    <p
      class="mt-4 inline-block bg-cyan-50/70 backdrop-blur-sm border-2 border-gold rounded-2xl px-5 py-3 text-slate-800 text-base sm:text-sm"
    >
      {$t('flexible.hero.reassure')}
    </p>
    <div class="mt-6 flex flex-wrap justify-center gap-3">
      <a
        href={startHref}
        class="bg-barbi hover:bg-white hover:text-barbi text-gold font-bold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
      >
        {$t('flexible.hero.ctaStart')}
      </a>
      <button
        type="button"
        onclick={() => (demoOpen = true)}
        class="bg-cyan-50/70 backdrop-blur-sm border-2 border-gold hover:bg-gold/25 text-slate-800 hover:text-rose-800 font-semibold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-sm transition-colors"
      >
        {$t('flexible.hero.cta')}
      </button>
    </div>
  </header>

  <!-- Recognition, stated flatly. No adjectives of pity, no "unfortunately" -
       these are situations, not tragedies, and the reader is living in one
       and does not need it dramatised back at them. -->
  <section class="w-full max-w-xl mt-12">
    <h2 class="text-rose-700 font-bold text-2xl sm:text-xl mb-4 text-center">
      {$t('flexible.know.title')}
    </h2>
    <div class="flex flex-col gap-2.5">
      {#each ['k1', 'k2', 'k3', 'k4'] as k}
        <p
          class="bg-cyan-50/55 backdrop-blur-sm border border-slate-300/80 rounded-xl px-4 py-3 shadow-sm text-slate-800 text-base sm:text-sm leading-relaxed text-start"
        >
          {$t(`flexible.know.${k}`)}
        </p>
      {/each}
    </div>
    <p class="mt-4 text-center text-rose-700 font-semibold text-lg sm:text-base">
      {$t('flexible.know.turn')}
    </p>
  </section>

  <!-- The four things that are structurally different, each one a real
       property of the system rather than a promise about intentions. -->
  <section class="w-full max-w-xl mt-12">
    <h2 class="text-rose-700 font-bold text-2xl sm:text-xl mb-4 text-center">
      {$t('flexible.fit.title')}
    </h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each FIT_CARDS as [icon, key] (key)}
        <div
          class="bg-cyan-50/70 backdrop-blur-sm border-2 border-gold rounded-lg p-4 shadow flex flex-col"
        >
          <div class="mb-1"><EntityIcon kind={icon} size={24} tone="brand" /></div>
          <h3 class="text-rose-700 font-bold text-lg sm:text-base mb-1">
            {$t(`flexible.fit.${key}_t`)}
          </h3>
          <p class="text-slate-800 text-base sm:text-sm leading-relaxed">
            {$t(`flexible.fit.${key}_d`)}
          </p>
        </div>
      {/each}
    </div>
  </section>

  <!-- How it happens, in the order it happens. -->
  <section class="w-full max-w-xl mt-12">
    <h2 class="text-rose-700 font-bold text-2xl sm:text-xl mb-4 text-center">
      {$t('flexible.how.title')}
    </h2>
    <ol class="flex flex-col gap-3">
      {#each ['s1', 's2', 's3', 's4'] as step, i}
        <li
          class="flex items-start gap-3 bg-cyan-50/60 backdrop-blur-sm border-2 border-gold/70 rounded-xl px-4 py-3 shadow-sm"
        >
          <span
            class="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-gold text-barbi flex items-center justify-center text-sm font-bold"
            >{i + 1}</span
          >
          <p class="text-slate-800 text-base sm:text-sm leading-relaxed text-start">
            {$t(`flexible.how.${step}`)}
          </p>
        </li>
      {/each}
    </ol>
  </section>

  <!-- The honest block, and the most important one on the page.

       A reader who has been turned down repeatedly has heard a lot of
       promises. The fastest way to lose them is to oversell and be found out
       later; the fastest way to earn them is to say the hard part first,
       unprompted. So: no guaranteed income, you can still be told "not now",
       and check your allowance before you earn. -->
  <section class="w-full max-w-xl mt-12">
    <div
      class="rounded-2xl border-2 border-barbi/70 bg-cyan-50/70 backdrop-blur-sm px-5 py-5 shadow"
    >
      <h2 class="text-rose-700 font-bold text-2xl sm:text-xl mb-2 text-center">
        {$t('flexible.honest.title')}
      </h2>
      <p class="text-slate-700 text-base sm:text-sm mb-4 text-center">
        {$t('flexible.honest.lead')}
      </p>
      <ul class="flex flex-col gap-2.5">
        {#each ['h1', 'h2', 'h3'] as h}
          <li
            class="flex items-start gap-3 text-slate-800 text-base sm:text-sm leading-relaxed text-start"
          >
            <span
              class="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-barbi/15 text-barbi flex items-center justify-center text-sm font-bold"
              >!</span
            >
            <span>{$t(`flexible.honest.${h}`)}</span>
          </li>
        {/each}
      </ul>
    </div>
  </section>

  <!-- Listings only when they exist; otherwise the conversation. -->
  <section class="w-full max-w-xl mt-12">
    {#if hasListings}
      <h2 class="text-rose-700 font-bold text-2xl sm:text-xl mb-4 text-center">
        {$t('flexible.open.title')}
      </h2>
      <div class="flex flex-col gap-2">
        {#each doors as { icon, count, key, href } (key)}
          <a
            {href}
            data-sveltekit-prefetch
            class="group flex items-center gap-3 bg-cyan-50/80 hover:bg-gold/20 border border-gold/60 rounded-lg px-3 py-2 transition-colors"
          >
            <EntityIcon kind={icon} size={24} tone="brand" />
            <span class="flex-1 text-slate-800 text-lg sm:text-base text-start">
              <strong class="text-rose-700">{count}</strong>
              {$t(`flexible.open.${key}`)}
            </span>
            <span
              class="text-barbi font-semibold text-base sm:text-sm group-hover:underline whitespace-nowrap"
            >
              {$t('flexible.open.view')} {$isRtl ? '‹' : '›'}
            </span>
          </a>
        {/each}
      </div>
    {/if}

    <!-- Offered in both shapes, unlike /join. Browsing a list is work, and a
         reader who has spent months on job boards has done enough of it -
         the conversation is a first-class option here, not a fallback. -->
    <div
      class="mt-4 rounded-2xl border-2 border-gold bg-gradient-to-br from-amber-100 via-amber-50 to-rose-50 px-4 py-5 shadow-lg text-center"
    >
      <h2 class="text-rose-700 font-bold text-2xl sm:text-xl mb-2">
        {$t('flexible.match.title')}
      </h2>
      <p class="text-slate-800 text-base sm:text-sm leading-relaxed mb-4 max-w-lg mx-auto">
        {$t('flexible.match.sub')}
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onclick={() => (demoOpen = true)}
          class="bg-barbi hover:bg-white hover:text-barbi text-gold font-bold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
        >
          {$t('flexible.match.cta')}
        </button>
        <!-- The conversation leads here, but nobody has to wait for it. -->
        <a
          href={startHref}
          class="bg-cyan-50/80 hover:bg-white border-2 border-barbi text-barbi font-semibold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-sm transition-colors"
        >
          {$t('flexible.hero.ctaStart')}
        </a>
      </div>
    </div>
  </section>

  <section class="w-full max-w-xl mt-12">
    <h2 class="text-rose-700 font-bold text-2xl sm:text-xl mb-4 text-center">
      {$t('flexible.doubts.title')}
    </h2>
    <div class="flex flex-col gap-3">
      {#each ['q1', 'q2', 'q3', 'q4'] as q}
        <details
          class="bg-cyan-50/60 backdrop-blur-sm border-2 border-gold/70 rounded-xl px-4 py-3 shadow-sm"
        >
          <!-- Content stays in the served HTML while closed - the L2 rule. -->
          <summary class="cursor-pointer text-rose-700 font-semibold text-base sm:text-sm">
            {$t(`flexible.doubts.${q}_q`)}
          </summary>
          <p class="mt-2 text-slate-800 text-base sm:text-sm leading-relaxed text-start">
            {$t(`flexible.doubts.${q}_a`)}
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
        {$t('flexible.back')} {$isRtl ? '←' : '→'}
      </a>
    </p>
  </section>
</main>

<DemoRequest bind:open={demoOpen} source="flexible-work" />
