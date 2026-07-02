<script>
  import { page } from '$app/state';
  import { untrack } from 'svelte';
  import { tick } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import Hand from '$lib/components/prPr/hand.svelte';
  import Handd from '$lib/components/prPr/handd.svelte';
  import ProcessCreator from '$lib/components/process/ProcessCreator.svelte';
  import ChoosMission from '$lib/components/prPr/choosMission.svelte';
  import OpenM from '$lib/components/prPr/newOpn.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import ResourceCreator from '$lib/components/resource/ResourceCreator.svelte';
  import Mashman from '$lib/components/prPr/mashmam.svelte';
  import Handp from '$lib/components/prPr/handp.svelte';
  import { invalidateAll } from '$app/navigation';

  const moachStore = getMoachStore();

  let { data } = $props();

  let createMode = $state(null);
  let addM = $state(false);
  let openMS = $state(false);
  let addN = $state(false);
  let openMA = $state(false);
  let hovered = $state(false);
  let hoveredd = $state(false);

  // Prefill state for action=createmission URL param
  let prefillMissionName = $state('');
  let prefillMissionDescrip = $state('');

  // Consumer for ?action=createmission — mirrors the createproject consumer in me/+page.svelte
  $effect(async () => {
    if (page.url.searchParams.has('action')) {
      await tick();
      if (page.url.searchParams.get('action') === 'createmission') {
        const params = page.url.searchParams;
        prefillMissionName    = params.get('name') ?? '';
        prefillMissionDescrip = params.get('descrip') ?? '';
        addM = true;
      }
    }
  });

  let projectBase = $derived(data.projectBase);
  // projectMissionsData = full project.attributes from getProjectMissions query
  // (same format the progress page stores in moachStore.missions)
  let projectMissionsData = $derived(data.projectMissionsData);
  let noofopen = $derived(projectMissionsData?.open_missions?.data?.length ?? 0);
  let omiData = $derived(projectMissionsData?.open_missions?.data ?? []);
  /** @type {any[]} */
  let missionTemplates = $derived(data.missionTemplates ?? []);
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const base = import.meta.env.VITE_URL || '';
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanUrl}`;
  };

  let pn = $derived(projectBase?.projectName ?? '');
  let pl = $derived(getImageUrl(projectBase?.profilePic?.data?.attributes?.url));
  let projectUsers = $derived(projectBase?.user_1s?.data ?? []);
  let restime = $derived(projectBase?.restime);
  /** @type {string[]} */
  let alit = $derived(projectBase?.vallues?.data?.map((v) => v.id) ?? []);

  let openResources = $derived(projectMissionsData?.open_mashaabims?.data ?? []);
  let pmashes = $derived(projectMissionsData?.pmashes?.data ?? []);
  let combinedResources = $derived([...openResources, ...pmashes]);

  let projectId = $derived(page.params.projectId);

  // Seed moachStore in the same format the progress page expects
  $effect(() => {
    if (projectId && projectMissionsData) {
      untrack(() =>
        moachStore.updateProjectData(projectId, 'missions', projectMissionsData)
      );
    }
  });

  const hosafa = {
    he: 'הוספת פעולות נדרשות לריקמה',
    en: 'add needed missions to FreeMates',
    ar: ''
  };

  const hosafat = {
    he: 'הוספת משאבים נדרשים לריקמה',
    en: 'add needed resources to FreeMates',
    ar: ''
  };

  const i18n = {
    he: {
      mission: 'יצירת משימה',
      missionDesc: 'הוספת משימה חדשה לפרויקט',
      resource: 'בקשת משאב',
      resourceDesc: 'בקשת כסף, ציוד או מידע',
      process: 'יצירת תהליך',
      processDesc: 'בניית שרשרת פעולות מורכבת',
      back: 'חזרה',
      clickHandMission: 'לחיצה על היד כדי ליצור משימה',
      clickHandResource: 'לחיצה על היד כדי לבקש משאב'
    },
    en: {
      mission: 'Create Mission',
      missionDesc: 'Add a new mission to the project',
      resource: 'Request Resource',
      resourceDesc: 'Request money, gear, or info',
      process: 'Create Process',
      processDesc: 'Build a complex chain of actions',
      back: 'Back',
      clickHandMission: 'Click on the hand to create a mission',
      clickHandResource: 'Click on the hand to request a resource'
    },
    ar: {
      mission: 'إنشاء مهمة',
      missionDesc: 'إضافة مهمة جديدة للمشروع',
      resource: 'طلب مورد',
      resourceDesc: 'طلب مال أو معدات أو معلومات',
      process: 'إنشاء عملية',
      processDesc: 'بناء سلسلة معقدة من الإجراءات',
      back: 'عودة',
      clickHandMission: 'انقر على اليد لإنشاء مهمة',
      clickHandResource: 'انقر على اليد لطلب مورد'
    }
  };

  let t = $derived(i18n[$lang] || i18n.en);

  function hosa() {
    addM = true;
  }

  function bighand() {
    hovered = !hovered;
  }

  function trym() {
    openMS = true;
  }

  function closeM() {
    addM = false;
  }

  function handleBack() {
    createMode = null;
    addM = false;
    openMS = false;
    addN = false;
    openMA = false;
  }

  async function handleCreated() {
    await invalidateAll();
    handleBack();
  }
</script>

<svelte:head>
  <title>{data.projectBase?.projectName ? `${data.projectBase.projectName} · ` : ''}{$lang === 'he' ? 'יצירה' : $lang === 'ar' ? 'إنشاء' : 'Create'} · 1lev1</title>
  <link rel="preload" as="image" href="https://res.cloudinary.com/love1/image/upload/v1642614850/buttonP2_tock4d.svg" />
  <link rel="preload" as="image" href="https://res.cloudinary.com/love1/image/upload/v1647481283/mashahab_ge9ant.svg" />
</svelte:head>

<div class="create-page p-4">

  <!-- כרטיסים עם עיגולים מוטמעים — נעלמים כשפורם פתוח -->
  {#if !addM && !openMS && !addN && !openMA && createMode !== 'process'}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto py-12">

      <!-- משימה -->
      <div class="flex flex-col items-center gap-3 p-6 border border-barbi rounded-2xl bg-gradient-to-br from-gra via-grb to-gre drop-shadow-lg shadow-gold">
        <h3 class="text-lg font-bold">{t.mission}</h3>
        <p class="text-sm text-gray-500 text-center">{t.missionDesc}</p>
        {#if hovered}
          <button onclick={hosa} onmouseleave={() => (hovered = false)}>
            <img
              title={hosafa[$lang]}
              style="max-width:45vw; max-height:45vw;"
              width="240"
              height="240"
              src="https://res.cloudinary.com/love1/image/upload/v1642614850/buttonP2_tock4d.svg"
              alt="add mission"
            />
          </button>
        {:else}
          <Hand
            onHosa={hosa}
            onProgres={bighand}
            onTrym={trym}
            {noofopen}
            {openMS}
            {addM}
            hosafa={hosafa[$lang]}
          />
        {/if}
      </div>

      <!-- משאב -->
      <div class="flex flex-col items-center gap-3 p-6 border border-barbi rounded-2xl bg-gradient-to-br from-gra via-grb to-gre drop-shadow-lg shadow-gold">
        <h3 class="text-lg font-bold">{t.resource}</h3>
        <p class="text-sm text-gray-500 text-center">{t.resourceDesc}</p>
        {#if hoveredd}
          <button onclick={() => (addN = true)} onmouseleave={() => (hoveredd = false)}>
            <img
              title={hosafat[$lang]}
              style="max-width:45vw; max-height:45vw;"
              width="240"
              height="240"
              src="https://res.cloudinary.com/love1/image/upload/v1647481283/mashahab_ge9ant.svg"
              alt="add resource"
            />
          </button>
        {:else}
          <Handd
            {addN}
            {openMA}
            hosafat={hosafat[$lang]}
            noofopenm={combinedResources.length}
            onMasi={() => (addN = true)}
            onBighandd={() => (hoveredd = !hoveredd)}
            onTrym={() => (openMA = true)}
          />
        {/if}
      </div>

      <!-- תהליך -->
      <div class="flex flex-col items-center gap-3 p-6 border border-barbi rounded-2xl bg-gradient-to-br from-gra via-grb to-gre drop-shadow-lg shadow-gold">
        <h3 class="text-lg font-bold">{t.process}</h3>
        <p class="text-sm text-gray-500 text-center">{t.processDesc}</p>
        <Handp
          hosafap={t.process}
          onClick={() => (createMode = 'process')}
        />
      </div>

    </div>
  {/if}

  <!-- פורמים — עם כפתור חזרה -->
  {#if addM || openMS || addN || openMA || createMode === 'process'}
    <div class="max-w-4xl mx-auto">
      <button
        onclick={handleBack}
        class="mb-6 flex items-center gap-2 text-gold hover:text-barbi hover:underline"
      >
        <svg
          class="w-4 h-4 transition-transform duration-200"
          class:rotate-180={$lang === 'he' || $lang === 'ar'}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg
        >
        {t.back}
      </button>

      <!-- פורמי משימה -->
      {#if openMS}
        <div class="m-4 border-2 border-barbi rounded bg-white/80 backdrop-blur-sm shadow-xl">
          <div class="p-2 flex justify-end">
            <button
              onclick={() => (openMS = false)}
              aria-label={t.back}
              class="hover:bg-barbi text-gold hover:text-white font-bold p-1 rounded-full transition-colors"
            >
              <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
              </svg>
            </button>
          </div>
          <OpenM {omiData} projectName={pn} />
        </div>
      {/if}
      {#if addM}
        <div class="m-4 border-2 border-barbi rounded bg-white/80 backdrop-blur-sm shadow-xl">
          <div class="p-2 flex justify-end">
            <button
              onclick={closeM}
              aria-label={t.back}
              class="hover:bg-barbi text-gold hover:text-white font-bold p-1 rounded-full transition-colors"
            >
              <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
              </svg>
            </button>
          </div>
          <ChoosMission mission1={missionTemplates} {pn} {pl} {restime} {projectUsers} {alit} onClose={closeM} name={prefillMissionName} initialDescrip={prefillMissionDescrip} />
        </div>
      {/if}

      <!-- פורמי משאב -->
      {#if openMA}
        <div class="m-4 border-2 border-barbi rounded bg-white/80 backdrop-blur-sm shadow-xl">
          <div class="p-2 flex justify-end">
            <button
              onclick={() => (openMA = false)}
              aria-label={t.back}
              class="hover:bg-barbi text-gold hover:text-white font-bold p-1 rounded-full transition-colors"
            >
              <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
              </svg>
            </button>
          </div>
          <Mashman meData={combinedResources} />
        </div>
      {/if}
      {#if addN}
        <div class="m-4 border-2 border-barbi rounded bg-white/80 backdrop-blur-sm shadow-xl p-6">
          <ResourceCreator
            {projectId}
            onCreated={handleCreated}
            onCancel={() => (addN = false)}
          />
        </div>
      {/if}

      <!-- תהליך -->
      {#if createMode === 'process'}
        <ProcessCreator
          projectId={page.params.projectId}
          onCreated={() => { createMode = null; }}
          onSelect={() => {}}
        />
      {/if}
    </div>
  {/if}

</div>
