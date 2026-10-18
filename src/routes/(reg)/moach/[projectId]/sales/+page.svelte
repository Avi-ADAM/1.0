<script>
  const moachStore = getMoachStore();
  import Hamatanot from '$lib/components/prPr/hamatanot.svelte';
  import SalesShortcuts from '$lib/components/shop/SalesShortcuts.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { page } from '$app/state';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';
  import Spinner from '$lib/celim/Spinner.svelte';
  import { t } from '$lib/translations';

  let { data } = $props();

  let projectId = $derived(page.params.projectId);
  let projectData = $derived(moachStore.state.projects[projectId]);
  let financials = $derived(projectData?.financials);
  let base = $derived(projectData?.base);

  let loading = $state(false);

  // The orders banner arrives streamed (+page.server.ts) — the page never waits for it.
  /** @type {{ kind: 'short' | 'toShip', count: number } | null} */
  let banner = $state(null);
  $effect(() => {
    const p = data.shopBanner;
    let live = true;
    Promise.resolve(p).then((b) => {
      if (live) banner = b ?? null;
    });
    return () => {
      live = false;
    };
  });

  onMount(async () => {
    if (!moachStore.isDataFresh(projectId, 'financials')) {
      loading = true;
      try {
        const res = await sendToSer({ pid: projectId }, 'getProjectFinancials', null, null, false, fetch);
        if (res?.data?.project?.data?.attributes) {
          moachStore.updateProjectData(projectId, 'financials', res.data.project.data.attributes);
        }
      } finally {
        loading = false;
      }
    }
  });
</script>

<svelte:head>
  <title>{page.data.projectBase?.projectName ? `${page.data.projectBase.projectName} · ` : ''}{$t('shop.page.title')} · 1lev1</title>
</svelte:head>

<!-- Site orders, and the way into "manage sales" (PLAN_SHOP_CUSTOMER_EXPERIENCE §7.3).
     The API panel, the support page and donations moved to its "connect" tab. -->
{#snippet shortcuts()}
  <SalesShortcuts {projectId} {banner} />
{/snippet}

<div class="sales-page">
  {#if loading && !financials}
    <div class="sales-wait">
      {@render shortcuts()}
      <div class="flex justify-center p-12">
        <Spinner />
      </div>
    </div>
  {:else if financials}
    <Hamatanot
      {projectId}
      trili={financials.tosplits?.data || []}
      fmiData={financials.finnished_missions?.data || []}
      rikmashes={financials.rikmashes?.data || []}
      salee={financials.sales?.data || []}
      stipendPayments={financials.stipend_payments?.data || []}
      restime={base?.restime}
      projectUsers={base?.user_1s?.data || []}
      bmiData={financials.matanotofs?.data || []}
      uid={page.data.uid ?? null}
      projectName={page.data.projectBase?.projectName ?? base?.projectName ?? ''}
      top={shortcuts}
    />
  {:else}
    <div class="sales-wait">{@render shortcuts()}</div>
  {/if}
</div>

<style>
  .sales-wait {
    padding: 12px 0;
  }
</style>
