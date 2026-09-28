<!--
  /privacy - the privacy policy.

  Required for the Claude Directory listing of the MCP connector, and linked
  from the guest menu. Kept strictly factual: every provider and every stored
  field named here is one the code actually uses (hosting, Zoho SMTP, Firebase
  messaging, the AI model providers in src/mastra/lib/createModel.ts, Vercel
  Analytics, the MCP audit line in src/lib/server/mcp/audit.ts). Adding a new
  third party means adding it to `share.li3` in all five locales.

  The `agents` section is the part a directory reviewer reads first: what an
  AI assistant connected over MCP can see, what we log, and how to disconnect.
-->
<script>
  import { t, isRtl } from '$lib/translations';

  /** Each section: its key, how many list items, and which paragraphs come before / after the list. */
  const SECTIONS = [
    { id: 'who', before: ['p1', 'p2'] },
    { id: 'collect', items: 6 },
    { id: 'agents', before: ['p1'], items: 5, after: ['p2'] },
    { id: 'use', items: 5, after: ['p1'] },
    { id: 'share', items: 3, after: ['p1'] },
    { id: 'cookies', before: ['p1', 'p2'] },
    { id: 'keep', before: ['p1', 'p2', 'p3'] },
    { id: 'security', before: ['p1', 'p2'] },
    { id: 'rights', items: 4, after: ['p1'] },
    { id: 'changes', before: ['p1'] }
  ];

  const range = (n = 0) => Array.from({ length: n }, (_, i) => `li${i + 1}`);
  const SHORT = range(5);
</script>

<svelte:head>
  <title>{$t('privacy.meta.title')}</title>
  <meta name="description" content={$t('privacy.meta.description')} />
  <meta property="og:title" content={$t('privacy.meta.title')} />
  <meta property="og:description" content={$t('privacy.meta.description')} />
  <link rel="canonical" href="https://1lev1.com/privacy" />
</svelte:head>

<article class="pv-wrap" dir={$isRtl ? 'rtl' : 'ltr'}>
  <header class="pv-hero">
    <p class="pv-eyebrow">{$t('privacy.hero.eyebrow')}</p>
    <h1>{$t('privacy.hero.title')}</h1>
    <p class="pv-updated">{$t('privacy.hero.updated')}</p>
    <p class="pv-lede">{$t('privacy.hero.lede')}</p>
  </header>

  <section class="pv-short" aria-labelledby="pv-short">
    <h2 id="pv-short">{$t('privacy.short.title')}</h2>
    <ul>
      {#each SHORT as li (li)}
        <li>{$t(`privacy.short.${li}`)}</li>
      {/each}
    </ul>
  </section>

  {#each SECTIONS as s (s.id)}
    <section id={s.id} aria-labelledby={`pv-${s.id}`}>
      <h2 id={`pv-${s.id}`}>{$t(`privacy.${s.id}.title`)}</h2>
      {#each s.before ?? [] as p (p)}
        <p>{$t(`privacy.${s.id}.${p}`)}</p>
      {/each}
      {#if s.items}
        <ul>
          {#each range(s.items) as li (li)}
            <li>{$t(`privacy.${s.id}.${li}`)}</li>
          {/each}
        </ul>
      {/if}
      {#each s.after ?? [] as p (p)}
        <p>{$t(`privacy.${s.id}.${p}`)}</p>
      {/each}
    </section>
  {/each}

  <section id="contact" aria-labelledby="pv-contact">
    <h2 id="pv-contact">{$t('privacy.contact.title')}</h2>
    <p>
      {$t('privacy.contact.p1')}
      <a href="mailto:notifications@1lev1.com" dir="ltr">{$t('privacy.contact.email')}</a>
    </p>
  </section>
</article>

<style>
  .pv-wrap {
    max-width: 46rem;
    margin: 0 auto;
    padding: 3rem 1.25rem 5rem;
    color: var(--text);
    font-size: 1.02rem;
    line-height: 1.8;
  }

  .pv-hero {
    margin-bottom: 2.5rem;
  }

  .pv-eyebrow {
    margin: 0 0 0.5rem;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--barbi-pink);
  }

  h1 {
    margin: 0 0 0.5rem;
    font-size: clamp(1.7rem, 5vw, 2.4rem);
    font-weight: 800;
    line-height: 1.25;
    color: var(--gold);
  }

  .pv-updated {
    margin: 0 0 1.25rem;
    font-size: 0.9rem;
    color: var(--tm, #94a3b8);
  }

  .pv-lede {
    margin: 0;
    font-size: 1.12rem;
  }

  h2 {
    margin: 0 0 0.75rem;
    font-size: clamp(1.2rem, 3vw, 1.45rem);
    font-weight: 800;
    line-height: 1.35;
    color: var(--gold);
  }

  section {
    margin-bottom: 2.25rem;
  }

  p {
    margin: 0 0 0.9rem;
  }

  ul {
    margin: 0 0 0.9rem;
    padding-inline-start: 1.25rem;
    list-style: disc;
  }

  li {
    margin-bottom: 0.5rem;
  }

  .pv-short {
    padding: 1.25rem 1.25rem 0.5rem;
    border: 1px solid var(--gold);
    border-radius: var(--radius-theme, 0.75rem);
  }

  a {
    color: var(--gold);
    text-decoration: underline;
  }
</style>
