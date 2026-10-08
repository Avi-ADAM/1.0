<script lang="ts">
  /**
   * The customer's payment for a deal: choose who receives the money from the rikma's
   * receivers (`iCanGetMonay`), confirm, and `createSheirutHaluka` opens the transfer —
   * then follow it on its own haluka until the receiver confirms. One flow, shown both in
   * the lev purchase card and behind the deal page's "next payment" button; whether it is
   * open at all is `paymentState`.
   */
  import { t } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import SheirutHalukaCard from './SheirutHalukaCard.svelte';
  import Money from '$lib/components/money/Money.svelte';
  import { idd } from '$lib/stores/idd.js';
  import { username } from '$lib/stores/pendMisMes.js';
  import { uPic } from '$lib/stores/uPic.js';
  import type { DealDue } from '$lib/sheirut/dealDue';
  import { paymentState } from '$lib/sheirut/paymentState';

  let {
    buble,
    due = null,
    onAskChat,
    onSent = undefined,
    myId = undefined,
    myName = undefined,
    myPic = undefined
  }: {
    /** The deal as `mapSaleData` shapes it; the flow records the transfer on it. */
    buble: any;
    /** What a wish deal owes by its approved hours (C-14); null = paid at its agreed total. */
    due?: DealDue | null;
    /** No receiver chosen in the rikma yet — ask them in the deal's chat. */
    onAskChat: () => void;
    /** After the transfer opened (the deal page reloads its figures). */
    onSent?: () => void;
    myId?: string;
    myName?: string;
    myPic?: string;
  } = $props();

  const meId = $derived(myId ?? String($idd));
  const pay = $derived(paymentState(buble, due));

  let isProcessing = $state(false);
  /** The amount actually transferred — the haluka's own, once there is one. */
  let sentAmount = $state<number | null>(null);

  const halukaAmount = $derived(
    sentAmount ?? buble.transferHalukas?.[0]?.amount ?? buble.total ?? buble.price
  );

  /** The receiver picked, waiting for her "yes" (QA C-22: one tap on a name used to
   *  open the transfer at once, with no amount shown and no way back). */
  let pendingReceiver = $state<any>(null);

  async function handleConfirmTransfer(receiverId: string) {
    if (isProcessing || buble.iTransferMoney) return;
    pendingReceiver = null;

    isProcessing = true;
    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'createSheirutHaluka',
          params: {
            sheirutId: String(buble.id),
            projectId: String(buble.projectId),
            receiverId,
            amount: buble.total ?? buble.price ?? 0
          }
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed');

      buble.iTransferMoney = true;
      buble.halukaId = String(result.data?.halukaId);
      if (result.data?.amount != null) sentAmount = Number(result.data.amount);
      buble.halukaForumId = null;
      buble.senderconf = false;
      buble.halukaConfirmed = false;
      const selectedReceiver = buble.iCanGetMonay?.find((m: any) => String(m.id) === String(receiverId));
      if (selectedReceiver) {
        buble.iTransferedTo = selectedReceiver;
      }
      toast.success($t('lev.cards.customerSale.successTransfer'));
      onSent?.();
    } catch (err) {
      console.error(err);
      toast.error($t('lev.cards.customerSale.error'));
    } finally {
      isProcessing = false;
    }
  }
</script>

{#if pay === 'notYet'}
  <div
    class="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-200 dark:border-indigo-700 text-xs text-indigo-800 dark:text-indigo-200"
  >
    {$t('deals.due.payWhenFinal')}
  </div>
{:else if pay === 'nothingLeft'}
  <div
    class="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-200 dark:border-green-700 text-xs text-green-800 dark:text-green-200"
  >
    {$t('deals.due.nothingLeft')}
  </div>
{:else if pay === 'open'}
  <div
    class="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-200 dark:border-indigo-700"
  >
    {#if due}
      <div class="flex items-baseline justify-between gap-2 mb-2 text-xs text-indigo-900 dark:text-indigo-100">
        <span>{$t('deals.due.payNow')}</span>
        <span class="font-black"><Money amount={due.remaining} /></span>
      </div>
    {/if}
    <div
      class="text-[10px] text-indigo-700 dark:text-indigo-400 uppercase font-semibold mb-2"
    >
      {$t('lev.cards.customerSale.selectSeller')}
    </div>
    <div class="flex flex-wrap gap-2">
      {#each buble.iCanGetMonay || [] as member}
        <button
          class="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-indigo-200 dark:border-indigo-700 hover:border-indigo-500 transition-all text-xs"
          onclick={() => (pendingReceiver = member)}
          aria-pressed={pendingReceiver?.id === member.id}
          disabled={isProcessing}
        >
          {#if member.profilePic}
            <img
              src={member.profilePic}
              alt={member.username}
              class="w-6 h-6 rounded-full object-cover"
            />
          {:else}
            <div
              class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold"
            >
              {member.username?.charAt(0)}
            </div>
          {/if}
          <span>{member.username}</span>
        </button>
      {:else}
        <div class="flex items-center justify-between w-full gap-2">
          <span class="text-xs text-gray-500 dark:text-gray-400 italic">
            {$t('lev.cards.customerSale.noReceivers')}
          </span>
          <button
            class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-800 transition-colors shrink-0"
            onclick={onAskChat}
          >
            {$t('lev.cards.customerSale.askInChat')}
          </button>
        </div>
      {/each}
    </div>
    {#if pendingReceiver}
      <div
        class="mt-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-indigo-300 dark:border-indigo-600 text-xs space-y-2"
        role="group"
        aria-label={$t('lev.cards.customerSale.confirmTitle')}
      >
        <p class="text-gray-800 dark:text-gray-100">
          {$t('lev.cards.customerSale.confirmTo', { name: pendingReceiver.username ?? '' })}
          {#if due}<span class="font-black"><Money amount={due.remaining} /></span>{/if}
        </p>
        <p class="text-gray-500 dark:text-gray-400">{$t('lev.cards.customerSale.confirmHint')}</p>
        <div class="flex gap-2">
          <button
            class="flex-1 py-1.5 rounded-lg bg-indigo-600 text-white font-bold disabled:opacity-50"
            disabled={isProcessing}
            onclick={() => handleConfirmTransfer(String(pendingReceiver.id))}
          >
            {isProcessing ? $t('lev.cards.customerSale.submitting') : $t('lev.cards.customerSale.confirmYes')}
          </button>
          <button
            class="flex-1 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
            disabled={isProcessing}
            onclick={() => (pendingReceiver = null)}
          >
            {$t('lev.cards.customerSale.confirmBack')}
          </button>
        </div>
      </div>
    {/if}
  </div>
{:else if buble.halukaId}
  <SheirutHalukaCard
    halukaId={String(buble.halukaId)}
    senderId={meId}
    receiverId={String(buble.iTransferedTo?.id ?? '')}
    senderName={myName ?? $username}
    receiverName={buble.iTransferedTo?.username ?? ''}
    senderPic={myPic ?? $uPic}
    receiverPic={buble.iTransferedTo?.profilePic}
    amount={halukaAmount}
    bind:forumId={buble.halukaForumId}
    bind:senderconf={buble.senderconf}
    bind:confirmed={buble.halukaConfirmed}
    myId={meId}
    projectId={String(buble.projectId)}
  />
{:else if pay === 'paid'}
  <div
    class="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-200 dark:border-green-700 text-xs text-green-800 dark:text-green-200"
  >
    {$t('deals.pay.paidNote')}
  </div>
{/if}
