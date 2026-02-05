<script lang="ts">
  import { lang } from '$lib/stores/lang.js';
  import { toast } from 'svelte-sonner';
  import { userStore } from '$lib/stores/levStores';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import CardHeader from './CardHeader.svelte';
  import VoteStatusDisplay from './VoteStatusDisplay.svelte';

  let {
    buble,
    isFirst = false,
    glowColor = 'green',
    onProj,
    onChat = undefined
  } = $props();

  function handleProjectClick() {
    if (onProj && buble.projectId) {
      onProj({ id: buble.projectId });
    }
  }

  let isCreatingChat = $state(false);

  async function handleOpenChat() {
    if (isCreatingChat) return;

    if (onChat) {
      if (buble.forumId) {
        onChat({ forumId: buble.forumId, sheirutId: buble.id });
      } else {
        isCreatingChat = true;
        try {
          const response = await fetch('/api/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              actionKey: 'ensureSheirutForum',
              params: {
                projectId: String(buble.projectId),
                sheirutId: String(buble.id)
              }
            })
          });

          const result = await response.json();
          if (!result.success) {
            throw new Error(result.error?.message || 'Failed to create chat forum.');
          }

          const newForumId = result.data?.forumId;
          if (!newForumId) {
            throw new Error('Failed to create chat forum.');
          }

          buble.forumId = newForumId;
          onChat({ forumId: newForumId, sheirutId: buble.id });
        } catch (err) {
          console.error(err);
          toast.error(t.error[$lang]);
        } finally {
          isCreatingChat = false;
        }
      }
    }
  }

  const t = {
    customer: { he: 'לקוח:', en: 'Customer:', ar: 'العميل:' },
    product: { he: 'מוצר:', en: 'Product:', ar: 'المنتج:' },
    price: { he: 'מחיר:', en: 'Price:', ar: 'السعر:' },
    quantity: { he: 'כמות:', en: 'Quantity:', ar: 'الكمية:' },
    total: { he: 'סה"כ:', en: 'Total:', ar: 'المجموع:' },
    startDate: { he: 'התחלה:', en: 'Start:', ar: 'البداية:' },
    endDate: { he: 'סיום:', en: 'End:', ar: 'النهاية:' },
    confirmDelivery: {
      he: 'אישור משלוח',
      en: 'Confirm Delivery',
      ar: 'تأكيد التسليم'
    },
    confirmMoney: {
      he: 'קיבלתי את הכסף',
      en: 'Money Received',
      ar: 'استلمت المال'
    },
    chat: { he: 'צ׳אט', en: 'Chat', ar: 'محادثة' },
    creatingChat: {
      he: 'יוצר צ׳אט...',
      en: 'Creating chat...',
      ar: 'جاري إنشاء محادثة...'
    },
    submitting: { he: 'מעבד...', en: 'Processing...', ar: 'جاري المعالجة...' },
    successDelivery: {
      he: 'אישרת את המשלוח',
      en: 'Delivery confirmed',
      ar: 'تم تأكيد التسليم'
    },
    successMoney: {
      he: 'אישרת קבלת הכסף',
      en: 'Money receipt confirmed',
      ar: 'تم تأكيد استلام المال'
    },
    error: {
      he: 'שגיאה בביצוע הפעולה',
      en: 'Action failed',
      ar: 'فشل الإجراء'
    },
    statusLabels: {
      customerGotIt: {
        he: 'הלקוח קיבל',
        en: 'Customer received',
        ar: 'استلم العميل'
      },
      customerPaid: { he: 'הלקוח שילם', en: 'Customer paid', ar: 'دفع العميل' },
      projectGotMoney: {
        he: 'הכסף התקבל',
        en: 'Money received',
        ar: 'تم استلام المال'
      },
      delivered: { he: 'נמסר', en: 'Delivered', ar: 'تم التسليم' },
      awaitingYourConfirm: {
        he: 'ממתין לאישורך',
        en: 'Awaiting your confirmation',
        ar: 'في انتظار تأكيدك'
      },
      moneyRecipient: {
        he: 'אתה אמור לקבל את הכסף',
        en: 'You should receive the money',
        ar: 'يجب أن تستلم المال'
      }
    }
  };

  let isProcessing = $state(false);

  async function handleConfirmDelivery() {
    if (isProcessing || buble.alreadyVoted) return;

    isProcessing = true;
    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'addVote',
          payload: {
            type: 'weFinnish',
            id: buble.id,
            projectId: buble.projectId
          }
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed');

      toast.success(t.successDelivery[$lang]);
    } catch (err) {
      console.error(err);
      toast.error(t.error[$lang]);
    } finally {
      isProcessing = false;
    }
  }

  async function handleConfirmMoney() {
    if (isProcessing || buble.moneyTransfered) return;

    isProcessing = true;
    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'updateSheirut',
          payload: {
            id: buble.id,
            projectId: buble.projectId,
            moneyTransfered: true
          }
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed');

      toast.success(t.successMoney[$lang]);
    } catch (err) {
      console.error(err);
      toast.error(t.error[$lang]);
    } finally {
      isProcessing = false;
    }
  }

  // Compute status display
  const statusItems = $derived.by(() => {
    const items = [];

    if (buble.iGotIt) {
      items.push({
        label: t.statusLabels.customerGotIt[$lang],
        color: 'green'
      });
    }
    if (buble.iTransferMoney) {
      items.push({ label: t.statusLabels.customerPaid[$lang], color: 'blue' });
    }
    if (buble.moneyTransfered) {
      items.push({
        label: t.statusLabels.projectGotMoney[$lang],
        color: 'green'
      });
    }
    if (buble.productExepted) {
      items.push({ label: t.statusLabels.delivered[$lang], color: 'green' });
    }
    if (!buble.alreadyVoted && !buble.productExepted) {
      items.push({
        label: t.statusLabels.awaitingYourConfirm[$lang],
        color: 'orange'
      });
    }
    if (
      buble.isMoneyRecipient &&
      buble.iTransferMoney &&
      !buble.moneyTransfered
    ) {
      items.push({
        label: t.statusLabels.moneyRecipient[$lang],
        color: 'barbi'
      });
    }

    return items;
  });
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
  <!-- Header -->
  <CardHeader
    logoSrc={buble.projectSrc}
    projectName={buble.projectName}
    cardType={$lang === 'he' ? 'מכירה פעילה' : 'ACTIVE SALE'}
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
    <!-- Customer Info -->
    <div
      class="flex d items-center gap-3 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/30 dark:to-teal-900/30 p-3 rounded-xl border border-green-200 dark:border-green-700"
    >
      {#if buble.customerSrc}
        <img
          src={buble.customerSrc}
          alt={buble.customerName}
          class="w-12 h-12 rounded-full object-cover border-2 border-green-400/50"
        />
      {:else}
        <div
          class="w-12 h-12 rounded-full bg-green-400/20 flex items-center justify-center text-green-600 font-bold"
        >
          {buble.customerName?.charAt(0) || '?'}
        </div>
      {/if}
      <div>
        <div class="text-[10px] text-green-600 uppercase font-semibold">
          {t.customer[$lang]}
        </div>
        <div class="font-bold text-gray-800 dark:text-gray-200">
          {buble.customerName || 'Unknown'}
        </div>
      </div>
    </div>

    <!-- Status Badges -->
    {#if statusItems.length > 0}
      <div class="flex flex-wrap gap-2">
        {#each statusItems as status}
          <span
            class="px-2 py-1 rounded-full text-xs font-semibold
              {status.color === 'green'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
              : ''}
              {status.color === 'blue'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
              : ''}
              {status.color === 'orange'
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
              : ''}
              {status.color === 'barbi'
              ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300'
              : ''}"
          >
            {status.label}
          </span>
        {/each}
      </div>
    {/if}

    <!-- Product Image -->
    {#if buble.productPic}
      <div class="relative rounded-xl overflow-hidden aspect-video">
        <img
          src={buble.productPic}
          alt={buble.name}
          class="w-full h-full object-cover"
        />
      </div>
    {/if}

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
        class="col-span-2 bg-gradient-to-r from-green-500/5 to-teal-500/5 p-2 rounded-lg border border-green-500/10"
      >
        <span class="text-green-600 block text-[10px] uppercase font-bold"
          >{t.total[$lang]}</span
        >
        <div class="flex items-center gap-2">
          <img
            src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
            alt="money"
            class="w-6 h-6"
          />
          <span class="text-xl font-black text-green-600">{buble.total}</span>
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
        {#if buble.finnishDate}
          <div class="flex items-center gap-2">
            <img
              src="https://res.cloudinary.com/love1/image/upload/v1699831987/FX13_calendar2_jlxcn1.svg"
              alt="calendar"
              class="w-5 h-5"
            />
            <div class="flex items-center gap-1">
              <span class="font-semibold">{t.endDate[$lang]}</span>
              <span
                >{new Date(buble.finnishDate).toLocaleDateString($lang)}</span
              >
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Money Recipient Info -->
    {#if buble.iCanGetMonay}
      <div
        class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl border border-yellow-200 dark:border-yellow-700"
      >
        <div
          class="text-[10px] text-yellow-700 dark:text-yellow-400 uppercase font-semibold mb-2"
        >
          {$lang === 'he' ? 'מקבל הכסף' : 'Money Recipient'}
        </div>
        <div class="flex items-center gap-3">
          {#if buble.iCanGetMonay.profilePic}
            <img
              src={buble.iCanGetMonay.profilePic}
              alt={buble.iCanGetMonay.username}
              class="w-10 h-10 rounded-full object-cover border-2 border-yellow-400/50"
            />
          {:else}
            <div
              class="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-600 font-bold text-sm"
            >
              {buble.iCanGetMonay.username?.charAt(0)}
            </div>
          {/if}
          <span class="font-semibold text-gray-800 dark:text-gray-200">
            {buble.iCanGetMonay.username}
          </span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Vote Status Display -->
  {#if buble.user_1s && buble.user_1s.length > 0}
    <div class="px-4">
      <VoteStatusDisplay
        votes={buble.weFinnish || []}
        members={buble.user_1s}
        activeOrder={1}
      />
    </div>
  {/if}

  <!-- Actions -->
  <div
    class="p-4 bg-gray-50 dark:bg-gray-900/50 flex gap-3 border-t border-gray-100 dark:border-gray-700"
  >
    <!-- Chat Button -->
    <button
      class="py-2 px-4 bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-500 hover:bg-blue-50 font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
      onclick={handleOpenChat}
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

    <!-- Confirm Delivery Button -->
    {#if !buble.productExepted}
      <button
        class="flex-1 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
        onclick={handleConfirmDelivery}
        disabled={isProcessing || buble.alreadyVoted}
      >
        {#if isProcessing}
          {t.submitting[$lang]}
        {:else if buble.alreadyVoted}
          {buble.myDeliveryVote === true
            ? $lang === 'he'
              ? 'אישרת משלוח'
              : 'Delivery confirmed'
            : $lang === 'he'
              ? 'ממתין...'
              : 'Pending...'}
        {:else}
          {t.confirmDelivery[$lang]}
        {/if}
      </button>
    {/if}

    <!-- Confirm Money Button (only for money recipient) -->
    {#if buble.moneyTransferredToMe && !buble.moneyTransfered}
      <button
        class="flex-1 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
        onclick={handleConfirmMoney}
        disabled={isProcessing}
      >
        {#if isProcessing}
          {t.submitting[$lang]}
        {:else}
          {t.confirmMoney[$lang]}
        {/if}
      </button>
    {/if}
  </div>
</div>

<style>
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
