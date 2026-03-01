<!-- src/routes/negotiation/[id]/+page.svelte -->
<!-- AI-First Negotiation Platform — Mobile-First, Hebrew RTL -->

<script>
  import { animate, signal, all } from '$lib/func/animation.ts';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import Tile from '$lib/celim/tile.svelte';
  import { t } from '$lib/translations';
  // New AI components (copy to $lib/negotiation/)
  import DimensionsView from '$lib/negotiation/DimensionsView.svelte';
  import PositionFormAI from '$lib/negotiation/PositionFormAI.svelte';
  import RoundFeedback from '$lib/negotiation/RoundFeedback.svelte';

  let { data } = $props();

  // ── Basic state ────────────────────────────────────────────────
  const COLORS = [
    'violet',
    'blue',
    'cyan',
    'emerald',
    'amber',
    'rose',
    'indigo',
    'pink'
  ];

  let h = $state(0),
    w = $state(0);
  let negotiationId = $derived(data?.id || '0');
  let isNewNegotiation = $state(data?.id === '0');

  let negotiationData = $state(data?.negotiation || null);
  let loading = $state(false);
  let error = $state('');

  // ── User / Session ─────────────────────────────────────────────
  let userName = $state(page.data.un || '');
  let userEmail = $state(page.data.email || '');

  // ── Negotiation flow state ─────────────────────────────────────
  let currentTopic = $state(negotiationData?.topic || '');
  let isTopicSet = $state(!!negotiationData?.topic);
  let topicSuggestions = $state(null); // AI dimension suggestions for topic
  let topicSuggestionsLoading = $state(false);

  let isFirstPositionSet = $state(
    (negotiationData?.positions?.length || 0) > 0
  );
  let currentRound = $state(negotiationData?.currentRound || 1);
  let maxRounds = $state(negotiationData?.maxRounds || 3);

  // ── View mode ─────────────────────────────────────────────────
  // 'spectrum' | 'dimensions' | 'add'
  let viewMode = $state('spectrum');

  // ── Points / Positions ─────────────────────────────────────────
  let points = $state(negotiationData?.positions || []);

  // ── AI Dimensions ──────────────────────────────────────────────
  let dimensions = $state([]);
  let dimensionsLoading = $state(false);
  let consensusScore = $state(0);

  // ── Modals ─────────────────────────────────────────────────────
  let showShareModal = $state(false);
  let shareUrl = $state('');
  let showRoundFeedback = $state(false);
  let showResults = $state(false);

  // ── Animation signals ─────────────────────────────────────────
  const line = signal({ x: 0, y: 0, x2: 0, y2: 0 });
  const svg = signal({ x: 0, y: 0, w: 100, h: 100 });

  // ─────────────────────────────────────────────────────────────
  onMount(async () => {
    if (!isNewNegotiation && !negotiationData) {
      await loadNegotiationData();
    }
    addColorAndLocation(points);
    if (points.length >= 2) {
      await loadDimensions();
    }
  });

  // Update svg/line animation when container resizes
  $effect(() => {
    if (w > 0 && h > 0) {
      svg.to({ x: 0, y: 0, w, h }, { duration: 200 });
      line.to({ x: 0, y: h / 2, x2: w, y2: h / 2 }, { duration: 200 });
    }
  });

  // ── Consensus calculation ──────────────────────────────────────
  let centerOfMass = $derived(calcCenter(points));

  function calcCenter(pts) {
    if (!pts.length) return { x: 50 };
    let tw = 0,
      wx = 0;
    pts.forEach((p) => {
      const w2 = (p.votes || 0) + 1;
      wx += p.location * w2;
      tw += w2;
    });
    return { x: wx / tw };
  }

  function calcConsensus(pts) {
    if (pts.length <= 1) return 100;
    const locs = pts.map((p) => p.location);
    const avg = locs.reduce((a, b) => a + b, 0) / locs.length;
    const variance = locs.reduce((s, l) => s + (l - avg) ** 2, 0) / locs.length;
    return Math.max(0, Math.round(100 - Math.sqrt(variance)));
  }

  $effect(() => {
    consensusScore = calcConsensus(points);
  });

  // ─────────────────────────────────────────────────────────────
  // GraphQL loaders
  // ─────────────────────────────────────────────────────────────
  async function loadNegotiationData() {
    loading = true;
    try {
      const result = await sendToSer(
        { id: negotiationId },
        '39GetNegotiation',
        0,
        0,
        false,
        fetch
      );
      if (result.errors) throw new Error(result.errors[0].message);
      if (result.data?.negotiation?.data) {
        const attrs = result.data.negotiation.data.attributes;
        negotiationData = {
          id: result.data.negotiation.data.id,
          topic: attrs.topic,
          status: attrs.status,
          maxRounds: attrs.maxRounds,
          currentRound: attrs.currentRound,
          positions:
            attrs.positions?.data?.map((pos) => ({
              id: pos.id,
              ...pos.attributes,
              voters: JSON.parse(pos.attributes.voters || '[]')
            })) || []
        };
        currentTopic = negotiationData.topic;
        currentRound = negotiationData.currentRound;
        maxRounds = negotiationData.maxRounds;
        isTopicSet = true;
        points = negotiationData.positions;
        addColorAndLocation(points);
        isFirstPositionSet = points.length > 0;
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // AI calls
  // ─────────────────────────────────────────────────────────────
  async function fetchTopicSuggestions() {
    if (!currentTopic.trim()) return;
    topicSuggestionsLoading = true;
    try {
      const res = await fetch('/negotiation/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggest_dimensions',
          topic: currentTopic
        })
      });
      const json = await res.json();
      if (json.success) topicSuggestions = json.data;
    } catch (e) {
      // silent — UI still works
    } finally {
      topicSuggestionsLoading = false;
    }
  }

  async function loadDimensions() {
    if (points.length < 2) return;
    dimensionsLoading = true;
    try {
      const res = await fetch('/negotiation/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extract_dimensions',
          topic: currentTopic,
          positions: points
        })
      });
      const json = await res.json();
      if (json.success) {
        dimensions = json.data.dimensions || [];
      }
    } catch (e) {
      // silent
    } finally {
      dimensionsLoading = false;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Create / mutate
  // ─────────────────────────────────────────────────────────────
  async function createNegotiation() {
    loading = true;
    try {
      const result = await sendToSer(
        {
          data: {
            topic: currentTopic,
            description: `${$t('negotiation.discussion_created_by')} ${userName}`,
            status: 'active',
            maxRounds,
            currentRound: 1,
            creator: page.data.uid || null,
            createdByEmail: userEmail
          }
        },
        '40CreateNegotiation',
        0,
        0,
        false,
        fetch
      );
      if (result.errors) throw new Error(result.errors[0].message);
      if (result.data?.createNegotiation?.data) {
        const newId = result.data.createNegotiation.data.id;
        isNewNegotiation = false;
        shareUrl = `${window.location.origin}/negotiation/${newId}`;
        if (browser) goto(`/negotiation/${newId}`, { replaceState: true });
        showShareModal = true;
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function handleAddPosition({
    heading,
    description,
    suggestedLocation,
    aiAnalysis
  }) {
    loading = true;
    try {
      const newPoint = {
        heading,
        description,
        author: userName || $t('negotiation.anonymous'),
        authorEmail: userEmail,
        votes: 0,
        voters: [],
        intensity: 5,
        location: suggestedLocation ?? 50,
        order: points.length + 1
      };

      const result = await sendToSer(
        {
          data: {
            ...newPoint,
            negotiation: negotiationId,
            voters: JSON.stringify([]),
            aiMeta: JSON.stringify(aiAnalysis || {})
          }
        },
        '41CreatePosition',
        0,
        0,
        false,
        fetch
      );

      if (result.data?.createPosition?.data) {
        const saved = {
          id: result.data.createPosition.data.id,
          ...newPoint,
          hover: false
        };
        points = [...points, saved];
        addColorAndLocation(points);
        isFirstPositionSet = true;
        viewMode = 'spectrum';

        // trigger dimension reload when 2nd position arrives
        if (points.length >= 2) {
          await loadDimensions();
        }
      }
    } catch (err) {
      error = $t('negotiation.error_adding_position');
    } finally {
      loading = false;
    }
  }

  async function supportPoint(pointId) {
    const point = points.find((p) => p.id === pointId);
    if (!point || point.voters.includes(userName)) return;
    point.voters = [...point.voters, userName];
    point.votes = (point.votes || 0) + 1;
    points = [...points];
    try {
      await sendToSer(
        {
          id: pointId,
          data: { voters: JSON.stringify(point.voters), votes: point.votes }
        },
        '42UpdatePosition',
        0,
        0,
        false,
        fetch
      );
    } catch {
      point.voters = point.voters.filter((s) => s !== userName);
      point.votes--;
      points = [...points];
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────
  function addColorAndLocation(arr) {
    const n = arr.length;
    if (n === 0) return;
    const positions =
      n === 1
        ? [50]
        : n === 2
          ? [25, 75]
          : arr.map((_, i) => 10 + (80 / (n - 1)) * i);

    arr.forEach((p, i) => {
      p.location = positions[i];
      p.color = COLORS[i % COLORS.length];
    });

    if (negotiationData) negotiationData.positions = arr;
  }

  async function setTopic() {
    if (!currentTopic.trim() || !userName.trim()) return;
    isTopicSet = true;
    await fetchTopicSuggestions();
    if (isNewNegotiation) await createNegotiation();
  }

  async function handleRoundAdvance() {
    if (currentRound >= maxRounds) {
      showResults = true;
    } else {
      currentRound++;
      showRoundFeedback = false;
      // Reload dimensions with updated support counts
      await loadDimensions();
    }
  }

  function resetSystem() {
    currentTopic = '';
    isTopicSet = false;
    isFirstPositionSet = false;
    currentRound = 1;
    points = [];
    dimensions = [];
    showResults = false;
    if (browser) goto('/negotiation/0');
  }

  // My position (last one added by current user)
  let myPosition = $derived(points.findLast((p) => p.author === userName));

  // Color map for SVG circles
  const COLOR_MAP = {
    violet: '#7c3aed',
    blue: '#2563eb',
    cyan: '#0891b2',
    emerald: '#059669',
    amber: '#d97706',
    rose: '#e11d48',
    indigo: '#4338ca',
    pink: '#db2777'
  };
</script>

<!-- ══════════════════════════════════════════════════════════ -->
<!-- Loading overlay -->
<!-- ══════════════════════════════════════════════════════════ -->
{#if loading}
  <div
    class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
  >
    <div
      class="bg-white rounded-2xl px-8 py-6 shadow-xl flex items-center gap-4"
    >
      <div
        class="w-6 h-6 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin"
      ></div>
      <span class="text-gray-700 font-medium">{$t('negotiation.loading')}</span>
    </div>
  </div>
{/if}

<!-- Error toast -->
{#if error}
  <div
    class="fixed top-4 inset-x-4 z-50 bg-red-50 border border-red-200 rounded-xl px-4 py-3 shadow-lg flex justify-between items-center"
    dir="rtl"
  >
    <span class="text-red-700 text-sm">{error}</span>
    <button
      onclick={() => (error = '')}
      class="text-red-400 hover:text-red-600 text-xl leading-none">×</button
    >
  </div>
{/if}

<!-- ══════════════════════════════════════════════════════════ -->
<!-- STEP 1: Topic + User setup -->
<!-- ══════════════════════════════════════════════════════════ -->
{#if !isTopicSet}
  <div
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gradient-to-br from-violet-900 to-indigo-950 p-4"
    dir="rtl"
  >
    <div
      class="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
    >
      <div class="bg-gradient-to-l from-violet-600 to-indigo-600 px-6 py-5">
        <h1 class="text-white font-bold text-xl">{$t('negotiation.title')}</h1>
        <p class="text-violet-200 text-sm mt-1">{$t('negotiation.subtitle')}</p>
      </div>

      <div class="p-6 space-y-4">
        {#if !isNewNegotiation && negotiationData}
          <div class="bg-violet-50 rounded-xl p-4 border border-violet-100">
            <p class="text-xs text-violet-500 font-medium mb-1">
              {$t('negotiation.topic_label')}
            </p>
            <p class="text-violet-900 font-semibold">{negotiationData.topic}</p>
          </div>
        {/if}

        <input
          bind:value={userName}
          placeholder={$t('negotiation.your_name')}
          class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        <input
          bind:value={userEmail}
          placeholder={$t('negotiation.email_optional')}
          type="email"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        />

        {#if isNewNegotiation}
          <textarea
            bind:value={currentTopic}
            placeholder={$t('negotiation.topic_placeholder')}
            rows="3"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
          ></textarea>
        {/if}

        <button
          onclick={setTopic}
          disabled={!userName.trim() ||
            (isNewNegotiation && !currentTopic.trim())}
          class="w-full py-3 rounded-xl font-bold text-white bg-violet-600 hover:bg-violet-700
                 disabled:opacity-40 transition-all active:scale-95"
        >
          {isNewNegotiation
            ? $t('negotiation.continue')
            : $t('negotiation.join_discussion')}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- ══════════════════════════════════════════════════════════ -->
<!-- STEP 2: Topic AI suggestions + first position -->
<!-- ══════════════════════════════════════════════════════════ -->
{#if isTopicSet && !isFirstPositionSet && isNewNegotiation}
  <div
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    dir="rtl"
  >
    <div
      class="bg-white w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
    >
      <div
        class="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 rounded-t-2xl"
      >
        <h2 class="font-bold text-gray-800">
          {$t('negotiation.define_first_position')}
        </h2>
        <p class="text-xs text-gray-400 mt-0.5">
          {$t('negotiation.topic_label')}: {currentTopic}
        </p>
      </div>

      <div class="p-5 space-y-4">
        <!-- AI dimension suggestions -->
        {#if topicSuggestionsLoading}
          <div class="flex items-center gap-2 text-violet-600 py-2">
            <div
              class="w-4 h-4 border-2 border-violet-200 border-t-violet-500 rounded-full animate-spin"
            ></div>
            <span class="text-xs"
              >{$t('negotiation.ai_preparing_dimensions')}</span
            >
          </div>
        {:else if topicSuggestions}
          <div
            class="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2"
          >
            <p class="text-xs font-semibold text-amber-800">
              💡 {$t('negotiation.ai_suggests_consider')}
            </p>
            {#each topicSuggestions.suggestedDimensions || [] as dim}
              <div class="bg-white rounded-lg p-3 border border-amber-100">
                <p class="text-xs font-medium text-gray-800">{dim.name}</p>
                <p class="text-xs text-gray-500 mt-0.5 italic">
                  {dim.question}
                </p>
                <div class="flex gap-1 mt-1 flex-wrap">
                  {#each dim.examples || [] as ex}
                    <span
                      class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full"
                      >{ex}</span
                    >
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/if}

        <PositionFormAI
          topic={currentTopic}
          positions={points}
          onSubmit={handleAddPosition}
          {loading}
        />
      </div>
    </div>
  </div>
{/if}

<!-- ══════════════════════════════════════════════════════════ -->
<!-- SHARE MODAL -->
<!-- ══════════════════════════════════════════════════════════ -->
{#if showShareModal}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    dir="rtl"
  >
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
      <div class="text-center">
        <div class="text-4xl mb-2">🎉</div>
        <h2 class="font-bold text-gray-800">
          {$t('negotiation.discussion_created')}
        </h2>
        <p class="text-sm text-gray-500 mt-1">
          {$t('negotiation.share_link_invite')}
        </p>
      </div>
      <div class="flex rounded-xl overflow-hidden border border-gray-200">
        <input
          value={shareUrl}
          readonly
          class="flex-1 px-3 py-2 text-xs bg-gray-50 outline-none"
        />
        <button
          onclick={() =>
            navigator.clipboard
              .writeText(shareUrl)
              .then(() => alert($t('negotiation.copied')))}
          class="px-4 bg-violet-600 text-white text-xs font-medium hover:bg-violet-700"
          >{$t('negotiation.copy')}</button
        >
      </div>
      <button
        onclick={() => (showShareModal = false)}
        class="w-full py-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 active:scale-95 transition-all"
        >{$t('negotiation.continue_to_discussion')}</button
      >
    </div>
  </div>
{/if}

<!-- ══════════════════════════════════════════════════════════ -->
<!-- ROUND FEEDBACK MODAL -->
<!-- ══════════════════════════════════════════════════════════ -->
{#if showRoundFeedback && myPosition}
  <RoundFeedback
    topic={currentTopic}
    positions={points}
    userPosition={myPosition}
    {currentRound}
    {maxRounds}
    onContinue={handleRoundAdvance}
    onClose={() => (showRoundFeedback = false)}
  />
{/if}

<!-- ══════════════════════════════════════════════════════════ -->
<!-- RESULTS MODAL -->
<!-- ══════════════════════════════════════════════════════════ -->
{#if showResults}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    dir="rtl"
  >
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
      <div class="text-center">
        <div class="text-5xl mb-3">🏁</div>
        <h2 class="font-bold text-2xl text-gray-800">
          {$t('negotiation.discussion_results')}
        </h2>
        <p class="text-sm text-gray-500 mt-1">{currentTopic}</p>
      </div>
      <div class="space-y-3">
        <div class="bg-green-50 rounded-xl p-4 text-center">
          <p class="text-3xl font-bold text-green-700">{consensusScore}%</p>
          <p class="text-xs text-green-600 mt-0.5">
            {$t('negotiation.consensus')}
          </p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-gray-50 rounded-xl p-3 text-center">
            <p class="text-xl font-bold text-gray-700">{points.length}</p>
            <p class="text-xs text-gray-500">
              {$t('negotiation.positions_count')}
            </p>
          </div>
          <div class="bg-gray-50 rounded-xl p-3 text-center">
            <p class="text-xl font-bold text-gray-700">{currentRound}</p>
            <p class="text-xs text-gray-500">{$t('negotiation.rounds')}</p>
          </div>
        </div>
      </div>
      <div class="flex gap-3">
        <button
          onclick={() => (showResults = false)}
          class="flex-1 py-3 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
          >{$t('negotiation.back')}</button
        >
        <button
          onclick={resetSystem}
          class="flex-1 py-3 rounded-xl text-sm font-bold bg-violet-600 text-white hover:bg-violet-700 active:scale-95 transition-all"
          >{$t('negotiation.new_discussion_btn')}</button
        >
      </div>
    </div>
  </div>
{/if}

<!-- ══════════════════════════════════════════════════════════ -->
<!-- MAIN LAYOUT -->
<!-- ══════════════════════════════════════════════════════════ -->
<div
  class="fixed inset-0 flex flex-col bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900"
  dir="rtl"
>
  <!-- ── Top Bar ── -->
  {#if isTopicSet}
    <header
      class="shrink-0 bg-white/10 backdrop-blur-md border-b border-white/10 px-4 py-3"
    >
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h1 class="text-white font-bold text-sm leading-tight truncate">
            {currentTopic}
          </h1>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="text-white/60 text-xs"
              >{$t('negotiation.round_of', {
                current: currentRound,
                max: maxRounds
              })}</span
            >
            <span class="text-white/40">·</span>
            <span class="text-white/60 text-xs"
              >{points.length} {$t('negotiation.positions_count')}</span
            >
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <!-- Consensus pill -->
          <div
            class="bg-white/15 rounded-full px-3 py-1 text-center min-w-[4rem]"
          >
            <div class="text-white font-bold text-sm leading-none">
              {consensusScore}%
            </div>
            <div class="text-white/50 text-[9px] mt-0.5">
              {$t('negotiation.consensus')}
            </div>
          </div>
          <!-- Share -->
          <button
            onclick={() => {
              shareUrl = browser ? window.location.href : '';
              showShareModal = true;
            }}
            class="bg-white/15 hover:bg-white/25 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors text-base"
            title={$t('negotiation.share')}>⬆️</button
          >
        </div>
      </div>
    </header>
  {/if}

  <!-- ── View Mode Tabs ── -->
  {#if isTopicSet && isFirstPositionSet}
    <div class="shrink-0 flex border-b border-white/10 bg-white/5">
      {#each [{ id: 'spectrum', label: 'ספקטרום', icon: '📊' }, { id: 'dimensions', label: 'ממדים', icon: '🔍' }, { id: 'add', label: 'הוסף עמדה', icon: '➕' }] as tab}
        <button
          onclick={() => (viewMode = tab.id)}
          class="flex-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5
                 {viewMode === tab.id
            ? 'text-white border-b-2 border-violet-400 bg-white/10'
            : 'text-white/50 hover:text-white/80'}"
        >
          <span class="text-base leading-none">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      {/each}
    </div>
  {/if}

  <!-- ── Content Area ── -->
  <div class="flex-1 overflow-auto">
    <!-- ═══ SPECTRUM VIEW ═══ -->
    {#if viewMode === 'spectrum'}
      <div
        class="relative w-full h-full min-h-[60vh]"
        bind:clientHeight={h}
        bind:clientWidth={w}
      >
        {#key (w, h, points)}
          <svg
            class="absolute inset-0 w-full h-full"
            viewBox="0 0 {w || 100} {h || 100}"
          >
            <!-- Background gradient bar -->
            <defs>
              <linearGradient id="spectrumGrad" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stop-color="#6366f1" stop-opacity="0.4" />
                <stop offset="50%" stop-color="#8b5cf6" stop-opacity="0.2" />
                <stop offset="100%" stop-color="#ec4899" stop-opacity="0.4" />
              </linearGradient>
            </defs>

            {#if w && h}
              <!-- Main axis line -->
              <rect
                x={w * 0.05}
                y={h / 2 - 3}
                width={w * 0.9}
                height={6}
                rx="3"
                fill="url(#spectrumGrad)"
              />

              <!-- Axis end labels -->
              <text
                x={w * 0.05}
                y={h / 2 + 24}
                text-anchor="middle"
                font-size="9"
                fill="rgba(255,255,255,0.4)">שמרני</text
              >
              <text
                x={w * 0.95}
                y={h / 2 + 24}
                text-anchor="middle"
                font-size="9"
                fill="rgba(255,255,255,0.4)">מתקדם</text
              >

              <!-- Center of mass indicator -->
              {#if points.length > 0}
                <line
                  x1={w * 0.05 + w * 0.9 * (centerOfMass.x / 100)}
                  y1={h / 2 - 20}
                  x2={w * 0.05 + w * 0.9 * (centerOfMass.x / 100)}
                  y2={h / 2 + 20}
                  stroke="gold"
                  stroke-width="2"
                  stroke-dasharray="4 3"
                  opacity="0.7"
                />
                <text
                  x={w * 0.05 + w * 0.9 * (centerOfMass.x / 100)}
                  y={h / 2 - 26}
                  text-anchor="middle"
                  font-size="8"
                  fill="gold"
                  opacity="0.8">מרכז</text
                >
              {/if}

              <!-- Position nodes -->
              {#each points as point, i}
                {@const cx = w * 0.05 + w * 0.9 * (point.location / 100)}
                {@const cy = h / 2}
                {@const r = 22 + (point.votes || 0) * 3}
                {@const fillColor = COLOR_MAP[point.color] || '#7c3aed'}

                <g>
                  <!-- Glow ring -->
                  <circle
                    {cx}
                    {cy}
                    r={r + 6}
                    fill="none"
                    stroke={fillColor}
                    stroke-width="1.5"
                    opacity="0.25"
                  />

                  <!-- Main circle -->
                  <circle
                    {cx}
                    {cy}
                    {r}
                    fill={fillColor}
                    stroke="white"
                    stroke-width="2"
                    style="cursor:pointer;"
                    role="button"
                    tabindex="0"
                    onclick={() => supportPoint(point.id)}
                    onkeydown={(e) =>
                      e.key === 'Enter' && supportPoint(point.id)}
                  />

                  <!-- Vote count -->
                  <text
                    {cx}
                    {cy}
                    x={cx}
                    y={cy + 4}
                    text-anchor="middle"
                    font-size="11"
                    font-weight="bold"
                    fill="white">{point.votes || 0}</text
                  >

                  <!-- Info card - above/below based on position -->
                  <foreignObject
                    x={Math.min(Math.max(cx - 70, 4), w - 144)}
                    y={i % 2 === 0 ? cy - r - 75 : cy + r + 8}
                    width="140"
                    height="70"
                  >
                    <div
                      class="rounded-xl bg-white/15 backdrop-blur-md border border-white/20
                             p-2 text-white shadow-lg"
                    >
                      <p class="text-xs font-semibold truncate leading-tight">
                        {point.heading}
                      </p>
                      <p class="text-[10px] text-white/60 mt-0.5 truncate">
                        {point.author}
                      </p>
                      <div class="flex items-center gap-1 mt-1">
                        <span class="text-[9px] text-white/50"
                          >👍 {point.voters?.length || 0}</span
                        >
                        {#if point.author === userName}
                          <span class="text-[9px] text-amber-300">• שלי</span>
                        {/if}
                      </div>
                    </div>
                  </foreignObject>
                </g>
              {/each}
            {/if}
          </svg>
        {/key}

        <!-- Add position FAB (when in spectrum view with no positions yet) -->
        {#if points.length === 0 && isTopicSet}
          <div class="absolute inset-0 flex items-center justify-center">
            <button
              onclick={() => (viewMode = 'add')}
              class="bg-violet-500/80 backdrop-blur-sm text-white rounded-2xl px-6 py-4 shadow-xl
                     hover:bg-violet-500 active:scale-95 transition-all border border-white/20"
            >
              <div class="text-3xl mb-1">➕</div>
              <p class="text-sm font-bold">הוסף עמדה ראשונה</p>
              <p class="text-xs text-white/70 mt-0.5">AI ימקם אותה בספקטרום</p>
            </button>
          </div>
        {/if}
      </div>

      <!-- ═══ DIMENSIONS VIEW ═══ -->
    {:else if viewMode === 'dimensions'}
      <div class="p-4">
        {#if points.length < 2}
          <div class="text-center py-12 text-white/50">
            <div class="text-4xl mb-3">🔍</div>
            <p class="text-sm">הוסף לפחות 2 עמדות<br />כדי לראות ניתוח ממדים</p>
          </div>
        {:else}
          <!-- Consensus overview -->
          <div
            class="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-4 border border-white/10"
          >
            <div class="flex justify-between items-center">
              <div>
                <p class="text-white/70 text-xs">הסכמה כוללת</p>
                <p class="text-white font-bold text-2xl">{consensusScore}%</p>
              </div>
              <div
                class="w-16 h-16 rounded-full border-4 border-violet-400/40 flex items-center justify-center relative"
              >
                <svg
                  class="absolute inset-0 w-full h-full -rotate-90"
                  viewBox="0 0 64 64"
                >
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="rgba(139,92,246,0.3)"
                    stroke-width="4"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="#8b5cf6"
                    stroke-width="4"
                    stroke-dasharray="{(2 * Math.PI * 28 * consensusScore) /
                      100} {2 * Math.PI * 28}"
                    stroke-linecap="round"
                  />
                </svg>
                <span class="text-white text-xs font-bold relative z-10"
                  >{consensusScore}</span
                >
              </div>
            </div>
          </div>

          <!-- Dimensions from AI -->
          <div class="bg-white rounded-2xl p-4">
            <DimensionsView
              {dimensions}
              positions={points}
              loading={dimensionsLoading}
            />
          </div>
        {/if}
      </div>

      <!-- ═══ ADD POSITION VIEW ═══ -->
    {:else if viewMode === 'add'}
      <div class="p-4">
        <!-- Topic AI suggestions (if loaded) -->
        {#if topicSuggestions?.suggestedDimensions?.length}
          <div
            class="bg-amber-400/20 border border-amber-400/30 backdrop-blur-md rounded-2xl p-4 mb-4"
          >
            <p class="text-amber-200 text-xs font-semibold mb-2">
              💡 AI מציע לדון בממדים אלה:
            </p>
            <div class="flex flex-wrap gap-2">
              {#each topicSuggestions.suggestedDimensions as dim}
                <span
                  class="text-xs bg-amber-400/20 text-amber-200 border border-amber-400/20 px-2 py-1 rounded-full"
                >
                  {dim.name}
                </span>
              {/each}
            </div>
          </div>
        {/if}

        <div class="bg-white rounded-2xl p-4">
          <PositionFormAI
            topic={currentTopic}
            positions={points}
            onSubmit={handleAddPosition}
            {loading}
          />
        </div>

        <!-- Other positions for reference -->
        {#if points.length > 0}
          <div class="mt-4 space-y-2">
            <p class="text-white/60 text-xs font-medium px-1">
              עמדות קיימות — לעיון
            </p>
            {#each points as p}
              <div
                class="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="text-white text-sm font-medium truncate">
                      {p.heading}
                    </p>
                    <p class="text-white/50 text-xs truncate">{p.author}</p>
                  </div>
                  <span
                    class="shrink-0 text-xs text-white/40 font-mono bg-white/10 px-2 py-0.5 rounded-full"
                  >
                    {Math.round(p.location)}
                  </span>
                </div>
                <p class="text-white/60 text-xs mt-1.5 line-clamp-2">
                  {p.description}
                </p>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- ── Bottom Action Bar ── -->
  {#if isTopicSet && isFirstPositionSet}
    <div
      class="shrink-0 bg-white/10 backdrop-blur-md border-t border-white/10 px-4 py-3 safe-area-bottom"
    >
      <div class="flex gap-3">
        <!-- Next round / results -->
        <button
          onclick={() => {
            if (currentRound >= maxRounds) {
              showResults = true;
            } else if (myPosition) {
              showRoundFeedback = true;
            } else {
              handleRoundAdvance();
            }
          }}
          class="flex-1 py-3 rounded-xl font-bold text-sm bg-violet-500 text-white
                 hover:bg-violet-400 active:scale-95 transition-all shadow-lg"
        >
          {currentRound >= maxRounds
            ? '🏁 סיים דיון'
            : `🔄 סבב ${currentRound + 1}`}
        </button>

        <!-- Refresh dimensions -->
        <button
          onclick={loadDimensions}
          disabled={dimensionsLoading || points.length < 2}
          class="py-3 px-4 rounded-xl font-medium text-sm bg-white/15 text-white
                 hover:bg-white/25 active:scale-95 transition-all
                 disabled:opacity-40"
          title="עדכן ניתוח AI"
        >
          {#if dimensionsLoading}
            <span
              class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            ></span>
          {:else}
            🤖
          {/if}
        </button>

        <!-- Reset -->
        <button
          onclick={resetSystem}
          class="py-3 px-4 rounded-xl font-medium text-sm bg-white/10 text-white/70
                 hover:bg-white/20 active:scale-95 transition-all"
          title="איפוס">🔄</button
        >
      </div>
    </div>
  {/if}
</div>

<style>
  .safe-area-bottom {
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
  }
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
