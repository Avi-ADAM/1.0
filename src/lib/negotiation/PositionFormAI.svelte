<!-- src/lib/negotiation/PositionFormAI.svelte -->
<!-- טופס הזנת עמדה עם עזרת AI בזמן אמת -->

<script>
  import { t } from '$lib/translations';
  let {
    topic = '',
    positions = [],
    onSubmit = async () => {},
    loading = false
  } = $props();

  let heading = $state('');
  let description = $state('');
  let aiAnalysis = $state(null);
  let aiLoading = $state(false);
  let aiError = $state('');
  let analyzed = $state(false);

  // ניתוח AI לאחר שיש מספיק טקסט
  let analyzeTimeout;
  function onDescriptionChange() {
    clearTimeout(analyzeTimeout);
    analyzed = false;
    aiAnalysis = null;
    if (description.length > 40 && heading.length > 3) {
      analyzeTimeout = setTimeout(analyzeWithAI, 1200);
    }
  }

  async function analyzeWithAI() {
    aiLoading = true;
    aiError = '';
    try {
      const res = await fetch('/negotiation/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_position',
          topic,
          positions,
          newPosition: { heading, description }
        })
      });
      const json = await res.json();
      if (json.success) {
        aiAnalysis = json.data;
        analyzed = true;
      } else {
        aiError = json.error;
      }
    } catch (e) {
      aiError = $t('negotiation.error_communication');
    } finally {
      aiLoading = false;
    }
  }

  async function handleSubmit() {
    if (!heading.trim() || !description.trim()) return;

    // אם עוד לא נותח, נתח תחילה
    let finalAnalysis = aiAnalysis;
    if (!analyzed) {
      await analyzeWithAI();
      finalAnalysis = aiAnalysis;
    }

    await onSubmit({
      heading: heading.trim(),
      description: description.trim(),
      suggestedLocation: finalAnalysis?.location ?? 50,
      aiAnalysis: finalAnalysis
    });

    heading = '';
    description = '';
    aiAnalysis = null;
    analyzed = false;
  }

  function applySuggestion(q) {
    description += (description ? '\n' : '') + q;
    onDescriptionChange();
  }
</script>

<div class="position-form-ai" dir="rtl">
  <!-- כותרת -->
  <div class="mb-4">
    <h3 class="text-base font-bold text-gray-800">
      {$t('negotiation.add_position')}
    </h3>
    <p class="text-xs text-gray-400 mt-0.5">
      {$t('negotiation.ai_will_place')}
    </p>
  </div>

  <!-- שדות קלט -->
  <div class="space-y-3">
    <input
      bind:value={heading}
      oninput={onDescriptionChange}
      placeholder={$t('negotiation.position_title_placeholder')}
      class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white transition-all"
    />

    <textarea
      bind:value={description}
      oninput={onDescriptionChange}
      placeholder={$t('negotiation.position_desc_placeholder')}
      rows="4"
      class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white resize-none transition-all"
    ></textarea>
  </div>

  <!-- AI loading indicator -->
  {#if aiLoading}
    <div class="mt-3 flex items-center gap-2 text-violet-600">
      <div
        class="w-4 h-4 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin"
      ></div>
      <span class="text-xs">{$t('negotiation.ai_analyzing')}</span>
    </div>
  {/if}

  <!-- AI Analysis results -->
  {#if aiAnalysis && !aiLoading}
    <div
      class="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-3"
    >
      <!-- מיקום מוצע בציר -->
      <div>
        <div class="flex justify-between items-center mb-2">
          <span class="text-xs font-semibold text-violet-700"
            >{$t('negotiation.proposed_location')}</span
          >
          <span
            class="text-xs font-mono text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full"
            >{aiAnalysis.location}/100</span
          >
        </div>
        <div class="h-2 bg-violet-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-violet-500 rounded-full transition-all duration-700"
            style="width: {aiAnalysis.location}%"
          ></div>
        </div>
        {#if aiAnalysis.locationRationale}
          <p class="text-xs text-violet-600 mt-1 italic">
            {aiAnalysis.locationRationale}
          </p>
        {/if}
      </div>

      <!-- ממדים שזוהו -->
      {#if aiAnalysis.keyDimensions?.length}
        <div>
          <p class="text-xs font-semibold text-violet-700 mb-2">
            {$t('negotiation.detected_dimensions')}
          </p>
          <div class="space-y-1.5">
            {#each aiAnalysis.keyDimensions as dim}
              <div class="flex items-center gap-2">
                <span
                  class="text-xs text-violet-800 font-medium w-24 shrink-0 truncate"
                  >{dim.name}</span
                >
                <div class="flex-1 h-1.5 bg-violet-100 rounded-full">
                  <div
                    class="h-full bg-violet-400 rounded-full"
                    style="width:{dim.score}%"
                  ></div>
                </div>
                <span class="text-xs text-violet-600 w-20 text-left truncate"
                  >{dim.stance}</span
                >
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- שאלות להבהרה -->
      {#if aiAnalysis.suggestedClarifications?.length}
        <div>
          <p class="text-xs font-semibold text-violet-700 mb-2">
            {$t('negotiation.clarification_questions')}
          </p>
          <div class="space-y-1">
            {#each aiAnalysis.suggestedClarifications as q}
              <button
                onclick={() => applySuggestion(q)}
                class="w-full text-right text-xs text-violet-700 bg-white border border-violet-200 rounded-lg px-3 py-2 hover:bg-violet-100 transition-colors"
              >
                + {q}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- בסיס משותף -->
      {#if aiAnalysis.sharedGroundWith?.length && positions.length > 0}
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs font-semibold text-green-700"
            >{$t('negotiation.shared_ground_with')}</span
          >
          {#each aiAnalysis.sharedGroundWith as idx}
            {#if positions[idx]}
              <span
                class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"
                >{positions[idx].author}</span
              >
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if aiError}
    <p class="text-xs text-red-500 mt-2">{aiError}</p>
  {/if}

  <!-- כפתור שליחה -->
  <button
    onclick={handleSubmit}
    disabled={!heading.trim() || !description.trim() || loading}
    class="mt-4 w-full py-3 rounded-xl font-semibold text-sm transition-all
           bg-violet-600 text-white hover:bg-violet-700 active:scale-95
           disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
  >
    {#if loading}
      <span class="flex items-center justify-center gap-2">
        <div
          class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
        ></div>
        {$t('negotiation.save')}
      </span>
    {:else}
      {analyzed
        ? `📍 ${$t('negotiation.add_position')} (${$t('negotiation.spectrum')}: ${aiAnalysis?.location ?? '?'})`
        : $t('negotiation.add_position')}
    {/if}
  </button>
</div>
