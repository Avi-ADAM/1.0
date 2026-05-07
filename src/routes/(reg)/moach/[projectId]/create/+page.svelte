<script>
  import { page } from '$app/state';
  import { untrack } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import Hand from '$lib/components/prPr/hand.svelte';
  import Handd from '$lib/components/prPr/handd.svelte';
  import ProcessCreator from '$lib/components/process/ProcessCreator.svelte';
  import ChoosMission from '$lib/components/prPr/choosMission.svelte';
  import OpenM from '$lib/components/prPr/newOpn.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import ResourceCreator from '$lib/components/resource/ResourceCreator.svelte';
  import Mashman from '$lib/components/prPr/mashmam.svelte';
  import { invalidateAll } from '$app/navigation';

  const moachStore = getMoachStore();

  let { data } = $props();

  let createMode = $state(null);
  let addM = $state(false);
  let openMS = $state(false);
  let addN = $state(false);
  let openMA = $state(false);

  let projectBase = $derived(data.projectBase);
  // projectMissionsData = full project.attributes from getProjectMissions query
  // (same format the progress page stores in moachStore.missions)
  let projectMissionsData = $derived(data.projectMissionsData);
  let noofopen = $derived(projectMissionsData?.open_missions?.data?.length ?? 0);
  let omiData = $derived(projectMissionsData?.open_missions?.data ?? []);
  /** @type {any[]} */
  let missionTemplates = $derived(data.missionTemplates ?? []);
  let pn = $derived(projectBase?.projectName ?? '');
  let pl = $derived(projectBase?.profilePic?.data?.attributes?.url ?? '');
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
    // hover state is handled inside the Hand SVG via onmouseenter
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

<div class="create-page p-4">
  {#if !createMode}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto py-12">
      <!-- Mission -->
      <button
        onclick={() => (createMode = 'mission')}
        class="group flex flex-col items-center gap-4 p-8 border border-barbi hover:border-gold rounded-2xl bg-gradient-to-br from-gra via-grb to-gre hover:from-barbi hover:via-fuchsia-400 hover:to-mpink transition-all duration-300 drop-shadow-lg shadow-gold"
      >
        <div class="p-4 bg-gray-50 rounded-xl transition-colors group-hover:bg-pink-50">
          <svg class="w-12 h-12 text-primary" viewBox="0 0 24 24"
            ><path fill="currentColor" d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" /></svg
          >
        </div>
        <h3 class="text-lg font-bold mt-4">{t.mission}</h3>
        <p class="text-sm text-gray-500">{t.missionDesc}</p>
      </button>

      <!-- Resource -->
      <button
        onclick={() => (createMode = 'resource')}
        class="group flex flex-col items-center gap-4 p-8 border border-barbi hover:border-gold rounded-2xl bg-gradient-to-br from-gra via-grb to-gre hover:from-barbi hover:via-fuchsia-400 hover:to-mpink transition-all duration-300 drop-shadow-lg shadow-gold"
      >
        <div class="p-4 bg-gray-50 rounded-xl transition-colors group-hover:bg-pink-50">
          <svg class="w-12 h-12 text-primary" viewBox="0 0 24 24"
            ><path
              fill="currentColor"
              d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A1 1 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.32-.18.72-.18 1.14 0l7.9 4.44c.32.17.53.5.53.88v9M12 4.15L10.11 5.22 16 8.61l1.96-1.11L12 4.15M6.04 7.5L12 10.85l1.96-1.1-5.88-3.4L6.04 7.5M5 15.91l6 3.38v-6.71L5 9.21v6.7M19 15.91V9.21l-6 3.37v6.71l6-3.38z"
            /></svg
          >
        </div>
        <h3 class="text-lg font-bold mt-4">{t.resource}</h3>
        <p class="text-sm text-gray-500">{t.resourceDesc}</p>
      </button>

      <!-- Process -->
      <button
        onclick={() => (createMode = 'process')}
        class="group flex flex-col items-center gap-4 p-8 border border-barbi hover:border-gold rounded-2xl bg-gradient-to-br from-gra via-grb to-gre hover:from-barbi hover:via-fuchsia-400 hover:to-mpink transition-all duration-300 drop-shadow-lg shadow-gold"
      >
        <div class="p-4 bg-gray-50 rounded-xl transition-colors group-hover:bg-pink-50">
          <svg class="w-12 h-12 text-primary" viewBox="0 0 24 24"
            ><path
              fill="currentColor"
              d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
            /></svg
          >
        </div>
        <h3 class="text-lg font-bold mt-4">{t.process}</h3>
        <p class="text-sm text-gray-500">{t.processDesc}</p>
      </button>
    </div>
  {:else}
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

      {#if createMode === 'mission'}
        {#if !addM && !openMS}
          <div class="flex flex-col items-center gap-4 py-2">
            <p class="text-2xl font-bold text-primary animate-pulse text-center">
              {t.clickHandMission}
            </p>
            <div class="flex justify-center">
              <Hand
                onHosa={hosa}
                onProgres={bighand}
                onTrym={trym}
                {noofopen}
                {openMS}
                {addM}
                hosafa=""
                showText={false}
              />
            </div>
          </div>
        {/if}

        <div>
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
                    <path
                      fill="currentColor"
                      d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
                    />
                  </svg>
                </button>
              </div>
              <ChoosMission mission1={missionTemplates} {pn} {pl} {restime} {projectUsers} {alit} onClose={closeM} />
            </div>
          {/if}
        </div>
      {:else if createMode === 'resource'}
        {#if !addN && !openMA}
          <div class="flex flex-col items-center gap-4 py-2">
            <p class="text-2xl font-bold text-primary animate-pulse text-center">
              {t.clickHandResource}
            </p>
            <div class="flex justify-center">
              <Handd
                {addN}
                {openMA}
                hosafat=""
                showText={false}
                onMasi={() => { addN = true; }}
                onBighandd={() => {}}
                onTrym={() => { openMA = true; }}
              />
            </div>
          </div>
        {/if}

        <div>
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
        </div>
      {:else if createMode === 'process'}
        <ProcessCreator
          projectId={page.params.projectId}
          onCreated={() => { createMode = null; }}
          onSelect={() => {}}
        />
      {/if}
    </div>
  {/if}
</div>
