<script>
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { lang } from '$lib/stores/lang.js';
  import AuthorityBadge from '$lib/components/ui/AuthorityBadge.svelte';
  import Pub from '$lib/celim/icons/pub.svelte';
  import { projectTimersStore, fetchProjectTimers } from '$lib/stores/projectTimers.js';
  import { onMount, onDestroy } from 'svelte';
  import { setMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { socketClient } from '$lib/stores/socketClient';

  let { children, data } = $props();
  const moachStore = setMoachStore();

  $effect(() => {
    if (data.projectBase && projectId) {
      moachStore.updateProjectData(projectId, 'base', data.projectBase);
    }
  });

  let projectId = $derived(page.params.projectId);
  let projectBase = $derived(data.projectBase);
  let currentPath = $derived(page.url.pathname);

  let socketUnsubscribe;

  onMount(() => {
    if (projectId) {
      fetchProjectTimers(projectId, fetch);

      // Socket integration for real-time invalidation
      socketClient.connect(data.uid);
      socketUnsubscribe = socketClient.onNotification((notification) => {
        console.log('[MoachLayout] Socket notification:', notification);

        // If notification implies data change, invalidate store cache
        // type could be 'mission', 'base', 'financials' etc depending on backend payload
        const type = notification.metadata?.type || notification.data?.type;
        if (type && projectId) {
           moachStore.invalidate(projectId, type);
           // Optionally trigger re-fetch immediately for active tab
        } else if (projectId) {
           // Broad invalidation if type unknown
           moachStore.invalidate(projectId, 'base');
           moachStore.invalidate(projectId, 'missions');
        }
      });
    }
  });

  onDestroy(() => {
    if (socketUnsubscribe) socketUnsubscribe();
  });

  const i18n = {
    he: {
      back: 'חזרה לרשימה',
      main: 'ראשי',
      create: 'יצירה',
      gantt: 'גאנט',
      split: 'חלוקה',
      progress: 'בתהליך',
      acts: 'פעולות',
      timers: 'טיימרים',
      kanban: 'קאנבן',
      chains: 'שרשראות',
      sales: 'מכירות',
      shifts: 'משמרות',
      editPic: 'עריכת תמונה',
      upload: 'העלאה',
      editDetails: 'עריכת פרטים',
      publicProfile: 'פרופיל ציבורי',
      activeNow: 'פעיל כעת'
    },
    en: {
      back: 'Back to list',
      main: 'Main',
      create: 'Create',
      gantt: 'Gantt',
      split: 'Split',
      progress: 'Progress',
      acts: 'Acts',
      timers: 'Timers',
      kanban: 'Kanban',
      chains: 'Chains',
      sales: 'Sales',
      shifts: 'Shifts',
      editPic: 'Edit Picture',
      upload: 'Upload',
      editDetails: 'Edit Details',
      publicProfile: 'Public Profile',
      activeNow: 'Active Now'
    },
    ar: {
      back: 'العودة للقائمة',
      main: 'الرئيسية',
      create: 'إنشاء',
      gantt: 'جانت',
      split: 'تقسيم',
      progress: 'قيد التنفيذ',
      acts: 'أعمال',
      timers: 'مؤقتات',
      kanban: 'كانبان',
      chains: 'سلاسل',
      sales: 'مبيعات',
      shifts: 'مناوبات',
      editPic: 'تعدיל الصورة',
      upload: 'تحميل',
      editDetails: 'تعدיל التفاصيل',
      publicProfile: 'الملف الشخصي العام',
      activeNow: 'نشط الآن'
    }
  };

  let t = $derived(i18n[$lang] || i18n.en);

  const tabs = [
    { id: 'main', label: 'main' },
    { id: 'create', label: 'create' },
    { id: 'gantt', label: 'gantt' },
    { id: 'split', label: 'split' },
    { id: 'progress', label: 'progress' },
    { id: 'acts', label: 'acts' },
    { id: 'timers', label: 'timers' },
    { id: 'kanban', label: 'kanban' },
    { id: 'chains', label: 'chains' },
    { id: 'sales', label: 'sales' },
    { id: 'shifts', label: 'shifts' }
  ];

  function isActive(tabId) {
    return currentPath.includes(`/${tabId}`);
  }
</script>

{#if projectBase}
<div class="moach-layout min-h-screen bg-gray-50">
  <header class="bg-white shadow-sm p-4">
    <div class="max-w-7xl mx-auto flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <button
            onclick={() => goto('/moach')}
            class="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            <span class="text-sm font-medium hidden sm:inline">{t.back}</span>
          </button>

          <AuthorityBadge
            logoSrc={projectBase.profilePic?.data?.attributes?.url}
            projectName={projectBase.projectName}
            memberCount={projectBase.user_1s?.data?.length || 0}
            size={120}
          />
        </div>

        <div class="flex items-center gap-2">
          <!-- Social & Actions -->
          {#if projectBase.discordlink}
            <a href={projectBase.discordlink} target="_blank" class="p-2 hover:bg-gray-100 rounded-full">
              <img src="https://res.cloudinary.com/love1/image/upload/v1662563246/discord-icon-svgrepo-com_d4vk6m.svg" class="w-6 h-6" alt="Discord" />
            </a>
          {/if}
          {#if projectBase.githublink}
             <a href={projectBase.githublink} target="_blank" class="p-2 hover:bg-gray-100 rounded-full">
              <img src="https://visualpharm.com/assets/720/Github-595b40b65ba036ed117d442f.svg" class="w-6 h-6" alt="GitHub" />
            </a>
          {/if}
          <button onclick={() => goto(`/project/${projectId}`)} class="p-2 hover:bg-gray-100 rounded-full" title={t.publicProfile}>
            <Pub />
          </button>
        </div>
      </div>

      <!-- Member Avatars with Timer Indicators -->
      <div class="flex -space-x-2 overflow-x-auto py-2" dir={$lang === 'he' ? 'rtl' : 'ltr'}>
        {#each projectBase.user_1s?.data || [] as user}
          {@const projectTimerData = $projectTimersStore[projectId]?.data}
          {@const timers = projectTimerData?.timers?.data || []}
          {@const hasActiveTimer = timers.some(t =>
            t.attributes?.mesimabetahalich?.data?.attributes?.users_permissions_user?.data?.id == user.id &&
            t.attributes?.isActive
          )}
          <button
            onclick={() => goto(`/user/${user.id}`)}
            class="relative transition-transform hover:scale-110 {hasActiveTimer ? 'z-10' : ''}"
            title={`${user.attributes.username}${hasActiveTimer ? ' ' + t.activeNow : ''}`}
          >
            <img
              class="h-10 w-10 rounded-full border-2 {hasActiveTimer ? 'border-green-500 shadow-lg' : 'border-white'}"
              src={user.attributes.profilePic?.data?.attributes?.url || 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
              alt={user.attributes.username}
            />
            {#if hasActiveTimer}
              <span class="absolute -top-1 -right-1 flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            {/if}
          </button>
        {/each}
      </div>

      <!-- Navigation Tabs -->
      <nav class="flex flex-wrap gap-1 border-t pt-4" dir={$lang === 'he' ? 'rtl' : 'ltr'}>
        {#each tabs as tab}
          <a
            href="/moach/{projectId}/{tab.id}"
            class="px-4 py-2 rounded-t-lg text-sm font-medium transition-colors
              {isActive(tab.id)
                ? 'bg-pink-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
          >
            {t[tab.label]}
          </a>
        {/each}
      </nav>
    </div>
  </header>

  <main class="max-w-7xl mx-auto p-4">
    {@render children()}
  </main>
</div>
{:else}
  <div class="flex items-center justify-center h-screen">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
{/if}
