<script>
  import { t, isRtl } from '$lib/translations';
  import { invalidateAll } from '$app/navigation';
  import { enhance } from '$app/forms';
  import { executeAction } from '$lib/client/actionClient';
  import GithubIcon from '$lib/celim/icons/github.svelte';
  import { page } from '$app/state';

  let { data } = $props();

  let busyId = $state(null);
  let errorMsg = $state('');

  const OK_NOTICES = ['connected', 'linked'];
  let noticeKey = $derived(data.notice ? `rikmaCode.status.${data.notice}` : '');
  let noticeText = $derived(noticeKey && $t(noticeKey) !== noticeKey ? $t(noticeKey) : '');
  let noticeOk = $derived(OK_NOTICES.includes(data.notice));

  // Runs on the API host; `return` brings the member back to this frontend.
  let connectHref = $derived(
    `${data.connectBase ?? ''}/api/v1/github/connect?intent=install` +
      `&projectId=${encodeURIComponent(data.projectId)}` +
      `&return=${encodeURIComponent(page.url.origin)}`
  );

  // The picker: one repository at a time, whatever GitHub was granted.
  let query = $state('');
  let chosen = $state('');
  let submitting = $state(false);
  let pickRepos = $derived(data.pick?.repos ?? []);
  let shownRepos = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return q ? pickRepos.filter((r) => `${r.owner}/${r.name}`.toLowerCase().includes(q)) : pickRepos;
  });

  async function disconnect(repo) {
    const label = `${repo.owner}/${repo.name}`;
    if (!confirm($t('rikmaCode.disconnectConfirm', { repo: label }))) return;
    busyId = repo.id;
    errorMsg = '';
    const res = await executeAction('disconnectProjectRepo', {
      projectId: String(data.projectId),
      repoRowId: repo.id
    });
    busyId = null;
    if (res.success) await invalidateAll();
    else errorMsg = $t('rikmaCode.disconnectFailed');
  }
</script>

<section class="code-tab" dir={$isRtl ? 'rtl' : 'ltr'}>
  <header class="head">
    <h2>{$t('rikmaCode.title')}</h2>
    <p class="muted">{$t('rikmaCode.intro')}</p>
  </header>

  {#if noticeText}
    <p class="notice" class:ok={noticeOk} role="status">{noticeText}</p>
  {/if}
  {#if errorMsg}
    <p class="notice" role="alert">{errorMsg}</p>
  {/if}

  {#if data.pick}
    <form
      class="picker"
      method="POST"
      action="?/pick"
      use:enhance={() => {
        submitting = true;
        return async ({ update }) => {
          await update();
          submitting = false;
        };
      }}
    >
      <h3>{$t('rikmaCode.pick.title')}</h3>
      {#if pickRepos.length === 0}
        <p class="muted">{$t('rikmaCode.pick.empty')}</p>
        <!-- The App is installed on an account that granted it no repository —
             which is a GitHub-side setting, and only reachable there. -->
        <a class="cancel" href="https://github.com/settings/installations" target="_blank" rel="noopener noreferrer">
          {$t('rikmaCode.pick.manage')}
        </a>
      {:else}
        <p class="muted">{$t('rikmaCode.pick.intro', { count: pickRepos.length })}</p>
        <input type="hidden" name="token" value={data.pick.token} />
        {#if pickRepos.length > 6}
          <input
            class="search"
            type="search"
            bind:value={query}
            placeholder={$t('rikmaCode.pick.search')}
            aria-label={$t('rikmaCode.pick.search')}
          />
        {/if}
        {#if shownRepos.length === 0}
          <p class="muted small">{$t('rikmaCode.pick.noMatch')}</p>
        {:else}
          <ul class="pick-list">
            {#each shownRepos as repo (repo.repoId)}
              <li>
                <label class="pick-row" class:unavailable={repo.pick !== 'available'}>
                  <input
                    type="radio"
                    name="repoId"
                    value={repo.repoId}
                    bind:group={chosen}
                    disabled={repo.pick !== 'available'}
                  />
                  <bdi class="repo-name" dir="ltr">{repo.owner}/{repo.name}</bdi>
                  {#if repo.isPrivate}<span class="chip">{$t('rikmaCode.private')}</span>{/if}
                  {#if repo.pick === 'here'}<span class="chip">{$t('rikmaCode.pick.here')}</span>{/if}
                  {#if repo.pick === 'elsewhere'}<span class="chip warn">{$t('rikmaCode.pick.elsewhere')}</span>{/if}
                </label>
              </li>
            {/each}
          </ul>
        {/if}
      {/if}
      <div class="pick-actions">
        {#if pickRepos.length > 0}
          <button class="connect" type="submit" disabled={!chosen || submitting}>
            <GithubIcon width={18} />
            {$t('rikmaCode.pick.connect')}
          </button>
        {/if}
        <a class="cancel" href={page.url.pathname}>{$t('rikmaCode.pick.cancel')}</a>
      </div>
    </form>
  {:else if data.configured}
    <a class="connect" href={connectHref} data-sveltekit-reload>
      <GithubIcon width={18} />
      {data.repos.length ? $t('rikmaCode.connectMore') : $t('rikmaCode.connect')}
    </a>
    <p class="muted small">{$t('rikmaCode.connectTip')}</p>
  {:else}
    <p class="muted">{$t('rikmaCode.notConfigured')}</p>
  {/if}

  {#if data.repos.length === 0}
    <p class="empty">{$t('rikmaCode.empty')}</p>
  {:else}
    <ul class="repos">
      {#each data.repos as repo (repo.id)}
        <li class="repo">
          <div class="repo-main">
            <a class="repo-name" href={repo.url} target="_blank" rel="noopener noreferrer">
              <bdi dir="ltr">{repo.owner}/{repo.name}</bdi>
            </a>
            <div class="chips">
              {#if repo.isPrivate}<span class="chip">{$t('rikmaCode.private')}</span>{/if}
              {#if repo.status === 'suspended'}<span class="chip warn">{$t('rikmaCode.suspended')}</span>{/if}
              {#if repo.defaultBranch}
                <span class="chip">{$t('rikmaCode.branch', { branch: repo.defaultBranch })}</span>
              {/if}
              {#if repo.license}<span class="chip"><bdi dir="ltr">{repo.license}</bdi></span>{/if}
            </div>
            {#if repo.connectedBy}
              <span class="muted small">{$t('rikmaCode.connectedBy', { name: repo.connectedBy })}</span>
            {/if}
          </div>
          <button class="disconnect" onclick={() => disconnect(repo)} disabled={busyId === repo.id}>
            {$t('rikmaCode.disconnect')}
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  {#if data.repos.length > 0}
    <p class="muted small">{$t('rikmaCode.issuesHint', { label: data.issueLabel })}</p>
  {/if}

  <p class="muted small next">{$t('rikmaCode.next')}</p>
</section>

<style>
  .code-tab {
    max-width: 48rem;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .head h2 {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--gold);
  }
  .muted {
    color: #cbd5e1;
  }
  .small {
    font-size: 0.8rem;
  }
  .notice {
    padding: 0.6rem 0.9rem;
    border-radius: 0.6rem;
    border: 1px solid rgba(248, 113, 113, 0.6);
    background: rgba(127, 29, 29, 0.35);
    color: #fecaca;
  }
  .notice.ok {
    border-color: rgba(74, 222, 128, 0.6);
    background: rgba(20, 83, 45, 0.35);
    color: #bbf7d0;
  }
  .connect {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1.1rem;
    border-radius: 9999px;
    background: var(--gold);
    color: #0f172a;
    font-weight: 700;
    text-decoration: none;
  }
  .connect:hover:not(:disabled),
  .connect:focus-visible {
    filter: brightness(1.08);
  }
  .connect:disabled {
    opacity: 0.5;
  }
  .picker {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 0.75rem;
    border: 1px solid var(--gold);
    background: rgba(15, 23, 42, 0.55);
  }
  .picker h3 {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--gold);
  }
  .search {
    padding: 0.45rem 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(203, 213, 225, 0.35);
    background: rgba(15, 23, 42, 0.8);
    color: #e2e8f0;
  }
  .pick-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    max-height: 22rem;
    overflow-y: auto;
  }
  .pick-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.45rem 0.6rem;
    border-radius: 0.5rem;
    cursor: pointer;
  }
  .pick-row:hover:not(.unavailable) {
    background: rgba(203, 213, 225, 0.08);
  }
  .pick-row.unavailable {
    opacity: 0.6;
    cursor: default;
  }
  .pick-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .cancel {
    color: #e2e8f0;
    text-decoration: underline;
  }
  .empty {
    padding: 1.25rem;
    border: 1px dashed rgba(203, 213, 225, 0.4);
    border-radius: 0.75rem;
    color: #cbd5e1;
    text-align: center;
  }
  .repos {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .repo {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    padding: 0.8rem 1rem;
    border-radius: 0.75rem;
    border: 1px solid rgba(203, 213, 225, 0.25);
    background: rgba(15, 23, 42, 0.55);
  }
  .repo-main {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
  }
  .repo-name {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-weight: 700;
    color: var(--gold);
    overflow-wrap: anywhere;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .chip {
    font-size: 0.72rem;
    padding: 0.1rem 0.5rem;
    border-radius: 9999px;
    border: 1px solid rgba(203, 213, 225, 0.35);
    color: #e2e8f0;
  }
  .chip.warn {
    border-color: rgba(251, 191, 36, 0.7);
    color: #fde68a;
  }
  .disconnect {
    padding: 0.35rem 0.9rem;
    border-radius: 9999px;
    border: 1px solid rgba(203, 213, 225, 0.45);
    color: #e2e8f0;
  }
  .disconnect:hover:not(:disabled) {
    border-color: #fca5a5;
    color: #fecaca;
  }
  .disconnect:disabled {
    opacity: 0.5;
  }
  .next {
    border-top: 1px solid rgba(203, 213, 225, 0.2);
    padding-top: 0.75rem;
  }
</style>
