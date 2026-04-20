<script>
  import { toast } from 'svelte-sonner';
  import { sendToSer } from '$lib/send/sendToSer'; // adjust path
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  // ─── Props ───────────────────────────────────────────────────────────────────
  let {
    mesimot = [] // mesimabetahaliches.data[]
  } = $props();

  const dir = $derived($lang === 'ar' || $lang === 'he' ? 'rtl' : 'ltr');

  // ─── Flatten acts from all mesimot ───────────────────────────────────────────
  const allActs = $derived(
    mesimot.flatMap((mesima) => {
      // Handle both raw Strapi structure and transformed InProgressMissionData
      const actsData = mesima.attributes?.acts?.data ?? mesima.acts?.data ?? [];
      const mName =
        mesima.attributes?.name ||
        mesima.attributes?.stname ||
        mesima.name ||
        mesima.stname ||
        '—';
      const pId = mesima.attributes?.project?.data?.id || mesima.projectId;
      const pName =
        mesima.attributes?.project?.data?.attributes?.projectName ||
        mesima.projectName ||
        '';
      const missId = mesima.attributes?.mission?.data?.id || mesima.missionId;

      return actsData.map((act) => ({
        id: act.id,
        ...act.attributes,
        _missimaId: mesima.id,
        _missimaName: mName,
        _projectId: pId,
        _projectName: pName,
        _missionId: missId
      }));
    })
  );

  // ─── Filter & Sort state ──────────────────────────────────────────────────────
  let activeFilter = $state('all'); // all | pending | inProgress | done | overdue
  let activePriority = $state('all'); // all | white | green | yellow | red
  let selectedProject = $state('all'); // all | projectId
  let groupByMission = $state(false);
  let sortMode = $state('date'); // date | priority

  const projects = $derived(() => {
    const pMap = new Map();
    allActs.forEach((a) => {
      if (a._projectId && a._projectName) {
        pMap.set(a._projectId, a._projectName);
      }
    });
    return Array.from(pMap.entries()).map(([id, name]) => ({ id, name }));
  });

  const priorityOrder = { red: 0, yellow: 1, green: 2, white: 3 };

  const now = new Date();

  const filteredActs = $derived(() => {
    let acts = [...allActs];

    // Status filter
    if (activeFilter === 'pending')
      acts = acts.filter((a) => !a.myIshur && !a.naasa);
    if (activeFilter === 'inProgress')
      acts = acts.filter((a) => a.myIshur && !a.naasa && a.status < 100);
    if (activeFilter === 'done')
      acts = acts.filter((a) => a.naasa || a.status >= 100);
    if (activeFilter === 'overdue')
      acts = acts.filter((a) => !a.naasa && a.dateF && new Date(a.dateF) < now);

    // Priority filter
    if (activePriority !== 'all')
      acts = acts.filter((a) => a.hashivut === activePriority);

    // Project filter
    if (selectedProject !== 'all')
      acts = acts.filter((a) => String(a._projectId) === String(selectedProject));

    // Sort
    if (sortMode === 'priority') {
      acts.sort(
        (a, b) =>
          (priorityOrder[a.hashivut] ?? 3) - (priorityOrder[b.hashivut] ?? 3)
      );
    } else {
      acts.sort((a, b) => {
        const da = a.dateF ? new Date(a.dateF) : new Date('9999');
        const db = b.dateF ? new Date(b.dateF) : new Date('9999');
        return da - db;
      });
    }

    return acts;
  });

  // Grouped by mesima
  const groupedActs = $derived(() => {
    const groups = {};
    filteredActs().forEach((act) => {
      const key = act._missimaId;
      if (!groups[key]) groups[key] = { name: act._missimaName, acts: [] };
      groups[key].acts.push(act);
    });
    return Object.values(groups);
  });

  // ─── Per-card state ───────────────────────────────────────────────────────────
  let expandedCards = $state(new Set());
  let editingProgress = $state({}); // id → draft value
  let confirmingDone = $state(null); // act id

  function toggleExpand(id) {
    const s = new Set(expandedCards);
    s.has(id) ? s.delete(id) : s.add(id);
    expandedCards = s;
  }

  // ─── Actions ─────────────────────────────────────────────────────────────────
  async function busabe(id) {
    try {
      const res = await sendToSer(
        { id, naasa: true },
        '62MarkActDone',
        null,
        null,
        false,
        fetch
      );
      if (res.data) {
        toast.success('✓ ' + $t('tasks.markDone'));
        confirmingDone = null;
      } else {
        toast.warning('שגיאה');
      }
    } catch (e) {
      toast.warning(e.message);
    }
  }

  async function updStat(id, status) {
    try {
      const res = await sendToSer(
        { id, status },
        '63SetActStatus',
        null,
        null,
        false,
        fetch
      );
      if (res.data) {
        toast.success($t('tasks.save') + ' ✓');
        const ep = { ...editingProgress };
        delete ep[id];
        editingProgress = ep;
      } else {
        toast.warning('שגיאה');
      }
    } catch (e) {
      toast.warning(e.message);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const priorityConfig = {
    red: {
      border: 'border-rose-500',
      bg: 'bg-rose-500/10',
      badge: 'bg-rose-500 text-white',
      dot: 'bg-rose-500'
    },
    yellow: {
      border: 'border-amber-400',
      bg: 'bg-amber-400/10',
      badge: 'bg-amber-400 text-black',
      dot: 'bg-amber-400'
    },
    green: {
      border: 'border-emerald-400',
      bg: 'bg-emerald-400/10',
      badge: 'bg-emerald-400 text-black',
      dot: 'bg-emerald-400'
    },
    white: {
      border: 'border-slate-400',
      bg: 'bg-slate-400/5',
      badge: 'bg-slate-300 text-slate-800',
      dot: 'bg-slate-400'
    }
  };

  function pCfg(hashivut) {
    return priorityConfig[hashivut] ?? priorityConfig.white;
  }

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(
      $lang === 'en' ? 'en-GB' : $lang === 'ar' ? 'ar-SA' : 'he-IL',
      {
        day: '2-digit',
        month: 'short',
        year: '2-digit'
      }
    );
  }

  function isOverdue(act) {
    return !act.naasa && act.dateF && new Date(act.dateF) < now;
  }

  function progressColor(val) {
    if (val >= 100) return 'bg-emerald-400';
    if (val >= 60) return 'bg-amber-400';
    if (val >= 30) return 'bg-rose-400';
    return 'bg-slate-400';
  }
</script>

<!-- ═══════════════════════════════════════════════════════════ TEMPLATE ══ -->

<div
  class="my-acts-root min-h-screen bg-[#0c0c14] dark:bg-[#0c0c14] text-slate-100 pb-24"
  {dir}
>
  <!-- ── Header ──────────────────────────────────────────────────────────── -->
  <header
    class="sticky top-0 z-30 bg-[#0c0c14]/90 backdrop-blur-md border-b border-white/5 px-4 pt-safe"
  >
    <div class="max-w-2xl mx-auto">
      <!-- Title row -->
      <div class="flex items-center justify-between py-3">
        <div>
          <h1
            class="text-xl font-bold bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent tracking-tight"
          >
            {$t('tasks.screenTitle')}
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            {filteredActs().length}
            {$t('tasks.tasksCount')}
          </p>
        </div>
        <!-- Group toggle -->
        <button
          onclick={() => (groupByMission = !groupByMission)}
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all
            {groupByMission
            ? 'bg-amber-400/10 border-amber-400/40 text-amber-400'
            : 'border-white/10 text-slate-400 hover:border-white/20'}"
        >
          <svg
            class="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 5h18M3 12h18M3 19h18" />
          </svg>
          {$t('tasks.groupByMission')}
        </button>
      </div>

      <!-- Status filter pills -->
      <div class="flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
        {#each ['all', 'pending', 'inProgress', 'done', 'overdue'] as f}
          {@const labels = {
            all: 'filterAll',
            pending: 'filterPending',
            inProgress: 'filterInProgress',
            done: 'filterDone',
            overdue: 'filterOverdue'
          }}
          <button
            onclick={() => (activeFilter = f)}
            class="shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all border
              {activeFilter === f
              ? 'bg-gradient-to-r from-amber-400 to-rose-500 text-black border-transparent shadow-lg shadow-amber-500/20'
              : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'}"
          >
            {$t('tasks.' + labels[f])}
          </button>
        {/each}
      </div>

      <!-- Priority filter dots -->
      <div class="flex items-center gap-3 pb-3">
        <span class="text-xs text-slate-500 shrink-0"
          >{$t('tasks.priorityLabel')}:</span
        >
        {#each ['all', 'red', 'yellow', 'green', 'white'] as p}
          <button
            onclick={() => (activePriority = p)}
            class="flex items-center gap-1.5 transition-all"
            title={p === 'all'
              ? $t('tasks.filterAll')
              : $t('tasks.priority' + p.charAt(0).toUpperCase() + p.slice(1))}
          >
            {#if p === 'all'}
              <span
                class="text-xs {activePriority === 'all'
                  ? 'text-amber-400'
                  : 'text-slate-500'}">{$t('tasks.filterAll')}</span
              >
            {:else}
              {@const cfg = priorityConfig[p]}
              <span
                class="w-3 h-3 rounded-full border-2 transition-all {cfg.dot}
                {activePriority === p
                  ? 'scale-125 ring-2 ring-white/30'
                  : 'opacity-60'}"
              >
              </span>
            {/if}
          </button>
        {/each}

        <!-- Sort -->
        <button
          onclick={() => (sortMode = sortMode === 'date' ? 'priority' : 'date')}
          class="ms-auto text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
        >
          <svg
            class="w-3 h-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 6h18M7 12h10M11 18h2" />
          </svg>
          {sortMode === 'date' ? $t('tasks.sortByPriority') : $t('tasks.sortByDate')}
        </button>
      </div>

      <!-- Project filter -->
      {#if projects().length > 0}
        <div class="flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
          <button
            onclick={() => (selectedProject = 'all')}
            class="shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-all border
              {selectedProject === 'all'
              ? 'bg-white/10 border-white/20 text-white'
              : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}"
          >
            {$t('tasks.allProjects') || 'כל הפרויקטים'}
          </button>
          {#each projects() as p}
            <button
              onclick={() => (selectedProject = p.id)}
              class="shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-all border
                {selectedProject === p.id
                ? 'bg-amber-400/20 border-amber-400/40 text-amber-400'
                : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}"
            >
              {p.name}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </header>

  <!-- ── Content ─────────────────────────────────────────────────────────── -->
  <main class="max-w-2xl mx-auto px-4 pt-4 space-y-3">
    <!-- Empty state -->
    {#if filteredActs().length === 0}
      <div class="flex flex-col items-center justify-center py-24 text-center">
        <div class="text-5xl mb-4">🎉</div>
        <p class="text-lg font-semibold text-slate-300">{$t('tasks.emptyState')}</p>
        <p class="text-sm text-slate-500 mt-1">{$t('tasks.emptyStateDesc')}</p>
      </div>
    {:else if groupByMission}
      <!-- ── Grouped view ── -->
      {#each groupedActs() as group}
        <section>
          <div class="flex items-center gap-2 px-1 mb-2">
            <div
              class="w-1 h-4 rounded-full bg-gradient-to-b from-amber-400 to-rose-500"
            ></div>
            <h2
              class="text-xs font-semibold text-amber-400/80 uppercase tracking-wider"
            >
              {group.name}
            </h2>
            <span class="text-xs text-slate-600">({group.acts.length})</span>
          </div>
          <div class="space-y-3">
            {#each group.acts as act (act.id)}
              {@render actCard(act)}
            {/each}
          </div>
        </section>
      {/each}
    {:else}
      <!-- ── Flat list ── -->
      {#each filteredActs() as act (act.id)}
        {@render actCard(act)}
      {/each}
    {/if}
  </main>
</div>

<!-- ── Confirm Done Modal ──────────────────────────────────────────────────── -->
{#if confirmingDone}
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4"
    onclick={() => (confirmingDone = null)}
    role="dialog"
    aria-modal="true"
  >
    <div
      class="w-full max-w-sm bg-[#16162a] border border-white/10 rounded-2xl p-6 shadow-2xl"
      onclick={(e) => e.stopPropagation()}
    >
      <p class="text-center text-lg font-semibold text-slate-100 mb-6">
        {$t('tasks.confirmMarkDone')}
      </p>
      <div class="flex gap-3">
        <button
          onclick={() => (confirmingDone = null)}
          class="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition-colors text-sm"
        >
          {$t('tasks.cancel')}
        </button>
        <button
          onclick={() => busabe(confirmingDone)}
          class="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 text-black font-bold hover:opacity-90 transition-opacity text-sm"
        >
          {$t('tasks.yes')} ✓
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- ═══════════════════════════════════════════════════════════ SNIPPET ══ -->

{#snippet actCard(act)}
  {@const cfg = pCfg(act.hashivut)}
  {@const expanded = expandedCards.has(act.id)}
  {@const overdue = isOverdue(act)}
  {@const done = act.naasa || act.status >= 100}
  {@const draftProgress = editingProgress[act.id] ?? act.status ?? 0}
  {@const isEditing = editingProgress[act.id] !== undefined}

  <article
    class="relative rounded-2xl border overflow-hidden transition-all duration-200
      {cfg.border} {cfg.bg}
      {done ? 'opacity-60' : ''}
      {overdue ? 'ring-1 ring-rose-500/40' : ''}"
  >
    <!-- Priority stripe -->
    <div
      class="absolute {dir === 'rtl'
        ? 'right-0'
        : 'left-0'} top-0 bottom-0 w-1 {cfg.dot}"
    ></div>

    <!-- Card body -->
    <div class="{dir === 'rtl' ? 'pr-4 pl-3' : 'pl-4 pr-3'} pt-4 pb-3">
      <!-- ── Top row: title + badges ── -->
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <!-- Overdue badge -->
          {#if overdue}
            <span
              class="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 mb-1"
            >
              ⚠ {$t('tasks.filterOverdue')}
            </span>
          {/if}
          <h3
            class="font-semibold text-sm text-slate-100 leading-snug {done
              ? 'line-through opacity-60'
              : ''}"
          >
            {act.shem || '—'}
          </h3>
          <!-- Mission & Project breadcrumb -->
          {#if !groupByMission}
            <p class="text-xs mt-0.5 truncate flex items-center gap-1.5">
              <span class="text-amber-400/60">{act._missimaName}</span>
              {#if act._projectName}
                <span class="text-slate-600">•</span>
                <span class="text-rose-400/50 italic">{act._projectName}</span>
              {/if}
            </p>
          {/if}
        </div>

        <!-- Priority badge -->
        <span
          class="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full {cfg.badge}"
        >
          {$t(
            'tasks.priority' +
              (act.hashivut ?? 'white').charAt(0).toUpperCase() +
              (act.hashivut ?? 'white').slice(1)
          )}
        </span>
      </div>

      <!-- ── Assigned by ── -->
      {#if act.vali?.data}
        {@const vali = act.vali.data.attributes}
        <div class="flex items-center gap-2 mt-2.5">
          {#if vali.profilePic?.data?.attributes?.url}
            <img
              src={vali.profilePic.data.attributes.url}
              alt={vali.username}
              class="w-5 h-5 rounded-full object-cover ring-1 ring-amber-400/30"
            />
          {:else}
            <div
              class="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-[9px] font-bold text-black"
            >
              {(vali.username ?? '?')[0].toUpperCase()}
            </div>
          {/if}
          <span class="text-[11px] text-slate-400">
            {$t('tasks.assignedBy')}:
            <span class="text-slate-300">{vali.username}</span>
          </span>
          <!-- Validator approved indicator -->
          {#if act.valiIshur}
            <span class="ms-auto text-[10px] text-emerald-400 font-medium"
              >✓ {$t('tasks.validatorApproved')}</span
            >
          {/if}
        </div>
      {/if}

      <!-- ── Dates ── -->
      <div class="flex items-center gap-4 mt-2.5 text-[11px] text-slate-500">
        {#if act.dateS}
          <span>
            <span class="text-slate-600">{$t('tasks.startDate')}: </span>
            {formatDate(act.dateS)}
          </span>
        {/if}
        {#if act.dateF}
          <span class={overdue ? 'text-rose-400 font-medium' : ''}>
            <span class="text-slate-600">{$t('tasks.endDate')}: </span>
            {formatDate(act.dateF)}
          </span>
        {/if}
      </div>

      <!-- ── Progress bar ── -->
      {#if act.status !== undefined && act.status !== null}
        <div class="mt-3">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] text-slate-500">{$t('tasks.progress')}</span>
            <span
              class="text-[11px] font-mono font-bold {done
                ? 'text-emerald-400'
                : 'text-amber-400'}"
            >
              {act.status ?? 0}%
            </span>
          </div>
          <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500 {progressColor(
                act.status
              )}"
              style="width: {Math.min(act.status ?? 0, 100)}%"
            ></div>
          </div>
        </div>
      {/if}

      <!-- ── Expandable details ── -->
      {#if expanded}
        <div class="mt-3 space-y-2 border-t border-white/5 pt-3">
          {#if act.des}
            <div>
              <p class="text-[10px] text-slate-500 mb-0.5">
                {$t('tasks.description')}
              </p>
              <p class="text-xs text-slate-300 leading-relaxed">{act.des}</p>
            </div>
          {/if}
          {#if act.link}
            <a
              href={act.link}
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              <svg
                class="w-3 h-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
                />
              </svg>
              {$t('tasks.openLink')}
            </a>
          {/if}

          <!-- Progress editor -->
          {#if !done}
            <div class="pt-1">
              {#if isEditing}
                <div class="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={draftProgress}
                    oninput={(e) =>
                      (editingProgress = {
                        ...editingProgress,
                        [act.id]: +e.target.value
                      })}
                    class="w-full accent-amber-400"
                  />
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-mono text-amber-400"
                      >{draftProgress}%</span
                    >
                    <div class="flex gap-2">
                      <button
                        onclick={() => {
                          const ep = { ...editingProgress };
                          delete ep[act.id];
                          editingProgress = ep;
                        }}
                        class="text-xs px-3 py-1 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5"
                      >
                        {$t('tasks.cancel')}
                      </button>
                      <button
                        onclick={() => updStat(act.id, draftProgress)}
                        class="text-xs px-3 py-1 rounded-lg bg-amber-400 text-black font-semibold hover:bg-amber-300"
                      >
                        {$t('tasks.save')}
                      </button>
                    </div>
                  </div>
                </div>
              {:else}
                <button
                  onclick={() =>
                    (editingProgress = {
                      ...editingProgress,
                      [act.id]: act.status ?? 0
                    })}
                  class="text-xs text-slate-500 hover:text-amber-400 transition-colors flex items-center gap-1"
                >
                  <svg
                    class="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                    />
                  </svg>
                  {$t('tasks.updateProgress')}
                </button>
              {/if}
            </div>
          {/if}
        </div>
      {/if}

      <!-- ── Action row ── -->
      <div
        class="flex items-center justify-between mt-3 pt-2 border-t border-white/5"
      >
        <!-- Expand toggle -->
        <button
          onclick={() => toggleExpand(act.id)}
          class="text-[11px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
        >
          <svg
            class="w-3 h-3 transition-transform {expanded ? 'rotate-180' : ''}"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
          {expanded ? $t('tasks.showLess') : $t('tasks.showMore')}
        </button>

        <div class="flex items-center gap-2">
          <!-- Confirm I'll do it (myIshur) -->
          {#if !act.myIshur && !done}
            <button
              onclick={() => {
                // myIshur mutation - implement with your mutation code
                toast.info($t('tasks.confirmDo'));
              }}
              class="text-[11px] px-3 py-1.5 rounded-lg border border-rose-400/30 text-rose-300
                     hover:bg-rose-400/10 transition-colors font-medium"
            >
              {$t('tasks.confirmDo')}
            </button>
          {:else if act.myIshur && !done}
            <span class="text-[11px] text-amber-400/70">{$t('tasks.confirmed')}</span>
          {/if}

          <!-- Mark done -->
          {#if !done}
            <button
              onclick={() => (confirmingDone = act.id)}
              class="text-[11px] px-3 py-1.5 rounded-lg
                     bg-gradient-to-r from-amber-400 to-rose-500 text-black font-bold
                     hover:opacity-90 transition-opacity shadow-md shadow-amber-500/20"
            >
              {$t('tasks.markDone')}
            </button>
          {:else}
            <span
              class="text-[11px] text-emerald-400 font-semibold flex items-center gap-1"
            >
              <svg
                class="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {$t('tasks.filterDone')}
            </span>
          {/if}
        </div>
      </div>
    </div>
  </article>
{/snippet}

<style>
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .pt-safe {
    padding-top: env(safe-area-inset-top, 0px);
  }

  :global(.my-acts-root) {
    font-family: 'Heebo', 'Rubik', system-ui, sans-serif;
  }

  article {
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease;
  }
  article:active {
    transform: scale(0.99);
  }
</style>
