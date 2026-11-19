<script>
  import { nameOf } from '$lib/translation/memberName';
  import { t } from '$lib/translations';
  import Money from '$lib/components/money/Money.svelte';
  const moachStore = getMoachStore();
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';
  import Spinner from '$lib/celim/Spinner.svelte';
  import { useRealtime } from '$lib/realtime/bus.svelte';
  import { batchTouchesRikma } from '$lib/realtime/routing';

  let projectId = $derived(page.params.projectId);
  let saleId = $derived(page.params.saleId);

  let sale = $state(null);
  let loading = $state(true);

  async function reload() {
    try {
      const res = await sendToSer({ pid: projectId }, 'getProjectFinancials', null, null, false, fetch);
      sale = res?.data?.project?.data?.attributes?.sales?.data?.find(s => s.id === saleId);
    } finally {
      loading = false;
    }
  }

  onMount(reload);

  // Another member changed something this tab shows (docs/inprogress/PLAN_REALTIME_MIGRATION.md, R5).
  useRealtime(['sale:*'], (b) => {
    if (batchTouchesRikma(b, projectId)) reload();
  });

  // Holder-consent status chip (PLAN_sale_holder_consent). null = legacy sale
  // predating this feature — shown unverified but still counted (grandfathered).
  function holderLabel(s) {
    const hs = s?.attributes?.holderStatus;
    const holderName = $nameOf(s?.attributes?.users_permissions_user?.data?.attributes) || '';
    if (hs === 'self') return $t('moach.sale.holderSelf');
    if (hs === 'open') return $t('moach.sale.holderOpen', { name: holderName });
    if (hs === 'confirmed') {
      return s?.attributes?.confirmedBy === 'timeout'
        ? $t('moach.sale.holderAutoApproved')
        : $t('moach.sale.holderConfirmed');
    }
    return $t('moach.sale.holderLegacy');
  }

  let jsonLd = $derived(sale ? {
    "@context": "https://schema.org",
    "@type": "MoachEntity",
    "entityType": "sale",
    "id": saleId,
    "projectId": projectId,
    "title": `Sale: ${sale.attributes.matanot?.data?.attributes?.name || saleId}`,
    "status": sale.attributes.splited ? "finished" : "pending"
  } : null);
</script>

<svelte:head>
  {#if sale}
    <title>Sale - {saleId}</title>
    <meta name="moach:entity-type" content="sale" />
    <meta name="moach:entity-id" content={saleId} />
    <meta name="moach:project-id" content={projectId} />
    <script type="application/ld+json">
      {JSON.stringify(jsonLd)}
    </script>
  {/if}
</svelte:head>

<div class="sale-entity-page space-y-6">
  {#if loading}
    <div class="flex justify-center p-12"><Spinner /></div>
  {:else if sale}
    <header id="header" class="bg-white p-6 rounded-xl shadow-sm">
      <nav class="text-sm text-gray-500 mb-2">
        Moach > {projectId} > Sales
      </nav>
      <h1 class="text-2xl font-bold text-gray-900">{$t('moach.sale.details')}</h1>
    </header>

    <div class="bg-white p-6 rounded-xl shadow-sm space-y-4">
      <div class="grid grid-cols-2 gap-4 border-b pb-4">
        <div>
          <p class="text-sm text-gray-500">{$t('moach.sale.amount')}</p>
          <p class="text-xl font-bold"><Money amount={sale.attributes.in} entry={sale.attributes} /></p>
        </div>
        <div>
          <p class="text-sm text-gray-500">{$t('moach.sale.date')}</p>
          <p class="font-medium">{sale.attributes.date}</p>
        </div>
      </div>
      <div>
        <p class="text-sm text-gray-500">{$t('moach.sale.note')}</p>
        <p class="text-gray-700">{sale.attributes.note || 'No note.'}</p>
      </div>
      <div>
        <p class="text-sm text-gray-500">{$t('moach.sale.status')}</p>
        <p class="font-medium">{holderLabel(sale)}</p>
      </div>
    </div>
  {:else}
    <div class="p-12 text-center text-gray-500">Sale not found.</div>
  {/if}
</div>
