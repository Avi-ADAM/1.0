<script lang="ts">
  /**
   * "Which issue or PR did you work on?" — inside the timer's save dialog
   * (PLAN_CODE_RIKMA §4.2).
   *
   * The rikma's connected repositories are asked for their recent issues and
   * pull requests; picking one toggles its canonical URL among the timer's
   * links, so the hours and the code point at each other with no new field.
   * A rikma without repositories — most of them — gets an empty answer and
   * this renders nothing at all, not even a loading line.
   */
  import { t } from '$lib/translations';
  import { parseGithubRef, sameGithubRef, type GithubRef } from '$lib/github/refs';
  import { matchesWorkItem, type WorkItem } from '$lib/github/workItems';

  let {
    projectId,
    links,
    onToggle
  }: {
    projectId: string | number | null | undefined;
    links: string[];
    onToggle: (url: string) => void;
  } = $props();

  let items = $state<WorkItem[]>([]);
  let ready = $state(false);
  let query = $state('');

  $effect(() => {
    const pid = String(projectId ?? '');
    ready = false;
    if (!/^\d+$/.test(pid)) return;
    const controller = new AbortController();
    fetch(`/api/v1/github/work-items?projectId=${encodeURIComponent(pid)}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        items = Array.isArray(body?.items) ? body.items : [];
        ready = items.length > 0;
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') console.warn('[GithubWorkPicker] could not load work items', error);
      });
    return () => controller.abort();
  });

  let selected = $derived(links.map(parseGithubRef).filter((r): r is GithubRef => r !== null));
  let shown = $derived(items.filter((item) => matchesWorkItem(item, query)));

  function isSelected(item: WorkItem): boolean {
    const ref: GithubRef = { owner: item.owner, repo: item.repo, kind: item.kind, number: item.number };
    return selected.some((r) => sameGithubRef(r, ref));
  }

  function onSearchKey(event: KeyboardEvent) {
    // Enter inside the dialog would otherwise submit/close it.
    if (event.key === 'Enter') event.preventDefault();
  }
</script>

{#if ready}
  <div class="gh-pick">
    <span class="gh-pick-title">{$t('timers.githubTitle')}</span>
    <p class="gh-pick-hint">{$t('timers.githubHint')}</p>

    {#if items.length > 5}
      <input
        class="gh-pick-search"
        type="search"
        bind:value={query}
        onkeydown={onSearchKey}
        placeholder={$t('timers.githubSearch')}
        aria-label={$t('timers.githubSearch')}
      />
    {/if}

    <ul class="gh-pick-list">
      {#each shown as item (item.url)}
        {@const on = isSelected(item)}
        <li>
          <button type="button" class="gh-pick-row" class:on aria-pressed={on} onclick={() => onToggle(item.url)}>
            <span class="gh-pick-kind">{item.kind === 'pull' ? $t('timers.githubPull') : $t('timers.githubIssue')}</span>
            <bdi class="gh-pick-ref" dir="ltr">{item.repo}#{item.number}</bdi>
            <bdi class="gh-pick-name">{item.title}</bdi>
            {#if item.state !== 'open'}
              <span class="gh-pick-state">
                {item.state === 'merged' ? $t('timers.githubMerged') : $t('timers.githubClosed')}
              </span>
            {/if}
          </button>
        </li>
      {:else}
        <li class="gh-pick-empty">{$t('timers.githubNoMatch')}</li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  /* Drawn on the save dialog's own dark glass; the business skin below
     repaints it off the page's surface tokens, like the rest of the dialog. */
  .gh-pick {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .gh-pick-title {
    font-size: 0.95rem;
    color: #00ffff;
  }

  .gh-pick-hint {
    margin: 0;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.55);
  }

  .gh-pick-search {
    padding: 0.45rem 0.55rem;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.25);
    color: #fff;
    font: inherit;
  }

  .gh-pick-search:focus {
    outline: none;
    border-color: #00ffff;
  }

  .gh-pick-list {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    max-height: 11rem;
    overflow-y: auto;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .gh-pick-row {
    display: flex;
    align-items: baseline;
    gap: 0.45rem;
    width: 100%;
    padding: 0.4rem 0.55rem;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    font: inherit;
    font-size: 0.82rem;
    text-align: start;
    cursor: pointer;
  }

  .gh-pick-row:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .gh-pick-row:focus-visible {
    outline: 2px solid #00ffff;
    outline-offset: 1px;
  }

  .gh-pick-row.on {
    border-color: #00ffff;
    background: rgba(0, 255, 255, 0.14);
  }

  .gh-pick-kind,
  .gh-pick-state {
    flex: none;
    font-size: 0.68rem;
    padding: 0 0.35rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: rgba(255, 255, 255, 0.8);
  }

  .gh-pick-ref {
    flex: none;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    color: #7ee0ff;
  }

  .gh-pick-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1 1 auto;
  }

  .gh-pick-empty {
    font-size: 0.8rem;
    opacity: 0.7;
    padding: 0.25rem 0.5rem;
  }

  :global(html.business) .gh-pick-title,
  :global(html.business) .gh-pick-hint,
  :global(html.business) .gh-pick-kind,
  :global(html.business) .gh-pick-state {
    color: var(--surface-muted);
  }
  :global(html.business) .gh-pick-search,
  :global(html.business) .gh-pick-row {
    background: var(--surface-2);
    border-color: var(--input, var(--surface-line));
    color: var(--surface-ink);
  }
  :global(html.business) .gh-pick-kind,
  :global(html.business) .gh-pick-state {
    border-color: var(--surface-line);
  }
  :global(html.business) .gh-pick-ref {
    color: var(--goldink);
  }
  :global(html.business) .gh-pick-row.on,
  :global(html.business) .gh-pick-search:focus {
    border-color: var(--barbi-pink);
  }
  :global(html.business) .gh-pick-row:focus-visible {
    outline-color: var(--barbi-pink);
  }
</style>
