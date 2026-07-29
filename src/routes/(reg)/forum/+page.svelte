<script lang="ts">
  import { t } from '$lib/translations';

</script>

<svelte:head>
  <title>פורומים · 1lev1</title>
</svelte:head>

<div class="grid h-full min-h-[60vh] place-items-center p-8 text-center">
  <div class="max-w-md">
    <div class="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full border border-gold/50 bg-gold/10 text-3xl font-black text-gold shadow-lg shadow-fuchsia-500/15">
      1
    </div>
    <h2 class="text-2xl font-black text-gold">{$t('common.forumPage.title')}</h2>
    <p class="mt-3 text-pink-100/75">{$t('common.forumPage.body')}</p>
    <p class="mt-6 rounded-md border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-pink-100/60">
      {$t('common.forumPage.hint')}
    </p>
  </div>
</div>
