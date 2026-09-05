<script>
  /**
   * "The cycle is settled — now move the money" (PLAN_STIPEND §6, §8).
   *
   * Produced by answering **"not yet"** to the pay card's one question. The
   * amount is already fixed at the derived number — approved hours × the
   * pledged rate, capped — so nothing here is negotiable and nothing is typed.
   * What is left is the part the system cannot do: an actual bank transfer
   * between two people who may never have sent each other money before.
   *
   * So both of them get this card, with a chat. The funder's button says the
   * money went out (`markStipendTransferSent`), which is what starts the
   * recipient's confirmation clock; the recipient's says it arrived
   * (`confirmStipendPayment`) — the one write in this whole feature that moves
   * a percentage — and works whether or not the funder ever came back to
   * report it.
   */
  import { t, isRtl } from '$lib/translations';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { userStore, stipendTransfersStore } from '$lib/stores/levStores';
  import CardHeader from './CardHeader.svelte';
  import SheirutHalukaCard from './SheirutHalukaCard.svelte';
  import CycleFacts from '$lib/components/stipend/CycleFacts.svelte';

  let { buble, isFirst = false, onProj, onDone } = $props();

  const myId = $derived(String($userStore?.id ?? ''));
  const isFunder = $derived(buble.side === 'funder');
  const other = $derived(isFunder ? buble.recipientName : buble.funderName);

  function retire() {
    stipendTransfersStore.update((list) =>
      list.filter((tr) => String(tr.paymentId) !== String(buble.paymentId))
    );
    onDone?.();
  }

  /** The funder: the money has now gone out. Starts the recipient's clock. */
  async function markSent() {
    try {
      const res = await executeAction('markStipendTransferSent', {
        paymentId: String(buble.paymentId)
      });
      if (res?.success === false) throw new Error(actionErrorText(res, $t('stipend.toast.error')));
      toast.success($t('stipend.pay.sent'));
      retire();
      return true;
    } catch (e) {
      console.error('[StipendTransferCard] mark sent failed:', e);
      toast.error(e instanceof Error ? e.message : $t('stipend.toast.error'));
      return false;
    }
  }

  /** The recipient: it arrived. The only write that moves a percentage. */
  async function markArrived() {
    try {
      const res = await executeAction('confirmStipendPayment', {
        paymentId: String(buble.paymentId)
      });
      if (res?.success === false) throw new Error(actionErrorText(res, $t('stipend.toast.error')));
      toast.success($t('stipend.confirm.done'));
      retire();
      return true;
    } catch (e) {
      console.error('[StipendTransferCard] confirm failed:', e);
      toast.error(e instanceof Error ? e.message : $t('stipend.toast.error'));
      return false;
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
    cardType={$t('stipend.transfer.cardType')}
    cardTitle={`₪${Number(buble.amount).toFixed(2)}`}
    glowColor="teal"
    onProjectClick={() => onProj?.({ id: buble.projectId })}
  />

  <div
    class="bg-white dark:bg-slate-800 transition-all-300 p-4 flex-1 overflow-y-auto flex flex-col gap-4"
  >
    <p class="text-sm text-gray-700 dark:text-gray-300">
      {isFunder
        ? $t('stipend.transfer.funderBody', { name: other })
        : $t('stipend.transfer.recipientBody', { name: other })}
    </p>

    <!-- The same facts both sides read, from the same component. -->
    <CycleFacts
      side={isFunder ? 'funder' : 'recipient'}
      missionNames={buble.missionNames}
      missions={buble.missions}
      projectId={buble.projectId}
      cycleStart={buble.cycleStart}
      cycleEnd={buble.cycleEnd}
      hours={buble.hours}
      stipendRate={buble.stipendRate}
      amount={buble.amount}
      mode={buble.mode}
      equityCredit={buble.equityCredit}
      equityDebit={buble.equityDebit}
    />

    <!-- Chat + the two confirmations, on the Haluka that carries the money. -->
    <SheirutHalukaCard
      halukaId={buble.halukaId ? String(buble.halukaId) : ''}
      senderId={String(buble.funderId ?? (isFunder ? myId : ''))}
      receiverId={String(buble.recipientId ?? (isFunder ? '' : myId))}
      senderName={buble.funderName ?? ''}
      receiverName={buble.recipientName ?? ''}
      senderPic={buble.funderPic ?? ''}
      receiverPic={buble.recipientPic ?? ''}
      amount={buble.amount}
      bind:forumId={buble.forumId}
      bind:senderconf={buble.senderconf}
      bind:confirmed={buble.confirmed}
      {myId}
      projectId={String(buble.projectId)}
      onSenderConfirm={markSent}
      onReceiverConfirm={markArrived}
      senderLabel={$t('stipend.transfer.iSentIt')}
      receiverLabel={$t('stipend.confirm.action')}
    />

    <p class="text-xs text-gray-600 dark:text-gray-300">
      {$t('stipend.transfer.note')}
    </p>
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
