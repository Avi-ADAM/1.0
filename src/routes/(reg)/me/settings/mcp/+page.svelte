<script>
  import McpGuide from '$lib/components/me/McpGuide.svelte';
  import { t, isRtl } from '$lib/translations';
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
    class="text-sm text-gold hover:underline"
  >
    {$t('mcp.back')}
  </a>

  <div class="mt-4">
    <McpGuide />
  </div>
</main>
