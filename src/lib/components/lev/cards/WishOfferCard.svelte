<script lang="ts">
  import { goto } from '$app/navigation';
  import { isRtl } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { toast } from 'svelte-sonner';
  import { wishOffersStore } from '$lib/stores/levStores';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import CardHeader from './CardHeader.svelte';

  let { buble, isFirst = false, onUser, onChat } = $props();

  const t = {
    cardType: { he: 'הצעה לביצוע משאלה', en: 'Offer to fulfill your wish', ar: 'عرض لتنفيذ أمنيتك' },
    concierge: { he: 'קונסירג׳', en: 'Concierge', ar: 'كونسيرج' },
    offeredBy: { he: 'הציע/ה לעזור', en: 'Offered to help', ar: 'عرض المساعدة' },
    forNeed: { he: 'עבור הצורך', en: 'For the need', ar: 'للحاجة' },
    hours: { he: 'שעות', en: 'Hours', ar: 'ساعات' },
    price: { he: 'מחיר', en: 'Price', ar: 'السعر' },
    byOffer: { he: 'בהצעה', en: 'By offer', ar: 'بالعرض' },
    chat: { he: 'צ׳אט תיאום', en: 'Coordination chat', ar: 'دردشة التنسيق' },
    accept: { he: 'אישור', en: 'Accept', ar: 'قبول' },
    reject: { he: 'דחייה', en: 'Reject', ar: 'رفض' },
    processing: { he: 'מעבד...', en: 'Processing...', ar: 'جاري المعالجة...' },
    accepted: { he: 'המתנדב/ת אושר/ה 💗', en: 'Volunteer accepted 💗', ar: 'تم قبول المتطوع 💗' },
    rejected: { he: 'ההצעה נדחתה', en: 'Offer rejected', ar: 'تم رفض العرض' },
    error: { he: 'שגיאה בביצוע הפעולה', en: 'Action failed', ar: 'فشل الإجراء' }
  };

  let isProcessing = $state(false);
  let isOpeningChat = $state(false);

  const CONCIERGE_LOGO = '/logo-concierge.png';

  function initials(name: string): string {
    const parts = String(name || '')
      .trim()
      .split(/\s+/);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).slice(0, 2) || '🤍';
  }

  // The wishoffer card only ever renders for the wish owner, so the concierge
  // header/logo navigates the owner to the wish's concierge dashboard.
  function goToWish() {
    if (buble.ratsonId) goto(`/concierge/${buble.ratsonId}`);
  }

  function showVolunteer(e: Event) {
    e.stopPropagation();
    if (buble.volunteerId) onUser?.({ id: buble.volunteerId });
  }

  function dropOffer() {
    // The lev feed is store-driven — remove this offer so the card disappears.
    wishOffersStore.update((curr) => curr.filter((o) => String(o.id) !== String(buble.id)));
  }

  async function openChat() {
    if (isOpeningChat) return;
    // Reuse an already-linked forum; otherwise create one lazily.
    if (buble.forumId) {
      onChat?.({ forumId: String(buble.forumId) });
      return;
    }
    isOpeningChat = true;
    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'ensureRatsonProposalForum',
          params: { ratsonId: String(buble.ratsonId), proposalId: String(buble.id) }
        })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed');
      const newForumId = result.data?.forumId;
      if (!newForumId) throw new Error('No forum id');
      buble.forumId = newForumId;
      onChat?.({ forumId: String(newForumId) });
    } catch (err) {
      console.error(err);
      toast.error(t.error[$lang]);
    } finally {
      isOpeningChat = false;
    }
  }

  async function handleAction(action: 'accept' | 'reject') {
    if (isProcessing) return;
    isProcessing = true;
    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: action === 'accept' ? 'acceptRatsonProposal' : 'rejectRatsonProposal',
          params: {
            proposalId: String(buble.id),
            ratsonId: String(buble.ratsonId)
          }
        })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed');

      toast.success(action === 'accept' ? t.accepted[$lang] : t.rejected[$lang]);
      dropOffer();
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
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="{isMobileOrTablet()
    ? 'w-full h-full'
    : 'w-[90%] h-[90%]'} lg:w-[90%] flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden transition-all duration-300 relative {isFirst
    ? 'shadow-glow border-glow'
    : 'shadow-lg border border-gray-100 dark:border-gray-700'}"
  style:--glow-rgb="238, 232, 170"
>
  <!-- Gold header, concierge-branded (logo + name), like every other card -->
  <CardHeader
    logoSrc={CONCIERGE_LOGO}
    projectName={t.concierge[$lang]}
    cardType={t.cardType[$lang]}
    cardTitle={buble.ratsonName || '—'}
    glowColor="gold"
    onProjectClick={goToWish}
  />

  <div
    class="d {isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-50 dark:bg-slate-700/50'} transition-all duration-300 p-5 flex-1 overflow-y-auto space-y-5 text-gray-800 dark:text-gray-100"
  >
    <!-- The volunteer — clicking opens the user modal (cards `onUser`) -->
    <button
      type="button"
      class="flex items-center gap-3 w-full text-start bg-transparent border-0 p-0 m-0 cursor-pointer group"
      onclick={showVolunteer}
    >
      {#if buble.volunteerSrc}
        <img class="avatar" src={buble.volunteerSrc} alt={buble.volunteerName} />
      {:else}
        <span class="avatar fallback">{initials(buble.volunteerName)}</span>
      {/if}
      <div class="min-w-0">
        <div class="text-xs text-gray-500 dark:text-gray-400">{t.offeredBy[$lang]}</div>
        <div class="text-base font-bold text-gray-800 dark:text-gray-100 group-hover:text-barbi">
          {buble.volunteerName || '—'}
        </div>
      </div>
    </button>

    {#if buble.ratsonDesc}
      <div class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
        {buble.ratsonDesc}
      </div>
    {/if}

    <!-- The offered need -->
    <div class="rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 p-3">
      <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.forNeed[$lang]}</div>
      <div class="text-base font-bold text-yellow-700 dark:text-yellow-400">{buble.missionName || '—'}</div>
    </div>

    <!-- Terms -->
    <div class="flex gap-4 border-t border-gray-200 dark:border-slate-600 pt-4">
      {#if buble.hours != null}
        <div class="flex-1">
          <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">{t.hours[$lang]}</div>
          <div class="text-base font-bold">{buble.hours}</div>
        </div>
      {/if}
      <div class="flex-1">
        <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">{t.price[$lang]}</div>
        <div class="text-base font-bold text-yellow-700 dark:text-yellow-400">
          {buble.price != null ? `₪ ${Number(buble.price).toLocaleString()}` : t.byOffer[$lang]}
        </div>
      </div>
    </div>
  </div>

  <!-- Footer actions -->
  <div class="p-4 bg-gray-50 dark:bg-gray-900/80 flex gap-3 border-t border-gray-100 dark:border-gray-800">
    <button
      type="button"
      class="flex-1 py-3 bg-white dark:bg-gray-800 border-2 border-blue-400 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold rounded-xl transition-all disabled:opacity-50"
      onclick={(e) => {
        e.stopPropagation();
        openChat();
      }}
      disabled={isOpeningChat}
    >
      {isOpeningChat ? t.processing[$lang] : t.chat[$lang]}
    </button>
    <button
      type="button"
      class="flex-1 py-3 bg-white dark:bg-gray-800 border-2 border-red-400 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-xl transition-all disabled:opacity-50"
      onclick={(e) => {
        e.stopPropagation();
        handleAction('reject');
      }}
      disabled={isProcessing}
    >
      {isProcessing ? t.processing[$lang] : t.reject[$lang]}
    </button>
    <button
      type="button"
      class="flex-2 py-3 bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
      style="flex: 2;"
      onclick={(e) => {
        e.stopPropagation();
        handleAction('accept');
      }}
      disabled={isProcessing}
    >
      {isProcessing ? t.processing[$lang] : t.accept[$lang]}
    </button>
  </div>
</div>

<style>
  .flex-2 {
    flex: 2;
  }
  .avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(238, 232, 170, 0.5);
    flex-shrink: 0;
  }
  .avatar.fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, #ff4d9e, #c8155f);
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
      0 0 20px rgba(var(--glow-rgb), 0.4),
      0 0 40px rgba(var(--glow-rgb), 0.3),
      0 0 0 1px rgba(var(--glow-rgb), 0.3);
  }
</style>
