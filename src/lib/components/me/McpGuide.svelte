<script>
  // The "connect your AI agent" guide (docs/PLAN_MCP_SKILL.md).
  //
  // Two audiences on one page: someone who has never heard of MCP and needs to
  // know what they are switching on, and someone who just wants the command.
  // The command comes first for that reason; the explanation sits under it.
  import { t, isRtl } from '$lib/translations';
  import { toast } from 'svelte-sonner';

  const CONNECT_CMD = 'npx 1lev1-mcp';
  const REMOVE_CMD = 'npx 1lev1-mcp remove';
  const MARKETPLACE_CMD = '/plugin marketplace add Avi-ADAM/1lev1-agent';
  const INSTALL_CMD = '/plugin install 1lev1@1lev1';
  const ENDPOINT = 'https://api.1lev1.com/api/mcp';

  const MANUAL_SNIPPET = `{
  "mcpServers": {
    "1lev1-mcp": {
      "type": "http",
      "url": "${ENDPOINT}",
      "headers": { "Authorization": "Bearer 1lev1_..." }
    }
  }
}`;

  const EXAMPLE_KEYS = ['ex1', 'ex2', 'ex3', 'ex4', 'ex5', 'ex6'];
  const BOUNDARY_KEYS = ['boundary1', 'boundary2', 'boundary3', 'boundary4'];

  /** Which snippet is currently showing its "copied" state. */
  let copiedKey = $state('');

  async function copy(text, key) {
    try {
      await navigator.clipboard.writeText(text);
      copiedKey = key;
      toast.success($t('mcp.copied'));
      setTimeout(() => {
        if (copiedKey === key) copiedKey = '';
      }, 2000);
    } catch {
      // A denied clipboard permission is not worth an error toast — the text
      // is on screen and selectable either way.
    }
  }
</script>

<div class="mcp-guide" dir={$isRtl ? 'rtl' : 'ltr'}>
  <header class="intro">
    <h2>{$t('mcp.title')}</h2>
    <p>{$t('mcp.subtitle')}</p>
  </header>

  <section>
    <h3>{$t('mcp.quickTitle')}</h3>
    <p class="body">{$t('mcp.quickBody')}</p>
    <div class="cmd">
      <code>{CONNECT_CMD}</code>
      <button type="button" onclick={() => copy(CONNECT_CMD, 'connect')}>
        {copiedKey === 'connect' ? $t('mcp.copied') : $t('mcp.copy')}
      </button>
    </div>
    <p class="hint">{$t('mcp.quickNote')}</p>
  </section>

  <section>
    <h3>{$t('mcp.pluginTitle')}</h3>
    <p class="body">{$t('mcp.pluginBody')}</p>
    <div class="cmd">
      <code>{MARKETPLACE_CMD}</code>
      <button type="button" onclick={() => copy(MARKETPLACE_CMD, 'market')}>
        {copiedKey === 'market' ? $t('mcp.copied') : $t('mcp.copy')}
      </button>
    </div>
    <div class="cmd">
      <code>{INSTALL_CMD}</code>
      <button type="button" onclick={() => copy(INSTALL_CMD, 'install')}>
        {copiedKey === 'install' ? $t('mcp.copied') : $t('mcp.copy')}
      </button>
    </div>
    <p class="hint">{$t('mcp.pluginNote')}</p>
  </section>

  <section>
    <h3>{$t('mcp.examplesTitle')}</h3>
    <ul class="examples">
      {#each EXAMPLE_KEYS as key (key)}
        <li>{$t(`mcp.${key}`)}</li>
      {/each}
    </ul>
  </section>

  <section class="boundary">
    <h3>{$t('mcp.boundaryTitle')}</h3>
    <p class="body">{$t('mcp.boundaryBody')}</p>
    <ul class="bullets">
      {#each BOUNDARY_KEYS as key (key)}
        <li>{$t(`mcp.${key}`)}</li>
      {/each}
    </ul>
  </section>

  <section>
    <h3>{$t('mcp.whatTitle')}</h3>
    <p class="body">{$t('mcp.whatBody')}</p>
  </section>

  <section>
    <h3>{$t('mcp.agentsTitle')}</h3>
    <p class="body">{$t('mcp.agentsBody')}</p>
  </section>

  <section>
    <h3>{$t('mcp.manualTitle')}</h3>
    <p class="body">{$t('mcp.manualBody')}</p>
    <p class="label">{$t('mcp.endpointLabel')}</p>
    <div class="cmd">
      <code>{ENDPOINT}</code>
      <button type="button" onclick={() => copy(ENDPOINT, 'endpoint')}>
        {copiedKey === 'endpoint' ? $t('mcp.copied') : $t('mcp.copy')}
      </button>
    </div>
    <div class="snippet">
      <pre dir="ltr"><code>{MANUAL_SNIPPET}</code></pre>
      <button type="button" onclick={() => copy(MANUAL_SNIPPET, 'snippet')}>
        {copiedKey === 'snippet' ? $t('mcp.copied') : $t('mcp.copy')}
      </button>
    </div>
  </section>

  <section>
    <h3>{$t('mcp.securityTitle')}</h3>
    <ul class="bullets">
      <li>{$t('mcp.security1')}</li>
      <li>{$t('mcp.security2')}</li>
    </ul>
    <p class="body">{$t('mcp.security3')}</p>
    <div class="cmd">
      <code>{REMOVE_CMD}</code>
      <button type="button" onclick={() => copy(REMOVE_CMD, 'remove')}>
        {copiedKey === 'remove' ? $t('mcp.copied') : $t('mcp.copy')}
      </button>
    </div>
    <p class="hint">{$t('mcp.security4')}</p>
  </section>
</div>

<style>
  .mcp-guide {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .intro h2 {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--goldink, #8a6a15);
    margin: 0 0 0.25rem;
  }
  .intro p {
    margin: 0.25rem 0;
    font-size: 0.9rem;
    opacity: 0.85;
  }
  section {
    border: 1px solid rgba(212, 175, 55, 0.35);
    border-radius: 0.75rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  section h3 {
    font-weight: 800;
    font-size: 1.1rem;
    margin: 0;
    color: var(--goldink, #8a6a15);
  }
  .body {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.6;
    opacity: 0.9;
  }
  .hint {
    font-size: 0.82rem;
    opacity: 0.75;
    margin: 0;
  }
  .label {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 700;
    opacity: 0.9;
  }

  /* A command line: the text stays LTR and scrolls on its own so a long
     command never widens the page on a phone. */
  .cmd {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 0.5rem;
    padding: 0.5rem 0.65rem;
  }
  .cmd code {
    direction: ltr;
    unicode-bidi: isolate;
    flex: 1;
    overflow-x: auto;
    white-space: nowrap;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.85rem;
    color: var(--goldink, #8a6a15);
  }
  .cmd button,
  .snippet button {
    flex-shrink: 0;
    border: 1px solid rgba(212, 175, 55, 0.45);
    background: transparent;
    color: var(--goldink, #8a6a15);
    border-radius: 0.4rem;
    padding: 0.25rem 0.6rem;
    font-size: 0.78rem;
    cursor: pointer;
  }
  .cmd button:hover,
  .snippet button:hover {
    background: rgba(212, 175, 55, 0.12);
  }

  .snippet {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
  .snippet pre {
    width: 100%;
    margin: 0;
    overflow-x: auto;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 0.5rem;
    padding: 0.75rem;
    font-size: 0.8rem;
    line-height: 1.5;
  }

  .examples {
    margin: 0;
    padding-inline-start: 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .examples li {
    font-size: 0.9rem;
    font-style: italic;
    opacity: 0.9;
  }
  .bullets {
    margin: 0;
    padding-inline-start: 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .bullets li {
    font-size: 0.88rem;
    line-height: 1.5;
    opacity: 0.9;
  }

  /* The consent boundary is the part people skip and then complain about, so
     it gets the same left rule the rikma API page uses for its consent note. */
  .boundary {
    border-inline-start: 3px solid var(--gold, #d4af37);
  }
</style>
