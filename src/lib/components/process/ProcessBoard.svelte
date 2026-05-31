<script>
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';

  let {
    processes = [],
    selectable = false,
    selectedProcessId = '',
    onSelect
  } = $props();
</script>

{#if processes.length === 0}
  <div class="rounded-lg border border-dashed border-slate-300 bg-white/50 p-6 text-center text-slate-600">
    {$t('process.board.empty')}
  </div>
{:else}
  <div class="grid gap-4">
    {#each processes as process}
      <section class="rounded-lg border border-slate-300 bg-white/80 p-4 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">{process.title}</h3>
            {#if process.description}
              <p class="mt-1 max-w-3xl text-sm text-slate-600">{process.description}</p>
            {/if}
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <a href={'/forum/' + process.mainForumId} class="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700">
              {$t('process.board.forum')} #{process.mainForumId}
            </a>
            {#if selectable}
              <button
                onclick={() => onSelect?.(process)}
                class:selected={selectedProcessId === process.id}
                class="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 selected"
              >
                {$t('process.board.select')}
              </button>
            {/if}
          </div>
        </div>

        <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {#each process.stages as stage}
            <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div class="mb-2 flex items-center justify-between gap-2">
                <h4 class="text-sm font-semibold text-slate-800">
                  {$t(`process.board.stages.${stage.key}`) || stage.label}
                </h4>
                <span class="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600">
                  {stage.items.length}
                </span>
              </div>
              {#if stage.items.length === 0}
                <p class="text-xs text-slate-400">-</p>
              {:else}
                <div class="space-y-2">
                  {#each stage.items as entry}
                    <div class="rounded-md bg-white p-2 shadow-sm">
                      <div class="flex items-center justify-between gap-2">
                        <p class="text-sm font-medium text-slate-900">{entry.title}</p>
                        <span class="text-[10px] uppercase tracking-wide text-slate-500">{entry.type}</span>
                      </div>
                      {#if entry.description}
                        <p class="mt-1 text-xs text-slate-600">{entry.description}</p>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <div class="mt-4 rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white">
          {$t('process.board.next')}: {$t(`process.board.stages.${process.nextExpectedStage}`) || process.nextExpectedStage}
        </div>
      </section>
    {/each}
  </div>
{/if}

<style>
  .selected {
    border-color: rgb(15 23 42);
    background: rgb(15 23 42);
    color: white;
  }
</style>
