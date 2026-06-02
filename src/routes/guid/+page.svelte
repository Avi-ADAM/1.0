<script>
  import { t, locale } from '$lib/translations';

  let isRTL = $derived($locale === 'ar' || $locale === 'he');

  const stepsKeys = [
    'open_rikma',
    'create_task',
    'approval_process',
    'automatic_approval',
    'execution_timers',
    'archiving'
  ];

  const glossaryKeys = ['pendm', 'rikma', 'decision_time'];
</script>

<svelte:head>
  <title>{$t('guide.title')}</title>
</svelte:head>

<div
  class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
  dir={isRTL ? 'rtl' : 'ltr'}
>
  <div class="max-w-5xl mx-auto">
    <header class="text-center mb-16">
      <h1 class="text-4xl font-extrabold text-gray-900 sm:text-5xl">
        {$t('guide.title')}
      </h1>
      <p class="mt-4 text-xl text-gray-600">
        {$t('guide.glossary.rikma_desc')}
      </p>
    </header>

    <!-- Glossary Section -->
    <section class="bg-white shadow overflow-hidden sm:rounded-lg mb-12">
      <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h2 class="text-2xl leading-6 font-bold text-gray-900">
          {$t('guide.glossary.title')}
        </h2>
      </div>
      <div class="px-4 py-5 sm:p-6 bg-gray-50">
        <dl class="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
          {#each glossaryKeys as key}
            <div class="sm:col-span-1">
              <dt class="text-sm font-medium text-gray-500">
                {$t(`guide.glossary.${key}_label`)}
              </dt>
              <dd class="mt-1 text-sm text-gray-900">
                {$t(`guide.glossary.${key}_desc`)}
              </dd>
            </div>
          {/each}
        </dl>
      </div>
    </section>

    <!-- Human and AI Guides -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <!-- Human Column -->
      <div class="space-y-8">
        <h2 class="text-3xl font-bold text-pink-600 flex items-center gap-2">
          <span>👤</span>
          {$t('guide.human_section')}
        </h2>

        {#each stepsKeys as key}
          <div
            class="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-pink-500"
          >
            <h3 class="text-xl font-bold text-gray-800 mb-3">
              {$t(`guide.steps.${key}.title`)}
            </h3>
            <p class="text-gray-600 leading-relaxed">
              {$t(`guide.steps.${key}.human`)}
            </p>

            <div
              class="mt-6 aspect-video bg-pink-50 border-2 border-dashed border-pink-200 rounded-xl flex items-center justify-center text-pink-400 font-medium"
            >
              <div class="text-center p-4">
                <p>📸</p>
                <p class="text-xs mt-2">
                  {$t(`guide.steps.${key}.screenshot_placeholder`)}
                </p>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- AI Column -->
      <div class="space-y-8">
        <h2 class="text-3xl font-bold text-blue-600 flex items-center gap-2">
          <span>🤖</span>
          {$t('guide.ai_section')}
        </h2>

        {#each stepsKeys as key}
          <div
            class="bg-gray-900 p-6 rounded-2xl shadow-lg border-l-4 border-blue-500 text-gray-100"
          >
            <h3 class="text-xl font-bold text-blue-300 mb-3">
              {$t(`guide.steps.${key}.title`)}
            </h3>
            <p class="text-gray-300 leading-relaxed font-mono text-sm">
              {$t(`guide.steps.${key}.ai`)}
            </p>

            <div
              class="mt-6 aspect-video bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center text-gray-500 font-mono text-xs"
            >
              <div class="text-center p-4">
                <p>🔍 SYSTEM_VISUAL_REF</p>
                <p class="mt-2">
                  {$t(`guide.steps.${key}.screenshot_placeholder`)}
                </p>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <footer class="mt-20 text-center text-gray-500 text-sm">
      <p>1💗1 - Create Together, Harmoniously</p>
    </footer>
  </div>
</div>

<style>
  :global(body) {
    background-color: #f9fafb;
  }
</style>
