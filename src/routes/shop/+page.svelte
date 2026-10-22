<!--
  /shop — How to create an online shop powered by 1💗1.

  Linked from the homepage (#features shop strip, #faq DEEPER, and footer).
  Walks through the four pillars of 1💗1 commerce:
    1. The ready-made storefront starter (1lev1-shop-starter) — 1-click deploy
       to Vercel / Netlify, with Stripe, PayPal, or zero-processor arranged
       phone/WhatsApp payments, plus connecting an existing site.
    2. 1💗1 as a partner-consensus backend — instant daily operations vs.
       partner-consented price/variant terms (editObject), sovereign direct
       payouts into the (time + resources) = % split, smart oversold handling,
       and buyer privacy.
    3. Post-order automations — fulfillment-step heart cards with one-time
       rule consent, resource inventory consumption (Mashabetahalich: owned,
       perUse consignment, external + low-stock procurement tasks), and
       complex BOM products / quote requests / demand pools.
    4. AI agent management via the 12 shop MCP tools (/mcp) + Headless REST
       API and HMAC-signed webhooks.
-->
<script>
  import { t, isRtl, locale } from '$lib/translations';
  import { registerHref } from '$lib/nav/registerHref.js';
  import { STARTER_REPO_URL } from '$lib/shop/starter';
  import { jsonLdBody, breadcrumbs, faqPage } from '$lib/seo/jsonLd.js';
  import AppearanceMenu from '$lib/components/footer/AppearanceMenu.svelte';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
  import DemoRequest from '$lib/components/main/DemoRequest.svelte';
  import VideoModal from '$lib/components/main/VideoModal.svelte';
  import { VIDEO_SHOP_BUILD, videoFor } from '$lib/videos.js';

  let regHref = $derived(registerHref($locale, '/shop'));

  const PATHS = [
    { key: 'p1', icon: 'store', href: '#template' },
    { key: 'p2', icon: 'link', href: '#template' },
    { key: 'p3', icon: 'ai', href: '#mcp' }
  ];

  const FLOW_STEPS = [
    { key: 'flow1', icon: 'cart' },
    { key: 'flow2', icon: 'link' },
    { key: 'flow3', icon: 'tasks' },
    { key: 'flow4', icon: 'split' }
  ];

  const TEMPLATE_STEPS = [
    { key: 's1', icon: 'product', num: '1' },
    { key: 's2', icon: 'card', num: '2' },
    { key: 's3', icon: 'store', num: '3' }
  ];

  const PAYMENT_MODES = [
    { key: 'pay1', icon: 'card' },
    { key: 'pay2', icon: 'receipt' },
    { key: 'pay3', icon: 'link' }
  ];

  const TEMPLATE_FEATURES = [
    { key: 'f1', icon: 'store' },
    { key: 'f2', icon: 'product' },
    { key: 'f3', icon: 'cart' },
    { key: 'f4', icon: 'delivery' },
    { key: 'f5', icon: 'receipt' },
    { key: 'f6', icon: 'table' }
  ];

  const BACKEND_PILLARS = [
    { key: 'b1', icon: 'votes' },
    { key: 'b2', icon: 'split' },
    { key: 'b3', icon: 'shield' },
    { key: 'b4', icon: 'verify' }
  ];

  const COMPARE_ROWS = ['c1', 'c2', 'c3', 'c4'];

  const AUTOMATION_BLOCKS = [
    { key: 'a1', icon: 'tasks' },
    { key: 'a2', icon: 'resource' },
    { key: 'a3', icon: 'bom' }
  ];

  const MCP_PROMPTS = ['p1', 'p2', 'p3', 'p4'];
  const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5'];

  let demoOpen = $state(false);
  let videoOpen = $state(false);
  // Offered only to readers of the language it is recorded in ($lib/videos.js).
  let shopVideo = $derived(videoFor(VIDEO_SHOP_BUILD, $locale));
  let arrow = $derived($isRtl ? '←' : '→');

  let ld = $derived.by(() => {
    void $locale;
    return [
      breadcrumbs([
        { name: $t('home.crumb.home'), url: 'https://1lev1.com/' },
        { name: $t('shopPage.nav.template'), url: 'https://1lev1.com/shop' }
      ]),
      faqPage(
        FAQ_KEYS.map((qKey, idx) => ({
          question: $t(`shopPage.faq.${qKey}`),
          answer: $t(`shopPage.faq.a${idx + 1}`)
        }))
      )
    ].filter(Boolean);
  });
</script>

<svelte:head>
  <title>{$t('shopPage.meta.title')}</title>
  <meta name="description" content={$t('shopPage.meta.description')} />
  <meta property="og:title" content={$t('shopPage.meta.title')} />
  <meta property="og:description" content={$t('shopPage.meta.description')} />
  <meta property="og:type" content="website" />
  {#each ld as block}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html `<script type="application/ld+json">${jsonLdBody(block)}<\/script>`}
  {/each}
</svelte:head>

<div class="hm sp" dir={$isRtl ? 'rtl' : 'ltr'}>
  <!-- ============ TOP BAR ============ -->
  <header class="sp-top">
    <a href="/" class="sp-logo" aria-label={$t('shopPage.nav.homeAria')} data-sveltekit-prefetch>
      <svg viewBox="0 0 120 110" width="28" height="26" aria-hidden="true">
        <path
          d="M60 100 C 30 78, 10 60, 12 38 C 14 20, 30 12, 44 15 C 52 17, 57 23, 60 30 C 63 23, 68 17, 76 15 C 90 12, 106 20, 108 38 C 110 60, 90 78, 60 100 Z"
          class="a"
        />
        <path
          d="M60 92 C 36 74, 20 58, 22 40 C 24 27, 35 22, 45 24 C 52 26, 57 31, 60 38 C 63 31, 68 26, 75 24 C 85 22, 96 27, 98 40 C 100 58, 84 74, 60 92 Z"
          class="b"
        />
      </svg>
      <span dir="ltr">1💗1</span>
    </a>

    <nav class="sp-nav" aria-label={$t('shopPage.nav.pageNav')}>
      <a href="#template">{$t('shopPage.nav.template')}</a>
      <a href="#backend">{$t('shopPage.nav.backend')}</a>
      <a href="#automation">{$t('shopPage.nav.automation')}</a>
      <a href="#mcp">{$t('shopPage.nav.mcp')}</a>
      <a href="#faq">{$t('shopPage.nav.faq')}</a>
    </nav>

    <div class="sp-actions">
      <AppearanceMenu compact drop="down" />
      <a href={regHref} class="sp-btn sp-btn-primary">{$t('shopPage.nav.ctaTop')}</a>
    </div>
  </header>

  <main class="sp-main">
    <!-- ============ HERO ============ -->
    <section class="sp-hero">
      <div class="sp-hero-copy">
        <span class="sp-eyebrow">{$t('shopPage.hero.eyebrow')}</span>
        <h1>{$t('shopPage.hero.h1')}</h1>
        <p class="sp-lead">{$t('shopPage.hero.lead')}</p>

        <div class="sp-cta-row">
          <a href={regHref} class="sp-btn sp-btn-primary sp-btn-lg">
            {$t('shopPage.hero.ctaPrimary')}
            <span aria-hidden="true">{arrow}</span>
          </a>
          <a
            href={STARTER_REPO_URL}
            target="_blank"
            rel="noopener"
            class="sp-btn sp-btn-outline sp-btn-lg"
          >
            <EntityIcon kind="store" size={18} />
            {$t('shopPage.hero.ctaTemplate')}
          </a>
          <button
            type="button"
            class="sp-btn sp-btn-ghost sp-btn-lg"
            onclick={() => (demoOpen = true)}
          >
            {$t('shopPage.hero.ctaDemo')}
          </button>
        </div>
        {#if shopVideo}
          <button type="button" class="sp-watch" onclick={() => (videoOpen = true)}>
            <span class="sp-watch-play" aria-hidden="true">▶</span>
            {$t('shopPage.hero.ctaVideo')}
          </button>
        {/if}
      </div>

      <!-- Visual 4-step order journey card -->
      <aside class="sp-flow-card" aria-label={$t('shopPage.hero.flowTitle')}>
        <div class="sp-flow-head">
          <span class="sp-icon sp-icon-accent"><EntityIcon kind="store" size={20} /></span>
          <h2>{$t('shopPage.hero.flowTitle')}</h2>
        </div>
        <ol class="sp-flow-list">
          {#each FLOW_STEPS as step (step.key)}
            <li>
              <span class="sp-icon"><EntityIcon kind={step.icon} size={18} /></span>
              <div>
                <strong>{$t(`shopPage.hero.${step.key}_t`)}</strong>
                <p>{$t(`shopPage.hero.${step.key}_d`)}</p>
              </div>
            </li>
          {/each}
        </ol>
      </aside>
    </section>

    <!-- ============ 3 PATHS STRIP ============ -->
    <section class="sp-paths">
      {#each PATHS as p (p.key)}
        <a href={p.href} class="sp-path-card">
          <div class="sp-path-top">
            <span class="sp-icon"><EntityIcon kind={p.icon} size={20} /></span>
            <span class="sp-badge">{$t(`shopPage.paths.${p.key}_badge`)}</span>
          </div>
          <h3>{$t(`shopPage.paths.${p.key}_t`)}</h3>
          <p>{$t(`shopPage.paths.${p.key}_d`)}</p>
        </a>
      {/each}
    </section>

    <!-- ============ 1. STARTER TEMPLATE ============ -->
    <section id="template" class="sp-band">
      <div class="sp-band-head">
        <span class="sp-eyebrow">{$t('shopPage.template.eyebrow')}</span>
        <h2>{$t('shopPage.template.title')}</h2>
        <p class="sp-sub">{$t('shopPage.template.lead')}</p>
      </div>

      <div class="sp-steps-grid">
        {#each TEMPLATE_STEPS as step (step.key)}
          <article class="sp-card">
            <div class="sp-step-top">
              <span class="sp-step-num">{step.num}</span>
              <span class="sp-icon"><EntityIcon kind={step.icon} size={20} /></span>
            </div>
            <h3>{$t(`shopPage.template.${step.key}_t`)}</h3>
            <p>{$t(`shopPage.template.${step.key}_d`)}</p>
          </article>
        {/each}
      </div>

      <!-- Payment paths sub-band -->
      <div class="sp-subband">
        <div class="sp-subband-head">
          <h3>{$t('shopPage.template.payTitle')}</h3>
          <p>{$t('shopPage.template.paySub')}</p>
        </div>
        <div class="sp-steps-grid">
          {#each PAYMENT_MODES as mode (mode.key)}
            <article class="sp-card sp-card-soft">
              <span class="sp-icon"><EntityIcon kind={mode.icon} size={20} /></span>
              <h4>{$t(`shopPage.template.${mode.key}_t`)}</h4>
              <p>{$t(`shopPage.template.${mode.key}_d`)}</p>
            </article>
          {/each}
        </div>
      </div>

      <!-- 6 built-in storefront features -->
      <div class="sp-features-block">
        <h3 class="sp-h3-center">{$t('shopPage.template.featuresTitle')}</h3>
        <div class="sp-features-grid">
          {#each TEMPLATE_FEATURES as feat (feat.key)}
            <div class="sp-mini-card">
              <span class="sp-icon"><EntityIcon kind={feat.icon} size={18} /></span>
              <div>
                <h4>{$t(`shopPage.template.${feat.key}_t`)}</h4>
                <p>{$t(`shopPage.template.${feat.key}_d`)}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <!-- ============ 2. CONSENSUS BACKEND ============ -->
    <section id="backend" class="sp-band">
      <div class="sp-band-head">
        <span class="sp-eyebrow">{$t('shopPage.backend.eyebrow')}</span>
        <h2>{$t('shopPage.backend.title')}</h2>
        <p class="sp-sub">{$t('shopPage.backend.lead')}</p>
      </div>

      <div class="sp-pillars-grid">
        {#each BACKEND_PILLARS as pillar (pillar.key)}
          <article class="sp-card">
            <span class="sp-icon sp-icon-accent"><EntityIcon kind={pillar.icon} size={22} /></span>
            <h3>{$t(`shopPage.backend.${pillar.key}_t`)}</h3>
            <p>{$t(`shopPage.backend.${pillar.key}_d`)}</p>
          </article>
        {/each}
      </div>

      <!-- Comparison table -->
      <div class="sp-compare-wrap">
        <h3 class="sp-h3-center">{$t('shopPage.backend.compareTitle')}</h3>
        <div class="sp-table-scroll">
          <table class="sp-compare">
            <thead>
              <tr>
                <th>{$t('shopPage.backend.colTopic')}</th>
                <th>{$t('shopPage.backend.colRegular')}</th>
                <th class="sp-col-rikma">{$t('shopPage.backend.colRikma')}</th>
              </tr>
            </thead>
            <tbody>
              {#each COMPARE_ROWS as rowKey (rowKey)}
                <tr>
                  <td class="sp-td-label">{$t(`shopPage.backend.${rowKey}_label`)}</td>
                  <td class="sp-td-reg">{$t(`shopPage.backend.${rowKey}_reg`)}</td>
                  <td class="sp-td-rik">{$t(`shopPage.backend.${rowKey}_rik`)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ============ 3. AUTOMATIONS & INVENTORY ============ -->
    <section id="automation" class="sp-band">
      <div class="sp-band-head">
        <span class="sp-eyebrow">{$t('shopPage.automation.eyebrow')}</span>
        <h2>{$t('shopPage.automation.title')}</h2>
        <p class="sp-sub">{$t('shopPage.automation.lead')}</p>
      </div>

      <div class="sp-auto-stack">
        {#each AUTOMATION_BLOCKS as blk (blk.key)}
          <article class="sp-auto-card">
            <div class="sp-auto-head">
              <span class="sp-icon sp-icon-accent"><EntityIcon kind={blk.icon} size={22} /></span>
              <div>
                <span class="sp-kicker">{$t(`shopPage.automation.${blk.key}_kicker`)}</span>
                <h3>{$t(`shopPage.automation.${blk.key}_t`)}</h3>
              </div>
            </div>
            <p class="sp-auto-desc">{$t(`shopPage.automation.${blk.key}_d`)}</p>
            <ul class="sp-bullet-list">
              <li>{$t(`shopPage.automation.${blk.key}_b1`)}</li>
              <li>{$t(`shopPage.automation.${blk.key}_b2`)}</li>
              <li>{$t(`shopPage.automation.${blk.key}_b3`)}</li>
            </ul>
          </article>
        {/each}
      </div>
    </section>

    <!-- ============ 4. MCP & HEADLESS API ============ -->
    <section id="mcp" class="sp-band sp-band-dark">
      <div class="sp-band-head">
        <span class="sp-eyebrow sp-eyebrow-dark">{$t('shopPage.mcp.eyebrow')}</span>
        <h2>{$t('shopPage.mcp.title')}</h2>
        <p class="sp-sub">{$t('shopPage.mcp.lead')}</p>
      </div>

      <div class="sp-mcp-grid">
        <article class="sp-dark-card">
          <div class="sp-dark-card-head">
            <span class="sp-icon sp-icon-gold"><EntityIcon kind="ai" size={20} /></span>
            <h3>{$t('shopPage.mcp.readTitle')}</h3>
          </div>
          <p>{$t('shopPage.mcp.readDesc')}</p>
          <code class="sp-code-box" dir="ltr">{$t('shopPage.mcp.readTools')}</code>
        </article>

        <article class="sp-dark-card">
          <div class="sp-dark-card-head">
            <span class="sp-icon sp-icon-gold"><EntityIcon kind="tasks" size={20} /></span>
            <h3>{$t('shopPage.mcp.writeTitle')}</h3>
          </div>
          <p>{$t('shopPage.mcp.writeDesc')}</p>
          <code class="sp-code-box" dir="ltr">{$t('shopPage.mcp.writeTools')}</code>
        </article>
      </div>

      <div class="sp-prompts-box">
        <h3>{$t('shopPage.mcp.promptsTitle')}</h3>
        <div class="sp-prompts-grid">
          {#each MCP_PROMPTS as pKey (pKey)}
            <div class="sp-prompt-pill">{$t(`shopPage.mcp.${pKey}`)}</div>
          {/each}
        </div>
      </div>

      <div class="sp-api-box">
        <div class="sp-api-copy">
          <h3>{$t('shopPage.mcp.apiTitle')}</h3>
          <p>{$t('shopPage.mcp.apiDesc')}</p>
          <code class="sp-code-box" dir="ltr">{$t('shopPage.mcp.apiEndpoints')}</code>
        </div>
        <a href="/mcp" class="sp-btn sp-btn-gold sp-btn-lg" data-sveltekit-prefetch>
          <EntityIcon kind="ai" size={18} />
          {$t('shopPage.mcp.ctaMcp')}
          <span aria-hidden="true">{arrow}</span>
        </a>
      </div>
    </section>

    <!-- ============ 5. FAQ ============ -->
    <section id="faq" class="sp-band">
      <div class="sp-band-head">
        <h2>{$t('shopPage.faq.title')}</h2>
      </div>
      <div class="sp-faq-list">
        {#each FAQ_KEYS as qKey, idx (qKey)}
          <details class="sp-faq-item" open={idx === 0}>
            <summary>{$t(`shopPage.faq.${qKey}`)}</summary>
            <p>{$t(`shopPage.faq.a${idx + 1}`)}</p>
          </details>
        {/each}
      </div>
    </section>

    <!-- ============ FINAL CTA ============ -->
    <section class="sp-final">
      <h2>{$t('shopPage.close.title')}</h2>
      <p>{$t('shopPage.close.sub')}</p>
      <div class="sp-cta-row sp-cta-center">
        <a href={regHref} class="sp-btn sp-btn-final sp-btn-lg">
          {$t('shopPage.close.ctaPrimary')}
          <span aria-hidden="true">{arrow}</span>
        </a>
        <a href="/mcp" class="sp-btn sp-btn-final-outline sp-btn-lg" data-sveltekit-prefetch>
          {$t('shopPage.close.ctaMcp')}
        </a>
        <button
          type="button"
          class="sp-btn sp-btn-final-outline sp-btn-lg"
          onclick={() => (demoOpen = true)}
        >
          {$t('shopPage.close.ctaDemo')}
        </button>
      </div>
      <a href="/" class="sp-backlink" data-sveltekit-prefetch>
        <span aria-hidden="true">{arrow}</span>
        {$t('shopPage.close.back')}
      </a>
    </section>
  </main>
</div>

<DemoRequest bind:open={demoOpen} source="shop" initialTrack="partnership" />

<VideoModal
  bind:open={videoOpen}
  videoId={shopVideo ?? ''}
  title={$t('shopPage.hero.videoLabel')}
  closeLabel={$t('shopPage.hero.videoClose')}
/>

<style>
  /* ===== Theme × mode tokens (matching fpage.svelte) ====================== */
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
    --hm-glow-a: #fce9f1;
    --hm-glow-b: #fff3c9;
    --hm-night-bg: #1a130a;
    --hm-night-ink: #fbf6ea;
    --hm-night-muted: #d9cca8;
    --hm-night-gold: #f0c040;
    --hm-final-bg: #b80069;
    --hm-final-glow: #ff4fa8;
    --hm-final-ink: #fff7d6;
    --hm-radius: 22px;
    --hm-radius-lg: 28px;
    --hm-pill: 999px;
    --hm-shadow: 0 24px 60px rgb(87 64 16 / 0.1);
    --hm-display: 'Frank Ruhl Libre', 'Noto Serif', Georgia, serif;
    --hm-display-weight: 900;
    --hm-gutter: clamp(16px, 5vw, 96px);
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
    --hm-glow-a: #dbeafe;
    --hm-glow-b: #e0e7ff;
    --hm-night-bg: #0b1220;
    --hm-night-ink: #f8fafc;
    --hm-night-muted: #cbd5e1;
    --hm-night-gold: #93c5fd;
    --hm-final-bg: #1e3a8a;
    --hm-final-glow: #2563eb;
    --hm-final-ink: #f8fafc;
    --hm-radius: 10px;
    --hm-radius-lg: 12px;
    --hm-pill: 8px;
    --hm-shadow: 0 12px 32px rgb(15 23 42 / 0.07);
    --hm-display: 'Rubik', system-ui, -apple-system, sans-serif;
    --hm-display-weight: 700;
  }
  :global(html.business.dark) .hm {
    --hm-bg: #0b1220;
    --hm-surface: #111c33;
    --hm-ink: #f1f5f9;
    --hm-ink2: #cbd5e1;
    --hm-muted: #94a3b8;
    --hm-line: rgb(148 163 184 / 0.18);
    --hm-accent: #60a5fa;
    --hm-accent-soft: rgb(59 130 246 / 0.16);
    --hm-accent-deep: #93c5fd;
    --hm-cta-bg: #3b82f6;
    --hm-cta-ink: #0b1220;
    --hm-gold: rgb(56 189 248 / 0.14);
    --hm-gold-ink: #7dd3fc;
    --hm-goldink: #93c5fd;
    --hm-chip: rgb(241 245 249 / 0.07);
    --hm-glow-a: #172554;
    --hm-glow-b: #0f172a;
    --hm-night-bg: #060b16;
    --hm-final-bg: #172554;
    --hm-final-glow: #1d4ed8;
    --hm-shadow: 0 24px 60px rgb(0 0 0 / 0.45);
  }

  .sp {
    min-height: 100vh;
    background: var(--hm-bg);
    color: var(--hm-ink);
    font-family: 'Rubik', system-ui, -apple-system, sans-serif;
    padding-bottom: 64px;
  }

  /* ===== Top Header ======================================================= */
  .sp-top {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px var(--hm-gutter);
    background: color-mix(in srgb, var(--hm-bg) 88%, transparent);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--hm-line);
  }
  .sp-logo {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;
    font-size: 20px;
    color: var(--hm-ink);
    text-decoration: none;
  }
  .sp-logo svg .a {
    fill: #ff0092;
  }
  .sp-logo svg .b {
    fill: #eee8aa;
  }
  .sp-nav {
    display: none;
    align-items: center;
    gap: 20px;
  }
  @media (min-width: 900px) {
    .sp-nav {
      display: flex;
    }
  }
  .sp-nav a {
    color: var(--hm-ink2);
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
  }
  .sp-nav a:hover {
    color: var(--hm-accent);
  }
  .sp-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  /* ===== Main container & typography ====================================== */
  .sp-main {
    max-width: 1240px;
    margin: 0 auto;
    padding: 28px var(--hm-gutter) 0;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  .sp-eyebrow {
    display: inline-block;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.06em;
    color: var(--hm-accent);
    text-transform: uppercase;
  }
  .sp-eyebrow-dark {
    color: var(--hm-night-gold);
  }
  h1 {
    margin: 0;
    font-family: var(--hm-display);
    font-weight: var(--hm-display-weight);
    font-size: clamp(30px, 4.4vw, 52px);
    line-height: 1.12;
  }
  h2 {
    margin: 0;
    font-family: var(--hm-display);
    font-weight: var(--hm-display-weight);
    font-size: clamp(24px, 3.2vw, 38px);
    line-height: 1.18;
  }
  h3 {
    margin: 0;
    font-size: 19px;
    font-weight: 800;
    line-height: 1.3;
  }
  h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 800;
    line-height: 1.35;
  }
  .sp-lead {
    margin: 0;
    font-size: clamp(16px, 1.5vw, 19px);
    line-height: 1.65;
    color: var(--hm-ink2);
  }
  .sp-sub {
    margin: 0;
    max-width: 72ch;
    font-size: 16px;
    line-height: 1.65;
    color: var(--hm-ink2);
  }
  .sp-h3-center {
    text-align: center;
    font-size: 21px;
  }

  /* ===== Buttons & icons ================================================== */
  .sp-cta-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }
  .sp-cta-center {
    justify-content: center;
  }
  .sp-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: var(--hm-pill);
    font-family: inherit;
    font-size: 14px;
    font-weight: 800;
    text-decoration: none;
    cursor: pointer;
    border: 1.5px solid transparent;
    transition:
      transform 0.15s,
      box-shadow 0.15s,
      border-color 0.15s;
  }
  .sp-btn:hover {
    transform: translateY(-1px);
  }
  .sp-btn-lg {
    padding: 13px 22px;
    font-size: 15px;
  }
  .sp-btn-primary {
    background: var(--hm-cta-bg);
    color: var(--hm-cta-ink);
  }
  .sp-btn-outline {
    background: var(--hm-surface);
    color: var(--hm-ink);
    border-color: var(--hm-line);
  }
  .sp-btn-outline:hover {
    border-color: var(--hm-accent);
  }
  .sp-btn-ghost {
    background: var(--hm-chip);
    color: var(--hm-ink);
  }
  .sp-btn-gold {
    background: var(--hm-night-gold);
    color: #1a130a;
  }
  .sp-btn-final {
    background: var(--hm-final-ink);
    color: var(--hm-final-bg);
  }
  .sp-btn-final-outline {
    background: transparent;
    color: var(--hm-final-ink);
    border-color: color-mix(in srgb, var(--hm-final-ink) 45%, transparent);
  }

  .sp-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    border-radius: 12px;
    background: var(--hm-accent-soft);
    color: var(--hm-accent);
  }
  .sp-icon-accent {
    background: var(--hm-cta-bg);
    color: var(--hm-cta-ink);
  }
  .sp-icon-gold {
    background: rgb(240 192 64 / 0.18);
    color: var(--hm-night-gold);
  }

  /* ===== Hero ============================================================= */
  .sp-hero {
    display: grid;
    grid-template-columns: 1fr;
    gap: 28px;
    align-items: center;
    padding: clamp(22px, 4vw, 44px);
    border-radius: var(--hm-radius-lg);
    background:
      radial-gradient(640px 320px at 85% 0%, var(--hm-glow-a), transparent 70%),
      radial-gradient(540px 280px at 10% 100%, var(--hm-glow-b), transparent 70%),
      var(--hm-surface);
    border: 1px solid var(--hm-line);
    box-shadow: var(--hm-shadow);
  }
  @media (min-width: 960px) {
    .sp-hero {
      grid-template-columns: 1.2fr 1fr;
    }
  }
  .sp-hero-copy {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .sp-watch {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 0;
    background: none;
    border: 0;
    font-family: inherit;
    font-size: 15px;
    font-weight: 800;
    color: var(--hm-accent);
    cursor: pointer;
  }
  .sp-watch:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .sp-watch-play {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--hm-cta-bg);
    color: var(--hm-cta-ink);
    font-size: 12px;
    padding-inline-start: 2px;
  }
  .sp-flow-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 22px;
    border-radius: var(--hm-radius);
    background: var(--hm-bg);
    border: 1px solid var(--hm-line);
  }
  .sp-flow-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .sp-flow-head h2 {
    font-size: 18px;
    font-family: inherit;
    font-weight: 800;
  }
  .sp-flow-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .sp-flow-list li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    border-radius: 16px;
    background: var(--hm-surface);
    border: 1px solid var(--hm-line);
  }
  .sp-flow-list strong {
    display: block;
    font-size: 14px;
    margin-bottom: 3px;
  }
  .sp-flow-list p {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--hm-muted);
  }

  /* ===== 3 Paths Strip ==================================================== */
  .sp-paths {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  @media (min-width: 820px) {
    .sp-paths {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .sp-path-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 22px;
    border-radius: var(--hm-radius);
    background: var(--hm-surface);
    border: 1px solid var(--hm-line);
    color: var(--hm-ink);
    text-decoration: none;
    transition:
      border-color 0.15s,
      transform 0.15s;
  }
  .sp-path-card:hover {
    border-color: var(--hm-accent);
    transform: translateY(-2px);
  }
  .sp-path-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .sp-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: var(--hm-pill);
    background: var(--hm-gold);
    color: var(--hm-gold-ink);
    font-size: 12px;
    font-weight: 800;
  }
  .sp-path-card p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--hm-muted);
  }

  /* ===== Section Bands ==================================================== */
  .sp-band {
    display: flex;
    flex-direction: column;
    gap: 28px;
    padding: clamp(22px, 4vw, 44px);
    border-radius: var(--hm-radius-lg);
    background: var(--hm-surface);
    border: 1px solid var(--hm-line);
    box-shadow: var(--hm-shadow);
    scroll-margin-top: 76px;
  }
  .sp-band-head {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sp-steps-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  @media (min-width: 860px) {
    .sp-steps-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .sp-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 22px;
    border-radius: var(--hm-radius);
    background: var(--hm-bg);
    border: 1px solid var(--hm-line);
  }
  .sp-card-soft {
    background: var(--hm-surface);
  }
  .sp-card p {
    margin: 0;
    font-size: 14.5px;
    line-height: 1.65;
    color: var(--hm-ink2);
  }
  .sp-step-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .sp-step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: var(--hm-pill);
    background: var(--hm-cta-bg);
    color: var(--hm-cta-ink);
    font-size: 14px;
    font-weight: 900;
  }

  .sp-subband {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 22px;
    border-radius: var(--hm-radius);
    background: linear-gradient(135deg, var(--hm-glow-a), var(--hm-glow-b));
    border: 1px solid var(--hm-line);
  }
  .sp-subband-head {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .sp-subband-head p {
    margin: 0;
    font-size: 14.5px;
    color: var(--hm-ink2);
  }

  .sp-features-block {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .sp-features-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }
  @media (min-width: 720px) {
    .sp-features-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (min-width: 1040px) {
    .sp-features-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .sp-mini-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    border-radius: 16px;
    background: var(--hm-bg);
    border: 1px solid var(--hm-line);
  }
  .sp-mini-card p {
    margin: 4px 0 0;
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--hm-muted);
  }

  /* ===== Backend Pillars & Compare Table ================================== */
  .sp-pillars-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  @media (min-width: 820px) {
    .sp-pillars-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .sp-compare-wrap {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .sp-table-scroll {
    overflow-x: auto;
    border-radius: var(--hm-radius);
    border: 1px solid var(--hm-line);
  }
  .sp-compare {
    width: 100%;
    border-collapse: collapse;
    background: var(--hm-bg);
    font-size: 14px;
  }
  .sp-compare th,
  .sp-compare td {
    padding: 14px 16px;
    text-align: start;
    border-bottom: 1px solid var(--hm-line);
    vertical-align: top;
    line-height: 1.55;
  }
  .sp-compare thead th {
    background: var(--hm-chip);
    font-weight: 800;
    color: var(--hm-ink);
  }
  .sp-compare th.sp-col-rikma {
    background: var(--hm-accent-soft);
    color: var(--hm-accent-deep);
  }
  .sp-td-label {
    font-weight: 800;
    color: var(--hm-ink);
    min-width: 150px;
  }
  .sp-td-reg {
    color: var(--hm-muted);
    min-width: 220px;
  }
  .sp-td-rik {
    font-weight: 600;
    color: var(--hm-ink);
    background: color-mix(in srgb, var(--hm-accent-soft) 45%, transparent);
    min-width: 240px;
  }

  /* ===== Automations & Inventory ========================================== */
  .sp-auto-stack {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .sp-auto-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 24px;
    border-radius: var(--hm-radius);
    background: var(--hm-bg);
    border: 1px solid var(--hm-line);
  }
  .sp-auto-head {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .sp-kicker {
    display: block;
    font-size: 12px;
    font-weight: 800;
    color: var(--hm-accent);
    margin-bottom: 2px;
  }
  .sp-auto-desc {
    margin: 0;
    font-size: 15px;
    line-height: 1.65;
    color: var(--hm-ink2);
  }
  .sp-bullet-list {
    margin: 0;
    padding-inline-start: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14.5px;
    line-height: 1.65;
    color: var(--hm-ink);
  }

  /* ===== Dark MCP & API Band ============================================== */
  .sp-band-dark {
    background: var(--hm-night-bg);
    color: var(--hm-night-ink);
    border-color: transparent;
  }
  .sp-band-dark .sp-sub {
    color: var(--hm-night-muted);
  }
  .sp-mcp-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  @media (min-width: 820px) {
    .sp-mcp-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .sp-dark-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 22px;
    border-radius: var(--hm-radius);
    background: rgb(255 255 255 / 0.05);
    border: 1px solid rgb(255 255 255 / 0.12);
  }
  .sp-dark-card-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .sp-dark-card p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--hm-night-muted);
  }
  .sp-code-box {
    display: block;
    padding: 12px 14px;
    border-radius: 12px;
    background: rgb(0 0 0 / 0.35);
    border: 1px solid rgb(255 255 255 / 0.12);
    color: var(--hm-night-gold);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12.5px;
    line-height: 1.65;
    word-break: break-word;
  }
  .sp-prompts-box {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .sp-prompts-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }
  @media (min-width: 780px) {
    .sp-prompts-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .sp-prompt-pill {
    padding: 14px 16px;
    border-radius: 14px;
    background: rgb(255 255 255 / 0.06);
    border: 1px dashed rgb(240 192 64 / 0.35);
    font-size: 14px;
    line-height: 1.55;
    color: var(--hm-night-ink);
  }
  .sp-api-box {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 18px 24px;
    padding: 22px;
    border-radius: var(--hm-radius);
    background: rgb(255 255 255 / 0.04);
    border: 1px solid rgb(255 255 255 / 0.14);
  }
  .sp-api-copy {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1 1 420px;
    min-width: 0;
  }
  .sp-api-copy p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--hm-night-muted);
  }

  /* ===== FAQ ============================================================== */
  .sp-faq-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .sp-faq-item {
    padding: 16px 20px;
    border-radius: 16px;
    background: var(--hm-bg);
    border: 1px solid var(--hm-line);
  }
  .sp-faq-item summary {
    cursor: pointer;
    font-weight: 800;
    font-size: 16px;
    color: var(--hm-ink);
  }
  .sp-faq-item p {
    margin: 10px 0 0;
    font-size: 14.5px;
    line-height: 1.65;
    color: var(--hm-ink2);
  }

  /* ===== Final CTA ======================================================== */
  .sp-final {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
    padding: clamp(28px, 5vw, 56px);
    border-radius: var(--hm-radius-lg);
    background: radial-gradient(
      circle at 50% 0%,
      var(--hm-final-glow),
      var(--hm-final-bg) 72%
    );
    color: var(--hm-final-ink);
    box-shadow: var(--hm-shadow);
  }
  .sp-final p {
    margin: 0;
    max-width: 60ch;
    font-size: 16px;
    line-height: 1.65;
    opacity: 0.94;
  }
  .sp-backlink {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    color: var(--hm-final-ink);
    font-size: 14px;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
</style>
