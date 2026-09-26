<script>
  import { t } from '$lib/translations';
  import AssistantPanel from '$lib/components/assistant/AssistantPanel.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>{$t('assistant.profileTitle')} · 1💗1</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="mx-auto max-w-3xl p-4 flex flex-col gap-4 text-[color:var(--ramp-ink,#16131b)]">
  <header class="flex flex-col gap-1">
    <h1 class="text-2xl font-bold">{$t('assistant.profileTitle')}</h1>
    <p class="text-sm">{$t('assistant.profileSub')}</p>
  </header>

  {#if data.session}
    {#key data.session.sessionId}
      <AssistantPanel session={data.session} />
    {/key}
  {:else}
    <p class="rounded-xl border border-red-300 bg-red-50 p-3 text-sm" role="alert">{$t('assistant.error')}</p>
    <a class="underline" href="/onboard">{$t('assistant.backToOnboarding')}</a>
  {/if}
</main>
