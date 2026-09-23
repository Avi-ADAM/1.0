<script>
  /**
   * The homepage — the root of the site.
   *
   * Rebuilt from the "1💗1 דף בית — רענון" design canvas. The previous page
   * was ~23 sections over a full-screen 3D background, and both customers who
   * were asked described it as heavy. This one is nine acts, each with one job:
   *
   *   hero · doors · split · consensus · circle + concierge · features ·
   *   discover + price · faq + deeper · final CTA
   *
   * What left the page still lives on its own page: the four "how to start"
   * steps are in /guid, the /no-boss and /flexible-work banners are two of the
   * doors, the identity questions and the seven value tiles are gone.
   *
   * Colour comes from `--hm-*` tokens on the root, redefined for each theme ×
   * mode in the style block below, so personal/business and day/night are four
   * palettes of one layout rather than four layouts.
   */
  import { locale, t, isRtl } from '$lib/translations';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
  import { fly } from 'svelte/transition';
  import { cubicIn, cubicOut } from 'svelte/easing';
  import { goto } from '$app/navigation';
  import { Canvas } from '@threlte/core';
  import ThreadHeart from '$lib/components/main/ThreadHeart.svelte';
  import ProductPeek from '$lib/components/main/ProductPeek.svelte';
  import SplitCalculator from '$lib/components/main/SplitCalculator.svelte';
  import VideoModal from '$lib/components/main/VideoModal.svelte';
  import DemoRequest from '$lib/components/main/DemoRequest.svelte';
  import MotionControl from '$lib/components/main/MotionControl.svelte';
  import AppearanceMenu from '$lib/components/footer/AppearanceMenu.svelte';
  import { sceneVisible, ambientAnimates, noteMotionActivity } from '$lib/stores/motion.js';
  import { lang } from '$lib/stores/lang';
  import { registerHref } from '$lib/nav/registerHref.js';
  import { WISH_PREFILL_KEY } from '$lib/concierge/wishDraft.js';
  import { seedShares, PALETTE } from '$lib/components/main/splitSeed.js';
  import { Head } from 'svead';
  import { onMount } from 'svelte';

  const image = `https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png`;

  /* The counters arrive from +page.server.js so they are in the server-rendered
     HTML - a crawler used to be served "loading data..." and four zeroes.
     `stats` is null when Strapi could not be reached during SSR, and then the
     onMount fetch below is the only source. */
  let { stats = null } = $props();

  let projectsCount = $state(stats?.projects ?? 0);
  let membersCount = $state(stats?.members ?? 0);
  let usersCount = $state(stats?.users ?? 0);
  let openMissionsCount = $state(stats?.openMissions ?? 0);
  let openResourcesCount = $state(stats?.openResources ?? 0);
  let productsCount = $state(stats?.products ?? 0);
  let statsLoaded = $state(stats !== null);

  async function loadStats() {
    try {
      const res = await fetch('/api/stat');
      if (!res.ok) throw new Error('stat fetch failed');
      const data = await res.json();
      projectsCount = data.projects ?? 0;
      membersCount = data.members ?? 0;
      usersCount = data.users ?? 0;
      openMissionsCount = data.openMissions ?? 0;
      openResourcesCount = data.openResources ?? 0;
      productsCount = data.products ?? 0;
    } catch (e) {
      console.error('Error loading stats:', e);
    } finally {
      statsLoaded = true;
    }
  }

  /* A number is shown only when it is real. Three zeroes under "part of a
     worldwide movement" is not a modest claim, it contradicts the sentence -
     and it is what a crawler saw whenever the counts had not arrived. */
  let heroStats = $derived(
    /** @type {[number, string][]} */ ([
      [projectsCount, 'proofStatProjects'],
      [usersCount, 'proofStatMembers'],
      [membersCount, 'proofStatSigners']
    ]).filter(([n]) => n > 0)
  );

  /** @type {{ icon: import('$lib/celim/icons/entityIcons').EntityIconKind, count: number, key: string, href: string }[]} */
  const discoverLinks = $derived([
    { icon: 'rikma', count: projectsCount, key: 'projects', href: '/project' },
    { icon: 'mission', count: openMissionsCount, key: 'missions', href: '/availableMission' },
    { icon: 'resource', count: openResourcesCount, key: 'resources', href: '/availiableResorce' },
    { icon: 'product', count: productsCount, key: 'products', href: '/gift' }
  ]);

  let arrow = $derived($isRtl ? '←' : '→');
  let regHref = $derived(registerHref($locale));

  /* --- hero: the rotating promise ------------------------------------------
     The H1 is fixed (a rotation cannot be the H1: whichever line is mounted
     when the crawler renders is the one it indexes). The rotation is the chip
     above it, and it only turns while ambient motion is allowed - it moves on
     its own forever, which is exactly what the pause control stops. */
  let headlines = $derived([
    $t('home.hero.headline1'),
    $t('home.hero.headline2'),
    $t('home.hero.headline3'),
    $t('home.hero.headline4'),
    $t('home.hero.headline5')
  ]);
  let currentHeadline = $state(0);
  let headlineDir = $derived($isRtl ? 1 : -1);
  $effect(() => {
    if (!$ambientAnimates) return;
    const id = setInterval(() => {
      currentHeadline = (currentHeadline + 1) % headlines.length;
    }, 3500);
    return () => clearInterval(id);
  });

  /* --- hero: the 3D stage ---------------------------------------------------- */
  // The <Canvas> sizes itself to .hm-stage-canvas; nothing to measure here.
  /** @type {HTMLElement | undefined} */
  let heroEl = $state();
  /** 0..1, how far the hero has scrolled out of view - turns the heart. */
  let heroScroll = $state(0);
  /** @type {HTMLElement | undefined} */
  let stageEl = $state();
  /* The scene stops drawing while its stage is off-screen: the rest of the
     page is long, and a WebGL loop nobody can see only costs battery. */
  let stageOnScreen = $state(true);
  $effect(() => {
    if (!stageEl) return;
    const io = new IntersectionObserver(([entry]) => {
      stageOnScreen = entry.isIntersecting;
    });
    io.observe(stageEl);
    return () => io.disconnect();
  });

  function onScroll() {
    // Engaging with the page is what tells us the movement is still wanted;
    // going quiet is what lets the scene ease down. See $lib/stores/motion.js.
    noteMotionActivity();
    const h = heroEl?.offsetHeight || window.innerHeight;
    heroScroll = Math.min(1, Math.max(0, window.scrollY / h));
  }

  /* The four contributions the formula adds up, around the heart. */
  const STAGE_CHIPS = [
    ['chipTime', 'chipTimeV', 'tr'],
    ['chipMoney', 'chipMoneyV', 'tl'],
    ['chipGear', 'chipGearV', 'br'],
    ['chipKnow', 'chipKnowV', 'bl']
  ];

  /* --- doors ---------------------------------------------------------------
     One question, asked once, in the first screen: "where are you today?".
     Each door leaves the page for the track page written for that reader. */
  /** @type {[string, string, string, import('$lib/celim/icons/entityIcons').EntityIconKind][]} */
  const DOORS = [
    ['a1', 'd1', '/partnership', 'members'],
    ['a2', 'd2', '/join', 'search'],
    ['a5', 'd3', '/no-boss', 'rikma'],
    // The reader the other doors quietly assume away: someone whose constraint
    // is not "which of these am I" but "will any of this take me".
    ['a7', 'd5', '/flexible-work', 'timer'],
    ['a6', 'd4', '/uses', 'idea']
  ];

  /* --- split: the comparison card ---------------------------------------------
     The same sample rikma the calculator opens with (splitSeed.js), so the
     percentages here are exactly the ones "show me" reveals. */
  const SPLIT = seedShares(4);
  const equalShare = 100 / SPLIT.length;
  let splitView = $state(/** @type {'given' | 'equal'} */ ('given'));
  let splitDemoOpen = $state(false);
  let pct = $derived(
    new Intl.NumberFormat($locale, { style: 'percent', maximumFractionDigits: 1 })
  );

  /* --- the circle: five stations, one direction -------------------------------
     A rikma forms, partners join, a product exists, a customer receives it,
     and a customer's request starts the next one. The founder steps on at the
     rikma, the customer at the request - one loop with two entry markers.
     Angles start at the top and travel with the reading direction. */
  const RING_KEYS = ['n1', 'n2', 'n3', 'n4', 'n5'];
  /** @type {Record<string, string>} */
  const RING_ENTRY = { n1: 'entryFounder', n5: 'entryCustomer' };
  const RING_R = 34;
  const RING_CY = 52;
  const RING_STEP = 360 / RING_KEYS.length;
  let ringDir = $derived($isRtl ? -1 : 1);
  const ringPoint = (/** @type {number} */ deg, r = RING_R) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [50 + r * Math.cos(a), RING_CY + r * Math.sin(a)];
  };
  let ringNodes = $derived(
    RING_KEYS.map((key, i) => {
      const [x, y] = ringPoint(ringDir * i * RING_STEP);
      return { key, entry: RING_ENTRY[key], x, y };
    })
  );
  let ringHeads = $derived(
    RING_KEYS.map((key, i) => {
      const deg = ringDir * (i * RING_STEP + RING_STEP / 2);
      const [x, y] = ringPoint(deg);
      return { key, x, y, r: deg + ringDir * 90 };
    })
  );
  let ringEntries = $derived(
    RING_KEYS.flatMap((key, i) => {
      if (!RING_ENTRY[key]) return [];
      const deg = ringDir * i * RING_STEP;
      const [x1, y1] = ringPoint(deg, 49);
      const [x2, y2] = ringPoint(deg, 44);
      return [{ key, x1, y1, x2, y2, r: deg + 90 }];
    })
  );

  /* --- concierge: the wish field -------------------------------------------
     Demand first: the visitor starts their wish here, and /wish/new (public,
     no login) opens with it as the title. Handed over in sessionStorage, not
     the URL, so a wish never lands in a server log or a shared link. */
  let wishText = $state('');
  function startWish(/** @type {SubmitEvent} */ e) {
    e.preventDefault();
    const text = wishText.trim();
    if (text) {
      try {
        sessionStorage.setItem(WISH_PREFILL_KEY, text);
      } catch {
        // storage blocked - the wish page simply opens empty
      }
    }
    goto('/wish/new');
  }

  /* --- features ---------------------------------------------------------------- */
  /** @type {[import('$lib/celim/icons/entityIcons').EntityIconKind, string][]} */
  const SIDE_FEATURES = [
    ['maagad', 'negotiation'],
    ['onboard', 'onboarding'],
    ['telegram', 'telegram'],
    ['ai', 'aiBot'],
    ['search', 'transparency']
  ];

  const FAQ = ['5', '1', '2', '3', '6'];

  /** @type {{ href: string, key: string }[]} */
  const DEEPER = [
    { href: '/guid', key: 'guide' },
    { href: '/quorum', key: 'quorum' },
    { href: '/grow', key: 'grow' },
    { href: '/why', key: 'why' }
  ];

  /* --- demo & video -------------------------------------------------------------
     Booking a personal demo is the third path beside login and signup. The
     recorded walkthrough is Hebrew-only for now, so elsewhere it is not
     offered. */
  const VIDEO_HOW_IT_WORKS = 'l0d1yv6Qtz4';
  let demoOpen = $state(false);
  let videoOpen = $state(false);
  let videoId = $state('');
  let videoTitle = $state('');
  let watchRecorded = $derived(
    $lang === 'he'
      ? () => {
          videoId = VIDEO_HOW_IT_WORKS;
          videoTitle = $t('home.videos.howItWorksLabel');
          videoOpen = true;
        }
      : null
  );

  onMount(() => {
    if (!statsLoaded) loadStats();
    onScroll();
    // lifts the floating widgets' rail above the pinned mobile CTA row (app.postcss)
    document.documentElement.classList.add('has-cta-bar');
    return () => document.documentElement.classList.remove('has-cta-bar');
  });
</script>

<Head
  title={$t('home.meta.title')}
  description={$t('home.meta.description')}
  {image}
  url={$t('home.pageUrl')}
/>

<svelte:head>
  <link
    href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@700;900&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<!-- Waking the scene is a page-wide concern, so it listens on the window:
     moving the pointer counts as engagement just as much as scrolling does. -->
<svelte:window onscroll={onScroll} onpointermove={noteMotionActivity} />

{#snippet logo(size = 30)}
  <span class="hm-logo" style:font-size="{size}px" dir="ltr">
    <span>1</span>
    <svg width={size * 0.86} height={size * 0.8} viewBox="0 0 26 24" aria-hidden="true">
      <path
        d="M13 22C6 17 2 13 2 8a5.5 5.5 0 0 1 11-1.5A5.5 5.5 0 0 1 24 8c0 5-4 9-11 14z"
        fill="currentColor"
      />
    </svg>
    <span>1</span>
  </span>
{/snippet}

<div class="hm" class:hm-plaindisplay={$locale === 'ar'} dir={$isRtl ? 'rtl' : 'ltr'}>
  <!-- ============ HEADER ============ -->
  <header class="hm-header">
    <a href="/" class="hm-home" aria-label={$t('home.nav.homeAria')}>{@render logo(28)}</a>
    <nav class="hm-anchors" aria-label={$t('home.nav.pageNav')}>
      <a href="#split">{$t('home.sections.navSplit')}</a>
      <a href="#consensus">{$t('home.consensus.eyebrow')}</a>
      <a href="#circle">{$t('home.sections.navConcierge')}</a>
      <a href="#features">{$t('home.sections.navFeatures')}</a>
      <a href="#faq">{$t('home.sections.navFaq')}</a>
      <a href="/why" data-sveltekit-prefetch>{$t('home.nav.why')}</a>
    </nav>
    <div class="hm-header-actions">
      <AppearanceMenu compact drop="down" />
      <a href="/login" class="hm-btn hm-btn-quiet hm-hide-sm">{$t('home.bottomCta.login')}</a>
      <a href={regHref} class="hm-btn hm-btn-primary">{$t('home.sections.ctaTop')}</a>
    </div>
  </header>

  <!-- ============ HERO ============ -->
  <section class="hm-hero" bind:this={heroEl}>
    <div class="hm-hero-copy">
      <div class="hm-ticker">
        <span class="hm-dot" aria-hidden="true"></span>
        <span class="hm-ticker-text">
          {#key currentHeadline}
            <span
              in:fly={{ x: headlineDir * 40, duration: 400, easing: cubicOut }}
              out:fly={{ x: headlineDir * -40, duration: 400, easing: cubicIn }}
              >{headlines[currentHeadline]}</span
            >
          {/key}
        </span>
        <span class="hm-ticker-dots" aria-hidden="true">
          {#each headlines as _, i (i)}
            <span class:on={i === currentHeadline}></span>
          {/each}
        </span>
      </div>

      <h1 class="hm-h1">{$t('home.hero.h1')}</h1>
      <svg class="hm-underline" viewBox="0 0 420 24" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M4 14 C 60 2, 110 22, 170 12 S 280 2, 330 13 S 400 18, 416 8"
          fill="none"
          stroke="currentColor"
          stroke-width="3.2"
          stroke-linecap="round"
        />
      </svg>

      <p class="hm-lead">{$t('home.summary.s1')}</p>

      <div class="hm-cta-row">
        <a href={regHref} class="hm-btn hm-btn-primary hm-btn-lg">
          {$t('home.sections.ctaTop')} <span aria-hidden="true">{arrow}</span>
        </a>
        <button type="button" class="hm-btn hm-btn-outline hm-btn-lg" onclick={() => (demoOpen = true)}>
          {$t('demo.button')}
        </button>
        <a href="#demo" class="hm-textlink">{$t('home.split.ctaSecondary')} ↓</a>
      </div>

      {#if heroStats.length}
        <dl class="hm-stats">
          {#each heroStats as [count, key] (key)}
            <div>
              <dt>{$t(`home.sections.${key}`)}</dt>
              <dd>{count}</dd>
            </div>
          {/each}
        </dl>
      {/if}
    </div>

    <!-- Decoration: the page says in words everything the scene shows, so the
         stage is hidden from assistive tech. "Hide" in the motion control
         unmounts the canvas entirely; the chips stay, they are the formula. -->
    <div class="hm-stage" aria-hidden="true" bind:this={stageEl}>
      <div class="hm-stage-glow"></div>
      <div class="hm-stage-canvas">
        {#if $sceneVisible}
          <Canvas>
            <ThreadHeart scroll={heroScroll} active={stageOnScreen} />
          </Canvas>
        {/if}
      </div>
      {#each STAGE_CHIPS as [label, value, corner] (label)}
        <span class="hm-chip hm-chip-{corner}">
          <small>{$t(`home.hero.${label}`)}</small>
          <b>{$t(`home.hero.${value}`)}</b>
        </span>
      {/each}
      <span class="hm-stage-result">{$t('home.hero.stageResult')}</span>
    </div>
  </section>

  <!-- ============ DOORS ============ -->
  <section id="doors" class="hm-band">
    <div class="hm-head-row">
      <div>
        <h2 class="hm-h2">{$t('home.audience.doorsTitle')}</h2>
        <p class="hm-sub">{$t('home.audience.doorsSub')}</p>
      </div>
      <div class="hm-pill-row">
        <a href="#demo" class="hm-btn hm-btn-outline">{$t('home.audience.a3')}</a>
        <button type="button" class="hm-btn hm-btn-soft" onclick={() => (demoOpen = true)}>
          {$t('home.audience.a4')} · {$t('demo.button')}
        </button>
      </div>
    </div>
    <div class="hm-doors-grid">
      {#each DOORS as [key, desc, href, icon], i (key)}
        <a {href} class="hm-door" data-sveltekit-prefetch>
          <span class="hm-icon" class:hm-icon-accent={i === 0}><EntityIcon kind={icon} size={22} /></span>
          <span class="hm-door-title">{$t(`home.audience.${key}`)}</span>
          <span class="hm-door-desc">{$t(`home.audience.${desc}`)}</span>
          <span class="hm-door-arrow" aria-hidden="true">{arrow}</span>
        </a>
      {/each}
    </div>
  </section>

  <!-- ============ SPLIT ============ -->
  <section id="split" class="hm-section hm-split">
    <div class="hm-split-copy">
      <span class="hm-eyebrow">{$t('home.split.eyebrow')}</span>
      <h2 class="hm-h2 hm-h2-xl">{$t('home.split.title')}</h2>
      <p class="hm-body">{$t('home.split.lead')}</p>
      <ul class="hm-pains">
        {#each ['f1', 'f2', 'f3', 'f4'] as f (f)}
          <li><span dir="ltr" class="hm-tag">50/50</span><span>{$t(`home.split.${f}`)}</span></li>
        {/each}
      </ul>
    </div>

    <div class="hm-card hm-compare">
      <div class="hm-compare-head">
        <div>
          <h3 class="hm-h3">{$t('home.split.calc.title')}</h3>
          <p class="hm-muted">{$t('home.split.previewSub')}</p>
        </div>
        <div class="hm-seg" role="group" aria-label={$t('home.split.viewLabel')}>
          <button
            type="button"
            aria-pressed={splitView === 'given'}
            onclick={() => (splitView = 'given')}>{$t('home.split.byGiven')}</button
          >
          <button
            type="button"
            aria-pressed={splitView === 'equal'}
            onclick={() => (splitView = 'equal')}>{$t('home.split.byEqual')}</button
          >
        </div>
      </div>

      <ul class="hm-bars">
        {#each SPLIT as row, i (row.k)}
          {@const share = splitView === 'given' ? row.share : equalShare}
          <li>
            <span class="hm-bar-name">{$t(`home.split.calc.${row.k}`)}</span>
            <span class="hm-bar-track">
              <span class="hm-bar-fill" style:width="{share}%" style:background={PALETTE[i]}></span>
              <span class="hm-bar-equal" style:inset-inline-start="{equalShare}%"></span>
            </span>
            <span class="hm-bar-value" dir="ltr">{pct.format(share / 100)}</span>
          </li>
        {/each}
      </ul>
      <p class="hm-legend">
        <span class="hm-legend-line" aria-hidden="true"></span>
        {$t('home.split.equalLine', { percent: pct.format(equalShare / 100) })}
      </p>

      <p class="hm-formula">{$t('home.split.formula')}</p>
      <p class="hm-body">{$t('home.split.calc.punch')}</p>

      <div class="hm-pill-row">
        <button
          type="button"
          class="hm-btn hm-btn-primary"
          aria-expanded={splitDemoOpen}
          aria-controls="split-demo"
          onclick={() => (splitDemoOpen = !splitDemoOpen)}
        >
          {splitDemoOpen ? $t('home.splitDemo.hide') : $t('home.splitDemo.show')}
          <span aria-hidden="true">{splitDemoOpen ? '▴' : '▾'}</span>
        </button>
        <a href="/partnership" class="hm-btn hm-btn-outline" data-sveltekit-prefetch>
          {$t('home.split.depthCta')} <span aria-hidden="true">{arrow}</span>
        </a>
      </div>
    </div>

    {#if splitDemoOpen}
      <!-- The real thing: the same calculation `prPr/hachcal.svelte` runs on
           rikma data, opened on the four partners the card above shows. -->
      <div id="split-demo" class="hm-split-demo">
        <SplitCalculator initialPartners={4} />
      </div>
    {/if}
  </section>

  <!-- ============ CONSENSUS (the night band) ============ -->
  <section id="consensus" class="hm-night">
    <div class="hm-night-copy">
      <span class="hm-eyebrow hm-eyebrow-night"
        ><span class="hm-dot" aria-hidden="true"></span>{$t('home.consensus.eyebrow')}</span
      >
      <h2 class="hm-h2 hm-h2-xl">{$t('home.consensus.title')}</h2>
      <p class="hm-body">{$t('home.summary.s2')}</p>
      <ul class="hm-choices">
        {#each ['c1', 'c2', 'c3'] as c (c)}
          <li>
            <b>{$t(`home.consensus.${c}_t`)}</b>
            <span>{$t(`home.consensus.${c}_d`)}</span>
          </li>
        {/each}
      </ul>
      <a href="/consensus" class="hm-btn hm-btn-night hm-btn-lg">
        {$t('home.consensus.cta')} <span aria-hidden="true">{arrow}</span>
      </a>
    </div>

    <!-- An illustration of a vote card, not a control: the "buttons" are
         spans, so nothing here pretends to be pressable. -->
    <figure class="hm-vote" aria-label={$t('home.consensus.vote.caption')}>
      <div class="hm-vote-top">
        <span class="hm-badge">{$t('home.consensus.vote.open')}</span>
        <span class="hm-muted hm-vote-clock">
          <EntityIcon kind="timer" size={15} />{$t('home.consensus.vote.left')}
        </span>
      </div>
      <p class="hm-h3">{$t('home.consensus.vote.title')}</p>
      <div class="hm-vote-people">
        <span class="hm-avatars" aria-hidden="true">
          <span style:background={PALETTE[0]}></span>
          <span style:background={PALETTE[1]}></span>
          <span style:background={PALETTE[2]}></span>
          <span class="hm-avatar-wait"></span>
        </span>
        <span class="hm-muted">{$t('home.consensus.vote.count', { approved: 3, total: 4 })}</span>
      </div>
      <span class="hm-vote-progress" aria-hidden="true"><span></span></span>
      <span class="hm-vote-actions" aria-hidden="true">
        <span class="on">{$t('home.consensus.vote.approve')}</span>
        <span>{$t('home.consensus.vote.talk')}</span>
        <span>{$t('home.consensus.vote.counter')}</span>
      </span>
      <figcaption class="hm-muted">{$t('home.consensus.vote.note')}</figcaption>
    </figure>
  </section>

  <!-- ============ CIRCLE + CONCIERGE ============ -->
  <section id="circle" class="hm-section">
    <div class="hm-center-head">
      <span class="hm-eyebrow">{$t('home.circle.eyebrow')}</span>
      <h2 class="hm-h2 hm-h2-xl">{$t('home.circle.title')}</h2>
      <p class="hm-body">{$t('home.circle.lead')}</p>
    </div>

    <div class="hm-circle-grid">
      <div class="hm-ring-wrap">
        <div class="hm-ring">
          <!-- Decoration: every word the ring carries is in the list below it,
               in travel order, so a screen reader gets the sequence without
               hearing five arrow glyphs. -->
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy={RING_CY} r="20" class="hm-ring-disc" />
            <circle cx="50" cy={RING_CY} r={RING_R} class="hm-ring-line" />
            {#each ringHeads as head (head.key)}
              <path
                d="M-2,-2.6 L2,0 L-2,2.6"
                class="hm-ring-head"
                transform="translate({head.x} {head.y}) rotate({head.r})"
              />
            {/each}
            {#each ringEntries as e (e.key)}
              <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} class="hm-ring-entry" />
              <polygon
                points="0,-2.6 5,0 0,2.6"
                class="hm-ring-entry-head"
                transform="translate({e.x2} {e.y2}) rotate({e.r})"
              />
            {/each}
          </svg>
          <p class="hm-ring-core" style:top="{RING_CY}%">{$t('home.circle.core')}</p>
          <ol>
            {#each ringNodes as node (node.key)}
              <li class:entry={node.entry} style:left="{node.x}%" style:top="{node.y}%">
                {$t(`home.circle.${node.key}`)}
              </li>
            {/each}
          </ol>
        </div>
        <ul class="hm-ring-legend">
          {#each ringEntries as e (e.key)}
            <li>
              <span aria-hidden="true" class:hm-flip={$isRtl}>➜</span>
              {$t(`home.circle.${RING_ENTRY[e.key]}`)}
            </li>
          {/each}
        </ul>
      </div>

      <div id="concierge" class="hm-concierge">
        <span class="hm-badge hm-badge-gold">{$t('home.sections.navConcierge')}</span>
        <h3 class="hm-h2">{$t('home.concierge.title')}</h3>
        <p class="hm-body">{$t('home.concierge.subtitle')}</p>
        <form class="hm-wish" onsubmit={startWish}>
          <label for="hm-wish" class="hm-sr">{$t('home.concierge.wishLabel')}</label>
          <input
            id="hm-wish"
            type="text"
            maxlength="120"
            bind:value={wishText}
            placeholder={$t('home.concierge.wishPlaceholder')}
          />
          <button type="submit" class="hm-btn hm-btn-primary">{$t('home.concierge.customerCta')}</button>
        </form>
        <p class="hm-flow">{$t('home.concierge.flow')}</p>
        <a href="/made-for-you" class="hm-textlink">{$t('home.concierge.more')}</a>
        <div class="hm-provider">
          <div>
            <b>{$t('home.concierge.providerTitle')}</b>
            <span class="hm-muted">{$t('home.concierge.providerShort')}</span>
          </div>
          <a href={registerHref($locale, '/concierge')} class="hm-textlink">
            {$t('home.concierge.providerCta')} <span aria-hidden="true">{arrow}</span>
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ FEATURES ============ -->
  <section id="features" class="hm-band">
    <div class="hm-head-row">
      <div>
        <h2 class="hm-h2">{$t('home.sections.featuresTitle')}</h2>
        <p class="hm-sub">{$t('home.sections.featuresSub')}</p>
      </div>
    </div>
    <div class="hm-bento">
      <!-- The live peek is the big tile: a working demo of the inside of the
           system, before signing up. -->
      <div id="demo" class="hm-tile hm-tile-big">
        <div>
          <h3 class="hm-h3">{$t('home.peek.title')}</h3>
          <p class="hm-muted">{$t('home.peek.sub')}</p>
        </div>
        <ProductPeek bare />
      </div>
      {#each SIDE_FEATURES as [icon, key] (key)}
        <div class="hm-tile" class:hm-tile-dark={key === 'aiBot'}>
          <span class="hm-icon"><EntityIcon kind={icon} size={22} /></span>
          <h3 class="hm-h4">{$t(`home.platform.${key}_t`)}</h3>
          <p class="hm-muted">{$t(`home.platform.${key}_d`)}</p>
        </div>
      {/each}
    </div>
  </section>

  <!-- ============ DISCOVER + PRICE ============ -->
  <section id="discover" class="hm-section hm-discover">
    <div>
      <h2 class="hm-h2">{$t('home.discover.title')}</h2>
      <p class="hm-sub">{$t('home.discover.sub')}</p>
    </div>
    <div class="hm-discover-grid">
      {#each discoverLinks as { icon, count, key, href } (key)}
        <a {href} class="hm-count">
          {#if statsLoaded && count > 0}
            <span class="hm-count-n">{count}</span>
          {:else}
            <span class="hm-icon"><EntityIcon kind={icon} size={22} /></span>
          {/if}
          <span class="hm-count-label">{$t(`home.discover.${key}`)}</span>
          <span class="hm-count-go">{$t('home.discover.view')} <span aria-hidden="true">{arrow}</span></span>
        </a>
      {/each}
      <a href="/demand" class="hm-count hm-count-map">
        <svg viewBox="0 0 200 120" aria-hidden="true">
          <path d="M40 40L96 28L150 62L70 86Z" />
          <circle cx="40" cy="40" r="4" /><circle cx="96" cy="28" r="6" class="g" />
          <circle cx="150" cy="62" r="4" /><circle cx="70" cy="86" r="5" class="p" />
          <circle cx="170" cy="20" r="3" />
        </svg>
        <span class="hm-count-label">{$t('home.discover.map')}</span>
        <span class="hm-count-sub">{$t('home.discover.mapSub')}</span>
        <span class="hm-count-go">{$t('home.discover.view')} <span aria-hidden="true">{arrow}</span></span>
      </a>
    </div>
    <div class="hm-price">
      <h3 class="hm-price-title">{$t('home.sections.modelTitle')}</h3>
      <p>{$t('home.sections.modelSub')}</p>
      <a href={regHref} class="hm-btn hm-btn-ink">{$t('home.sections.modelCta')}</a>
    </div>
  </section>

  <!-- ============ FAQ + DEEPER ============ -->
  <section id="faq" class="hm-section hm-faq">
    <div class="hm-faq-list">
      <h2 class="hm-h2">{$t('home.sections.faqTitle')}</h2>
      {#each FAQ as q, i (q)}
        <details class="hm-q" open={i === 0}>
          <summary>{$t(`home.maze.faq.q${q}`)}</summary>
          <p>{$t(`home.maze.faq.a${q}`)}</p>
        </details>
      {/each}
    </div>
    <div class="hm-deeper">
      <span class="hm-eyebrow">{$t('home.deeper.eyebrow')}</span>
      <h3 class="hm-h2">{$t('home.deeper.title')}</h3>
      {#each DEEPER as card (card.href)}
        <a
          href={card.href}
          class="hm-deep"
          class:hm-deep-accent={card.key === 'why'}
          data-sveltekit-prefetch
        >
          <span>
            <b>{$t(`home.${card.key}.eyebrow`)}</b>
            <span class="hm-muted">{$t(`home.${card.key}.title`)}</span>
          </span>
          <span aria-hidden="true" class="hm-door-arrow">{arrow}</span>
        </a>
      {/each}
    </div>
  </section>

  <!-- ============ FINAL CTA ============ -->
  <section class="hm-final">
    <svg viewBox="0 0 120 110" width="88" height="80" aria-hidden="true">
      <path
        d="M60 100 C 30 78, 10 60, 12 38 C 14 20, 30 12, 44 15 C 52 17, 57 23, 60 30 C 63 23, 68 17, 76 15 C 90 12, 106 20, 108 38 C 110 60, 90 78, 60 100 Z"
        class="a"
      />
      <path
        d="M60 92 C 36 74, 20 58, 22 40 C 24 27, 35 22, 45 24 C 52 26, 57 31, 60 38 C 63 31, 68 26, 75 24 C 85 22, 96 27, 98 40 C 100 58, 84 74, 60 92 Z"
        class="b"
      />
    </svg>
    <h2 class="hm-h2 hm-h2-xl">{$t('home.sections.ctaFinalTitle')}</h2>
    <p>{$t('home.sections.ctaFinalSub')}</p>
    <div class="hm-pill-row">
      <a href={regHref} class="hm-btn hm-btn-final hm-btn-lg">{$t('home.cta.register')}</a>
      <button type="button" class="hm-btn hm-btn-final-outline hm-btn-lg" onclick={() => (demoOpen = true)}>
        {$t('demo.button')}
      </button>
      <a href="/login" class="hm-textlink">{$t('home.cta.login')}</a>
    </div>
    <p class="hm-final-note">{$t('demo.reassure')}</p>
    <a href="/love" class="hm-textlink" data-sveltekit-prefetch>
      {$t('home.sections.proofTitle')} · {$t('home.sections.mapCta')}
    </a>
  </section>

  <!-- ============ FOOTER ============ -->
  <footer class="hm-footer">
    {@render logo(24)}
    <nav aria-label={$t('home.nav.footer')}>
      <a href="/faq" data-sveltekit-prefetch>{$t('home.nav.faq')}</a>
      <a href="/guid" data-sveltekit-prefetch>{$t('home.nav.guide')}</a>
      <a href="/why" data-sveltekit-prefetch>{$t('home.nav.why')}</a>
      {#if $lang == 'he'}
        <a href="https://agreement.1lev1.com" target="_blank" rel="noopener">{$t('home.nav.about')}</a>
      {/if}
      <a href="https://agreement.1lev1.com/love" target="_blank" rel="noopener"
        >{$t('home.nav.agreementMap')}</a
      >
    </nav>
  </footer>
</div>

<!-- Pause / hide the scene. Outside the `{#if $sceneVisible}` on purpose: the
     control that hides the artwork is also the only way back to it. -->
<MotionControl />

<!-- Pinned CTA row, phone only - a phone would otherwise have them only at the
     far end of the page. Sits just above the site's bottom nav. -->
<div class="hm-pinned" dir={$isRtl ? 'rtl' : 'ltr'}>
  <a href={regHref}>{$t('home.bottomCta.register')}</a>
  <button type="button" onclick={() => (demoOpen = true)}>{$t('home.bottomCta.demo')}</button>
  <a href="/login">{$t('home.bottomCta.login')}</a>
</div>

<DemoRequest bind:open={demoOpen} source="fpage" onWatchRecorded={watchRecorded} />

<VideoModal
  bind:open={videoOpen}
  {videoId}
  title={videoTitle}
  closeLabel={$t('home.videos.close')}
/>

<style>
  /* ===== tokens: theme × mode ============================================ */
  .hm {
    --hm-bg: #fbf6ea;
    --hm-surface: #fffdf7;
    --hm-ink: #2b2110;
    --hm-ink2: #4a3c22;
    --hm-muted: #6b5a3a;
    --hm-line: rgb(138 106 21 / 0.2);
    --hm-accent: #b80069;
    --hm-accent-soft: #fce9f1;
    --hm-accent-deep: #8a0050;
    --hm-cta-bg: #b80069;
    --hm-cta-ink: #fff7d6;
    --hm-gold: #eee8aa;
    --hm-gold-ink: #574010;
    --hm-goldink: #8a6a15;
    --hm-chip: #f1eada;
    --hm-track: #f4eedf;
    --hm-glow-a: #fce9f1;
    --hm-glow-b: #fff3c9;
    --hm-night-bg: #1a130a;
    --hm-night-glow-a: #3a2a10;
    --hm-night-glow-b: #4a0a30;
    --hm-night-ink: #fbf6ea;
    --hm-night-muted: #d9cca8;
    --hm-night-gold: #f0c040;
    --hm-night-pink: #ff5cad;
    --hm-final-bg: #b80069;
    --hm-final-glow: #ff4fa8;
    --hm-final-ink: #fff7d6;
    --hm-map-bg: #0e3b45;
    --hm-map-ink: #ecfeff;
    --hm-radius: 22px;
    --hm-radius-lg: 28px;
    --hm-pill: 999px;
    --hm-shadow: 0 24px 60px rgb(87 64 16 / 0.1);
    --hm-display: 'Frank Ruhl Libre', 'Noto Serif', Georgia, serif;
    --hm-display-weight: 900;
    --hm-gutter: clamp(16px, 6vw, 120px);
  }
  :global(html.dark) .hm {
    --hm-bg: #150f08;
    --hm-surface: #211810;
    --hm-ink: #f6efd9;
    --hm-ink2: #e6dab9;
    --hm-muted: #c4b48e;
    --hm-line: rgb(240 192 64 / 0.18);
    --hm-accent: #ff7abf;
    --hm-accent-soft: rgb(255 92 173 / 0.14);
    --hm-accent-deep: #ffb3d9;
    --hm-cta-bg: #f0c040;
    --hm-cta-ink: #1a130a;
    --hm-gold: rgb(240 192 64 / 0.16);
    --hm-gold-ink: #f0c040;
    --hm-goldink: #f0c040;
    --hm-chip: rgb(246 239 217 / 0.08);
    --hm-track: rgb(246 239 217 / 0.1);
    --hm-glow-a: #3d0a2a;
    --hm-glow-b: #4a2a0c;
    --hm-night-bg: #0c0804;
    --hm-final-bg: #7a0645;
    --hm-final-glow: #b80069;
    --hm-shadow: 0 24px 60px rgb(0 0 0 / 0.4);
  }
  :global(html.business) .hm {
    --hm-bg: #f4f7fb;
    --hm-surface: #ffffff;
    --hm-ink: #0f172a;
    --hm-ink2: #1e293b;
    --hm-muted: #475569;
    --hm-line: rgb(15 23 42 / 0.12);
    --hm-accent: #1d4ed8;
    --hm-accent-soft: #dbeafe;
    --hm-accent-deep: #1e3a8a;
    --hm-cta-bg: #1d4ed8;
    --hm-cta-ink: #f8fafc;
    --hm-gold: #e0f2fe;
    --hm-gold-ink: #075985;
    --hm-goldink: #1e40af;
    --hm-chip: #f1f5f9;
    --hm-track: #e2e8f0;
    --hm-glow-a: #dbeafe;
    --hm-glow-b: #f1f5f9;
    --hm-night-bg: #0f172a;
    --hm-night-glow-a: #1e3a8a;
    --hm-night-glow-b: #13254a;
    --hm-night-ink: #f8fafc;
    --hm-night-muted: #cbd5e1;
    --hm-night-gold: #93c5fd;
    --hm-night-pink: #60a5fa;
    --hm-final-bg: #1d4ed8;
    --hm-final-glow: #3b82f6;
    --hm-final-ink: #f8fafc;
    --hm-radius: 6px;
    --hm-radius-lg: 8px;
    --hm-pill: 6px;
    --hm-shadow: 0 1px 3px rgb(15 23 42 / 0.1), 0 12px 32px rgb(15 23 42 / 0.08);
    --hm-display: 'Heebo', sans-serif;
    --hm-display-weight: 800;
  }
  :global(html.business.dark) .hm {
    --hm-bg: #0b1220;
    --hm-surface: #111a2e;
    --hm-ink: #e2e8f0;
    --hm-ink2: #cbd5e1;
    --hm-muted: #94a3b8;
    --hm-line: rgb(148 163 184 / 0.2);
    --hm-accent: #60a5fa;
    --hm-accent-soft: rgb(96 165 250 / 0.14);
    --hm-accent-deep: #bfdbfe;
    --hm-cta-bg: #60a5fa;
    --hm-cta-ink: #0b1220;
    --hm-gold: rgb(96 165 250 / 0.14);
    --hm-gold-ink: #93c5fd;
    --hm-goldink: #93c5fd;
    --hm-chip: rgb(148 163 184 / 0.12);
    --hm-track: rgb(148 163 184 / 0.16);
    --hm-glow-a: #13254a;
    --hm-glow-b: #0f1a30;
    --hm-night-bg: #060b16;
    --hm-final-bg: #1e3a8a;
    --hm-final-glow: #1d4ed8;
    --hm-shadow: 0 12px 32px rgb(0 0 0 / 0.35);
  }
  /* Frank Ruhl Libre has no Arabic; a serif fallback there is a system Naskh
     of unknown quality, so Arabic keeps the body face for display too. */
  .hm.hm-plaindisplay {
    --hm-display: 'Heebo', sans-serif;
  }

  /* ===== base ============================================================= */
  .hm {
    background: var(--hm-bg);
    color: var(--hm-ink);
    font-family: 'Heebo', sans-serif;
    overflow-x: clip;
    padding-bottom: 136px; /* clears the pinned CTA row + bottom nav on phones */
  }
  @media (min-width: 640px) {
    .hm {
      padding-bottom: 0;
    }
  }
  /* :where() keeps this at element specificity, so a link's own class (the
     dark map card, a button) always wins over "inherit". */
  :where(.hm) a {
    color: inherit;
    text-decoration: none;
  }
  .hm section,
  .hm [id] {
    scroll-margin-top: 80px;
  }
  .hm-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  .hm-flip {
    display: inline-block;
    transform: scaleX(-1);
  }

  .hm-logo {
    display: inline-flex;
    align-items: center;
    gap: 1px;
    font-family: var(--hm-display);
    font-weight: 900;
    line-height: 1;
    color: var(--hm-ink);
  }
  .hm-logo svg {
    color: var(--hm-accent);
  }

  /* type */
  .hm-h1 {
    margin: 0;
    font-family: var(--hm-display);
    font-weight: var(--hm-display-weight);
    font-size: clamp(38px, 5.4vw, 74px);
    line-height: 1.04;
    letter-spacing: -0.5px;
    color: var(--hm-ink);
  }
  .hm-underline {
    width: min(420px, 70%);
    height: 18px;
    margin-top: -14px;
    color: #c9a646;
  }
  :global(html.business) .hm-underline {
    color: var(--hm-accent);
  }
  .hm-h2 {
    margin: 0;
    font-family: var(--hm-display);
    font-weight: var(--hm-display-weight);
    font-size: clamp(28px, 3.2vw, 44px);
    line-height: 1.12;
    color: var(--hm-ink);
  }
  .hm-h2-xl {
    font-size: clamp(32px, 3.8vw, 54px);
    line-height: 1.08;
  }
  .hm-h3 {
    margin: 0;
    font-weight: 800;
    font-size: clamp(19px, 1.8vw, 24px);
    line-height: 1.35;
  }
  .hm-h4 {
    margin: 0;
    font-weight: 800;
    font-size: 18px;
    line-height: 1.35;
  }
  .hm-lead {
    margin: 0;
    font-size: clamp(17px, 1.5vw, 21px);
    line-height: 1.6;
    color: var(--hm-ink2);
    max-width: 540px;
  }
  .hm-body {
    margin: 0;
    font-size: 17px;
    line-height: 1.65;
    color: var(--hm-ink2);
  }
  .hm-sub {
    margin: 6px 0 0;
    font-size: 17px;
    color: var(--hm-muted);
  }
  .hm-muted {
    margin: 0;
    font-size: 15px;
    line-height: 1.55;
    color: var(--hm-muted);
  }
  .hm-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: var(--hm-goldink);
  }
  .hm-dot {
    width: 8px;
    height: 8px;
    flex-shrink: 0;
    border-radius: 999px;
    background: var(--hm-accent);
  }

  /* buttons */
  .hm-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 20px;
    border-radius: var(--hm-pill);
    border: 1.5px solid transparent;
    background: transparent;
    font: inherit;
    font-weight: 700;
    font-size: 16px;
    line-height: 1.2;
    text-align: center;
    cursor: pointer;
    transition:
      transform 0.2s,
      box-shadow 0.2s,
      background-color 0.2s;
  }
  .hm-btn:hover {
    transform: translateY(-1px);
  }
  .hm-btn:focus-visible,
  .hm a:focus-visible,
  .hm summary:focus-visible,
  .hm-seg button:focus-visible {
    outline: 2px solid var(--hm-accent);
    outline-offset: 3px;
  }
  .hm-btn-lg {
    min-height: 56px;
    padding: 0 28px;
    font-size: 18px;
  }
  .hm .hm-btn-primary {
    background: var(--hm-cta-bg);
    color: var(--hm-cta-ink);
    box-shadow: 0 8px 22px rgb(184 0 105 / 0.22);
  }
  :global(html.business) .hm .hm-btn-primary {
    box-shadow: none;
  }
  .hm-btn-outline {
    background: var(--hm-surface);
    border-color: var(--hm-line);
    color: var(--hm-ink);
  }
  .hm-btn-outline:hover {
    border-color: var(--hm-accent);
  }
  .hm-btn-soft {
    background: var(--hm-accent-soft);
    border-color: color-mix(in srgb, var(--hm-accent) 40%, transparent);
    color: var(--hm-accent-deep);
  }
  .hm-btn-quiet {
    color: var(--hm-ink);
  }
  .hm .hm-btn-ink {
    background: var(--hm-ink);
    color: var(--hm-bg);
    white-space: nowrap;
  }
  .hm .hm-textlink {
    /* these stand alone, not inside a sentence, so they owe a full touch
       target like any button */
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-weight: 700;
    font-size: 16px;
    color: var(--hm-goldink);
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .hm-pill-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .hm-icon {
    width: 46px;
    height: 46px;
    flex-shrink: 0;
    border-radius: 15px;
    background: var(--hm-gold);
    color: var(--hm-gold-ink);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  :global(html.business) .hm-icon {
    border-radius: 6px;
  }
  .hm-icon-accent {
    background: var(--hm-cta-bg);
    color: var(--hm-cta-ink);
  }
  .hm-badge {
    align-self: flex-start;
    padding: 4px 12px;
    border-radius: var(--hm-pill);
    background: var(--hm-accent-soft);
    color: var(--hm-accent-deep);
    font-size: 13px;
    font-weight: 700;
  }
  .hm-badge-gold {
    background: var(--hm-gold);
    color: var(--hm-gold-ink);
    font-size: 14px;
  }
  .hm-card {
    background: var(--hm-surface);
    border: 1px solid var(--hm-line);
    border-radius: var(--hm-radius-lg);
    box-shadow: var(--hm-shadow);
  }

  /* section shells */
  .hm-section {
    padding: clamp(56px, 7vw, 104px) var(--hm-gutter);
  }
  .hm-band {
    padding: clamp(48px, 6vw, 88px) var(--hm-gutter);
    background: var(--hm-surface);
    border-block: 1px solid var(--hm-line);
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .hm-head-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px 40px;
  }
  .hm-center-head {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    text-align: center;
    max-width: 800px;
    margin: 0 auto 48px;
  }

  /* ===== header =========================================================== */
  .hm-header {
    position: sticky;
    top: 0;
    z-index: 600;
    display: flex;
    align-items: center;
    gap: 24px;
    height: 68px;
    padding: 0 var(--hm-gutter);
    background: color-mix(in srgb, var(--hm-bg) 88%, transparent);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--hm-line);
  }
  .hm-home {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
  }
  .hm-anchors {
    display: none;
    flex: 1;
    gap: 28px;
    font-weight: 500;
    font-size: 16px;
    color: var(--hm-ink2);
  }
  .hm-anchors a:hover {
    color: var(--hm-accent);
  }
  .hm-header-actions {
    margin-inline-start: auto;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hm-hide-sm {
    display: none;
  }
  @media (min-width: 640px) {
    .hm-hide-sm {
      display: inline-flex;
    }
  }
  @media (min-width: 1100px) {
    .hm-anchors {
      display: flex;
    }
  }

  /* ===== hero ============================================================= */
  .hm-hero {
    position: relative;
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 24px var(--hm-gutter) 48px;
    background:
      radial-gradient(ellipse 60% 70% at 22% 45%, var(--hm-glow-a) 0%, transparent 70%),
      radial-gradient(ellipse 50% 60% at 80% 10%, var(--hm-glow-b) 0%, transparent 70%),
      var(--hm-bg);
  }
  .hm-hero-copy {
    order: 2;
    display: flex;
    flex-direction: column;
    gap: 22px;
    align-items: flex-start;
  }
  .hm-stage {
    order: 1;
    position: relative;
    height: 320px;
  }
  @media (min-width: 900px) {
    .hm-hero {
      grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
      align-items: center;
      gap: 40px;
      min-height: calc(100vh - 68px);
      max-height: 860px;
      padding-block: 48px 64px;
    }
    .hm-hero-copy {
      order: 0;
      gap: 26px;
    }
    .hm-stage {
      order: 0;
      height: 580px;
    }
  }

  .hm-ticker {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    max-width: 100%;
    padding: 7px 14px;
    border-radius: var(--hm-pill);
    background: var(--hm-surface);
    border: 1px solid var(--hm-line);
    font-size: 15px;
    font-weight: 600;
    color: var(--hm-ink2);
  }
  .hm-ticker-text {
    display: grid;
    overflow: hidden;
  }
  .hm-ticker-text > span {
    grid-area: 1 / 1;
    white-space: nowrap;
  }
  .hm-ticker-dots {
    display: flex;
    gap: 4px;
  }
  .hm-ticker-dots span {
    width: 4px;
    height: 4px;
    border-radius: 4px;
    background: var(--hm-line);
    transition: width 0.3s;
  }
  .hm-ticker-dots span.on {
    width: 14px;
    background: var(--hm-accent);
  }

  .hm-cta-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }
  .hm-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 28px;
    margin: 0;
    padding-top: 18px;
    border-top: 1px solid var(--hm-line);
  }
  .hm-stats div {
    display: flex;
    flex-direction: column-reverse;
    gap: 2px;
  }
  .hm-stats dd {
    margin: 0;
    font-family: var(--hm-display);
    font-weight: 700;
    font-size: 30px;
    line-height: 1;
  }
  .hm-stats dt {
    font-size: 14px;
    color: var(--hm-muted);
  }

  /* the stage */
  .hm-stage-glow {
    position: absolute;
    inset: 8%;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgb(240 192 64 / 0.3) 0%,
      color-mix(in srgb, var(--hm-glow-a) 60%, transparent) 45%,
      transparent 72%
    );
  }
  :global(html.business) .hm-stage-glow {
    background: radial-gradient(circle, var(--hm-glow-a) 0%, transparent 70%);
  }
  .hm-stage-canvas {
    position: absolute;
    inset: 0;
  }
  .hm-chip {
    position: absolute;
    display: flex;
    flex-direction: column;
    padding: 6px 12px;
    border-radius: 14px;
    background: var(--hm-surface);
    border: 1px solid var(--hm-line);
    box-shadow: 0 8px 24px rgb(87 64 16 / 0.1);
    pointer-events: none;
  }
  :global(html.business) .hm-chip {
    border-radius: 6px;
  }
  .hm-chip small {
    font-size: 12px;
    color: var(--hm-muted);
  }
  .hm-chip b {
    font-size: 15px;
    font-weight: 800;
  }
  .hm-chip-tr {
    top: 4%;
    inset-inline-start: 2%;
  }
  .hm-chip-tl {
    top: 2%;
    inset-inline-end: 0;
  }
  .hm-chip-br {
    bottom: 4%;
    inset-inline-start: 0;
  }
  .hm-chip-bl {
    bottom: 2%;
    inset-inline-end: 2%;
  }
  .hm-stage-result {
    position: absolute;
    left: 50%;
    bottom: 13%;
    transform: translateX(-50%);
    padding: 6px 14px;
    border-radius: var(--hm-pill);
    background: var(--hm-ink);
    color: var(--hm-bg);
    font-weight: 700;
    font-size: 14px;
    white-space: nowrap;
    pointer-events: none;
  }
  @media (min-width: 900px) {
    .hm-chip b {
      font-size: 19px;
    }
    .hm-chip small {
      font-size: 13px;
    }
    .hm-stage-result {
      bottom: 6%;
      font-size: 15px;
    }
  }

  /* ===== doors ============================================================ */
  .hm-doors-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  @media (min-width: 640px) {
    .hm-doors-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (min-width: 1100px) {
    .hm-doors-grid {
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 16px;
    }
  }
  .hm-door {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 22px;
    border-radius: var(--hm-radius);
    background: var(--hm-bg);
    border: 1px solid var(--hm-line);
    transition:
      transform 0.2s,
      border-color 0.2s,
      box-shadow 0.2s;
  }
  .hm-door:hover {
    transform: translateY(-3px);
    border-color: var(--hm-accent);
    box-shadow: var(--hm-shadow);
  }
  .hm-door-title {
    font-weight: 800;
    font-size: 18px;
    line-height: 1.3;
  }
  .hm-door-desc {
    flex: 1;
    font-size: 15px;
    line-height: 1.55;
    color: var(--hm-muted);
  }
  .hm-door-arrow {
    font-weight: 800;
    color: var(--hm-accent);
  }

  /* ===== split ============================================================ */
  .hm-split {
    display: grid;
    grid-template-columns: 1fr;
    gap: 40px;
    align-items: start;
  }
  @media (min-width: 1000px) {
    .hm-split {
      grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
      gap: 64px;
    }
  }
  .hm-split-copy {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .hm-pains {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 4px 0 0;
    padding: 0;
    list-style: none;
  }
  .hm-pains li {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    padding: 14px 16px;
    border-radius: 16px;
    background: var(--hm-surface);
    border: 1px solid var(--hm-line);
    font-size: 16px;
    line-height: 1.55;
  }
  .hm-tag {
    flex-shrink: 0;
    padding: 3px 9px;
    border-radius: 999px;
    background: var(--hm-chip);
    color: var(--hm-muted);
    font-size: 12px;
    font-weight: 800;
  }
  .hm-compare {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: clamp(20px, 3vw, 36px);
  }
  .hm-compare-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 14px 20px;
  }
  .hm-seg {
    display: inline-flex;
    align-self: flex-start;
    padding: 4px;
    border-radius: var(--hm-pill);
    background: var(--hm-chip);
  }
  .hm-seg button {
    min-height: 44px;
    padding: 0 14px;
    border: 0;
    border-radius: var(--hm-pill);
    background: transparent;
    color: var(--hm-muted);
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
  .hm-seg button[aria-pressed='true'] {
    background: var(--hm-ink);
    color: var(--hm-bg);
    font-weight: 700;
  }
  .hm-bars {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .hm-bars li {
    display: grid;
    grid-template-columns: 72px 1fr 64px;
    gap: 12px;
    align-items: center;
  }
  .hm-bar-name {
    font-weight: 700;
    font-size: 16px;
  }
  .hm-bar-track {
    position: relative;
    height: 24px;
    border-radius: 999px;
    background: var(--hm-track);
  }
  .hm-bar-fill {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    border-radius: 999px;
    transition: width 0.6s cubic-bezier(0.34, 1.3, 0.64, 1);
  }
  .hm-bar-equal {
    position: absolute;
    top: -4px;
    bottom: -4px;
    width: 2px;
    background: var(--hm-ink);
    opacity: 0.35;
  }
  .hm-bar-value {
    font-weight: 800;
    font-size: 17px;
    text-align: end;
    font-variant-numeric: tabular-nums;
  }
  .hm-legend {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: -6px 0 0;
    font-size: 13px;
    color: var(--hm-muted);
  }
  .hm-legend-line {
    width: 2px;
    height: 14px;
    background: var(--hm-ink);
    opacity: 0.35;
  }
  .hm-formula {
    margin: 0;
    padding: 16px 20px;
    border-radius: 18px;
    background: var(--hm-ink);
    color: var(--hm-bg);
    font-family: var(--hm-display);
    font-weight: 700;
    font-size: clamp(17px, 1.7vw, 22px);
    line-height: 1.4;
    text-align: center;
  }
  :global(html.business) .hm-formula {
    border-radius: 6px;
  }
  .hm-split-demo {
    grid-column: 1 / -1;
  }
  @media (prefers-reduced-motion: reduce) {
    .hm-bar-fill,
    .hm-btn,
    .hm-door {
      transition: none;
    }
  }

  /* ===== consensus: the night band ======================================= */
  .hm-night {
    display: grid;
    grid-template-columns: 1fr;
    gap: 40px;
    align-items: center;
    margin: 0 clamp(8px, 3vw, 48px);
    padding: clamp(40px, 6vw, 88px) clamp(20px, 5vw, 72px);
    border-radius: clamp(24px, 3vw, 40px);
    background:
      radial-gradient(ellipse 50% 80% at 85% 20%, var(--hm-night-glow-a) 0%, transparent 70%),
      radial-gradient(ellipse 40% 60% at 10% 90%, var(--hm-night-glow-b) 0%, transparent 70%),
      var(--hm-night-bg);
    color: var(--hm-night-ink);
  }
  :global(html.business) .hm-night {
    border-radius: 8px;
  }
  :global(html.dark) .hm-night {
    border: 1px solid var(--hm-line);
  }
  @media (min-width: 1000px) {
    .hm-night {
      grid-template-columns: minmax(0, 1fr) minmax(0, 500px);
      gap: 72px;
    }
  }
  .hm-night-copy {
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
  }
  .hm-night .hm-h2 {
    color: var(--hm-night-ink);
  }
  .hm-night .hm-body {
    color: var(--hm-night-muted);
    max-width: 580px;
  }
  .hm-eyebrow-night {
    color: var(--hm-night-gold);
  }
  .hm-eyebrow-night .hm-dot {
    background: var(--hm-night-pink);
  }
  .hm-choices {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    width: 100%;
    margin: 4px 0;
    padding: 0;
    list-style: none;
  }
  .hm-choices li {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 16px;
    border-radius: 18px;
    background: rgb(251 246 234 / 0.06);
    border: 1px solid color-mix(in srgb, var(--hm-night-gold) 28%, transparent);
  }
  :global(html.business) .hm-choices li {
    border-radius: 6px;
  }
  .hm-choices b {
    font-size: 18px;
    color: var(--hm-night-gold);
  }
  .hm-choices span {
    font-size: 14px;
    line-height: 1.5;
    color: var(--hm-night-muted);
  }
  .hm .hm-btn-night {
    background: var(--hm-night-gold);
    color: var(--hm-night-bg);
  }

  .hm-vote {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin: 0;
    padding: 26px;
    border-radius: var(--hm-radius-lg);
    background: var(--hm-surface);
    color: var(--hm-ink);
    box-shadow: 0 30px 80px rgb(0 0 0 / 0.45);
  }
  .hm-vote-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .hm-vote-clock {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
  }
  .hm-vote-people {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .hm-avatars {
    display: flex;
  }
  .hm-avatars span {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    border: 2px solid var(--hm-surface);
  }
  .hm-avatars span + span {
    margin-inline-start: -10px;
  }
  .hm-avatars .hm-avatar-wait {
    background: var(--hm-chip);
    border: 2px dashed var(--hm-muted);
  }
  .hm-vote-progress {
    height: 8px;
    border-radius: 999px;
    background: var(--hm-chip);
    overflow: hidden;
  }
  .hm-vote-progress span {
    display: block;
    width: 75%;
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--hm-accent), #f0c040);
  }
  :global(html.business) .hm-vote-progress span {
    background: var(--hm-accent);
  }
  .hm-vote-actions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .hm-vote-actions span {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 46px;
    padding: 0 6px;
    border-radius: 14px;
    border: 1.5px solid var(--hm-line);
    font-weight: 700;
    font-size: 15px;
    text-align: center;
  }
  .hm-vote-actions span.on {
    background: var(--hm-cta-bg);
    border-color: var(--hm-cta-bg);
    color: var(--hm-cta-ink);
  }
  .hm-vote figcaption {
    text-align: center;
    font-size: 14px;
  }

  /* ===== circle + concierge =============================================== */
  .hm-circle-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 56px;
    align-items: center;
  }
  @media (min-width: 1000px) {
    .hm-circle-grid {
      grid-template-columns: minmax(0, 480px) minmax(0, 1fr);
      gap: 64px;
    }
  }
  .hm-ring-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .hm-ring {
    position: relative;
    width: 100%;
    max-width: 440px;
    aspect-ratio: 1;
  }
  .hm-ring svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .hm-ring-disc {
    fill: var(--hm-accent-soft);
  }
  .hm-ring-line {
    fill: none;
    stroke: #c9a646;
    stroke-width: 0.5;
    stroke-dasharray: 0.3 1.8;
    stroke-linecap: round;
  }
  :global(html.business) .hm-ring-line {
    stroke: var(--hm-muted);
  }
  .hm-ring-head {
    fill: none;
    stroke: var(--hm-goldink);
    stroke-width: 0.7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .hm-ring-entry {
    stroke: var(--hm-accent);
    stroke-width: 0.8;
    stroke-linecap: round;
  }
  .hm-ring-entry-head {
    fill: var(--hm-accent);
  }
  .hm-ring-core {
    position: absolute;
    left: 50%;
    width: 36%;
    margin: 0;
    transform: translate(-50%, -50%);
    text-align: center;
    font-family: var(--hm-display);
    font-weight: 700;
    font-size: clamp(14px, 1.4vw, 18px);
    line-height: 1.3;
    color: var(--hm-accent-deep);
  }
  .hm-ring ol {
    position: absolute;
    inset: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .hm-ring li {
    position: absolute;
    transform: translate(-50%, -50%);
    padding: 6px 14px;
    border-radius: var(--hm-pill);
    background: var(--hm-surface);
    border: 1px solid var(--hm-line);
    font-weight: 700;
    font-size: 15px;
    white-space: nowrap;
  }
  .hm-ring li.entry {
    border: 2px solid var(--hm-accent);
  }
  .hm-ring-legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px 22px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 14px;
    color: var(--hm-ink2);
  }
  .hm-ring-legend li {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .hm-ring-legend li > span {
    color: var(--hm-accent);
    font-weight: 800;
  }

  .hm-concierge {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 18px;
  }
  .hm-concierge > :not(.hm-badge, .hm-textlink) {
    align-self: stretch;
  }
  .hm-wish {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px;
    border-radius: 24px;
    background: var(--hm-surface);
    border: 1.5px solid color-mix(in srgb, var(--hm-accent) 35%, transparent);
    box-shadow: 0 16px 40px rgb(184 0 105 / 0.08);
  }
  :global(html.business) .hm-wish {
    border-radius: 8px;
    box-shadow: var(--hm-shadow);
  }
  .hm-wish input {
    flex: 1 1 220px;
    min-width: 0;
    min-height: 50px;
    padding: 0 14px;
    border: 0;
    border-radius: 16px;
    background: transparent;
    font: inherit;
    font-size: 17px;
    color: var(--hm-ink);
  }
  .hm-wish input::placeholder {
    color: var(--hm-muted);
  }
  .hm-wish input:focus-visible {
    outline: 2px solid var(--hm-accent);
  }
  .hm-wish .hm-btn {
    flex: 1 0 auto;
    border-radius: 16px;
  }
  :global(html.business) .hm-wish .hm-btn {
    border-radius: 6px;
  }
  .hm-flow {
    margin: 0;
    padding: 10px 14px;
    border-radius: 14px;
    background: var(--hm-chip);
    font-size: 14px;
    font-weight: 600;
    line-height: 1.6;
    color: var(--hm-ink2);
  }
  .hm-provider {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px 20px;
    padding: 18px 20px;
    border-radius: 18px;
    border: 1px dashed var(--hm-line);
  }
  .hm-provider > div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1 1 260px;
  }
  .hm-provider b {
    font-size: 17px;
  }

  /* ===== features bento =================================================== */
  .hm-bento {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }
  @media (min-width: 700px) {
    .hm-bento {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .hm-tile-big {
      grid-column: 1 / -1;
    }
  }
  @media (min-width: 1100px) {
    .hm-bento {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .hm-tile-big {
      grid-column: span 2;
      grid-row: span 2;
    }
  }
  .hm-tile {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 24px;
    border-radius: var(--hm-radius);
    background: var(--hm-bg);
    border: 1px solid var(--hm-line);
  }
  .hm-tile-big {
    gap: 18px;
    padding: clamp(16px, 2.5vw, 28px);
  }
  .hm-tile-dark {
    background: var(--hm-night-bg);
    border-color: transparent;
    color: var(--hm-night-ink);
  }
  .hm-tile-dark .hm-muted {
    color: var(--hm-night-muted);
  }
  .hm-tile-dark .hm-h4 {
    color: var(--hm-night-gold);
  }
  .hm-tile-dark .hm-icon {
    background: var(--hm-cta-bg);
    color: var(--hm-cta-ink);
  }

  /* ===== discover + price ================================================= */
  .hm-discover {
    display: flex;
    flex-direction: column;
    gap: 26px;
    padding-bottom: 32px;
  }
  .hm-discover-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  @media (min-width: 1000px) {
    .hm-discover-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr)) 1.4fr;
      gap: 14px;
    }
  }
  .hm-count {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 20px;
    border-radius: var(--hm-radius);
    background: var(--hm-surface);
    border: 1px solid var(--hm-line);
    transition: border-color 0.2s;
  }
  .hm-count:hover {
    border-color: var(--hm-accent);
  }
  .hm-count-n {
    font-family: var(--hm-display);
    font-weight: 900;
    font-size: 38px;
    line-height: 1;
  }
  .hm-count-label {
    font-weight: 700;
    font-size: 16px;
    line-height: 1.35;
  }
  .hm-count-sub {
    font-size: 14px;
    opacity: 0.85;
  }
  .hm-count-go {
    margin-top: auto;
    padding-top: 8px;
    font-size: 14px;
    font-weight: 700;
    color: var(--hm-accent);
  }
  .hm-count-map {
    position: relative;
    overflow: hidden;
    grid-column: 1 / -1;
    justify-content: flex-end;
    min-height: 150px;
    background: var(--hm-map-bg);
    border-color: transparent;
    color: var(--hm-map-ink);
  }
  @media (min-width: 1000px) {
    .hm-count-map {
      grid-column: auto;
    }
  }
  .hm-count-map svg {
    position: absolute;
    top: 8px;
    inset-inline-end: 8px;
    width: 200px;
    opacity: 0.6;
  }
  .hm-count-map path {
    fill: none;
    stroke: #67e8f9;
    stroke-width: 1;
    stroke-dasharray: 2 4;
  }
  .hm-count-map circle {
    fill: #67e8f9;
  }
  .hm-count-map circle.g {
    fill: #f0c040;
  }
  .hm-count-map circle.p {
    fill: #ff5cad;
  }
  .hm-count-map > span {
    position: relative;
  }
  .hm-count-map .hm-count-go {
    color: #f0c040;
  }
  .hm-price {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 24px;
    padding: 20px 26px;
    border-radius: var(--hm-radius);
    background: var(--hm-gold);
    color: var(--hm-ink);
  }
  .hm-price-title {
    margin: 0;
    font-family: var(--hm-display);
    font-weight: var(--hm-display-weight);
    font-size: 26px;
    white-space: nowrap;
  }
  .hm-price p {
    flex: 1 1 320px;
    margin: 0;
    font-size: 17px;
    line-height: 1.55;
    color: var(--hm-ink2);
  }

  /* ===== faq + deeper ===================================================== */
  .hm-faq {
    display: grid;
    grid-template-columns: 1fr;
    gap: 48px;
    align-items: start;
    padding-top: 48px;
  }
  @media (min-width: 1000px) {
    .hm-faq {
      grid-template-columns: minmax(0, 1fr) minmax(0, 480px);
      gap: 64px;
    }
  }
  .hm-faq-list,
  .hm-deeper {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .hm-faq-list .hm-h2,
  .hm-deeper .hm-h2 {
    margin-bottom: 8px;
  }
  .hm-q {
    border-radius: 18px;
    border: 1px solid var(--hm-line);
    background: transparent;
  }
  .hm-q[open] {
    background: var(--hm-surface);
  }
  .hm-q summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 44px;
    padding: 16px 22px;
    font-weight: 700;
    font-size: 17px;
    cursor: pointer;
    list-style: none;
  }
  .hm-q summary::-webkit-details-marker {
    display: none;
  }
  .hm-q summary::after {
    content: '+';
    font-size: 22px;
    font-weight: 500;
    color: var(--hm-goldink);
  }
  .hm-q[open] summary::after {
    content: '−';
    color: var(--hm-accent);
  }
  .hm-q p {
    margin: 0;
    padding: 0 22px 20px;
    font-size: 16px;
    line-height: 1.65;
    color: var(--hm-ink2);
  }
  .hm-deep {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 20px;
    border-radius: 18px;
    background: var(--hm-surface);
    border: 1px solid var(--hm-line);
    transition: border-color 0.2s;
  }
  .hm-deep:hover {
    border-color: var(--hm-accent);
  }
  .hm-deep > span:first-child {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .hm-deep b {
    font-size: 16px;
  }
  .hm-deep-accent {
    background: var(--hm-accent-soft);
  }

  /* ===== final CTA ======================================================== */
  .hm-final {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    margin: 0 clamp(8px, 3vw, 48px);
    padding: clamp(48px, 6vw, 80px) clamp(20px, 5vw, 72px);
    border-radius: clamp(24px, 3vw, 40px);
    background:
      radial-gradient(ellipse 60% 90% at 50% 0%, var(--hm-final-glow) 0%, transparent 70%),
      var(--hm-final-bg);
    color: var(--hm-final-ink);
    text-align: center;
  }
  :global(html.business) .hm-final {
    border-radius: 8px;
  }
  .hm-final .hm-h2 {
    color: var(--hm-final-ink);
  }
  .hm-final p {
    margin: 0;
    max-width: 640px;
    font-size: 19px;
    line-height: 1.6;
  }
  .hm-final .hm-pill-row {
    justify-content: center;
  }
  .hm .hm-final .hm-textlink {
    color: var(--hm-final-ink);
  }
  .hm-final .hm-final-note {
    font-size: 15px;
    opacity: 0.9;
  }
  .hm-final svg .a {
    fill: none;
    stroke: #f0c040;
    stroke-width: 5;
    stroke-linejoin: round;
  }
  .hm-final svg .b {
    fill: none;
    stroke: var(--hm-final-ink);
    stroke-width: 2.5;
    stroke-dasharray: 14 6;
  }
  :global(html.business) .hm-final svg .a {
    stroke: #93c5fd;
  }
  .hm .hm-btn-final {
    background: var(--hm-final-ink);
    color: var(--hm-final-bg);
  }
  .hm-btn-final-outline {
    border: 2px solid var(--hm-final-ink);
    color: var(--hm-final-ink);
  }

  /* ===== footer =========================================================== */
  .hm-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 20px 40px;
    padding: 40px var(--hm-gutter);
    color: var(--hm-muted);
    font-size: 15px;
  }
  .hm-footer nav {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 28px;
  }
  .hm-footer nav a {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    color: var(--hm-ink2);
  }
  .hm-footer nav a:hover {
    color: var(--hm-accent);
  }

  /* ===== pinned phone CTA ================================================= */
  .hm-pinned {
    position: fixed;
    inset-inline: 12px;
    bottom: 4rem;
    z-index: 45;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    max-width: 32rem;
    margin: 0 auto;
    padding: 6px;
    border-radius: 20px;
    background: rgb(43 33 16 / 0.92);
    backdrop-filter: blur(10px);
    box-shadow: 0 12px 32px rgb(43 33 16 / 0.35);
    font-family: 'Heebo', sans-serif;
  }
  :global(html.business) .hm-pinned {
    background: rgb(15 23 42 / 0.94);
    border-radius: 8px;
  }
  .hm-pinned > * {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 46px;
    border-radius: 14px;
    border: 0;
    font: inherit;
    font-weight: 700;
    font-size: 15px;
    text-decoration: none;
    cursor: pointer;
  }
  .hm-pinned > :nth-child(1) {
    background: #b80069;
    color: #fff7d6;
  }
  :global(html.business) .hm-pinned > :nth-child(1) {
    background: #1d4ed8;
    color: #f8fafc;
  }
  .hm-pinned > :nth-child(2) {
    background: #fbf6ea;
    color: #2b2110;
  }
  .hm-pinned > :nth-child(3) {
    background: transparent;
    border: 1.5px solid rgb(240 192 64 / 0.6);
    color: #f0c040;
  }
  :global(html.business) .hm-pinned > :nth-child(3) {
    border-color: rgb(147 197 253 / 0.6);
    color: #93c5fd;
  }
  @media (min-width: 640px) {
    .hm-pinned {
      display: none;
    }
  }
</style>
