<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title = '',
    actionLabel = '',
    onAction,
    titleColor = '',
    children,
  }: {
    title?:       string;
    actionLabel?: string;
    onAction?:    () => void;
    titleColor?:  string;
    children?:    Snippet;
  } = $props();
</script>

<div class="panel">
  {#if title}
    <div class="panel-title" style={titleColor ? `color:${titleColor}` : ''}>
      <span>{title}</span>
      {#if actionLabel && onAction}
        <button class="action" onclick={onAction}>{actionLabel}</button>
      {/if}
    </div>
  {/if}
  {@render children?.()}
</div>

<style>
  .panel {
    background: var(--s1);
    border: 1px solid var(--border);
    border-radius: var(--rl);
    padding: 26px;
  }

  .panel-title {
    font-size: 11px;
    font-weight: 700;
    color: var(--tm);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .action {
    font-size: 11px;
    color: var(--gold);
    cursor: pointer;
    letter-spacing: 0;
    font-weight: 600;
    background: none;
    border: none;
    font-family: 'Heebo', sans-serif;
    transition: color 0.2s;
    text-transform: none;
  }
  .action:hover { color: var(--gold-l); }
</style>
