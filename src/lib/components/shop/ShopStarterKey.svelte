<script lang="ts">
  /**
   * The starter shop's key (PLAN_SHOP_CUSTOMER_EXPERIENCE §7.4), minted in one
   * click with exactly what the starter's server needs — `orders:create` +
   * `orders:read` — instead of sending the member to the API page to tick the
   * right boxes. Shown together with the rikma address, since those are the two
   * values the Vercel deploy asks for (LEV_RIKMA_URL / LEV_ORDERS_KEY).
   *
   * The key has its own name, so re-creating it replaces only this key and never
   * the sales-report key or a key another system holds.
   */
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { toast } from 'svelte-sonner';
  import { t } from '$lib/translations';

  let {
    projectId,
    rikmaUrl,
    /** Bound by the page, so its Deploy button can carry the key into Vercel's form. */
    rawKey = $bindable('')
  }: { projectId: string; rikmaUrl: string; rawKey?: string } = $props();

  const KEY_NAME = 'shop-starter';
  const KEY_SCOPES = ['orders:create', 'orders:read'];

  type KeyRow = { id: string; name: string; key_prefix: string; revoked: boolean; scopes: string[] };

  let keys = $state<KeyRow[]>([]);
  let loading = $state(true);
  let creating = $state(false);
  let copiedWhat = $state('');

  const shopKey = $derived(
    keys.find((k) => !k.revoked && KEY_SCOPES.every((s) => k.scopes?.includes(s))) ?? null
  );

  onMount(loadKeys);

  async function loadKeys() {
    loading = true;
    try {
      const res = await fetch(`/api/api-keys?projectId=${encodeURIComponent(projectId)}`);
      if (res.ok) keys = await res.json();
    } catch (e) {
      console.error('[ShopStarterKey] load keys failed:', e);
    } finally {
      loading = false;
    }
  }

  async function createKey() {
    if (shopKey && browser && !confirm($t('shop.connect.starterReplaceConfirm'))) return;
    creating = true;
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, name: KEY_NAME, scopes: KEY_SCOPES })
      });
      if (!res.ok) throw new Error(`create failed: ${res.status}`);
      rawKey = (await res.json()).raw;
      await loadKeys();
    } catch (e) {
      console.error('[ShopStarterKey] create key failed:', e);
      toast.error($t('shop.connect.starterKeyError'));
    } finally {
      creating = false;
    }
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      copiedWhat = what;
      setTimeout(() => {
        if (copiedWhat === what) copiedWhat = '';
      }, 2000);
    } catch {
      toast.error($t('shop.connect.starterKeyError'));
    }
  }
</script>

<div class="sk">
  {#if rawKey}
    <p class="sk-warn">{$t('shop.connect.starterSaveWarning')}</p>
  {/if}

  <p class="sk-hint">{$t('shop.connect.starterEnvHint')}</p>
  <dl class="sk-env">
    <dt><code>LEV_RIKMA_URL</code></dt>
    <dd>
      <code class="sk-val">{rikmaUrl}</code>
      <button type="button" class="sh-btn sh-btn-quiet sk-copy" onclick={() => copy(rikmaUrl, 'url')}>
        {copiedWhat === 'url' ? $t('shop.connect.copied') : $t('shop.connect.copy')}
      </button>
    </dd>
    <dt><code>LEV_ORDERS_KEY</code></dt>
    <dd>
      {#if rawKey}
        <code class="sk-val">{rawKey}</code>
        <button type="button" class="sh-btn sh-btn-quiet sk-copy" onclick={() => copy(rawKey, 'key')}>
          {copiedWhat === 'key' ? $t('shop.connect.copied') : $t('shop.connect.copy')}
        </button>
      {:else if loading}
        <span class="sk-muted">…</span>
      {:else if shopKey}
        <span class="sh-chip sh-chip-ok">{$t('shop.connect.starterKeyActive')}</span>
        <code class="sk-prefix">····{shopKey.key_prefix}</code>
        <button type="button" class="sk-link" onclick={createKey} disabled={creating}>
          {$t('shop.connect.starterReplaceKey')}
        </button>
      {:else}
        <button type="button" class="sh-btn sh-btn-primary" onclick={createKey} disabled={creating}>
          {creating ? $t('shop.connect.starterCreating') : $t('shop.connect.starterCreateKey')}
        </button>
      {/if}
    </dd>
  </dl>
  <p class="sk-muted">{$t('shop.connect.starterKeyScopes')}</p>
</div>

<style>
  .sk {
    text-align: start;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sk-hint {
    font-size: 14px;
    line-height: 1.5;
  }
  .sk-warn {
    font-size: 13px;
    font-weight: 700;
    padding: 8px 10px;
    border-radius: var(--sh-radius-sm);
    background: var(--sh-warn-tint);
    border: 1px solid var(--sh-warn-line);
    color: var(--sh-ink);
  }
  .sk-env {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
    margin: 0;
  }
  .sk-env dt {
    font-size: 12px;
    color: var(--sh-muted);
    margin-top: 6px;
  }
  .sk-env dd {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .sk-val {
    flex: 1 1 14rem;
    min-width: 0;
    word-break: break-all;
    direction: ltr;
    text-align: left;
    font-family: var(--sh-mono);
    font-size: 12px;
    padding: 8px 10px;
    border-radius: var(--sh-radius-xs);
    background: var(--sh-card-2);
    border: 1px solid var(--sh-line);
    color: var(--sh-ink);
  }
  .sk-copy {
    min-height: 36px;
    padding: 0 12px;
    font-size: 13px;
  }
  .sk-prefix {
    font-family: var(--sh-mono);
    font-size: 12px;
    color: var(--sh-muted);
    direction: ltr;
  }
  .sk-link {
    background: none;
    border: none;
    padding: 0;
    font-size: 13px;
    text-decoration: underline;
    color: var(--sh-accent-ink);
    cursor: pointer;
  }
  .sk-muted {
    font-size: 13px;
    line-height: 1.5;
    color: var(--sh-muted);
  }
</style>
