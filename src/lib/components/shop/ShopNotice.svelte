<script lang="ts">
  /** Empty, not-ready and failed states of the sales screens — one shape for all. */
  let {
    title,
    body = '',
    action = null
  }: {
    title: string;
    body?: string;
    action?: { label: string; href?: string; onclick?: () => void } | null;
  } = $props();
</script>

<div class="sh-empty sh-card-2">
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="sn-icon"><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></svg>
  <strong>{title}</strong>
  {#if body}<p>{body}</p>{/if}
  {#if action}
    {#if action.href}
      <a class="sh-btn sh-btn-outline" href={action.href}>{action.label}</a>
    {:else}
      <button type="button" class="sh-btn sh-btn-outline" onclick={action.onclick}>{action.label}</button>
    {/if}
  {/if}
</div>

<style>
  .sn-icon {
    color: var(--sh-gold);
    opacity: 0.8;
  }
</style>
