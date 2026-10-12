<!--
  /broken-deal - "The deal that broke", a long-form article written to be
  shared on social networks.

  It argues from the reader's own job outward: every work regime is a deal
  (what you give, what you get, who keeps the surplus, who carries the risk),
  the familiar three have stopped paying out, and a rikma is a fourth deal
  rather than an ideology. It ends on the smallest possible step - a few hours
  a week beside the job you already have - because loss aversion is the real
  obstacle, not disagreement.

  Built for sharing, so:
  - the illustrations are inline SVG with no words in them, so they follow
    the locale (and the theme) without a second asset per language;
  - og:image is a pre-rendered 1200×630 card in /static/og;
  - the share bar uses the Web Share sheet where there is one and plain
    intent links everywhere else - no third-party scripts.

  Every class is prefixed `bd-`: global `.top`/`.label` rules leak position
  into scoped styles (see the global-class collision note in memory/docs).
-->
<script>
  import { onMount } from 'svelte';
  import { t, locale, isRtl } from '$lib/translations';
  import { registerHref } from '$lib/nav/registerHref.js';
  import { breadcrumbs, jsonLdBody } from '$lib/seo/jsonLd.js';

  const BASE = 'https://1lev1.com/broken-deal';
  const OG_IMAGE = 'https://1lev1.com/og/broken-deal.png';

  const REGIMES = ['r1', 'r2', 'r3', 'r4'];
  const MECHS = ['m1', 'm2', 'm3'];
  const ROWS = ['Give', 'Get', 'Surplus', 'Risk'];
  const SOURCES = ['s1', 's2', 's3', 's4', 's5'];

  // Canonical is the bare path for Hebrew and ?lang=xx otherwise - the same
  // rule app.html's fallback canonical follows.
  let shareUrl = $derived($locale === 'he' ? BASE : `${BASE}?lang=${$locale}`);
  let startHref = $derived(registerHref($locale, '/broken-deal'));
  let arrow = $derived($isRtl ? '←' : '→');

  let enc = $derived(encodeURIComponent(shareUrl));
  let encText = $derived(encodeURIComponent($t('brokenDeal.meta.shareText')));
  let shareLinks = $derived([
    { key: 'whatsapp', href: `https://wa.me/?text=${encText}%20${enc}` },
    { key: 'facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc}` },
    { key: 'linkedin', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc}` },
    { key: 'x', href: `https://twitter.com/intent/tweet?text=${encText}&url=${enc}` }
  ]);

  const crumbLd = $derived(
    breadcrumbs([
      { name: $t('home.crumb.home'), url: 'https://1lev1.com/' },
      { name: $t('brokenDeal.hero.title'), url: BASE }
    ])
  );
  const articleLd = $derived({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${$t('brokenDeal.hero.title')}: ${$t('brokenDeal.hero.subtitle')}`,
    description: $t('brokenDeal.meta.description'),
    image: OG_IMAGE,
    inLanguage: $locale,
    datePublished: '2026-10-13',
    author: { '@type': 'Organization', name: '1💗1', url: 'https://1lev1.com' },
    publisher: { '@type': 'Organization', name: '1💗1', url: 'https://1lev1.com' },
    mainEntityOfPage: shareUrl
  });

  let canNativeShare = $state(false);
  let copied = $state(false);
  let progress = $state(0);

  onMount(() => {
    canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      progress = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });

  async function nativeShare() {
    try {
      await navigator.share({
        title: $t('brokenDeal.hero.title'),
        text: $t('brokenDeal.meta.shareText'),
        url: shareUrl
      });
    } catch {
      // The reader closed the sheet - nothing to do.
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      copied = true;
      setTimeout(() => (copied = false), 2200);
    } catch {
      copied = false;
    }
  }
</script>

<svelte:head>
  <title>{$t('brokenDeal.meta.title')}</title>
  <meta name="description" content={$t('brokenDeal.meta.description')} />
  <link rel="canonical" href={shareUrl} />
  <meta property="og:type" content="article" />
  <meta property="og:url" content={shareUrl} />
  <meta property="og:title" content={$t('brokenDeal.meta.title')} />
  <meta property="og:description" content={$t('brokenDeal.meta.description')} />
  <meta property="og:image" content={OG_IMAGE} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={$t('brokenDeal.meta.title')} />
  <meta name="twitter:description" content={$t('brokenDeal.meta.description')} />
  <meta name="twitter:image" content={OG_IMAGE} />
  {@html `<script type="application/ld+json">${jsonLdBody(articleLd)}<\/script>`}
  {@html `<script type="application/ld+json">${jsonLdBody(crumbLd)}<\/script>`}
</svelte:head>

{#snippet shareBar()}
  <div class="bd-share">
    <p class="bd-share-title">{$t('brokenDeal.share.title')}</p>
    <div class="bd-share-row">
      {#if canNativeShare}
        <button type="button" class="bd-chip bd-chip-strong" onclick={nativeShare}>
          {$t('brokenDeal.share.native')}
        </button>
      {/if}
      {#each shareLinks as s (s.key)}
        <a class="bd-chip" href={s.href} target="_blank" rel="noopener noreferrer">
          {$t(`brokenDeal.share.${s.key}`)}
        </a>
      {/each}
      <button type="button" class="bd-chip" onclick={copyLink} aria-live="polite">
        {copied ? $t('brokenDeal.share.copied') : $t('brokenDeal.share.copy')}
      </button>
    </div>
  </div>
{/snippet}

<div class="bd-progress" aria-hidden="true">
  <span style="transform: scaleX({progress}); transform-origin: {$isRtl ? 'right' : 'left'}"></span>
</div>

<article class="bd" dir={$isRtl ? 'rtl' : 'ltr'}>
  <!-- ─── Hero ─────────────────────────────────────────────── -->
  <header class="bd-hero">
    <p class="bd-eyebrow">{$t('brokenDeal.hero.eyebrow')}</p>
    <h1>{$t('brokenDeal.hero.title')}</h1>
    <p class="bd-subtitle">{$t('brokenDeal.hero.subtitle')}</p>
    <p class="bd-byline">
      <span>{$t('brokenDeal.hero.byline')}</span>
      <span aria-hidden="true">·</span>
      <span>{$t('brokenDeal.hero.readTime')}</span>
    </p>

    <!-- A contract torn in two, stitched back together with a pink thread -
         a rikma is also embroidery. -->
    <svg class="bd-hero-art" viewBox="0 0 520 300" role="img" aria-label={$t('brokenDeal.hero.artAlt')}>
      <defs>
        <linearGradient id="bd-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--bd-paper)" />
          <stop offset="1" stop-color="var(--bd-paper-2)" />
        </linearGradient>
      </defs>
      <g transform="rotate(-5 160 150)">
        <path
          d="M40 40 H252 L240 70 L258 98 L238 128 L256 160 L236 190 L254 222 L242 260 H40 Z"
          fill="url(#bd-paper)"
          stroke="var(--gold)"
          stroke-width="2"
        />
        {#each [70, 96, 122, 148, 174, 200, 226] as y, i (y)}
          <rect x="66" y={y} width={i % 3 === 2 ? 110 : 150} height="7" rx="3.5" fill="var(--bd-line)" />
        {/each}
        <path d="M66 240 q14 -14 28 0 t28 0" fill="none" stroke="var(--bd-line)" stroke-width="3" />
      </g>
      <g transform="rotate(5 360 150)">
        <path
          d="M268 40 H480 V260 H262 L274 222 L256 190 L276 160 L258 128 L278 98 L260 70 Z"
          fill="url(#bd-paper)"
          stroke="var(--gold)"
          stroke-width="2"
        />
        {#each [70, 96, 122, 148, 174, 200, 226] as y, i (y)}
          <rect x="300" y={y} width={i % 3 === 1 ? 100 : 150} height="7" rx="3.5" fill="var(--bd-line)" />
        {/each}
        <path d="M400 240 q14 -14 28 0 t28 0" fill="none" stroke="var(--bd-line)" stroke-width="3" />
      </g>
      <!-- The stitches: drawn one after another (see .bd-stitch). -->
      <g class="bd-stitches" stroke="var(--barbi-pink)" stroke-width="5" stroke-linecap="round" fill="none">
        {#each [78, 112, 146, 180, 214] as y, i (y)}
          <path class="bd-stitch" style="--i:{i}" d="M236 {y - 11} L284 {y + 11} M284 {y - 11} L236 {y + 11}" pathLength="1" />
        {/each}
      </g>
      <path
        class="bd-heart"
        d="M260 34 c-6 -12 -24 -10 -24 4 c0 12 16 20 24 28 c8 -8 24 -16 24 -28 c0 -14 -18 -16 -24 -4 Z"
        fill="var(--barbi-pink)"
      />
    </svg>
  </header>

  <!-- ─── Intro ────────────────────────────────────────────── -->
  <section class="bd-section">
    <p class="bd-kicker">{$t('brokenDeal.intro.kicker')}</p>
    <h2>{$t('brokenDeal.intro.title')}</h2>
    <p class="bd-dropcap">{$t('brokenDeal.intro.p1')}</p>

    <figure class="bd-stat">
      <div class="bd-people" aria-hidden="true">
        {#each [0, 1, 2, 3, 4] as i (i)}
          <svg viewBox="0 0 40 64" class:bd-lit={i === 2}>
            <circle cx="20" cy="13" r="10" />
            <path d="M4 62 v-18 a16 16 0 0 1 32 0 v18 Z" />
          </svg>
        {/each}
      </div>
      <figcaption>
        <strong class="bd-stat-v">{$t('brokenDeal.intro.statValue')}</strong>
        <span class="bd-stat-l">{$t('brokenDeal.intro.statLabel')}</span>
        <span class="bd-stat-src" dir="ltr">{$t('brokenDeal.intro.statSource')}</span>
      </figcaption>
    </figure>

    <p>{$t('brokenDeal.intro.p2')}</p>
    <p class="bd-beat">{$t('brokenDeal.intro.p3')}</p>
  </section>

  <!-- ─── Part A: four regimes ─────────────────────────────── -->
  <section class="bd-section">
    <p class="bd-kicker">{$t('brokenDeal.regimes.kicker')}</p>
    <h2>{$t('brokenDeal.regimes.title')}</h2>
    <p>{$t('brokenDeal.regimes.lede')}</p>

    <ol class="bd-regimes">
      {#each REGIMES as r, i (r)}
        <li class="bd-regime" class:bd-regime-new={r === 'r4'}>
          <div class="bd-regime-head">
            <span class="bd-num">{i + 1}</span>
            <svg class="bd-icon" viewBox="0 0 48 48" aria-hidden="true">
              {#if r === 'r1'}
                <!-- hierarchy -->
                <rect x="18" y="4" width="12" height="10" rx="2" />
                <rect x="4" y="34" width="10" height="10" rx="2" />
                <rect x="19" y="34" width="10" height="10" rx="2" />
                <rect x="34" y="34" width="10" height="10" rx="2" />
                <path d="M24 14 v10 M9 34 v-10 h30 v10 M24 24 v10" />
              {:else if r === 'r2'}
                <!-- one person, one heavy load -->
                <circle cx="17" cy="10" r="5" />
                <path d="M17 15 v14 l-6 14 M17 29 l6 14 M17 20 l10 -4" />
                <circle cx="34" cy="14" r="10" class="bd-fill" />
              {:else if r === 'r3'}
                <!-- a cage with a rating star -->
                <path d="M6 44 h36 M8 44 V14 a16 10 0 0 1 32 0 V44 M16 44 V8 M24 44 V4 M32 44 V8" />
                <path class="bd-fill" d="M24 20 l2.6 5.4 5.9 .8 -4.3 4.1 1 5.8 -5.2 -2.8 -5.2 2.8 1 -5.8 -4.3 -4.1 5.9 -.8 Z" />
              {:else}
                <!-- interwoven threads around a heart -->
                <path d="M4 14 C16 6 32 22 44 14 M4 24 C16 16 32 32 44 24 M4 34 C16 26 32 42 44 34" />
                <path d="M14 4 C6 16 22 32 14 44 M34 4 C26 16 42 32 34 44" />
                <path class="bd-fill" d="M24 21 c-2 -4 -8 -3 -8 1.4 c0 4 5 6.6 8 9.6 c3 -3 8 -5.6 8 -9.6 c0 -4.4 -6 -5.4 -8 -1.4 Z" />
              {/if}
            </svg>
            <div>
              <h3>{$t(`brokenDeal.regimes.${r}.name`)}</h3>
              <p class="bd-deal">{$t(`brokenDeal.regimes.${r}.deal`)}</p>
            </div>
          </div>
          <dl class="bd-terms">
            {#each ROWS as row (row)}
              <div>
                <dt>{$t(`brokenDeal.regimes.label${row}`)}</dt>
                <dd>{$t(`brokenDeal.regimes.${r}.${row.toLowerCase()}`)}</dd>
              </div>
            {/each}
          </dl>
          <p class="bd-regime-body">{$t(`brokenDeal.regimes.${r}.body`)}</p>
        </li>
      {/each}
    </ol>
  </section>

  <!-- ─── Part B: three mechanisms ─────────────────────────── -->
  <section class="bd-section bd-panel">
    <p class="bd-kicker">{$t('brokenDeal.mech.kicker')}</p>
    <h2>{$t('brokenDeal.mech.title')}</h2>
    <p>{$t('brokenDeal.mech.lede')}</p>

    <ol class="bd-mechs">
      {#each MECHS as m (m)}
        <li>
          <svg class="bd-icon bd-icon-lg" viewBox="0 0 48 48" aria-hidden="true">
            {#if m === 'm1'}
              <!-- a share that keeps growing -->
              <circle cx="24" cy="24" r="19" />
              <path class="bd-fill" d="M24 24 V5 A19 19 0 0 1 42.1 29.9 Z" />
              <path d="M24 24 L5.9 18.1" />
            {:else if m === 'm2'}
              <!-- a clock that ends in a tick -->
              <circle cx="24" cy="24" r="19" />
              <path d="M24 11 V24 L32 29" />
              <path class="bd-accent" d="M30 40 l5 5 l10 -12" />
            {:else}
              <!-- customer straight to the people who did the work -->
              <circle cx="8" cy="24" r="5" class="bd-fill" />
              <path d="M13 24 H28 M28 24 L40 12 M28 24 L40 24 M28 24 L40 36" />
              <circle cx="42" cy="12" r="4" />
              <circle cx="42" cy="24" r="4" />
              <circle cx="42" cy="36" r="4" />
            {/if}
          </svg>
          <div>
            <h3>{$t(`brokenDeal.mech.${m}.title`)}</h3>
            <p>{$t(`brokenDeal.mech.${m}.body`)}</p>
          </div>
        </li>
      {/each}
    </ol>
  </section>

  <!-- ─── Part C: not a kibbutz ────────────────────────────── -->
  <section class="bd-section">
    <p class="bd-kicker">{$t('brokenDeal.kibbutz.kicker')}</p>
    <h2>{$t('brokenDeal.kibbutz.title')}</h2>
    <p>{$t('brokenDeal.kibbutz.p1')}</p>
    <p>{$t('brokenDeal.kibbutz.p2')}</p>

    <div class="bd-compare">
      <div class="bd-col">
        <h3>{$t('brokenDeal.kibbutz.colA')}</h3>
        <ul>
          {#each ['a1', 'a2', 'a3'] as k (k)}
            <li>{$t(`brokenDeal.kibbutz.${k}`)}</li>
          {/each}
        </ul>
      </div>
      <div class="bd-col bd-col-new">
        <h3>{$t('brokenDeal.kibbutz.colB')}</h3>
        <ul>
          {#each ['b1', 'b2', 'b3'] as k (k)}
            <li>{$t(`brokenDeal.kibbutz.${k}`)}</li>
          {/each}
        </ul>
      </div>
    </div>

    <p>{$t('brokenDeal.kibbutz.p3')}</p>
  </section>

  <!-- ─── Part D: a small, reversible experiment ───────────── -->
  <section class="bd-section">
    <p class="bd-kicker">{$t('brokenDeal.small.kicker')}</p>
    <h2>{$t('brokenDeal.small.title')}</h2>
    <p>{$t('brokenDeal.small.p1')}</p>
    <p>{$t('brokenDeal.small.p2')}</p>

    <!-- The week: the job stays whole, a sliver is added beside it. -->
    <figure class="bd-week" aria-hidden="true">
      <div class="bd-week-bar">
        <span class="bd-week-job">{$t('brokenDeal.small.weekJob')}</span>
        <span class="bd-week-rikma"></span>
      </div>
      <figcaption>
        <span class="bd-dot"></span>
        <strong>{$t('brokenDeal.small.weekRikma')}</strong>
        <span>— {$t('brokenDeal.small.weekNote')}</span>
      </figcaption>
    </figure>

    <blockquote class="bd-quote">
      <p>{$t('brokenDeal.small.quote')}</p>
    </blockquote>

    <p>{$t('brokenDeal.small.p3')}</p>
  </section>

  {@render shareBar()}

  <!-- ─── Closing ──────────────────────────────────────────── -->
  <section class="bd-close">
    <h2>{$t('brokenDeal.close.title')}</h2>
    <p>{$t('brokenDeal.close.p1')}</p>
    <div class="bd-ctas">
      <a class="bd-btn bd-btn-primary" href="/join" data-sveltekit-preload-data>
        {$t('brokenDeal.close.ctaJoin')}
      </a>
      <a class="bd-btn" href={startHref} data-sveltekit-preload-data>
        {$t('brokenDeal.close.ctaStart')}
      </a>
    </div>
    <a class="bd-more" href="/why" data-sveltekit-preload-data>
      {$t('brokenDeal.close.ctaWhy')} <span aria-hidden="true">{arrow}</span>
    </a>
  </section>

  <footer class="bd-sources">
    <h2>{$t('brokenDeal.sources.title')}</h2>
    <ol>
      {#each SOURCES as s (s)}
        <li dir="auto">{$t(`brokenDeal.sources.${s}`)}</li>
      {/each}
    </ol>
  </footer>
</article>

<style>
  .bd {
    --bd-paper: #fffaf0;
    --bd-paper-2: #f3e7cf;
    --bd-line: rgba(120, 90, 40, 0.28);
    --bd-muted: var(--tm, #94a3b8);
    --bd-card: var(--s1, rgba(255, 255, 255, 0.06));
    --bd-card-2: var(--s2, rgba(255, 255, 255, 0.04));
    --bd-radius: var(--radius-theme, 0.9rem);

    max-width: 46rem;
    margin: 0 auto;
    padding: 2.5rem 1rem 5rem;
    color: var(--text);
    font-size: 1.07rem;
    line-height: 1.9;
  }

  /* ── reading progress ── */
  .bd-progress {
    position: fixed;
    inset-inline: 0;
    top: 0;
    height: 4px;
    z-index: 60;
    pointer-events: none;
  }
  .bd-progress span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--barbi-pink), var(--gold));
    transition: transform 80ms linear;
  }

  /* ── hero ── */
  .bd-hero {
    text-align: center;
    margin-bottom: 3.25rem;
  }
  .bd-eyebrow,
  .bd-kicker {
    margin: 0 0 0.5rem;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--barbi-pink);
  }
  h1 {
    margin: 0 0 0.6rem;
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-size: clamp(2.6rem, 10vw, 4.6rem);
    font-weight: 800;
    line-height: 1.05;
    color: var(--gold);
  }
  .bd-subtitle {
    margin: 0 auto 1rem;
    max-width: 34rem;
    font-size: clamp(1.15rem, 3.4vw, 1.45rem);
    font-weight: 600;
    line-height: 1.5;
  }
  .bd-byline {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    margin: 0 0 1.75rem;
    font-size: 0.92rem;
    color: var(--bd-muted);
  }
  .bd-hero-art {
    display: block;
    width: 100%;
    max-width: 30rem;
    margin: 0 auto;
    height: auto;
    overflow: visible;
  }
  .bd-stitch {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: bd-draw 0.5s ease-out forwards;
    animation-delay: calc(0.35s + var(--i) * 0.22s);
  }
  .bd-heart {
    transform-origin: 260px 40px;
    animation: bd-beat 1.6s ease-in-out 1.6s 2;
  }
  @keyframes bd-draw {
    to {
      stroke-dashoffset: 0;
    }
  }
  @keyframes bd-beat {
    0%,
    100% {
      transform: scale(1);
    }
    30% {
      transform: scale(1.18);
    }
    60% {
      transform: scale(0.96);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .bd-stitch {
      animation: none;
      stroke-dashoffset: 0;
    }
    .bd-heart {
      animation: none;
    }
  }

  /* ── text ── */
  .bd-section {
    margin-bottom: 3.5rem;
  }
  h2 {
    margin: 0 0 1rem;
    font-size: clamp(1.4rem, 4vw, 1.85rem);
    font-weight: 800;
    line-height: 1.3;
    color: var(--gold);
  }
  h3 {
    margin: 0;
    font-size: 1.12rem;
    font-weight: 800;
    color: var(--text);
  }
  p {
    margin: 0 0 1.1rem;
  }
  .bd-beat {
    font-weight: 700;
    font-size: 1.15rem;
  }
  .bd-dropcap::first-letter {
    float: inline-start;
    margin-inline-end: 0.5rem;
    font-size: 3.4em;
    line-height: 0.9;
    font-weight: 800;
    color: var(--barbi-pink);
  }

  /* ── 1 in 5 ── */
  .bd-stat {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.25rem 1.75rem;
    margin: 2rem 0;
    padding: 1.4rem 1.5rem;
    border: 2px solid var(--gold);
    border-radius: var(--bd-radius);
    background: var(--bd-card-2);
  }
  .bd-people {
    display: flex;
    gap: 0.45rem;
  }
  .bd-people svg {
    width: 2.2rem;
    height: auto;
    fill: none;
    stroke: var(--bd-muted);
    stroke-width: 2.5;
    opacity: 0.75;
  }
  .bd-people svg.bd-lit {
    fill: var(--barbi-pink);
    stroke: var(--barbi-pink);
    opacity: 1;
  }
  .bd-stat figcaption {
    flex: 1 1 14rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .bd-stat-v {
    font-size: 2.2rem;
    line-height: 1.1;
    color: var(--barbi-pink);
  }
  .bd-stat-l {
    line-height: 1.6;
  }
  .bd-stat-src {
    font-size: 0.8rem;
    color: var(--bd-muted);
    text-align: start;
  }

  /* ── regimes ── */
  .bd-regimes {
    list-style: none;
    margin: 1.75rem 0 0;
    padding: 0;
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(19rem, 1fr));
  }
  .bd-regime {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    padding: 1.2rem 1.2rem 1rem;
    border: 1px solid color-mix(in oklab, var(--gold) 55%, transparent);
    border-radius: var(--bd-radius);
    background: var(--bd-card);
  }
  .bd-regime-new {
    border: 2px solid var(--barbi-pink);
    box-shadow: 0 0 0 4px color-mix(in oklab, var(--barbi-pink) 18%, transparent);
  }
  .bd-regime-head {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .bd-num {
    flex: none;
    display: grid;
    place-items: center;
    width: 1.8rem;
    height: 1.8rem;
    border-radius: 999px;
    font-size: 0.9rem;
    font-weight: 800;
    background: var(--gold);
    color: var(--bd-ink-on-gold, #1b1208);
  }
  .bd-regime-new .bd-num {
    background: var(--barbi-pink);
    color: #fff;
  }
  .bd-deal {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--barbi-pink);
  }
  .bd-terms {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin: 0;
  }
  .bd-terms div {
    padding: 0.45rem 0.6rem;
    border-radius: 0.55rem;
    background: var(--bd-card-2);
    border: 1px solid color-mix(in oklab, var(--gold) 25%, transparent);
  }
  .bd-terms dt {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    color: var(--bd-muted);
  }
  .bd-terms dd {
    margin: 0;
    font-size: 0.93rem;
    font-weight: 700;
    line-height: 1.4;
  }
  .bd-regime-body {
    margin: 0;
    font-size: 0.97rem;
    line-height: 1.75;
    color: var(--bd-muted);
  }

  /* ── icons ── */
  .bd-icon {
    flex: none;
    width: 2.6rem;
    height: 2.6rem;
    fill: none;
    stroke: var(--gold);
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .bd-icon-lg {
    width: 3.2rem;
    height: 3.2rem;
  }
  .bd-icon .bd-fill {
    fill: var(--barbi-pink);
    stroke: var(--barbi-pink);
  }
  .bd-icon .bd-accent {
    stroke: var(--barbi-pink);
    stroke-width: 3.2;
  }

  /* ── mechanisms ── */
  .bd-panel {
    padding: 1.75rem 1.4rem 1.4rem;
    border: 2px solid var(--gold);
    border-radius: var(--bd-radius);
    background: var(--bd-card-2);
    box-shadow: var(--shadow-theme);
  }
  .bd-mechs {
    list-style: none;
    margin: 1.5rem 0 0;
    padding: 0;
    display: grid;
    gap: 1.4rem;
  }
  .bd-mechs li {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }
  .bd-mechs h3 {
    margin-bottom: 0.25rem;
  }
  .bd-mechs p {
    margin: 0;
    font-size: 0.99rem;
    line-height: 1.75;
    color: var(--bd-muted);
  }

  /* ── kibbutz vs rikma ── */
  .bd-compare {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: 1rem;
    margin: 1.75rem 0;
  }
  .bd-col {
    padding: 1.1rem 1.2rem;
    border-radius: var(--bd-radius);
    border: 1px dashed var(--bd-muted);
  }
  .bd-col-new {
    border: 2px solid var(--barbi-pink);
    /* An image, not a colour: something global makes children inherit
       background-color, which stacked the tint once per line. */
    background-image: linear-gradient(
      color-mix(in oklab, var(--barbi-pink) 9%, transparent),
      color-mix(in oklab, var(--barbi-pink) 9%, transparent)
    );
  }
  .bd-col h3 {
    margin-bottom: 0.6rem;
  }
  .bd-col ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.5rem;
  }
  .bd-col li {
    position: relative;
    padding-inline-start: 1.4rem;
    font-size: 0.97rem;
    line-height: 1.6;
  }
  .bd-col li::before {
    content: '–';
    position: absolute;
    inset-inline-start: 0;
    color: var(--bd-muted);
  }
  .bd-col-new li::before {
    content: '✓';
    color: var(--barbi-pink);
    font-weight: 800;
  }

  /* ── the week ── */
  .bd-week {
    margin: 1.75rem 0;
  }
  .bd-week-bar {
    display: flex;
    height: 3rem;
    border-radius: 999px;
    overflow: hidden;
    border: 2px solid var(--gold);
  }
  .bd-week-job {
    flex: 10;
    display: flex;
    align-items: center;
    padding-inline: 1.1rem;
    font-size: 0.9rem;
    font-weight: 700;
    background: var(--bd-card);
    color: var(--bd-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .bd-week-rikma {
    flex: 1.6;
    background: repeating-linear-gradient(
      135deg,
      var(--barbi-pink) 0 8px,
      color-mix(in oklab, var(--barbi-pink) 70%, var(--gold)) 8px 16px
    );
  }
  .bd-week figcaption {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem 0.5rem;
    margin-top: 0.6rem;
    font-size: 0.95rem;
  }
  .bd-dot {
    width: 0.85rem;
    height: 0.85rem;
    border-radius: 999px;
    background: var(--barbi-pink);
  }

  /* ── pull quote ── */
  .bd-quote {
    margin: 2rem 0;
    padding: 1.4rem 1.5rem;
    border-inline-start: 5px solid var(--barbi-pink);
    border-radius: var(--bd-radius);
    background: var(--bd-card);
  }
  .bd-quote p {
    margin: 0;
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-size: clamp(1.3rem, 4vw, 1.65rem);
    line-height: 1.5;
    color: var(--gold);
  }

  /* ── share ── */
  .bd-share {
    margin: 0 0 2.5rem;
    padding: 1.1rem 1.2rem;
    border-radius: var(--bd-radius);
    border: 1px solid color-mix(in oklab, var(--gold) 55%, transparent);
    text-align: center;
  }
  .bd-share-title {
    margin: 0 0 0.7rem;
    font-weight: 800;
    color: var(--gold);
  }
  .bd-share-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }
  .bd-chip {
    padding: 0.45rem 1rem;
    border-radius: 999px;
    border: 1.5px solid var(--gold);
    background: transparent;
    color: var(--gold);
    font: inherit;
    font-size: 0.92rem;
    font-weight: 700;
    line-height: 1.4;
    text-decoration: none;
    cursor: pointer;
  }
  .bd-chip:hover,
  .bd-chip:focus-visible {
    background: color-mix(in oklab, var(--gold) 16%, transparent);
  }
  .bd-chip-strong {
    background: var(--barbi-pink);
    border-color: var(--barbi-pink);
    color: #fff;
  }

  /* ── closing ── */
  .bd-close {
    text-align: center;
    padding: 2.2rem 1.4rem;
    border: 2px solid var(--gold);
    border-radius: var(--bd-radius);
    /* Both layers as images - headings here inherit background-color. */
    background-image:
      radial-gradient(
        circle at 50% 0%,
        color-mix(in oklab, var(--barbi-pink) 22%, transparent),
        transparent 65%
      ),
      linear-gradient(var(--bd-card-2), var(--bd-card-2));
  }
  .bd-ctas {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.7rem;
    margin: 1.4rem 0 1rem;
  }
  .bd-btn {
    padding: 0.65rem 1.5rem;
    border-radius: 999px;
    border: 2px solid var(--gold);
    color: var(--gold);
    font-weight: 800;
    text-decoration: none;
  }
  .bd-btn-primary {
    background: var(--barbi-pink);
    border-color: var(--barbi-pink);
    color: #fff;
  }
  .bd-btn:hover {
    filter: brightness(1.1);
  }
  .bd-more {
    font-weight: 700;
    color: var(--barbi-pink);
    text-decoration: none;
  }
  .bd-more:hover {
    text-decoration: underline;
  }

  /* ── sources ── */
  .bd-sources {
    margin-top: 3rem;
    padding-top: 1.4rem;
    border-top: 1px solid color-mix(in oklab, var(--gold) 55%, transparent);
    font-size: 0.83rem;
    line-height: 1.6;
    color: var(--bd-muted);
  }
  .bd-sources h2 {
    font-size: 1rem;
  }
  .bd-sources ol {
    margin: 0;
    padding-inline-start: 1.2rem;
    display: grid;
    gap: 0.45rem;
  }
</style>
