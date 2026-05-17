<script lang="ts">
  import { lang } from '$lib/stores/lang.js';
  import { toast } from 'svelte-sonner';
  import { userStore } from '$lib/stores/levStores';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import CardHeader from './CardHeader.svelte';
  import VoteStatusDisplay from './VoteStatusDisplay.svelte';
  import MatanotPublicView from '$lib/components/products/MatanotPublicView.svelte';
  import { addVote, rejectSheirutpend } from '$lib/client/actionClient';
  import { goto } from '$app/navigation';
  import { forum, nowChatId, isChatOpen, initialForum } from '$lib/stores/pendMisMes.js';

  let { buble, isFirst = false, glowColor = 'barbi', onProj } = $props();

  function handleViewRequest() {
    goto(`/deals/request/${buble.id}`);
  }

  const t = {
    requestFrom: { he: 'בקשה מ:', en: 'Request from:', ar: 'طلب من:' },
    approve: { he: 'אישור', en: 'Approve', ar: 'موافقة' },
    refuse: { he: 'דחייה', en: 'Refuse', ar: 'دحياة' },
    price: { he: 'מחיר:', en: 'Price:', ar: 'السعر:' },
    quantity: { he: 'כמות:', en: 'Quantity:', ar: 'الكمية:' },
    total: { he: 'סה"כ:', en: 'Total:', ar: 'المجموع:' },
    startDate: { he: 'התחלה:', en: 'Start:', ar: 'البداية:' },
    endDate: { he: 'סיום:', en: 'End:', ar: 'النهاية:' },
    submitting: { he: 'מעבד...', en: 'Processing...', ar: 'جاري المعالجة...' },
    successApprove: {
      he: 'הבקשה אושרה בהצלחה',
      en: 'Request approved',
      ar: 'تمت الموافقة'
    },
    successReject: {
      he: 'הבקשה נדחתה',
      en: 'Request rejected',
      ar: 'تم رفض الطلب'
    },
    error: { he: 'שגיאה בביצוע הפעולה', en: 'Action failed', ar: 'فشل الإجراء' },
    chat: { he: 'צ׳אט', en: 'Chat', ar: 'محادثة' },
    creatingChat: { he: 'יוצר צ׳אט...', en: 'Creating chat...', ar: 'جاري إنشاء محادثة...' },
    viewRequest: { he: 'לצפיה בבקשה', en: 'View Request', ar: 'عرض الطلب' }
  };

  let isProcessing = $state(false);
  let isCreatingChat = $state(false);

  const isComplexProduct = $derived(buble.pricingMode && buble.pricingMode !== 'fixed');

  const matanotForView = $derived.by(() => {
    if (!isComplexProduct || !buble.matanots?.[0]) return null;
    const m = buble.matanots[0];
    const attrs = m.attributes ?? {};
    return {
      id: m.id,
      name: attrs.name,
      pricingMode: attrs.pricingMode,
      estimatedPrice: attrs.estimatedPrice,
      marginPct: attrs.marginPct,
      matanot_recipe_missions: attrs.matanot_recipe_missions,
      matanot_recipe_resources: attrs.matanot_recipe_resources
    };
  });

  async function handleOpenChat() {
    if (isCreatingChat) return;

    let forumId = buble.forumId;

    if (!forumId) {
      isCreatingChat = true;
      try {
        const response = await fetch('/api/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionKey: 'ensureSheirutpendForum',
            params: {
              projectId: String(buble.projectId),
              sheirutpendId: String(buble.id)
            }
          })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error?.message || 'Failed to create chat forum.');

        forumId = result.data?.forumId ?? result.forumId;
        if (!forumId) throw new Error('Failed to create chat forum.');

        buble.forumId = forumId;
      } catch (err) {
        console.error(err);
        toast.error(t.error[$lang]);
        isCreatingChat = false;
        return;
      } finally {
        isCreatingChat = false;
      }
    }

    const md = {
      pid: Number(buble.projectId),
      projectName: buble.projectName,
      projectPic: buble.projectSrc,
      title: buble.name,
      requestUrl: `/deals/request/${buble.id}`
    };

    const tempF = $forum;
    tempF[forumId] = {
      loading: false,
      messages: tempF[forumId]?.messages || [],
      md
    };
    forum.set(tempF);
    initialForum(false, [String(forumId)], 0);
    nowChatId.set(forumId);
    isChatOpen.set(true);
  }

  async function handleAction(action) {
    if (isProcessing) return;

    if (action === 'reject') {
      isProcessing = true;
      try {
        const result = await rejectSheirutpend({
          id: buble.id,
          projectId: buble.projectId
        });

        if (!result.success) throw new Error(result.error?.message || 'Failed');

        toast.success(t.successReject[$lang]);
      } catch (err) {
        console.error(err);
        toast.error(t.error[$lang]);
      } finally {
        isProcessing = false;
      }
      return;
    }

    isProcessing = true;

    try {
      const result = await addVote({
        type: 'sheirutpend',
        id: buble.id,
        projectId: buble.projectId
      });

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to add vote');
      }

      toast.success(t.successApprove[$lang]);
    } catch (err) {
      console.error(err);
      toast.error(t.error[$lang]);
    } finally {
      isProcessing = false;
    }
  }
</script>

<div
  onclick={toggleScrollable}
  role="button"
  tabindex="0"
  onkeypress={(e) => {
    e.key === 'Enter' && toggleScrollable();
  }}
  dir={$lang == 'he' ? 'rtl' : 'ltr'}
  style="overflow-y:auto"
  class="{isMobileOrTablet()
    ? 'w-full h-full'
    : ' w-[90%] h-[90%]'}  lg:w-[90%] {isFirst
    ? $lang == 'he'
      ? 'boxleft'
      : 'boxright'
    : ''} flex d flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden {isScrolable.value
    ? 'shadow-glow border-glow'
    : 'shadow-lg border border-gray-100 dark:border-gray-700'} transition-all duration-300 relative"
  style:--glow-rgb={glowColor === 'gold'
    ? '238, 232, 170'
    : glowColor === 'barbi'
      ? '255, 0, 146'
      : glowColor === 'blue'
        ? '116, 191, 255'
        : glowColor === 'green'
          ? '2, 255, 187'
          : '2, 255, 187'}
>
  <!-- Header with "View Request" button -->
  <CardHeader
    logoSrc={buble.projectSrc}
    projectName={buble.projectName}
    cardType={buble.ani === 'sheirutp'
      ? $lang === 'he'
        ? 'בקשת מוצר'
        : 'PRODUCT REQUEST'
      : buble.ani}
    cardTitle={buble.name}
    {glowColor}
  >
    {#snippet actions()}
      <button
        onclick={(e) => { e.stopPropagation(); handleViewRequest(); }}
        class="px-3 py-1 text-barbi hover:text-gold hover:bg-barbi bg-gold rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md"
      >
        {t.viewRequest[$lang]}
      </button>
    {/snippet}
  </CardHeader>

  <!-- Content -->
  <div
    class="{isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-200 dark:bg-slate-700'} transition-all-300 p-4 flex-1 overflow-y-auto d space-y-4"
  >
    <!-- Requester -->
    <div
      class="flex d items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-xl"
    >
      {#if buble.userSrc}
        <img
          src={buble.userSrc}
          alt={buble.username}
          class="w-12 h-12 rounded-full object-cover border-2 border-barbi/20"
        />
      {:else}
        <div
          class="w-12 h-12 rounded-full bg-barbi/20 flex items-center justify-center text-barbi font-bold"
        >
          {buble.username?.charAt(0)}
        </div>
      {/if}
      <div>
        <div class="text-[10px] text-gray-500 uppercase">
          {t.requestFrom[$lang]}
        </div>
        <a
          href="/user/{buble.userId}"
          onclick={(e) => e.stopPropagation()}
          class="font-bold text-gray-800 dark:text-gray-200 hover:text-barbi transition-colors"
        >
          {buble.username}
        </a>
      </div>
    </div>

    <!-- Description -->
    {#if buble.descrip}
      <div
        class="text-sm text-gray-600 dark:text-gray-400 italic bg-gray-50/50 dark:bg-gray-900/20 p-2 rounded-lg"
      >
        <RichText outpot={buble.descrip} editable={false} />
      </div>
    {/if}

    <!-- Financial Details -->
    <div class="grid grid-cols-2 gap-3 text-sm">
      <div class="bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg">
        <span class="text-gray-500 block text-[10px] uppercase"
          >{t.price[$lang]}</span
        >
        <div class="flex items-center gap-2">
          <img
            src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
            alt="money"
            class="w-5 h-5"
          />
          <span class="font-bold text-gray-800 dark:text-gray-100"
            >{buble.price}</span
          >
        </div>
      </div>
      <div class="bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg">
        <span class="text-gray-500 block text-[10px] uppercase"
          >{t.quantity[$lang]}</span
        >
        <span class="font-bold text-gray-800 dark:text-gray-100"
          >{buble.quant}</span
        >
      </div>
      <div
        class="col-span-2 bg-gradient-to-r from-barbi/5 to-mpink/5 p-2 rounded-lg border border-barbi/10"
      >
        <span class="text-barbi block text-[10px] uppercase font-bold"
          >{t.total[$lang]}</span
        >
        <div class="flex items-center gap-2">
          <img
            src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
            alt="money"
            class="w-6 h-6"
          />
          <span class="text-xl font-black text-barbi">{buble.total}</span>
        </div>
      </div>
    </div>

    <!-- Dates -->
    {#if buble.startDate}
      <div
        class="flex gap-4 text-xs text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-3"
      >
        <div class="flex items-center gap-2">
          <img
            src="https://res.cloudinary.com/love1/image/upload/v1699831987/FX13_calendar2_jlxcn1.svg"
            alt="calendar"
            class="w-5 h-5"
          />
          <div class="flex items-center gap-1">
            <span class="font-semibold">{t.startDate[$lang]}</span>
            <span>{new Date(buble.startDate).toLocaleDateString($lang)}</span>
          </div>
        </div>
        {#if buble.finishDate}
          <div class="flex items-center gap-2">
            <img
              src="https://res.cloudinary.com/love1/image/upload/v1699831987/FX13_calendar2_jlxcn1.svg"
              alt="calendar"
              class="w-5 h-5"
            />
            <div class="flex items-center gap-1">
              <span class="font-semibold">{t.endDate[$lang]}</span>
              <span>{new Date(buble.finishDate).toLocaleDateString($lang)}</span
              >
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- BOM / Recipe for complex products -->
    {#if isComplexProduct && matanotForView}
      <div class="border-t border-gray-100 dark:border-gray-700 pt-3">
        <MatanotPublicView matanot={matanotForView} />
      </div>
    {/if}
  </div>

  <!-- Vote Status Display -->
  {#if buble.user_1s && buble.user_1s.length > 0}
    <div class="px-4">
      <VoteStatusDisplay
        votes={buble.users || []}
        members={buble.user_1s}
        activeOrder={buble.orderon || 0}
      />
    </div>
  {/if}

  <!-- Actions -->
  <div
    class="p-4 bg-gray-50 dark:bg-gray-900/50 flex gap-3 border-t border-gray-100 dark:border-gray-700"
  >
    <!-- Chat Button -->
    <button
      class="py-2 px-3 bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-500 hover:bg-blue-50 font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
      onclick={(e) => { e.stopPropagation(); handleOpenChat(); }}
      disabled={isCreatingChat}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      {#if isCreatingChat}
        {t.creatingChat[$lang]}
      {:else}
        {t.chat[$lang]}
      {/if}
    </button>

    <button
      class="flex-1 py-2 bg-white dark:bg-gray-800 border-2 border-red-500 text-red-500 hover:bg-red-50 font-bold rounded-xl transition-all disabled:opacity-50"
      onclick={(e) => { e.stopPropagation(); handleAction('reject'); }}
      disabled={isProcessing}
    >
      {t.refuse[$lang]}
    </button>
    <button
      class="flex-2 py-2 bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
      onclick={(e) => { e.stopPropagation(); handleAction('approve'); }}
      disabled={isProcessing || buble.already}
    >
      {#if isProcessing}
        {t.submitting[$lang]}
      {:else if buble.already}
        {buble.mypos === true
          ? $lang === 'he'
            ? 'כבר אישרת'
            : 'Already approved'
          : $lang === 'he'
            ? 'כבר דחית'
            : 'Already rejected'}
      {:else}
        {t.approve[$lang]}
      {/if}
    </button>
  </div>
</div>

<style>
  .flex-2 {
    flex: 2;
  }

  .shadow-glow {
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06),
      0 0 20px rgba(var(--glow-rgb), 0.4),
      0 0 40px rgba(var(--glow-rgb), 0.3),
      0 0 60px rgba(var(--glow-rgb), 0.2),
      inset 0 0 20px rgba(var(--glow-rgb), 0.05);
  }

  .border-glow {
    border: 2px solid rgba(var(--glow-rgb), 0.5);
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06),
      0 0 20px rgba(var(--glow-rgb), 0.4),
      0 0 40px rgba(var(--glow-rgb), 0.3),
      0 0 60px rgba(var(--glow-rgb), 0.2),
      inset 0 0 20px rgba(var(--glow-rgb), 0.05),
      0 0 0 1px rgba(var(--glow-rgb), 0.3);
  }
</style>
