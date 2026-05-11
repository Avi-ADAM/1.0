<script lang="ts">
  import { lang } from '$lib/stores/lang.js';
  import { toast } from 'svelte-sonner';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import CardHeader from './CardHeader.svelte';
  import VoteStatusDisplay from './VoteStatusDisplay.svelte';

  let {
    buble,
    isFirst = false,
    glowColor = 'blue',
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
      if (buble.forumId && buble.forumId !== -1) {
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
    seller: { he: 'מוכר:', en: 'Seller:', ar: 'البائع:' },
    product: { he: 'מוצר:', en: 'Product:', ar: 'المنتج:' },
    price: { he: 'מחיר:', en: 'Price:', ar: 'السعر:' },
    quantity: { he: 'כמות:', en: 'Quantity:', ar: 'الكمية:' },
    total: { he: 'סה"כ:', en: 'Total:', ar: 'المجموع:' },
    startDate: { he: 'התחלה:', en: 'Start:', ar: 'البداية:' },
    endDate: { he: 'סיום:', en: 'End:', ar: 'النهاية:' },
    confirmReceipt: {
      he: 'אישור קבלת מוצר',
      en: 'Confirm Receipt',
      ar: 'תאקיה'
    },
    confirmTransfer: {
      he: 'עדכון העברת כסף',
      en: 'Confirm Money Transfer',
      ar: 'תאקיה'
    },
    selectSeller: {
      he: 'בחר למי העברת:',
      en: 'Select who you paid:',
      ar: 'תאקיה'
    },
    chat: { he: 'צ׳אט', en: 'Chat', ar: 'محادثة' },
    creatingChat: {
      he: 'יוצר צ׳אט...',
      en: 'Creating chat...',
      ar: 'جاري إنشاء محادثة...'
    },
    submitting: { he: 'מעבד...', en: 'Processing...', ar: 'جاري المعالجة...' },
    successReceipt: {
      he: 'אישרת קבלת המוצר',
      en: 'Receipt confirmed',
      ar: 'تم تأكيد الاستلام'
    },
    successTransfer: {
      he: 'עדכנת על העברת הכסף',
      en: 'Transfer updated',
      ar: 'تم تحديث التحويل'
    },
    error: {
      he: 'שגיאה בביצוע הפעולה',
      en: 'Action failed',
      ar: 'فشل الإجراء'
    },
    statusLabels: {
      iGotIt: { he: 'קיבלתי', en: 'I received', ar: 'استلمת' },
      iPaid: { he: 'שילמתי', en: 'I paid', ar: 'דפעת' },
      sellersClaimDelivered: { 
        he: 'המוכרים טוענים שמסרו', 
        en: 'Sellers claim delivered', 
        ar: 'תאקיה' 
      },
      sellerConfirmedMoney: {
        he: 'המוכר אישר שקיבל',
        en: 'Seller confirmed money',
        ar: 'תאקיה'
      },
      moneyRecipient: {
        he: 'העברת ל:',
        en: 'Transferred to:',
        ar: 'תאקיה'
      }
    }
  };

  let isProcessing = $state(false);
  let showSellerSelect = $state(false);

  async function handleConfirmReceipt() {
    if (isProcessing || buble.iGotIt) return;

    isProcessing = true;
    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'updateSheirut',
          params: {
            id: buble.id,
            projectId: buble.projectId,
            iGotIt: true
          }
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed');

      buble.iGotIt = true;
      toast.success(t.successReceipt[$lang]);
    } catch (err) {
      console.error(err);
      toast.error(t.error[$lang]);
    } finally {
      isProcessing = false;
    }
  }

  async function handleConfirmTransfer(sellerId: string) {
    if (isProcessing || buble.iTransferMoney) return;

    isProcessing = true;
    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'updateSheirut',
          params: {
            id: buble.id,
            projectId: buble.projectId,
            iTransferMoney: true,
            iTransferedTo: sellerId
          }
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed');

      buble.iTransferMoney = true;
      const selectedSeller = buble.members?.find((m: any) => m.id === sellerId);
      if (selectedSeller) {
        buble.iTransferedTo = selectedSeller;
      }
      showSellerSelect = false;
      toast.success(t.successTransfer[$lang]);
    } catch (err) {
      console.error(err);
      toast.error(t.error[$lang]);
    } finally {
      isProcessing = false;
    }
  }

  // Check if the recipient confirmed money
  const isMoneyConfirmedByRecipient = $derived.by(() => {
    if (!buble.iTransferedTo || !buble.iGotMoney) return false;
    return buble.iGotMoney.some((gm: any) => gm.users_permissions_user?.data?.id === buble.iTransferedTo.id);
  });

  const statusItems = $derived.by(() => {
    const items = [];

    if (buble.iGotIt) {
      items.push({ label: t.statusLabels.iGotIt[$lang], color: 'green' });
    }
    if (buble.iTransferMoney) {
      items.push({ label: t.statusLabels.iPaid[$lang], color: 'blue' });
    }
    if (buble.weFinnish && buble.weFinnish.length > 0) {
      items.push({ label: t.statusLabels.sellersClaimDelivered[$lang], color: 'orange' });
    }
    if (isMoneyConfirmedByRecipient) {
      items.push({ label: t.statusLabels.sellerConfirmedMoney[$lang], color: 'green' });
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
  style:--glow-rgb="116, 191, 255"
>
  <!-- Header -->
  <CardHeader
    logoSrc={buble.projectSrc}
    projectName={buble.projectName}
    cardType={$lang === 'he' ? 'הקניה שלי' : 'MY PURCHASE'}
    cardTitle={buble.name}
    glowColor="blue"
    onProjectClick={handleProjectClick}
  />

  <!-- Content -->
  <div
    class="{isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-200 dark:bg-slate-700'} transition-all-300 p-4 flex-1 overflow-y-auto d space-y-4"
  >
    <!-- Seller Info -->
    <div
      class="flex d items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-3 rounded-xl border border-blue-200 dark:border-blue-700"
    >
      {#if buble.projectSrc}
        <img
          src={buble.projectSrc}
          alt={buble.projectName}
          class="w-12 h-12 rounded-full object-cover border-2 border-blue-400/50"
        />
      {:else}
        <div
          class="w-12 h-12 rounded-full bg-blue-400/20 flex items-center justify-center text-blue-600 font-bold"
        >
          {buble.projectName?.charAt(0) || 'P'}
        </div>
      {/if}
      <div>
        <div class="text-[10px] text-blue-600 uppercase font-semibold">
          {t.seller[$lang]}
        </div>
        <div class="font-bold text-gray-800 dark:text-gray-200">
          {buble.projectName || 'Project'}
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
        class="col-span-2 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 p-2 rounded-lg border border-blue-500/10"
      >
        <span class="text-blue-600 block text-[10px] uppercase font-bold"
          >{t.total[$lang]}</span
        >
        <div class="flex items-center gap-2">
          <img
            src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
            alt="money"
            class="w-6 h-6"
          />
          <span class="text-xl font-black text-blue-600">{buble.total}</span>
        </div>
      </div>
    </div>

    <!-- Money Transfer Selection -->
    {#if !buble.iTransferMoney}
      <div class="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-200 dark:border-indigo-700">
        <div class="text-[10px] text-indigo-700 dark:text-indigo-400 uppercase font-semibold mb-2">
          {t.selectSeller[$lang]}
        </div>
        <div class="flex flex-wrap gap-2">
          {#each buble.members || [] as member}
            <button
              class="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 hover:border-indigo-500 transition-all text-xs"
              onclick={() => handleConfirmTransfer(member.id)}
              disabled={isProcessing}
            >
              {#if member.profilePic}
                <img src={member.profilePic} alt={member.username} class="w-6 h-6 rounded-full object-cover" />
              {:else}
                <div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  {member.username?.charAt(0)}
                </div>
              {/if}
              <span>{member.username}</span>
            </button>
          {/each}
        </div>
      </div>
    {:else if buble.iTransferedTo}
      <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-200 dark:border-green-700">
        <div class="text-[10px] text-green-700 dark:text-green-400 uppercase font-semibold mb-2">
          {t.statusLabels.moneyRecipient[$lang]}
        </div>
        <div class="flex items-center gap-3">
          {#if buble.iTransferedTo.profilePic}
            <img
              src={buble.iTransferedTo.profilePic}
              alt={buble.iTransferedTo.username}
              class="w-10 h-10 rounded-full object-cover border-2 border-green-400/50"
            />
          {:else}
            <div
              class="w-10 h-10 rounded-full bg-green-400/20 flex items-center justify-center text-green-600 font-bold text-sm"
            >
              {buble.iTransferedTo.username?.charAt(0)}
            </div>
          {/if}
          <div class="flex flex-col">
            <span class="font-semibold text-gray-800 dark:text-gray-200">
              {buble.iTransferedTo.username}
            </span>
            {#if isMoneyConfirmedByRecipient}
              <span class="text-[10px] text-green-600 font-bold uppercase">
                {t.statusLabels.sellerConfirmedMoney[$lang]}
              </span>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Seller delivery claims status -->
  {#if buble.weFinnish && buble.weFinnish.length > 0}
    <div class="px-4">
      <div class="text-[10px] text-orange-600 uppercase font-bold mb-1">
        {t.statusLabels.sellersClaimDelivered[$lang]}
      </div>
      <VoteStatusDisplay
        votes={buble.weFinnish}
        members={buble.members || []}
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

    <!-- Confirm Receipt Button -->
    {#if !buble.iGotIt}
      <button
        class="flex-1 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
        onclick={handleConfirmReceipt}
        disabled={isProcessing}
      >
        {#if isProcessing}
          {t.submitting[$lang]}
        {:else}
          {t.confirmReceipt[$lang]}
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
