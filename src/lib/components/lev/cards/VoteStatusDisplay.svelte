<script lang="ts">
  import { lang } from '$lib/stores/lang.js';
  import { fade } from 'svelte/transition';

  interface Props {
    votes?: any[];
    members?: any[];
    activeOrder?: number;
  }

  let { votes = [], members = [], activeOrder = 0 }: Props = $props();

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

  const t = {
    approved: { he: 'אישרו', en: 'Approved', ar: 'وافقت' },
    old_version: { he: 'גרסה קודמת', en: 'Old Version', ar: 'نسخة قديمة' },
    waiting: { he: 'טרם הצביעו', en: 'Waiting', ar: 'في انتظار' },
    rejected: { he: 'התנגדו', en: 'Rejected', ar: 'رفض' }
  };

  // Grouping for display
  let groups = $derived({
    approved: voteStatus.filter((s) => s.status === 'approved'),
    rejected: voteStatus.filter((s) => s.status === 'rejected'),
    old_version: voteStatus.filter((s) => s.status === 'old_version'),
    waiting: voteStatus.filter((s) => s.status === 'waiting')
  });
</script>

<div
  class="flex flex-col md:flex-row md:flex-wrap items-start gap-4 md:gap-8 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700"
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
        {t.approved[$lang]} ({groups.approved.length})
      </div>
      <div class="flex flex-wrap gap-2">
        {#each groups.approved as user}
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
        {t.rejected[$lang]} ({groups.rejected.length})
      </div>
      <div class="flex flex-wrap gap-2">
        {#each groups.rejected as user}
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
        {t.old_version[$lang]} ({groups.old_version.length})
      </div>
      <div class="flex flex-wrap gap-2">
        {#each groups.old_version as user}
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
        {t.waiting[$lang]} ({groups.waiting.length})
      </div>
      <div class="flex flex-wrap gap-2">
        {#each groups.waiting as user}
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
