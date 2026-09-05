<script>
  /**
   * "The cycle closed: 42 hours × ₪50 = ₪2,100 — pay" (PLAN_STIPEND §6, §8).
   *
   * The funder confirms a **derived** number. There is no amount field, on
   * purpose: a hand-typed figure would separate the money book from the equity
   * book within two cycles. The hours behind it are approved hours only — a
   * finiapruval that later gets refused must never have been paid for.
   *
   * Pressing pay asks one question first — **have you already transferred it?**
   * Closing the cycle and moving the money are two different acts, and the card
   * used to fuse them: it wrote `senderconf: true` on the funder's behalf and
   * started the recipient's silence clock, so money nobody had sent could be
   * confirmed by nobody answering.
   *
   *   yes → the Haluka is marked sent and the recipient gets the "did it
   *         arrive?" card, exactly as before.
   *   not yet → the cycle is settled at the derived amount as `pending`, and
   *         both sides get a transfer card with a chat to arrange it in. No
   *         clock runs until the funder says the money went out.
   */
  import { t, isRtl } from '$lib/translations';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { stipendPayablesStore, stipendTransfersStore, userStore } from '$lib/stores/levStores';
  import CardHeader from './CardHeader.svelte';
  import CycleFacts from '$lib/components/stipend/CycleFacts.svelte';

  let { buble, isFirst = false, onProj, onDone } = $props();

  let busy = $state(false);
  /** The "did you already transfer it?" step, between the button and the write. */
  let asking = $state(false);

  function handleProjectClick() {
    if (onProj && buble.projectId) onProj({ id: buble.projectId });
  }

  /** @param {boolean} transferred */
  async function pay(transferred) {
    if (busy) return;
    busy = true;
    try {
      const res = await executeAction('settleStipendCycle', {
        pledgeId: String(buble.pledgeId),
        transferred
      });
      if (res?.success === false) throw new Error(actionErrorText(res, $t('stipend.toast.error')));
      if (res?.data?.settled === false) {
        toast($t('stipend.pay.nothingThisCycle'));
      } else if (transferred) {
        toast.success($t('stipend.pay.sent'));
      } else {
        toast.success($t('stipend.transfer.opened'));
        // Put the transfer card in front of them now rather than on the next
        // load: "there will be a card for this" is a promise the heart can keep
        // immediately, and the chat is the whole point of answering "not yet".
        const d = res?.data ?? {};
        if (d.paymentId) {
          stipendTransfersStore.update((list) => [
            {
              paymentId: String(d.paymentId),
              pledgeId: String(buble.pledgeId),
              projectId: buble.projectId ?? null,
              projectName: buble.projectName ?? '',
              side: 'funder',
              funderId: $userStore?.id ? String($userStore.id) : null,
              funderName: $userStore?.username ?? '',
              funderPic: $userStore?.profilePic ?? null,
              recipientId: buble.recipientId ?? null,
              recipientName: buble.recipientName ?? '',
              recipientPic: buble.recipientPic ?? null,
              amount: Number(d.amount ?? buble.amount) || 0,
              hours: Number(d.hours ?? buble.hours) || 0,
              stipendRate: Number(buble.stipendRate) || 0,
              mode: buble.mode ?? 'equity',
              cycleStart: d.cycleStart ?? buble.cycleStart ?? null,
              cycleEnd: d.cycleEnd ?? buble.cycleEnd ?? null,
              halukaId: d.halukaId ? String(d.halukaId) : null,
              forumId: d.forumId ? String(d.forumId) : null,
              senderconf: false,
              confirmed: false,
              missionNames: buble.missionNames ?? [],
              missions: buble.missions ?? [],
              equityCredit: Number(d.equityCredit) || 0,
              equityDebit: Number(d.equityDebit) || 0,
              src: buble.src
            },
            ...list.filter((tr) => String(tr.paymentId) !== String(d.paymentId))
          ]);
        }
      }
      stipendPayablesStore.update((list) =>
        list.filter((p) => String(p.pledgeId) !== String(buble.pledgeId))
      );
      onDone?.();
    } catch (e) {
      console.error('[StipendPayCard] settle failed:', e);
      toast.error(e instanceof Error ? e.message : $t('stipend.toast.error'));
    } finally {
      busy = false;
      asking = false;
    }
  }
</script>

<div
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="{isMobileOrTablet()
    ? 'w-full h-full'
    : 'w-[90%] h-[90%]'} lg:w-[90%] {isFirst
    ? $isRtl
      ? 'boxleft'
      : 'boxright'
    : ''} flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden {isFirst
    ? 'shadow-glow border-glow'
    : 'shadow-lg border border-gray-100 dark:border-gray-700'} transition-all duration-300 relative"
  style:--glow-rgb="52, 211, 153"
>
  <CardHeader
    logoSrc={buble.src}
    projectName={buble.projectName}
    cardType={$t('stipend.pay.cardType')}
    cardTitle={`₪${Number(buble.amount).toFixed(2)}`}
    glowColor="teal"
    onProjectClick={handleProjectClick}
  />

  <div
    class="bg-white dark:bg-slate-800 transition-all-300 p-4 flex-1 overflow-y-auto flex flex-col gap-4"
  >
    <p class="text-sm text-gray-700 dark:text-gray-300">
      {$t('stipend.pay.body', { name: buble.recipientName })}
    </p>

    <!-- The whole calculation, visible. Nothing here is typed by anyone. -->
    <CycleFacts
      side="funder"
      missionNames={buble.missionNames}
      missions={buble.missions}
      projectId={buble.projectId}
      cycleStart={buble.cycleStart}
      cycleEnd={buble.cycleEnd}
      hours={buble.hours}
      stipendRate={buble.stipendRate}
      amount={buble.amount}
      gross={buble.gross}
      cappedBy={buble.cappedBy}
      exhausts={buble.exhausts}
      mode={buble.mode}
      equityCredit={buble.equityCredit}
      equityDebit={buble.equityDebit}
    />

    <p class="text-xs text-gray-600 dark:text-gray-300">
      {$t(`stipend.pay.modeNote.${buble.mode ?? 'equity'}`)}
    </p>
  </div>

  <div
    class="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-2"
  >
    {#if asking}
      <!-- One question, because "pay" and "paid" are not the same claim. -->
      <p class="text-sm font-bold text-gray-800 dark:text-gray-100">
        {$t('stipend.transfer.ask', { name: buble.recipientName })}
      </p>
      <p class="text-xs text-gray-600 dark:text-gray-300">{$t('stipend.transfer.askNote')}</p>
      <div class="flex gap-2">
        <button
          type="button"
          onclick={() => pay(false)}
          disabled={busy}
          class="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 py-3 text-sm disabled:opacity-60"
        >
          {$t('stipend.transfer.notYet')}
        </button>
        <button
          type="button"
          onclick={() => pay(true)}
          disabled={busy}
          class="flex-[2] rounded-xl bg-barbi text-gold py-3 text-sm font-bold disabled:opacity-60"
        >
          {busy ? $t('stipend.actions.sending') : $t('stipend.transfer.alreadySent')}
        </button>
      </div>
    {:else}
      <button
        type="button"
        onclick={() => (asking = true)}
        disabled={busy}
        class="w-full rounded-xl bg-barbi text-gold py-3 text-sm font-bold disabled:opacity-60"
      >
        {$t('stipend.pay.action')}
      </button>
    {/if}
  </div>
</div>

<style>
  .shadow-glow {
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 0 20px rgba(var(--glow-rgb), 0.4),
      0 0 40px rgba(var(--glow-rgb), 0.3),
      inset 0 0 20px rgba(var(--glow-rgb), 0.05);
  }
  .border-glow {
    border: 2px solid rgba(var(--glow-rgb), 0.5);
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 0 20px rgba(var(--glow-rgb), 0.4),
      0 0 40px rgba(var(--glow-rgb), 0.3),
      inset 0 0 20px rgba(var(--glow-rgb), 0.05),
      0 0 0 1px rgba(var(--glow-rgb), 0.3);
  }
</style>
