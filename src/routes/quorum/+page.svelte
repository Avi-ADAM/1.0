<script>
  // Quorum — standalone landing for the demand-side wedge (maagad + concierge).
  // Deliberately self-contained (local copy, local scene, no app stores beyond
  // locale) so the whole folder can move to the thin repo when it gets its own
  // domain. See docs/PLAN_MARKETING_GLOBAL.md §10.
  import { onMount } from 'svelte';
  import { Canvas } from '@threlte/core';
  import { locale } from '$lib/translations';
  import Scene from './Scene.svelte';
  import { copy, demoOffers } from './copy.js';

  let isHe = $derived($locale === 'he');
  let c = $derived(isHe ? copy.he : copy.en);
  let offers = $derived(isHe ? demoOffers.he : demoOffers.en);

  // ── the self-running threshold demo (drives the 3D scene + the offer card)
  let offerIdx = $state(0);
  let signed = $state(0);
  let phase = $state('filling'); // 'filling' | 'activated'
  let offer = $derived(offers[offerIdx]);
  let daysLeft = $derived(((offerIdx * 3 + 2) % 5) + 2);

  onMount(() => {
    signed = offers[0].seed;
    const id = setInterval(() => {
      if (phase === 'activated') {
        phase = 'filling';
        offerIdx = (offerIdx + 1) % offers.length;
        signed = offers[offerIdx].seed;
      } else if (signed < offer.min) {
        signed += 1;
        if (signed >= offer.min) phase = 'activated';
      }
    }, 1500);
    return () => clearInterval(id);
  });

  // ── scroll-reveal
  function reveal(node, delay = 0) {
    node.style.transitionDelay = `${delay}ms`;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          node.classList.add('in');
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(node);
    return { destroy: () => io.disconnect() };
  }
</script>

<svelte:head>
  <title>{c.metaTitle}</title>
  <meta name="description" content={c.metaDesc} />
  <meta property="og:title" content={c.metaTitle} />
  <meta property="og:description" content={c.metaDesc} />
  <meta property="og:type" content="website" />
  <link
    href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,650;1,9..144,500&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="q-root" dir={c.dir}>
  <!-- ═══════════════ HERO ═══════════════ -->
  <header class="q-hero">
    <div class="q-canvas" aria-hidden="true">
      <Canvas>
        <Scene {signed} min={offer.min} {phase} />
      </Canvas>
    </div>
    <div class="q-glow q-glow-gold" aria-hidden="true"></div>
    <div class="q-glow q-glow-pink" aria-hidden="true"></div>

    <div class="q-hero-inner">
      <p class="q-eyebrow hero-seq" style="--i:0">
        <span class="q-eyebrow-mark">◉</span>
        {c.eyebrow}
        <span class="q-byline">{c.byline}</span>
      </p>
      <h1 class="hero-seq" style="--i:1">
        <span class="q-h1a">{c.h1a}</span>
        <span class="q-h1b">{c.h1b}</span>
      </h1>
      <p class="q-sub hero-seq" style="--i:2">{c.sub}</p>
      <div class="q-ctas hero-seq" style="--i:3">
        <a class="q-btn q-btn-gold" href="/demand">{c.ctaDemand}</a>
        <a class="q-btn q-btn-ghost" href="#suppliers">{c.ctaSupply}</a>
      </div>
    </div>

    <!-- live offer card, synced with the scene -->
    <aside class="q-card hero-seq" style="--i:4" class:activated={phase === 'activated'}>
      {#if phase === 'activated'}
        <p class="q-card-activated">✦ {c.activated}</p>
        <p class="q-card-sub">{offer.min} {c.activatedSub}</p>
      {:else}
        <p class="q-card-name">{offer.name}</p>
        <p class="q-card-unit">{offer.unit} · {daysLeft} {c.daysLeft}</p>
        <div class="q-meter" role="img" aria-label="{signed}/{offer.min} {c.signed}">
          <div class="q-meter-fill" style="width:{(signed / offer.min) * 100}%"></div>
        </div>
        <p class="q-card-count">
          <strong>{signed}/{offer.min}</strong>
          {c.signed}
        </p>
      {/if}
    </aside>
  </header>

  <!-- ═══════════════ PRINCIPLES ═══════════════ -->
  <section class="q-section">
    <h2 class="q-title" use:reveal>{c.principlesTitle}</h2>
    <div class="q-principles">
      {#each c.principles as p, i (p.t)}
        <article class="q-principle rv" use:reveal={i * 90}>
          <span class="q-num">0{i + 1}</span>
          <h3>{p.t}</h3>
          <p>{p.d}</p>
        </article>
      {/each}
    </div>
  </section>

  <!-- ═══════════════ HOW ═══════════════ -->
  <section class="q-section q-how-wrap">
    <h2 class="q-title" use:reveal>{c.howTitle}</h2>
    <ol class="q-how">
      {#each c.how as step, i (step.t)}
        <li class="rv" use:reveal={i * 120}>
          <span class="q-step-dot">{i + 1}</span>
          <div>
            <h3>{step.t}</h3>
            <p>{step.d}</p>
          </div>
        </li>
      {/each}
    </ol>
  </section>

  <!-- ═══════════════ WISH / CONCIERGE ═══════════════ -->
  <section class="q-section q-wish rv" use:reveal>
    <div class="q-wish-inner">
      <div class="q-wish-text">
        <h2>{c.wishTitle}</h2>
        <p>{c.wishDesc}</p>
        <a class="q-btn q-btn-pink" href="/wish/new">{c.wishCta}</a>
      </div>

      <!-- live-extraction demo: a wish becomes tasks + resources as you type -->
      <div class="q-extract" aria-hidden="true">
        <p class="q-extract-label">{c.wishDemoLabel}</p>
        <p class="q-extract-quote">{c.wishDemoText}</p>
        <div class="q-chips">
          {#each c.wishChips as chip, i (chip)}
            <span class="q-chip" style="--d:{i * 450 + 500}ms">{chip}</span>
          {/each}
        </div>
        <div class="q-extract-meter">
          <div class="q-extract-fill"></div>
        </div>
        <p class="q-extract-cov">
          <strong>{c.wishChips.length}/{c.wishChips.length}</strong>
          {c.wishCoverage}
        </p>
        <p class="q-extract-plan">{c.wishOnePlan}</p>
      </div>
    </div>
  </section>

  <!-- ═══════════════ SUPPLIERS ═══════════════ -->
  <section class="q-section q-sup rv" id="suppliers" use:reveal>
    <div class="q-sup-inner">
      <h2>{c.supTitle}</h2>
      <p>{c.supDesc}</p>
      <div class="q-ctas">
        <a class="q-btn q-btn-gold" href="/demand?lens=supply">{c.supCta}</a>
        <span class="q-sup-note">{c.supNote}</span>
      </div>
    </div>
  </section>

  <!-- ═══════════════ FOOTER ═══════════════ -->
  <footer class="q-foot">
    <p>{c.footA} <strong>{c.footB}</strong></p>
    <a href="/">{c.footCta} ↗</a>
  </footer>
</div>

<style>
  .q-root {
    --ink: #100d1e;
    --ink2: #171331;
    --gold: #e8c56a;
    --gold-hi: #ffd98a;
    --pink: #ff77b0;
    --paper: #f3ecd9;
    --muted: #9c94bf;
    background:
      radial-gradient(1100px 600px at 80% -10%, #241d4b 0%, transparent 60%),
      radial-gradient(900px 700px at -10% 100%, #2a1230 0%, transparent 55%),
      var(--ink);
    color: var(--paper);
    font-family: 'Rubik', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
    position: relative;
  }
  /* film grain */
  .q-root::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: 0.05;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  /* ── hero ─────────────────────────── */
  .q-hero {
    position: relative;
    min-height: 100svh;
    display: flex;
    align-items: center;
    padding: 6rem 1.5rem 8rem;
  }
  .q-canvas {
    position: absolute;
    inset: 0;
    opacity: 0.9;
  }
  .q-glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    pointer-events: none;
  }
  .q-glow-gold {
    width: 34rem;
    height: 34rem;
    background: rgba(232, 197, 106, 0.14);
    top: -8rem;
    inset-inline-end: -6rem;
  }
  .q-glow-pink {
    width: 26rem;
    height: 26rem;
    background: rgba(255, 119, 176, 0.1);
    bottom: -6rem;
    inset-inline-start: -8rem;
  }
  .q-hero-inner {
    position: relative;
    max-width: 44rem;
    margin-inline-start: max(4vw, 1rem);
  }
  .q-eyebrow {
    letter-spacing: 0.35em;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--gold);
    display: flex;
    align-items: center;
    gap: 0.6em;
  }
  .q-eyebrow-mark {
    color: var(--pink);
  }
  .q-byline {
    letter-spacing: 0.05em;
    color: var(--muted);
    font-weight: 400;
  }
  h1 {
    margin: 1.2rem 0 0;
    line-height: 1.04;
    font-size: clamp(2.6rem, 7vw, 5.2rem);
    font-weight: 650;
  }
  .q-root[dir='ltr'] h1 {
    font-family: 'Fraunces', 'Rubik', serif;
  }
  .q-h1a {
    display: block;
  }
  .q-h1b {
    display: block;
    background: linear-gradient(100deg, var(--gold-hi), var(--gold) 45%, var(--pink));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .q-root[dir='ltr'] .q-h1b {
    font-style: italic;
  }
  .q-sub {
    margin-top: 1.6rem;
    max-width: 36rem;
    font-size: clamp(1.05rem, 1.6vw, 1.25rem);
    line-height: 1.65;
    color: #cfc7e6;
  }
  .q-ctas {
    margin-top: 2.2rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
  }
  .q-btn {
    display: inline-block;
    padding: 0.85rem 1.7rem;
    border-radius: 999px;
    font-weight: 600;
    text-decoration: none;
    transition:
      transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1.4),
      box-shadow 0.25s ease;
  }
  .q-btn:hover {
    transform: translateY(-3px);
  }
  .q-btn-gold {
    background: linear-gradient(100deg, var(--gold-hi), var(--gold));
    color: #241c05;
    box-shadow: 0 8px 30px rgba(232, 197, 106, 0.25);
  }
  .q-btn-gold:hover {
    box-shadow: 0 14px 40px rgba(232, 197, 106, 0.4);
  }
  .q-btn-ghost {
    border: 1px solid rgba(243, 236, 217, 0.35);
    color: var(--paper);
  }
  .q-btn-ghost:hover {
    border-color: var(--gold);
    color: var(--gold-hi);
  }
  .q-btn-pink {
    background: var(--pink);
    color: #33041a;
    box-shadow: 0 8px 30px rgba(255, 119, 176, 0.3);
  }

  /* ── live offer card ─────────────── */
  .q-card {
    position: absolute;
    bottom: 3rem;
    inset-inline-end: clamp(1rem, 6vw, 6rem);
    width: min(20rem, calc(100vw - 2rem));
    padding: 1.1rem 1.3rem 1.2rem;
    border-radius: 1.1rem;
    background: rgba(23, 19, 49, 0.72);
    border: 1px solid rgba(232, 197, 106, 0.28);
    backdrop-filter: blur(12px);
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
    transition: border-color 0.4s ease, box-shadow 0.4s ease;
  }
  .q-card.activated {
    border-color: var(--gold-hi);
    box-shadow: 0 18px 60px rgba(232, 197, 106, 0.35);
  }
  .q-card-name {
    font-weight: 600;
    font-size: 1.02rem;
  }
  .q-card-unit {
    color: var(--muted);
    font-size: 0.85rem;
    margin-top: 0.15rem;
  }
  .q-meter {
    margin-top: 0.8rem;
    height: 0.5rem;
    border-radius: 999px;
    background: rgba(243, 236, 217, 0.12);
    overflow: hidden;
  }
  .q-meter-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--gold), var(--gold-hi));
    transition: width 0.7s cubic-bezier(0.3, 0.8, 0.3, 1);
  }
  .q-card-count {
    margin-top: 0.55rem;
    font-size: 0.85rem;
    color: #cfc7e6;
  }
  .q-card-count strong {
    color: var(--gold-hi);
    font-size: 1rem;
  }
  .q-card-activated {
    color: var(--gold-hi);
    font-weight: 700;
    font-size: 1.15rem;
  }
  .q-card-sub {
    margin-top: 0.3rem;
    font-size: 0.88rem;
    color: #cfc7e6;
  }

  /* ── sections ────────────────────── */
  .q-section {
    position: relative;
    max-width: 68rem;
    margin: 0 auto;
    padding: 5.5rem 1.5rem;
  }
  .q-title {
    font-size: clamp(1.7rem, 3.6vw, 2.6rem);
    font-weight: 650;
    max-width: 34rem;
    line-height: 1.2;
  }
  .q-root[dir='ltr'] .q-title {
    font-family: 'Fraunces', 'Rubik', serif;
  }

  .q-principles {
    margin-top: 3rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    gap: 1.2rem;
  }
  .q-principle {
    padding: 1.6rem 1.5rem;
    border-radius: 1rem;
    background: rgba(23, 19, 49, 0.55);
    border-top: 2px solid rgba(232, 197, 106, 0.5);
  }
  .q-principle:nth-child(even) {
    border-top-color: rgba(255, 119, 176, 0.5);
    margin-top: 1.4rem;
  }
  .q-num {
    font-family: 'Fraunces', 'Rubik', serif;
    font-style: italic;
    color: var(--muted);
    font-size: 0.95rem;
  }
  .q-principle h3 {
    margin-top: 0.5rem;
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--gold-hi);
  }
  .q-principle:nth-child(even) h3 {
    color: var(--pink);
  }
  .q-principle p {
    margin-top: 0.6rem;
    line-height: 1.6;
    color: #cfc7e6;
    font-size: 0.95rem;
  }

  .q-how {
    margin-top: 3rem;
    list-style: none;
    padding: 0;
    display: grid;
    gap: 2.2rem;
  }
  .q-how li {
    display: flex;
    gap: 1.2rem;
    align-items: flex-start;
    max-width: 40rem;
  }
  .q-how li:nth-child(2) {
    margin-inline-start: clamp(0rem, 8vw, 6rem);
  }
  .q-how li:nth-child(3) {
    margin-inline-start: clamp(0rem, 16vw, 12rem);
  }
  .q-step-dot {
    flex: none;
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-weight: 700;
    color: #241c05;
    background: linear-gradient(120deg, var(--gold-hi), var(--gold));
    box-shadow: 0 6px 22px rgba(232, 197, 106, 0.3);
  }
  .q-how h3 {
    font-size: 1.15rem;
    font-weight: 600;
  }
  .q-how p {
    margin-top: 0.4rem;
    color: #cfc7e6;
    line-height: 1.6;
    font-size: 0.95rem;
  }

  .q-wish .q-wish-inner,
  .q-sup .q-sup-inner {
    border-radius: 1.4rem;
    padding: clamp(2rem, 5vw, 3.5rem);
  }
  .q-wish-inner {
    background:
      radial-gradient(500px 260px at 85% 0%, rgba(255, 119, 176, 0.18), transparent 70%),
      rgba(23, 19, 49, 0.6);
    border: 1px solid rgba(255, 119, 176, 0.3);
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    gap: clamp(1.5rem, 4vw, 3rem);
    align-items: center;
  }
  @media (max-width: 820px) {
    .q-wish-inner {
      grid-template-columns: 1fr;
    }
  }

  /* live-extraction demo card */
  .q-extract {
    border-radius: 1rem;
    padding: 1.4rem 1.5rem;
    background: rgba(16, 13, 30, 0.75);
    border: 1px solid rgba(255, 119, 176, 0.22);
  }
  .q-extract-label {
    font-size: 0.75rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--pink);
    font-weight: 600;
  }
  .q-extract-quote {
    margin-top: 0.7rem;
    font-size: 0.98rem;
    line-height: 1.6;
    color: #e6dff5;
  }
  .q-root[dir='ltr'] .q-extract-quote {
    font-family: 'Fraunces', 'Rubik', serif;
    font-style: italic;
  }
  .q-chips {
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .q-chip {
    font-size: 0.82rem;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    background: rgba(255, 119, 176, 0.12);
    border: 1px solid rgba(255, 119, 176, 0.35);
    color: #ffd3e6;
    opacity: 0;
    transform: scale(0.8);
  }
  :global(.q-root .q-wish.in) .q-chip {
    animation: chip-pop 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.4) forwards;
    animation-delay: var(--d);
  }
  @keyframes chip-pop {
    to {
      opacity: 1;
      transform: none;
    }
  }
  .q-extract-meter {
    margin-top: 1.1rem;
    height: 0.4rem;
    border-radius: 999px;
    background: rgba(243, 236, 217, 0.1);
    overflow: hidden;
  }
  .q-extract-fill {
    height: 100%;
    width: 0;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--pink), var(--gold-hi));
  }
  :global(.q-root .q-wish.in) .q-extract-fill {
    animation: fill-up 1.4s ease forwards;
    animation-delay: 2.2s;
  }
  @keyframes fill-up {
    to {
      width: 100%;
    }
  }
  .q-extract-cov {
    margin-top: 0.55rem;
    font-size: 0.85rem;
    color: #cfc7e6;
  }
  .q-extract-cov strong {
    color: var(--gold-hi);
  }
  .q-extract-plan {
    margin-top: 1rem;
    padding-top: 0.9rem;
    border-top: 1px dashed rgba(255, 119, 176, 0.25);
    font-size: 0.9rem;
    color: var(--gold-hi);
  }
  @media (prefers-reduced-motion: reduce) {
    .q-chip {
      opacity: 1;
      transform: none;
      animation: none;
    }
    .q-extract-fill {
      width: 100%;
      animation: none;
    }
  }
  .q-sup-inner {
    background:
      radial-gradient(500px 260px at 10% 100%, rgba(232, 197, 106, 0.15), transparent 70%),
      rgba(23, 19, 49, 0.6);
    border: 1px solid rgba(232, 197, 106, 0.3);
  }
  .q-wish h2,
  .q-sup h2 {
    font-size: clamp(1.5rem, 3vw, 2.2rem);
    font-weight: 650;
  }
  .q-root[dir='ltr'] .q-wish h2,
  .q-root[dir='ltr'] .q-sup h2 {
    font-family: 'Fraunces', 'Rubik', serif;
  }
  .q-wish-text p,
  .q-sup p {
    margin-top: 1rem;
    max-width: 38rem;
    line-height: 1.65;
    color: #cfc7e6;
  }
  .q-wish-text .q-btn,
  .q-sup .q-ctas {
    margin-top: 1.8rem;
  }
  .q-sup-note {
    color: var(--muted);
    font-size: 0.88rem;
  }

  .q-foot {
    border-top: 1px solid rgba(243, 236, 217, 0.12);
    padding: 2.5rem 1.5rem 3rem;
    text-align: center;
    color: var(--muted);
  }
  .q-foot strong {
    color: var(--paper);
    font-weight: 600;
  }
  .q-foot a {
    display: inline-block;
    margin-top: 0.8rem;
    color: var(--gold);
    text-decoration: none;
  }
  .q-foot a:hover {
    color: var(--gold-hi);
  }

  /* ── motion ──────────────────────── */
  .hero-seq {
    opacity: 0;
    transform: translateY(18px);
    animation: rise 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
    animation-delay: calc(var(--i) * 140ms + 150ms);
  }
  @keyframes rise {
    to {
      opacity: 1;
      transform: none;
    }
  }
  :global(.q-root .rv) {
    opacity: 0;
    transform: translateY(26px);
    transition:
      opacity 0.7s ease,
      transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1);
  }
  :global(.q-root .rv.in) {
    opacity: 1;
    transform: none;
  }
  .q-title {
    opacity: 0;
    transform: translateY(26px);
    transition:
      opacity 0.7s ease,
      transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1);
  }
  :global(.q-root .q-title.in) {
    opacity: 1;
    transform: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .hero-seq,
    :global(.q-root .rv),
    .q-title {
      animation: none;
      transition: none;
      opacity: 1;
      transform: none;
    }
  }

  @media (max-width: 900px) {
    .q-hero {
      align-items: flex-start;
      padding-top: 5rem;
      padding-bottom: 14rem;
    }
    .q-canvas {
      opacity: 0.55;
    }
    .q-card {
      inset-inline-end: 50%;
      transform: translateX(50%);
    }
    .q-root[dir='rtl'] .q-card {
      transform: translateX(-50%);
    }
    .q-principle:nth-child(even) {
      margin-top: 0;
    }
  }
</style>
