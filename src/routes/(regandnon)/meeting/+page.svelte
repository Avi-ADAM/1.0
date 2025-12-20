<script>
  import CreateNewMeeting from '$lib/components/addnew/createNewMeeting.svelte';
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang';
  import Button from '$lib/celim/ui/button.svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import OnlineSwitch from '$lib/celim/onlineSwitch.svelte';
  // import Foot from '$lib/components/footer/foot.svelte';
  import { isOnline, meetingsData } from '$lib/stores/pgishot';
  import { toast } from 'svelte-sonner';

  let { data } = $props();

  let creating = $state(false);
  let pendingMeetings = $state(data.pendingMeetings || []);
  let loadingAction = $state(false);

  // Start Meeting Modal State
  let showStartMeetingModal = $state(false);
  let selectedMeetingForStart = $state(null);
  let videoLinkInput = $state('');
  let startingMeeting = $state(false);

  // Join Meeting State (for ready-check flow)
  let joiningMeetingId = $state(null);

  // Filter pending meetings to remove archived (already filtered by query, but good to be safe)
  let pending = $derived(pendingMeetings); // .filter(p => !p.attributes.archived);

  async function approve(pend) {
    if (loadingAction) return;
    loadingAction = true;

    try {
      const pgisha = pend.attributes.pgisha.data;
      const pgishaId = pgisha.id;

      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'approveMeeting',
          params: {
            pendId: pend.id,
            pgishaId: pgishaId
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        // Remove from list
        pendingMeetings = pendingMeetings.filter((p) => p.id !== pend.id);
        toast.success(
          $lang === 'he'
            ? 'הפגישה אושרה בהצלחה!'
            : 'Meeting approved successfully!'
        );
      } else {
        console.error('Action failed:', result.error);
        toast.error(
          $lang === 'he'
            ? 'אירעה שגיאה באישור הפגישה'
            : 'Failed to approve meeting'
        );
      }
    } catch (e) {
      console.error('Error:', e);
      toast.error(
        $lang === 'he' ? 'אירעה שגיאה באישור הפגישה' : 'Error approving meeting'
      );
    } finally {
      loadingAction = false;
    }
  }

  function openStartMeetingModal(meeting) {
    selectedMeetingForStart = meeting;
    videoLinkInput = '';
    showStartMeetingModal = true;
  }

  function closeStartMeetingModal() {
    showStartMeetingModal = false;
    selectedMeetingForStart = null;
    videoLinkInput = '';
  }

  function isValidVideoLink(url) {
    if (!url) return false;
    // Check for common video meeting platforms
    const validPatterns = [
      /zoom\.(us|com)/i,
      /meet\.google\.com/i,
      /teams\.microsoft\.com/i,
      /whereby\.com/i,
      /webex\.com/i,
      /gotomeeting\.com/i,
      /^https?:\/\//i // Any valid URL
    ];
    return validPatterns.some((pattern) => pattern.test(url));
  }

  async function handleStartMeeting() {
    if (!videoLinkInput.trim()) {
      toast.error(
        $lang === 'he' ? 'נא להזין קישור לפגישה' : 'Please enter a meeting link'
      );
      return;
    }

    if (!isValidVideoLink(videoLinkInput)) {
      toast.error(
        $lang === 'he' ? 'נא להזין קישור תקין' : 'Please enter a valid URL'
      );
      return;
    }

    if (!selectedMeetingForStart) return;

    startingMeeting = true;

    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'startMeeting',
          params: {
            meetingId: selectedMeetingForStart.id,
            videoLink: videoLinkInput.trim()
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          $lang === 'he'
            ? '🎥 הפגישה התחילה! כל המשתתפים קיבלו התראה'
            : '🎥 Meeting started! All participants have been notified'
        );

        // Update the meeting in the store to show it's live
        if ($meetingsData[selectedMeetingForStart.id]) {
          $meetingsData[selectedMeetingForStart.id].attributes.isLive = true;
          $meetingsData[selectedMeetingForStart.id].attributes.videoLink =
            videoLinkInput;
          $meetingsData[selectedMeetingForStart.id].attributes.forumId =
            result.forumId;
        }

        closeStartMeetingModal();

        // Show waiting message if pending, or redirect if live
        if (result.pendingStart) {
          toast.info(
            $lang === 'he'
              ? '⏳ ממתין למשתתפים אחרים...'
              : '⏳ Waiting for other participants...'
          );
        } else if (result.isLive) {
          // Redirect to the meeting page with forum/chat
          window.location.href = '/meeting/' + selectedMeetingForStart.id;
        }
      } else {
        console.error('Start meeting failed:', result.error);
        toast.error(
          $lang === 'he'
            ? result.error || 'אירעה שגיאה בהתחלת הפגישה'
            : result.error || 'Failed to start the meeting'
        );
      }
    } catch (e) {
      console.error('Error starting meeting:', e);
      toast.error(
        $lang === 'he'
          ? 'אירעה שגיאה בהתחלת הפגישה'
          : 'Error starting the meeting'
      );
    } finally {
      startingMeeting = false;
    }
  }

  // Handle joining a pending meeting (confirm readiness)
  async function handleJoinMeeting(meeting) {
    if (joiningMeetingId) return;

    joiningMeetingId = meeting.id;

    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'joinMeeting',
          params: { meetingId: meeting.id }
        })
      });

      const result = await response.json();

      if (result.success) {
        if (result.isLive || result.alreadyLive) {
          toast.success(
            $lang === 'he'
              ? '🎥 הפגישה התחילה! מעביר אותך...'
              : '🎥 Meeting started! Redirecting...'
          );
          // Redirect to meeting room
          setTimeout(() => {
            window.location.href = '/meeting/' + meeting.id;
          }, 1000);
        } else {
          toast.info(
            $lang === 'he'
              ? `✅ אישרת! ממתין לעוד ${result.waitingFor} משתתפ/ים...`
              : `✅ Ready! Waiting for ${result.waitingFor} more participant(s)...`
          );
        }
      } else {
        toast.error(
          $lang === 'he'
            ? result.error || 'אירעה שגיאה'
            : result.error || 'An error occurred'
        );
      }
    } catch (e) {
      console.error('Error joining meeting:', e);
      toast.error($lang === 'he' ? 'אירעה שגיאה' : 'An error occurred');
    } finally {
      joiningMeetingId = null;
    }
  }

  // Handle global online status toggle
  async function toggleGlobalOnline(payload) {
    const status = payload.checked;
    isOnline.set(status);

    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'toggleOnline',
          params: { status }
        })
      });
      const res = await response.json();
      if (res.success) {
        // Update all meetings to reflect global status
        meetingsData.update((meetings) => {
          Object.keys(meetings).forEach((id) => {
            meetings[id].isMyStatusOnline = status;
          });
          return meetings;
        });
      } else {
        isOnline.set(!status);
        toast.error(
          $lang === 'he' ? 'עדכון הסטטוס נכשל' : 'Status update failed'
        );
      }
    } catch (err) {
      console.error('Global toggle failed:', err);
      isOnline.set(!status);
      toast.error($lang === 'he' ? 'אירעה שגיאה' : 'An error occurred');
    }
  }

  // Handle specific meeting online status toggle
  let togglingMeetingId = $state(null);
  async function toggleMeetingOnline(meeting, payload) {
    console.log('toggleMeetingOnline', meeting, payload);
    const status = payload.checked;
    togglingMeetingId = meeting.id;

    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'toggleOnline',
          params: {
            status,
            meetingId: meeting.id
          }
        })
      });
      const res = await response.json();
      if (res.success) {
        // Optimistically update the store
        meetingsData.update((meetings) => {
          if (meetings[meeting.id]) {
            meetings[meeting.id].isMyStatusOnline = status;
          }
          return meetings;
        });
      } else {
        // Revert UI by updating store back
        meetingsData.update((meetings) => {
          if (meetings[meeting.id]) {
            meetings[meeting.id].isMyStatusOnline = !status;
          }
          return meetings;
        });
        toast.error(
          res.error || ($lang === 'he' ? 'עדכון נכשל' : 'Update failed')
        );
      }
    } catch (err) {
      console.error('Meeting toggle failed:', err);
      // Revert store
      meetingsData.update((meetings) => {
        if (meetings[meeting.id]) {
          meetings[meeting.id].isMyStatusOnline = !status;
        }
        return meetings;
      });
      toast.error($lang === 'he' ? 'אירעה שגיאה' : 'An error occurred');
    } finally {
      togglingMeetingId = null;
    }
  }

  const titles = {
    he: {
      title: 'פגישות קסם',
      subtitle: 'המקום שבו הזמן פוגש את המטרה',
      create: 'יצירת פגישה חדשה',
      pending: 'בקשות לפגישה',
      noPending: 'אין בקשות ממתינות לפגישה',
      approve: 'אישור פגישה',
      participants: 'משתתפים:',
      onlineStatus: 'סטטוס זמינות',
      onlineDesc: 'הפעל כדי להראות שאתה זמין לפגישות',
      approved: 'פגישות מאושרות',
      noApproved: 'אין פגישות מאושרות',
      available: 'זמין עכשיו',
      startMeeting: 'התחל פגישה',
      startMeetingTitle: 'התחל פגישת וידאו',
      videoLinkPlaceholder: 'הדבק קישור לZoom, Google Meet או פלטפורמה אחרת',
      videoLinkHelp: 'הזן קישור לפגישת וידאו. המשתתפים יקבלו התראה עם הקישור.',
      cancel: 'ביטול',
      start: 'התחל פגישה',
      starting: 'מתחיל...',
      liveMeeting: 'פגישה פעילה',
      joinVideo: 'הצטרף לוידאו',
      openChat: "פתח צ'אט",
      pendingStart: 'ממתין לאישורי הצטרפות',
      joinMeeting: 'אישור הצטרפות',
      globalOnline: 'סטטוס זמינות כללי',
      meetingOnline: 'זמין לפגישה זו'
    },
    en: {
      title: 'Magic Meetings',
      subtitle: 'Where time meets purpose',
      create: 'Create New Meeting',
      pending: 'Meeting Requests',
      noPending: 'No pending meeting requests',
      approve: 'Approve Meeting',
      participants: 'Participants:',
      onlineStatus: 'Availability Status',
      onlineDesc: 'Enable to show you are available for meetings',
      approved: 'Approved Meetings',
      noApproved: 'No approved meetings',
      available: 'Available Now',
      startMeeting: 'Start Meeting',
      startMeetingTitle: 'Start Video Meeting',
      videoLinkPlaceholder:
        'Paste a link to Zoom, Google Meet or another platform',
      videoLinkHelp:
        'Enter a video meeting link. Participants will receive a notification with the link.',
      cancel: 'Cancel',
      start: 'Start Meeting',
      starting: 'Starting...',
      liveMeeting: 'Live Meeting',
      joinVideo: 'Join Video',
      openChat: 'Open Chat',
      pendingStart: 'Waiting for participants',
      joinMeeting: 'Join Meeting',
      globalOnline: 'Global Availability',
      meetingOnline: 'Available for this meeting'
    }
  };

  let t = $derived(titles[$lang] || titles.he);
</script>

<div
  class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6"
  dir={$lang === 'he' ? 'rtl' : 'ltr'}
>
  <header
    class="text-center mb-8 relative overflow-hidden p-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl"
  >
    <div
      class="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 blur-3xl rounded-full transform -translate-y-1/2 scale-150"
    ></div>
    <h2
      class="font-bold text-5xl md:text-7xl mb-4 pb-4 text-transparent bg-clip-text bg-colorfulGrad bg-[length:200%_auto] animate-gradientx drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)] sticky z-70"
      style=" font-weight: bold; font-size: 3rem;"
    >
      {t.title}
    </h2>
    <p class="text-xl text-gray-200 font-light relative z-10 drop-shadow-md">
      {t.subtitle}
    </p>

    <!-- Global Online Toggle -->
    <div class="mt-8 relative z-10 flex flex-col items-center gap-2">
      <div
        class="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-2xl border border-white/20 backdrop-blur-md"
      >
        <span
          class="text-sm font-bold {$isOnline
            ? 'text-green-400'
            : 'text-gray-400'}"
        >
          {t.globalOnline}
        </span>
        <OnlineSwitch bind:checked={$isOnline} onChange={toggleGlobalOnline} />
      </div>
    </div>
  </header>

  <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
    <!-- Left Column: Create Meeting -->
    <section
      class="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl transition-all duration-300 hover:shadow-2xl hover:bg-white/10 h-fit"
    >
      <div
        class="flex justify-between items-center mb-6 border-b border-pink-500/30 pb-2"
      >
        <h2 class="text-2xl font-bold text-pink-300">
          {t.create}
        </h2>
        {#if creating}
          <button
            class="text-gray-400 hover:text-white transition-colors"
            onclick={() => (creating = false)}
            aria-label="Close"
          >
            ✕
          </button>
        {/if}
      </div>

      {#if creating}
        <div transition:fade class="bg-gray-800/50 rounded-2xl p-4">
          <CreateNewMeeting />
        </div>
      {:else}
        <div class="flex flex-col items-center justify-center py-10 gap-6">
          <div
            class="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30"
          >
            <span class="text-4xl">✨</span>
          </div>
          <p class="text-center text-gray-300 max-w-xs">{t.subtitle}</p>
          <button
            class="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:-translate-y-1 hover:shadow-pink-500/50 flex items-center gap-2"
            onclick={() => (creating = true)}
          >
            <span>+</span>
            {t.create}
          </button>
        </div>
      {/if}
    </section>

    <!-- Right Column: Pending Requests -->
    <section class="h-full flex flex-col gap-6">
      <!-- Approved Meetings -->
      <section
        class="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl transition-all duration-300 hover:shadow-2xl hover:bg-white/10"
      >
        <h2
          class="text-2xl font-bold mb-6 text-green-300 border-b border-green-500/30 pb-2 inline-block"
        >
          {t.approved}
        </h2>

        {#if Object.values($meetingsData).length === 0}
          <div class="text-center py-6 text-gray-500">
            <p>{t.noApproved}</p>
          </div>
        {:else}
          <div class="space-y-4">
            {#each Object.values($meetingsData) as meeting (meeting.id)}
              <div
                class="bg-gray-800/60 rounded-xl p-4 border border-green-500/20 hover:border-green-500/50 transition-all duration-300 relative overflow-hidden {meeting
                  .attributes.available
                  ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-gray-900'
                  : ''}"
              >
                {#if meeting.attributes.available}
                  <div
                    class="absolute top-2 left-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-pulse shadow-lg"
                  >
                    <span class="w-2 h-2 bg-white rounded-full animate-ping"
                    ></span>
                    {t.available}
                  </div>
                {/if}

                <div class={meeting.attributes.available ? 'pr-20' : ''}>
                  <h3
                    class="font-bold text-lg text-white {meeting.attributes
                      .available
                      ? 'text-green-300'
                      : ''}"
                  >
                    {meeting.attributes.name}
                  </h3>
                  {#if meeting.attributes.publishedAt}
                    <p class="text-xs text-gray-400 mt-1">
                      {new Date(
                        meeting.attributes.publishedAt
                      ).toLocaleDateString()}
                    </p>
                  {/if}

                  <div class="mt-3 flex flex-wrap gap-2 items-center">
                    <span
                      class="text-[10px] uppercase tracking-wider text-gray-500 font-bold"
                      >{t.participants}</span
                    >
                    <div class="flex -space-x-2 overflow-hidden">
                      {#each meeting.attributes.pgishausers.data as puser}
                        {#if puser.attributes.users_permissions_user.data}
                          <div class="relative group">
                            <img
                              class="inline-block h-7 w-7 rounded-full ring-2 ring-gray-900 object-cover"
                              src={puser.attributes.users_permissions_user.data
                                .attributes.profilePic?.data?.attributes?.url ||
                                'https://ui-avatars.com/api/?name=' +
                                  puser.attributes.users_permissions_user.data
                                    .attributes.username}
                              alt={puser.attributes.users_permissions_user.data
                                .attributes.username}
                            />
                            <div
                              class="absolute bottom-full mb-2 hidden group-hover:block z-20"
                            >
                              <div
                                class="bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap border border-white/10"
                              >
                                {puser.attributes.users_permissions_user.data
                                  .attributes.username}
                              </div>
                            </div>
                          </div>
                        {/if}
                      {/each}
                    </div>
                    <div class="flex flex-wrap gap-1">
                      {#each meeting.attributes.pgishausers.data as puser}
                        {#if puser.attributes.users_permissions_user.data}
                          <span
                            class="text-[11px] text-gray-300 bg-white/5 px-2 py-0.5 rounded-full border border-white/5"
                          >
                            {puser.attributes.users_permissions_user.data
                              .attributes.username}
                          </span>
                        {/if}
                      {/each}
                    </div>
                  </div>

                  <div
                    class="mt-4 pt-3 border-t border-white/5 flex flex-col gap-3"
                  >
                    <!-- Per-Meeting Availability -->
                    <div
                      class="flex items-center justify-between bg-white/5 p-2 px-3 rounded-lg border border-white/10"
                    >
                      <span
                        class="text-xs font-bold {meeting.isMyStatusOnline
                          ? 'text-green-400'
                          : 'text-gray-400'}"
                      >
                        {t.meetingOnline}
                      </span>
                      <div class="scale-90 origin-right">
                        <OnlineSwitch
                          checked={meeting.isMyStatusOnline || false}
                          onChange={(e) => toggleMeetingOnline(meeting, e)}
                        />
                      </div>
                    </div>

                    {#if meeting.attributes.isLive}
                      <!-- Meeting is live - show join buttons -->
                      <div class="flex flex-wrap items-center gap-2">
                        <div
                          class="bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-pulse"
                        >
                          <span class="w-2 h-2 bg-red-500 rounded-full"></span>
                          {t.liveMeeting}
                        </div>
                        <a
                          href={meeting.attributes.videoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-bold py-2 px-4 rounded-full shadow-lg transform transition hover:-translate-y-1 hover:shadow-blue-500/30 flex items-center gap-2"
                        >
                          <span>🎥</span>
                          {t.joinVideo}
                        </a>
                        <button
                          class="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white text-sm font-bold py-2 px-4 rounded-full shadow-lg transform transition hover:-translate-y-1 hover:shadow-purple-500/30 flex items-center gap-2"
                          onclick={() => {
                            window.location.href = '/meeting/' + meeting.id;
                          }}
                        >
                          <span>💬</span>
                          {t.openChat}
                        </button>
                      </div>
                    {:else if meeting.attributes.pendingStart}
                      <!-- Meeting is pending start - waiting for confirmations -->
                      <div class="flex flex-wrap items-center gap-2">
                        <div
                          class="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-pulse"
                        >
                          <span class="w-2 h-2 bg-yellow-500 rounded-full"
                          ></span>
                          {t.pendingStart}
                          {#if meeting.readyCount !== undefined}
                            ({meeting.readyCount}/{meeting.totalCount})
                          {/if}
                        </div>
                        <button
                          class="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white text-sm font-bold py-2 px-4 rounded-full shadow-lg transform transition hover:-translate-y-1 hover:shadow-yellow-500/30 flex items-center gap-2"
                          onclick={() => handleJoinMeeting(meeting)}
                          disabled={joiningMeetingId === meeting.id}
                        >
                          {#if joiningMeetingId === meeting.id}
                            <span
                              class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                            ></span>
                          {:else}
                            <span>✋</span>
                          {/if}
                          {t.joinMeeting}
                        </button>
                      </div>
                    {:else if meeting.attributes.available}
                      <!-- Meeting available - show start button -->
                      <div class="flex items-center gap-2">
                        <button
                          class="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-bold py-2.5 px-4 rounded-xl shadow-lg transform transition hover:-translate-y-1 hover:shadow-green-500/30 flex items-center justify-center gap-2"
                          onclick={() => openStartMeetingModal(meeting)}
                        >
                          <span>🚀</span>
                          {t.startMeeting}
                        </button>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      <!-- Pending Requests -->
      <section
        class="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl transition-all duration-300 hover:shadow-2xl hover:bg-white/10"
      >
        <h2
          class="text-2xl font-bold mb-6 text-purple-300 border-b border-purple-500/30 pb-2 inline-block"
        >
          {t.pending}
        </h2>

        {#if pending.length === 0}
          <div
            class="text-center py-12 text-gray-400 flex flex-col items-center"
          >
            <span class="text-6xl mb-4 opacity-50">✨</span>
            <p>{t.noPending}</p>
          </div>
        {:else}
          <div class="space-y-6">
            {#each pending as pend (pend.id)}
              <div
                transition:fly={{ y: 20, duration: 400 }}
                class="bg-gradient-to-r from-gray-800 to-gray-800/80 rounded-2xl p-6 border border-gray-700 shadow-lg relative overflow-hidden group hover:border-purple-500/50 transition-colors"
              >
                <div
                  class="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 opacity-70"
                ></div>

                <h3
                  class="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors"
                >
                  {pend.attributes.pgisha.data.attributes.name}
                </h3>

                <div class="text-gray-300 text-sm mb-4 line-clamp-2">
                  {@html pend.attributes.pgisha.data.attributes.desc || ''}
                </div>

                <div class="flex items-center justify-between mt-4">
                  <div class="flex -space-x-2 overflow-hidden px-2">
                    <!-- Participants avatars if available -->
                    {#each pend.attributes.pgisha.data.attributes.pgishausers.data as user}
                      {#if user.attributes.users_permissions_user.data}
                        <img
                          class="inline-block h-8 w-8 rounded-full ring-2 ring-gray-800"
                          src={user.attributes.users_permissions_user.data
                            .attributes.profilePic?.data?.attributes?.url ||
                            'https://ui-avatars.com/api/?name=' +
                              user.attributes.users_permissions_user.data
                                .attributes.username}
                          alt={user.attributes.users_permissions_user.data
                            .attributes.username}
                          title={user.attributes.users_permissions_user.data
                            .attributes.username}
                        />
                      {/if}
                    {/each}
                  </div>

                  <button
                    class="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transform transition hover:-translate-y-1 hover:shadow-green-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onclick={() => approve(pend)}
                    disabled={loadingAction}
                  >
                    {#if loadingAction}
                      <span
                        class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                      ></span>
                    {:else}
                      <span>✓</span>
                    {/if}
                    {t.approve}
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>
    </section>
  </div>
</div>

<!-- Start Meeting Modal -->
{#if showStartMeetingModal}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    transition:fade={{ duration: 200 }}
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/70 backdrop-blur-sm"
      role="button"
      tabindex="-1"
      onclick={closeStartMeetingModal}
      onkeydown={(e) => e.key === 'Escape' && closeStartMeetingModal()}
    ></div>

    <!-- Modal Content -->
    <div
      class="relative bg-gradient-to-br from-gray-900 via-purple-900/90 to-gray-900 rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl"
      transition:scale={{ duration: 300, start: 0.9 }}
      dir={$lang === 'he' ? 'rtl' : 'ltr'}
    >
      <!-- Close Button -->
      <button
        class="absolute top-4 {$lang === 'he'
          ? 'left-4'
          : 'right-4'} text-gray-400 hover:text-white transition-colors text-xl"
        onclick={closeStartMeetingModal}
      >
        ✕
      </button>

      <!-- Header -->
      <div class="text-center mb-6">
        <div
          class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30"
        >
          <span class="text-3xl">🎥</span>
        </div>
        <h3 class="text-2xl font-bold text-white mb-2">
          {t.startMeetingTitle}
        </h3>
        {#if selectedMeetingForStart}
          <p class="text-green-300 font-medium">
            {selectedMeetingForStart.attributes.name}
          </p>
        {/if}
      </div>

      <!-- Video Link Input -->
      <div class="space-y-4">
        <div>
          <label
            for="video-link-input"
            class="block text-sm font-medium text-gray-300 mb-2"
          >
            {$lang === 'he' ? 'קישור לפגישת וידאו' : 'Video Meeting Link'}
          </label>
          <div class="relative">
            <input
              id="video-link-input"
              type="url"
              bind:value={videoLinkInput}
              placeholder={t.videoLinkPlaceholder}
              class="w-full px-4 py-3 bg-gray-800/80 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              dir="ltr"
            />
            <!-- Platform Icons -->
            <div
              class="absolute {$lang === 'he'
                ? 'left-3'
                : 'right-3'} top-1/2 -translate-y-1/2 flex gap-1 opacity-50"
            >
              <span class="text-sm">📹</span>
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            {t.videoLinkHelp}
          </p>
        </div>

        <!-- Platform Suggestions -->
        <div class="flex flex-wrap gap-2 justify-center">
          <a
            href="https://zoom.us/start/videomeeting"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full hover:bg-blue-600/30 transition-colors"
          >
            Zoom
          </a>
          <a
            href="https://meet.google.com/new"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs bg-green-600/20 text-green-400 px-3 py-1 rounded-full hover:bg-green-600/30 transition-colors"
          >
            Google Meet
          </a>
          <a
            href="https://teams.microsoft.com/"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full hover:bg-purple-600/30 transition-colors"
          >
            Teams
          </a>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 mt-8">
        <button
          class="flex-1 py-3 px-6 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors font-medium"
          onclick={closeStartMeetingModal}
          disabled={startingMeeting}
        >
          {t.cancel}
        </button>
        <button
          class="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold shadow-lg shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          onclick={handleStartMeeting}
          disabled={startingMeeting || !videoLinkInput.trim()}
        >
          {#if startingMeeting}
            <span
              class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
            ></span>
            {t.starting}
          {:else}
            <span>🚀</span>
            {t.start}
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Custom Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
  }
  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
</style>
