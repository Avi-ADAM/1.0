<!--
  /mcp - the public copy of the "connect your AI agent" guide, plus the tool
  reference.

  The same McpGuide that lives behind login at /me/settings/mcp, opened to
  guests because it is the documentation URL of the Claude Directory listing:
  users and IT admins read it before approving the connector, without an
  account. Keep the guide itself free of per-user data so both routes can
  render it.

  Below it, first the tools that answer with no account (getPlatformInfo,
  prepareSignup — $lib/server/mcp/publicTools), then every tool an
  authenticated key sees, read from the manifest by the loader. Each tool's MCP
  description links to its anchor here (`#<toolName>`), and the key-repair
  tools link to `#connect` — keep those ids stable.
-->
<script>
  import McpGuide from '$lib/components/me/McpGuide.svelte';
  import { t, isRtl } from '$lib/translations';

  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();

  const TIERS = ['read', 'prepare', 'selfWrite', 'consentWrite', 'communicate', 'sharedWrite'];

  let groups = $derived(
    TIERS.map((tier) => ({ tier, tools: data.tools.filter((tool) => tool.tier === tier) })).filter(
      (g) => g.tools.length > 0
    )
  );
</script>

{#snippet toolCard(/** @type {import('./+page.server').ToolDoc} */ tool)}
  <article id={tool.name} class="ref-tool">
    <header>
      <h4><a href={`#${tool.name}`} dir="ltr"><code>{tool.name}</code></a></h4>
      <span class="ref-title" dir="ltr">{tool.title}</span>
    </header>

    <ul class="ref-badges">
      {#if tool.readOnly}
        <li class="ok">{$t('mcp.ref.badge.readOnly')}</li>
      {:else}
        <li>{$t('mcp.ref.badge.writes')}</li>
      {/if}
      {#if tool.destructive}<li class="warn">{$t('mcp.ref.badge.destructive')}</li>{/if}
      {#if tool.membersOnly}<li>{$t('mcp.ref.badge.members')}</li>{/if}
      {#if tool.needsScope}<li class="warn">{$t('mcp.ref.badge.scope', { scope: tool.needsScope })}</li>{/if}
    </ul>

    <p class="ref-desc" dir="ltr">{tool.description}</p>

    <h5>{$t('mcp.ref.inputs')}</h5>
    {#if tool.inputs.length === 0}
      <p class="ref-none">{$t('mcp.ref.noInputs')}</p>
    {:else}
      <dl class="ref-inputs" dir="ltr">
        {#each tool.inputs as input (input.name)}
          <div>
            <dt>
              <code>{input.name}</code>
              <span class="ref-type">{input.type}</span>
              <span class="ref-req">{input.required ? $t('mcp.ref.required') : $t('mcp.ref.optional')}</span>
            </dt>
            {#if input.description}<dd>{input.description}</dd>{/if}
          </div>
        {/each}
      </dl>
    {/if}
  </article>
{/snippet}

<svelte:head>
  <title>{$t('mcp.ref.metaTitle')}</title>
  <meta name="description" content={$t('mcp.ref.metaDescription')} />
  <meta property="og:title" content={$t('mcp.ref.metaTitle')} />
  <meta property="og:description" content={$t('mcp.ref.metaDescription')} />
  <link rel="canonical" href="https://1lev1.com/mcp" />
</svelte:head>

<main class="min-h-screen w-full mx-auto max-w-3xl p-4 md:p-8" dir={$isRtl ? 'rtl' : 'ltr'}>
  <section id="connect">
    <McpGuide />
  </section>

  <section id="tools" class="ref" aria-labelledby="ref-title">
    <p class="ref-eyebrow">{$t('mcp.ref.eyebrow')}</p>
    <h2 id="ref-title">{$t('mcp.ref.title')}</h2>
    <p>{$t('mcp.ref.intro')}</p>
    <p><a href="/privacy#agents">{$t('mcp.ref.privacy')}</a></p>

    <nav class="ref-toc" aria-label={$t('mcp.ref.jump')}>
      {#if data.noAccount.length > 0}
        <a href="#tier-noAccount">{$t('mcp.ref.tier.noAccount.name')} ({data.noAccount.length})</a>
      {/if}
      {#each groups as g (g.tier)}
        <a href={`#tier-${g.tier}`}>{$t(`mcp.ref.tier.${g.tier}.name`)} ({g.tools.length})</a>
      {/each}
    </nav>

    <!-- Answer before anyone signs in; every other tool asks the person to connect first. -->
    {#if data.noAccount.length > 0}
      <section id="tier-noAccount" class="ref-group" aria-labelledby="tier-noAccount-h">
        <h3 id="tier-noAccount-h">{$t('mcp.ref.tier.noAccount.name')}</h3>
        <p class="ref-tierdesc">{$t('mcp.ref.tier.noAccount.desc')}</p>
        {#each data.noAccount as tool (tool.name)}
          {@render toolCard(tool)}
        {/each}
      </section>
    {/if}

    {#each groups as g (g.tier)}
      <section id={`tier-${g.tier}`} class="ref-group" aria-labelledby={`tier-${g.tier}-h`}>
        <h3 id={`tier-${g.tier}-h`}>{$t(`mcp.ref.tier.${g.tier}.name`)}</h3>
        <p class="ref-tierdesc">{$t(`mcp.ref.tier.${g.tier}.desc`)}</p>

        {#each g.tools as tool (tool.name)}
          {@render toolCard(tool)}
        {/each}
      </section>
    {/each}
  </section>

  <p class="mt-10 text-sm">
    <a href="/privacy" class="text-goldink hover:underline">{$t('common.footer.privacy')}</a>
  </p>
</main>

<style>
  .ref {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--gold);
    line-height: 1.7;
  }

  .ref-eyebrow {
    margin: 0 0 0.25rem;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--barbi-pink);
  }

  h2 {
    margin: 0 0 0.75rem;
    font-size: clamp(1.4rem, 4vw, 1.9rem);
    font-weight: 800;
    color: var(--gold);
  }

  h3 {
    margin: 0 0 0.25rem;
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--gold);
  }

  h4 {
    margin: 0;
    font-size: 1rem;
    overflow-wrap: anywhere;
  }

  h5 {
    margin: 0.75rem 0 0.25rem;
    font-size: 0.85rem;
    font-weight: 700;
  }

  .ref p {
    margin: 0 0 0.75rem;
  }

  .ref a {
    color: var(--gold);
    text-decoration: underline;
  }

  .ref-toc {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    margin: 1rem 0 2rem;
    font-size: 0.9rem;
  }

  .ref-group {
    margin-bottom: 2.5rem;
  }

  .ref-tierdesc {
    color: var(--tm, #94a3b8);
  }

  .ref-tool {
    margin: 1rem 0;
    padding: 1rem;
    border: 1px solid color-mix(in srgb, var(--gold) 40%, transparent);
    border-radius: var(--radius-theme, 0.75rem);
    scroll-margin-top: 5rem;
  }

  .ref-tool header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.25rem 0.75rem;
  }

  .ref-tool h4 a {
    text-decoration: none;
  }

  .ref-title {
    font-size: 0.9rem;
    color: var(--tm, #94a3b8);
  }

  .ref-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin: 0.5rem 0;
    padding: 0;
    list-style: none;
    font-size: 0.75rem;
  }

  .ref-badges li {
    padding: 0.1rem 0.5rem;
    border: 1px solid currentColor;
    border-radius: 999px;
  }

  .ref-badges .ok {
    color: #15803d;
  }

  .ref-badges .warn {
    color: #b45309;
  }

  .ref-desc {
    font-size: 0.92rem;
    white-space: pre-line;
    text-align: start;
  }

  .ref-none {
    font-size: 0.85rem;
    color: var(--tm, #94a3b8);
  }

  .ref-inputs {
    margin: 0;
    font-size: 0.85rem;
  }

  .ref-inputs > div {
    padding: 0.35rem 0;
    border-top: 1px dashed color-mix(in srgb, var(--gold) 30%, transparent);
  }

  .ref-inputs dt {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: baseline;
  }

  .ref-type {
    font-family: ui-monospace, monospace;
    overflow-wrap: anywhere;
    color: var(--tm, #94a3b8);
  }

  .ref-req {
    font-size: 0.75rem;
    color: var(--tm, #94a3b8);
  }

  .ref-inputs dd {
    margin: 0.15rem 0 0;
  }
</style>
