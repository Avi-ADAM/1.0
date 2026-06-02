<script lang="ts">
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import { fade } from 'svelte/transition';

  interface Props {
    votes?: any[];
    members?: any[];
    activeOrder?: number;
    /** תצוגה קומפקטית של סטאק אווטרים (לשילוב בהדר הכרטיס) */
    compact?: boolean;
    /** מקסימום אווטרים שמוצגים לכל קבוצה במצב קומפקטי לפני "+N" */
    maxPerGroup?: number;
  }

  let {
    votes = [],
    members = [],
    activeOrder = 0,
    compact = false,
    maxPerGroup = 4
  }: Props = $props();
  // Computed
  let voteStatus = $derived(
    members.map((member) => {
      const memberId = member.id;
      const memberName = member.attributes?.username || 'User';
      const memberPic =
        member.attributes?.profilePic?.data?.attributes?.url || null;

      // Find all votes by this member
      const memberVotes = votes.filter(
        (v) =>
          v.users_permissions_user?.data?.id === memberId ||
          v.users_permissions_user?.id === memberId ||
          v.ide === memberId
      );

      // Find if they have a vote on the active order
      const activeVote = memberVotes.find(
        (v) => (v.order || 0) === activeOrder
      );

      // Determine status
      let status = 'waiting'; // default
      if (activeVote) {
        if (activeVote.what)
          status = 'approved'; // Positive on active
        else status = 'rejected'; // Negative on active (or generally negative)
      } else {
        // No active vote, check history
        const hasHistory = memberVotes.length > 0;
        if (hasHistory) {
          // If they voted previously, we check their *latest* vote
          // But usually "Old Version" implies they voted positive on an old version
          // and haven't updated for the new one yet.
          // If they rejected an old version, they are arguably "rejected" or "waiting".
          // The requirement says: "lower order... as vote on previous version"
          status = 'old_version';
        } else {
          status = 'waiting';
        }
      }

      return {
        id: memberId,
        name: memberName,
        pic: memberPic,
        status // 'approved', 'rejected', 'old_version', 'waiting'
      };
    })
  );


  // Grouping for display
  let groups = $derived({
    approved: voteStatus.filter((s) => s.status === 'approved'),
    rejected: voteStatus.filter((s) => s.status === 'rejected'),
    old_version: voteStatus.filter((s) => s.status === 'old_version'),
    waiting: voteStatus.filter((s) => s.status === 'waiting')
  });

  // קונפיגורציה מסודרת לרינדור הקומפקטי (אווטרים חופפים מקובצים לפי סטטוס)
  let compactGroups = $derived(
    [
      {
        key: 'approved',
        users: groups.approved,
        ring: 'border-green-400 dark:border-green-500',
        text: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-100 text-green-700',
        extra: '',
        label: $t('lev.cards.voteStatus.approved')
      },
      {
        key: 'rejected',
        users: groups.rejected,
        ring: 'border-red-400 dark:border-red-500',
        text: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 text-red-700',
        extra: '',
        label: $t('lev.cards.voteStatus.rejected')
      },
      {
        key: 'old_version',
        users: groups.old_version,
        ring: 'border-orange-400 dark:border-orange-500',
        text: 'text-orange-500 dark:text-orange-400',
        bg: 'bg-orange-100 text-orange-700',
        extra: 'grayscale opacity-80',
        label: $t('lev.cards.voteStatus.oldVersion')
      },
      {
        key: 'waiting',
        users: groups.waiting,
        ring: 'border-gray-300 dark:border-gray-600',
        text: 'text-gray-500 dark:text-gray-400',
        bg: 'bg-gray-100 text-gray-500',
        extra: 'grayscale opacity-60',
        label: $t('lev.cards.voteStatus.waiting')
      }
    ].filter((g) => g.users.length > 0)
  );

  // מצב הרחבה של התצוגה הקומפקטית (הובר זמני / לחיצה ננעצת)
  let hovering = $state(false);
  let pinned = $state(false);
  let wrapperEl = $state<HTMLElement>();
  let expanded = $derived(hovering || pinned);
</script>

<svelte:window
  onclick={(e) => {
    if (compact && pinned && wrapperEl && !wrapperEl.contains(e.target as Node))
      pinned = false;
  }}
/>

{#snippet fullView(panel)}
  <div
    class={panel
      ? 'flex flex-col gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl w-max max-w-[18rem]'
      : 'flex flex-col md:flex-row md:flex-wrap items-start gap-4 md:gap-8 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700'}
  >
  <!-- Approved -->
  {#if groups.approved.length > 0}
    <div class="space-y-2">
      <div
        class="flex items-center gap-2 text-sm font-bold text-green-600 dark:text-green-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        {$t('lev.cards.voteStatus.approved')} ({groups.approved.length})
      </div>
      <div class="flex flex-wrap gap-2">
        {#each groups.approved as user, i (`${user.id}_${i}`)}
          <div class="relative group" transition:fade>
            {#if user.pic}
              <img
                src={user.pic}
                alt={user.name}
                class="w-8 h-8 rounded-full border-2 border-green-200 dark:border-green-800 object-cover"
              />
            {:else}
              <div
                class="w-8 h-8 rounded-full border-2 border-green-200 bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold"
              >
                {user.name.charAt(0)}
              </div>
            {/if}
            <span
              class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none"
            >
              {user.name}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Rejected -->
  {#if groups.rejected.length > 0}
    <div class="space-y-2">
      <div
        class="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        {$t('lev.cards.voteStatus.rejected')} ({groups.rejected.length})
      </div>
      <div class="flex flex-wrap gap-2">
        {#each groups.rejected as user, i (`${user.id}_${i}`)}
          <div class="relative group" transition:fade>
            {#if user.pic}
              <img
                src={user.pic}
                alt={user.name}
                class="w-8 h-8 rounded-full border-2 border-red-200 dark:border-red-800 object-cover"
              />
            {:else}
              <div
                class="w-8 h-8 rounded-full border-2 border-red-200 bg-red-100 flex items-center justify-center text-red-700 text-xs font-bold"
              >
                {user.name.charAt(0)}
              </div>
            {/if}
            <span
              class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none"
            >
              {user.name}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Old Version -->
  {#if groups.old_version.length > 0}
    <div class="space-y-2">
      <div
        class="flex items-center gap-2 text-sm font-bold text-orange-500 dark:text-orange-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        {$t('lev.cards.voteStatus.oldVersion')} ({groups.old_version.length})
      </div>
      <div class="flex flex-wrap gap-2">
        {#each groups.old_version as user, i (`${user.id}_${i}`)}
          <div class="relative group" transition:fade>
            {#if user.pic}
              <img
                src={user.pic}
                alt={user.name}
                class="w-8 h-8 rounded-full border-2 border-orange-200 dark:border-orange-800 object-cover grayscale opacity-80"
              />
            {:else}
              <div
                class="w-8 h-8 rounded-full border-2 border-orange-200 bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-bold"
              >
                {user.name.charAt(0)}
              </div>
            {/if}
            <span
              class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none"
            >
              {user.name}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Waiting -->
  {#if groups.waiting.length > 0}
    <div class="space-y-2">
      <div
        class="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        {$t('lev.cards.voteStatus.waiting')} ({groups.waiting.length})
      </div>
      <div class="flex flex-wrap gap-2">
        {#each groups.waiting as user, i (`${user.id}_${i}`)}
          <div class="relative group" transition:fade>
            {#if user.pic}
              <img
                src={user.pic}
                alt={user.name}
                class="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700 object-cover grayscale opacity-50"
              />
            {:else}
              <div
                class="w-8 h-8 rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold grayscale opacity-50"
              >
                {user.name.charAt(0)}
              </div>
            {/if}
            <span
              class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none"
            >
              {user.name}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  </div>
{/snippet}

{#if compact}
  <div
    class="relative inline-block"
    bind:this={wrapperEl}
    role="group"
    onmouseenter={() => (hovering = true)}
    onmouseleave={() => (hovering = false)}
  >
    <!-- טריגר קומפקטי: תגית + מונה + אווטרים חופפים לכל סטטוס -->
    <button
      type="button"
      class="flex items-center flex-wrap gap-x-3 gap-y-1.5 cursor-pointer"
      aria-expanded={expanded}
      title={$lang === 'he' ? 'הצג את כולם' : 'Show all'}
      onclick={(e) => {
        e.stopPropagation();
        pinned = !pinned;
      }}
    >
      {#each compactGroups as g (g.key)}
        <div class="flex items-center gap-1.5">
          <span class={`text-xs font-bold whitespace-nowrap ${g.text}`}>
            {g.label} {g.users.length}
          </span>
          <div class="flex -space-x-2">
            {#each g.users.slice(0, maxPerGroup) as user, i (`${user.id}_${i}`)}
              {#if user.pic}
                <img
                  src={user.pic}
                  alt={user.name}
                  title={user.name}
                  class={`w-7 h-7 rounded-full border-2 ${g.ring} ${g.extra} object-cover ring-1 ring-white dark:ring-gray-800`}
                />
              {:else}
                <div
                  title={user.name}
                  class={`w-7 h-7 rounded-full border-2 ${g.ring} ${g.bg} ${g.extra} flex items-center justify-center text-[10px] font-bold ring-1 ring-white dark:ring-gray-800`}
                >
                  {user.name.charAt(0)}
                </div>
              {/if}
            {/each}
            {#if g.users.length > maxPerGroup}
              <div
                class={`w-7 h-7 rounded-full border-2 ${g.ring} ${g.bg} flex items-center justify-center text-[10px] font-bold ring-1 ring-white dark:ring-gray-800`}
              >
                +{g.users.length - maxPerGroup}
              </div>
            {/if}
          </div>
        </div>
      {/each}
      <svg
        class="w-4 h-4 text-gray-400 transition-transform {expanded
          ? 'rotate-180'
          : ''}"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        ></path>
      </svg>
    </button>

    {#if expanded}
      <!-- הרחבה: כל הפרצופים והפילוח המלא -->
      <div class="mt-2">
        {@render fullView(true)}
      </div>
    {/if}
  </div>
{:else}
  {@render fullView(false)}
{/if}
