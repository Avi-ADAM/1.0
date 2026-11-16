<!-- src/routes/mcp-connect/+page.svelte — the consent screen an agent's user sees
     first (CLI and OAuth alike). Every word goes through $t('mcp.connect.*'); the
     server hands back error *keys*, never sentences. -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { t, isRtl } from '$lib/translations';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const errorKey = $derived(form?.errorKey ?? data.errorKey ?? null);
</script>

<div
  class="min-h-screen flex items-center justify-center bg-gray-50 px-4"
  dir={$isRtl ? 'rtl' : 'ltr'}
>
  <div class="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
    {#if data.errorKey}
      <p class="text-4xl mb-3" aria-hidden="true">⚠️</p>
      <p class="font-semibold text-red-600">{$t(`mcp.connect.errors.${data.errorKey}`)}</p>
    {:else}
      <p class="text-5xl mb-4" aria-hidden="true">🤖</p>
      <h1 class="text-xl font-bold mb-2">{$t('mcp.connect.title')}</h1>
      <p class="text-gray-600 text-sm mb-2">
        {$t('mcp.connect.greeting', { userName: data.userName ?? '' })}
      </p>
      <p class="text-gray-600 text-sm mb-2">
        {#if data.clientName}
          {$t('mcp.connect.askNamed', { clientName: data.clientName })}
        {:else}
          {$t('mcp.connect.askAnon')}
        {/if}
      </p>
      <p class="text-gray-500 text-xs mb-6">{$t('mcp.connect.canDo')}</p>

      <div
        class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-6 text-start"
      >
        <strong>{$t('mcp.connect.noteLabel')}</strong>
        {#if data.hasMcpKey}
          {$t('mcp.connect.replaceNote')}
        {:else}
          {$t('mcp.connect.newNote')}
          <a href="/me/settings/mcp" class="underline">{$t('mcp.connect.settingsLink')}</a>.
        {/if}
      </div>

      {#if errorKey}
        <p class="text-sm text-red-600 mb-4" role="alert">
          {$t(`mcp.connect.errors.${errorKey}`)}
        </p>
      {/if}

      <form method="POST" use:enhance>
        <input type="hidden" name="callback" value={data.callback} />
        <input type="hidden" name="oauth" value={data.oauth ?? ''} />
        <div class="flex gap-3">
          <button
            type="submit"
            class="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            {$t('mcp.connect.approve')}
          </button>
          <a
            href="/"
            class="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 transition text-sm flex items-center justify-center"
          >
            {$t('mcp.connect.cancel')}
          </a>
        </div>
      </form>
    {/if}
  </div>
</div>
