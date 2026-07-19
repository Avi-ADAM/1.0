<script>
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { loadProjectProcesses } from '$lib/utils/processes';
  import ProcessBoard from '$lib/components/process/ProcessBoard.svelte';
  import { onMount } from 'svelte';
  import Lowding from '$lib/celim/lowding.svelte';
  import { goto } from '$app/navigation';

  const moachStore = getMoachStore();
  let projectId = $derived(page.params.projectId);

  let processes = $state([]);
  let loading = $state(true);

  onMount(async () => {
    try {
      processes = await loadProjectProcesses(projectId, fetch);
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  });

  const i18n = {
    he: { title: 'תהליכים', empty: 'אין תהליכים בפרויקט זה עדיין', objects: 'אובייקטים לפי סוג:' },
    en: { title: 'Processes', empty: 'No processes in this project yet', objects: 'Objects by type:' },
    ar: { title: 'العمليات', empty: 'لا توجد عمليات في هذا المشروع بعد', objects: 'الكائنات حسب النوع:' }
  };
  let t = $derived(i18n[$lang] || i18n.en);

  // Quick access to the per-type object indexes (object/[type]) — every
  // lifecycle object also has a standalone page, independent of its process.
  const objectTypeLabels = {
    he: {
      pendm: 'משימות ממתינות', openMission: 'משימות פתוחות', ask: 'בקשות הצטרפות',
      betahalich: 'משימות בביצוע', act: 'מטלות', finiapruval: 'אשרורי סיום',
      finnished: 'משימות שהושלמו', pmash: 'משאבים ממתינים', openMashaabim: 'משאבים פתוחים',
      askm: 'הצעות אספקה', maap: 'אספקות בתהליך', rikmash: 'משאבים שהתקבלו',
      matanot: 'מוצרים', sale: 'מכירות'
    },
    en: {
      pendm: 'Pending missions', openMission: 'Open missions', ask: 'Join requests',
      betahalich: 'Missions in progress', act: 'Tasks', finiapruval: 'Finish approvals',
      finnished: 'Completed missions', pmash: 'Pending resources', openMashaabim: 'Open resources',
      askm: 'Supply proposals', maap: 'Deliveries in progress', rikmash: 'Received resources',
      matanot: 'Products', sale: 'Sales'
    },
    ar: {
      pendm: 'مهام معلقة', openMission: 'مهام مفتوحة', ask: 'طلبات انضمام',
      betahalich: 'مهام قيد التنفيذ', act: 'مهام صغيرة', finiapruval: 'موافقات إنهاء',
      finnished: 'مهام مكتملة', pmash: 'موارد معلقة', openMashaabim: 'موارد مفتوحة',
      askm: 'عروض توريد', maap: 'توريدات قيد التنفيذ', rikmash: 'موارد مستلمة',
      matanot: 'منتجات', sale: 'مبيعات'
    }
  };
  let objectLabels = $derived(objectTypeLabels[$lang] || objectTypeLabels.en);
</script>

<svelte:head>
  <title>{page.data.projectBase?.projectName ? `${page.data.projectBase.projectName} · ` : ''}{$lang === 'he' ? 'תהליכים' : $lang === 'ar' ? 'العمليات' : 'Processes'} · 1lev1</title>
</svelte:head>

<div class="processes-page space-y-6">
  <h1 class="text-2xl font-bold text-primary">{t.title}</h1>

  <div class="flex flex-wrap items-center justify-center gap-1.5 text-xs">
    <span class="text-slate-400 font-semibold me-1">{t.objects}</span>
    {#each Object.keys(objectLabels) as key (key)}
      <a
        href="/moach/{projectId}/object/{key}"
        class="px-2.5 py-0.5 rounded-full border border-slate-500 text-slate-300 hover:text-gold hover:border-gold whitespace-nowrap transition-colors"
      >
        {objectLabels[key]}
      </a>
    {/each}
  </div>

  {#if loading}
    <div class="flex justify-center p-12"><Lowding /></div>
  {:else if processes.length > 0}
    <ProcessBoard
      {processes}
      selectable={true}
      onSelect={(p) => goto(`/moach/${projectId}/processes/${p.id}`)}
    />
  {:else}
    <div class="p-12 text-center text-gray-400 italic">{t.empty}</div>
  {/if}
</div>
