<script lang="ts">
  import { isRtl, t } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import CardHeader from './CardHeader.svelte';
  import VoteStatusDisplay from './VoteStatusDisplay.svelte';
  import CustomerPayment from './CustomerPayment.svelte';
  import { forum } from '$lib/stores/pendMisMes.js';
  import Money from '$lib/components/money/Money.svelte';
  import type { DealDue } from '$lib/sheirut/dealDue';

  let {
    buble,
    isFirst = false,
    glowColor = 'blue',
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
      if (buble.forumId && buble.forumId !== -1) {
        const md = {
          pid: Number(buble.projectId),
          title: { he: 'אישור מכירה', en: 'Sale Approval' },
          transferDetails: buble.name
        };
        const tempF = $forum;
        tempF[buble.forumId] = {
          ...tempF[buble.forumId],
          md: { ...(tempF[buble.forumId]?.md || {}), ...md }
        };
        forum.set(tempF);
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
          const md = {
            pid: Number(buble.projectId),
            title: { he: 'אישור מכירה', en: 'Sale Approval' },
            transferDetails: buble.name
          };
          const tempF = $forum;
          tempF[newForumId] = {
            loading: false,
            messages: tempF[newForumId]?.messages || [],
            md
          };
          forum.set(tempF);
          onChat({ forumId: newForumId, sheirutId: buble.id });
        } catch (err) {
          console.error(err);
          toast.error($t('lev.cards.customerSale.error'));
        } finally {
          isCreatingChat = false;
        }
      }
    }
  }


  let isProcessing = $state(false);

  /**
   * A wish deal is paid by the hours its rikma approved, capped at the price agreed per
   * part (QA_CONCIERGE_E2E C-14) — the same hours the partners' shares follow. The server
   * decides the amount; the card shows it and opens the payment only once it is final.
   * null = not a wish deal (paid at its agreed total, as before) or not known yet.
   */
  let due = $state<DealDue | null>(null);
  $effect(() => {
    const id = buble.id;
    if (!id) return;
    let alive = true;
    fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionKey: 'getDealDue', params: { sheirutId: String(id) } })
    })
      .then((r) => r.json())
      .then((out) => {
        if (alive && out?.success) due = out.data?.due ?? null;
      })
      .catch((e) => console.warn('[CustomerSaleCard] could not read what the deal owes:', e));
    return () => {
      alive = false;
    };
  });

  async function handleConfirmReceipt() {
    if (isProcessing || buble.iGotIt) return;

    isProcessing = true;
    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'updateSheirut',
          params: {
            id: buble.id,
            projectId: buble.projectId,
            iGotIt: true
          }
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed');

      buble.iGotIt = true;
      toast.success($t('lev.cards.customerSale.successReceipt'));
    } catch (err) {
      console.error(err);
      toast.error($t('lev.cards.customerSale.error'));
    } finally {
      isProcessing = false;
    }
  }

  // Members for weFinnish display: sellers (flat→Strapi format) + customer
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
    const all = [...sellers, customer];
    return all.filter((m, i) => m?.id != null && all.findIndex((x) => String(x?.id) === String(m.id)) === i);
  });

  // Votes for weFinnish display: actual votes + synthetic customer vote when iGotIt
  // (once — QA C-22)
  const weFinnishVotes = $derived.by(() => {
    const votes = [...(buble.weFinnish || [])];
    const mine = (v: any) =>
      String(v?.users_permissions_user?.data?.id ?? v?.users_permissions_user ?? '') === String(buble.customerId);
    if (buble.iGotIt && !votes.some(mine)) {
      votes.push({
        id: 'customer-iGotIt',
        what: true,
        order: 0,
        users_permissions_user: { data: { id: buble.customerId } }
      });
    }
    return votes;
  });

  // Check if the recipient confirmed money
  const isMoneyConfirmedByRecipient = $derived.by(() => {
    if (!buble.iTransferedTo || !buble.iGotMoney) return false;
    return buble.iGotMoney.some(
      (gm: any) =>
        gm.users_permissions_user?.data?.id === buble.iTransferedTo.id
    );
  });

  const statusItems = $derived.by(() => {
    const items = [];

    if (buble.iGotIt) {
      items.push({ label: $t('lev.cards.customerSale.statusLabels.iGotIt'), color: 'green' });
    }
    if (buble.iTransferMoney) {
      items.push({ label: $t('lev.cards.customerSale.statusLabels.transferInProgress'), color: 'blue' });
    }
    if (buble.weFinnish && buble.weFinnish.length > 0) {
      items.push({
        label: $t('lev.cards.customerSale.statusLabels.sellersClaimDelivered'),
        color: 'orange'
      });
    }
    if (isMoneyConfirmedByRecipient) {
      items.push({
        label: $t('lev.cards.customerSale.statusLabels.sellerConfirmedMoney'),
        color: 'green'
      });
    }

    return items;
  });
</script>

<div
  dir={$isRtl ? 'rtl' : 'ltr'}
  style="overflow-y:auto"
  class="{isMobileOrTablet()
    ? 'w-full h-full'
    : ' w-[90%] h-[90%]'}  lg:w-[90%] {isFirst
    ? $isRtl
      ? 'boxleft'
      : 'boxright'
    : ''} flex d flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden {isFirst
    ? 'shadow-glow border-glow'
    : 'shadow-lg border border-gray-100 dark:border-gray-700'} transition-all duration-300 relative"
  style:--glow-rgb="116, 191, 255"
>
  <!-- Header -->
  <CardHeader
    logoSrc={buble.projectSrc}
    projectName={buble.projectName}
    cardType={$t('lev.cards.customerSale.myPurchase')}
    cardTitle={buble.name}
    glowColor="blue"
    onProjectClick={handleProjectClick}
  >
    {#snippet voteSummary()}
      {#if !isMobileOrTablet() && buble.weFinnish && buble.weFinnish.length > 0}
        <div
          class="bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm"
        >
          <div class="text-[10px] text-orange-600 uppercase font-bold mb-1">
            {$t('lev.cards.customerSale.statusLabels.sellersClaimDelivered')}
          </div>
          <VoteStatusDisplay
            compact
            votes={weFinnishVotes}
            members={weFinnishMembers}
            activeOrder={0}
          />
        </div>
      {/if}
    {/snippet}
  </CardHeader>

  <!-- Content -->
  <div
    class="bg-white dark:bg-slate-800 transition-all-300 p-4 flex-1 overflow-y-auto d space-y-4"
  >
    <!-- Seller Info -->
    <div
      class="flex d items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-3 rounded-xl border border-blue-200 dark:border-blue-700"
    >
      {#if buble.projectSrc}
        <img
          src={buble.projectSrc}
          alt={buble.projectName}
          class="w-12 h-12 rounded-full object-cover border-2 border-blue-400/50"
        />
      {:else}
        <div
          class="w-12 h-12 rounded-full bg-blue-400/20 flex items-center justify-center text-blue-600 font-bold"
        >
          {buble.projectName?.charAt(0) || 'P'}
        </div>
      {/if}
      <div>
        <div class="text-[10px] text-blue-600 uppercase font-semibold">
          {$t('lev.cards.customerSale.seller')}
        </div>
        <div class="font-bold text-gray-800 dark:text-gray-200">
          {buble.projectName || 'Project'}
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
          >{$t('lev.cards.customerSale.price')}</span
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
          >{$t('lev.cards.customerSale.quantity')}</span
        >
        <span class="font-bold text-gray-800 dark:text-gray-100"
          >{buble.quant}</span
        >
      </div>
      <div
        class="col-span-2 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 p-2 rounded-lg border border-blue-500/10"
      >
        <span class="text-blue-600 block text-[10px] uppercase font-bold"
          >{$t('lev.cards.customerSale.total')}</span
        >
        <div class="flex items-center gap-2">
          <img
            src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
            alt="money"
            class="w-6 h-6"
          />
          <span class="text-xl font-black text-blue-600">{buble.total}</span>
        </div>
      </div>
    </div>

    <!-- What the deal costs by the approved hours (wish deals, C-14) -->
    {#if due}
      <div
        class="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-200 dark:border-amber-700 space-y-2"
      >
        <div class="flex items-baseline justify-between gap-2">
          <span class="text-[10px] text-amber-800 dark:text-amber-300 uppercase font-bold"
            >{$t('deals.due.heroLabel')}</span
          >
          <span class="text-lg font-black text-amber-900 dark:text-amber-200"
            ><Money amount={due.due} /></span
          >
        </div>
        <p class="text-xs text-amber-900 dark:text-amber-200 leading-snug">{$t('deals.due.explain')}</p>
        <ul class="space-y-1">
          {#each due.lines as line (line.key)}
            <li class="flex items-baseline justify-between gap-2 text-xs text-gray-800 dark:text-gray-200">
              <span class="truncate"
                >{line.name}{#if line.providerName}<span class="text-gray-500 dark:text-gray-400">
                    · {line.providerName}</span
                  >{/if}</span
              >
              <span class="shrink-0 font-semibold"
                ><Money amount={line.due} />
                <span class="font-normal text-gray-500 dark:text-gray-400"
                  >/ <Money amount={line.cap} /></span
                ></span
              >
            </li>
          {/each}
        </ul>
        <p class="text-[11px] text-amber-800 dark:text-amber-300">
          {due.final ? $t('deals.due.final') : $t('deals.due.running')}
        </p>
      </div>
    {/if}

    <!-- Money Transfer — the same flow the deal page opens (CustomerPayment) -->
    <CustomerPayment {buble} {due} onAskChat={handleOpenChat} />
  </div>

  <!-- Seller delivery claims status -->
  {#if buble.weFinnish && buble.weFinnish.length > 0 && isMobileOrTablet()}
    <div class="px-4">
      <div class="text-[10px] text-orange-600 uppercase font-bold mb-1">
        {$t('lev.cards.customerSale.statusLabels.sellersClaimDelivered')}
      </div>
      <VoteStatusDisplay
        votes={weFinnishVotes}
        members={weFinnishMembers}
        activeOrder={0}
      />
    </div>
  {/if}

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
        {$t('lev.cards.customerSale.creatingChat')}
      {:else}
        {$t('lev.cards.customerSale.chat')}
      {/if}
    </button>

    <!-- Confirm Receipt Button -->
    {#if !buble.iGotIt}
      <button
        class="flex-1 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
        onclick={handleConfirmReceipt}
        disabled={isProcessing}
      >
        {#if isProcessing}
          {$t('lev.cards.customerSale.submitting')}
        {:else}
          {$t('lev.cards.customerSale.confirmReceipt')}
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
