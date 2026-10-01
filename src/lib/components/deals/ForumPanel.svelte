<script lang="ts">
  import Panel from '$lib/components/Panel.svelte';
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import type { ForumMessage, AuthorType } from '$lib/types';

  /**
   * `onSend` turns the panel from a log into a conversation: the deal page's
   * "reject" used to point at a chat that had no place to write in (QA C-15).
   * It receives the text and resolves when the message is saved; it throws to say
   * it was not.
   */
  let {
    messages,
    onSend
  }: { messages: ForumMessage[]; onSend?: (text: string) => Promise<void> } = $props();

  const AVATAR_STYLE: Record<AuthorType, string> = {
    client:  'background:var(--pink-d);color:var(--pink-l)',
    creator: 'background:#1a1200;color:var(--gold-l)',
    manager: 'background:#0a120a;color:#4ade80',
  };

  let text = $state('');
  let sending = $state(false);
  let failed = $state(false);
  let box: HTMLTextAreaElement | undefined = $state();

  /** Bring the writer into view — what "I do not agree" opens. */
  export function focus() {
    box?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    box?.focus();
  }

  async function submit() {
    const message = text.trim();
    if (!onSend || !message || sending) return;
    sending = true;
    failed = false;
    try {
      await onSend(message);
      text = '';
    } catch {
      failed = true;
    } finally {
      sending = false;
    }
  }

  function onKey(e: KeyboardEvent) {
    // Ctrl/⌘ + Enter sends; a plain Enter is a new line.
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submit();
    }
  }
</script>

<Panel title={$t('deals.latestUpdates')} actionLabel={$t('deals.fullThread')}>
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

  {#if onSend}
    <form class="composer" onsubmit={(e) => { e.preventDefault(); submit(); }}>
      <textarea
        bind:this={box}
        bind:value={text}
        rows="2"
        placeholder={$t('deals.chatPlaceholder')}
        aria-label={$t('deals.chatPlaceholder')}
        disabled={sending}
        onkeydown={onKey}
      ></textarea>
      <button type="submit" class="send" disabled={sending || !text.trim()}>
        {$t('deals.chatSend')}
      </button>
    </form>
    {#if failed}
      <div class="failed" role="alert">{$t('deals.chatError')}</div>
    {/if}
  {/if}
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

  .composer {
    display: flex;
    gap: 8px;
    align-items: flex-end;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
  }
  .composer textarea {
    flex: 1;
    min-width: 0;
    resize: vertical;
    background: var(--s2);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 8px 10px;
    font: inherit;
    font-size: 12px;
    line-height: 1.5;
  }
  .composer textarea:focus-visible {
    outline: 2px solid var(--gold-l);
    outline-offset: 1px;
  }
  .send {
    flex-shrink: 0;
    padding: 8px 14px;
    border-radius: 10px;
    border: 1px solid var(--border-g);
    background: var(--gold-d);
    color: var(--gold-l);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }
  .send:disabled { opacity: 0.5; cursor: default; }
  .failed {
    margin-top: 6px;
    font-size: 11px;
    color: var(--pink-l);
  }
</style>
