<script>
  import { page } from '$app/state';
  import MissionOffersEditor from '$lib/components/offerings/MissionOffersEditor.svelte';
  import { t, isRtl } from '$lib/translations';

  /**
   * The expanded missions page behind the profile badge: priced offers
   * (editable), missions in progress, and completed missions with the
   * rising ✓×N verification tag.
   */

  let { data } = $props();
  const autoOpen = page.url.searchParams.get('new') === '1';
</script>

<svelte:head>
  <title>{$t('offerings.page.title')}</title>
</svelte:head>

<div
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="max-w-md pb-20 mx-auto px-3 py-4 space-y-4"
>
  <header class="text-center">
    <h1 class="text-2xl font-extrabold text-barbi">
      🛠️ {$t('offerings.page.title')}
    </h1>
    <p class="text-sm text-gray-500 dark:text-gray-400">
      {$t('offerings.page.sub')}
    </p>
  </header>

  <MissionOffersEditor uid={data.uid} {autoOpen} />

  <!-- In progress -->
  <section
    class="rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
  >
    <div class="px-4 py-2.5 bg-gradient-to-l from-barbi to-mpink text-white">
      <h2 class="font-bold">⏳ {$t('offerings.page.doing')}</h2>
    </div>
    <div class="p-3 space-y-2 max-h-72 overflow-y-auto d">
      {#if data.doing.length === 0}
        <p class="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
          {$t('offerings.page.empty_doing')}
        </p>
      {:else}
        {#each data.doing as m (m.id)}
          <div
            class="rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2 flex items-center justify-between gap-2"
          >
            <span class="min-w-0">
              <span
                class="block font-semibold text-gray-900 dark:text-gray-100 truncate"
                >{m.name}</span
              >
              {#if m.projectName}
                <a
                  class="text-xs text-gray-500 dark:text-gray-400 hover:text-barbi"
                  href={`/moach/${m.projectId}/main`}
                >
                  🧬 {m.projectName}
                </a>
              {/if}
            </span>
            {#if m.hours}
              <span class="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                {m.hoursDone ?? 0}/{m.hours}
                {$t('offerings.page.hours_done')}
              </span>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </section>

  <!-- Completed, with rising verification counts -->
  <section
    class="rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
  >
    <div
      class="px-4 py-2.5 bg-gradient-to-l from-emerald-600 to-emerald-400 text-white"
    >
      <h2 class="font-bold">✅ {$t('offerings.page.done')}</h2>
    </div>
    <div class="p-3 flex flex-wrap gap-2 max-h-72 overflow-y-auto d">
      {#if data.doneCounts.length === 0}
        <p
          class="text-sm text-gray-500 dark:text-gray-400 text-center w-full py-2"
        >
          {$t('offerings.page.empty_done')}
        </p>
      {:else}
        {#each data.doneCounts as d (d.name)}
          <span
            class="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 text-sm font-semibold text-emerald-800 dark:text-emerald-200"
            title={`${d.count} ${$t('offerings.page.times')}`}
          >
            {d.name}
            <span
              class="bg-emerald-500 text-white rounded-full px-1.5 text-xs leading-5 min-w-5 text-center"
            >
              ✓{d.count}
            </span>
          </span>
        {/each}
      {/if}
    </div>
  </section>
</div>
