<script>
  import { t } from '$lib/translations';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { page } from '$app/state';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';
  import Spinner from '$lib/celim/Spinner.svelte';
  import { lang } from '$lib/stores/lang.js';
  import pic from '$lib/celim/pic.js';
  import { memberShares } from '$lib/revenue/memberShares';
  import SharesPie from '$lib/components/split/SharesPie.svelte';
  import ShareCalculator from '$lib/components/split/ShareCalculator.svelte';
  import ValueBreakdown from '$lib/components/split/ValueBreakdown.svelte';
  import SplitsArchive from '$lib/components/prPr/SplitsArchive.svelte';
  import SpaceProjectionShadow from '$lib/components/consent/SpaceProjectionShadow.svelte';

  const moachStore = getMoachStore();

  let projectId = $derived(page.params.projectId);
  let projectData = $derived(moachStore.state.projects[projectId]);
  let financials = $derived(projectData?.financials);
  let base = $derived(projectData?.base);

  let loading = $state(false);

  // Distinct in both themes and both modes; the slice, its rim, the legend
  // row and the breakdown rows all carry the same one.
  const COLORS = [
    '#e11d74',
    '#2563eb',
    '#f59e0b',
    '#10b981',
    '#8b5cf6',
    '#ef4444',
    '#06b6d4',
    '#84cc16',
    '#f97316',
    '#a855f7'
  ];

  let users = $derived(base?.user_1s?.data || []);
  let fmiData = $derived(financials?.finnished_missions?.data || []);
  let rikmashes = $derived(financials?.rikmashes?.data || []);
  let stipendPayments = $derived(financials?.stipend_payments?.data || []);

  let shares = $derived(memberShares({ users, fmiData, rikmashes, stipendPayments }));

  /** The rikma's members, largest share first, each with a colour and a face. */
  let members = $derived.by(() => {
    const urls = users.map((u) => {
      const p = u.attributes?.profilePic?.data?.attributes;
      return [u.id, p?.formats?.small?.url || p?.formats?.thumbnail?.url || p?.url || null];
    });
    // A picture two members share is a default silhouette, not a face — it
    // tells nobody apart, so those members get their initial instead.
    const seen = new Map();
    for (const [, url] of urls) if (url) seen.set(url, (seen.get(url) ?? 0) + 1);
    const picOf = new Map(
      urls.map(([id, url]) => [id, url && url !== pic && seen.get(url) === 1 ? url : null])
    );
    return [...shares.rows]
      .sort((a, b) => b.total - a.total)
      .map((r, i) => ({
        ...r,
        color: COLORS[i % COLORS.length],
        photo: picOf.get(r.uid) ?? null,
        initial: (r.username || '?').trim().charAt(0).toUpperCase()
      }));
  });

  let hasValue = $derived(shares.net > 0);
  let active = $state(null);
  let selected = $state(null);

  onMount(async () => {
    if (!moachStore.isDataFresh(projectId, 'financials')) {
      loading = true;
      try {
        const res = await sendToSer(
          { pid: projectId },
          'getProjectFinancials',
          null,
          null,
          false,
          fetch
        );
        if (res?.data?.project?.data?.attributes) {
          moachStore.updateProjectData(
            projectId,
            'financials',
            res.data.project.data.attributes
          );
        }
      } finally {
        loading = false;
      }
    }
  });
</script>

<svelte:head>
  <title>{page.data.projectBase?.projectName ? `${page.data.projectBase.projectName} · ` : ''}{$lang === 'he' ? 'חלוקה' : $lang === 'ar' ? 'تقسيم' : 'Split'} · 1lev1</title>
</svelte:head>

<div class="split-page space-y-6">
  {#if loading && !financials}
    <div class="flex justify-center p-12">
      <Spinner />
    </div>
  {:else if financials}
    <!-- T2 (HANDOFF_DISTRIBUTED_DB): local projection beside the GraphQL data,
         shadow-only — renders nothing unless SPACE_SYNC_ENABLED. -->
    {#key projectId}
      <SpaceProjectionShadow {projectId} {users} />
    {/key}

    {#if hasValue}
      <section class="rounded-2xl border border-surfaceLine bg-surface text-surfaceInk text-start p-5 sm:p-6 shadow-sm">
        <h2 class="text-xl font-bold text-surfaceInk">{$t('moach.split.shares')}</h2>
        <p class="text-sm text-surfaceMuted mb-5">{$t('moach.split.sharesSub')}</p>
        <SharesPie {members} net={shares.net} others={shares.others} bind:active bind:selected />
      </section>

      <section class="rounded-2xl border border-surfaceLine bg-surface text-surfaceInk text-start p-5 sm:p-6 shadow-sm">
        <h2 class="text-xl font-bold text-surfaceInk mb-4">{$t('moach.split.calc')}</h2>
        <ShareCalculator {members} salesHref="/moach/{projectId}/sales" />
      </section>

      <section class="rounded-2xl border border-surfaceLine bg-surface text-surfaceInk text-start p-5 sm:p-6 shadow-sm">
        <ValueBreakdown {members} {fmiData} {rikmashes} {stipendPayments} bind:selected />
      </section>
    {:else}
      <section class="rounded-2xl border border-dashed border-surfaceLine bg-surface text-surfaceInk p-8 text-center shadow-sm">
        <div class="empty-pie" aria-hidden="true"></div>
        <h2 class="text-xl font-bold text-surfaceInk mt-4">{$t('moach.split.emptyTitle')}</h2>
        <p class="text-sm text-surfaceMuted mt-2 max-w-md mx-auto">{$t('moach.split.emptyBody')}</p>
        <a href="/moach/{projectId}/open" class="empty-cta">{$t('moach.split.emptyCta')}</a>
      </section>
    {/if}

    <SplitsArchive {projectId} />
  {/if}
</div>

<style>
  .empty-pie {
    width: 88px;
    height: 88px;
    margin: 0 auto;
    border-radius: 999px;
    border: 3px dashed var(--surface-line);
    background: conic-gradient(var(--surface-2) 0 100%);
  }
  .empty-cta {
    display: inline-block;
    margin-top: 1.25rem;
    padding: 0.55rem 1.1rem;
    border-radius: 999px;
    border: 1px solid var(--surface-accent);
    color: var(--surface-accent);
    font-weight: 700;
    font-size: 0.9rem;
  }
</style>
