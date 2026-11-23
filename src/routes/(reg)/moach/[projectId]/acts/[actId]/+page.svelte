<script>
  import { nameOf } from '$lib/translation/memberName';
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { page } from '$app/state';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';
  import Spinner from '$lib/celim/Spinner.svelte';
  import { useRealtime } from '$lib/realtime/bus.svelte';
  import { getActStatus } from '$lib/acts/actStatus';
  import ActQuickActions from '$lib/components/prPr/tasks/ActQuickActions.svelte';

  /**
   * One task (act) — the page every task link lands on: the MCP task tools,
   * the "waiting for you" notices and the validator's "ready for you to check"
   * (docs/tbd/PLAN_AGENT_WORK.md AW1). Its actions are the task table's own
   * (`ActQuickActions`), so accept / done / validate / "not yet" behave here
   * exactly as they do there. What the doer reported is in the task's thread.
   */

  const moachStore = getMoachStore();

  let projectId = $derived(page.params.projectId);
  let actId = $derived(page.params.actId);
  let viewerId = $derived(page.data?.uid ?? null);

  let act = $state(null);
  let loading = $state(true);

  async function loadAct() {
    try {
      const res = await sendToSer({ id: actId }, 'getAct', null, null, false, fetch);
      act = res?.data?.act?.data;
      if (act) {
        moachStore.updateEntity(projectId, actId, act);
      }
    } finally {
      loading = false;
    }
  }

  onMount(loadAct);
  // Another member marked it done, edited or reassigned it (PLAN_REALTIME_MIGRATION §3.4).
  useRealtime(() => [`act:${actId}`], () => loadAct());

  /** The row shape the task table hands ActQuickActions: the act's attributes, flat, with its id. */
  let row = $derived(act ? { id: act.id, ...act.attributes } : null);
  let lane = $derived(row ? getActStatus(row) : null);

  const LANE_KEY = {
    unassigned: 'mission.actsTable.statusUnassigned',
    published: 'mission.actsTable.statusPublished',
    pendingApproval: 'mission.actsTable.statusPendingApproval',
    inProgress: 'mission.actsTable.statusInProgress',
    pendingValidation: 'mission.actsTable.statusPendingValidation',
    completed: 'mission.actsTable.statusCompleted'
  };

  let assignees = $derived(act?.attributes?.my?.data ?? []);
  let validator = $derived(act?.attributes?.vali?.data ?? null);
  let forumId = $derived(act?.attributes?.forums?.data?.[0]?.id ?? null);
  /** When silence validates it — only while it waits for the validator. */
  let silenceAt = $derived.by(() => {
    const clock = act?.attributes?.timegrama?.data?.attributes;
    if (lane !== 'pendingValidation' || !clock || clock.done === true || !clock.date) return null;
    return new Date(clock.date);
  });

  /**
   * ActQuickActions patches the row first (and rolls it back on failure); the
   * truth is read back once the server confirmed it (`onSettled`). Reading it
   * back here instead would race the write and undo the patch.
   */
  function applyPatch(_row, patch) {
    if (!act) return;
    act = { ...act, attributes: { ...act.attributes, ...patch } };
  }

  let jsonLd = $derived(act ? {
    "@context": "https://schema.org",
    "@type": "MoachEntity",
    "entityType": "act",
    "id": actId,
    "projectId": projectId,
    "title": act.attributes.shem,
    "status": lane,
    "availableActions": [
      { "id": "markActDone", "label": $t('moach.acts.markDone'), "actionKey": "reportTask" }
    ]
  } : null);
</script>

<svelte:head>
  {#if act}
    <title>{act.attributes.shem}</title>
    <meta name="moach:entity-type" content="act" />
    <meta name="moach:entity-id" content={actId} />
    <meta name="moach:project-id" content={projectId} />
    <script type="application/ld+json">
      {JSON.stringify(jsonLd)}
    </script>
  {/if}
</svelte:head>

<div class="act-entity-page space-y-6">
  {#if loading}
    <div class="flex justify-center p-12"><Spinner /></div>
  {:else if act && row}
    <header id="header" class="bg-surface p-6 rounded-xl shadow-sm">
      <a href="/moach/{projectId}/acts" class="text-sm text-surfaceMuted hover:underline">
        {$t('moach.acts.backToList')}
      </a>
      <h1 dir="auto" class="mt-2 text-2xl font-bold text-surfaceInk">{act.attributes.shem}</h1>
      {#if lane}
        <p class="mt-2 inline-block rounded-full border border-surfaceLine px-3 py-1 text-xs font-semibold text-surfaceInk">
          {$t(LANE_KEY[lane])}
        </p>
      {/if}
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <section id="description" class="bg-surface p-6 rounded-xl shadow-sm">
          <h2 class="text-lg font-bold mb-4 border-b border-surfaceLine pb-2 text-surfaceInk">{$t('moach.acts.description')}</h2>
          <p dir="auto" class="whitespace-pre-line text-surfaceInk">{act.attributes.des || $t('moach.acts.noDescription')}</p>
          {#if act.attributes.link}
            <a href={act.attributes.link} target="_blank" rel="noopener noreferrer" class="mt-4 text-blue-600 hover:underline block">
              {$t('moach.acts.relatedLink')}
            </a>
          {/if}
        </section>

        <section id="thread" class="bg-surface p-6 rounded-xl shadow-sm">
          <h2 class="text-lg font-bold mb-2 border-b border-surfaceLine pb-2 text-surfaceInk">{$t('moach.acts.thread')}</h2>
          {#if forumId}
            <p class="text-sm text-surfaceMuted mb-3">{$t('moach.acts.threadHint')}</p>
            <a href="/forum/{forumId}" class="inline-block rounded-lg border border-surfaceLine px-4 py-2 font-semibold text-surfaceInk hover:bg-surface2">
              {$t('moach.acts.openThread')}
            </a>
          {:else}
            <p class="text-sm text-surfaceMuted">{$t('moach.acts.noThread')}</p>
          {/if}
        </section>
      </div>

      <div class="space-y-6">
        <section id="participants" class="bg-surface p-6 rounded-xl shadow-sm space-y-3">
          <div>
            <h2 class="text-sm font-bold text-surfaceMuted">{$t('moach.acts.assignee')}</h2>
            <p class="font-medium text-surfaceInk">
              {#if assignees.length}
                {assignees.map((u) => $nameOf(u.attributes)).join(', ')}
              {:else}
                {$t('mission.actsTable.statusUnassigned')}
              {/if}
            </p>
          </div>
          {#if validator}
            <div>
              <h2 class="text-sm font-bold text-surfaceMuted">{$t('moach.acts.validator')}</h2>
              <p class="font-medium text-surfaceInk">{$nameOf(validator.attributes)}</p>
            </div>
          {/if}
          {#if silenceAt}
            <p class="text-xs text-surfaceMuted">
              {$t('moach.acts.silenceValidates', { date: silenceAt.toLocaleString($lang) })}
            </p>
          {/if}
        </section>

        <aside id="actions" aria-label={$t('moach.acts.actions')} class="bg-surface p-6 rounded-xl shadow-sm">
          <h2 class="text-lg font-bold mb-4 border-b border-surfaceLine pb-2 text-surfaceInk">{$t('moach.acts.actions')}</h2>
          <ActQuickActions {row} {projectId} {viewerId} onPatched={applyPatch} onSettled={() => loadAct()} />
          {#if lane === 'completed'}
            <p class="text-sm text-surfaceMuted">{$t('mission.actsTable.statusCompleted')}</p>
          {/if}
        </aside>
      </div>
    </div>
  {:else}
    <div class="p-12 text-center text-surfaceMuted">{$t('moach.acts.notFound')}</div>
  {/if}
</div>
