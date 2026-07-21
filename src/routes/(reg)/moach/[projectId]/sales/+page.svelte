<script>
  const moachStore = getMoachStore();
  import Hamatanot from '$lib/components/prPr/hamatanot.svelte';
  import SalesApiIntegration from '$lib/components/prPr/SalesApiIntegration.svelte';
  import SupportPageToggle from '$lib/components/revenue/SupportPageToggle.svelte';
  import DonateDialog from '$lib/components/revenue/DonateDialog.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { page } from '$app/state';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';
  import Lowding from '$lib/celim/lowding.svelte';
  import { lang } from '$lib/stores/lang.js';

  let projectId = $derived(page.params.projectId);
  let projectData = $derived(moachStore.state.projects[projectId]);
  let financials = $derived(projectData?.financials);
  let base = $derived(projectData?.base);
  let uid = $derived(page.data.uid ?? null);
  let members = $derived(
    (base?.user_1s?.data ?? []).map((u) => ({
      id: String(u.id),
      username: u.attributes?.username ?? ''
    }))
  );

  let loading = $state(false);
  let donateOpen = $state(false);

  async function onDonated() {
    // Refetch financials so the new donation Sale shows up right away.
    moachStore.invalidate(projectId, 'financials');
    try {
      const res = await sendToSer({ pid: projectId }, 'getProjectFinancials', null, null, false, fetch);
      if (res?.data?.project?.data?.attributes) {
        moachStore.updateProjectData(projectId, 'financials', res.data.project.data.attributes);
      }
    } catch (e) {
      console.warn('[sales] financials refresh after donation failed:', e);
    }
  }

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
  <title>{page.data.projectBase?.projectName ? `${page.data.projectBase.projectName} · ` : ''}{$lang === 'he' ? 'מכירות' : $lang === 'ar' ? 'مبيعات' : 'Sales'} · 1lev1</title>
</svelte:head>

<div class="sales-page px-0 py-4">
  {#if loading && !financials}
    <div class="flex justify-center p-12">
      <Lowding />
    </div>
  {:else if financials}
    <Hamatanot
      {projectId}
      trili={financials.tosplits?.data || []}
      fmiData={financials.finnished_missions?.data || []}
      rikmashes={financials.rikmashes?.data || []}
      salee={financials.sales?.data || []}
      restime={base?.restime}
      projectUsers={base?.user_1s?.data || []}
      bmiData={financials.matanotofs?.data || []}
    />

    <!-- Donations, support-page visibility & API integration (PLAN_VOLUNTEER_RIKMA / PLAN_EXTERNAL_SALES_API) -->
    <div class="sales-extras">
      <div class="extras-card">
        <SupportPageToggle {projectId} value={base?.supportPage ?? 'off'} />
        <button type="button" class="record-donation-btn" onclick={() => (donateOpen = true)}>
          💗 {$lang === 'he' ? 'רשום תרומה' : $lang === 'ar' ? 'تسجيل تبرع' : 'Record donation'}
        </button>
      </div>
      <SalesApiIntegration
        {projectId}
        bmiData={financials.matanotofs?.data || []}
        projectUsers={base?.user_1s?.data || []}
      />
    </div>
  {/if}
</div>

<DonateDialog
  bind:isOpen={donateOpen}
  {projectId}
  projectName={base?.projectName ?? ''}
  {members}
  isRegisteredUser={true}
  isMember={true}
  {uid}
  mode="record"
  onDone={onDonated}
/>

<style>
  .sales-extras {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    align-items: start;
    gap: 1rem;
    margin-top: 2rem;
  }
  .extras-card {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    border: 1px solid var(--gold, #d4af37);
    border-radius: 0.75rem;
    padding: 1rem 1.25rem;
    background: var(--bg2, rgba(255, 255, 255, 0.04));
  }
  .record-donation-btn {
    align-self: center;
    border: 2px solid var(--gold, #d4af37);
    border-radius: 9999px;
    padding: 0.6rem 1.4rem;
    font-weight: 800;
    color: var(--barbi-pink, #ff00ae);
    background: rgba(255, 215, 0, 0.08);
    transition: all 0.2s;
    white-space: nowrap;
  }
  .record-donation-btn:hover {
    background: var(--barbi-pink, #ff00ae);
    color: #fff;
    border-color: var(--barbi-pink, #ff00ae);
  }
</style>
