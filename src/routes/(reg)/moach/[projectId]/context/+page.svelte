<script>
  /**
   * The rikma's context tab (docs/tbd/PLAN_AGENT_WORK.md, AW2 wave 3).
   *
   * Three things a member needs before trusting an agent in their rikma:
   *  1. the playbooks — what the members wrote about how work is done here,
   *     and a way to propose a new text (it goes to the rikma like any other
   *     consent flow: everyone's yes, or restime silence);
   *  2. what an agent is actually handed — the very same getRikmaContextTool
   *     answer, run with a key limited to this rikma;
   *  3. the door: a key that reaches this rikma only, shown once, with the
   *     lines to paste into the agent.
   *
   * Member-written text is rendered as text (`dir="auto"` on the element that
   * holds it), never as HTML. The preview is JSON, and JSON is LTR.
   */
  import { t, locale } from '$lib/translations';
  import { invalidateAll } from '$app/navigation';
  import { deserialize } from '$app/forms';
  import { page } from '$app/state';
  import { executeAction } from '$lib/client/actionClient';

  let { data } = $props();

  const GENERAL_SECTIONS = ['does', 'whom', 'decisions', 'hours', 'dont'];
  const ROLE_SECTIONS = ['how', 'promise', 'tools', 'examples', 'dontTouch'];
  const MAX = 20000;
  // The member's own connection — the same two doors as /me/settings/mcp (McpGuide).
  const CONNECT_CMD = 'npx 1lev1-mcp';

  let pid = $derived(String(page.params.projectId));
  let roleName = $derived(data.roles.find((r) => r.id === data.roleId)?.name ?? '');
  let general = $derived(data.playbook?.general ?? null);
  let rolePb = $derived(data.roleId ? (data.playbook?.role ?? null) : null);
  let proposals = $derived(data.playbook?.openProposals ?? []);

  /** @param {string | null} iso */
  const when = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString($locale || undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  // ── proposing a new text ───────────────────────────────────────────
  /** @type {'general' | 'role' | null} */
  let editing = $state(null);
  let draft = $state('');
  let draftTitle = $state('');
  let sending = $state(false);
  /** @type {{ kind: 'ok' | 'err', text: string } | null} */
  let outcome = $state(null);

  /**
   * A first playbook starts from the sections it usually needs, in the
   * reader's language. The outline's facts stay out: the server states them in
   * English for agents, and they would land in a member's own text.
   */
  function skeleton(kind) {
    const keys = kind === 'role' ? ROLE_SECTIONS : GENERAL_SECTIONS;
    return keys.map((k) => `## ${$t(`rikmaContext.sections.${kind}.${k}`, { role: roleName })}\n\n`).join('\n');
  }

  function startEdit(kind) {
    const pb = kind === 'role' ? rolePb : general;
    editing = kind;
    outcome = null;
    draft = pb?.memberWritten?.body ?? skeleton(kind);
    beforeDraft = null;
    draftError = '';
    draftTitle =
      pb?.memberWritten?.title ??
      (kind === 'role' ? $t('rikmaContext.playbook.roleTitle', { role: roleName }) : $t('rikmaContext.playbook.generalTitle'));
  }

  // ── draft with AI ──────────────────────────────────────────────────
  // The site's model fills the editor; nothing is saved until the member sends.
  // What was there before stays one click away.
  let drafting = $state(false);
  /** @type {string | null} */
  let beforeDraft = $state(null);
  /** @type {string} */
  let draftError = $state('');

  async function draftWithAi() {
    if (drafting || !editing) return;
    const base = skeleton(editing);
    // The sections to fill: the ones already in the text, else the suggested ones.
    const inText = draft.split('\n').filter((l) => l.startsWith('## ')).map((l) => l.slice(3).trim());
    const headings = inText.length ? inText : base.split('\n').filter((l) => l.startsWith('## ')).map((l) => l.slice(3));
    const form = new FormData();
    form.set('headings', headings.join('\n'));
    // An untouched skeleton is no notes at all.
    form.set('notes', draft.trim() === base.trim() ? '' : draft);
    if (editing === 'role' && data.roleId) form.set('roleId', data.roleId);
    drafting = true;
    draftError = '';
    try {
      const res = await fetch('?/draft', { method: 'POST', body: form, headers: { 'x-sveltekit-action': 'true' } });
      const result = deserialize(await res.text());
      const payload = /** @type {any} */ (result).data ?? {};
      if (result.type === 'success' && payload.draft) {
        beforeDraft = draft;
        draft = payload.draft;
      } else {
        draftError =
          payload.reason === 'rateLimited'
            ? $t('rikmaContext.draft.rateLimited')
            : payload.reason === 'denied'
              ? $t('rikmaContext.draft.denied')
              : $t('rikmaContext.draft.failed');
      }
    } catch {
      draftError = $t('rikmaContext.draft.failed');
    }
    drafting = false;
  }

  function undoDraft() {
    if (beforeDraft === null) return;
    draft = beforeDraft;
    beforeDraft = null;
  }

  // A question line, bare or as a list item ("- ❓ …").
  let openQuestions = $derived(draft.split('\n').filter((l) => /^\s*(?:[-*]\s*)?❓/.test(l)).length);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    if (body.length > MAX) {
      outcome = { kind: 'err', text: $t('rikmaContext.playbook.tooLong', { count: MAX }) };
      return;
    }
    sending = true;
    outcome = null;
    const res = await executeAction('proposePlaybookUpdate', {
      projectId: pid,
      ...(editing === 'role' && data.roleId ? { roleId: data.roleId } : {}),
      body,
      title: draftTitle.trim()
    });
    sending = false;
    if (!res?.success) {
      outcome = { kind: 'err', text: $t('rikmaContext.playbook.failed') };
      return;
    }
    const d = res.data ?? {};
    outcome = d.unchanged
      ? { kind: 'ok', text: $t('rikmaContext.playbook.unchanged') }
      : d.applied
        ? { kind: 'ok', text: $t('rikmaContext.playbook.applied') }
        : { kind: 'ok', text: $t('rikmaContext.playbook.sent', { when: when(d.deadline ?? null) }) };
    editing = null;
    await invalidateAll();
  }

  // ── connecting an agent ────────────────────────────────────────────
  let minting = $state(false);
  let mintFailed = $state(false);
  /** @type {string | null} */
  let rawKey = $state(null);
  let copied = $state('');

  async function mint() {
    if (minting) return;
    if (rawKey === null && !confirm($t('rikmaContext.connect.confirm'))) return;
    minting = true;
    mintFailed = false;
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: pid, purpose: 'mcp' })
      });
      const body = res.ok ? await res.json() : null;
      rawKey = body?.raw ?? null;
      mintFailed = !rawKey;
    } catch {
      mintFailed = true;
    }
    minting = false;
  }

  let CLAUDE_CONNECTOR_URL = $derived(
    'https://claude.ai/customize/connectors?modal=add-custom-connector' +
      `&connectorName=1lev1&connectorUrl=${encodeURIComponent(data.mcpEndpoint)}`
  );
  let serverName = $derived(`1lev1-rikma-${pid}`);
  let codeLine = $derived(
    rawKey
      ? `claude mcp add --transport http ${serverName} ${data.mcpEndpoint} --header "Authorization: Bearer ${rawKey}"`
      : ''
  );
  let jsonBlock = $derived(
    rawKey
      ? JSON.stringify(
          { mcpServers: { [serverName]: { type: 'http', url: data.mcpEndpoint, headers: { Authorization: `Bearer ${rawKey}` } } } },
          null,
          2
        )
      : ''
  );

  async function copy(what, text) {
    try {
      await navigator.clipboard.writeText(text);
      copied = what;
      setTimeout(() => (copied = ''), 2000);
    } catch {
      /* clipboard refused — the text stays selectable */
    }
  }

  let previewJson = $derived(JSON.stringify(data.preview ?? null, null, 2));
  let unavailable = $derived(data.preview?.unavailable ?? []);
</script>

<section class="context-tab">
  <div class="panel">
    <header class="head">
      <h2>{$t('rikmaContext.title')}</h2>
      <p class="intro">{$t('rikmaContext.intro')}</p>
    </header>

    {#if data.roles.length}
      <nav class="roles" aria-label={$t('rikmaContext.roles.label')}>
        <a class="chip" class:on={!data.roleId} href="?" data-sveltekit-noscroll>{$t('rikmaContext.roles.all')}</a>
        {#each data.roles as role (role.id)}
          <a class="chip" class:on={data.roleId === role.id} href={`?role=${role.id}`} data-sveltekit-noscroll>
            <span dir="auto">{role.name}</span>
          </a>
        {/each}
      </nav>
    {/if}

    {#if outcome}
      <p class="notice" class:ok={outcome.kind === 'ok'} role="status">{outcome.text}</p>
    {/if}

    <!-- ── playbooks ── -->
    <section class="block">
      <h3>{$t('rikmaContext.playbook.heading')}</h3>
      <p class="muted">{$t('rikmaContext.playbook.explain')}</p>

      {#if !data.playbook}
        <p class="notice" role="alert">{$t('rikmaContext.playbook.unavailable')}</p>
      {:else}
        {#each data.roleId ? ['general', 'role'] : ['general'] as kind (kind)}
          {@const pb = kind === 'role' ? rolePb : general}
          <article class="book">
            <div class="book-head">
              <h4>
                {#if kind === 'role'}
                  {$t('rikmaContext.playbook.roleHeading')} · <bdi dir="auto">{roleName}</bdi>
                {:else}
                  {$t('rikmaContext.playbook.generalHeading')}
                {/if}
              </h4>
              {#if editing !== kind}
                <button type="button" class="pill" onclick={() => startEdit(kind)}>
                  {pb ? $t('rikmaContext.playbook.propose') : $t('rikmaContext.playbook.write')}
                </button>
              {/if}
            </div>

            {#if editing === kind}
              <label class="field">
                <span>{$t('rikmaContext.playbook.titleLabel')}</span>
                <input type="text" bind:value={draftTitle} maxlength="200" dir="auto" />
              </label>
              <div class="ai-row">
                <button type="button" class="pill ai" disabled={drafting || sending} onclick={draftWithAi}>
                  {drafting ? $t('rikmaContext.draft.busy') : $t('rikmaContext.draft.button')}
                </button>
                {#if beforeDraft !== null && !drafting}
                  <button type="button" class="pill small" onclick={undoDraft}>{$t('rikmaContext.draft.undo')}</button>
                {/if}
                <span class="muted small">{$t('rikmaContext.draft.hint')}</span>
              </div>
              {#if draftError}
                <p class="notice" role="alert">{draftError}</p>
              {/if}
              <label class="field">
                <span>{$t('rikmaContext.playbook.bodyLabel')}</span>
                <textarea bind:value={draft} rows="16" maxlength={MAX} dir="auto" disabled={drafting}></textarea>
              </label>
              {#if openQuestions > 0}
                <p class="notice question" role="status">{$t('rikmaContext.draft.questions', { count: openQuestions })}</p>
              {/if}
              <p class="muted small">
                {data.memberCount > 1 ? $t('rikmaContext.playbook.consentNote') : $t('rikmaContext.playbook.soloNote')}
              </p>
              <div class="actions">
                <button type="button" class="pill gold" disabled={sending || !draft.trim()} onclick={send}>
                  {sending ? $t('rikmaContext.playbook.sending') : $t('rikmaContext.playbook.send')}
                </button>
                <button type="button" class="pill" onclick={() => (editing = null)}>{$t('rikmaContext.playbook.cancel')}</button>
              </div>
            {:else if pb}
              <p class="muted small">
                <bdi dir="auto">{pb.memberWritten.title}</bdi>
                {#if pb.updatedAt}· {$t('rikmaContext.playbook.updated', { when: when(pb.updatedAt) })}{/if}
              </p>
              <p class="body" dir="auto">{pb.memberWritten.body}</p>
            {:else}
              <p class="muted">{kind === 'role' ? $t('rikmaContext.playbook.noneRole') : $t('rikmaContext.playbook.none')}</p>
            {/if}
          </article>
        {/each}

        {#if proposals.length}
          <div class="proposals">
            <h4>{$t('rikmaContext.proposals.heading')}</h4>
            <ul>
              {#each proposals as p (p.decisionId)}
                <li>
                  <bdi dir="auto">{p.memberWritten.title}</bdi>
                  {#if p.memberWritten.roleName}· <bdi dir="auto">{p.memberWritten.roleName}</bdi>{/if}
                  <span class="muted small">
                    · {$t('rikmaContext.proposals.signed', { count: p.signedBy })}
                    {#if p.silenceApprovesAt}· {$t('rikmaContext.proposals.silence', { when: when(p.silenceApprovesAt) })}{/if}
                  </span>
                  <a href={`/moach/${pid}/votes`}>{$t('rikmaContext.proposals.vote')}</a>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      {/if}
    </section>

    <!-- ── connect an agent ── -->
    <section class="block">
      <h3>{$t('rikmaContext.connect.heading')}</h3>

      <!-- The usual way: the member's own connection, reaching every rikma of theirs. -->
      <div class="option">
        <h4>{$t('rikmaContext.connect.personal.title')}</h4>
        <p class="muted">{$t('rikmaContext.connect.personal.explain')}</p>
        <div class="actions">
          <a class="pill gold" href={CLAUDE_CONNECTOR_URL} target="_blank" rel="noopener noreferrer">
            {$t('rikmaContext.connect.personal.claudeAi')}
          </a>
          <a class="pill" href="/me/settings/mcp">{$t('rikmaContext.connect.personal.guide')}</a>
        </div>
        <div class="snippet">
          <div class="snippet-head">
            <span>{$t('rikmaContext.connect.personal.cli')}</span>
            <button type="button" class="pill small" onclick={() => copy('npx', CONNECT_CMD)}>
              {copied === 'npx' ? $t('rikmaContext.connect.copied') : $t('rikmaContext.connect.copy')}
            </button>
          </div>
          <pre dir="ltr">{CONNECT_CMD}</pre>
        </div>
        <p class="muted small">{$t('rikmaContext.connect.personal.thisRikma', { id: pid })}</p>
      </div>

      <!-- An extra option: a key that reaches this rikma and nothing else. -->
      <div class="option">
        <h4>{$t('rikmaContext.connect.scoped.title')}</h4>
        <p class="muted">{$t('rikmaContext.connect.explain')}</p>
      <div class="actions">
        <button type="button" class="pill gold" disabled={minting} onclick={mint}>
          {minting
            ? $t('rikmaContext.connect.busy')
            : rawKey
              ? $t('rikmaContext.connect.again')
              : $t('rikmaContext.connect.button')}
        </button>
      </div>
      {#if mintFailed}
        <p class="notice" role="alert">{$t('rikmaContext.connect.failed')}</p>
      {/if}
      {#if rawKey}
        <p class="notice ok" role="status">{$t('rikmaContext.connect.once')}</p>
        <div class="snippet">
          <div class="snippet-head">
            <span>{$t('rikmaContext.connect.claudeCode')}</span>
            <button type="button" class="pill small" onclick={() => copy('code', codeLine)}>
              {copied === 'code' ? $t('rikmaContext.connect.copied') : $t('rikmaContext.connect.copy')}
            </button>
          </div>
          <pre dir="ltr">{codeLine}</pre>
        </div>
        <div class="snippet">
          <div class="snippet-head">
            <span>{$t('rikmaContext.connect.json')}</span>
            <button type="button" class="pill small" onclick={() => copy('json', jsonBlock)}>
              {copied === 'json' ? $t('rikmaContext.connect.copied') : $t('rikmaContext.connect.copy')}
            </button>
          </div>
          <pre dir="ltr">{jsonBlock}</pre>
        </div>
        <ul class="muted small tips">
          <li>{$t('rikmaContext.connect.prompt')}</li>
          <li>{$t('rikmaContext.connect.replaces')}</li>
          <li>{$t('rikmaContext.connect.noGit')}</li>
        </ul>
      {/if}
      </div>
    </section>

    <!-- ── what the agent sees ── -->
    <section class="block">
      <h3>{$t('rikmaContext.preview.heading')}</h3>
      <p class="muted">
        {data.roleId ? $t('rikmaContext.preview.explainRole', { role: roleName }) : $t('rikmaContext.preview.explain')}
      </p>
      {#if data.previewFailed}
        <p class="notice" role="alert">{data.preview?.message ? $t('rikmaContext.preview.denied') : $t('rikmaContext.preview.failed')}</p>
      {:else}
        {#if unavailable.length}
          <p class="muted small">{$t('rikmaContext.preview.unavailable', { parts: unavailable.join(', ') })}</p>
        {/if}
        <details>
          <summary>{$t('rikmaContext.preview.show')}</summary>
          <pre dir="ltr" class="json">{previewJson}</pre>
        </details>
      {/if}
    </section>
  </div>
</section>

<style>
  .context-tab {
    padding: 1rem 0;
    text-align: start;
  }
  .panel {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.25rem;
    border-radius: 1rem;
    background: var(--surface);
    color: var(--surface-ink);
    border: 1px solid var(--surface-line);
    box-shadow: 0 10px 30px rgb(0 0 0 / 0.18);
  }
  .head {
    padding-bottom: 0.25rem;
  }
  h2 {
    font-size: 1.4rem;
    font-weight: 800;
  }
  h3 {
    font-size: 1.1rem;
    font-weight: 800;
  }
  h4 {
    font-weight: 700;
  }
  .intro,
  .muted {
    color: var(--surface-muted);
    font-size: 0.9rem;
  }
  .small {
    font-size: 0.8rem;
  }
  .roles {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .chip {
    padding: 0.3rem 0.8rem;
    border-radius: 9999px;
    background: var(--surface-2);
    color: var(--surface-ink);
    box-shadow: inset 0 0 0 1px var(--surface-line);
    font-size: 0.85rem;
  }
  .chip.on {
    background: var(--gold);
    color: #1a1408;
    font-weight: 700;
  }
  .block {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding-top: 1rem;
    border-top: 1px solid var(--surface-line);
  }
  .book {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.9rem;
    border-radius: 0.75rem;
    background: var(--surface-2);
  }
  .book-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .body {
    white-space: pre-wrap;
    line-height: 1.6;
    max-height: 28rem;
    overflow: auto;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.85rem;
  }
  .field input,
  .field textarea {
    padding: 0.5rem 0.65rem;
    border-radius: 0.5rem;
    background: var(--surface);
    color: var(--surface-ink);
    border: 1px solid var(--surface-line);
    font: inherit;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .pill {
    padding: 0.45rem 1rem;
    border-radius: 9999px;
    background: var(--surface-2);
    color: var(--surface-ink);
    box-shadow: inset 0 0 0 1px var(--surface-line);
    font-weight: 700;
    font-size: 0.85rem;
  }
  .pill.small {
    padding: 0.2rem 0.7rem;
    font-size: 0.75rem;
  }
  .pill.gold {
    background: var(--gold);
    color: #1a1408;
    box-shadow: none;
  }
  .pill:disabled {
    opacity: 0.6;
  }
  .pill:focus-visible,
  .chip:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }
  .notice {
    padding: 0.65rem 0.9rem;
    border-radius: 0.6rem;
    background: rgb(220 38 38 / 0.1);
    border: 1px solid rgb(220 38 38 / 0.45);
    font-size: 0.85rem;
  }
  .notice.ok {
    background: rgb(22 163 74 / 0.1);
    border-color: rgb(22 163 74 / 0.45);
  }
  .proposals ul {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.9rem;
  }
  .proposals a,
  .tips {
    text-decoration: underline;
  }
  .tips {
    text-decoration: none;
    list-style: disc;
    padding-inline-start: 1.2rem;
  }
  .ai-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }
  .pill.ai {
    box-shadow: inset 0 0 0 1px var(--gold);
  }
  .notice.question {
    background: rgb(234 179 8 / 0.12);
    border-color: rgb(234 179 8 / 0.5);
  }
  .option {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.9rem;
    border-radius: 0.75rem;
    background: var(--surface-2);
  }
  .option pre {
    background: var(--surface);
  }
  a.pill {
    display: inline-block;
  }
  .snippet {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .snippet-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.85rem;
    font-weight: 700;
  }
  pre {
    padding: 0.7rem;
    border-radius: 0.5rem;
    background: var(--surface-2);
    font-size: 0.75rem;
    white-space: pre-wrap;
    word-break: break-all;
    text-align: start;
  }
  .json {
    max-height: 32rem;
    overflow: auto;
    word-break: normal;
  }
  summary {
    cursor: pointer;
    font-weight: 700;
    font-size: 0.9rem;
  }
</style>
