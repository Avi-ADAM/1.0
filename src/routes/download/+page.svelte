<!--
  /download - get 1lev1 as an app.

  The conventional download page: one big button for the visitor's own OS
  (guessed client-side, so the server render is the Windows default), the
  version and date next to it, every platform listed below with an honest
  status, then install steps and a short FAQ.

  What is published is read from the Tauri updater manifest (see
  $lib/server/download/releases.js), so a release appears here the moment the
  updater would install it. Nothing configured ⇒ the "coming soon" state.

  The stable `/download/windows` link (./[platform]/+server.js) always resolves
  to the current installer; this page links the file directly.
-->
<script>
  import { onMount } from 'svelte';
  import { t, isRtl, locale } from '$lib/translations';
  import { detectPlatform } from '$lib/download/release.js';
  import { breadcrumbs, faqPage, jsonLdBody } from '$lib/seo/jsonLd.js';

  /** @type {{ data: { release: import('$lib/download/release.js').DesktopRelease | null, android: { url: string, store: boolean } | null } }} */
  let { data } = $props();

  // The server cannot see the OS, so it renders the Windows default; onMount corrects it.
  let detected = $state(/** @type {import('$lib/download/release.js').Platform} */ ('windows'));

  onMount(() => {
    const nav = /** @type {Navigator & { userAgentData?: { platform?: string } }} */ (navigator);
    detected = detectPlatform(nav.userAgent, {
      platform: nav.userAgentData?.platform,
      maxTouchPoints: nav.maxTouchPoints
    });
  });

  const release = $derived(data.release);
  const android = $derived(data.android);

  /** What the hero offers: the visitor's own platform when there is something for it. */
  const hero = $derived(
    detected === 'android' && android
      ? 'android'
      : detected === 'windows' && release
        ? 'windows'
        : 'none'
  );

  const releasedOn = $derived(
    release?.pubDate
      ? new Intl.DateTimeFormat($locale || 'he', { dateStyle: 'long' }).format(new Date(release.pubDate))
      : ''
  );

  /** @type {{ id: 'windows' | 'android' | 'mac' | 'linux' | 'ios', href: string | null, action: string }[]} */
  const PLATFORMS = $derived([
    { id: 'windows', href: release?.windowsExe ?? null, action: 'download.action.download' },
    {
      id: 'android',
      href: android?.url ?? null,
      action: android?.store ? 'download.action.play' : 'download.action.apk'
    },
    { id: 'mac', href: null, action: '' },
    { id: 'linux', href: null, action: '' },
    { id: 'ios', href: null, action: '' }
  ]);

  const STEPS = [1, 2, 3, 4];
  const FAQ = [1, 2, 3, 4];

  const crumbLd = $derived(
    breadcrumbs([
      { name: $t('home.crumb.home'), url: 'https://1lev1.com/' },
      { name: $t('download.meta.title'), url: 'https://1lev1.com/download' }
    ])
  );
  const faqLd = $derived(
    faqPage(FAQ.map((i) => ({ question: $t(`download.faq.q${i}`), answer: $t(`download.faq.a${i}`) })))
  );
  // Only describes a downloadable app when one is actually published.
  const appLd = $derived(
    release?.windowsExe
      ? {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: '1lev1',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Windows 10, Windows 11',
          softwareVersion: release.version,
          ...(release.pubDate ? { datePublished: release.pubDate.slice(0, 10) } : {}),
          downloadUrl: 'https://1lev1.com/download/windows',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          publisher: { '@type': 'Organization', name: '1lev1', url: 'https://1lev1.com/' }
        }
      : null
  );
</script>

<svelte:head>
  <title>{$t('download.meta.title')}</title>
  <meta name="description" content={$t('download.meta.description')} />
  <meta property="og:title" content={$t('download.meta.title')} />
  <meta property="og:description" content={$t('download.meta.description')} />
  <meta property="og:type" content="website" />
  <link rel="canonical" href="https://1lev1.com/download" />
  {@html `<script type="application/ld+json">${jsonLdBody(crumbLd)}<\/script>`}
  {#if faqLd}
    {@html `<script type="application/ld+json">${jsonLdBody(faqLd)}<\/script>`}
  {/if}
  {#if appLd}
    {@html `<script type="application/ld+json">${jsonLdBody(appLd)}<\/script>`}
  {/if}
</svelte:head>

<main class="dl-wrap" dir={$isRtl ? 'rtl' : 'ltr'}>
  <header class="dl-hero">
    <img class="dl-icon" src="/coin-logo.png" alt="" width="72" height="72" />
    <p class="dl-eyebrow">{$t('download.hero.eyebrow')}</p>
    <h1>{$t('download.hero.title')}</h1>
    <p class="dl-lede">{$t('download.hero.lede')}</p>

    <div class="dl-cta">
      {#if hero === 'windows' && release?.windowsExe}
        <a class="dl-btn" href={release.windowsExe} rel="nofollow">
          <svg viewBox="0 0 24 24" aria-hidden="true" class="dl-btn-icon"
            ><path d="M12 3v12m0 0-5-5m5 5 5-5M4 19h16" /></svg
          >
          {$t('download.cta.windows')}
        </a>
        <p class="dl-meta">
          <span dir="ltr">{$t('download.cta.version', { version: release.version })}</span>
          {#if releasedOn}<span aria-hidden="true">·</span><span>{$t('download.cta.released', { date: releasedOn })}</span>{/if}
          <span aria-hidden="true">·</span><span>{$t('download.cta.requirements')}</span>
        </p>
        {#if release.windowsMsi}
          <p class="dl-alt"><a href={release.windowsMsi} rel="nofollow">{$t('download.cta.msi')}</a></p>
        {/if}
      {:else if hero === 'android' && android}
        <a class="dl-btn" href={android.url} rel="nofollow">
          {$t(android.store ? 'download.cta.androidPlay' : 'download.cta.androidApk')}
        </a>
      {:else}
        <div class="dl-notice" role="status">
          {#if detected === 'windows'}
            <strong>{$t('download.soon.title')}</strong>
            <p>{$t('download.soon.body')}</p>
          {:else if detected === 'other'}
            <p>{$t('download.detected.other')}</p>
          {:else}
            <p>{$t('download.detected.none', { os: $t(`download.platforms.${detected}.name`) })}</p>
          {/if}
        </div>
        <a class="dl-btn dl-btn-ghost" href="/">{$t('download.cta.web')}</a>
      {/if}
    </div>
  </header>

  <section aria-labelledby="dl-platforms">
    <h2 id="dl-platforms">{$t('download.platforms.title')}</h2>
    <ul class="dl-grid">
      {#each PLATFORMS as p (p.id)}
        <li class="dl-card" class:dl-card-mine={p.id === detected}>
          <div class="dl-card-head">
            <h3>{$t(`download.platforms.${p.id}.name`)}</h3>
            <span class="dl-badge" class:dl-badge-on={!!p.href}>
              {$t(p.href ? 'download.status.available' : 'download.status.soon')}
            </span>
          </div>
          <p>{$t(`download.platforms.${p.id}.desc`)}</p>
          {#if p.href}
            <a class="dl-card-link" href={p.href} rel="nofollow">{$t(p.action)}</a>
          {/if}
        </li>
      {/each}
      <li class="dl-card" class:dl-card-mine={hero === 'none'}>
        <div class="dl-card-head">
          <h3>{$t('download.platforms.web.name')}</h3>
          <span class="dl-badge dl-badge-on">{$t('download.status.always')}</span>
        </div>
        <p>{$t('download.platforms.web.desc')}</p>
        <a class="dl-card-link" href="/">{$t('download.action.open')}</a>
      </li>
    </ul>
  </section>

  <section aria-labelledby="dl-install">
    <h2 id="dl-install">{$t('download.install.title')}</h2>
    <ol class="dl-steps">
      {#each STEPS as i (i)}
        <li>{$t(`download.install.s${i}`)}</li>
      {/each}
    </ol>
    <p class="dl-note">{$t('download.install.smartscreen')}</p>
  </section>

  <section aria-labelledby="dl-what">
    <h2 id="dl-what">{$t('download.what.title')}</h2>
    <p>{$t('download.what.p1')}</p>
    <p>{$t('download.what.p2')}</p>
    <p>{$t('download.what.p3')}</p>
  </section>

  {#if release?.notes}
    <section aria-labelledby="dl-notes">
      <h2 id="dl-notes">{$t('download.notes.title', { version: release.version })}</h2>
      <p class="dl-release-notes" dir="auto">{release.notes}</p>
    </section>
  {/if}

  <section aria-labelledby="dl-faq">
    <h2 id="dl-faq">{$t('download.faq.title')}</h2>
    {#each FAQ as i (i)}
      <details class="dl-faq">
        <summary>{$t(`download.faq.q${i}`)}</summary>
        <p>{$t(`download.faq.a${i}`)}</p>
      </details>
    {/each}
  </section>
</main>

<style>
  .dl-wrap {
    max-width: 52rem;
    margin: 0 auto;
    padding: 3rem 1.25rem 5rem;
    color: var(--text);
    font-size: 1.02rem;
    line-height: 1.75;
  }

  .dl-hero {
    text-align: center;
    margin-bottom: 3rem;
  }

  .dl-icon {
    display: block;
    margin: 0 auto 1rem;
    border-radius: 1.25rem;
  }

  .dl-eyebrow {
    margin: 0 0 0.5rem;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--barbi-pink);
  }

  h1 {
    margin: 0 0 0.75rem;
    font-size: clamp(1.8rem, 5vw, 2.6rem);
    font-weight: 800;
    line-height: 1.2;
    color: var(--gold);
  }

  .dl-lede {
    margin: 0 auto 2rem;
    max-width: 36rem;
    font-size: 1.12rem;
  }

  .dl-cta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .dl-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.9rem 2.25rem;
    border-radius: 9999px;
    background: var(--barbi-pink);
    color: #fff;
    font-size: 1.1rem;
    font-weight: 700;
    text-decoration: none;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .dl-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgb(0 0 0 / 0.15);
  }

  .dl-btn:focus-visible,
  .dl-card-link:focus-visible {
    outline: 3px solid var(--gold);
    outline-offset: 3px;
  }

  .dl-btn-ghost {
    background: transparent;
    color: var(--gold);
    border: 2px solid var(--gold);
  }

  .dl-btn-icon {
    width: 1.3rem;
    height: 1.3rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .dl-meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.4rem;
    margin: 0;
    font-size: 0.9rem;
    color: var(--tm, #94a3b8);
  }

  .dl-alt {
    margin: 0;
    font-size: 0.9rem;
  }

  .dl-notice {
    max-width: 32rem;
    padding: 1rem 1.25rem;
    border: 1px dashed var(--gold);
    border-radius: var(--radius-theme, 0.75rem);
  }

  .dl-notice p {
    margin: 0.25rem 0 0;
  }

  h2 {
    margin: 0 0 1rem;
    font-size: clamp(1.25rem, 3vw, 1.5rem);
    font-weight: 800;
    color: var(--gold);
  }

  section {
    margin-bottom: 2.75rem;
  }

  section > p {
    margin: 0 0 0.9rem;
  }

  .dl-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    gap: 1rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .dl-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1.1rem 1.2rem;
    border: 1px solid rgb(148 163 184 / 0.35);
    border-radius: var(--radius-theme, 0.75rem);
  }

  .dl-card-mine {
    border-color: var(--gold);
    box-shadow: 0 0 0 1px var(--gold);
  }

  .dl-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .dl-card p {
    margin: 0;
    flex: 1;
    font-size: 0.95rem;
  }

  .dl-badge {
    flex-shrink: 0;
    padding: 0.1rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.78rem;
    font-weight: 700;
    background: rgb(148 163 184 / 0.2);
    color: var(--tm, #94a3b8);
  }

  .dl-badge-on {
    background: var(--barbi-pink);
    color: #fff;
  }

  .dl-card-link {
    align-self: flex-start;
    font-weight: 700;
    color: var(--gold);
  }

  .dl-steps {
    margin: 0 0 1rem;
    padding-inline-start: 1.5rem;
    list-style: decimal;
  }

  .dl-steps li {
    margin-bottom: 0.5rem;
  }

  .dl-note {
    padding: 0.75rem 1rem;
    border-inline-start: 4px solid var(--barbi-pink);
    background: rgb(148 163 184 / 0.1);
    font-size: 0.95rem;
  }

  .dl-release-notes {
    white-space: pre-line;
  }

  .dl-faq {
    border-bottom: 1px solid rgb(148 163 184 / 0.3);
    padding: 0.75rem 0;
  }

  .dl-faq summary {
    cursor: pointer;
    font-weight: 700;
  }

  .dl-faq p {
    margin: 0.5rem 0 0;
  }

  a {
    color: var(--gold);
  }
</style>
