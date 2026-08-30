<script lang="ts">
  /**
   * The rich cards an assistant message can carry.
   *
   * Extracted out of MessageRenderer so the bot popup — which is the chat most
   * members actually use, and which lives on every page — renders exactly the
   * same cards the full /chat page does. Until now the popup threw
   * `response.components` away, so the timer agent's promise that "an edit card
   * will appear in this response" was simply untrue wherever it was made.
   */
  import type { ChatComponent } from '$lib/types/chat';
  import VotingCard from './components/VotingCard.svelte';
  import PartnershipGrid from './components/PartnershipGrid.svelte';
  import MissionList from './components/MissionList.svelte';
  import TimerEditCard from './components/TimerEditCard.svelte';
  import ProductList from './components/ProductList.svelte';

  let {
    components = [],
    onAction = () => {}
  }: { components?: ChatComponent[]; onAction?: (text: string) => void } = $props();

  function handleVote(option: string, proposal: string) {
    onAction(`הצבעתי "${option}" על: ${proposal}`);
  }
</script>

{#each components ?? [] as comp}
  {#if comp.type === 'voting'}
    <VotingCard {...comp.props as any} onVote={handleVote} />
  {:else if comp.type === 'summary'}
    <PartnershipGrid {...comp.props as any} />
  {:else if comp.type === 'mission_list'}
    <MissionList {...comp.props as any} {onAction} />
  {:else if comp.type === 'timer_edit'}
    <TimerEditCard {...comp.props as any} />
  {:else if comp.type === 'product_list'}
    <ProductList {...comp.props as any} />
  {/if}
{/each}
