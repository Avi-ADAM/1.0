<script>
  import { t } from '$lib/translations';

  /** Renders only when the rikma was not handed over; a hand-over redirects in the loader. */
  let { data } = $props();
</script>

<svelte:head>
  <title>{$t('rikmaImport.receive.title')} · 1💗1</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="mx-auto max-w-xl px-4 py-10 text-start">
  <div class="rounded-2xl border border-surfaceLine bg-surface p-6 text-surfaceInk shadow-sm" role="status">
    <h1 class="text-xl font-bold mb-3">{$t('rikmaImport.receive.title')}</h1>
    <p class="leading-relaxed">
      {#if data.reason === 'otherAccount'}
        {$t('rikmaImport.receive.otherAccount', { email: data.email })}
      {:else}
        {$t(`rikmaImport.receive.${data.reason}`)}
      {/if}
    </p>
    <a href="/lev" class="mt-5 inline-block rounded-xl bg-barbi px-4 py-2 font-semibold text-white">
      {$t('rikmaImport.receive.home')}
    </a>
  </div>
</main>
