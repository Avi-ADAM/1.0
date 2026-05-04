<script>
  const moachStore = getMoachStore();
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import Hand from '$lib/components/prPr/hand.svelte';
  import Handd from '$lib/components/prPr/handd.svelte';
  import ProcessCreator from '$lib/components/process/ProcessCreator.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';

  let projectId = $derived(page.params.projectId);

  let createMode = $state(null); // 'mission' | 'resource' | 'process'

  const i18n = {
    he: {
      mission: 'יצירת משימה',
      missionDesc: 'הוספת משימה חדשה לפרויקט',
      resource: 'בקשת משאב',
      resourceDesc: 'בקשת כסף, ציוד או מידע',
      process: 'יצירת תהליך',
      processDesc: 'בניית שרשרת פעולות מורכבת',
      back: 'חזרה'
    },
    en: {
      mission: 'Create Mission',
      missionDesc: 'Add a new mission to the project',
      resource: 'Request Resource',
      resourceDesc: 'Request money, gear, or info',
      process: 'Create Process',
      processDesc: 'Build a complex chain of actions',
      back: 'Back'
    },
    ar: {
      mission: 'إنشاء مهمة',
      missionDesc: 'إضافة مهمة جديدة للمشروع',
      resource: 'طلب مورد',
      resourceDesc: 'طلب مال أو معدات أو معلومات',
      process: 'إنشاء عملية',
      processDesc: 'بناء سلسلة معقدة من الإجراءات',
      back: 'عودة'
    }
  };

  let t = $derived(i18n[$lang] || i18n.en);

  function handleBack() {
    createMode = null;
  }
</script>

<div class="create-page p-4">
  {#if !createMode}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto py-12">
      <!-- Mission -->
      <button onclick={() => createMode = 'mission'} class="flex flex-col items-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:-translate-y-1 group">
        <div class="p-4 bg-gray-50 rounded-xl transition-colors group-hover:bg-pink-50">
          <svg class="w-12 h-12 text-primary" viewBox="0 0 24 24"><path fill="currentColor" d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>
        </div>
        <h3 class="text-lg font-bold mt-4">{t.mission}</h3>
        <p class="text-sm text-gray-500">{t.missionDesc}</p>
      </button>

      <!-- Resource -->
      <button onclick={() => createMode = 'resource'} class="flex flex-col items-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:-translate-y-1 group">
        <div class="p-4 bg-gray-50 rounded-xl transition-colors group-hover:bg-pink-50">
          <svg class="w-12 h-12 text-primary" viewBox="0 0 24 24"><path fill="currentColor" d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A1 1 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.32-.18.72-.18 1.14 0l7.9 4.44c.32.17.53.5.53.88v9M12 4.15L10.11 5.22 16 8.61l1.96-1.11L12 4.15M6.04 7.5L12 10.85l1.96-1.1-5.88-3.4L6.04 7.5M5 15.91l6 3.38v-6.71L5 9.21v6.7M19 15.91V9.21l-6 3.37v6.71l6-3.38z"/></svg>
        </div>
        <h3 class="text-lg font-bold mt-4">{t.resource}</h3>
        <p class="text-sm text-gray-500">{t.resourceDesc}</p>
      </button>

      <!-- Process -->
      <button onclick={() => createMode = 'process'} class="flex flex-col items-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:-translate-y-1 group">
        <div class="p-4 bg-gray-50 rounded-xl transition-colors group-hover:bg-pink-50">
          <svg class="w-12 h-12 text-primary" viewBox="0 0 24 24"><path fill="currentColor" d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
        </div>
        <h3 class="text-lg font-bold mt-4">{t.process}</h3>
        <p class="text-sm text-gray-500">{t.processDesc}</p>
      </button>
    </div>
  {:else}
    <div class="max-w-4xl mx-auto">
      <button onclick={handleBack} class="mb-6 flex items-center gap-2 text-primary hover:underline">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        {t.back}
      </button>

      {#if createMode === 'mission'}
        <Hand {projectId} />
      {:else if createMode === 'resource'}
        <Handd {projectId} />
      {:else if createMode === 'process'}
        <ProcessCreator {projectId} />
      {/if}
    </div>
  {/if}
</div>
