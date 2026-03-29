<script lang="ts">
  import type { ChatMessage } from '$lib/types/chat';
  import VotingCard from './components/VotingCard.svelte';
  import PartnershipGrid from './components/PartnershipGrid.svelte';
  import MissionList from './components/MissionList.svelte';

  let {
    message,
    onAction
  }: { message: ChatMessage; onAction: (text: string) => void } = $props();
  console.log(message);
  const isUser = $derived(message.role === 'user');

  function handleVote(option: string, proposal: string) {
    onAction(`הצבעתי "${option}" על: ${proposal}`);
  }
</script>

<div class="message-row {isUser ? 'user' : ''}">
  <!-- Avatar -->
  <div class="avatar {isUser ? 'user-avatar' : 'bot-avatar'}">
    {#if isUser}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle
          cx="12"
          cy="7"
          r="4"
        />
      </svg>
    {:else}
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
        <circle cx="8" cy="16" r="1" fill="currentColor" />
        <circle cx="12" cy="16" r="1" fill="currentColor" />
        <circle cx="16" cy="16" r="1" fill="currentColor" />
      </svg>
    {/if}
  </div>

  <!-- Content column -->
  <div class="content">
    <div class="bubble {isUser ? 'user-bubble' : 'bot-bubble'}">
      {message.content}
    </div>

    <!-- Rich components -->
    {#if message.components}
      {#each message.components as comp}
        {#if comp.type === 'voting'}
          <VotingCard {...comp.props} onVote={handleVote} />
        {:else if comp.type === 'summary'}
          <PartnershipGrid {...comp.props} />
        {:else if comp.type === 'mission_list'}
          <MissionList {...comp.props} {onAction} />
        {/if}
      {/each}
    {/if}

    <time class="timestamp">{message.time}</time>
  </div>
</div>

<style>
  .message-row {
    display: flex;
    gap: 12px;
    align-items: flex-end;
    animation: fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
    width: 100%;
    margin-bottom: 8px;
  }

  /* Bot: Right-aligned in RTL */
  .message-row:not(.user) {
    flex-direction: row;
    justify-content: flex-start;
  }

  /* User: Left-aligned in RTL */
  .message-row.user {
    flex-direction: row-reverse;
    justify-content: flex-start;
  }

  .avatar {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    z-index: 2;
  }

  .bot-avatar {
    background: linear-gradient(135deg, #0d2e22, #0f3826);
    border: 1px solid rgba(62, 207, 178, 0.3);
    color: var(--teal);
  }

  .user-avatar {
    background: linear-gradient(
      to bottom right,
      #bf953f,
      #eee8aa,
      #b38728
    ); /* liteGoldTobr */
    border: 1px solid rgba(184, 134, 11, 0.4);
    color: #2c384a; /* bluesun */
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 80%;
    position: relative;
  }

  /* Bot content stays near avatar on the right */
  .message-row:not(.user) .content {
    margin-left: 0;
  }

  /* User content stays near avatar on the left */
  .message-row.user .content {
    margin-right: 0;
  }

  .bubble {
    padding: 12px 18px;
    border-radius: 18px;
    font-size: 14.5px;
    line-height: 1.6;
    color: #ffffff;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    word-break: break-word;
  }

  .bot-bubble {
    background: linear-gradient(
      135deg,
      #0f3d20 0%,
      #1a4a1a 30%,
      #2d3a0a 65%,
      #3a2e08 100%
    );
    border: 1px solid rgba(212, 175, 55, 0.45);
    border-bottom-right-radius: 4px; /* Tail on the right */
    box-shadow:
      0 4px 18px rgba(0, 0, 0, 0.25),
      inset 0 1px 0 rgba(212, 175, 55, 0.2),
      inset 0 -1px 0 rgba(62, 207, 100, 0.1);
  }

  .user-bubble {
    background: linear-gradient(
      to bottom right,
      #bf953f,
      #eee8aa,
      #b38728
    ); /* liteGoldTobr */
    color: #2c384a; /* bluesun */
    border: 1px solid rgba(184, 134, 11, 0.4);
    border-bottom-left-radius: 4px; /* Tail on the left */
    box-shadow: 0 4px 20px rgba(184, 134, 11, 0.2);
  }

  .timestamp {
    font-size: 10px;
    color: var(--text-3);
    font-family: var(--font-mono);
    padding: 2px 8px;
  }

  .message-row.user .timestamp {
    text-align: left;
  }

  .message-row:not(.user) .timestamp {
    text-align: right;
  }

  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(15px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
