<script lang="ts">
  /**
   * SiteShareAutoApprovedCard — the swiper-card form of an OPEN (pending)
   * site-share decision whose split has ALREADY auto-approved (by time) and is
   * therefore no longer shown as a haluka card (PLAN_SITE_SHARE_PER_MEMBER §3,
   * gate 3). Replaces the old top-of-page reminder banner.
   *
   * It explains that the split already closed automatically, then asks the member
   * to ratify their personal giving to 1💗1 via the SAME shared SiteShareDecision
   * component used in every other gate. On decide the contribution closes and the
   * card removes itself from `openSiteShareDecisionsStore`.
   */
  import { lang } from '$lib/stores/lang.js';
  import { executeAction } from '$lib/client/actionClient';
  import { openSiteShareDecisionsStore } from '$lib/stores/levStores';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { toast } from 'svelte-sonner';
  import CardHeader from './CardHeader.svelte';
  import SiteShareDecision from '$lib/components/revenue/SiteShareDecision.svelte';

  let { buble, isFirst = false, onProj } = $props();

  const isHe = $derived($lang === 'he');

  let busy = $state(false);

  function handleProjectClick() {
    if (onProj && buble.projectId) {
      onProj({ id: buble.projectId });
    }
  }

  async function onDecide(payload: any) {
    if (busy) return;
    busy = true;
    try {
      const res = await executeAction('decideSiteShare', {
        tosplitId: String(buble.tosplitId),
        projectId: String(buble.projectId),
        recive_project: buble.reciveProjectId
          ? String(buble.reciveProjectId)
          : undefined,
        decision: payload.decision,
        amount: payload.amount,
        direction: payload.direction,
        reason: payload.reason,
        proposedAmount: buble.proposedAmount,
        basisAmount: buble.basisAmount
      });
      if (res?.success) {
        toast.success(isHe ? 'נרשם 💗' : 'Saved 💗');
        // Decision closed — drop this card from the feed.
        openSiteShareDecisionsStore.update((list) =>
          list.filter((d) => d.contributionId !== buble.contributionId)
        );
      } else {
        console.error('[SiteShare] decide (auto-approved) failed:', res?.error);
        toast.error(isHe ? 'השמירה נכשלה' : 'Save failed');
      }
    } catch (e) {
      console.error('[SiteShare] decide (auto-approved) error:', e);
      toast.error(isHe ? 'שגיאה בשמירה' : 'Save error');
    } finally {
      busy = false;
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
  dir={isHe ? 'rtl' : 'ltr'}
  style="overflow-y:auto"
  class="{isMobileOrTablet()
    ? 'w-full h-full'
    : ' w-[90%] h-[90%]'}  lg:w-[90%] {isFirst
    ? isHe
      ? 'boxleft'
      : 'boxright'
    : ''} flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden {isScrolable.value
    ? 'shadow-glow border-glow'
    : 'shadow-lg border border-gray-100 dark:border-gray-700'} transition-all duration-300 relative"
  style:--glow-rgb="238, 232, 170"
>
  <!-- Header -->
  <CardHeader
    logoSrc={buble.projectLogo || buble.src}
    projectName={buble.projectName}
    cardType={isHe ? 'אשרור נתינה ל‑1💗1' : 'CONFIRM 1💗1 GIVING'}
    cardTitle={`${Number(buble.proposedAmount || 0).toFixed(2)} ₪`}
    glowColor="gold"
    onProjectClick={handleProjectClick}
  />

  <!-- Content -->
  <div
    class="{isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-200 dark:bg-slate-700'} transition-all-300 p-4 flex-1 overflow-y-auto flex flex-col gap-4"
  >
    <!-- Already auto-approved notice -->
    <div
      class="rounded-xl border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-3 flex items-start gap-2"
    >
      <span class="text-green-600 dark:text-green-400 text-lg leading-none">✓</span>
      <p class="text-sm text-green-800 dark:text-green-200 leading-relaxed">
        {isHe
          ? 'החלוקה הזו כבר אושרה אוטומטית והסתיימה. לא חסמת אותה — נותר רק לאשרר את הנתינה האישית שלך ל‑1💗1.'
          : 'This split already auto-approved and closed. You did not block it — all that is left is to confirm your personal giving to 1💗1.'}
      </p>
    </div>

    <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
      {isHe
        ? 'בחר/י כמה לתת ל‑1💗1 מהחלק האישי שלך בחלוקה הזו, או דלג/י הפעם. זה לא משפיע על מה שהשותפים חילקו.'
        : "Choose how much to give 1💗1 from your personal share of this split, or skip this time. It doesn't affect what the partners split."}
    </p>

    <!-- Shared decision UI (same as every other gate) -->
    <SiteShareDecision
      proposed={buble.proposedAmount}
      basis={buble.basisAmount}
      initial={null}
      {busy}
      onDecide={(payload) => onDecide(payload)}
    />
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
