<!-- src/lib/negotiation/DimensionsView.svelte -->
<!-- טבלת ממדים - תצוגת השוואה בין עמדות לפי ממדים -->

<script>
  import { t } from '$lib/translations';
  let { dimensions = [], positions = [], loading = false } = $props();

  // מצב פרוס/מכווץ לכל ממד (חשוב למובייל)
  let expanded = $state({});

  function toggleDimension(dimId) {
    expanded[dimId] = !expanded[dimId];
  }

  function scoreToColor(score) {
    if (score < 20) return 'bg-blue-100 text-blue-800';
    if (score < 40) return 'bg-cyan-100 text-cyan-800';
    if (score < 60) return 'bg-amber-100 text-amber-800';
    if (score < 80) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  }

  function scoreToBar(score) {
    return `width: ${score}%`;
  }
</script>

<div class="dimensions-view w-full" dir="rtl">
  {#if loading}
    <div class="flex flex-col items-center py-10 gap-3">
      <div class="relative w-12 h-12">
        <div
          class="absolute inset-0 rounded-full border-4 border-violet-200"
        ></div>
        <div
          class="absolute inset-0 rounded-full border-4 border-t-violet-600 animate-spin"
        ></div>
      </div>
      <p class="text-sm text-gray-500 animate-pulse">
        {$t('negotiation.ai_analyzing_dimensions')}
      </p>
    </div>
  {:else if dimensions.length === 0}
    <div class="text-center py-8 text-gray-400">
      <div class="text-4xl mb-2">🔍</div>
      <p class="text-sm">{$t('negotiation.add_min_2_positions')}</p>
    </div>
  {:else}
    <!-- כרטיסי ממדים - layout לפי מובייל -->
    <div class="space-y-3">
      {#each dimensions as dim}
        {@const isOpen = expanded[dim.id]}
        <div
          class="dimension-card rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
        >
          <!-- כותרת הממד - תמיד גלויה -->
          <button
            class="w-full flex items-center justify-between p-4 text-right hover:bg-gray-50 transition-colors"
            onclick={() => toggleDimension(dim.id)}
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-gray-800 text-sm"
                  >{dim.name}</span
                >
              </div>
              <div class="flex items-center gap-2 mt-1 text-xs text-gray-400">
                <span class="truncate">{dim.leftLabel}</span>
                <span class="shrink-0">↔</span>
                <span class="truncate">{dim.rightLabel}</span>
              </div>
            </div>
            <div class="shrink-0 mr-3">
              <span
                class="text-gray-400 text-lg transition-transform duration-200 inline-block"
                style="transform: rotate({isOpen ? '90deg' : '0deg'})">›</span
              >
            </div>
          </button>

          <!-- פרטי הממד - נפתח בלחיצה -->
          {#if isOpen}
            <div class="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
              {#if dim.description}
                <p class="text-xs text-gray-500">{dim.description}</p>
              {/if}

              <!-- עמדות בממד הזה -->
              {#each positions as pos, idx}
                {@const stance = dim.positionStances?.[String(idx)]}
                {#if stance}
                  <div class="space-y-1">
                    <div class="flex justify-between items-center">
                      <span
                        class="text-xs font-medium text-gray-600 truncate max-w-[60%]"
                        >{pos.author}</span
                      >
                      <span
                        class="text-xs {scoreToColor(
                          stance.score
                        )} px-2 py-0.5 rounded-full font-mono"
                        >{stance.score}</span
                      >
                    </div>
                    <!-- פס ויזואלי -->
                    <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        style="{scoreToBar(
                          stance.score
                        )}; background: linear-gradient(90deg, #6366f1, #8b5cf6);"
                      ></div>
                    </div>
                    <p class="text-xs text-gray-500 italic">
                      "{stance.stance}"
                    </p>
                  </div>

                  {#if idx < positions.length - 1}
                    <div class="border-t border-gray-100"></div>
                  {/if}
                {/if}
              {/each}

              <!-- ציר הממד -->
              <div class="mt-2 pt-2 border-t border-gray-200">
                <div class="flex justify-between text-xs text-gray-400 mb-1">
                  <span>◀ {dim.leftLabel}</span>
                  <span>{dim.rightLabel} ▶</span>
                </div>
                <div
                  class="relative h-4 bg-gradient-to-l from-red-100 to-blue-100 rounded-full"
                >
                  {#each positions as pos, idx}
                    {@const stance = dim.positionStances?.[String(idx)]}
                    {#if stance}
                      <div
                        class="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                        style="right: {stance.score}%; background: {[
                          '#6366f1',
                          '#8b5cf6',
                          '#06b6d4',
                          '#10b981',
                          '#f59e0b',
                          '#ef4444',
                          '#ec4899'
                        ][idx % 7]};"
                        title="{pos.author}: {stance.score}"
                      ></div>
                    {/if}
                  {/each}
                </div>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .dimension-card {
    transition: box-shadow 0.2s ease;
  }
  .dimension-card:focus-within {
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
  }
</style>
