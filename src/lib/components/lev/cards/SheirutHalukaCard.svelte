<script lang="ts">
  import { lang } from '$lib/stores/lang.js';
  import { toast } from 'svelte-sonner';
  import { nowChatId, isChatOpen, newChat, forum } from '$lib/stores/pendMisMes.js';

  let {
    halukaId,
    senderId,
    receiverId,
    senderName = '',
    receiverName = '',
    senderPic = '',
    receiverPic = '',
    amount = null,
    forumId = $bindable(null),
    senderconf = $bindable(false),
    confirmed = $bindable(false),
    myId,
    projectId
  }: {
    halukaId: string;
    senderId: string;
    receiverId: string;
    senderName?: string;
    receiverName?: string;
    senderPic?: string;
    receiverPic?: string;
    amount?: number | null;
    forumId?: string | null;
    senderconf?: boolean;
    confirmed?: boolean;
    myId: string;
    projectId: string;
  } = $props();

  const isSender = $derived(String(myId) === String(senderId));
  const isReceiver = $derived(String(myId) === String(receiverId));
  const isParticipant = $derived(isSender || isReceiver);

  let isProcessing = $state(false);
  let isOpeningChat = $state(false);

  const t = {
    senderLabel: { he: 'שולח', en: 'Sender' },
    receiverLabel: { he: 'מקבל', en: 'Receiver' },
    chat: { he: "צ'אט פרטי", en: 'Private chat' },
    confirmSent: { he: 'אישור — שלחתי', en: 'Confirm — I sent it' },
    confirmReceived: { he: 'אישור — קיבלתי', en: 'Confirm — I received it' },
    senderConfirmed: { he: 'השולח אישר שליחה', en: 'Sender confirmed' },
    receiverConfirmed: { he: 'המקבל אישר קבלה', en: 'Receiver confirmed' },
    pendingConfirm: { he: 'ממתין לאישור', en: 'Pending' },
    processing: { he: 'מעבד...', en: 'Processing...' },
    openingChat: { he: "פותח צ'אט...", en: 'Opening chat...' },
    error: { he: 'שגיאה', en: 'Error' },
    transferStatus: { he: 'העברת כסף', en: 'Money transfer' },
    complete: { he: 'הושלם', en: 'Complete' }
  };

  const isComplete = $derived(senderconf && confirmed);

  async function handleConfirmSent() {
    if (isProcessing || senderconf) return;
    isProcessing = true;
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'confirmSheirutHaluka',
          params: { halukaId: String(halukaId), role: 'sender' }
        })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed');
      senderconf = true;
      toast.success(t.senderConfirmed[$lang]);
    } catch (err) {
      console.error(err);
      toast.error(t.error[$lang]);
    } finally {
      isProcessing = false;
    }
  }

  async function handleConfirmReceived() {
    if (isProcessing || confirmed) return;
    isProcessing = true;
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'confirmSheirutHaluka',
          params: { halukaId: String(halukaId), role: 'receiver' }
        })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed');
      confirmed = true;
      toast.success(t.receiverConfirmed[$lang]);
    } catch (err) {
      console.error(err);
      toast.error(t.error[$lang]);
    } finally {
      isProcessing = false;
    }
  }

  async function handleOpenChat() {
    if (isOpeningChat) return;

    let chatForumId = forumId;

    if (!chatForumId) {
      isOpeningChat = true;
      try {
        const res = await fetch('/api/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionKey: 'ensureHalukaForum',
            params: { halukaId: String(halukaId), projectId: String(projectId) }
          })
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.error?.message || 'Failed');
        chatForumId = result.data?.forumId;
        forumId = chatForumId;
      } catch (err) {
        console.error(err);
        toast.error(t.error[$lang]);
        isOpeningChat = false;
        return;
      } finally {
        isOpeningChat = false;
      }
    }

    const md = {
      pid: Number(projectId),
      mbId: 0,
      halukId: Number(halukaId),
      senderId,
      receiverId,
      participants: [senderId, receiverId]
    };

    if (chatForumId && chatForumId !== '-1') {
      const tempF = $forum;
      tempF[chatForumId] = { loading: false, messages: tempF[chatForumId]?.messages || [], md };
      forum.set(tempF);
      nowChatId.set(Number(chatForumId));
      isChatOpen.set(true);
    } else {
      newChat.set({ started: true, created: false, id: 0, md });
      const tempF = $forum;
      tempF[-1] = { loading: false, messages: [], md };
      forum.set(tempF);
      nowChatId.set(-1);
      isChatOpen.set(true);
    }
  }
</script>

<div
  class="rounded-xl border p-3 space-y-3 {isComplete
    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'}"
>
  <!-- Header -->
  <div class="flex items-center justify-between">
    <span class="text-[10px] font-bold uppercase {isComplete ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}">
      {t.transferStatus[$lang]}
    </span>
    {#if isComplete}
      <span class="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded-full">
        ✓ {t.complete[$lang]}
      </span>
    {/if}
  </div>

  <!-- Sender → Receiver with amount -->
  <div class="flex items-center justify-between gap-2">
    <!-- Sender -->
    <div class="flex flex-col items-center gap-1 flex-1 min-w-0">
      <div class="text-[9px] text-gray-500 dark:text-gray-400 uppercase">{t.senderLabel[$lang]}</div>
      {#if senderPic}
        <img
          src={senderPic}
          alt={senderName}
          class="w-9 h-9 rounded-full object-cover border-2 {senderconf ? 'border-green-400' : 'border-amber-300'}"
        />
      {:else}
        <div
          class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 {senderconf
            ? 'bg-green-100 dark:bg-green-800 text-green-700 border-green-400'
            : 'bg-amber-100 dark:bg-amber-800 text-amber-700 border-amber-300'}"
        >
          {senderName?.charAt(0) || '?'}
        </div>
      {/if}
      <div class="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center truncate w-full px-1">
        {senderName}
      </div>
      {#if senderconf}
        <span class="text-[9px] text-green-600 dark:text-green-400 font-bold">✓</span>
      {:else}
        <span class="text-[9px] text-gray-400">–</span>
      {/if}
    </div>

    <!-- Arrow + Amount -->
    <div class="flex flex-col items-center gap-1 shrink-0">
      {#if amount != null}
        <span class="text-sm font-black text-amber-700 dark:text-amber-300">{amount}</span>
      {/if}
      <svg class="w-8 h-4 text-gray-400" fill="none" viewBox="0 0 32 12">
        <path d="M0 6h26M20 1l7 5-7 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>

    <!-- Receiver -->
    <div class="flex flex-col items-center gap-1 flex-1 min-w-0">
      <div class="text-[9px] text-gray-500 dark:text-gray-400 uppercase">{t.receiverLabel[$lang]}</div>
      {#if receiverPic}
        <img
          src={receiverPic}
          alt={receiverName}
          class="w-9 h-9 rounded-full object-cover border-2 {confirmed ? 'border-green-400' : 'border-amber-300'}"
        />
      {:else}
        <div
          class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 {confirmed
            ? 'bg-green-100 dark:bg-green-800 text-green-700 border-green-400'
            : 'bg-amber-100 dark:bg-amber-800 text-amber-700 border-amber-300'}"
        >
          {receiverName?.charAt(0) || '?'}
        </div>
      {/if}
      <div class="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center truncate w-full px-1">
        {receiverName}
      </div>
      {#if confirmed}
        <span class="text-[9px] text-green-600 dark:text-green-400 font-bold">✓</span>
      {:else}
        <span class="text-[9px] text-gray-400">–</span>
      {/if}
    </div>
  </div>

  <!-- Confirmation status text -->
  <div class="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 px-1">
    <span>{senderconf ? t.senderConfirmed[$lang] : t.pendingConfirm[$lang]}</span>
    <span>{confirmed ? t.receiverConfirmed[$lang] : t.pendingConfirm[$lang]}</span>
  </div>

  <!-- Actions — only for participants -->
  {#if isParticipant}
    <div class="flex gap-2 pt-1 border-t {isComplete ? 'border-green-200 dark:border-green-700' : 'border-amber-200 dark:border-amber-700'}">
      <!-- Private chat button -->
      <button
        class="py-1.5 px-2 bg-white dark:bg-gray-800 border border-blue-400 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-xs font-bold rounded-lg flex items-center gap-1 disabled:opacity-50 shrink-0"
        onclick={handleOpenChat}
        disabled={isOpeningChat}
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {isOpeningChat ? t.openingChat[$lang] : t.chat[$lang]}
      </button>

      <!-- Sender confirm button -->
      {#if isSender && !senderconf}
        <button
          class="flex-1 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-lg hover:shadow-md transition-all disabled:opacity-50"
          onclick={handleConfirmSent}
          disabled={isProcessing}
        >
          {isProcessing ? t.processing[$lang] : t.confirmSent[$lang]}
        </button>
      {/if}

      <!-- Receiver confirm button -->
      {#if isReceiver && !confirmed}
        <button
          class="flex-1 py-1.5 bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs font-bold rounded-lg hover:shadow-md transition-all disabled:opacity-50"
          onclick={handleConfirmReceived}
          disabled={isProcessing}
        >
          {isProcessing ? t.processing[$lang] : t.confirmReceived[$lang]}
        </button>
      {/if}
    </div>
  {/if}
</div>
