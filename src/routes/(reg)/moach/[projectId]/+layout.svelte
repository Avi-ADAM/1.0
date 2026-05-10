<script>
  import { page, navigating } from '$app/state';
  import { goto } from '$app/navigation';
  import { lang } from '$lib/stores/lang.js';
  import { idPr } from '$lib/stores/idPr.js';
  import AuthorityBadge from '$lib/components/ui/AuthorityBadge.svelte';
  import Pub from '$lib/celim/icons/pub.svelte';
  import {
    projectTimersStore,
    fetchProjectTimers
  } from '$lib/stores/projectTimers.js';
  import { onMount, onDestroy } from 'svelte';
  import { setMoachStore } from '$lib/stores/moachStore.svelte.js';
  import MissionModal from '$lib/components/prPr/MissionModal.svelte';
  import TaskModal from '$lib/components/prPr/tasks/taskModal.svelte';
  import { untrack } from 'svelte';
  import { socketClient } from '$lib/stores/socketClient';

  let { children, data } = $props();
  const moachStore = setMoachStore();
  let socketUnsubscribe;
  let projectId = $derived(page.params.projectId);
  let projectBase = $derived(data.projectBase);
  let currentPath = $derived(page.url.pathname);

  // Sync legacy store and seed cache whenever projectId changes.
  // untrack prevents updateProjectData's internal $state reads from becoming
  // effect dependencies, which would cause an infinite loop.
  $effect(() => {
    if (projectId) {
      idPr.set(projectId);
      if (data.projectBase) {
        untrack(() =>
          moachStore.updateProjectData(projectId, 'base', data.projectBase)
        );
      }
      fetchProjectTimers(projectId, fetch);
    }
  });
  onMount(() => {
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
      processes: 'תהליכים',
      votes: 'הצבעות',
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
      processes: 'Processes',
      votes: 'Votes',
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
      processes: 'العمليات',
      votes: 'التصويتات',
      editPic: 'تعدיל الصورة',
      upload: 'تحميل',
      editDetails: 'تعدיל التفاصيل',
      publicProfile: 'الملف الشخصي العام',
      activeNow: 'نشط الآن'
    }
  };

  let t = $derived(i18n[$lang] || i18n.en);

  let pendingTabId = $derived(
    navigating?.to?.url?.pathname
      ? (tabs.find((tab) => navigating.to.url.pathname.includes(`/${tab.id}`))?.id ?? null)
      : null
  );

  const tabs = [
    { id: 'main', label: 'main' },
    { id: 'edit', label: 'editDetails' },
    { id: 'create', label: 'create' },
    { id: 'gantt', label: 'gantt' },
    { id: 'kanban', label: 'kanban' },
    { id: 'progress', label: 'progress' },
    { id: 'acts', label: 'acts' },
    { id: 'timers', label: 'timers' },
    { id: 'chains', label: 'chains' },
    { id: 'processes', label: 'processes' },
    { id: 'split', label: 'split' },
    { id: 'sales', label: 'sales' },
    { id: 'votes', label: 'votes' },
    { id: 'shifts', label: 'shifts' }
  ];

  function isActive(tabId) {
    return currentPath.includes(`/${tabId}`);
  }

  const backToProjects = () => {
    idPr.set(null);
    goto('/moach');
  };
</script>

{#if projectBase}
  <div
    class="moach-layout min-h-screen text-barbi text-center overflow-y-auto scroll-smooth"
  >
    <div
      class="alli bg-[radial-gradient(circle_at_50%,theme(colors.slate.400),theme(colors.slate.500)_10%,theme(colors.slate.600)_20%,theme(colors.slate.800),theme(colors.slate.900),#19031d)]"
    ></div>

    <header class="p-4 relative z-10">
      <div class="max-w-7xl mx-auto flex flex-col gap-4">
        <div class="flex justify-center items-center w-full relative">
          <!-- Back button - positioned at top left -->
          <button
            class="absolute left-0 sm:left-4 top-0 flex items-center border border-gold gap-1 text-barbi hover:text-gold hover:bg-barbi/20 rounded-full p-2 transition-colors"
            onclick={backToProjects}
            title={t.back}
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
              />
            </svg>
            <span class="text-sm font-medium hidden sm:inline">{t.back}</span>
          </button>

          <AuthorityBadge
            logoSrc={projectBase.profilePic?.data?.attributes?.url}
            projectName={projectBase.projectName}
            memberCount={projectBase.user_1s?.data?.length || 0}
            size={200}
          />
        </div>

        <div class="flex flex-row items-center justify-center gap-2">
          {#if projectBase.discordlink}
            <a
              href={projectBase.discordlink}
              target="_blank"
              class="p-2 hover:bg-mturk rounded-full transition-colors"
              title="Discord"
            >
              <img
                src="https://res.cloudinary.com/love1/image/upload/v1662563246/discord-icon-svgrepo-com_d4vk6m.svg"
                class="w-6 h-6"
                alt="Discord"
              />
            </a>
          {/if}
          {#if projectBase.linkToWebsite}
            <a
              href={projectBase.linkToWebsite}
              target="_blank"
              class="p-2 hover:bg-mturk rounded-full transition-colors text-barbi"
              title="Website"
            >
              <svg
                class="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path
                  d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                />
              </svg>
            </a>
          {/if}
          {#if projectBase.drivelink}
            <a
              href={projectBase.drivelink}
              target="_blank"
              class="p-2 hover:bg-mturk rounded-full transition-colors"
              title="Google Drive"
            >
              <img
                src="https://res.cloudinary.com/love1/image/upload/v1662560567/icon-google-drive-new_jxv2oz.avif"
                class="w-6 h-6"
                alt="Google Drive"
              />
            </a>
          {/if}
          {#if projectBase.twiterlink}
            <a
              href={projectBase.twiterlink}
              target="_blank"
              class="p-2 hover:bg-white rounded-full transition-colors"
              title="Twitter"
            >
              <img
                src="https://visualpharm.com/assets/700/Twitter-595b40b65ba036ed117d4613.svg"
                class="w-6 h-6"
                alt="Twitter"
              />
            </a>
          {/if}
          {#if projectBase.watsapplink}
            <a
              href={projectBase.watsapplink}
              target="_blank"
              class="p-2 hover:bg-white rounded-full transition-colors"
              title="WhatsApp"
            >
              <img
                src="https://tochat.be/whatsapp-icon-white.png"
                class="w-6 h-6"
                alt="WhatsApp"
              />
            </a>
          {/if}
          {#if projectBase.githublink}
            <a
              href={projectBase.githublink}
              target="_blank"
              class="p-2 hover:bg-white rounded-full transition-colors"
              title="GitHub"
            >
              <img
                src="https://visualpharm.com/assets/720/Github-595b40b65ba036ed117d442f.svg"
                class="w-6 h-6"
                alt="GitHub"
              />
            </a>
          {/if}
          {#if projectBase.fblink}
            <a
              href={projectBase.fblink}
              target="_blank"
              class="p-2 hover:bg-white rounded-full transition-colors"
              title="Facebook"
            >
              <img
                src="https://res.cloudinary.com/love1/image/upload/v1639258134/NicePng_oro-png_2336309_rkhbf8.png"
                class="w-6 h-6"
                alt="Facebook"
              />
            </a>
          {/if}
          <button
            onclick={() => goto(`/project/${projectId}`)}
            class="p-2 hover:bg-white rounded-full transition-colors text-barbi"
            title={t.publicProfile}
          >
            <Pub />
          </button>
        </div>

        <!-- Member Avatars with Timer Indicators -->
        <div
          class="flex items-center justify-center py-2"
          dir={$lang === 'he' ? 'rtl' : 'ltr'}
        >
          <div class="flex -space-x-2">
            {#each projectBase.user_1s?.data || [] as user}
              {@const projectTimerData = $projectTimersStore[projectId]?.data}
              {@const timers = projectTimerData?.timers?.data || []}
              {@const hasActiveTimer = timers.some(
                (t) =>
                  t.attributes?.mesimabetahalich?.data?.attributes
                    ?.users_permissions_user?.data?.id == user.id &&
                  t.attributes?.isActive
              )}
              <button
                onclick={() => goto(`/user/${user.id}`)}
                class="relative transition-all duration-300 {hasActiveTimer
                  ? 'scale-110'
                  : ''}"
                title={`${user.attributes.username}${hasActiveTimer ? ' ' + t.activeNow : ''}`}
              >
                <img
                  class="inline-block h-10 w-10 rounded-full ring-2 transition-all duration-300 {hasActiveTimer
                    ? 'ring-green-400 ring-4 shadow-lg shadow-green-400/50'
                    : 'ring-gold'}"
                  src={user.attributes.profilePic?.data?.attributes?.url ||
                    'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
                  alt={user.attributes.username}
                />
                {#if hasActiveTimer}
                  <span class="absolute -top-1 -right-1 flex h-4 w-4">
                    <span
                      class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                    ></span>
                    <span
                      class="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white shadow-lg"
                    ></span>
                  </span>
                {/if}
              </button>
            {/each}
          </div>
        </div>

        <!-- Navigation Tabs -->
        <nav
          class="flex justify-center flex-wrap gap-1 py-4"
          dir={$lang === 'he' ? 'rtl' : 'ltr'}
        >
          {#each tabs as tab}
            <a
              href="/moach/{projectId}/{tab.id}"
              class="hover:border hover:underline hover:decoration-mturk sm:text-xl hover:border-barbi hover:bg-gold px-4 py-2 drop-shadow-lg shadow-gold transition-all
              {isActive(tab.id)
                ? 'bg-gradient-to-br from-barbi via-fuchsia-400 to-mpink text-blue-800 font-bold'
                : 'bg-gradient-to-r from-gra via-grb  to-gre text-purple-700 font-bold'}
              {pendingTabId === tab.id ? 'animate-pulse opacity-70 scale-95' : ''}"
              style={!isActive(tab.id) ? 'text-shadow:1px 1px #fff;' : ''}
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

  <MissionModal
    modal={moachStore.state.modal}
    {projectId}
    projectName={projectBase?.projectName ?? ''}
    missions={moachStore.state.projects[projectId]?.missions}
    onClose={() => moachStore.closeModal()}
    onMissionsLoaded={(data) => moachStore.updateProjectData(projectId, 'missions', data)}
  />
  <TaskModal
    act={moachStore.state.actModal.actData}
    open={moachStore.state.actModal.open}
    onClose={() => moachStore.closeActModal()}
  />
{:else}
  <div class="flex items-center justify-center h-screen">
    <div
      class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
    ></div>
  </div>
{/if}

<style>
  .alli {
    z-index: -1;
    min-width: 100vw;
    min-height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
  }

  .moach-layout :global(.sv) {
    width: 24px;
    height: 24px;
  }
</style>
