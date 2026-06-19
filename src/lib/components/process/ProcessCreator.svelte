<script>
  import { createProcess } from '$lib/client/actionClient';
  import { lang } from '$lib/stores/lang.js';
  import { t, isRtl} from '$lib/translations';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { Button } from '$lib/components/ui/button';

  let {
    projectId,
    processes = [],
    selectedProcessId = $bindable(''),
    onCreated,
    onSelect
  } = $props();

  let name = $state('');
  let description = $state('');
  let loading = $state(false);
  let error = $state('');


  async function submit() {
    if (!name.trim()) {
      error = $lang === 'he' ? 'צריך שם לתהליך.' : 'Process name is required.';
      return;
    }

    loading = true;
    error = '';

    try {
      const result = await createProcess({
        projectId: String(projectId),
        name: name.trim(),
        description: description.trim()
      });

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to create process');
      }

      onCreated?.(result.data);
      name = '';
      description = '';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create process';
    } finally {
      loading = false;
    }
  }
</script>

<div
  class="rounded-lg border border-gold bg-white/80 p-4 text-start shadow-sm"
  dir={$isRtl ? 'rtl' : 'ltr'}
>
  <div class="mb-4">
    <h3 class="text-lg font-semibold text-barbi">{$t('process.creator.title')}</h3>
    <p class="text-sm text-barbi/70">{$t('process.creator.subtitle')}</p>
  </div>

  <div class="grid gap-4">
    <label class="grid gap-1 text-sm font-medium text-barbi">
      <span>{$t('process.creator.name')}</span>
      <input
        bind:value={name}
        class="rounded-md border border-gold/50 px-3 py-2 text-barbi focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40"
      />
    </label>

    <div class="grid gap-1 text-sm font-medium text-barbi">
      <span>{$t('process.creator.description')}</span>
      <RichText bind:outpot={description} sml={true} />
    </div>
  </div>

  {#if error}
    <p class="mt-3 text-sm text-rose-500">{error}</p>
  {/if}

  <div class="mt-4 flex justify-center">
    <Button
      onclick={submit}
      {loading}
      disabled={loading}
      class="border border-gold bg-barbi text-white hover:bg-barbi/80"
    >
      {$t('process.creator.create')}
    </Button>
  </div>

  {#if processes.length > 0}
    <div class="mt-6 border-t border-gold/30 pt-4">
      <h4 class="mb-3 text-sm font-semibold text-barbi">
        {$t('process.creator.pickExisting')}
      </h4>
      <div class="grid gap-2">
        {#each processes as process}
          <button
            onclick={() => {
              selectedProcessId = process.id;
              onSelect?.(process);
            }}
            class:selected={selectedProcessId === process.id}
            class="process-card rounded-md border border-gold/40 px-3 py-3 text-start transition hover:border-gold hover:bg-gold/5"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="font-medium text-barbi">{process.title}</p>
                {#if process.description}
                  <p class="mt-1 line-clamp-2 text-sm text-barbi/60">
                    {process.description}
                  </p>
                {/if}
              </div>
              <span
                class="rounded-full border border-gold/50 bg-gold/10 px-2 py-1 text-xs text-barbi"
                >{$t('process.creator.useThis')}</span
              >
            </div>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .process-card.selected {
    border-color: #d4af37;
    background: rgba(212, 175, 55, 0.08);
  }
</style>
