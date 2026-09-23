<!--
  /made-for-you — the concierge, for the people who come to *get* something.

  Every other track page speaks to someone deciding whether to join: a rikma,
  a partnership, a way of working. This one does not. Its reader wants a
  product or a service made to measure and has no reason to care how the
  platform is organised — so the page never asks them to. It sells three
  things, in this order: you ask instead of searching, it is built around you,
  and nothing moves without your yes. The last one is the whole difference
  from every other marketplace, and it is stated as a guarantee to a customer,
  not as a principle to adopt.

  The path it opens is the short one: write the wish (no account needed),
  sign the agreement, confirm the email, and the wish is sent by itself — no
  onboarding (see $lib/concierge/regIntent.js and wishDraft.js).
-->
<script>
  import { t, isRtl } from '$lib/translations';
  import { breadcrumbs, faqPage, jsonLdBody } from '$lib/seo/jsonLd.js';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';

  let { data } = $props();

  /* A member writes straight into their own composer; a guest into the
     public one, which keeps the wish on the device through registration. */
  const composer = $derived(data.loggedIn ? '/concierge/new' : '/wish/new');

  /** @param {string} seed a WishForm seed key */
  const seedHref = (seed) => `${composer}?seed=${seed}`;

  const PROMISES = ['p1', 'p2', 'p3'];
  const STEPS = ['s1', 's2', 's3', 's4'];
  /** @type {[import('$lib/celim/icons/entityIcons').EntityIconKind, string][]} */
  const CONSENT = [
    ['signed', 'c1'],
    ['chat', 'c2'],
    ['search', 'c3'],
    ['maagad', 'c4']
  ];
  /** Keys shared with WishForm's SEEDS, so a click opens the composer primed. */
  /** @type {[import('$lib/celim/icons/entityIcons').EntityIconKind, string][]} */
  const IDEAS = [
    ['product', 'gift'],
    ['mission', 'task'],
    ['community', 'community'],
    ['map', 'trip'],
    ['family', 'family'],
    ['wish', 'free']
  ];
  const FAQ = [1, 2, 3, 4, 5];

  const crumbLd = $derived(
    breadcrumbs([
      { name: $t('home.crumb.home'), url: 'https://1lev1.com/' },
      { name: $t('madeForYou.meta.title'), url: 'https://1lev1.com/made-for-you' }
    ])
  );
  const faqLd = $derived(
    faqPage(
      FAQ.map((i) => ({
        question: $t(`madeForYou.faq.q${i}`),
        answer: $t(`madeForYou.faq.a${i}`)
      }))
    )
  );
</script>

<svelte:head>
  <title>{$t('madeForYou.meta.title')}</title>
  <meta name="description" content={$t('madeForYou.meta.description')} />
  <meta property="og:title" content={$t('madeForYou.meta.title')} />
  <meta property="og:description" content={$t('madeForYou.meta.description')} />
  <meta property="og:type" content="website" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link
    href="https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700&family=Bellefair&display=swap"
    rel="stylesheet"
  />
  {@html `<script type="application/ld+json">${jsonLdBody(crumbLd)}<\/script>`}
  {@html `<script type="application/ld+json">${jsonLdBody(faqLd)}<\/script>`}
</svelte:head>

<main class="mfy" dir={$isRtl ? 'rtl' : 'ltr'}>
  <!-- ── Hero ─────────────────────────────────────────────────────────── -->
  <section class="mfy-hero">
    <div class="mfy-hero-copy">
      <!-- A cropped 360px copy of static/logo-concierge.png (1.4MB, black
           corners) — the circle clip lands on the gold ring's outer edge. -->
      <img
        src="/logo-concierge-medal.jpg"
        class="mfy-medal"
        alt="1lev1 concierge"
        width="360"
        height="360"
        fetchpriority="high"
      />
      <p class="mfy-eyebrow">{$t('madeForYou.hero.eyebrow')}</p>
      <h1 class="mfy-h1">
        <span>{$t('madeForYou.hero.h1a')}</span>
        <em>{$t('madeForYou.hero.h1b')}</em>
      </h1>
      <p class="mfy-lede">{$t('madeForYou.hero.sub')}</p>
      <div class="mfy-ctas">
        <a href={composer} class="mfy-btn">{$t('madeForYou.hero.cta')}</a>
        <a href="#how" class="mfy-link">{$t('madeForYou.hero.how')}</a>
      </div>
      <p class="mfy-note">{$t('madeForYou.hero.ctaNote')}</p>
    </div>

    <!-- The whole flow in five seconds: a request, what it needs, a yes. -->
    <div class="mfy-card-wrap" aria-hidden="true">
      <div class="mfy-card">
        <div class="mfy-card-head">
          <span class="mfy-card-dot"></span>
          {$t('madeForYou.card.label')}
        </div>
        <p class="mfy-card-text">{$t('madeForYou.card.text')}</p>
        <div class="mfy-card-tags">
          <span class="mfy-tag" style="--d:1.5s">{$t('madeForYou.card.tag1')}</span>
          <span class="mfy-tag" style="--d:1.8s">{$t('madeForYou.card.tag2')}</span>
          <span class="mfy-tag" style="--d:2.1s">{$t('madeForYou.card.tag3')}</span>
        </div>
        <div class="mfy-card-found">
          <span class="mfy-avatars"><i></i><i></i><i></i></span>
          {$t('madeForYou.card.found')}
        </div>
        <div class="mfy-seal">{$t('madeForYou.card.approved')}</div>
      </div>
    </div>
  </section>

  <!-- ── Three promises ───────────────────────────────────────────────── -->
  <section class="mfy-promises">
    {#each PROMISES as p, i (p)}
      <div class="mfy-promise" style="--i:{i}">
        <h2>{$t(`madeForYou.promise.${p}t`)}</h2>
        <p>{$t(`madeForYou.promise.${p}d`)}</p>
      </div>
    {/each}
  </section>

  <!-- ── How it works ─────────────────────────────────────────────────── -->
  <section id="how" class="mfy-section">
    <h2 class="mfy-h2">{$t('madeForYou.how.title')}</h2>
    <ol class="mfy-steps">
      {#each STEPS as s, i (s)}
        <li class="mfy-step">
          <span class="mfy-step-n">{i + 1}</span>
          <div>
            <h3>{$t(`madeForYou.how.${s}t`)}</h3>
            <p>{$t(`madeForYou.how.${s}d`)}</p>
          </div>
        </li>
      {/each}
    </ol>
  </section>

  <!-- ── Consent — the difference ─────────────────────────────────────── -->
  <section class="mfy-consent">
    <div class="mfy-consent-inner">
      <p class="mfy-eyebrow mfy-eyebrow-dark">{$t('madeForYou.consent.eyebrow')}</p>
      <h2 class="mfy-consent-title">{$t('madeForYou.consent.title')}</h2>
      <p class="mfy-consent-sub">{$t('madeForYou.consent.sub')}</p>
      <div class="mfy-consent-grid">
        {#each CONSENT as [icon, c] (c)}
          <div class="mfy-consent-item">
            <span class="mfy-consent-icon"><EntityIcon kind={icon} size={20} /></span>
            <h3>{$t(`madeForYou.consent.${c}t`)}</h3>
            <p>{$t(`madeForYou.consent.${c}d`)}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ── Ideas ────────────────────────────────────────────────────────── -->
  <section class="mfy-section">
    <h2 class="mfy-h2">{$t('madeForYou.ideas.title')}</h2>
    <p class="mfy-section-sub">{$t('madeForYou.ideas.sub')}</p>
    <div class="mfy-ideas">
      {#each IDEAS as [icon, key] (key)}
        <a href={seedHref(key)} class="mfy-idea">
          <span class="mfy-idea-icon"><EntityIcon kind={icon} size={18} /></span>
          <span>{$t(`madeForYou.ideas.${key}`)}</span>
          <span class="mfy-idea-arrow" aria-hidden="true">{$isRtl ? '←' : '→'}</span>
        </a>
      {/each}
    </div>
  </section>

  <!-- ── FAQ ──────────────────────────────────────────────────────────── -->
  <section class="mfy-section mfy-faq">
    <h2 class="mfy-h2">{$t('madeForYou.faq.title')}</h2>
    {#each FAQ as i (i)}
      <details class="mfy-q">
        <summary>{$t(`madeForYou.faq.q${i}`)}</summary>
        <p>{$t(`madeForYou.faq.a${i}`)}</p>
      </details>
    {/each}
  </section>

  <!-- ── Last word ────────────────────────────────────────────────────── -->
  <section class="mfy-final">
    <h2>{$t('madeForYou.final.title')}</h2>
    <p>{$t('madeForYou.final.sub')}</p>
    <a href={composer} class="mfy-btn">{$t('madeForYou.final.cta')}</a>
  </section>
</main>

<style>
  .mfy {
    --ivory: #fbf7ef;
    --paper: #fffdf8;
    --ink: #1f1620;
    --ink-soft: #5b4d57;
    --gold: #b0862b;
    --gold-soft: #e9d7a6;
    --rose: #b3124f;
    --line: rgba(176, 134, 43, 0.28);
    min-height: 100vh;
    width: 100%;
    overflow-x: hidden;
    background:
      radial-gradient(1200px 600px at 85% -10%, rgba(233, 215, 166, 0.45), transparent 60%),
      radial-gradient(900px 500px at -10% 30%, rgba(179, 18, 79, 0.06), transparent 60%),
      var(--ivory);
    color: var(--ink);
    font-family: 'Assistant', 'Rubik', system-ui, sans-serif;
    line-height: 1.6;
  }
  .mfy h1,
  .mfy h2,
  .mfy h3 {
    font-family: 'Bellefair', 'Frank Ruhl Libre', Georgia, serif;
    font-weight: 400;
    margin: 0;
    /* A global tiptap rule gives every h1–h3 `background-color: inherit`,
       which paints a translucent card's fill a second time under the text. */
    background: none;
  }
  .mfy p {
    margin: 0;
  }

  /* ── Hero ── */
  .mfy-hero {
    max-width: 1120px;
    margin: 0 auto;
    padding: clamp(2.5rem, 7vw, 6rem) 1rem clamp(2rem, 5vw, 4rem);
    display: grid;
    gap: clamp(2rem, 5vw, 4rem);
    align-items: center;
  }
  @media (min-width: 900px) {
    .mfy-hero {
      grid-template-columns: 1.1fr 0.9fr;
    }
  }
  .mfy-hero-copy > * {
    animation: mfy-rise 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) both;
  }
  .mfy-hero-copy > :nth-child(2) {
    animation-delay: 0.08s;
  }
  .mfy-hero-copy > :nth-child(3) {
    animation-delay: 0.16s;
  }
  .mfy-hero-copy > :nth-child(4) {
    animation-delay: 0.24s;
  }
  .mfy-hero-copy > :nth-child(5) {
    animation-delay: 0.32s;
  }
  .mfy-hero-copy > :nth-child(6) {
    animation-delay: 0.4s;
  }
  .mfy-medal {
    display: block;
    width: clamp(84px, 11vw, 112px);
    height: auto;
    aspect-ratio: 1;
    margin-bottom: 1.4rem;
    border-radius: 50%;
    /* an ivory gap, a hairline of gold, then warm light — a coin set in paper */
    box-shadow:
      0 0 0 5px var(--paper),
      0 0 0 6px var(--line),
      0 18px 40px -10px rgba(176, 134, 43, 0.55);
  }
  .mfy-eyebrow {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: var(--gold);
    text-transform: uppercase;
  }
  .mfy-h1 {
    margin-top: 1rem !important;
    font-size: clamp(2.6rem, 7vw, 4.6rem);
    line-height: 1.02;
    letter-spacing: -0.01em;
  }
  .mfy-h1 span,
  .mfy-h1 em {
    display: block;
  }
  .mfy-h1 em {
    font-style: normal;
    color: var(--rose);
  }
  .mfy-lede {
    margin-top: 1.25rem !important;
    max-width: 34rem;
    font-size: clamp(1.05rem, 1.8vw, 1.2rem);
    color: var(--ink-soft);
  }
  .mfy-ctas {
    margin-top: 2rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.25rem;
  }
  .mfy-btn {
    display: inline-flex;
    align-items: center;
    padding: 0.95rem 1.9rem;
    border-radius: 999px;
    background: var(--ink);
    color: var(--paper);
    font-weight: 600;
    font-size: 1.05rem;
    text-decoration: none;
    box-shadow:
      0 0 0 1px rgba(176, 134, 43, 0.5),
      0 12px 30px rgba(31, 22, 32, 0.22);
    transition:
      transform 0.2s,
      box-shadow 0.2s,
      background 0.2s;
  }
  .mfy-btn:hover {
    transform: translateY(-2px);
    background: #2e2130;
    box-shadow:
      0 0 0 1px var(--gold),
      0 16px 36px rgba(31, 22, 32, 0.28);
  }
  .mfy-btn:focus-visible,
  .mfy-link:focus-visible,
  .mfy-idea:focus-visible,
  .mfy-q summary:focus-visible {
    outline: 2px solid var(--rose);
    outline-offset: 3px;
  }
  .mfy-link {
    color: var(--ink);
    font-weight: 600;
    text-decoration: underline;
    text-decoration-color: var(--gold);
    text-underline-offset: 5px;
  }
  .mfy-note {
    margin-top: 1rem !important;
    font-size: 0.9rem;
    color: var(--ink-soft);
  }

  /* ── The request card ── */
  .mfy-card-wrap {
    position: relative;
    justify-self: center;
    width: min(420px, 100%);
  }
  .mfy-card-wrap::before {
    content: '';
    position: absolute;
    inset: 14px -14px -14px 14px;
    border-radius: 22px;
    border: 1px solid var(--line);
  }
  .mfy-card {
    position: relative;
    padding: 1.6rem 1.5rem 1.4rem;
    border-radius: 22px;
    background: var(--paper);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.9) inset,
      0 30px 60px -20px rgba(31, 22, 32, 0.25);
    transform: rotate(-1.5deg);
    animation: mfy-rise 0.9s 0.2s cubic-bezier(0.2, 0.7, 0.2, 1) both;
  }
  .mfy-card-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 700;
  }
  .mfy-card-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--rose);
  }
  .mfy-card-text {
    margin-top: 0.9rem !important;
    font-family: 'Bellefair', Georgia, serif;
    font-size: 1.3rem;
    line-height: 1.45;
    clip-path: inset(0 0 100% 0);
    animation: mfy-write 1.2s 0.5s steps(6, end) forwards;
  }
  .mfy-card-tags {
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .mfy-tag {
    padding: 0.2rem 0.7rem;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: #fbf3df;
    font-size: 0.82rem;
    color: #6d5213;
    opacity: 0;
    animation: mfy-pop 0.45s var(--d) cubic-bezier(0.3, 1.4, 0.5, 1) forwards;
  }
  .mfy-card-found {
    margin-top: 1rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.9rem;
    color: var(--ink-soft);
    opacity: 0;
    animation: mfy-fade 0.5s 2.6s forwards;
  }
  .mfy-avatars {
    display: inline-flex;
  }
  .mfy-avatars i {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid var(--paper);
    background: linear-gradient(135deg, #e9d7a6, #b0862b);
  }
  .mfy-avatars i + i {
    margin-inline-start: -7px;
    background: linear-gradient(135deg, #f2c1d3, #b3124f);
  }
  .mfy-avatars i + i + i {
    background: linear-gradient(135deg, #cfe3dc, #3f7d6b);
  }
  .mfy-seal {
    position: absolute;
    inset-inline-end: -0.6rem;
    bottom: -1.1rem;
    padding: 0.55rem 1rem;
    border-radius: 12px;
    background: var(--rose);
    color: #fff;
    font-weight: 700;
    font-size: 0.92rem;
    box-shadow: 0 10px 24px rgba(179, 18, 79, 0.35);
    transform: rotate(4deg) scale(0.6);
    opacity: 0;
    animation: mfy-stamp 0.5s 3.3s cubic-bezier(0.3, 1.6, 0.5, 1) forwards;
  }

  /* ── Promises ── */
  .mfy-promises {
    max-width: 1120px;
    margin: 0 auto;
    padding: 1rem 1rem 3rem;
    display: grid;
    gap: 1.5rem;
  }
  @media (min-width: 760px) {
    .mfy-promises {
      grid-template-columns: repeat(3, 1fr);
      gap: 0;
    }
    .mfy-promise + .mfy-promise {
      border-inline-start: 1px solid var(--line);
    }
  }
  .mfy-promise {
    padding: 0.5rem 1.5rem;
  }
  .mfy-promise h2 {
    font-size: 1.45rem;
    line-height: 1.2;
  }
  .mfy-promise p {
    margin-top: 0.5rem;
    color: var(--ink-soft);
  }

  /* ── Sections ── */
  .mfy-section {
    max-width: 880px;
    margin: 0 auto;
    padding: clamp(2.5rem, 6vw, 4.5rem) 1rem;
  }
  .mfy-h2 {
    font-size: clamp(2rem, 4.5vw, 2.8rem);
    line-height: 1.1;
    text-align: center;
  }
  .mfy-section-sub {
    margin-top: 0.6rem !important;
    text-align: center;
    color: var(--ink-soft);
  }
  .mfy-steps {
    list-style: none;
    margin: 2.5rem 0 0;
    padding: 0;
    display: grid;
    gap: 1.1rem;
  }
  .mfy-step {
    display: flex;
    gap: 1.25rem;
    align-items: flex-start;
    padding: 1.25rem 1.4rem;
    border-radius: 18px;
    background: rgba(255, 253, 248, 0.75);
    border: 1px solid var(--line);
  }
  .mfy-step-n {
    flex: none;
    font-family: 'Bellefair', Georgia, serif;
    font-size: 2.6rem;
    line-height: 1;
    color: var(--gold);
    min-width: 2rem;
    text-align: center;
  }
  .mfy-step h3 {
    font-size: 1.4rem;
  }
  .mfy-step p {
    margin-top: 0.25rem;
    color: var(--ink-soft);
  }

  /* ── Consent band ── */
  .mfy-consent {
    margin: clamp(1rem, 3vw, 2rem) 1rem;
    border-radius: 28px;
    background:
      radial-gradient(700px 300px at 100% 0%, rgba(176, 134, 43, 0.22), transparent 70%),
      var(--ink);
    color: #f6efe2;
  }
  .mfy-consent-inner {
    max-width: 960px;
    margin: 0 auto;
    padding: clamp(2.5rem, 6vw, 4.5rem) clamp(1rem, 4vw, 2.5rem);
    text-align: center;
  }
  .mfy-eyebrow-dark {
    color: var(--gold-soft);
  }
  .mfy-consent-title {
    margin-top: 0.75rem !important;
    font-size: clamp(2.1rem, 5vw, 3.2rem);
    line-height: 1.1;
  }
  .mfy-consent-sub {
    margin: 1rem auto 0 !important;
    max-width: 36rem;
    color: #d9cdb8;
    font-size: 1.08rem;
  }
  .mfy-consent-grid {
    margin-top: 2.5rem;
    display: grid;
    gap: 1rem;
    text-align: start;
  }
  @media (min-width: 700px) {
    .mfy-consent-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .mfy-consent-item {
    padding: 1.3rem 1.4rem;
    border-radius: 18px;
    border: 1px solid rgba(233, 215, 166, 0.2);
    background: rgba(255, 255, 255, 0.03);
  }
  .mfy-consent-icon {
    display: inline-grid;
    place-items: center;
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 50%;
    background: rgba(233, 215, 166, 0.12);
    color: var(--gold-soft);
  }
  .mfy-consent-item h3 {
    margin-top: 0.8rem;
    font-size: 1.35rem;
    color: #fff8ea;
  }
  .mfy-consent-item p {
    margin-top: 0.3rem;
    color: #d9cdb8;
  }

  /* ── Ideas ── */
  .mfy-ideas {
    margin-top: 2rem;
    display: grid;
    gap: 0.75rem;
  }
  @media (min-width: 600px) {
    .mfy-ideas {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (min-width: 900px) {
    .mfy-ideas {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  .mfy-idea {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.1rem;
    border-radius: 16px;
    background: var(--paper);
    border: 1px solid var(--line);
    color: var(--ink);
    font-weight: 600;
    text-decoration: none;
    transition:
      transform 0.2s,
      border-color 0.2s,
      box-shadow 0.2s;
  }
  .mfy-idea:hover {
    transform: translateY(-2px);
    border-color: var(--gold);
    box-shadow: 0 10px 24px -12px rgba(31, 22, 32, 0.3);
  }
  .mfy-idea-icon {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 50%;
    background: #fbf3df;
    color: var(--gold);
  }
  .mfy-idea-arrow {
    margin-inline-start: auto;
    color: var(--gold);
    transition: transform 0.2s;
  }
  .mfy-idea:hover .mfy-idea-arrow {
    transform: translateX(-3px);
  }
  [dir='ltr'] .mfy-idea:hover .mfy-idea-arrow {
    transform: translateX(3px);
  }

  /* ── FAQ ── */
  .mfy-faq {
    padding-top: 1rem;
  }
  .mfy-faq .mfy-h2 {
    margin-bottom: 1.75rem;
  }
  .mfy-q {
    border-bottom: 1px solid var(--line);
  }
  .mfy-q summary {
    cursor: pointer;
    list-style: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 1.1rem 0.25rem;
    font-weight: 600;
    font-size: 1.08rem;
  }
  .mfy-q summary::-webkit-details-marker {
    display: none;
  }
  .mfy-q summary::after {
    content: '+';
    flex: none;
    font-family: 'Bellefair', Georgia, serif;
    font-size: 1.6rem;
    line-height: 1;
    color: var(--gold);
    transition: transform 0.25s;
  }
  .mfy-q[open] summary::after {
    transform: rotate(45deg);
  }
  .mfy-q p {
    padding: 0 0.25rem 1.2rem;
    color: var(--ink-soft);
  }

  /* ── Final ── */
  .mfy-final {
    max-width: 720px;
    margin: 0 auto;
    padding: clamp(2.5rem, 6vw, 4rem) 1rem clamp(4rem, 8vw, 6rem);
    text-align: center;
  }
  .mfy-final h2 {
    font-size: clamp(2.2rem, 5vw, 3.2rem);
    line-height: 1.1;
  }
  .mfy-final p {
    margin: 0.75rem 0 2rem;
    color: var(--ink-soft);
    font-size: 1.1rem;
  }

  /* ── Motion ── */
  @keyframes mfy-rise {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
  }
  @keyframes mfy-write {
    to {
      clip-path: inset(0 0 0 0);
    }
  }
  @keyframes mfy-pop {
    from {
      opacity: 0;
      transform: scale(0.7);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  @keyframes mfy-fade {
    to {
      opacity: 1;
    }
  }
  @keyframes mfy-stamp {
    to {
      opacity: 1;
      transform: rotate(4deg) scale(1);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .mfy *,
    .mfy *::before,
    .mfy *::after {
      animation-duration: 0.01ms !important;
      animation-delay: 0s !important;
      transition: none !important;
    }
  }
</style>
