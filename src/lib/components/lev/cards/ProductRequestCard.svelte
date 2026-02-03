<script lang="ts">
  import { lang } from '$lib/stores/lang.js';
  import { toast } from 'svelte-sonner';
  import { userStore } from '$lib/stores/levStores';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import CardHeader from './CardHeader.svelte';
  import VoteStatusDisplay from './VoteStatusDisplay.svelte';
  import { addVote, rejectSheirutpend } from '$lib/client/actionClient';

  let { buble, isFirst = false, glowColor = 'barbi', onProj } = $props();

  function handleProjectClick() {
    if (onProj && buble.projectId) {
      onProj({ id: buble.projectId });
    }
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
    error: { he: 'שגיאה בביצוע הפעולה', en: 'Action failed', ar: 'فشل الإجراء' }
  };

  let isProcessing = $state(false);

  async function handleAction(action) {
    if (isProcessing) return;

    // רק approve משתמש ב-addVote (עבור מקרה שעדיין יש כאלה שלא הצביעו)
    if (action === 'reject') {
      // reject נשאר עם approveSheirutpend/rejectSheirutpend הקיימים
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

    // approve - משתמש ב-addVote
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
  <!-- Golden Header with AuthorityBadge -->
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
    onProjectClick={handleProjectClick}
  />

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
        <div class="font-bold text-gray-800 dark:text-gray-200">
          {buble.username}
        </div>
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
    <button
      class="flex-1 py-2 bg-white dark:bg-gray-800 border-2 border-red-500 text-red-500 hover:bg-red-50 font-bold rounded-xl transition-all disabled:opacity-50"
      onclick={() => handleAction('reject')}
      disabled={isProcessing}
    >
      {t.refuse[$lang]}
    </button>
    <button
      class="flex-2 py-2 bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
      onclick={() => handleAction('approve')}
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
