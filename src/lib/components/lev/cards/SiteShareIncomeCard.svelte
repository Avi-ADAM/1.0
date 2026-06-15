<script lang="ts">
  /**
   * SiteShareIncomeCard — the platform-rikma RECEIVING side of a site-share
   * contribution (PLAN_SITE_SHARE_PER_MEMBER §10.2; SITE_SHARE_TRANSFER_SPEC §5).
   *
   * This is the income Sheirut (`isSiteShareIncome:true`) seen by main-platform
   * members. Unlike a normal SaleCard there is NO physical product and NO
   * delivery-approval (`weFinnish`) step — the "product" is consumption of the
   * site's service. The only thing to settle is the money:
   *
   *   1. A platform member volunteers to receive (`iCanGetMonay` ↔ toggleMoneyReceiver).
   *   2. Each contributing member's transfer (giver → chosen volunteer) is confirmed
   *      both-sides via SheirutHalukaCard (sender "I sent", receiver "I received").
   *
   * When a transfer is confirmed both-sides the money is recorded as held by the
   * receiver (haluka.confirmed) — the basis for internal income distribution.
   */
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import CardHeader from './CardHeader.svelte';
  import SheirutHalukaCard from './SheirutHalukaCard.svelte';

  let { buble, isFirst = false, onProj } = $props();

  const isHe = $derived($lang === 'he');

  function handleProjectClick() {
    if (onProj && buble.projectId) {
      onProj({ id: buble.projectId });
    }
  }

  let isTogglingReceiver = $state(false);

  const moneyReceivers = $derived(
    Array.isArray(buble.iCanGetMonay) ? buble.iCanGetMonay : []
  );
  const iAmReceiver = $derived(
    moneyReceivers.some((u: any) => String(u.id) === String(buble.myid))
  );

  // Transfers that are still open (not yet both-sides confirmed) vs. settled.
  const transfers = $derived(
    Array.isArray(buble.transferHalukas) ? buble.transferHalukas : []
  );
  const settledCount = $derived(
    transfers.filter((h: any) => h.senderconf && h.confirmed).length
  );

  async function handleToggleReceiver() {
    if (isTogglingReceiver) return;
    isTogglingReceiver = true;
    const action = iAmReceiver ? 'remove' : 'add';
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'toggleMoneyReceiver',
          params: { id: buble.id, projectId: buble.projectId, action }
        })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed');

      if (action === 'add') {
        buble.iCanGetMonay = [
          ...moneyReceivers,
          {
            id: buble.myid,
            username: buble.myUsername || '?',
            profilePic: buble.myProfilePic
          }
        ];
      } else {
        buble.iCanGetMonay = moneyReceivers.filter(
          (u: any) => String(u.id) !== String(buble.myid)
        );
      }
      toast.success(
        action === 'add'
          ? $t('lev.cards.saleCard.addMeReceiver')
          : $t('lev.cards.saleCard.removeMeReceiver')
      );
    } catch (err) {
      console.error(err);
      toast.error($t('lev.cards.saleCard.operationError'));
    } finally {
      isTogglingReceiver = false;
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
    logoSrc={buble.projectSrc}
    projectName={buble.projectName}
    cardType={isHe ? 'הכנסת חלק האתר' : 'SITE SHARE INCOME'}
    cardTitle={buble.name}
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
        ? 'זוהי הכנסת חלק האתר מחברי רקמה שהשתמשו בשירות. אין כאן מוצר או אישור משלוח — רק לוודא שמישהו מתנדב לקבל את הכסף, ושהנותן והמקבל אישרו שהכסף עבר.'
        : "This is site-share income from a rikma's members. There's no product or delivery step — just make sure someone volunteers to receive, and that giver and receiver confirm the money moved."}
    </p>

    <!-- Description -->
    {#if buble.descrip}
      <div
        class="text-sm text-gray-600 dark:text-gray-400 italic bg-gray-50/50 dark:bg-gray-900/20 p-2 rounded-lg"
      >
        <RichText outpot={buble.descrip} editable={false} />
      </div>
    {/if}

    <!-- Total expected -->
    <div
      class="bg-gradient-to-r from-amber-500/5 to-yellow-500/5 p-3 rounded-lg border border-amber-500/20"
    >
      <span class="text-amber-700 dark:text-amber-300 block text-[10px] uppercase font-bold">
        {isHe ? 'סך ההכנסה' : 'Total income'}
      </span>
      <div class="flex items-center gap-2">
        <img
          src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
          alt="money"
          class="w-6 h-6"
        />
        <span class="text-xl font-black text-amber-700 dark:text-amber-300"
          >{buble.total || buble.price}</span
        >
      </div>
    </div>

    <!-- Step 1: money-receiver volunteers -->
    <div
      class="rounded-xl border overflow-hidden"
      class:border-red-200={moneyReceivers.length === 0}
      class:dark:border-red-800={moneyReceivers.length === 0}
      class:border-yellow-200={moneyReceivers.length > 0}
      class:dark:border-yellow-700={moneyReceivers.length > 0}
    >
      <div
        class="text-[10px] font-semibold uppercase px-3 pt-2 pb-1"
        class:text-red-600={moneyReceivers.length === 0}
        class:dark:text-red-400={moneyReceivers.length === 0}
        class:text-yellow-700={moneyReceivers.length > 0}
        class:dark:text-yellow-400={moneyReceivers.length > 0}
      >
        {$t('lev.cards.saleCard.moneyReceivers')}
      </div>

      {#if moneyReceivers.length === 0}
        <div class="bg-red-50 dark:bg-red-900/10 p-3">
          <p class="font-bold text-red-700 dark:text-red-300 text-sm">
            {$t('lev.cards.saleCard.addReceiver')}
          </p>
          <p class="text-xs text-red-600 dark:text-red-400 mt-1">
            {$t('lev.cards.saleCard.addReceiverHint')}
          </p>
          <button
            class="mt-3 w-full py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-all disabled:opacity-50"
            onclick={(e) => {
              e.stopPropagation();
              handleToggleReceiver();
            }}
            disabled={isTogglingReceiver}
          >
            {isTogglingReceiver
              ? $t('lev.cards.saleCard.processing')
              : $t('lev.cards.saleCard.addMeReceiver')}
          </button>
        </div>
      {:else}
        <div class="bg-yellow-50 dark:bg-yellow-900/10 p-3 space-y-2">
          {#each moneyReceivers as u (u.id)}
            <div class="flex items-center gap-2">
              {#if u.profilePic}
                <img
                  src={u.profilePic}
                  alt={u.username}
                  class="w-8 h-8 rounded-full object-cover border border-yellow-300"
                />
              {:else}
                <div
                  class="w-8 h-8 rounded-full bg-yellow-200 dark:bg-yellow-800 flex items-center justify-center text-yellow-700 dark:text-yellow-300 font-bold text-xs"
                >
                  {u.username?.charAt(0)}
                </div>
              {/if}
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-200"
                >{u.username}</span
              >
              {#if String(u.id) === String(buble.myid)}
                <span
                  class="mr-auto text-[9px] bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full font-bold"
                  >{isHe ? 'אתה' : 'You'}</span
                >
              {/if}
            </div>
          {/each}

          {#if iAmReceiver}
            <button
              class="w-full py-1.5 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50 mt-1"
              onclick={(e) => {
                e.stopPropagation();
                handleToggleReceiver();
              }}
              disabled={isTogglingReceiver}
            >
              {isTogglingReceiver
                ? $t('lev.cards.saleCard.processing')
                : $t('lev.cards.saleCard.removeMeReceiver')}
            </button>
          {:else}
            <button
              class="w-full py-1.5 rounded-lg border border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 text-xs font-semibold hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-all disabled:opacity-50 mt-1"
              onclick={(e) => {
                e.stopPropagation();
                handleToggleReceiver();
              }}
              disabled={isTogglingReceiver}
            >
              {isTogglingReceiver
                ? $t('lev.cards.saleCard.processing')
                : $t('lev.cards.saleCard.addMeReceiver')}
            </button>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Step 2: per-member transfer confirmations (giver → volunteer) -->
    {#if transfers.length > 0}
      <div class="flex flex-col gap-2">
        <div
          class="flex items-center justify-between text-[11px] uppercase font-bold text-amber-700 dark:text-[var(--gold-l,#e6d27a)]"
        >
          <span>{isHe ? 'העברות מהחברים' : 'Member transfers'}</span>
          <span class="text-gray-500 dark:text-gray-400 normal-case font-semibold">
            {settledCount}/{transfers.length} {isHe ? 'הושלמו' : 'complete'}
          </span>
        </div>
        {#each transfers as h (h.id)}
          <SheirutHalukaCard
            halukaId={h.id}
            senderId={h.sender?.id ?? ''}
            receiverId={h.receiver?.id ?? ''}
            senderName={h.sender?.username ?? ''}
            receiverName={h.receiver?.username ?? ''}
            senderPic={h.sender?.profilePic}
            receiverPic={h.receiver?.profilePic}
            amount={h.amount}
            forumId={h.forumId}
            senderconf={h.senderconf}
            confirmed={h.confirmed}
            myId={String(buble.myid)}
            projectId={String(buble.projectId)}
          />
        {/each}
      </div>
    {:else}
      <div
        class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 p-3 text-sm text-gray-600 dark:text-gray-400"
      >
        {isHe
          ? 'עדיין לא נשלחו העברות מהחברים. ההעברות יופיעו כאן ברגע שחבר נותן בוחר מקבל ושולח.'
          : 'No member transfers yet. They appear here once a giving member picks a receiver and sends.'}
      </div>
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
