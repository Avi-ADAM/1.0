<script lang="ts">
  /**
   * The rikma's E2E password vault (PLAN_RIKMA_SHARED_INFO §3.2 / §5, stage 3).
   *
   * Secrets live as sealed events in the `vault:<pid>` space; the server and
   * the relay only ever see ciphertext. The panel walks the four states of
   * VaultSession: off (any member turns it on), locked (this device waits for
   * a member to share the key — automatic on their next visit), open, error.
   * After someone leaves, the secrets they could read are listed for changing:
   * encryption cannot unshare the past, so the page says what to rotate by hand.
   */
  import { untrack } from 'svelte';
  import { t } from '$lib/translations';
  import { VaultSession } from '$lib/vault/vault.svelte';
  import { VAULT_LIMITS, type VaultItem, type VaultItemInput } from '$lib/vault/items';

  let {
    projectId,
    userId,
    memberIds
  }: { projectId: string; userId: string; memberIds: string[] } = $props();

  let session = $derived(new VaultSession(projectId, userId, memberIds));
  // start() touches replica state synchronously (hydrate/sync status) — keep
  // those writes out of this effect's dependencies, as the P2P pilot does.
  $effect(() => {
    const s = session;
    return untrack(() => s.start());
  });

  // Editing: null = closed, '' = a new item, id = that item.
  let editing = $state<string | null>(null);
  let form = $state<VaultItemInput>({ name: '', secret: '' });
  let showSecret = $state(false);
  let revealed = $state<Set<string>>(new Set());
  let copied = $state('');
  let message = $state('');

  function openForm(item?: VaultItem) {
    editing = item?.id ?? '';
    form = item
      ? { name: item.name, username: item.username ?? '', secret: item.secret, url: item.url ?? '', note: item.note ?? '' }
      : { name: '', username: '', secret: '', url: '', note: '' };
    showSecret = false;
    message = '';
  }

  function generate() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*-_';
    const bytes = crypto.getRandomValues(new Uint8Array(20));
    form.secret = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
    showSecret = true;
  }

  async function save(e: SubmitEvent) {
    e.preventDefault();
    const res = await session.save(form, editing || undefined);
    if (res.ok) {
      editing = null;
      message = '';
    } else {
      message = $t('rikmaDocs.vault.error', { reason: res.reason ?? '' });
    }
  }

  async function remove(item: VaultItem) {
    if (!confirm($t('rikmaDocs.vault.removeConfirm', { name: item.name }))) return;
    const res = await session.remove(item.id);
    if (!res.ok) message = $t('rikmaDocs.vault.error', { reason: res.reason ?? '' });
  }

  async function enable() {
    const res = await session.enable();
    if (!res.ok) message = $t('rikmaDocs.vault.error', { reason: res.reason ?? '' });
  }

  function toggleReveal(id: string) {
    const next = new Set(revealed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    revealed = next;
  }

  async function copy(item: VaultItem) {
    try {
      await navigator.clipboard.writeText(item.secret);
      copied = item.id;
      // Don't leave a password sitting in the clipboard.
      setTimeout(async () => {
        try {
          if ((await navigator.clipboard.readText()) === item.secret) await navigator.clipboard.writeText('');
        } catch {
          /* reading the clipboard back needs permission; best effort */
        }
        if (copied === item.id) copied = '';
      }, 30_000);
    } catch {
      message = $t('rikmaDocs.vault.copyFailed');
    }
  }
</script>

<section class="vault" aria-labelledby="vault-title">
  <header class="v-head">
    <h3 id="vault-title">🔒 {$t('rikmaDocs.vault.title')}</h3>
    {#if session.status === 'open' && editing === null}
      <button type="button" class="v-add" onclick={() => openForm()}>+ {$t('rikmaDocs.vault.add')}</button>
    {/if}
  </header>
  <p class="v-note">{$t('rikmaDocs.vault.honest')}</p>

  {#if session.status === 'loading'}
    <p class="v-muted">{$t('rikmaDocs.vault.loading')}</p>
  {:else if session.status === 'off'}
    <p>{$t('rikmaDocs.vault.offDesc')}</p>
    <button type="button" class="v-primary" disabled={session.busy} onclick={enable}>
      {$t('rikmaDocs.vault.enable')}
    </button>
  {:else if session.status === 'locked'}
    <p class="v-muted">{$t('rikmaDocs.vault.locked')}</p>
    <button type="button" class="v-ghost" disabled={session.busy} onclick={() => session.refresh()}>
      {$t('rikmaDocs.vault.retry')}
    </button>
  {:else if session.status === 'error'}
    <p class="v-warn" role="alert">{$t('rikmaDocs.vault.error', { reason: session.reason })}</p>
    <button type="button" class="v-ghost" onclick={() => session.refresh()}>{$t('rikmaDocs.vault.retry')}</button>
  {:else}
    {#if session.exposed.length > 0}
      <div class="v-warn" role="alert">
        <strong>{$t('rikmaDocs.vault.exposedTitle')}</strong>
        <p>{$t('rikmaDocs.vault.exposedDesc')}</p>
        <ul>
          {#each session.exposed as item (item.id)}<li>{item.name}</li>{/each}
        </ul>
      </div>
    {/if}

    {#if editing !== null}
      <form class="v-form" onsubmit={save}>
        <label>
          <span>{$t('rikmaDocs.vault.name')} <em>*</em></span>
          <input bind:value={form.name} required maxlength={VAULT_LIMITS.name} dir="auto" />
        </label>
        <label>
          <span>{$t('rikmaDocs.vault.username')}</span>
          <input bind:value={form.username} maxlength={VAULT_LIMITS.username} dir="ltr" autocomplete="off" />
        </label>
        <label>
          <span>{$t('rikmaDocs.vault.secret')} <em>*</em></span>
          <span class="v-row">
            <input
              bind:value={form.secret}
              type={showSecret ? 'text' : 'password'}
              required
              maxlength={VAULT_LIMITS.secret}
              dir="ltr"
              autocomplete="new-password"
            />
            <button type="button" class="v-ghost" onclick={() => (showSecret = !showSecret)}>
              {showSecret ? $t('rikmaDocs.vault.hide') : $t('rikmaDocs.vault.show')}
            </button>
            <button type="button" class="v-ghost" onclick={generate}>{$t('rikmaDocs.vault.generate')}</button>
          </span>
        </label>
        <label>
          <span>{$t('rikmaDocs.vault.url')}</span>
          <input bind:value={form.url} type="url" maxlength={VAULT_LIMITS.url} dir="ltr" placeholder="https://…" />
        </label>
        <label>
          <span>{$t('rikmaDocs.vault.note')}</span>
          <textarea bind:value={form.note} rows="2" maxlength={VAULT_LIMITS.note}></textarea>
        </label>
        <div class="v-row">
          <button type="submit" class="v-primary" disabled={session.busy}>{$t('rikmaDocs.vault.save')}</button>
          <button type="button" class="v-ghost" onclick={() => (editing = null)}>{$t('rikmaDocs.vault.cancel')}</button>
        </div>
      </form>
    {/if}

    {#if session.items.length === 0 && editing === null}
      <p class="v-muted">{$t('rikmaDocs.vault.empty')}</p>
    {:else}
      <ul class="v-list">
        {#each session.items as item (item.id)}
          <li class="v-item">
            <div class="v-main">
              <strong>{item.name}</strong>
              {#if item.username}<span class="v-user" dir="ltr">{item.username}</span>{/if}
              <code class="v-secret" dir="ltr">{revealed.has(item.id) ? item.secret : '••••••••••'}</code>
              {#if item.url}
                <a href={item.url} target="_blank" rel="external noopener noreferrer" dir="ltr">{item.url}</a>
              {/if}
              {#if item.note}<small>{item.note}</small>{/if}
            </div>
            <div class="v-actions">
              <button type="button" class="v-ghost" onclick={() => copy(item)}>
                {copied === item.id ? $t('rikmaDocs.vault.copied') : $t('rikmaDocs.vault.copy')}
              </button>
              <button type="button" class="v-ghost" onclick={() => toggleReveal(item.id)}>
                {revealed.has(item.id) ? $t('rikmaDocs.vault.hide') : $t('rikmaDocs.vault.show')}
              </button>
              <button type="button" class="v-ghost" onclick={() => openForm(item)}>{$t('rikmaDocs.vault.edit')}</button>
              <button type="button" class="v-ghost v-danger" disabled={session.busy} onclick={() => remove(item)}>
                {$t('rikmaDocs.vault.remove')}
              </button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}

  {#if message}<p class="v-warn" role="status">{message}</p>{/if}
</section>

<style>
  .vault {
    margin-top: 1.25rem;
    padding: 1rem;
    border-radius: 0.9rem;
    border: 1px solid var(--surface-line);
    background: var(--surface-2);
    color: var(--surface-ink);
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .v-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .v-head h3 {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0;
  }
  .v-note,
  .v-muted {
    font-size: 0.85rem;
    color: var(--surface-muted);
    margin: 0;
  }
  .v-warn {
    font-size: 0.85rem;
    padding: 0.6rem 0.75rem;
    border-radius: 0.6rem;
    background: rgba(245, 158, 11, 0.14);
    border: 1px solid rgba(245, 158, 11, 0.45);
  }
  .v-warn ul {
    margin: 0.3rem 0 0;
    padding-inline-start: 1.1rem;
    list-style: disc;
  }
  .v-form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .v-form label {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.85rem;
  }
  .v-form input,
  .v-form textarea {
    border: 1px solid var(--surface-line);
    border-radius: 0.5rem;
    padding: 0.35rem 0.5rem;
    background: transparent;
    color: inherit;
    min-width: 0;
    flex: 1;
  }
  .v-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: center;
  }
  .v-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .v-item {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    border-radius: 0.6rem;
    border: 1px solid var(--surface-line);
  }
  .v-main {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }
  .v-main a,
  .v-user,
  .v-main small {
    font-size: 0.8rem;
    color: var(--surface-muted);
    overflow-wrap: anywhere;
  }
  .v-secret {
    font-size: 0.9rem;
    overflow-wrap: anywhere;
  }
  .v-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    align-items: flex-start;
  }
  .v-primary,
  .v-add {
    padding: 0.4rem 0.9rem;
    border-radius: 999px;
    font-weight: 700;
    background: var(--gold);
    color: #1a1408;
  }
  .v-ghost {
    padding: 0.25rem 0.65rem;
    border-radius: 999px;
    font-size: 0.8rem;
    border: 1px solid var(--surface-line);
  }
  .v-danger {
    color: #be123c;
  }
  button:disabled {
    opacity: 0.45;
  }
</style>
