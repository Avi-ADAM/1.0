<!-- src/lib/negotiation/RoundFeedback.svelte -->
<!-- משוב AI לפני המעבר לסבב הבא -->

<script>
  import { t } from '$lib/translations';
  let {
    topic = '',
    positions = [],
    userPosition = null,
    currentRound = 1,
    maxRounds = 3,
    onContinue = () => {},
    onClose = () => {}
  } = $props();

  let feedback = $state(null);
  let loading = $state(true);
  let error = $state('');

  $effect(() => {
    if (userPosition) loadFeedback();
  });

  async function loadFeedback() {
    loading = true;
    error = '';
    try {
      const res = await fetch('/negotiation/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'round_feedback',
          topic,
          positions,
          userPosition,
          currentRound
        })
      });
      const json = await res.json();
      if (json.success) {
        feedback = json.data;
      } else {
        error = json.error;
      }
    } catch (e) {
      error = $t('negotiation.error_loading');
    } finally {
      loading = false;
    }
  }

  function directionIcon(dir) {
    if (dir === -1) return $t('negotiation.direction_left');
    if (dir === 1) return $t('negotiation.direction_right');
    return $t('negotiation.direction_stay');
  }
</script>

<!-- overlay -->
<div
  class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
  dir="rtl"
>
  <div
    class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
  >
    <!-- header -->
    <div
      class="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 rounded-t-2xl flex justify-between items-center"
    >
      <div>
        <h2 class="font-bold text-gray-800">
          {$t('negotiation.round_summary')}
          {currentRound}
        </h2>
        <p class="text-xs text-gray-400">
          {$t('negotiation.feedback_before_next_round')}
          {currentRound + 1}
        </p>
      </div>
      <button
        onclick={onClose}
        class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >×</button
      >
    </div>

    <div class="p-5 space-y-5">
      {#if loading}
        <div class="flex flex-col items-center py-10 gap-3">
          <div class="relative w-14 h-14">
            <div
              class="absolute inset-0 rounded-full border-4 border-violet-100"
            ></div>
            <div
              class="absolute inset-0 rounded-full border-4 border-t-violet-500 animate-spin"
            ></div>
            <div
              class="absolute inset-0 flex items-center justify-center text-xl"
            >
              🤖
            </div>
          </div>
          <p class="text-sm text-gray-500">
            {$t('negotiation.ai_preparing_feedback')}
          </p>
        </div>
      {:else if error}
        <div class="text-center py-6">
          <p class="text-red-500 text-sm">{error}</p>
          <button
            onclick={loadFeedback}
            class="mt-3 text-violet-600 text-sm hover:underline"
            >{$t('negotiation.retry')}</button
          >
        </div>
      {:else if feedback}
        <!-- summary -->
        <div class="bg-violet-50 rounded-xl p-4">
          <p class="text-sm text-violet-800 leading-relaxed">
            {feedback.summary}
          </p>
        </div>

        <!-- strengths -->
        {#if feedback.strengths?.length}
          <div>
            <h3 class="text-sm font-semibold text-gray-700 mb-2">
              ✅ {$t('negotiation.position_strengths')}
            </h3>
            <ul class="space-y-1.5">
              {#each feedback.strengths as s}
                <li
                  class="text-xs text-gray-600 bg-green-50 rounded-lg px-3 py-2 border border-green-100"
                >
                  {s}
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        <!-- bridge opportunities -->
        {#if feedback.bridgeOpportunities?.length}
          <div>
            <h3 class="text-sm font-semibold text-gray-700 mb-2">
              🤝 {$t('negotiation.bridge_opportunities')}
            </h3>
            <div class="space-y-3">
              {#each feedback.bridgeOpportunities as bridge}
                <div
                  class="border border-amber-200 rounded-xl p-4 bg-amber-50 space-y-2"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-medium text-amber-800"
                      >{$t('negotiation.with')} {bridge.author}</span
                    >
                  </div>
                  <p class="text-xs text-amber-700">
                    <strong>{$t('negotiation.common_ground')}</strong>
                    {bridge.commonGround}
                  </p>
                  <div class="bg-white rounded-lg p-3 border border-amber-200">
                    <p class="text-xs text-gray-500 mb-1 font-medium">
                      {$t('negotiation.proposed_bridge')}:
                    </p>
                    <p class="text-xs text-gray-700 italic">
                      "{bridge.proposedBridge}"
                    </p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- refinement suggestions -->
        {#if feedback.refinementSuggestions?.length}
          <div>
            <h3 class="text-sm font-semibold text-gray-700 mb-2">
              💡 {$t('negotiation.refinement_suggestions')}
            </h3>
            <ul class="space-y-1.5">
              {#each feedback.refinementSuggestions as s}
                <li
                  class="text-xs text-gray-600 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100"
                >
                  {s}
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        <!-- predicted movement -->
        {#if feedback.predictedImpact}
          <div class="bg-gray-50 rounded-xl p-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-1">
              🎯 {$t('negotiation.predicted_impact')}
            </h3>
            <p class="text-xs text-gray-600">{feedback.predictedImpact}</p>
            {#if feedback.consensusMoveDirection !== undefined}
              <div class="mt-2 flex items-center gap-2">
                <span class="text-xs text-gray-500"
                  >{$t('negotiation.recommended_direction')}:</span
                >
                <span
                  class="text-xs font-medium text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full"
                >
                  {directionIcon(feedback.consensusMoveDirection)}
                  {#if feedback.consensusMoveAmount}({feedback.consensusMoveAmount}
                    יח'){/if}
                </span>
              </div>
            {/if}
          </div>
        {/if}
      {/if}
    </div>

    <!-- footer actions -->
    <div
      class="sticky bottom-0 bg-white border-t border-gray-100 p-4 rounded-b-2xl flex gap-3"
    >
      <button
        onclick={onClose}
        class="flex-1 py-3 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        {$t('negotiation.back_to_discussion')}
      </button>
      <button
        onclick={onContinue}
        class="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 active:scale-95 transition-all"
      >
        {currentRound < maxRounds
          ? $t('negotiation.next_round', { n: currentRound + 1 }) + ' →'
          : $t('negotiation.finish_discussion')}
      </button>
    </div>
  </div>
</div>
