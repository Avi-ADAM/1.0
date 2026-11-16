<script>
  import McpGuide from '$lib/components/me/McpGuide.svelte';
  import SettingsRow from '$lib/components/settings/SettingsRow.svelte';
  import { executeAction } from '$lib/client/actionClient';
  import { t, isRtl } from '$lib/translations';

  let { data } = $props();

  // Findable by other people's agents (PLAN_MCP_PARTNER_INTEGRATION P1.5): opt-in,
  // and only the person's own click changes it.
  let findable = $state(data.findable);
  let saving = $state(false);
  let failed = $state(false);

  async function setFindable(next) {
    saving = true;
    failed = false;
    const res = await executeAction('updateUserBasic', { findableByAgents: next });
    saving = false;
    if (res?.success) findable = next;
    else failed = true;
  }
</script>

<svelte:head>
  <title>{$t('mcp.title')} · 1💗1</title>
</svelte:head>

<main
  class="min-h-screen w-full mx-auto max-w-3xl p-4 md:p-8"
  dir={$isRtl ? 'rtl' : 'ltr'}
>
  <a
    href="/me/settings"
    data-sveltekit-prefetch
    class="text-sm text-goldink hover:underline"
  >
    {$t('mcp.back')}
  </a>

  {#if data.findableKnown}
    <div class="mt-4">
      <SettingsRow title="🔎 {$t('mcp.findable.title')}" desc={$t('mcp.findable.desc')}>
        <label class="flex items-start gap-2 text-sm cursor-pointer text-surfaceInk">
          <input
            type="checkbox"
            checked={findable}
            disabled={saving}
            onchange={async (e) => {
              const el = e.currentTarget;
              await setFindable(el.checked);
              el.checked = findable;
            }}
            class="mt-1 shrink-0 accent-barbi"
          />
          <span>{$t('mcp.findable.label')}</span>
        </label>
        <p class="text-xs text-surfaceMuted mt-2">{$t('mcp.findable.shown')}</p>
        {#if failed}
          <p class="text-sm mt-2 text-red-600" role="alert">{$t('mcp.findable.failed')}</p>
        {/if}
      </SettingsRow>
    </div>
  {/if}

  <div class="mt-4">
    <McpGuide />
  </div>
</main>
