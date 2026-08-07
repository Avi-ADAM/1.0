<script>
  import Bethas from '$lib/components/prPr/bethas.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { page } from '$app/state';
  import { onMount, untrack } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import { fetchTimers, initialWebSocketForTimer } from '$lib/stores/timers.js';
  import { forum, isChatOpen, newChat, nowChatId } from '$lib/stores/pendMisMes.js';

  let { data } = $props();
  const moachStore = getMoachStore();

  let projectId = $derived(page.params.projectId);

  // Seed store from server data whenever fresh data arrives
  $effect(() => {
    if (data.missions && projectId) {
      untrack(() => moachStore.updateProjectData(projectId, 'missions', data.missions));
    }
  });

  // The board runs the viewer's own timers, and every timer action reads and
  // writes the same global `$timers` store the lev page uses. Nothing else on
  // the moach fills it, so this page loads it and listens for the socket
  // refresh that keeps other devices/tabs in step.
  onMount(() => {
    const uid = page.data?.uid;
    if (!uid) return;
    fetchTimers(uid, fetch).catch((e) =>
      console.warn('[progress] fetchTimers failed:', e?.message)
    );
    const stopListening = initialWebSocketForTimer(uid, fetch);
    return () => stopListening();
  });

  let projectData = $derived(moachStore.state.projects[projectId]);
  let missions = $derived(projectData?.missions ?? data.missions);

  // Work that has no one on it yet lives on the "open for partners" board —
  // link across instead of duplicating the list here.
  let openCount = $derived(
    (missions?.open_missions?.data?.length ?? 0) +
      (missions?.open_mashaabims?.data?.length ?? 0)
  );

  /**
   * The board's chat button used to set a local `modalState` nothing rendered,
   * so it did nothing at all. Chat on this site lives in the global footer
   * overlay (`$isChatOpen` / `$nowChatId`), the same one the lev card opens —
   * a mission with no forum yet gets the temporary `-1` slot, which the footer
   * turns into a real forum on the first message (`mbId` = this mission, so it
   * is filed under it and not under the rikma at large).
   */
  function handleChat({ forumId, missionId, missionName }) {
    if (forumId > 0) {
      nowChatId.set(forumId);
      isChatOpen.set(true);
      return;
    }
    newChat.set({
      started: true,
      created: false,
      id: 0,
      md: { mbId: Number(missionId), pid: Number(projectId) }
    });
    forum.update((f) => ({
      ...f,
      [-1]: {
        loading: false,
        messages: [],
        md: {
          pid: projectId,
          mbId: missionId,
          projectName: data.projectBase?.projectName ?? '',
          projectPic: data.projectBase?.profilePic?.data?.attributes?.url ?? '',
          mesimaName: missionName
        }
      }
    }));
    nowChatId.set(-1);
    isChatOpen.set(true);
  }

  /** Tasks open in the layout's shared task modal. */
  function handleActClick(actId) {
    const acts = (missions?.mesimabetahaliches?.data ?? []).flatMap(
      (m) => m.attributes?.acts?.data ?? []
    );
    const act = acts.find((a) => String(a.id) === String(actId));
    if (act) moachStore.openActModal(act);
  }
</script>

<svelte:head>
  <title>{data.projectBase?.projectName ? `${data.projectBase.projectName} · ` : ''}{$lang === 'he' ? 'בתהליך' : $lang === 'ar' ? 'قيد التنفيذ' : 'Progress'} · 1lev1</title>
</svelte:head>

{#if openCount > 0}
  <a
    href="/moach/{projectId}/open"
    class="mx-auto mb-3 flex max-w-3xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-gold/50 bg-slate-900/60 px-4 py-2 text-sm text-gold transition-colors hover:border-gold hover:bg-slate-800/70"
  >
    🤝 <strong>{$t('moach.open.title')}</strong>
    <span class="text-slate-300">{$t('moach.open.progressLink', { count: openCount })}</span>
    <span aria-hidden="true">→</span>
  </a>
{/if}

<div class="progress-page">
  {#if missions}
    <Bethas
      bmiData={missions.mesimabetahaliches?.data ?? []}
      projectId={page.params.projectId}
      onChat={handleChat}
      onActClick={handleActClick}
    />
  {:else}
    <div class="flex justify-center p-12 text-slate-300">{$t('moach.process.loading')}</div>
  {/if}
</div>

<style>
  /* The old right-to-left green/teal slab fought the moach's dark slate shell
     and read as a demo, not as a workspace. The board now sits on the shell
     itself, in a translucent card with the site's gold edge. */
  .progress-page {
    margin: 0 auto 2rem;
    max-width: 90rem;
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.28);
    background: rgba(15, 23, 42, 0.55);
    box-shadow: 0 0 0 1px rgba(238, 232, 170, 0.1), 0 4px 24px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(6px);
    padding: 0.75rem;
  }
  @media (min-width: 640px) {
    .progress-page {
      padding: 1.15rem 1.25rem;
    }
  }
</style>
