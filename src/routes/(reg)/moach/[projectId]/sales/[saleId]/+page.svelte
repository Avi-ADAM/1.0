<script>
  const moachStore = getMoachStore();
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';
  import Lowding from '$lib/celim/lowding.svelte';

  let projectId = $derived(page.params.projectId);
  let saleId = $derived(page.params.saleId);

  let sale = $state(null);
  let loading = $state(true);

  onMount(async () => {
    try {
      const res = await sendToSer({ pid: projectId }, 'getProjectFinancials', null, null, false, fetch);
      sale = res?.data?.project?.data?.attributes?.sales?.data?.find(s => s.id === saleId);
    } finally {
      loading = false;
    }
  });

  const i18n = {
    he: { details: 'פרטי מכירה', amount: 'סכום', date: 'תאריך', buyer: 'קונה', note: 'הערה', status: 'סטטוס' },
    en: { details: 'Sale Details', amount: 'Amount', date: 'Date', buyer: 'Buyer', note: 'Note', status: 'Status' },
    ar: { details: 'تفاصيل البيع', amount: 'المبلغ', date: 'التاريخ', buyer: 'المشتري', note: 'ملاحظة', status: 'الحالة' }
  };
  let t = $derived(i18n[$lang] || i18n.en);

  // Holder-consent status chip (PLAN_sale_holder_consent). null = legacy sale
  // predating this feature — shown unverified but still counted (grandfathered).
  function holderLabel(s) {
    const hs = s?.attributes?.holderStatus;
    const holderName = s?.attributes?.users_permissions_user?.data?.attributes?.username ?? '';
    if (hs === 'self') return $lang === 'he' ? 'מאומת (עצמי)' : 'verified (self)';
    if (hs === 'open') return $lang === 'he' ? `בהסכמה מול ${holderName}` : `awaiting ${holderName}'s consent`;
    if (hs === 'confirmed') {
      return s?.attributes?.confirmedBy === 'timeout'
        ? ($lang === 'he' ? 'אושר בשתיקה' : 'auto-approved')
        : ($lang === 'he' ? 'אושר' : 'confirmed');
    }
    return $lang === 'he' ? 'לא מאומת (legacy)' : 'unverified (legacy)';
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
    <title>Sale — {saleId}</title>
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
    <div class="flex justify-center p-12"><Lowding /></div>
  {:else if sale}
    <header id="header" class="bg-white p-6 rounded-xl shadow-sm">
      <nav class="text-sm text-gray-500 mb-2">
        Moach > {projectId} > Sales
      </nav>
      <h1 class="text-2xl font-bold text-gray-900">{t.details}</h1>
    </header>

    <div class="bg-white p-6 rounded-xl shadow-sm space-y-4">
      <div class="grid grid-cols-2 gap-4 border-b pb-4">
        <div>
          <p class="text-sm text-gray-500">{t.amount}</p>
          <p class="text-xl font-bold">{sale.attributes.in}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500">{t.date}</p>
          <p class="font-medium">{sale.attributes.date}</p>
        </div>
      </div>
      <div>
        <p class="text-sm text-gray-500">{t.note}</p>
        <p class="text-gray-700">{sale.attributes.note || 'No note.'}</p>
      </div>
      <div>
        <p class="text-sm text-gray-500">{t.status}</p>
        <p class="font-medium">{holderLabel(sale)}</p>
      </div>
    </div>
  {:else}
    <div class="p-12 text-center text-gray-500">Sale not found.</div>
  {/if}
</div>
