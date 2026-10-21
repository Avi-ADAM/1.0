<!--
  /its-yours - "If you see a job, it's yours", a long-form article on personal
  responsibility in a partnership with no boss.

  It starts from the bystander effect (the more people see a problem, the
  fewer fix it), names the three mechanisms behind it and the job structure
  that rewards complaining, shows places built around a third option -
  fixing (Toyota's cord, Wikipedia's "Be bold", Pirkei Avot) - and lands on
  the rikma, where a complaint has no address but ourselves and turns into a
  mission. It closes on the limits: responsibility is not taking over, and
  anything that lands on another partner still waits for their consent.

  Built like /broken-deal, for sharing:
  - illustrations are inline SVG with no words in them, so they follow the
    locale and the theme;
  - og:image is a pre-rendered 1200×630 card in /static/og;
  - the share bar uses the Web Share sheet where there is one and plain
    intent links everywhere else.

  Every class is prefixed `iy-`: global `.top`/`.label` rules leak position
  into scoped styles.
-->
<script>
  import { onMount } from 'svelte';
  import { t, locale, isRtl } from '$lib/translations';
  import { registerHref } from '$lib/nav/registerHref.js';
  import { breadcrumbs, jsonLdBody } from '$lib/seo/jsonLd.js';

  const BASE = 'https://1lev1.com/its-yours';
  const OG_IMAGE = 'https://1lev1.com/og/its-yours.png';

  const MECHS = ['m1', 'm2', 'm3'];
  const EXAMPLES = ['e1', 'e2', 'e3'];
  const STEPS = ['s1', 's2', 's3', 's4'];
  const SOURCES = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];

  /* Darley & Latané 1968: share of participants who went to help, by how
     many others they believed could hear. `people` is the group size drawn. */
  const STAT = [
    { key: 'statAlone', value: 85, people: 1 },
    { key: 'statOne', value: 62, people: 2 },
    { key: 'statFour', value: 31, people: 5 }
  ];

  // Canonical is the bare path for Hebrew and ?lang=xx otherwise - the same
  // rule app.html's fallback canonical follows.
  let shareUrl = $derived($locale === 'he' ? BASE : `${BASE}?lang=${$locale}`);
  let startHref = $derived(registerHref($locale, '/its-yours'));
  let arrow = $derived($isRtl ? '←' : '→');
  let pct = $derived(new Intl.NumberFormat($locale, { style: 'percent' }));

  let enc = $derived(encodeURIComponent(shareUrl));
  let encText = $derived(encodeURIComponent($t('itsYours.meta.shareText')));
  let shareLinks = $derived([
    { key: 'whatsapp', href: `https://wa.me/?text=${encText}%20${enc}` },
    { key: 'facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc}` },
    { key: 'linkedin', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc}` },
    { key: 'x', href: `https://twitter.com/intent/tweet?text=${encText}&url=${enc}` }
  ]);

  const crumbLd = $derived(
    breadcrumbs([
      { name: $t('home.crumb.home'), url: 'https://1lev1.com/' },
      { name: $t('itsYours.hero.title'), url: BASE }
    ])
  );
  const articleLd = $derived({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: $t('itsYours.hero.title'),
    description: $t('itsYours.meta.description'),
    image: OG_IMAGE,
    inLanguage: $locale,
    datePublished: '2026-10-21',
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
        title: $t('itsYours.hero.title'),
        text: $t('itsYours.meta.shareText'),
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
  <title>{$t('itsYours.meta.title')}</title>
  <meta name="description" content={$t('itsYours.meta.description')} />
  <link rel="canonical" href={shareUrl} />
  <meta property="og:type" content="article" />
  <meta property="og:url" content={shareUrl} />
  <meta property="og:title" content={$t('itsYours.meta.title')} />
  <meta property="og:description" content={$t('itsYours.meta.description')} />
  <meta property="og:image" content={OG_IMAGE} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={$t('itsYours.meta.title')} />
  <meta name="twitter:description" content={$t('itsYours.meta.description')} />
  <meta name="twitter:image" content={OG_IMAGE} />
  {@html `<script type="application/ld+json">${jsonLdBody(articleLd)}<\/script>`}
  {@html `<script type="application/ld+json">${jsonLdBody(crumbLd)}<\/script>`}
</svelte:head>

{#snippet person(/** @type {number} */ x, /** @type {number} */ y, cls = '')}
  <g class={cls} transform="translate({x} {y})">
    <circle cx="0" cy="-46" r="12" />
    <path d="M-17 0 v-18 a17 17 0 0 1 34 0 v18 Z" />
  </g>
{/snippet}

{#snippet shareBar()}
  <div class="iy-share">
    <p class="iy-share-title">{$t('itsYours.share.title')}</p>
    <div class="iy-share-row">
      {#if canNativeShare}
        <button type="button" class="iy-chip iy-chip-strong" onclick={nativeShare}>
          {$t('itsYours.share.native')}
        </button>
      {/if}
      {#each shareLinks as s (s.key)}
        <a class="iy-chip" href={s.href} target="_blank" rel="noopener noreferrer">
          {$t(`itsYours.share.${s.key}`)}
        </a>
      {/each}
      <button type="button" class="iy-chip" onclick={copyLink} aria-live="polite">
        {copied ? $t('itsYours.share.copied') : $t('itsYours.share.copy')}
      </button>
    </div>
  </div>
{/snippet}

<div class="iy-progress" aria-hidden="true">
  <span style="transform: scaleX({progress}); transform-origin: {$isRtl ? 'right' : 'left'}"></span>
</div>

<article class="iy" dir={$isRtl ? 'rtl' : 'ltr'}>
  <!-- ─── Hero ─────────────────────────────────────────────── -->
  <header class="iy-hero">
    <p class="iy-eyebrow">{$t('itsYours.hero.eyebrow')}</p>
    <h1>{$t('itsYours.hero.title')}</h1>
    <p class="iy-subtitle">{$t('itsYours.hero.subtitle')}</p>
    <p class="iy-byline">
      <span>{$t('itsYours.hero.byline')}</span>
      <span aria-hidden="true">·</span>
      <span>{$t('itsYours.hero.readTime')}</span>
    </p>

    <!-- Three people stand and point at a crack in the ground; one kneels and
         stitches it shut with a pink thread - a rikma is also embroidery. -->
    <svg class="iy-hero-art" viewBox="0 0 520 280" role="img" aria-label={$t('itsYours.hero.artAlt')}>
      <!-- ground, broken by the crack -->
      <path class="iy-ground" d="M10 220 H226 M318 220 H510" />
      <path class="iy-crack" d="M226 220 L240 236 L252 226 L266 246 L280 228 L294 240 L318 220" />
      <!-- the pointers -->
      <g class="iy-crowd">
        {@render person(50, 218)}
        {@render person(115, 218)}
        {@render person(180, 218)}
        <path d="M64 192 L92 176 M129 192 L157 176 M194 192 L226 182" />
      </g>
      <!-- the one who kneels: body, raised needle arm, the thread -->
      <g class="iy-fixer">
        <circle cx="356" cy="164" r="11" />
        <path d="M344 220 v-18 q0 -24 22 -26 q16 0 18 16 l-6 28 Z" />
        <path class="iy-fixer-arm" d="M350 190 Q326 196 304 214" />
      </g>
      <g class="iy-stitches" stroke-linecap="round" fill="none">
        {#each [236, 254, 272, 290, 306] as x, i (x)}
          <path class="iy-stitch" style="--i:{i}" d="M{x - 7} 220 L{x + 7} 240 M{x + 7} 220 L{x - 7} 240" pathLength="1" />
        {/each}
      </g>
      <!-- the heart rises over the mended crack -->
      <path
        class="iy-heart"
        d="M272 152 c-6 -12 -24 -10 -24 4 c0 12 16 20 24 28 c8 -8 24 -16 24 -28 c0 -14 -18 -16 -24 -4 Z"
      />
      <!-- the crowd's alarm marks, no words -->
      <g class="iy-marks">
        <path d="M50 118 v14 M50 140 v1" />
        <path d="M115 112 v14 M115 134 v1" />
        <path d="M180 118 v14 M180 140 v1" />
      </g>
    </svg>
  </header>

  <!-- ─── Intro ────────────────────────────────────────────── -->
  <section class="iy-section">
    <p class="iy-kicker">{$t('itsYours.intro.kicker')}</p>
    <h2>{$t('itsYours.intro.title')}</h2>
    <p class="iy-dropcap">{$t('itsYours.intro.p1')}</p>
    <p>{$t('itsYours.intro.p2')}</p>

    <figure class="iy-stat">
      <figcaption class="iy-stat-title">{$t('itsYours.intro.statTitle')}</figcaption>
      <ol class="iy-bars">
        {#each STAT as s (s.key)}
          <li>
            <span class="iy-bar-v" dir="ltr">{pct.format(s.value / 100)}</span>
            <span class="iy-bar" style:--h={s.value}></span>
            <span class="iy-bar-people" aria-hidden="true">
              {#each Array(s.people) as _, j (j)}
                <svg viewBox="0 0 20 30" class:iy-lit={j === 0}>
                  <circle cx="10" cy="7" r="5" />
                  <path d="M2 29 v-9 a8 8 0 0 1 16 0 v9 Z" />
                </svg>
              {/each}
            </span>
            <span class="iy-bar-l">{$t(`itsYours.intro.${s.key}`)}</span>
          </li>
        {/each}
      </ol>
      <span class="iy-stat-src" dir="ltr">{$t('itsYours.intro.statSource')}</span>
    </figure>

    <p>{$t('itsYours.intro.p3')}</p>
    <p class="iy-beat">{$t('itsYours.intro.beat')}</p>
  </section>

  <!-- ─── Part A: why we blame ─────────────────────────────── -->
  <section class="iy-section">
    <p class="iy-kicker">{$t('itsYours.why.kicker')}</p>
    <h2>{$t('itsYours.why.title')}</h2>
    <p>{$t('itsYours.why.lede')}</p>

    <ol class="iy-cards">
      {#each MECHS as m (m)}
        <li class="iy-card">
          <svg class="iy-icon iy-icon-lg" viewBox="0 0 48 48" aria-hidden="true">
            {#if m === 'm1'}
              <!-- one load, broken into ever smaller pieces -->
              <circle cx="24" cy="24" r="7" class="iy-fill" />
              <circle cx="9" cy="12" r="3.5" />
              <circle cx="40" cy="10" r="3" />
              <circle cx="42" cy="34" r="2.5" />
              <circle cx="8" cy="38" r="2" />
              <circle cx="25" cy="44" r="1.5" />
            {:else if m === 'm2'}
              <!-- three in a row, the last one only an outline -->
              <circle cx="9" cy="14" r="5" class="iy-fill" />
              <path d="M2 40 v-10 a7 7 0 0 1 14 0 v10" />
              <circle cx="24" cy="14" r="5" class="iy-fill" />
              <path d="M17 40 v-10 a7 7 0 0 1 14 0 v10" />
              <circle cx="39" cy="14" r="5" stroke-dasharray="2 3" />
              <path d="M32 40 v-10 a7 7 0 0 1 14 0 v10" stroke-dasharray="2 3" />
            {:else}
              <!-- a finger pointing up and away -->
              <circle cx="12" cy="36" r="6" class="iy-fill" />
              <path d="M18 30 L38 10 M38 10 h-10 M38 10 v10" />
            {/if}
          </svg>
          <div>
            <h3>{$t(`itsYours.why.${m}.title`)}</h3>
            <p>{$t(`itsYours.why.${m}.body`)}</p>
          </div>
        </li>
      {/each}
    </ol>

    <p>{$t('itsYours.why.p1')}</p>
    <p>{$t('itsYours.why.p2')}</p>
  </section>

  <!-- ─── Part B: the third option ─────────────────────────── -->
  <section class="iy-section iy-panel">
    <p class="iy-kicker">{$t('itsYours.fix.kicker')}</p>
    <h2>{$t('itsYours.fix.title')}</h2>
    <p>{$t('itsYours.fix.lede')}</p>

    <!-- Exit, voice - and the third arrow, the one that stays and mends. -->
    <svg class="iy-paths" viewBox="0 0 300 120" aria-hidden="true">
      <circle cx="150" cy="96" r="10" class="iy-fill" />
      <path d="M150 86 Q150 50 40 22 M40 22 l12 -2 M40 22 l6 10" />
      <path d="M150 86 Q150 50 260 22 M260 22 l-12 -2 M260 22 l-6 10" />
      <path class="iy-accent" d="M150 86 V18 M150 18 l-8 10 M150 18 l8 10" />
    </svg>

    <ol class="iy-examples">
      {#each EXAMPLES as e (e)}
        <li>
          <svg class="iy-icon iy-icon-lg" viewBox="0 0 48 48" aria-hidden="true">
            {#if e === 'e1'}
              <!-- the line, and the cord that stops it -->
              <path d="M4 10 H44" />
              <path d="M30 10 V30" />
              <circle cx="30" cy="34" r="4" class="iy-fill" />
              <rect x="6" y="36" width="10" height="8" rx="1.5" />
              <rect x="18" y="36" width="10" height="8" rx="1.5" />
            {:else if e === 'e2'}
              <!-- a page with a pencil already on it -->
              <path d="M8 4 H30 L38 12 V44 H8 Z" />
              <path d="M14 18 H30 M14 25 H30 M14 32 H22" />
              <path class="iy-accent" d="M24 40 L42 22 L46 26 L28 44 Z" />
            {:else}
              <!-- an open scroll -->
              <path d="M8 10 C8 6 14 6 14 10 V40 C14 44 8 44 8 40 Z" />
              <path d="M40 10 C40 6 34 6 34 10 V40 C34 44 40 44 40 40 Z" />
              <path d="M14 12 H34 M14 38 H34" />
              <path class="iy-accent" d="M19 20 H29 M19 26 H29 M19 32 H25" />
            {/if}
          </svg>
          <div>
            <h3>{$t(`itsYours.fix.${e}.title`)}</h3>
            <p>{$t(`itsYours.fix.${e}.body`)}</p>
          </div>
        </li>
      {/each}
    </ol>

    <p class="iy-panel-close">{$t('itsYours.fix.p1')}</p>
  </section>

  <!-- ─── Part C: in a rikma ───────────────────────────────── -->
  <section class="iy-section">
    <p class="iy-kicker">{$t('itsYours.rikma.kicker')}</p>
    <h2>{$t('itsYours.rikma.title')}</h2>
    <p>{$t('itsYours.rikma.p1')}</p>

    <figure class="iy-flow">
      <figcaption class="iy-flow-title">{$t('itsYours.rikma.flowTitle')}</figcaption>
      <ol>
        {#each STEPS as s, i (s)}
          <li>
            <span class="iy-step-icon" aria-hidden="true">
              <svg class="iy-icon" viewBox="0 0 48 48">
                {#if s === 's1'}
                  <!-- an eye -->
                  <path d="M4 24 C12 12 36 12 44 24 C36 36 12 36 4 24 Z" />
                  <circle cx="24" cy="24" r="6" class="iy-fill" />
                {:else if s === 's2'}
                  <!-- a new card -->
                  <rect x="6" y="8" width="36" height="32" rx="5" />
                  <path class="iy-accent" d="M24 16 V32 M16 24 H32" />
                {:else if s === 's3'}
                  <!-- the rikma's clock, ending in a tick -->
                  <circle cx="22" cy="24" r="17" />
                  <path d="M22 12 V24 L30 28" />
                  <path class="iy-accent" d="M30 40 l5 5 l10 -12" />
                {:else}
                  <!-- a share that grows -->
                  <circle cx="24" cy="24" r="18" />
                  <path class="iy-fill" d="M24 24 V6 A18 18 0 0 1 41.1 29.6 Z" />
                {/if}
              </svg>
            </span>
            <span class="iy-step-n">{i + 1}</span>
            <h3>{$t(`itsYours.rikma.${s}.title`)}</h3>
            <p>{$t(`itsYours.rikma.${s}.body`)}</p>
          </li>
        {/each}
      </ol>
    </figure>

    <p>{$t('itsYours.rikma.p2')}</p>

    <div class="iy-compare">
      <div class="iy-col">
        <h3>{$t('itsYours.rikma.colA')}</h3>
        <ul>
          {#each ['a1', 'a2', 'a3'] as k (k)}
            <li>{$t(`itsYours.rikma.${k}`)}</li>
          {/each}
        </ul>
      </div>
      <div class="iy-col iy-col-new">
        <h3>{$t('itsYours.rikma.colB')}</h3>
        <ul>
          {#each ['b1', 'b2', 'b3'] as k (k)}
            <li>{$t(`itsYours.rikma.${k}`)}</li>
          {/each}
        </ul>
      </div>
    </div>
  </section>

  <!-- ─── Part D: the limits ───────────────────────────────── -->
  <section class="iy-section">
    <p class="iy-kicker">{$t('itsYours.limits.kicker')}</p>
    <h2>{$t('itsYours.limits.title')}</h2>
    <p>{$t('itsYours.limits.p1')}</p>
    <p>{$t('itsYours.limits.p2')}</p>
    <p>{$t('itsYours.limits.p3')}</p>

    <blockquote class="iy-quote">
      <p>{$t('itsYours.limits.quote')}</p>
      <footer>{$t('itsYours.limits.quoteBy')}</footer>
    </blockquote>
  </section>

  {@render shareBar()}

  <!-- ─── Closing ──────────────────────────────────────────── -->
  <section class="iy-close">
    <h2>{$t('itsYours.close.title')}</h2>
    <p>{$t('itsYours.close.p1')}</p>
    <div class="iy-ctas">
      <a class="iy-btn iy-btn-primary" href="/join" data-sveltekit-preload-data>
        {$t('itsYours.close.ctaJoin')}
      </a>
      <a class="iy-btn" href={startHref} data-sveltekit-preload-data>
        {$t('itsYours.close.ctaStart')}
      </a>
    </div>
    <a class="iy-more" href="/broken-deal" data-sveltekit-preload-data>
      {$t('itsYours.close.ctaMore')} <span aria-hidden="true">{arrow}</span>
    </a>
  </section>

  <footer class="iy-sources">
    <h2>{$t('itsYours.sources.title')}</h2>
    <ol>
      {#each SOURCES as s (s)}
        <li dir="auto">{$t(`itsYours.sources.${s}`)}</li>
      {/each}
    </ol>
  </footer>
</article>

<style>
  .iy {
    --iy-muted: var(--tm, #94a3b8);
    --iy-card: var(--s1, rgba(255, 255, 255, 0.06));
    --iy-card-2: var(--s2, rgba(255, 255, 255, 0.04));
    --iy-radius: var(--radius-theme, 0.9rem);

    max-width: 46rem;
    margin: 0 auto;
    padding: 2.5rem 1rem 5rem;
    color: var(--text);
    font-size: 1.07rem;
    line-height: 1.9;
  }

  /* ── reading progress ── */
  .iy-progress {
    position: fixed;
    inset-inline: 0;
    top: 0;
    height: 4px;
    z-index: 60;
    pointer-events: none;
  }
  .iy-progress span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--barbi-pink), var(--gold));
    transition: transform 80ms linear;
  }

  /* ── hero ── */
  .iy-hero {
    text-align: center;
    margin-bottom: 3.25rem;
  }
  .iy-eyebrow,
  .iy-kicker {
    margin: 0 0 0.5rem;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--barbi-pink);
  }
  h1 {
    margin: 0 0 0.6rem;
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-size: clamp(2.4rem, 9vw, 4.4rem);
    font-weight: 800;
    line-height: 1.08;
    color: var(--gold);
  }
  .iy-subtitle {
    margin: 0 auto 1rem;
    max-width: 34rem;
    font-size: clamp(1.15rem, 3.4vw, 1.45rem);
    font-weight: 600;
    line-height: 1.5;
  }
  .iy-byline {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    margin: 0 0 1.75rem;
    font-size: 0.92rem;
    color: var(--iy-muted);
  }
  .iy-hero-art {
    display: block;
    width: 100%;
    max-width: 30rem;
    margin: 0 auto;
    height: auto;
    overflow: visible;
  }
  .iy-ground {
    fill: none;
    stroke: var(--gold);
    stroke-width: 4;
    stroke-linecap: round;
  }
  .iy-crack {
    fill: none;
    stroke: var(--iy-muted);
    stroke-width: 2.5;
    stroke-linejoin: round;
    stroke-dasharray: 4 4;
  }
  .iy-crowd {
    fill: none;
    stroke: var(--iy-muted);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .iy-marks {
    fill: none;
    stroke: var(--iy-muted);
    stroke-width: 4;
    stroke-linecap: round;
  }
  .iy-fixer {
    fill: var(--barbi-pink);
  }
  .iy-fixer-arm {
    fill: none;
    stroke: var(--barbi-pink);
    stroke-width: 6;
    stroke-linecap: round;
  }
  .iy-stitches {
    stroke: var(--barbi-pink);
    stroke-width: 4.5;
  }
  .iy-stitch {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: iy-draw 0.45s ease-out forwards;
    animation-delay: calc(0.35s + var(--i) * 0.22s);
  }
  .iy-heart {
    fill: var(--gold);
    transform-origin: 272px 162px;
    animation: iy-beat 1.6s ease-in-out 1.7s 2;
  }
  @keyframes iy-draw {
    to {
      stroke-dashoffset: 0;
    }
  }
  @keyframes iy-beat {
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
    .iy-stitch {
      animation: none;
      stroke-dashoffset: 0;
    }
    .iy-heart {
      animation: none;
    }
  }

  /* ── text ── */
  .iy-section {
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
  .iy-beat {
    font-weight: 700;
    font-size: 1.2rem;
    color: var(--barbi-pink);
  }
  .iy-dropcap::first-letter {
    float: inline-start;
    margin-inline-end: 0.5rem;
    font-size: 3.4em;
    line-height: 0.9;
    font-weight: 800;
    color: var(--barbi-pink);
  }

  /* ── the bystander bars ── */
  .iy-stat {
    margin: 2rem 0;
    padding: 1.3rem 1.4rem 1rem;
    border: 2px solid var(--gold);
    border-radius: var(--iy-radius);
    background: var(--iy-card-2);
  }
  .iy-stat-title {
    margin-bottom: 1rem;
    font-weight: 800;
    line-height: 1.5;
  }
  .iy-bars {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.9rem;
    align-items: end;
  }
  .iy-bars li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    text-align: center;
  }
  .iy-bar-v {
    font-size: 1.5rem;
    font-weight: 800;
    line-height: 1.1;
    color: var(--barbi-pink);
  }
  .iy-bar {
    display: block;
    width: min(4.5rem, 70%);
    /* The bar's own height is its value against a 9rem column. */
    height: calc(9rem * var(--h) / 100);
    border-radius: 0.6rem 0.6rem 0.2rem 0.2rem;
    background: linear-gradient(var(--barbi-pink), color-mix(in oklab, var(--barbi-pink) 55%, var(--gold)));
  }
  .iy-bar-people {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.15rem;
    min-height: 1.5rem;
  }
  .iy-bar-people svg {
    width: 0.95rem;
    height: auto;
    fill: none;
    stroke: var(--iy-muted);
    stroke-width: 2;
  }
  .iy-bar-people svg.iy-lit {
    fill: var(--barbi-pink);
    stroke: var(--barbi-pink);
  }
  .iy-bar-l {
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1.35;
  }
  .iy-stat-src {
    display: block;
    margin-top: 0.8rem;
    font-size: 0.8rem;
    color: var(--iy-muted);
    text-align: start;
  }

  /* ── icons ── */
  .iy-icon {
    flex: none;
    width: 2.6rem;
    height: 2.6rem;
    fill: none;
    stroke: var(--gold);
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .iy-icon-lg {
    width: 3.2rem;
    height: 3.2rem;
  }
  .iy-icon .iy-fill,
  .iy-paths .iy-fill {
    fill: var(--barbi-pink);
    stroke: var(--barbi-pink);
  }
  .iy-icon .iy-accent,
  .iy-paths .iy-accent {
    stroke: var(--barbi-pink);
    stroke-width: 3.2;
  }

  /* ── mechanisms ── */
  .iy-cards,
  .iy-examples {
    list-style: none;
    margin: 1.5rem 0 1.75rem;
    padding: 0;
    display: grid;
    gap: 1rem;
  }
  .iy-card {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    padding: 1.1rem 1.2rem;
    border: 1px solid color-mix(in oklab, var(--gold) 55%, transparent);
    border-radius: var(--iy-radius);
    background: var(--iy-card);
  }
  .iy-card h3,
  .iy-examples h3 {
    margin-bottom: 0.25rem;
  }
  .iy-card p,
  .iy-examples p {
    margin: 0;
    font-size: 0.99rem;
    line-height: 1.75;
    color: var(--iy-muted);
  }

  /* ── the third option ── */
  .iy-panel {
    padding: 1.75rem 1.4rem 1.4rem;
    border: 2px solid var(--gold);
    border-radius: var(--iy-radius);
    background: var(--iy-card-2);
    box-shadow: var(--shadow-theme);
  }
  .iy-paths {
    display: block;
    width: 100%;
    max-width: 18rem;
    height: auto;
    margin: 0.5rem auto 0;
    fill: none;
    stroke: var(--iy-muted);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .iy-examples li {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }
  .iy-panel-close {
    margin: 0;
    font-weight: 700;
  }

  /* ── the four steps ── */
  .iy-flow {
    margin: 2rem 0;
  }
  .iy-flow-title {
    margin-bottom: 1rem;
    font-weight: 800;
    color: var(--gold);
  }
  .iy-flow ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
    gap: 0.8rem;
  }
  .iy-flow li {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 1rem 1rem 0.9rem;
    border-radius: var(--iy-radius);
    border: 1px solid color-mix(in oklab, var(--gold) 45%, transparent);
    background: var(--iy-card);
  }
  .iy-flow li:last-child {
    border: 2px solid var(--barbi-pink);
  }
  .iy-step-icon {
    display: flex;
  }
  .iy-step-n {
    position: absolute;
    top: 0.75rem;
    inset-inline-end: 0.85rem;
    display: grid;
    place-items: center;
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 800;
    background: var(--gold);
    color: #1b1208;
  }
  .iy-flow h3 {
    font-size: 1.02rem;
  }
  .iy-flow p {
    margin: 0;
    font-size: 0.93rem;
    line-height: 1.6;
    color: var(--iy-muted);
  }

  /* ── blame vs fix ── */
  .iy-compare {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: 1rem;
    margin: 1.75rem 0 0;
  }
  .iy-col {
    padding: 1.1rem 1.2rem;
    border-radius: var(--iy-radius);
    border: 1px dashed var(--iy-muted);
  }
  .iy-col-new {
    border: 2px solid var(--barbi-pink);
    /* An image, not a colour: something global makes children inherit
       background-color, which stacked the tint once per line. */
    background-image: linear-gradient(
      color-mix(in oklab, var(--barbi-pink) 9%, transparent),
      color-mix(in oklab, var(--barbi-pink) 9%, transparent)
    );
  }
  .iy-col h3 {
    margin-bottom: 0.6rem;
  }
  .iy-col ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.5rem;
  }
  .iy-col li {
    position: relative;
    padding-inline-start: 1.4rem;
    font-size: 0.97rem;
    line-height: 1.6;
  }
  .iy-col li::before {
    content: '–';
    position: absolute;
    inset-inline-start: 0;
    color: var(--iy-muted);
  }
  .iy-col-new li::before {
    content: '✓';
    color: var(--barbi-pink);
    font-weight: 800;
  }

  /* ── pull quote ── */
  .iy-quote {
    margin: 2rem 0 0;
    padding: 1.4rem 1.5rem;
    border-inline-start: 5px solid var(--barbi-pink);
    border-radius: var(--iy-radius);
    background: var(--iy-card);
  }
  .iy-quote p {
    margin: 0 0 0.5rem;
    font-family: 'Sababa', 'Heebo', sans-serif;
    font-size: clamp(1.3rem, 4vw, 1.65rem);
    line-height: 1.5;
    color: var(--gold);
  }
  .iy-quote footer {
    font-size: 0.9rem;
    color: var(--iy-muted);
  }

  /* ── share ── */
  .iy-share {
    margin: 0 0 2.5rem;
    padding: 1.1rem 1.2rem;
    border-radius: var(--iy-radius);
    border: 1px solid color-mix(in oklab, var(--gold) 55%, transparent);
    text-align: center;
  }
  .iy-share-title {
    margin: 0 0 0.7rem;
    font-weight: 800;
    color: var(--gold);
  }
  .iy-share-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }
  .iy-chip {
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
  .iy-chip:hover,
  .iy-chip:focus-visible {
    background: color-mix(in oklab, var(--gold) 16%, transparent);
  }
  .iy-chip-strong {
    background: var(--barbi-pink);
    border-color: var(--barbi-pink);
    color: #fff;
  }

  /* ── closing ── */
  .iy-close {
    text-align: center;
    padding: 2.2rem 1.4rem;
    border: 2px solid var(--gold);
    border-radius: var(--iy-radius);
    /* Both layers as images - headings here inherit background-color. */
    background-image:
      radial-gradient(
        circle at 50% 0%,
        color-mix(in oklab, var(--barbi-pink) 22%, transparent),
        transparent 65%
      ),
      linear-gradient(var(--iy-card-2), var(--iy-card-2));
  }
  .iy-ctas {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.7rem;
    margin: 1.4rem 0 1rem;
  }
  .iy-btn {
    padding: 0.65rem 1.5rem;
    border-radius: 999px;
    border: 2px solid var(--gold);
    color: var(--gold);
    font-weight: 800;
    text-decoration: none;
  }
  .iy-btn-primary {
    background: var(--barbi-pink);
    border-color: var(--barbi-pink);
    color: #fff;
  }
  .iy-btn:hover {
    filter: brightness(1.1);
  }
  .iy-more {
    font-weight: 700;
    color: var(--barbi-pink);
    text-decoration: none;
  }
  .iy-more:hover {
    text-decoration: underline;
  }

  /* ── sources ── */
  .iy-sources {
    margin-top: 3rem;
    padding-top: 1.4rem;
    border-top: 1px solid color-mix(in oklab, var(--gold) 55%, transparent);
    font-size: 0.83rem;
    line-height: 1.6;
    color: var(--iy-muted);
  }
  .iy-sources h2 {
    font-size: 1rem;
  }
  .iy-sources ol {
    margin: 0;
    padding-inline-start: 1.2rem;
    display: grid;
    gap: 0.45rem;
  }
</style>
