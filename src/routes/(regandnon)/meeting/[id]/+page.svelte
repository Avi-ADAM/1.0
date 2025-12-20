<script>
  import { lang } from '$lib/stores/lang';
  import { fade, fly, slide } from 'svelte/transition';
  import { toast } from 'svelte-sonner';
  import { onMount, onDestroy } from 'svelte';
  import { socketClient } from '$lib/stores/socketClient';
  import { meetingsData, refreshMeetingData } from '$lib/stores/pgishot';

  let { data } = $props();

  let messageInput = $state('');
  let sendingMessage = $state(false);
  let messages = $state(data.messages || []);
  let messagesContainer = $state(null);
  let participants = $state(data.participants || []);
  let meeting = $state(data.meeting);
  let unsubscribeSocket = $state(null);

  // Subscribe to meetingsData store for reactive updates
  $effect(() => {
    const unsubscribe = meetingsData.subscribe((meetings) => {
      if (meetings[data.meetingId]) {
        const updatedMeeting = meetings[data.meetingId];
        meeting = {
          ...meeting,
          isLive: updatedMeeting.attributes?.isLive ?? meeting?.isLive,
          videoLink: updatedMeeting.attributes?.videoLink ?? meeting?.videoLink,
          available: updatedMeeting.attributes?.available ?? meeting?.available
        };
      }
    });
    return () => unsubscribe();
  });

  // Scroll to bottom when messages change
  $effect(() => {
    if (messagesContainer && messages.length) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    }
  });

  // Setup socket listener for real-time updates
  onMount(() => {
    unsubscribeSocket = socketClient.onNotification((notification) => {
      // @ts-ignore - metadata can have additional fields at runtime
      const metadata = notification.metadata || {};

      // Only process notifications for this meeting
      // @ts-ignore
      if (metadata.meetingId !== data.meetingId) return;

      console.log(
        '[MeetingPage] Received notification:',
        metadata.type,
        metadata
      );

      switch (metadata.type) {
        case 'meetingStarted':
          meeting = {
            ...meeting,
            isLive: true,
            videoLink: metadata.videoLink,
            forumId: metadata.forumId
          };
          toast.success(
            $lang === 'he' ? '🎥 הפגישה התחילה!' : '🎥 Meeting started!'
          );
          break;

        case 'userAvailability':
        case 'meetingReady':
          // Update participant status
          participants = participants.map((p) => {
            if (p.userId === metadata.userId) {
              return { ...p, available: metadata.status === 'online' };
            }
            return p;
          });

          if (metadata.allOnline) {
            meeting = { ...meeting, available: true };
            toast.success(
              $lang === 'he' ? '🎉 כולם זמינים!' : '🎉 Everyone is available!'
            );
          }
          break;

        case 'newMessage':
        case 'meetingMessage':
          // Add new message from socket
          const newMsg = notification.data?.message;
          if (newMsg && !messages.find((m) => m.id === newMsg.id)) {
            messages = [...messages, newMsg];
          }
          break;
      }
    });

    // Refresh meeting data on mount
    if (data.meetingId) {
      refreshMeetingData(data.meetingId);
    }
  });

  onDestroy(() => {
    if (unsubscribeSocket) {
      unsubscribeSocket();
    }
  });

  async function sendMessage() {
    if (!messageInput.trim() || sendingMessage) return;

    const content = messageInput.trim();
    messageInput = '';
    sendingMessage = true;

    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'sendMeetingMessage',
          params: {
            forumId: data.meeting?.forumId,
            content: content
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        // Add message to local state
        messages = [
          ...messages,
          {
            id: result.messageId || Date.now(),
            content: content,
            createdAt: new Date().toISOString(),
            userId: data.uid,
            username: 'You',
            profilePic: null
          }
        ];
      } else {
        toast.error(
          $lang === 'he' ? 'שגיאה בשליחת ההודעה' : 'Error sending message'
        );
        messageInput = content; // Restore message
      }
    } catch (e) {
      console.error('Error:', e);
      toast.error(
        $lang === 'he' ? 'שגיאה בשליחת ההודעה' : 'Error sending message'
      );
      messageInput = content;
    } finally {
      sendingMessage = false;
    }
  }

  let joining = $state(false);
  async function joinMeeting() {
    if (joining) return;
    joining = true;
    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'joinMeeting',
          params: { meetingId: data.meetingId }
        })
      });
      const result = await response.json();
      if (result.success) {
        if (result.isLive) {
          meeting = { ...meeting, isLive: true };
          toast.success(
            $lang === 'he' ? '🎥 הפגישה התחילה!' : '🎥 Meeting started!'
          );
        } else {
          meeting = { ...meeting, pendingStart: true };
          toast.info($lang === 'he' ? '✅ אישרת מוכנות' : '✅ Marked as ready');
        }
      }
    } catch (e) {
      console.error('Error joining meeting:', e);
    } finally {
      joining = false;
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString($lang === 'he' ? 'he-IL' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const t = $derived(
    {
      he: {
        meetingRoom: 'חדר פגישה',
        joinVideo: 'הצטרף לוידאו',
        participants: 'משתתפים',
        online: 'מחובר',
        offline: 'לא מחובר',
        chat: "צ'אט",
        typeMessage: 'הקלד הודעה...',
        send: 'שלח',
        noMessages: 'אין הודעות עדיין. היה הראשון לכתוב!',
        meetingNotFound: 'הפגישה לא נמצאה',
        backToMeetings: 'חזור לפגישות',
        meetingNotLive: 'הפגישה עדיין לא התחילה',
        videoLink: 'קישור לפגישת וידאו',
        startedBy: 'התחיל על ידי',
        startedAt: 'התחיל ב',
        pendingStart: 'ממתין לאישורי הצטרפות',
        joinMeeting: 'אני מוכן! הצטרף לפגישה',
        waitingForOthers: 'ממתין למשתתפים נוספים...'
      },
      en: {
        meetingRoom: 'Meeting Room',
        joinVideo: 'Join Video',
        participants: 'Participants',
        online: 'Online',
        offline: 'Offline',
        chat: 'Chat',
        typeMessage: 'Type a message...',
        send: 'Send',
        noMessages: 'No messages yet. Be the first to write!',
        meetingNotFound: 'Meeting not found',
        backToMeetings: 'Back to Meetings',
        meetingNotLive: 'Meeting has not started yet',
        videoLink: 'Video Meeting Link',
        startedBy: 'Started by',
        startedAt: 'Started at',
        pendingStart: 'Waiting for participants to join',
        joinMeeting: 'I am ready! Join Meeting',
        waitingForOthers: 'Waiting for other participants...'
      }
    }[$lang] || {
      meetingRoom: 'Meeting Room',
      joinVideo: 'Join Video',
      participants: 'Participants',
      online: 'Online',
      offline: 'Offline',
      chat: 'Chat',
      typeMessage: 'Type a message...',
      send: 'Send',
      noMessages: 'No messages yet. Be the first to write!',
      meetingNotFound: 'Meeting not found',
      backToMeetings: 'Back to Meetings',
      meetingNotLive: 'Meeting has not started yet',
      videoLink: 'Video Meeting Link',
      startedBy: 'Started by',
      startedAt: 'Started at'
    }
  );
</script>

<div
  class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white"
  dir={$lang === 'he' ? 'rtl' : 'ltr'}
>
  {#if !data.meeting}
    <!-- Meeting Not Found -->
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center p-8">
        <span class="text-6xl mb-4 block">😕</span>
        <h1 class="text-2xl font-bold text-white mb-4">{t.meetingNotFound}</h1>
        <a
          href="/meeting"
          class="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all"
        >
          ← {t.backToMeetings}
        </a>
      </div>
    </div>
  {:else}
    <!-- Header -->
    <header
      class="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-lg border-b border-white/10 px-4 py-3"
    >
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a
            href="/meeting"
            class="text-gray-400 hover:text-white transition-colors"
          >
            ←
          </a>
          <div>
            <h1 class="text-xl font-bold text-white flex items-center gap-2">
              {meeting?.name || data.meeting?.name}
              {#if meeting?.isLive}
                <span
                  class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1"
                >
                  <span class="w-2 h-2 bg-white rounded-full"></span>
                  LIVE
                </span>
              {:else if meeting?.pendingStart}
                <span
                  class="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1"
                >
                  <span class="w-2 h-2 bg-black rounded-full"></span>
                  {t.pendingStart}
                </span>
              {/if}
            </h1>
            {#if meeting?.startedBy}
              <p class="text-sm text-gray-400">
                {t.startedBy}: {meeting.startedBy}
              </p>
            {/if}
          </div>
        </div>

        {#if meeting?.isLive && meeting?.videoLink}
          <a
            href={meeting.videoLink}
            target="_blank"
            rel="noopener noreferrer"
            class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transform transition hover:-translate-y-1 hover:shadow-blue-500/30 flex items-center gap-2"
          >
            <span>🎥</span>
            {t.joinVideo}
          </a>
        {:else if meeting?.pendingStart}
          <button
            onclick={joinMeeting}
            disabled={joining}
            class="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transform transition hover:-translate-y-1 hover:shadow-green-500/30 flex items-center gap-2"
          >
            {#if joining}
              <span
                class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"
              ></span>
            {:else}
              <span>🚀</span>
            {/if}
            {t.joinMeeting}
          </button>
        {/if}
      </div>
    </header>

    <main
      class="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-80px)]"
    >
      <!-- Participants Sidebar -->
      <aside
        class="lg:col-span-1 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 h-fit max-h-[50vh] lg:max-h-full overflow-y-auto"
      >
        <h2
          class="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2"
        >
          <span>👥</span>
          {t.participants}
        </h2>

        <div class="space-y-3">
          {#each data.participants as participant}
            <div
              class="flex items-center gap-3 p-2 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors"
            >
              <div class="relative">
                <img
                  src={participant.profilePic ||
                    `https://ui-avatars.com/api/?name=${participant.username}&background=6366f1&color=fff`}
                  alt={participant.username}
                  class="w-10 h-10 rounded-full ring-2 {participant.available
                    ? 'ring-green-500'
                    : 'ring-gray-600'}"
                />
                <span
                  class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 {participant.available
                    ? 'bg-green-500'
                    : 'bg-gray-500'}"
                ></span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-white truncate">
                  {participant.username}
                </p>
                <p
                  class="text-xs {participant.available
                    ? 'text-green-400'
                    : 'text-gray-500'}"
                >
                  {participant.available ? t.online : t.offline}
                </p>
              </div>
            </div>
          {/each}
        </div>
      </aside>

      <!-- Chat Area -->
      <section
        class="lg:col-span-3 flex flex-col bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden"
      >
        <div class="p-4 border-b border-white/10 bg-gray-800/30">
          <h2 class="text-lg font-bold text-green-300 flex items-center gap-2">
            <span>💬</span>
            {t.chat}
          </h2>
        </div>

        <!-- Messages -->
        <div
          bind:this={messagesContainer}
          class="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {#if messages.length === 0}
            <div class="flex items-center justify-center h-full text-gray-500">
              <div class="text-center">
                <span class="text-4xl mb-2 block">💬</span>
                <p>{t.noMessages}</p>
              </div>
            </div>
          {:else}
            {#each messages as message (message.id)}
              <div
                class="flex gap-3 {message.userId === data.uid
                  ? 'flex-row-reverse'
                  : ''}"
                transition:fly={{ y: 20, duration: 300 }}
              >
                <img
                  src={message.profilePic ||
                    `https://ui-avatars.com/api/?name=${message.username}&background=6366f1&color=fff`}
                  alt={message.username}
                  class="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div
                  class="max-w-[70%] {message.userId === data.uid
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                    : 'bg-gray-800'} rounded-2xl p-3 shadow-lg"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <span
                      class="text-xs font-medium {message.userId === data.uid
                        ? 'text-purple-200'
                        : 'text-gray-400'}"
                    >
                      {message.username}
                    </span>
                    <span class="text-xs text-gray-500">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                  <p class="text-white break-words">{message.content}</p>
                </div>
              </div>
            {/each}
          {/if}
        </div>

        <!-- Message Input -->
        <form
          class="p-4 border-t border-white/10 bg-gray-800/30"
          onsubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <div class="flex gap-3">
            <input
              type="text"
              bind:value={messageInput}
              placeholder={t.typeMessage}
              class="flex-1 px-4 py-3 bg-gray-800/80 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              onkeydown={handleKeyPress}
              disabled={!data.meeting.forumId}
            />
            <button
              type="submit"
              class="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg transform transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={sendingMessage ||
                !messageInput.trim() ||
                !data.meeting.forumId}
            >
              {#if sendingMessage}
                <span
                  class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                ></span>
              {:else}
                <span>📤</span>
              {/if}
              {t.send}
            </button>
          </div>
          {#if !data.meeting.forumId}
            <p class="text-xs text-yellow-500 mt-2">
              {$lang === 'he'
                ? "הצ'אט לא זמין - הפגישה צריכה להתחיל קודם"
                : 'Chat is not available - meeting needs to start first'}
            </p>
          {/if}
        </form>
      </section>
    </main>
  {/if}
</div>

<style>
  /* Custom Scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
</style>
