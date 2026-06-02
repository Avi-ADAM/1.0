<script lang="ts">
  import { lang } from '$lib/stores/lang.js';
  import { toast } from 'svelte-sonner';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import CardHeader from './CardHeader.svelte';
  import VoteStatusDisplay from './VoteStatusDisplay.svelte';
  import SheirutHalukaCard from './SheirutHalukaCard.svelte';
  import { idd } from '$lib/stores/idd.js';
  import { forum, username } from '$lib/stores/pendMisMes.js';
  import { uPic } from '$lib/stores/uPic.js';

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
        const md = {
          pid: Number(buble.projectId),
          title: { he: 'אישור מכירה', en: 'Sale Approval' },
          transferDetails: buble.name
        };
        const tempF = $forum;
        tempF[buble.forumId] = {
          ...tempF[buble.forumId],
          md: { ...(tempF[buble.forumId]?.md || {}), ...md }
        };
        forum.set(tempF);
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
            throw new Error(
              result.error?.message || 'Failed to create chat forum.'
            );
          }

          const newForumId = result.data?.forumId;
          if (!newForumId) {
            throw new Error('Failed to create chat forum.');
          }

          buble.forumId = newForumId;
          const md = {
            pid: Number(buble.projectId),
            title: { he: 'אישור מכירה', en: 'Sale Approval' },
            transferDetails: buble.name
          };
          const tempF = $forum;
          tempF[newForumId] = {
            loading: false,
            messages: tempF[newForumId]?.messages || [],
            md
          };
          forum.set(tempF);
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
      ar: 'تأكيد الاستلام'
    },
    selectSeller: {
      he: 'בחר את מי לתאם איתו את ההעברה:',
      en: 'Select who to coordinate the transfer with:',
      ar: 'اختر من تنسق معه التحويل'
    },
    noReceivers: {
      he: 'עדיין אין חברי פרויקט שציינו שיכולים לקבל כסף',
      en: 'No project members indicated they can receive money yet',
      ar: 'لا يوجد أعضاء أشاروا أنهم يستطيعون استلام المال بعد'
    },
    askInChat: {
      he: 'כדאי לבקש בצ׳אט',
      en: 'Ask in chat',
      ar: 'اسأل في المحادثة'
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
      he: 'נפתח תהליך ההעברה',
      en: 'Transfer process started',
      ar: 'تم بدء عملية التحويل'
    },
    error: {
      he: 'שגיאה בביצוע הפעולה',
      en: 'Action failed',
      ar: 'فشل الإجراء'
    },
    statusLabels: {
      iGotIt: { he: 'קיבלתי', en: 'I received', ar: 'استلمת' },
      transferInProgress: { he: 'בתהליך העברה', en: 'Transfer in progress', ar: 'التحويل قيد التنفيذ' },
      sellersClaimDelivered: {
        he: 'המוכרים טוענים שמסרו',
        en: 'Sellers claim delivered',
        ar: 'يدّعي البائعون أنهم سلّموا'
      },
      sellerConfirmedMoney: {
        he: 'המקבל אישר קבלת הכסף',
        en: 'Recipient confirmed receipt',
        ar: 'أكد المستلم استلام المال'
      },
      coordinatingWith: {
        he: 'בתיאום עם:',
        en: 'Coordinating with:',
        ar: 'بالتنسيق مع:'
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

  async function handleConfirmTransfer(receiverId: string) {
    if (isProcessing || buble.iTransferMoney) return;

    isProcessing = true;
    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'createSheirutHaluka',
          params: {
            sheirutId: String(buble.id),
            projectId: String(buble.projectId),
            receiverId,
            amount: buble.total ?? buble.price ?? 0
          }
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed');

      buble.iTransferMoney = true;
      buble.halukaId = String(result.data?.halukaId);
      buble.halukaForumId = null;
      buble.senderconf = false;
      buble.halukaConfirmed = false;
      const selectedReceiver = buble.iCanGetMonay?.find((m: any) => String(m.id) === String(receiverId));
      if (selectedReceiver) {
        buble.iTransferedTo = selectedReceiver;
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

  // Members for weFinnish display: sellers (flat→Strapi format) + customer
  const weFinnishMembers = $derived.by(() => {
    const sellers = (buble.members || []).map((m: any) => ({
      id: m.id,
      attributes: {
        username: m.username,
        profilePic: { data: { attributes: { url: m.profilePic || null } } }
      }
    }));
    const customer = {
      id: buble.customerId,
      attributes: {
        username: buble.customerName,
        profilePic: { data: { attributes: { url: buble.customerSrc || null } } }
      }
    };
    return [...sellers, customer];
  });

  // Votes for weFinnish display: actual votes + synthetic customer vote when iGotIt
  const weFinnishVotes = $derived.by(() => {
    const votes = [...(buble.weFinnish || [])];
    if (buble.iGotIt) {
      votes.push({
        id: 'customer-iGotIt',
        what: true,
        order: 0,
        users_permissions_user: { data: { id: buble.customerId } }
      });
    }
    return votes;
  });

  // Check if the recipient confirmed money
  const isMoneyConfirmedByRecipient = $derived.by(() => {
    if (!buble.iTransferedTo || !buble.iGotMoney) return false;
    return buble.iGotMoney.some(
      (gm: any) =>
        gm.users_permissions_user?.data?.id === buble.iTransferedTo.id
    );
  });

  const statusItems = $derived.by(() => {
    const items = [];

    if (buble.iGotIt) {
      items.push({ label: t.statusLabels.iGotIt[$lang], color: 'green' });
    }
    if (buble.iTransferMoney) {
      items.push({ label: t.statusLabels.transferInProgress[$lang], color: 'blue' });
    }
    if (buble.weFinnish && buble.weFinnish.length > 0) {
      items.push({
        label: t.statusLabels.sellersClaimDelivered[$lang],
        color: 'orange'
      });
    }
    if (isMoneyConfirmedByRecipient) {
      items.push({
        label: t.statusLabels.sellerConfirmedMoney[$lang],
        color: 'green'
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
  >
    {#snippet voteSummary()}
      {#if !isMobileOrTablet() && buble.weFinnish && buble.weFinnish.length > 0}
        <div
          class="bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm"
        >
          <div class="text-[10px] text-orange-600 uppercase font-bold mb-1">
            {t.statusLabels.sellersClaimDelivered[$lang]}
          </div>
          <VoteStatusDisplay
            compact
            votes={weFinnishVotes}
            members={weFinnishMembers}
            activeOrder={0}
          />
        </div>
      {/if}
    {/snippet}
  </CardHeader>

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
      <div
        class="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-200 dark:border-indigo-700"
      >
        <div
          class="text-[10px] text-indigo-700 dark:text-indigo-400 uppercase font-semibold mb-2"
        >
          {t.selectSeller[$lang]}
        </div>
        <div class="flex flex-wrap gap-2">
          {#each buble.iCanGetMonay || [] as member}
            <button
              class="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 hover:border-indigo-500 transition-all text-xs"
              onclick={() => handleConfirmTransfer(member.id)}
              disabled={isProcessing}
            >
              {#if member.profilePic}
                <img
                  src={member.profilePic}
                  alt={member.username}
                  class="w-6 h-6 rounded-full object-cover"
                />
              {:else}
                <div
                  class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold"
                >
                  {member.username?.charAt(0)}
                </div>
              {/if}
              <span>{member.username}</span>
            </button>
          {:else}
            <div class="flex items-center justify-between w-full gap-2">
              <span class="text-xs text-gray-500 dark:text-gray-400 italic">
                {t.noReceivers[$lang]}
              </span>
              <button
                class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-800 transition-colors shrink-0"
                onclick={handleOpenChat}
              >
                {t.askInChat[$lang]}
              </button>
            </div>
          {/each}
        </div>
      </div>
    {:else if buble.halukaId}
      <SheirutHalukaCard
        halukaId={String(buble.halukaId)}
        senderId={String($idd)}
        receiverId={String(buble.iTransferedTo?.id ?? '')}
        senderName={$username}
        receiverName={buble.iTransferedTo?.username ?? ''}
        senderPic={$uPic}
        receiverPic={buble.iTransferedTo?.profilePic}
        amount={buble.total ?? buble.price}
        bind:forumId={buble.halukaForumId}
        bind:senderconf={buble.senderconf}
        bind:confirmed={buble.halukaConfirmed}
        myId={String($idd)}
        projectId={String(buble.projectId)}
      />
    {/if}
  </div>

  <!-- Seller delivery claims status -->
  {#if buble.weFinnish && buble.weFinnish.length > 0 && isMobileOrTablet()}
    <div class="px-4">
      <div class="text-[10px] text-orange-600 uppercase font-bold mb-1">
        {t.statusLabels.sellersClaimDelivered[$lang]}
      </div>
      <VoteStatusDisplay
        votes={weFinnishVotes}
        members={weFinnishMembers}
        activeOrder={0}
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
