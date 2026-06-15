<script>
  /**
   * SiteSharePayCard — the swiper-card form of a single committed-but-unpaid
   * site-share contribution (PLAN_SITE_SHARE_PER_MEMBER §5, M4).
   *
   * Replaces the old top-of-page banner: each payable is now a full card in the
   * /lev swiper. The member picks a volunteer receiver in the platform rikma and
   * sends their transfer (never a hardcoded treasury user). On success the
   * payable is removed from `siteSharePayablesStore`, so this card disappears.
   *
   * 0/skip never reaches here — the loader only emits `decided & amount>0`
   * contributions with no existing transfer.
   */
  import { lang } from '$lib/stores/lang.js';
  import { executeAction } from '$lib/client/actionClient';
  import { siteSharePayablesStore } from '$lib/stores/levStores';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { toast } from 'svelte-sonner';
  import CardHeader from './CardHeader.svelte';

  let { buble, isFirst = false, onProj } = $props();

  const isHe = $derived($lang === 'he');

  let busy = $state(false);
  // null = "use the default" (first volunteer); set on radio change.
  let chosen = $state(null);
  const selected = $derived(
    chosen != null
      ? chosen
      : buble?.volunteers?.length
        ? String(buble.volunteers[0].id)
        : null
  );

  function handleProjectClick() {
    if (onProj && buble.projectId) {
      onProj({ id: buble.projectId });
    }
  }

  async function pay() {
    if (busy || !selected) return;
    busy = true;
    try {
      const res = await executeAction('createSiteShareTransfer', {
        contributionId: String(buble.contributionId),
        projectId: String(buble.projectId),
        receiverId: String(selected)
      });
      if (res?.success) {
        toast.success(isHe ? 'ההעברה נשלחה 💗' : 'Transfer sent 💗');
        // Drop this payable from the feed — the card disappears.
        siteSharePayablesStore.update((list) =>
          list.filter((p) => p.contributionId !== buble.contributionId)
        );
      } else {
        console.error('[SiteShare] transfer failed:', res?.error);
        toast.error(isHe ? 'שליחת ההעברה נכשלה' : 'Transfer failed');
      }
    } catch (e) {
      console.error('[SiteShare] transfer error:', e);
      toast.error(isHe ? 'שגיאה בשליחת ההעברה' : 'Transfer error');
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
    logoSrc={buble.rikmaLogo || buble.src}
    projectName={buble.rikmaName || buble.projectName}
    cardType={isHe ? 'נתינה ל‑1💗1' : 'GIVE TO 1💗1'}
    cardTitle={`${Number(buble.amount).toFixed(2)} ₪`}
    glowColor="gold"
    onProjectClick={handleProjectClick}
  />

  <!-- Content -->
  <div
    class="{isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-200 dark:bg-slate-700'} transition-all-300 p-4 flex-1 overflow-y-auto flex flex-col gap-4"
  >
    <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
      {isHe
        ? 'התחייבת לתת ל‑1💗1 מהחלוקה הזו. בחר/י מי מקבל/ת את הנתינה ושלח/י את ההעברה.'
        : 'You committed to give 1💗1 from this split. Pick who receives it and send the transfer.'}
    </p>

    {#if !buble.volunteers || buble.volunteers.length === 0}
      <div
        class="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-200"
      >
        {isHe
          ? 'אין עדיין מי שהתנדב/ה לקבל ב‑1💗1. ההעברה תיפתח כשמתנדב/ת ייקבע/תיקבע.'
          : 'No 1💗1 member has volunteered to receive yet. The transfer opens once someone does.'}
      </div>
    {:else}
      <div>
        <div
          class="text-[11px] uppercase font-bold text-gold mb-2 dark:text-[var(--gold-l)]"
        >
          {isHe ? 'בחר/י מקבל/ת' : 'Pick a receiver'}
        </div>
        <div class="flex flex-wrap gap-2">
          {#each buble.volunteers as v (v.id)}
            <label
              class="flex items-center gap-2 cursor-pointer rounded-full border px-3 py-1.5 transition-colors
                {String(selected) === String(v.id)
                ? 'border-gold bg-gold/15'
                : 'border-gray-300 dark:border-gray-600'}"
            >
              <input
                class="accent-[var(--gold)]"
                type="radio"
                name={`vol-${buble.contributionId}`}
                checked={String(selected) === String(v.id)}
                onchange={() => (chosen = String(v.id))}
                disabled={busy}
              />
              {#if v.profilePic}
                <img
                  src={v.profilePic}
                  alt={v.username}
                  class="w-6 h-6 rounded-full object-cover"
                />
              {/if}
              <span class="text-sm text-gray-800 dark:text-gray-200"
                >{v.username || '?'}</span
              >
            </label>
          {/each}
        </div>
      </div>

      <button
        type="button"
        class="mt-auto self-stretch sm:self-start px-6 py-2.5 rounded-full font-bold text-gray-900 bg-gold hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition"
        onclick={(e) => {
          e.stopPropagation();
          pay();
        }}
        disabled={busy || !selected}
      >
        {busy
          ? isHe
            ? 'שולח…'
            : 'Sending…'
          : isHe
            ? 'שליחת ההעברה'
            : 'Send transfer'}
      </button>
    {/if}
  </div>
</div>

<style>
  .bg-gold {
    background: var(--gold, #c9a227);
  }
  .text-gold {
    color: var(--gold, #c9a227);
  }
  .border-gold {
    border-color: var(--gold, #c9a227);
  }
</style>
