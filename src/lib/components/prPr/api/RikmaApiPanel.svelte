<script>
  // The rikma's API page (PLAN_EXTERNAL_TASKS_API, Phase 2).
  //
  // Three jobs, in this order:
  //   1. mint a rikma-scoped key with exactly the capabilities that were ticked;
  //   2. show the member the REAL ids their external system has to quote —
  //      missions, roles, members — because documentation without values is
  //      unusable;
  //   3. generate the snippet, the field table and an agent prompt around
  //      whatever they picked.
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { toast } from 'svelte-sonner';

  /**
   * @typedef {{ id: string, name: string, holder: string | null }} MissionRef
   * @typedef {{ id: string, name: string }} RoleRef
   * @typedef {{ id: string | number, attributes: { username?: string } }} Member
   */

  let {
    /** @type {string} */ projectId,
    /** @type {MissionRef[]} */ missions = [],
    /** @type {RoleRef[]} */ roles = [],
    /** @type {Member[]} */ members = []
  } = $props();

  const ALL_SCOPES = ['tasks:create', 'tasks:read', 'sales:report'];

  /** @type {Array<{id: string, name: string, key_prefix: string, revoked: boolean, lastUsedAt: string|null, scopes: string[], callbackUrl: string|null}>} */
  let keys = $state([]);
  let loadingKeys = $state(false);
  let creating = $state(false);
  let savingHook = $state(false);

  // Shown exactly once, right after creation — never retrievable later.
  let newRawKey = $state('');
  let newWebhookSecret = $state('');

  let form = $state({ name: '', scopes: ['tasks:create', 'tasks:read'], callbackUrl: '' });

  let currentUserId = $state('');
  let selectedMissionId = $state('');
  /** 'user' | 'role' | 'open' — who the generated task goes to. */
  let target = $state('user');
  let selectedUserId = $state('');
  let selectedRoleId = $state('');
  let urgency = $state('red');
  let activeTab = $state('server');
  let copiedWhat = $state('');

  const apiBase = $derived(browser ? window.location.origin : 'https://1lev1.com');
  const isRtl = $derived($lang === 'he' || $lang === 'ar');

  const activeKeys = $derived(keys.filter((k) => !k.revoked));
  const taskKey = $derived(activeKeys.find((k) => k.scopes?.includes('tasks:create')) ?? null);

  // The real key immediately after creation, otherwise a placeholder the member
  // swaps for the one they saved.
  const keyForSnippet = $derived(newRawKey || '{{API_KEY}}');
  const missionForSnippet = $derived(selectedMissionId || '{{MISSION_ID}}');

  /** The assignment half of the body — a person, a role, or nobody. */
  const assignmentLines = $derived.by(() => {
    if (target === 'user') return [`  "assignedUserId": "${selectedUserId || '{{USER_ID}}'}",`];
    if (target === 'role') return [`  "roleIds": ["${selectedRoleId || '{{ROLE_ID}}'}"],`];
    return [];
  });

  const bodyJson = $derived(
    [
      '{',
      '  "name": TASK_TITLE,',
      '  "description": TASK_BODY,',
      '  "link": TASK_URL,',
      '  "externalId": TASK_ID,',
      ...(selectedMissionId || target !== 'open' ? [`  "missionId": "${missionForSnippet}",`] : []),
      ...assignmentLines,
      `  "urgency": "${urgency}"`,
      '}'
    ].join('\n')
  );

  const serverSnippet = $derived(
    [
      `curl -X POST ${apiBase}/api/v1/tasks \\`,
      `  -H "Authorization: Bearer ${keyForSnippet}" \\`,
      '  -H "Content-Type: application/json" \\',
      `  -d '${bodyJson.replace(/\n\s*/g, ' ').replace(/'/g, "'\\''")}'`
    ].join('\n')
  );

  const nodeSnippet = $derived(
    [
      '// Run this on YOUR server, after the item is created.',
      '// Keep the key in an env var — never ship it to the browser.',
      `await fetch('${apiBase}/api/v1/tasks', {`,
      "  method: 'POST',",
      '  headers: {',
      "    'Content-Type': 'application/json',",
      `    Authorization: \`Bearer \${process.env.ONELEVONE_API_KEY}\``,
      '  },',
      '  body: JSON.stringify({',
      '    name: item.title,                 // ← connect: the task title',
      '    description: item.body,           // ← connect: full description',
      '    link: itemUrl,                    // ← connect: link back to your item',
      '    externalId: `item_${item.id}`,    // ← connect: your id (retry-safe)',
      ...(selectedMissionId || target !== 'open'
        ? [`    missionId: '${missionForSnippet}',`]
        : []),
      ...(target === 'user'
        ? [`    assignedUserId: '${selectedUserId || '{{USER_ID}}'}',`]
        : target === 'role'
          ? [`    roleIds: ['${selectedRoleId || '{{ROLE_ID}}'}'],`]
          : []),
      `    urgency: '${urgency}'`,
      '  })',
      '});'
    ].join('\n')
  );

  const webhookSnippet = $derived(
    [
      '// Receiver for the sync back: accepted / progressed / done.',
      "import crypto from 'crypto';",
      '',
      'export async function POST({ request }) {',
      '  const raw = await request.text();               // sign the RAW text',
      "  const sent = request.headers.get('X-1lev1-Signature');",
      "  const mine = 'sha256=' + crypto",
      "    .createHmac('sha256', process.env.ONELEVONE_WEBHOOK_SECRET)",
      "    .update(raw, 'utf8').digest('hex');",
      '  if (sent !== mine) return new Response(null, { status: 401 });',
      '',
      '  const e = JSON.parse(raw);',
      '  // e.event: task.created | task.accepted | task.assigned | task.progress | task.done',
      '  // e.externalId is YOUR id — use it to find the item and update it.',
      '  await updateMyItem(e.externalId, e.status, e.assignee);',
      '  return new Response(null, { status: 204 });',
      '}'
    ].join('\n')
  );

  const snippet = $derived(
    activeTab === 'server' ? serverSnippet : activeTab === 'node' ? nodeSnippet : webhookSnippet
  );

  const agentPrompt = $derived(
    `You are integrating my website with 1lev1's task API, so that every item my ` +
      `system opens also becomes a task inside our rikma (project ${projectId}) and ` +
      `waits there for a human to accept it. ` +
      `After an item is created, send an HTTPS POST from MY SERVER (never the browser) to ` +
      `${apiBase}/api/v1/tasks with header Authorization: Bearer <ONELEVONE_API_KEY from env> ` +
      `and a JSON body: name (the title), description, link (back to the item), ` +
      `externalId (my own item id — required, it makes retries safe), ` +
      (selectedMissionId ? `missionId (fixed: "${selectedMissionId}"), ` : '') +
      (target === 'user' && selectedUserId
        ? `assignedUserId (fixed: "${selectedUserId}"), `
        : target === 'role' && selectedRoleId
          ? `roleIds (fixed: ["${selectedRoleId}"]), `
          : '') +
      `and urgency ("${urgency}"). Send assignedUserId OR roleIds, never both. ` +
      `A 201 with {success:true} means the task was opened; a response with ` +
      `duplicated:true means I already reported that externalId — treat it as success. ` +
      `Never block or fail my user's flow if this call fails: log it and retry up to ` +
      `3 times with backoff. ` +
      `For the sync back, expose a POST endpoint and register it as the callback URL. ` +
      `It receives {event, externalId, taskId, status, progress, naasa, assignee}. ` +
      `Verify the X-1lev1-Signature header: it is 'sha256=' + HMAC-SHA256 of the RAW ` +
      `request body using my webhook secret — compare against the raw text, not against ` +
      `re-serialised JSON. Map status (open | awaitingConsent | accepted | done) onto my ` +
      `item's own state.`
  );

  onMount(async () => {
    if (browser) {
      const row = document.cookie.split('; ').find((r) => r.startsWith('id='));
      currentUserId = row ? row.split('=')[1] : '';
      if (currentUserId) selectedUserId = currentUserId;
    }
    if (missions.length > 0) selectedMissionId = missions[0].id;
    if (roles.length > 0) selectedRoleId = roles[0].id;
    await loadKeys();
  });

  async function loadKeys() {
    loadingKeys = true;
    try {
      const res = await fetch(`/api/api-keys?projectId=${encodeURIComponent(projectId)}`);
      if (res.ok) keys = await res.json();
    } catch (e) {
      console.error('[RikmaApiPanel] load keys failed:', e);
    } finally {
      loadingKeys = false;
    }
  }

  function toggleScope(scope) {
    form.scopes = form.scopes.includes(scope)
      ? form.scopes.filter((s) => s !== scope)
      : [...form.scopes, scope];
  }

  async function createKey() {
    if (!form.name.trim()) {
      toast.error($t('rikmaApi.errNameRequired'));
      return;
    }
    if (form.scopes.length === 0) {
      toast.error($t('rikmaApi.errScopeRequired'));
      return;
    }
    creating = true;
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: form.name.trim(),
          scopes: form.scopes,
          callbackUrl: form.callbackUrl.trim() || null
        })
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b?.message || 'create failed');
      }
      const data = await res.json();
      newRawKey = data.raw;
      newWebhookSecret = data.webhookSecret ?? '';
      form = { name: '', scopes: ['tasks:create', 'tasks:read'], callbackUrl: '' };
      await loadKeys();
    } catch (e) {
      console.error('[RikmaApiPanel] create key failed:', e);
      toast.error($t('rikmaApi.errCreate'));
    } finally {
      creating = false;
    }
  }

  async function saveCallback(key, url) {
    savingHook = true;
    try {
      const res = await fetch(`/api/api-keys?id=${key.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callbackUrl: url.trim() || null })
      });
      if (!res.ok) throw new Error('patch failed');
      const data = await res.json();
      if (data.webhookSecret) newWebhookSecret = data.webhookSecret;
      await loadKeys();
      toast.success($t('rikmaApi.hookSaved'));
    } catch (e) {
      console.error('[RikmaApiPanel] save callback failed:', e);
      toast.error($t('rikmaApi.errCreate'));
    } finally {
      savingHook = false;
    }
  }

  async function revokeKey(key) {
    if (browser && !confirm($t('rikmaApi.revokeConfirm'))) return;
    try {
      const res = await fetch(`/api/api-keys?id=${key.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('revoke failed');
      newRawKey = '';
      newWebhookSecret = '';
      await loadKeys();
    } catch (e) {
      console.error('[RikmaApiPanel] revoke failed:', e);
      toast.error($t('rikmaApi.errCreate'));
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
      toast.error($t('rikmaApi.errCopy'));
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
</script>

<div class="rikma-api" dir={isRtl ? 'rtl' : 'ltr'}>
  <header class="intro">
    <h2>{$t('rikmaApi.title')}</h2>
    <p>{$t('rikmaApi.subtitle')}</p>
    <p class="consent-note">{$t('rikmaApi.consentNote')}</p>
  </header>

  <!-- 1 ── Keys -->
  <section>
    <h3>{$t('rikmaApi.keysTitle')}</h3>

    {#if newRawKey}
      <div class="new-key">
        <p class="warn">{$t('rikmaApi.saveWarning')}</p>
        <div class="key-row">
          <code class="raw-key">{newRawKey}</code>
          <button type="button" onclick={() => copy(newRawKey, 'rawkey')}>
            {copiedWhat === 'rawkey' ? $t('rikmaApi.copied') : $t('rikmaApi.copy')}
          </button>
        </div>
        {#if newWebhookSecret}
          <p class="warn secret-label">{$t('rikmaApi.secretLabel')}</p>
          <div class="key-row">
            <code class="raw-key">{newWebhookSecret}</code>
            <button type="button" onclick={() => copy(newWebhookSecret, 'secret')}>
              {copiedWhat === 'secret' ? $t('rikmaApi.copied') : $t('rikmaApi.copy')}
            </button>
          </div>
        {/if}
      </div>
    {/if}

    {#if loadingKeys}
      <p class="muted">…</p>
    {:else if activeKeys.length > 0}
      <ul class="key-list">
        {#each activeKeys as k (k.id)}
          <li class="key-item">
            <div class="key-head">
              <strong>{k.name}</strong>
              <code class="prefix">····{k.key_prefix}</code>
              <button type="button" class="link-danger" onclick={() => revokeKey(k)}>
                {$t('rikmaApi.revoke')}
              </button>
            </div>
            <div class="key-scopes">
              {#each k.scopes as s (s)}<span class="tag ok">{s}</span>{/each}
            </div>
            <div class="key-meta">
              <span class="muted">
                {$t('rikmaApi.lastUsed')}:
                {k.lastUsedAt ? formatDate(k.lastUsedAt) : $t('rikmaApi.never')}
              </span>
            </div>
            <label class="hook-row">
              <span>{$t('rikmaApi.callbackUrl')}</span>
              <input
                type="url"
                placeholder="https://my-site.example/api/1lev1-webhook"
                value={k.callbackUrl ?? ''}
                onchange={(e) => saveCallback(k, e.currentTarget.value)}
                disabled={savingHook}
              />
            </label>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="muted">{$t('rikmaApi.noKeys')}</p>
    {/if}

    <div class="create-key">
      <h4>{$t('rikmaApi.createTitle')}</h4>
      <label class="field">
        <span>{$t('rikmaApi.keyName')}</span>
        <input type="text" bind:value={form.name} placeholder={$t('rikmaApi.keyNamePlaceholder')} />
      </label>
      <fieldset class="scopes">
        <legend>{$t('rikmaApi.scopes')}</legend>
        {#each ALL_SCOPES as s (s)}
          <label class="check">
            <input
              type="checkbox"
              checked={form.scopes.includes(s)}
              onchange={() => toggleScope(s)}
            />
            <code>{s}</code>
            <span class="muted">{$t(`rikmaApi.scope_${s.replace(':', '_')}`)}</span>
          </label>
        {/each}
      </fieldset>
      <label class="field">
        <span>{$t('rikmaApi.callbackUrl')}</span>
        <input
          type="url"
          bind:value={form.callbackUrl}
          placeholder="https://my-site.example/api/1lev1-webhook"
        />
      </label>
      <button type="button" class="primary" onclick={createKey} disabled={creating}>
        {creating ? $t('rikmaApi.creating') : $t('rikmaApi.createKey')}
      </button>
    </div>
  </section>

  <!-- 2 ── The ids -->
  <section>
    <h3>{$t('rikmaApi.idsTitle')}</h3>
    <p class="muted">{$t('rikmaApi.idsSubtitle')}</p>

    <div class="id-tables">
      <div class="id-table">
        <h4>{$t('rikmaApi.missions')}</h4>
        {#if missions.length === 0}
          <p class="muted">{$t('rikmaApi.noMissions')}</p>
        {:else}
          <table>
            <thead>
              <tr><th>ID</th><th>{$t('rikmaApi.name')}</th><th>{$t('rikmaApi.holder')}</th></tr>
            </thead>
            <tbody>
              {#each missions as m (m.id)}
                <tr>
                  <td>
                    <button type="button" class="id-copy" onclick={() => copy(m.id, `m${m.id}`)}>
                      <code>{m.id}</code>
                      <span class="hint-copy">{copiedWhat === `m${m.id}` ? '✓' : '⧉'}</span>
                    </button>
                  </td>
                  <td>{m.name}</td>
                  <td class="muted">{m.holder ?? '—'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>

      <div class="id-table">
        <h4>{$t('rikmaApi.roles')}</h4>
        {#if roles.length === 0}
          <p class="muted">{$t('rikmaApi.noRoles')}</p>
        {:else}
          <table>
            <thead><tr><th>ID</th><th>{$t('rikmaApi.name')}</th></tr></thead>
            <tbody>
              {#each roles as r (r.id)}
                <tr>
                  <td>
                    <button type="button" class="id-copy" onclick={() => copy(r.id, `r${r.id}`)}>
                      <code>{r.id}</code>
                      <span class="hint-copy">{copiedWhat === `r${r.id}` ? '✓' : '⧉'}</span>
                    </button>
                  </td>
                  <td>{r.name}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>

      <div class="id-table">
        <h4>{$t('rikmaApi.members')}</h4>
        <table>
          <thead><tr><th>ID</th><th>{$t('rikmaApi.name')}</th></tr></thead>
          <tbody>
            {#each members as u (u.id)}
              <tr>
                <td>
                  <button type="button" class="id-copy" onclick={() => copy(String(u.id), `u${u.id}`)}>
                    <code>{u.id}</code>
                    <span class="hint-copy">{copiedWhat === `u${u.id}` ? '✓' : '⧉'}</span>
                  </button>
                </td>
                <td>
                  {u.attributes?.username ?? `#${u.id}`}
                  {String(u.id) === currentUserId ? ` (${$t('rikmaApi.you')})` : ''}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- 3 ── Snippet builder -->
  <section>
    <h3>{$t('rikmaApi.codeTitle')}</h3>
    {#if !taskKey && !newRawKey}
      <p class="muted">{$t('rikmaApi.createKeyFirst')}</p>
    {/if}

    <div class="selects">
      <label>
        <span>{$t('rikmaApi.mission')}</span>
        <select bind:value={selectedMissionId}>
          <option value="">{$t('rikmaApi.noMission')}</option>
          {#each missions as m (m.id)}
            <option value={m.id}>{m.name}</option>
          {/each}
        </select>
      </label>

      <label>
        <span>{$t('rikmaApi.assignTo')}</span>
        <select bind:value={target}>
          <option value="user">{$t('rikmaApi.targetUser')}</option>
          <option value="role">{$t('rikmaApi.targetRole')}</option>
          <option value="open">{$t('rikmaApi.targetOpen')}</option>
        </select>
      </label>

      {#if target === 'user'}
        <label>
          <span>{$t('rikmaApi.member')}</span>
          <select bind:value={selectedUserId}>
            {#each members as u (u.id)}
              <option value={String(u.id)}>{u.attributes?.username ?? `#${u.id}`}</option>
            {/each}
          </select>
        </label>
      {:else if target === 'role'}
        <label>
          <span>{$t('rikmaApi.role')}</span>
          <select bind:value={selectedRoleId}>
            {#each roles as r (r.id)}
              <option value={r.id}>{r.name}</option>
            {/each}
          </select>
        </label>
      {/if}

      <label>
        <span>{$t('rikmaApi.urgency')}</span>
        <select bind:value={urgency}>
          <option value="red">{$t('rikmaApi.urgency_red')}</option>
          <option value="yellow">{$t('rikmaApi.urgency_yellow')}</option>
          <option value="green">{$t('rikmaApi.urgency_green')}</option>
          <option value="white">{$t('rikmaApi.urgency_white')}</option>
        </select>
      </label>
    </div>

    <div class="tabs">
      <button type="button" class:active={activeTab === 'server'} onclick={() => (activeTab = 'server')}>
        {$t('rikmaApi.tabCurl')}
      </button>
      <button type="button" class:active={activeTab === 'node'} onclick={() => (activeTab = 'node')}>
        {$t('rikmaApi.tabNode')}
      </button>
      <button type="button" class:active={activeTab === 'hook'} onclick={() => (activeTab = 'hook')}>
        {$t('rikmaApi.tabWebhook')}
      </button>
    </div>

    <p class="hint">{$t('rikmaApi.serverHint')}</p>

    <div class="code-block">
      <button type="button" class="copy-btn" onclick={() => copy(snippet, 'snippet')}>
        {copiedWhat === 'snippet' ? $t('rikmaApi.copied') : $t('rikmaApi.copy')}
      </button>
      <pre><code>{snippet}</code></pre>
    </div>
  </section>

  <!-- 4 ── Field reference -->
  <section>
    <h3>{$t('rikmaApi.varsTitle')}</h3>
    <table class="vars">
      <thead>
        <tr>
          <th>{$t('rikmaApi.varField')}</th>
          <th>{$t('rikmaApi.varDesc')}</th>
          <th>{$t('rikmaApi.varStatus')}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>name</code></td>
          <td>{$t('rikmaApi.varName')}</td>
          <td><span class="tag do">{$t('rikmaApi.connectYours')}</span></td>
        </tr>
        <tr>
          <td><code>externalId</code></td>
          <td>{$t('rikmaApi.varExternalId')}</td>
          <td><span class="tag do">{$t('rikmaApi.connectYours')}</span></td>
        </tr>
        <tr>
          <td><code>description</code> / <code>link</code></td>
          <td>{$t('rikmaApi.varDescLink')}</td>
          <td><span class="tag do">{$t('rikmaApi.connectYours')}</span></td>
        </tr>
        <tr>
          <td><code>missionId</code></td>
          <td>{$t('rikmaApi.varMissionId')}</td>
          <td><span class="tag ok">{$t('rikmaApi.prefilled')}</span></td>
        </tr>
        <tr>
          <td><code>assignedUserId</code></td>
          <td>{$t('rikmaApi.varAssignedUserId')}</td>
          <td><span class="tag ok">{$t('rikmaApi.prefilled')}</span></td>
        </tr>
        <tr>
          <td><code>roleIds</code></td>
          <td>{$t('rikmaApi.varRoleIds')}</td>
          <td><span class="tag ok">{$t('rikmaApi.prefilled')}</span></td>
        </tr>
        <tr>
          <td><code>urgency</code></td>
          <td>{$t('rikmaApi.varUrgency')}</td>
          <td><span class="tag opt">{$t('rikmaApi.optional')}</span></td>
        </tr>
        <tr>
          <td><code>dateS</code> / <code>dateF</code></td>
          <td>{$t('rikmaApi.varDates')}</td>
          <td><span class="tag opt">{$t('rikmaApi.optional')}</span></td>
        </tr>
      </tbody>
    </table>
    <p class="hint">{$t('rikmaApi.varsNote')}</p>
  </section>

  <!-- 5 ── Agent prompt -->
  <section>
    <h3>{$t('rikmaApi.agentTitle')}</h3>
    <p class="muted">{$t('rikmaApi.agentSubtitle')}</p>
    <div class="code-block">
      <button type="button" class="copy-btn" onclick={() => copy(agentPrompt, 'prompt')}>
        {copiedWhat === 'prompt' ? $t('rikmaApi.copied') : $t('rikmaApi.copy')}
      </button>
      <textarea readonly rows="10">{agentPrompt}</textarea>
    </div>
  </section>
</div>

<style>
  .rikma-api {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .intro h2 {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--gold-l, #f5d98b);
    margin: 0 0 0.25rem;
  }
  .intro p {
    margin: 0.25rem 0;
    font-size: 0.9rem;
    opacity: 0.85;
  }
  .consent-note {
    border-inline-start: 3px solid var(--gold, #d4af37);
    padding-inline-start: 0.6rem;
    opacity: 1 !important;
    color: var(--gold-l, #f5d98b);
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
    color: var(--gold-l, #f5d98b);
  }
  section h4 {
    font-weight: 700;
    margin: 0 0 0.4rem;
  }
  .muted {
    font-size: 0.85rem;
    opacity: 0.65;
  }
  .hint {
    font-size: 0.82rem;
    opacity: 0.75;
    margin: 0;
  }
  .warn {
    color: #fbbf24;
    font-size: 0.85rem;
    margin: 0 0 0.4rem;
  }
  .secret-label {
    margin-top: 0.6rem;
  }
  .new-key {
    border: 1px solid #fcd34d;
    background: rgba(252, 211, 77, 0.08);
    padding: 0.75rem;
    border-radius: 0.5rem;
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
    background: rgba(0, 0, 0, 0.35);
    padding: 0.4rem 0.6rem;
    border-radius: 0.375rem;
    font-size: 0.8rem;
    direction: ltr;
    text-align: left;
  }
  .key-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .key-item {
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 0.5rem;
    padding: 0.6rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .key-head {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .key-scopes {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }
  .prefix {
    font-family: monospace;
    opacity: 0.7;
  }
  .link-danger {
    background: none;
    border: none;
    color: #f87171;
    cursor: pointer;
    text-decoration: underline;
    font-size: 0.8rem;
    margin-inline-start: auto;
  }
  .create-key {
    border-top: 1px dashed rgba(148, 163, 184, 0.3);
    padding-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .field,
  .hook-row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.85rem;
  }
  .field input,
  .hook-row input,
  .selects select {
    padding: 0.45rem 0.6rem;
    border: 1px solid rgba(148, 163, 184, 0.45);
    border-radius: 0.375rem;
    background: rgba(0, 0, 0, 0.25);
    color: inherit;
  }
  .scopes {
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .scopes legend {
    font-size: 0.8rem;
    padding: 0 0.35rem;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
  }
  button.primary {
    background: var(--barbi, #e91e8c);
    color: #fff;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    cursor: pointer;
    align-self: start;
  }
  button.primary:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .id-tables {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    gap: 1rem;
  }
  .id-table {
    min-width: 0;
    overflow-x: auto;
  }
  .id-table table,
  table.vars {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.82rem;
  }
  .id-table th,
  .id-table td,
  table.vars th,
  table.vars td {
    border: 1px solid rgba(148, 163, 184, 0.25);
    padding: 0.35rem 0.5rem;
    text-align: start;
  }
  .id-copy {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0;
    font: inherit;
  }
  .hint-copy {
    opacity: 0.5;
    font-size: 0.75rem;
  }
  code {
    background: rgba(0, 0, 0, 0.3);
    padding: 0.1rem 0.3rem;
    border-radius: 0.25rem;
    direction: ltr;
    display: inline-block;
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
    min-width: 9rem;
  }
  .tabs {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }
  .tabs button {
    padding: 0.35rem 0.9rem;
    border: 1px solid rgba(148, 163, 184, 0.45);
    background: transparent;
    color: inherit;
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
    background: #0f172a;
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
    margin: 0;
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
  .tag {
    font-size: 0.72rem;
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    white-space: nowrap;
  }
  .tag.ok {
    background: rgba(34, 197, 94, 0.2);
    color: #86efac;
  }
  .tag.do {
    background: rgba(251, 191, 36, 0.2);
    color: #fcd34d;
  }
  .tag.opt {
    background: rgba(148, 163, 184, 0.2);
    color: #cbd5e1;
  }
</style>
