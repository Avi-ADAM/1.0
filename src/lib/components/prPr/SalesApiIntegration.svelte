<script>
  // External Sales API integration panel (PLAN_EXTERNAL_SALES_API, Phase 2).
  // Lets a rikma member mint a rikma-scoped API key and copy ready-made
  // snippets + an AI-agent prompt for wiring their own shop to /api/v1/sales.
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { toast } from 'svelte-sonner';

  /**
   * @typedef {{ id: string | number, attributes: { name?: string } }} Product
   * @typedef {{ id: string | number, attributes: { username?: string } }} Member
   */

  let {
    /** @type {string} */ projectId,
    /** @type {Product[]} */ bmiData = [],
    /** @type {Member[]} */ projectUsers = []
  } = $props();

  // The literal closing script tag, split so it can't terminate THIS
  // component's <script> block when it appears inside the browser snippet.
  const CLOSE_SCRIPT = '<' + '/script>';

  let expanded = $state(false);

  /** @type {Array<{ id: string, name: string, key_prefix: string, revoked: boolean, lastUsedAt: string | null }>} */
  let keys = $state([]);
  let loadingKeys = $state(false);
  let creating = $state(false);
  /** raw key shown exactly once, right after creation */
  let newRawKey = $state('');

  let currentUserId = $state('');
  let selectedProductId = $state('');
  let selectedHolderId = $state('');
  let activeTab = $state('browser');
  /** @type {string} */
  let copiedWhat = $state('');

  const apiBase = $derived(browser ? window.location.origin : 'https://1lev1.com');

  const activeKey = $derived(keys.find((k) => !k.revoked) ?? null);
  const hasKey = $derived(!!activeKey || !!newRawKey);

  // Value used inside snippets: the real key right after creation, otherwise a
  // placeholder the user replaces with the key they saved.
  const keyForSnippet = $derived(newRawKey || '{{API_KEY}}');
  const productForSnippet = $derived(selectedProductId || '{{PRODUCT_ID}}');
  const holderForSnippet = $derived(selectedHolderId || '{{HOLDER_ID}}');

  onMount(async () => {
    if (browser) {
      const row = document.cookie.split('; ').find((r) => r.startsWith('id='));
      currentUserId = row ? row.split('=')[1] : '';
      if (currentUserId) selectedHolderId = currentUserId;
    }
    if (bmiData.length > 0) selectedProductId = String(bmiData[0].id);
    await loadKeys();
  });

  async function loadKeys() {
    loadingKeys = true;
    try {
      const res = await fetch(`/api/api-keys?projectId=${encodeURIComponent(projectId)}`);
      if (res.ok) keys = await res.json();
    } catch (e) {
      console.error('[SalesApiIntegration] load keys failed:', e);
    } finally {
      loadingKeys = false;
    }
  }

  async function createKey() {
    creating = true;
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b?.message || 'create failed');
      }
      const data = await res.json();
      newRawKey = data.raw;
      await loadKeys();
    } catch (e) {
      console.error('[SalesApiIntegration] create key failed:', e);
      toast.error($t('project.hamatanot.error'));
    } finally {
      creating = false;
    }
  }

  async function revokeKey() {
    if (!activeKey) return;
    if (browser && !confirm($t('project.hamatanot.api.revokeConfirm'))) return;
    try {
      const res = await fetch(`/api/api-keys?id=${activeKey.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('revoke failed');
      newRawKey = '';
      await loadKeys();
    } catch (e) {
      console.error('[SalesApiIntegration] revoke failed:', e);
      toast.error($t('project.hamatanot.error'));
    }
  }

  async function copy(text, what) {
    try {
      await navigator.clipboard.writeText(text);
      copiedWhat = what;
      setTimeout(() => {
        if (copiedWhat === what) copiedWhat = '';
      }, 2000);
    } catch {
      toast.error($t('project.hamatanot.error'));
    }
  }

  function formatDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString($lang === 'he' ? 'he-IL' : $lang);
    } catch {
      return iso;
    }
  }

  const browserSnippet = $derived(
    [
      '<script>',
      '  // 1lev1 — automatic sale report. Run after a successful checkout.',
      `  fetch('${apiBase}/api/v1/sales', {`,
      "    method: 'POST',",
      '    headers: {',
      "      'Content-Type': 'application/json',",
      `      'Authorization': 'Bearer ${keyForSnippet}'`,
      '    },',
      '    body: JSON.stringify({',
      `      productId: '${productForSnippet}',   // 1lev1 product`,
      `      holderUserId: '${holderForSnippet}', // who holds the money`,
      '      amount: ORDER_TOTAL,        // ← connect: amount paid',
      '      quantity: ORDER_QUANTITY,   // ← connect: units (default 1)',
      '      externalId: ORDER_ID        // ← connect: your order id',
      '    })',
      '  });',
      CLOSE_SCRIPT
    ].join('\n')
  );

  const serverSnippet = $derived(
    [
      `curl -X POST ${apiBase}/api/v1/sales \\`,
      `  -H "Authorization: Bearer ${keyForSnippet}" \\`,
      '  -H "Content-Type: application/json" \\',
      `  -d '{"productId":"${productForSnippet}","holderUserId":"${holderForSnippet}","amount":ORDER_TOTAL,"quantity":1,"externalId":"ORDER_ID"}'`
    ].join('\n')
  );

  const agentPrompt = $derived(
    `You are integrating my website with 1lev1's sales-reporting API. ` +
      `After every successful checkout/payment, send an HTTPS POST to ` +
      `${apiBase}/api/v1/sales with header ` +
      `Authorization: Bearer ${keyForSnippet} and JSON body: ` +
      `productId (fixed: ${productForSnippet}), holderUserId (fixed: ` +
      `${holderForSnippet}), amount (the total paid, number), quantity ` +
      `(units sold, default 1), externalId (my order id — required for ` +
      `retry-safety), and optionally saleDate (ISO, defaults to now) and ` +
      `startDate/finishDate for subscriptions. Fire it server-side if ` +
      `possible (payment webhook); browser-side from the thank-you page is ` +
      `acceptable. A 201 with {success:true} means reported; treat a ` +
      `repeated externalId returning duplicated:true as success. Do not ` +
      `block or fail the customer's checkout if this call fails — log and ` +
      `retry up to 3 times with backoff.`
  );

  const snippet = $derived(activeTab === 'browser' ? browserSnippet : serverSnippet);
</script>

<div class="sales-api" dir={$lang === 'ar' || $lang === 'he' ? 'rtl' : 'ltr'}>
  <button class="accordion-toggle" onclick={() => (expanded = !expanded)} type="button">
    <span>{expanded ? '▾' : '▸'}</span>
    <span>{$t('project.hamatanot.api.title')}</span>
  </button>

  {#if expanded}
    <div class="panel">
      <p class="subtitle">{$t('project.hamatanot.api.subtitle')}</p>

      <!-- 1. API key -->
      <section>
        <h4>{$t('project.hamatanot.api.keyTitle')}</h4>

        {#if newRawKey}
          <div class="new-key">
            <p class="warn">{$t('project.hamatanot.api.saveWarning')}</p>
            <div class="key-row">
              <code class="raw-key">{newRawKey}</code>
              <button type="button" onclick={() => copy(newRawKey, 'rawkey')}>
                {copiedWhat === 'rawkey'
                  ? $t('project.hamatanot.api.copied')
                  : $t('project.hamatanot.api.copy')}
              </button>
            </div>
          </div>
        {/if}

        {#if loadingKeys}
          <p class="muted">…</p>
        {:else if activeKey}
          <div class="key-active">
            <div>
              <span class="badge">{$t('project.hamatanot.api.keyActive')}</span>
              <code class="prefix">····{activeKey.key_prefix}</code>
            </div>
            <div class="key-meta">
              <span class="muted">
                {$t('project.hamatanot.api.lastUsed')}:
                {activeKey.lastUsedAt
                  ? formatDate(activeKey.lastUsedAt)
                  : $t('project.hamatanot.api.never')}
              </span>
              <button type="button" class="link-danger" onclick={revokeKey}>
                {$t('project.hamatanot.api.revoke')}
              </button>
            </div>
          </div>
        {:else if !newRawKey}
          <button type="button" class="primary" onclick={createKey} disabled={creating}>
            {creating
              ? $t('project.hamatanot.api.creating')
              : $t('project.hamatanot.api.createKey')}
          </button>
        {/if}
      </section>

      <!-- 2. Product + holder selection -->
      <section>
        <h4>{$t('project.hamatanot.api.selectTitle')}</h4>
        <div class="selects">
          <label>
            <span>{$t('project.hamatanot.api.product')}</span>
            <select bind:value={selectedProductId}>
              {#each bmiData as p (p.id)}
                <option value={String(p.id)}>{p.attributes?.name ?? `#${p.id}`}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>{$t('project.hamatanot.api.holder')}</span>
            <select bind:value={selectedHolderId}>
              {#each projectUsers as u (u.id)}
                <option value={String(u.id)}>
                  {u.attributes?.username ?? `#${u.id}`}{String(u.id) === currentUserId
                    ? ` (${$t('project.hamatanot.api.you')})`
                    : ''}
                </option>
              {/each}
            </select>
          </label>
        </div>
      </section>

      <!-- 3. Code snippet -->
      <section>
        <h4>{$t('project.hamatanot.api.codeTitle')}</h4>
        {#if !hasKey}
          <p class="muted">{$t('project.hamatanot.api.createKeyFirst')}</p>
        {/if}
        <div class="tabs">
          <button
            type="button"
            class:active={activeTab === 'browser'}
            onclick={() => (activeTab = 'browser')}
          >
            {$t('project.hamatanot.api.tabBrowser')}
          </button>
          <button
            type="button"
            class:active={activeTab === 'server'}
            onclick={() => (activeTab = 'server')}
          >
            {$t('project.hamatanot.api.tabServer')}
          </button>
        </div>
        {#if activeTab === 'server'}
          <p class="hint">{$t('project.hamatanot.api.serverHint')}</p>
        {/if}
        <div class="code-block">
          <button type="button" class="copy-btn" onclick={() => copy(snippet, 'snippet')}>
            {copiedWhat === 'snippet'
              ? $t('project.hamatanot.api.copied')
              : $t('project.hamatanot.api.copy')}
          </button>
          <pre><code>{snippet}</code></pre>
        </div>
      </section>

      <!-- 4. Variables table -->
      <section>
        <h4>{$t('project.hamatanot.api.varsTitle')}</h4>
        <table class="vars">
          <thead>
            <tr>
              <th>{$t('project.hamatanot.api.varField')}</th>
              <th>{$t('project.hamatanot.api.varDesc')}</th>
              <th>{$t('project.hamatanot.api.varStatus')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>productId</code></td>
              <td>{$t('project.hamatanot.api.varProductId')}</td>
              <td><span class="tag ok">{$t('project.hamatanot.api.prefilled')}</span></td>
            </tr>
            <tr>
              <td><code>holderUserId</code></td>
              <td>{$t('project.hamatanot.api.varHolderId')}</td>
              <td><span class="tag ok">{$t('project.hamatanot.api.prefilled')}</span></td>
            </tr>
            <tr>
              <td><code>amount</code></td>
              <td>{$t('project.hamatanot.api.varAmount')}</td>
              <td><span class="tag do">{$t('project.hamatanot.api.connectYours')}</span></td>
            </tr>
            <tr>
              <td><code>quantity</code></td>
              <td>{$t('project.hamatanot.api.varQuantity')}</td>
              <td><span class="tag do">{$t('project.hamatanot.api.connectYours')}</span></td>
            </tr>
            <tr>
              <td><code>externalId</code></td>
              <td>{$t('project.hamatanot.api.varExternalId')}</td>
              <td><span class="tag do">{$t('project.hamatanot.api.connectYours')}</span></td>
            </tr>
            <tr>
              <td><code>saleDate</code></td>
              <td>{$t('project.hamatanot.api.varSaleDate')}</td>
              <td><span class="tag opt">{$t('project.hamatanot.api.optional')}</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- 5. AI-agent prompt -->
      <section>
        <h4>{$t('project.hamatanot.api.agentTitle')}</h4>
        <p class="muted">{$t('project.hamatanot.api.agentSubtitle')}</p>
        <div class="code-block">
          <button type="button" class="copy-btn" onclick={() => copy(agentPrompt, 'prompt')}>
            {copiedWhat === 'prompt'
              ? $t('project.hamatanot.api.copied')
              : $t('project.hamatanot.api.copy')}
          </button>
          <textarea readonly rows="8">{agentPrompt}</textarea>
        </div>
      </section>
    </div>
  {/if}
</div>

<style>
  .sales-api {
    border: 1px solid var(--mtork, #d4af37);
    border-radius: 0.5rem;
    overflow: hidden;
    align-self: start;
  }
  .accordion-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--gold, #fff8e1);
    font-weight: 700;
    cursor: pointer;
    border: none;
    text-align: start;
  }
  .panel {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .subtitle {
    font-size: 0.9rem;
    opacity: 0.8;
    margin: 0;
  }
  section h4 {
    font-weight: 700;
    margin: 0 0 0.5rem;
  }
  .muted {
    font-size: 0.85rem;
    opacity: 0.65;
  }
  .warn {
    color: #b45309;
    font-size: 0.85rem;
    margin: 0 0 0.5rem;
  }
  .hint {
    font-size: 0.85rem;
    opacity: 0.75;
    margin: 0.25rem 0;
  }
  button.primary,
  .accordion-toggle {
    color: inherit;
  }
  button.primary {
    background: var(--barbi, #e91e8c);
    color: #fff;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    cursor: pointer;
  }
  button.primary:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .key-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .raw-key {
    flex: 1;
    min-width: 12rem;
    word-break: break-all;
    background: #f3f4f6;
    padding: 0.4rem 0.6rem;
    border-radius: 0.375rem;
    font-size: 0.8rem;
  }
  .new-key {
    border: 1px solid #fcd34d;
    background: #fffbeb;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 0.75rem;
  }
  .key-active {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .key-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .badge {
    background: #dcfce7;
    color: #166534;
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
  }
  .prefix {
    font-family: monospace;
    opacity: 0.7;
  }
  .link-danger {
    background: none;
    border: none;
    color: #dc2626;
    cursor: pointer;
    text-decoration: underline;
    font-size: 0.8rem;
  }
  .selects {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .selects label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.85rem;
    flex: 1;
    min-width: 10rem;
  }
  .selects select {
    padding: 0.4rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
  }
  .tabs {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 0.5rem;
  }
  .tabs button {
    padding: 0.35rem 0.9rem;
    border: 1px solid #d1d5db;
    background: #f9fafb;
    cursor: pointer;
    border-radius: 0.375rem;
    font-size: 0.85rem;
  }
  .tabs button.active {
    background: var(--barbi, #e91e8c);
    color: #fff;
    border-color: var(--barbi, #e91e8c);
  }
  .code-block {
    position: relative;
  }
  .code-block pre,
  .code-block textarea {
    background: #1e293b;
    color: #e2e8f0;
    padding: 0.75rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    font-size: 0.78rem;
    width: 100%;
    box-sizing: border-box;
    font-family: monospace;
    direction: ltr;
    text-align: left;
  }
  .code-block textarea {
    resize: vertical;
    border: none;
  }
  .copy-btn {
    position: absolute;
    top: 0.4rem;
    inset-inline-end: 0.4rem;
    z-index: 1;
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    border: none;
    padding: 0.2rem 0.6rem;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.75rem;
  }
  table.vars {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.82rem;
  }
  table.vars th,
  table.vars td {
    border: 1px solid #e5e7eb;
    padding: 0.4rem 0.5rem;
    text-align: start;
  }
  table.vars code {
    background: #f3f4f6;
    padding: 0.1rem 0.3rem;
    border-radius: 0.25rem;
  }
  .tag {
    font-size: 0.72rem;
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    white-space: nowrap;
  }
  .tag.ok {
    background: #dcfce7;
    color: #166534;
  }
  .tag.do {
    background: #fef3c7;
    color: #92400e;
  }
  .tag.opt {
    background: #e5e7eb;
    color: #374151;
  }
</style>
