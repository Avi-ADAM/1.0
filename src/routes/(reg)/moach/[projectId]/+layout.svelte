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
  import { TourItem, run } from 'svelte-tour';
  import Dialog from '$lib/celim/ui/dialog.svelte';

  let { children, data } = $props();
  const moachStore = setMoachStore();
  let socketUnsubscribe;
  let projectId = $derived(page.params.projectId);

  let showGuideDialog = $state(false);

  const guideDialogHeader = {
    he: 'מדריך למוח הריקמה',
    en: 'Project Brain Guide',
    ar: 'دليل عقل المجموعة'
  };
  const guideDialogText = {
    he: 'האם ברצונך לראות מדריך קצר שיסביר מה ניתן לעשות במוח הריקמה?\n(ניתן לפתוח מחדש בלחיצה על סימן ה-? בכותרת)',
    en: 'Would you like a quick tour of what you can do in the project brain?\n(You can reopen it via the ? button in the header)',
    ar: 'هل تريد جولة سريعة لعقل المشروع?\n(يمكنك إعادة فتحه من خلال زر ? في الرأس)'
  };
  const guideYes = { he: 'אשמח', en: 'Yes', ar: 'نعم' };
  const guideNo = { he: 'לא תודה', en: 'No thanks', ar: 'لا شكراً' };

  function startGuide() {
    run();
  }
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
    const guideKey = `moachGuide_${projectId}`;
    if (!localStorage.getItem(guideKey)) {
      showGuideDialog = true;
    }

    // Socket integration for real-time invalidation
    socketClient.connect(data.uid);
    socketUnsubscribe = socketClient.onNotification((notification) => {
      console.log('[MoachLayout] Socket notification:', notification);

      if (!projectId) return;

      // Ignore notifications that belong to a different project (the socket
      // delivers events for every project the user is a member of).
      const notifProjectId =
        notification.actionParams?.projectId || notification.data?.projectId;
      if (notifProjectId && String(notifProjectId) !== String(projectId)) return;

      // If notification implies data change, invalidate store cache
      // type could be 'mission', 'base', 'financials' etc depending on backend payload
      const type = notification.metadata?.type || notification.data?.type;

      // Vote notifications (incl. consensus, which may create a mission/resource
      // or change project details) touch several cached sections.
      const VOTE_TYPES = ['pendmVote', 'pmashVote', 'maapVote', 'decisionVote', 'voteUpdate'];

      if (type && VOTE_TYPES.includes(type)) {
        moachStore.invalidate(projectId, 'base');
        moachStore.invalidate(projectId, 'missions');
        moachStore.invalidate(projectId, 'financials');
      } else if (type) {
        moachStore.invalidate(projectId, type);
      } else {
        // Broad invalidation if type unknown
        moachStore.invalidate(projectId, 'base');
        moachStore.invalidate(projectId, 'missions');
      }
    });
  });

  onDestroy(() => {
    if (socketUnsubscribe) socketUnsubscribe();
  });
  const tourMessages = {
    he: {
      badge: 'ריקמה היא קבוצת שיתוף פעולה — כל אחד תורם את הכישורים שלו ומרוויח לפי תרומתו',
      members: 'חברי הריקמה — עיגול ירוק פועם = חבר שעובד עכשיו לטובת הפרויקט. לחיצה על תמונה עוברת לפרופיל',
      tabsIntro: 'הטאבים הם מרכז הניהול של הריקמה — כל טאב מציג היבט אחר של הפרויקט',
      create: '📋 יצירה: יוצרים משימות ומבקשים משאבים (כסף, ציוד, מידע) — הן עבור חברי הפרויקט הקיימים, והן כדי לאתר שותפים ושותפות חדשים. כל משימה או משאב שתפרסמו מקבלים לינק שיתוף לדף ייחודי ויפיפה — מותאם לרשתות חברתיות ולגיוס שותפים',
      progress: '🔄 בתהליך: רשימת כל המשימות הפעילות — מי עובד על מה ובאיזה שלב',
      acts: '✅ פעולות ומטלות: ניהול המשימות הקטנות — מה נגמר, מה בדרך',
      timers: '⏱️ טיימרים: כאן רואים מתי כל חבר פרויקט היה פעיל לטובת הפרויקט ומה עשה. כשחבר מפעיל טיימר מופיע עיגול ירוק מסביב לתמונה שלו למעלה',
      wishes: '💌 משאלות נכנסות: לידים חמים מלקוחות הקונסיירז\' שהפרויקט שלכם מתאים לתת להם שירות או מוצר — הזדמנויות עסקיות מוכנות',
      sales: '🛒 מכירות ומוצרים: מוצר פשוט = מחיר קבוע. מוצר מורכב = מחיר שמתגבש תוך כדי תהליך הקניה — לפי משימות, משאבים והחלטות שמתקבלות יחד עם הלקוח. כל מוצר מקבל דף יפיפה מותאם לשיתוף ולקבלת לקוחות',
      split: '💰 חלוקה: מחשבון חלוקת ההכנסות — כל אחד מקבל לפי מה שתרם',
      votes: '🗳️ הצבעות: קבלת החלטות מתוך קונצנזוס — משא ומתן בכלים ייחודיים עד שכולם שמחים עם התוצאה. לא הצבעת רוב אלא הסכמה אמיתית של כל חברי הריקמה',
      chains: '🔗 שרשראות: כל משימה ומשאב לאורך כל חייהם — מהצעת הפתיחה דרך ההצבעה ועד לארכיון. שקיפות מלאה והבנה עמוקה של כל תהליך בפרויקט',
      gantt: '📊 גאנט וקאנבן: ניהול ויזואלי של הפרויקט ולוח זמנים',
      helpBtn: 'הצגת מדריך מחדש'
    },
    en: {
      badge: 'FreeMates is a collaboration group — everyone contributes their skills and earns according to their contribution',
      members: 'FreeMates members — a pulsing green ring means a member is currently working on the project. Click a photo to visit their profile',
      tabsIntro: 'The tabs are the management hub of the FreeMates — each tab shows a different aspect of the project',
      create: '📋 Create: add missions and request resources (money, gear, info) — for existing members or to find new partners. Every published mission or resource gets a unique shareable link with a beautiful page optimized for social networks and partner recruitment',
      progress: '🔄 Progress: list of all active missions — who is working on what and at which stage',
      acts: '✅ Acts & Tasks: manage small tasks — what is done, what is on the way',
      timers: '⏱️ Timers: see when each member was active for the project and what they worked on. When a member starts a timer, a green ring appears around their avatar above',
      wishes: '💌 Incoming Wishes: warm leads from concierge customers that your project is a match for — ready business opportunities',
      sales: '🛒 Sales & Products: Simple product = fixed price. Complex product = price shaped by missions, resources and decisions made together during the purchase process. Every product gets a beautiful shareable page optimized for social media and attracting customers',
      split: '💰 Split: revenue-split calculator — everyone gets paid according to their contribution',
      votes: '🗳️ Votes: decisions made through consensus — unique negotiation tools until everyone is genuinely happy with the outcome. Not majority vote, but real agreement from all FreeMates members',
      chains: '🔗 Chains: every mission and resource across its entire lifecycle — from the opening proposal through voting all the way to the archive. Full transparency and deep understanding of every project process',
      gantt: '📊 Gantt & Kanban: visual project management and timeline',
      helpBtn: 'Show guide again'
    },
    ar: {
      badge: 'FreeMates مجموعة تعاون — كل شخص يساهم بمهاراته ويكسب وفقاً لمساهمته',
      members: 'أعضاء المجموعة — حلقة خضراء نابضة = عضو يعمل الآن. انقر على صورة للذهاب إلى ملفهم الشخصي',
      tabsIntro: 'التبويبات هي مركز إدارة المجموعة — كل تبويب يعرض جانباً مختلفاً من المشروع',
      create: '📋 إنشاء: أنشئ مهام واطلب موارد — للأعضاء الحاليين أو لاستقطاب شركاء جدد. كل مهمة أو مورد تنشره يحصل على رابط مشاركة لصفحة فريدة وجميلة مناسبة للشبكات الاجتماعية',
      progress: '🔄 قيد التنفيذ: قائمة بجميع المهام النشطة',
      acts: '✅ الأعمال والمهام: إدارة المهام الصغيرة',
      timers: '⏱️ المؤقتات: شاهد متى كان كل عضو نشطاً وماذا عمل. عند تشغيل مؤقت تظهر حلقة خضراء حول صورته',
      wishes: '💌 الرغبات الواردة: عملاء محتملون من الكونسيرج يناسبهم مشروعكم — فرص عمل جاهزة',
      sales: '🛒 المبيعات والمنتجات: منتج بسيط = سعر ثابت. منتج معقد = سعر يتشكل خلال عملية الشراء بناءً على المهام والموارد والقرارات المشتركة. كل منتج يحصل على صفحة جميلة للمشاركة',
      split: '💰 التقسيم: حاسبة توزيع الإيرادات',
      votes: '🗳️ التصويتات: قرارات من خلال إجماع — تفاوض بأدوات فريدة حتى يكون الجميع سعداء بالنتيجة. ليس تصويت أغلبية بل اتفاق حقيقي',
      chains: '🔗 السلاسل: كل مهمة ومورد عبر دورة حياتهم الكاملة — من الاقتراح الأولي مروراً بالتصويت وحتى الأرشيف. شفافية كاملة وفهم عميق لكل عملية',
      gantt: '📊 جانت وكانبان: إدارة المشروع بصرياً',
      helpBtn: 'عرض الدليل مجدداً'
    }
  };

  let tour = $derived(tourMessages[$lang] || tourMessages.he);

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
      wishes: 'משאלות נכנסות',
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
      wishes: 'Incoming wishes',
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
      wishes: 'الرغبات الواردة',
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
    { id: 'wishes', label: 'wishes' },
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
  <Dialog
    bind:showSaveDialog={showGuideDialog}
    dialogHeader={guideDialogHeader}
    innerText={guideDialogText}
    innerDialogButton={guideYes}
    clearButton={guideNo}
    onSaveTimer={() => {
      showGuideDialog = false;
      localStorage.setItem(`moachGuide_${projectId}`, 'done');
      startGuide();
    }}
    onClearTimer={() => {
      showGuideDialog = false;
      localStorage.setItem(`moachGuide_${projectId}`, 'done');
    }}
  />
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

          <TourItem message={tour.badge}>
            <AuthorityBadge
              logoSrc={projectBase.profilePic?.data?.attributes?.url}
              projectName={projectBase.projectName}
              memberCount={projectBase.user_1s?.data?.length || 0}
              size={200}
            />
          </TourItem>

          <!-- Help button - top right -->
          <button
            class="absolute right-0 sm:right-4 top-0 flex items-center justify-center w-8 h-8 rounded-full border border-gold text-gold hover:bg-gold hover:text-barbi transition-colors font-bold text-sm"
            onclick={() => { localStorage.removeItem(`moachGuide_${projectId}`); startGuide(); }}
            title={tour.helpBtn}
          >?</button>
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
        <TourItem message={tour.members}>
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
        </TourItem>

        <!-- Tour anchors — invisible spans that drive next/next over the nav -->
        <div class="tour-anchors-row" aria-hidden="true">
          <TourItem message={tour.tabsIntro}><span class="tour-anchor"></span></TourItem>
          <TourItem message={tour.create}><span class="tour-anchor"></span></TourItem>
          <TourItem message={tour.progress}><span class="tour-anchor"></span></TourItem>
          <TourItem message={tour.acts}><span class="tour-anchor"></span></TourItem>
          <TourItem message={tour.timers}><span class="tour-anchor"></span></TourItem>
          <TourItem message={tour.wishes}><span class="tour-anchor"></span></TourItem>
          <TourItem message={tour.sales}><span class="tour-anchor"></span></TourItem>
          <TourItem message={tour.split}><span class="tour-anchor"></span></TourItem>
          <TourItem message={tour.votes}><span class="tour-anchor"></span></TourItem>
          <TourItem message={tour.chains}><span class="tour-anchor"></span></TourItem>
          <TourItem message={tour.gantt}><span class="tour-anchor"></span></TourItem>
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

  .tour-anchors-row {
    display: flex;
    justify-content: center;
    gap: 0;
    height: 0;
    overflow: visible;
  }

  .tour-anchor {
    display: inline-block;
    width: 1px;
    height: 1px;
    pointer-events: none;
  }
</style>
