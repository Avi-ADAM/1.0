<script lang="ts">
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { userStore } from '$lib/stores/levStores';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import CardHeader from './CardHeader.svelte';
  import VoteStatusDisplay from './VoteStatusDisplay.svelte';
  import SheirutHalukaCard from './SheirutHalukaCard.svelte';

  let {
    buble,
    isFirst = false,
    glowColor = 'green',
    onProj,
    onChat = undefined
  } = $props();

  function handleProjectClick() {
    if (onProj && buble.projectId) {
      onProj({ id: buble.projectId });
    }
  }

  let isCreatingChat = $state(false);

  async function handleOpenChat() {
    if (isCreatingChat) return;

    if (onChat) {
      if (buble.forumId) {
        onChat({ forumId: buble.forumId, sheirutId: buble.id });
      } else {
        isCreatingChat = true;
        try {
          const response = await fetch('/api/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              actionKey: 'ensureSheirutForum',
              params: {
                projectId: String(buble.projectId),
                sheirutId: String(buble.id)
              }
            })
          });

          const result = await response.json();
          if (!result.success) {
            throw new Error(
              result.error?.message || 'Failed to create chat forum.'
            );
          }

          const newForumId = result.data?.forumId;
          if (!newForumId) {
            throw new Error('Failed to create chat forum.');
          }

          buble.forumId = newForumId;
          onChat({ forumId: newForumId, sheirutId: buble.id });
        } catch (err) {
          console.error(err);
          toast.error($t('lev.cards.saleCard.operationError'));
        } finally {
          isCreatingChat = false;
        }
      }
    }
  }



  let isProcessing = $state(false);
  let isTogglingReceiver = $state(false);

  const moneyReceivers = $derived(
    Array.isArray(buble.iCanGetMonay) ? buble.iCanGetMonay : []
  );
  const iAmReceiver = $derived(
    moneyReceivers.some((u) => String(u.id) === String(buble.myid))
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
          (u) => String(u.id) !== String(buble.myid)
        );
      }
      toast.success(
        action === 'add' ? $t('lev.cards.saleCard.addMeReceiver') : $t('lev.cards.saleCard.removeMeReceiver')
      );
    } catch (err) {
      console.error(err);
      toast.error($t('lev.cards.saleCard.operationError'));
    } finally {
      isTogglingReceiver = false;
    }
  }

  async function handleConfirmDelivery() {
    if (isProcessing || buble.alreadyVoted) return;

    isProcessing = true;
    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'addVote',
          params: {
            type: 'weFinnish',
            id: buble.id,
            projectId: buble.projectId
          }
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed');

      toast.success($t('lev.cards.saleCard.deliveryConfirmed'));
    } catch (err) {
      console.error(err);
      toast.error($t('lev.cards.saleCard.operationError'));
    } finally {
      isProcessing = false;
    }
  }

  async function handleConfirmMoney() {
    if (isProcessing || buble.moneyTransfered) return;

    isProcessing = true;
    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'updateSheirut',
          payload: {
            id: buble.id,
            projectId: buble.projectId,
            moneyTransfered: true
          }
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed');

      toast.success($t('lev.cards.saleCard.paymentConfirmed'));
    } catch (err) {
      console.error(err);
      toast.error($t('lev.cards.saleCard.operationError'));
    } finally {
      isProcessing = false;
    }
  }

  // Members list: project members (flat→Strapi format) + customer
  const weFinnishMembers = $derived.by(() => {
    const sellers = (buble.members || []).map((m: any) => ({
      id: m.id,
      attributes: {
        username: m.username,
        profilePic: { data: { attributes: { url: m.profilePic || null } } }
      }
    }));
    const customer = {
      id: buble.customerId,
      attributes: {
        username: buble.customerName,
        profilePic: { data: { attributes: { url: buble.customerSrc || null } } }
      }
    };
    return [...sellers, customer];
  });

  // Votes: actual weFinnish + synthetic vote for customer when iGotIt
  const weFinnishVotes = $derived.by(() => {
    const votes = [...(buble.weFinnish || [])];
    if (buble.iGotIt) {
      votes.push({
        id: 'customer-iGotIt',
        what: true,
        order: 0,
        users_permissions_user: { data: { id: buble.customerId } }
      });
    }
    return votes;
  });

  // Compute status display
  const statusItems = $derived.by(() => {
    const items = [];

    if (buble.iGotIt) {
      items.push({
        label: $t('lev.cards.saleCard.customerReceived'),
        color: 'green'
      });
    }
    if (buble.iTransferMoney) {
      items.push({ label: $t('lev.cards.saleCard.customerPaid'), color: 'blue' });
    }
    if (buble.moneyTransfered) {
      items.push({
        label: $t('lev.cards.saleCard.moneyReceived'),
        color: 'green'
      });
    }
    if (buble.productExepted) {
      items.push({ label: $t('lev.cards.saleCard.delivered'), color: 'green' });
    }
    if (!buble.alreadyVoted && !buble.productExepted) {
      items.push({
        label: $t('lev.cards.saleCard.awaitingApproval'),
        color: 'orange'
      });
    }
    if (
      buble.isMoneyRecipient &&
      buble.iTransferMoney &&
      !buble.moneyTransfered
    ) {
      items.push({
        label: $t('lev.cards.saleCard.youShouldReceive'),
        color: 'barbi'
      });
    }

    return items;
  });
</script>

<div
  onclick={toggleScrollable}
  role="button"
  tabindex="0"
  onkeypress={(e) => {
    e.key === 'Enter' && toggleScrollable();
  }}
  dir={$lang == 'he' ? 'rtl' : 'ltr'}
  style="overflow-y:auto"
  class="{isMobileOrTablet()
    ? 'w-full h-full'
    : ' w-[90%] h-[90%]'}  lg:w-[90%] {isFirst
    ? $lang == 'he'
      ? 'boxleft'
      : 'boxright'
    : ''} flex d flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden {isScrolable.value
    ? 'shadow-glow border-glow'
    : 'shadow-lg border border-gray-100 dark:border-gray-700'} transition-all duration-300 relative"
  style:--glow-rgb={glowColor === 'gold'
    ? '238, 232, 170'
    : glowColor === 'barbi'
      ? '255, 0, 146'
      : glowColor === 'blue'
        ? '116, 191, 255'
        : glowColor === 'green'
          ? '2, 255, 187'
          : '2, 255, 187'}
>
  <!-- Header -->
  <CardHeader
    logoSrc={buble.projectSrc}
    projectName={buble.projectName}
    cardType={$lang === 'he' ? 'מכירה פעילה' : 'ACTIVE SALE'}
    cardTitle={buble.name}
    {glowColor}
    onProjectClick={handleProjectClick}
  />

  <!-- Content -->
  <div
    class="{isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-200 dark:bg-slate-700'} transition-all-300 p-4 flex-1 overflow-y-auto d space-y-4"
  >
    <!-- Customer Info -->
    <div
      class="flex d items-center gap-3 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/30 dark:to-teal-900/30 p-3 rounded-xl border border-green-200 dark:border-green-700"
    >
      {#if buble.customerSrc}
        <img
          src={buble.customerSrc}
          alt={buble.customerName}
          class="w-12 h-12 rounded-full object-cover border-2 border-green-400/50"
        />
      {:else}
        <div
          class="w-12 h-12 rounded-full bg-green-400/20 flex items-center justify-center text-green-600 font-bold"
        >
          {buble.customerName?.charAt(0) || '?'}
        </div>
      {/if}
      <div>
        <div class="text-[10px] text-green-600 uppercase font-semibold">
          {$t('lev.cards.saleCard.customer')}
        </div>
        <div class="font-bold text-gray-800 dark:text-gray-200">
          {buble.customerName || 'Unknown'}
        </div>
      </div>
    </div>

    <!-- Status Badges -->
    {#if statusItems.length > 0}
      <div class="flex flex-wrap gap-2">
        {#each statusItems as status}
          <span
            class="px-2 py-1 rounded-full text-xs font-semibold
              {status.color === 'green'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
              : ''}
              {status.color === 'blue'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
              : ''}
              {status.color === 'orange'
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
              : ''}
              {status.color === 'barbi'
              ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300'
              : ''}"
          >
            {status.label}
          </span>
        {/each}
      </div>
    {/if}

    <!-- Product Image -->
    {#if buble.productPic}
      <div class="relative rounded-xl overflow-hidden aspect-video">
        <img
          src={buble.productPic}
          alt={buble.name}
          class="w-full h-full object-cover"
        />
      </div>
    {/if}

    <!-- Description -->
    {#if buble.descrip}
      <div
        class="text-sm text-gray-600 dark:text-gray-400 italic bg-gray-50/50 dark:bg-gray-900/20 p-2 rounded-lg"
      >
        <RichText outpot={buble.descrip} editable={false} />
      </div>
    {/if}

    <!-- Financial Details -->
    <div class="grid grid-cols-2 gap-3 text-sm">
      <div class="bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg">
        <span class="text-gray-500 block text-[10px] uppercase"
          >{$t('lev.cards.saleCard.price')}</span
        >
        <div class="flex items-center gap-2">
          <img
            src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
            alt="money"
            class="w-5 h-5"
          />
          <span class="font-bold text-gray-800 dark:text-gray-100"
            >{buble.price}</span
          >
        </div>
      </div>
      <div class="bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg">
        <span class="text-gray-500 block text-[10px] uppercase"
          >{$t('lev.cards.saleCard.quantity')}</span
        >
        <span class="font-bold text-gray-800 dark:text-gray-100"
          >{buble.quant}</span
        >
      </div>
      <div
        class="col-span-2 bg-gradient-to-r from-green-500/5 to-teal-500/5 p-2 rounded-lg border border-green-500/10"
      >
        <span class="text-green-600 block text-[10px] uppercase font-bold"
          >{$t('lev.cards.saleCard.total')}</span
        >
        <div class="flex items-center gap-2">
          <img
            src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
            alt="money"
            class="w-6 h-6"
          />
          <span class="text-xl font-black text-green-600">{buble.total}</span>
        </div>
      </div>
    </div>

    <!-- Dates -->
    {#if buble.startDate}
      <div
        class="flex gap-4 text-xs text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-3"
      >
        <div class="flex items-center gap-2">
          <img
            src="https://res.cloudinary.com/love1/image/upload/v1699831987/FX13_calendar2_jlxcn1.svg"
            alt="calendar"
            class="w-5 h-5"
          />
          <div class="flex items-center gap-1">
            <span class="font-semibold">{$t('lev.cards.saleCard.startDate')}</span>
            <span>{new Date(buble.startDate).toLocaleDateString($lang)}</span>
          </div>
        </div>
        {#if buble.finnishDate}
          <div class="flex items-center gap-2">
            <img
              src="https://res.cloudinary.com/love1/image/upload/v1699831987/FX13_calendar2_jlxcn1.svg"
              alt="calendar"
              class="w-5 h-5"
            />
            <div class="flex items-center gap-1">
              <span class="font-semibold">{$t('lev.cards.saleCard.endDate')}</span>
              <span
                >{new Date(buble.finnishDate).toLocaleDateString($lang)}</span
              >
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Money Receivers Section -->
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
        <!-- Empty state: call to action -->
        <div class="bg-red-50 dark:bg-red-900/10 p-3">
          <p class="font-bold text-red-700 dark:text-red-300 text-sm">
            {$t('lev.cards.saleCard.addReceiver')}
          </p>
          <p class="text-xs text-red-600 dark:text-red-400 mt-1">
            {$t('lev.cards.saleCard.addReceiverHint')}
          </p>
          <button
            class="mt-3 w-full py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-all disabled:opacity-50"
            onclick={handleToggleReceiver}
            disabled={isTogglingReceiver}
          >
            {isTogglingReceiver ? $t('lev.cards.saleCard.processing') : $t('lev.cards.saleCard.addMeReceiver')}
          </button>
        </div>
      {:else}
        <!-- List of receivers + self-add/remove -->
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
              <span
                class="text-sm font-semibold text-gray-800 dark:text-gray-200"
                >{u.username}</span
              >
              {#if String(u.id) === String(buble.myid)}
                <span
                  class="mr-auto text-[9px] bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full font-bold"
                  >אתה</span
                >
              {/if}
            </div>
          {/each}

          {#if iAmReceiver}
            <button
              class="w-full py-1.5 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50 mt-1"
              onclick={handleToggleReceiver}
              disabled={isTogglingReceiver}
            >
              {isTogglingReceiver ? $t('lev.cards.saleCard.processing') : $t('lev.cards.saleCard.removeMeReceiver')}
            </button>
          {:else}
            <button
              class="w-full py-1.5 rounded-lg border border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 text-xs font-semibold hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-all disabled:opacity-50 mt-1"
              onclick={handleToggleReceiver}
              disabled={isTogglingReceiver}
            >
              {isTogglingReceiver ? $t('lev.cards.saleCard.processing') : $t('lev.cards.saleCard.addMeReceiver')}
            </button>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Haluka transfer tracking card -->
    {#if buble.halukaId}
      <SheirutHalukaCard
        halukaId={String(buble.halukaId)}
        senderId={String(buble.customerId)}
        receiverId={String(buble.iTransferedTo?.id ?? '')}
        senderName={buble.customerName ?? ''}
        receiverName={buble.iTransferedTo?.username ?? ''}
        senderPic={buble.customerSrc}
        receiverPic={buble.iTransferedTo?.profilePic}
        amount={buble.total ?? buble.price}
        bind:forumId={buble.halukaForumId}
        bind:senderconf={buble.senderconf}
        bind:confirmed={buble.halukaConfirmed}
        myId={String(buble.myid)}
        projectId={String(buble.projectId)}
      />
    {/if}
  </div>

  <!-- Vote Status Display -->
  <div class="px-4 pb-2">
    <div class="text-[10px] text-green-600 uppercase font-bold mb-1">
      {$t('lev.cards.saleCard.deliveryApprovals')}
    </div>
    <VoteStatusDisplay
      votes={weFinnishVotes}
      members={weFinnishMembers}
      activeOrder={0}
    />
  </div>

  <!-- Actions -->
  <div
    class="p-4 bg-gray-50 dark:bg-gray-900/50 flex gap-3 border-t border-gray-100 dark:border-gray-700"
  >
    <!-- Chat Button -->
    <button
      class="py-2 px-4 bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-500 hover:bg-blue-50 font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
      onclick={handleOpenChat}
      disabled={isCreatingChat}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      {#if isCreatingChat}
        {$t('lev.cards.saleCard.creatingChat')}
      {:else}
        {$t('lev.cards.saleCard.chat')}
      {/if}
    </button>

    <!-- Confirm Delivery Button -->
    {#if !buble.productExepted}
      <button
        class="flex-1 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
        onclick={handleConfirmDelivery}
        disabled={isProcessing || buble.alreadyVoted}
      >
        {#if isProcessing}
          {$t('lev.cards.saleCard.processing')}
        {:else if buble.alreadyVoted}
          {buble.myDeliveryVote === true
            ? $lang === 'he'
              ? 'אישרת משלוח'
              : 'Delivery confirmed'
            : $lang === 'he'
              ? 'ממתין...'
              : 'Pending...'}
        {:else}
          {$t('lev.cards.saleCard.confirmDelivery')}
        {/if}
      </button>
    {/if}

    <!-- Confirm Money Button (only for money recipient, only when no haluka) -->
    {#if buble.moneyTransferredToMe && !buble.moneyTransfered && !buble.halukaId}
      <button
        class="flex-1 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
        onclick={handleConfirmMoney}
        disabled={isProcessing}
      >
        {#if isProcessing}
          {$t('lev.cards.saleCard.processing')}
        {:else}
          {$t('lev.cards.saleCard.confirmPayment')}
        {/if}
      </button>
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
