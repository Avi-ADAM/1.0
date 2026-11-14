<!--
  /freelance - for the freelancer on the treadmill of the next client.

  /no-boss answers "a boss or a business alone?". This reader already chose
  alone, and the pain is different: every month starts from zero, the income
  stops the day the work stops, and half the week goes on finding the work.
  The argument is therefore about TIME, not autonomy: a partnership pays later
  than a client - and keeps paying, and stacks. The homepage's IncomeCurves
  graph is exactly that claim, so the page embeds it rather than restating it.

  What shaped the copy:

  1. KEEP YOUR CLIENTS. A freelancer who reads "join a partnership" hears
     "give up paid work for a maybe". The first reassurance, the first honest
     line and the first doubt all say the same thing: start with a few hours,
     alongside the clients you have.

  2. ONLY TOOLS THAT EXIST. The "instead of chasing" cards are each a running
     mechanism, named after what the reader experiences rather than its code:
     concierge requests reaching a rikma (`requestSuggestion`,
     `requestWishMission`, email + Telegram - PLAN_CONCIERGE_LOCAL_PROVIDERS §3),
     the match-suggestion email (`matching/notify.ts`, capped by
     `emailPolicy.ts`: 3/day, daytime only - the card quotes those limits, so
     change both together), the rikma's shared leads table (PLAN_LEADS), the
     demand map (/demand, threshold offers), the hours→share timer, the
     stipend (PLAN_STIPEND, α=1 shape), several rikmas in parallel, and the
     rikma shop. "Rikmas near you" (`nearbyRikmas`) was left out on purpose:
     it surfaces only inside the assistant today.

  3. COMPARE CATEGORIES, NOT BRANDS. Gig marketplaces, freelancer co-ops,
     work-for-equity and an agency of one's own - each card says what it
     genuinely solves before what stays the same. The only number is the gig
     fee band ("a tenth to a fifth"), which holds for the large marketplaces
     as of 2026 (variable 0-15% on one, 20% on another). Naming competitors
     would need dated, per-locale fact-checking this page cannot carry.

  4. SAY THE HARD PART. Not quick money, a share is not a salary, partners
     can say "not now", and profit-split income is taxable income. Same
     reason as /flexible-work: being found out later costs more than saying
     it first.

  5. MIDDLE AND END. <FreelanceArt> draws the turn (treadmill vs woven
     thread), <ThirdWayTable> is the homepage's employee/solo/rikma table
     (shared with /no-boss), and the page closes on three further reads.

  Shape (conditional listings, both doors in the hero, <details> for depth)
  follows /flexible-work.
-->
<script>
  import { t, isRtl, locale } from '$lib/translations';
  import { registerHref } from '$lib/nav/registerHref.js';
  import { breadcrumbs, jsonLdBody } from '$lib/seo/jsonLd.js';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
  import DemoRequest from '$lib/components/main/DemoRequest.svelte';
  import IncomeCurves from '$lib/components/main/IncomeCurves.svelte';
  import ThirdWayTable from '$lib/components/main/ThirdWayTable.svelte';
  import FreelanceArt from '$lib/components/main/FreelanceArt.svelte';

  let { data } = $props();

  let demoOpen = $state(false);

  let startHref = $derived(registerHref($locale, '/freelance'));

  /** @type {[import('$lib/celim/icons/entityIcons').EntityIconKind, string][]} */
  const TOOLS = [
    ['concierge', 'concierge'],
    ['mail', 'mail'],
    ['inbox', 'leads'],
    ['maagad', 'demand'],
    ['timer', 'hours'],
    ['support', 'stipend'],
    ['rikma', 'many'],
    ['store', 'shop']
  ];

  /** @type {[import('$lib/celim/icons/entityIcons').EntityIconKind, string][]} */
  const ALTERNATIVES = [
    ['offers', 'gig'],
    ['community', 'coop'],
    ['equity', 'equity'],
    ['moach', 'agency']
  ];

  /** @type {[import('$lib/celim/icons/entityIcons').EntityIconKind, string][]} */
  const VOICE = [
    ['idea', 'b1'],
    ['agreement', 'b2'],
    ['lev', 'b3']
  ];

  /* Further reading, closing the page: the neighbouring argument (/no-boss),
     the tool a rikma sells through (/shop) and the long-form why
     (/broken-deal). */
  /** @type {[import('$lib/celim/icons/entityIcons').EntityIconKind, string, string][]} */
  const READING = [
    ['rikma', 'noboss', '/no-boss'],
    ['store', 'shop', '/shop'],
    ['document', 'broken', '/broken-deal']
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
      { name: $t('freelance.hero.h1'), url: 'https://1lev1.com/freelance' }
    ])
  );
</script>

<svelte:head>
  <title>{$t('freelance.meta.title')}</title>
  <meta name="description" content={$t('freelance.meta.description')} />
  <meta property="og:title" content={$t('freelance.meta.title')} />
  <meta property="og:description" content={$t('freelance.meta.description')} />
  {@html `<script type="application/ld+json">${jsonLdBody(crumbLd)}<\/script>`}
</svelte:head>

<main
  class="min-h-screen w-full flex flex-col items-center px-4 py-10 sm:py-8 bg-surface text-surfaceInk"
  style="font-family:'Sababa',sans-serif;"
  dir={$isRtl ? 'rtl' : 'ltr'}
>
  <header class="w-full max-w-xl text-center">
    <p class="text-barbi dark:text-gold font-bold text-base sm:text-sm tracking-widest mb-2">
      {$t('freelance.hero.eyebrow')}
    </p>
    <h1
      class="text-rose-700 dark:text-gold font-bold text-3xl sm:text-2xl mb-3"
      style="text-shadow:1px 1px 2px rgba(0,0,0,0.15);"
    >
      {$t('freelance.hero.h1')}
    </h1>
    <p class="text-slate-800 dark:text-surfaceInk text-lg sm:text-base leading-relaxed max-w-lg mx-auto">
      {$t('freelance.hero.sub')}
    </p>
    <p
      class="mt-4 inline-block bg-cyan-50/70 dark:bg-surface2 backdrop-blur-sm border-2 border-gold rounded-2xl px-5 py-3 text-slate-800 dark:text-surfaceInk text-base sm:text-sm"
    >
      {$t('freelance.hero.reassure')}
    </p>
    <div class="mt-6 flex flex-wrap justify-center gap-3">
      <a
        href={startHref}
        class="bg-barbi hover:bg-white hover:text-barbi text-gold font-bold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
      >
        {$t('freelance.hero.ctaStart')}
      </a>
      <button
        type="button"
        onclick={() => (demoOpen = true)}
        class="bg-cyan-50/70 dark:bg-surface2 backdrop-blur-sm border-2 border-gold hover:bg-gold/25 text-slate-800 dark:text-surfaceInk hover:text-rose-800 dark:hover:text-gold font-semibold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-sm transition-colors"
      >
        {$t('freelance.hero.cta')}
      </button>
    </div>
  </header>

  <!-- The treadmill, stated flatly. -->
  <section class="w-full max-w-xl mt-12">
    <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-4 text-center">
      {$t('freelance.know.title')}
    </h2>
    <div class="flex flex-col gap-2.5">
      {#each ['k1', 'k2', 'k3', 'k4'] as k (k)}
        <p
          class="bg-cyan-50/55 dark:bg-surface2 backdrop-blur-sm border border-slate-300/80 rounded-xl px-4 py-3 shadow-sm text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed text-start"
        >
          {$t(`freelance.know.${k}`)}
        </p>
      {/each}
    </div>
    <p class="mt-4 text-center text-rose-700 dark:text-gold font-semibold text-lg sm:text-base">
      {$t('freelance.know.turn')}
    </p>
  </section>

  <!-- The turn, drawn: the treadmill and the coin on a stick against a
       woven thread and stacks that only grow. -->
  <section class="w-full max-w-xl mt-12">
    <FreelanceArt />
  </section>

  <!-- The homepage's employee / solo / rikma table - the same three paths
       the curves below then draw over ten years. -->
  <section class="w-full max-w-xl mt-12">
    <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-1 text-center">
      {$t('home.sections.oldWayTitle')}
    </h2>
    <p class="text-center text-slate-700 dark:text-surfaceMuted text-base sm:text-sm mb-5">
      {$t('home.sections.oldWaySub')}
    </p>
    <ThirdWayTable />
  </section>

  <!-- The whole argument in one picture: slower start, then it stacks - and
       it does not stop the day the work stops. IncomeCurves brings its own
       title (home.curves, global); this line frames it for a freelancer. -->
  <section class="w-full max-w-xl mt-12">
    <p class="text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed text-center mb-3">
      {$t('freelance.curve.lead')}
    </p>
    <IncomeCurves />
  </section>

  <!-- Beyond money: a voice in the decisions. A client decides for a
       freelancer; in a rikma every decision passes by consent. The research
       line names self-determination theory (autonomy, competence,
       relatedness -> satisfaction) and claims nothing more than that. -->
  <section class="w-full max-w-xl mt-12">
    <div
      class="rounded-2xl border-2 border-gold bg-cyan-50/70 dark:bg-surface2 backdrop-blur-sm px-5 py-6 shadow"
    >
      <div class="flex justify-center mb-2"><EntityIcon kind="votes" size={28} tone="brand" /></div>
      <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-3 text-center">
        {$t('freelance.voice.title')}
      </h2>
      <p class="text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed text-start mb-3">
        {$t('freelance.voice.p1')}
      </p>
      <p class="text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed text-start mb-4">
        {$t('freelance.voice.p2')}
      </p>
      <ul class="flex flex-col gap-2.5">
        {#each VOICE as [icon, key] (key)}
          <li
            class="flex items-start gap-3 bg-white/60 dark:bg-surface border border-gold/60 rounded-xl px-3 py-2.5 text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed text-start"
          >
            <span class="shrink-0 mt-0.5"><EntityIcon kind={icon} size={20} tone="brand" /></span>
            <span>{$t(`freelance.voice.${key}`)}</span>
          </li>
        {/each}
      </ul>
    </div>
  </section>

  <!-- What replaces the chasing - each card a mechanism that runs today. -->
  <section class="w-full max-w-xl mt-12">
    <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-2 text-center">
      {$t('freelance.tools.title')}
    </h2>
    <p class="text-slate-700 dark:text-surfaceMuted text-base sm:text-sm mb-4 text-center">
      {$t('freelance.tools.lead')}
    </p>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each TOOLS as [icon, key] (key)}
        <div
          class="bg-cyan-50/70 dark:bg-surface2 backdrop-blur-sm border-2 border-gold rounded-lg p-4 shadow flex flex-col"
        >
          <div class="mb-1"><EntityIcon kind={icon} size={24} tone="brand" /></div>
          <h3 class="text-rose-700 dark:text-gold font-bold text-lg sm:text-base mb-1">
            {$t(`freelance.tools.${key}_t`)}
          </h3>
          <p class="text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed">
            {$t(`freelance.tools.${key}_d`)}
          </p>
        </div>
      {/each}
    </div>
  </section>

  <!-- The alternatives, fairly: what each gives before what stays the same.
       Cards rather than a table - four columns do not fit a phone. -->
  <section class="w-full max-w-xl mt-12">
    <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-2 text-center">
      {$t('freelance.compare.title')}
    </h2>
    <p class="text-slate-700 dark:text-surfaceMuted text-base sm:text-sm mb-4 text-center">
      {$t('freelance.compare.lead')}
    </p>
    <div class="flex flex-col gap-3">
      {#each ALTERNATIVES as [icon, key] (key)}
        <article
          class="bg-cyan-50/60 dark:bg-surface2 backdrop-blur-sm border-2 border-gold/70 rounded-xl px-4 py-4 shadow-sm text-start"
        >
          <h3 class="flex items-center gap-2 text-rose-700 dark:text-gold font-bold text-lg sm:text-base mb-2">
            <EntityIcon kind={icon} size={22} tone="brand" />
            {$t(`freelance.compare.${key}_n`)}
          </h3>
          <dl class="flex flex-col gap-1.5 text-base sm:text-sm leading-relaxed">
            <div>
              <dt class="inline font-semibold text-slate-700 dark:text-surfaceMuted">
                {$t('freelance.compare.good')}:
              </dt>
              <dd class="inline text-slate-800 dark:text-surfaceInk">{$t(`freelance.compare.${key}_good`)}</dd>
            </div>
            <div>
              <dt class="inline font-semibold text-slate-700 dark:text-surfaceMuted">
                {$t('freelance.compare.same')}:
              </dt>
              <dd class="inline text-slate-800 dark:text-surfaceInk">{$t(`freelance.compare.${key}_same`)}</dd>
            </div>
            <div class="mt-1 rounded-lg bg-gold/15 dark:bg-gold/10 px-3 py-2">
              <dt class="inline font-bold text-barbi dark:text-gold">{$t('freelance.compare.here')}:</dt>
              <dd class="inline text-slate-800 dark:text-surfaceInk">{$t(`freelance.compare.${key}_here`)}</dd>
            </div>
          </dl>
        </article>
      {/each}
    </div>
  </section>

  <section class="w-full max-w-xl mt-12">
    <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-4 text-center">
      {$t('freelance.how.title')}
    </h2>
    <ol class="flex flex-col gap-3">
      {#each ['s1', 's2', 's3', 's4'] as step, i (step)}
        <li
          class="flex items-start gap-3 bg-cyan-50/60 dark:bg-surface2 backdrop-blur-sm border-2 border-gold/70 rounded-xl px-4 py-3 shadow-sm"
        >
          <span
            class="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-gold text-barbi flex items-center justify-center text-sm font-bold"
            >{i + 1}</span
          >
          <p class="text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed text-start">
            {$t(`freelance.how.${step}`)}
          </p>
        </li>
      {/each}
    </ol>
  </section>

  <section class="w-full max-w-xl mt-12">
    <div
      class="rounded-2xl border-2 border-barbi/70 bg-cyan-50/70 dark:bg-surface2 backdrop-blur-sm px-5 py-5 shadow"
    >
      <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-2 text-center">
        {$t('freelance.honest.title')}
      </h2>
      <p class="text-slate-700 dark:text-surfaceMuted text-base sm:text-sm mb-4 text-center">
        {$t('freelance.honest.lead')}
      </p>
      <ul class="flex flex-col gap-2.5">
        {#each ['h1', 'h2', 'h3', 'h4'] as h (h)}
          <li
            class="flex items-start gap-3 text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed text-start"
          >
            <span
              class="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-barbi/15 dark:bg-gold/20 text-barbi dark:text-gold flex items-center justify-center text-sm font-bold"
              >!</span
            >
            <span>{$t(`freelance.honest.${h}`)}</span>
          </li>
        {/each}
      </ul>
    </div>
  </section>

  <section class="w-full max-w-xl mt-12">
    {#if hasListings}
      <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-4 text-center">
        {$t('freelance.open.title')}
      </h2>
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
              {$t(`freelance.open.${key}`)}
            </span>
            <span
              class="text-barbi dark:text-gold font-semibold text-base sm:text-sm group-hover:underline whitespace-nowrap"
            >
              {$t('freelance.open.view')} {$isRtl ? '‹' : '›'}
            </span>
          </a>
        {/each}
      </div>
    {/if}

    <div
      class="mt-4 rounded-2xl border-2 border-gold bg-gradient-to-br from-amber-100 via-amber-50 to-rose-50 px-4 py-5 shadow-lg text-center"
    >
      <!-- Fixed light gradient in both modes: no `dark:` ink inside. -->
      <h2 class="text-rose-800 font-bold text-2xl sm:text-xl mb-2">
        {$t('freelance.match.title')}
      </h2>
      <p class="text-slate-800 text-base sm:text-sm leading-relaxed mb-4 max-w-lg mx-auto">
        {$t('freelance.match.sub')}
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onclick={() => (demoOpen = true)}
          class="bg-barbi hover:bg-white hover:text-barbi text-gold font-bold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
        >
          {$t('freelance.match.cta')}
        </button>
        <a
          href={startHref}
          class="bg-cyan-50/80 hover:bg-white border-2 border-barbi text-barbi font-semibold text-lg sm:text-base px-6 py-3 rounded-2xl shadow-sm transition-colors"
        >
          {$t('freelance.hero.ctaStart')}
        </a>
      </div>
    </div>
  </section>

  <section class="w-full max-w-xl mt-12">
    <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-4 text-center">
      {$t('freelance.doubts.title')}
    </h2>
    <div class="flex flex-col gap-3">
      {#each ['q1', 'q2', 'q3', 'q4', 'q5'] as q (q)}
        <details
          class="bg-cyan-50/60 dark:bg-surface2 backdrop-blur-sm border-2 border-gold/70 rounded-xl px-4 py-3 shadow-sm"
        >
          <!-- Content stays in the served HTML while closed - the L2 rule. -->
          <summary class="cursor-pointer text-rose-700 dark:text-gold font-semibold text-base sm:text-sm">
            {$t(`freelance.doubts.${q}_q`)}
          </summary>
          <p class="mt-2 text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed text-start">
            {$t(`freelance.doubts.${q}_a`)}
          </p>
        </details>
      {/each}
    </div>
  </section>

  <section class="w-full max-w-xl mt-12">
    <h2 class="text-rose-700 dark:text-gold font-bold text-2xl sm:text-xl mb-4 text-center">
      {$t('freelance.reading.title')}
    </h2>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {#each READING as [icon, key, href] (key)}
        <a
          {href}
          data-sveltekit-prefetch
          class="group flex flex-col bg-cyan-50/70 dark:bg-surface2 hover:bg-gold/20 border-2 border-gold/70 rounded-xl p-4 shadow-sm transition-colors text-start"
        >
          <span class="self-start"><EntityIcon kind={icon} size={24} tone="brand" /></span>
          <span class="mt-1 text-rose-700 dark:text-gold font-bold text-lg sm:text-base group-hover:underline">
            {$t(`freelance.reading.${key}_t`)}
          </span>
          <span class="mt-1 text-slate-800 dark:text-surfaceInk text-base sm:text-sm leading-relaxed">
            {$t(`freelance.reading.${key}_d`)}
          </span>
        </a>
      {/each}
    </div>
  </section>

  <section class="w-full max-w-xl mt-10 text-center">
    <p>
      <a
        href="/"
        class="text-barbi dark:text-gold font-semibold text-base sm:text-sm underline decoration-barbi/40 underline-offset-4 hover:text-rose-800 dark:hover:text-surfaceInk"
      >
        {$t('freelance.back')} {$isRtl ? '←' : '→'}
      </a>
    </p>
  </section>
</main>

<DemoRequest bind:open={demoOpen} source="freelance" />
