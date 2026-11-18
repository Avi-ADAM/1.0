<script lang="ts">
  import type { VotingProps } from '$lib/types/chat';
  import { t } from '$lib/translations';

  let {
    proposal,
    options,
    deadline,
    partnership,
    onVote,
  }: VotingProps & { onVote?: (option: string, proposal: string) => void } = $props();

  let voted = $state<string | null>(null);
  let hovered = $state<string | null>(null);

  // The API sends language-neutral option codes; the card says them in the
  // reader's language. Unknown options stay verbatim — they are data, not UI.
  const META: Record<string, { icon: string; color: string }> = {
    for: { icon: '✓', color: 'var(--teal)' },
    against: { icon: '✕', color: 'var(--rose)' },
    abstain: { icon: '–', color: 'var(--amber)' }
  };
  const FALLBACK_META = { icon: '•', color: 'var(--border-2)' };

  function labelOf(opt: string): string {
    if (opt === 'for') return $t('bot.card.voteFor');
    if (opt === 'against') return $t('bot.card.voteAgainst');
    if (opt === 'abstain') return $t('bot.card.voteAbstain');
    return opt;
  }

  function vote(opt: string) {
    if (voted) return;
    voted = opt;
    onVote?.(labelOf(opt), proposal);
  }
</script>

<div class="voting-card">
  <div class="card-header">
    <div class="badge-icon">⚖</div>
    <div class="card-meta">
      <span class="label">{$t('bot.card.activeVote', { partnership })}</span>
      <p class="proposal">{proposal}</p>
    </div>
  </div>

  <div class="deadline">
    <span class="clock">⏱</span> {$t('bot.card.deadline', { deadline })}
  </div>

  <div class="options">
    {#each options as opt}
      {@const m = META[opt] ?? FALLBACK_META}
      <button
        class="vote-btn"
        class:voted={voted === opt}
        class:dimmed={voted !== null && voted !== opt}
        style:--accent={m.color}
        onmouseenter={() => (hovered = opt)}
        onmouseleave={() => (hovered = null)}
        onclick={() => vote(opt)}
        disabled={!!voted}
      >
        <span class="opt-icon">{m.icon}</span>
        <span>{labelOf(opt)}</span>
        {#if voted === opt}
          <span class="confirmed">{$t('bot.card.recorded')}</span>
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .voting-card {
    background: var(--surface-2);
    border: 1px solid var(--border-2);
    border-radius: var(--radius);
    padding: 18px;
    margin-top: 8px;
    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .card-header {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .badge-icon {
    width: 34px; height: 34px;
    border-radius: 10px;
    background: var(--amber-dim);
    display: grid; place-items: center;
    font-size: 16px; flex-shrink: 0;
    border: 1px solid var(--amber-border);
  }

  .label {
    font-size: 10px;
    color: var(--text-3);
    font-family: var(--font-mono);
    display: block;
    margin-bottom: 4px;
  }

  .proposal {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    line-height: 1.45;
  }

  .deadline {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--amber);
    background: var(--amber-dim);
    border: 1px solid var(--amber-border);
    border-radius: 6px;
    padding: 3px 10px;
    margin-bottom: 14px;
  }

  .options {
    display: flex;
    gap: 8px;
  }

  .vote-btn {
    flex: 1;
    padding: 9px 6px;
    border-radius: 9px;
    border: 1px solid var(--border);
    background: var(--surface-3);
    color: var(--text-2);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    font-family: var(--font-body);
    transition: all 0.18s ease;
  }

  .vote-btn:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
  }

  .vote-btn.voted {
    border-color: var(--accent);
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }

  .vote-btn.dimmed {
    opacity: 0.35;
  }

  .opt-icon {
    font-style: normal;
    font-size: 12px;
  }

  .confirmed {
    font-size: 10px;
    opacity: 0.65;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>
