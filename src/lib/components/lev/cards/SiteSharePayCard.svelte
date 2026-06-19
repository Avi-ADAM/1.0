<script>
  import { t, isRtl } from '$lib/translations';
  /**
   * SiteSharePayCard — the swiper-card form of a single committed-but-unpaid
   * site-share contribution (PLAN_SITE_SHARE_PER_MEMBER §5, M4).
   *
   * Replaces the old top-of-page banner: each payable is a full card in the
   * /lev swiper. There is NO in-site money mechanism — the card just records the
   * obligation via a personal transfer Haluka (giver → a chosen 1💗1 volunteer)
   * and tracks it with the shared `SheirutHalukaCard`: two buttons only —
   * open the coordination chat (haluka → forum) and confirm "I sent". It
   * completes when the receiver confirms too.
   *
   * The Haluka is created LAZILY on the first button press (SheirutHalukaCard's
   * `onEnsureHaluka` hook), so there is no meaningless standalone "send" step.
   * The receiver may be the giver themselves if they're also a member of the
   * platform rikma — it's recorded like a sale, settled internally later.
   *
   * 0/skip never reaches here — the loader only emits `decided & amount>0`
   * contributions whose transfer (if any) is not yet settled.
   */

  import { executeAction } from '$lib/client/actionClient';
  import { userStore, siteSharePayablesStore } from '$lib/stores/levStores';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { toast } from 'svelte-sonner';
  import CardHeader from './CardHeader.svelte';
  import SheirutHalukaCard from './SheirutHalukaCard.svelte';

  let { buble, isFirst = false, onProj } = $props();


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

  const hasTransfer = $derived(!!buble.halukaId);
  const myId = $derived(String($userStore?.id ?? ''));

  // The receiver shown in the confirmation card: the locked one once the
  // transfer exists, otherwise the currently-picked volunteer.
  const selectedVol = $derived(
    (buble.volunteers ?? []).find((v) => String(v.id) === String(selected)) ?? null
  );
  const receiver = $derived(buble.receiver ?? selectedVol);

  // Both sides confirmed → the transfer is done. The income Sale is recorded
  // server-side (confirmSheirutHaluka). Here we just retire the card from the
  // feed so it isn't shown as outstanding anymore.
  function handleComplete() {
    toast.success($t('lev.revenue.siteSharePayCard.done'));
    siteSharePayablesStore.update((list) =>
      list.filter((p) => p.contributionId !== buble.contributionId)
    );
  }

  function handleProjectClick() {
    if (onProj && buble.projectId) {
      onProj({ id: buble.projectId });
    }
  }

  function transferErrorMessage(code) {
    switch (code) {
      case 'invalid_receiver': return $t('lev.revenue.siteSharePayCard.errInvalidReceiver');
      case 'no_transfer_for_zero_or_skip': return $t('lev.revenue.siteSharePayCard.errZeroSkip');
      case 'not_contribution_owner': return $t('lev.revenue.siteSharePayCard.errNotOwner');
      default: return $t('lev.revenue.siteSharePayCard.errOpen');
    }
  }

  /**
   * Lazy-create the personal transfer Haluka the first time the giver acts
   * (open chat / confirm sent). Idempotent server-side. Returns the haluka id,
   * or null on failure (a toast is shown). Passed to SheirutHalukaCard as
   * `onEnsureHaluka`.
   */
  async function ensureTransfer() {
    if (buble.halukaId) return String(buble.halukaId);
    if (!selected) {
      toast.error(transferErrorMessage('invalid_receiver'));
      return null;
    }
    busy = true;
    try {
      const res = await executeAction('createSiteShareTransfer', {
        contributionId: String(buble.contributionId),
        projectId: String(buble.projectId),
        receiverId: String(selected)
      });
      // executeAction returns the API wrapper { success, data }; the handler's
      // own result (success/halukaId/error) lives under res.data.
      const out = res?.data ?? {};
      if (out.success && out.halukaId) {
        const vol = selectedVol;
        buble.halukaId = String(out.halukaId);
        buble.receiver = vol
          ? { id: String(vol.id), username: vol.username, profilePic: vol.profilePic }
          : { id: String(selected), username: '', profilePic: null };
        buble.transferSenderconf = false;
        buble.transferConfirmed = false;
        buble.transferForumId = null;
        return String(out.halukaId);
      }
      const code = out.error ?? res?.error?.message;
      console.error('[SiteShare] open transfer failed:', code);
      toast.error(transferErrorMessage(code));
      return null;
    } catch (e) {
      console.error('[SiteShare] open transfer error:', e);
      toast.error($t('lev.revenue.siteSharePayCard.errNet'));
      return null;
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
  dir={$isRtl ? 'rtl' : 'ltr'}
  style="overflow-y:auto"
  class="{isMobileOrTablet()
    ? 'w-full h-full'
    : ' w-[90%] h-[90%]'}  lg:w-[90%] {isFirst
    ? $isRtl
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
    cardType={$t('lev.revenue.siteSharePayCard.cardType')}
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
    <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{$t('lev.revenue.siteSharePayCard.body')}</p>

    {#if !buble.volunteers || buble.volunteers.length === 0}
      <div
        class="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-200"
      >
        {$t('lev.revenue.siteSharePayCard.noVol')}
      </div>
    {:else}
      <!-- Receiver picker — only until the transfer is locked in. -->
      {#if !hasTransfer && buble.volunteers.length > 1}
        <div>
          <div
            class="text-[11px] uppercase font-bold text-gold mb-2 dark:text-[var(--gold-l)]"
          >
            {$t('lev.revenue.siteSharePayCard.pickReceiver')}
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
      {/if}

      <!-- Both-sides confirmation flow: open chat (haluka → forum) + confirm
           "I sent". The Haluka is created lazily on the first press. -->
      <SheirutHalukaCard
        halukaId={buble.halukaId ? String(buble.halukaId) : ''}
        senderId={myId}
        receiverId={String(receiver?.id ?? '')}
        senderName={$userStore?.username ?? ''}
        receiverName={receiver?.username ?? ''}
        senderPic={$userStore?.profilePic ?? ''}
        receiverPic={receiver?.profilePic ?? ''}
        amount={buble.amount}
        bind:forumId={buble.transferForumId}
        bind:senderconf={buble.transferSenderconf}
        bind:confirmed={buble.transferConfirmed}
        {myId}
        projectId={String(buble.projectId)}
        onEnsureHaluka={ensureTransfer}
        oncomplete={handleComplete}
      />
    {/if}
  </div>
</div>

<style>
  .text-gold {
    color: var(--gold, #c9a227);
  }
  .border-gold {
    border-color: var(--gold, #c9a227);
  }
</style>
