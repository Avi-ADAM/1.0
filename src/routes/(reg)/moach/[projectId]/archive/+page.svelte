<script>
  /**
   * The rikma's archive. Removing an object never destroys it — the record of
   * what left, why, and what happened to the hours has to remain visible, or
   * "archive" quietly becomes "delete".
   */
  import { page } from '$app/state';
  import { t } from '$lib/translations';
  import { buildArchiveEntries } from '$lib/archive/archiveScreen.js';

  let { data } = $props();

  const projectId = $derived(page.params.projectId);
  const entries = $derived(buildArchiveEntries(data.archived));
  const projectName = $derived(data.archived?.projectName ?? '');

  function fmt(date) {
    if (!date) return '';
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  }
</script>

<svelte:head>
  <title>{projectName ? `${projectName} · ` : ''}{$t('archive.screen.title')} · 1lev1</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-6 space-y-4">
  <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
    {$t('archive.screen.title')}
  </h1>

  {#if entries.length === 0}
    <p class="text-gray-500">{$t('archive.screen.empty')}</p>
  {:else}
    <ul class="space-y-3">
      {#each entries as entry (entry.key)}
        <li
          class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {entry.name}
              </p>
              <p class="text-xs text-gray-500">
                {$t(`archive.card.target.${entry.targetKind}`)}
                {#if entry.ownerName} · {entry.ownerName}{/if}
              </p>
            </div>
            <span
              class="shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              {entry.lifecycle === 'released'
                ? $t('archive.chip.released')
                : $t('archive.chip.archived')}
            </span>
          </div>

          {#if entry.why}
            <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">{entry.why}</p>
          {/if}

          <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>{$t('archive.screen.when', { date: fmt(entry.at) })}</span>
            {#if entry.hoursCredited != null}
              <span>{$t('archive.screen.hoursCredited', { count: entry.hoursCredited })}</span>
            {/if}
            {#if entry.hoursOutcome}
              <span>{$t(`archive.hours.${entry.hoursOutcome}`)}</span>
            {/if}
            {#if entry.endsMembership}
              <span class="text-amber-700 dark:text-amber-300">
                {$t('archive.membership.ended')}
              </span>
            {/if}
          </div>

          {#if entry.decisionId}
            <a
              href={`/moach/${projectId}/votes/decision/${entry.decisionId}`}
              class="mt-2 inline-block text-xs underline text-gray-500"
            >
              {$t('archive.screen.openDecision')}
            </a>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>
