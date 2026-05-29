<script lang="ts">
  import Panel from '$lib/components/Panel.svelte';
  import tr from '$lib/translations/tr.json';
  import { lang } from '$lib/stores/lang.js';
  import type { ForumMessage, AuthorType } from '$lib/types';

  let { messages }: { messages: ForumMessage[] } = $props();

  const AVATAR_STYLE: Record<AuthorType, string> = {
    client:  'background:var(--pink-d);color:var(--pink-l)',
    creator: 'background:#1a1200;color:var(--gold-l)',
    manager: 'background:#0a120a;color:#4ade80',
  };
</script>

<Panel title={tr.deals.latestUpdates[$lang]} actionLabel={tr.deals.fullThread[$lang]}>
  {#each messages as m (m.id)}
    <div class="msg">
      <div class="av" style={AVATAR_STYLE[m.authorType]}>{m.initials}</div>
      <div class="content">
        <div class="meta">
          <span class="author" class:client={m.authorType === 'client'}>{m.author}</span>
          <span class="time">{m.timeAgo}</span>
        </div>
        <div class="text">{m.content}</div>
      </div>
    </div>
  {/each}
</Panel>

<style>
  .msg {
    display: flex;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
  }
  .msg:last-child { border-bottom: none; }

  .av {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
  }

  .content { flex: 1; min-width: 0; }

  .meta {
    display: flex;
    gap: 8px;
    align-items: baseline;
    margin-bottom: 3px;
  }
  .author { font-size: 11px; font-weight: 700; color: var(--gold); }
  .author.client { color: var(--pink-l); }
  .time   { font-size: 10px; color: var(--td); }

  .text {
    font-size: 12px;
    color: var(--tm);
    line-height: 1.55;
  }
</style>
