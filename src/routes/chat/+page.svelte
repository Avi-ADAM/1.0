<script lang="ts">
  import { tick, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { browser, dev } from '$app/environment';
  import { locale, t } from '$lib/translations';
  import { idPr } from '$lib/stores/idPr';
  import { chatMessages, type BotMessage } from '$lib/stores/chatStore';
  import type { ChatMessage, ChatComponent } from '$lib/types/chat';
  import MessageRenderer from '$lib/chat/MessageRenderer.svelte';

  // ── State ─────────────────────────────────────────────────────
  let messages = $state<ChatMessage[]>([]);
  let input = $state('');
  let loading = $state(false);
  let viewport = $state<HTMLDivElement | null>(null);
  let textarea = $state<HTMLTextAreaElement | null>(null);

  // User info from parent data
  let userId = $derived(page?.data?.uid ?? null);
  let userLang = $derived(page?.data?.lang ?? 'he');

  // ── Suggestions & Quick Actions ───────────────────────────
  const suggestions = $derived(
    userId
      ? [$t('bot.sugUserWhatAreTasks'), $t('bot.sugUserStartTimer'), $t('bot.sugUserShowPartnerships')]
      : [$t('bot.sugGuestWhatCanYouDo'), $t('bot.sugGuestHowToRegister'), $t('bot.sugGuestTellMeAbout')]
  );

  const quickSuggestions = $derived(
    userId
      ? [$t('bot.qsUserStopTimer'), $t('bot.qsUserActiveTimers'), $t('bot.qsUserShowVotes'), $t('bot.qsUserNavProfile')]
      : [$t('bot.qsGuestHome'), $t('bot.qsGuestLogin'), $t('bot.qsGuestSearchProjects')]
  );

  const showWelcomeSuggestions = $derived(messages.length <= 1 && !loading);

  // ── Init: load messages from shared store ──────────────────────
  onMount(() => {
    const storedMessages = $chatMessages;
    if (storedMessages && storedMessages.length > 0) {
      // Convert BotMessage[] → ChatMessage[]
      messages = storedMessages.map((m: BotMessage) => ({
        id: crypto.randomUUID(),
        role: m.user ? 'user' : 'assistant',
        content: m.text,
        time: ''
      }));
    }

    if (messages.length === 0) {
      messages = [
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: $t('bot.chatWelcomeMessage'),
          time: now()
        }
      ];
    }

    scrollToBottom();
  });

  // ── Helpers ───────────────────────────────────────────────────
  function now() {
    return new Date().toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async function scrollToBottom() {
    await tick();
    viewport?.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
  }

  function autoResize() {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  function syncToStore() {
    // Sync expanded page messages back to shared store
    chatMessages.set(
      messages
        .filter((m) => m.content)
        .map((m) => ({ text: m.content, user: m.role === 'user' }))
    );
  }

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      goto('/');
    }
  }

  // ── Send message ──────────────────────────────────────────────
  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    input = '';
    if (textarea) textarea.style.height = 'auto';

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      time: now()
    };
    messages = [...messages, userMsg];
    loading = true;
    syncToStore();
    await scrollToBottom();

    try {
      const apiUrl = dev ? '/api/chat' : 'https://rend.1lev1.com/api/chat';
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          userId,
          lang: userLang,
          currentPath: page.url.pathname
        })
      });

      const data = await res.json();

      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.content,
        time: now(),
        components: data.components ?? []
      };
      messages = [...messages, botMsg];

      // Handle navigation from agent tools
      if (data.navigation?.url) {
        goto(data.navigation.url);
        if (data.navigation?.idPr) {
          idPr.set(data.navigation.idPr);
        }
      }
    } catch (error) {
      console.log('❌ Error in chat API', error);
      messages = [
        ...messages,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: $t('bot.chatNetworkError'),
          time: now()
        }
      ];
    } finally {
      loading = false;
      syncToStore();
      await scrollToBottom();
      textarea?.focus();
    }
  }

  function clearChat() {
    messages = [
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: $t('bot.chatNewConversationMsg'),
        time: now()
      }
    ];
    chatMessages.clear();
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }
</script>

<svelte:head>
  <title>{$t('bot.chatPageTitle')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link
    href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="shell" dir="rtl">
  <!-- ── Ambient background ─────────────────────────────── -->
  <div class="ambient" aria-hidden="true"></div>

  <!-- ── Header ────────────────────────────────────────── -->
  <header class="header">
    <div class="header-right">
      <button class="back-btn" onclick={goBack} aria-label={$t('bot.chatActionBack')}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
      <div class="brand">
        <div class="brand-icon">
          <svg
            width="17"
            height="17"
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
        </div>
        <div>
          <h1 class="brand-name">{$t('bot.chatAgentName')}</h1>
          <div class="brand-status">
            <span class="status-dot"></span>
            {$t('bot.chatAgentStatus')}
          </div>
        </div>
      </div>
    </div>

    <div class="header-actions">
      <button class="action-btn" onclick={clearChat} title={$t('bot.chatNewConversationTitle')}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" /><line
            x1="5"
            y1="12"
            x2="19"
            y2="12"
          />
        </svg>
        <span class="action-label">{$t('bot.chatNewConversationTitle')}</span>
      </button>
    </div>
  </header>

  <!-- ── Message viewport ───────────────────────────────── -->
  <main class="viewport" bind:this={viewport}>
    <div class="messages">
      {#each messages as msg (msg.id)}
        <MessageRenderer message={msg} onAction={send} />
      {/each}

      <!-- Typing indicator -->
      {#if loading}
        <div class="typing-row">
          <div class="avatar bot-avatar">
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
          </div>
          <div class="typing-bubble">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      {/if}

      <!-- Welcome suggestions -->
      {#if showWelcomeSuggestions}
        <div class="suggestion-group">
          <span class="suggestion-label">{$t('bot.chatQuickSuggestionsTitle')}</span>
          <div class="chips">
            {#each suggestions as s}
              <button class="chip" onclick={() => send(s)}>{s}</button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </main>

  <!-- ── Input area ─────────────────────────────────────── -->
  <footer class="footer">
    {#if !showWelcomeSuggestions && messages.length > 1}
      <div class="chips quick">
        {#each quickSuggestions as s}
          <button class="chip" onclick={() => send(s)}>{s}</button>
        {/each}
      </div>
    {/if}

    <div class="input-row">
      <div class="input-wrap">
        <textarea
          bind:this={textarea}
          bind:value={input}
          onkeydown={onKey}
          oninput={autoResize}
          placeholder={$t('bot.chatInputPlaceholder')}
          rows="1"
          disabled={loading}
        ></textarea>

        <button
          class="send-btn"
          class:active={input.trim() && !loading}
          onclick={() => send()}
          disabled={!input.trim() || loading}
          aria-label={$t('bot.chatSendAriaLabel')}
        >
          {#if loading}
            <span class="spinner"></span>
          {:else}
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          {/if}
        </button>
      </div>
    </div>

    <p class="footer-hint">{$t('bot.chatFooterHint')}</p>
  </footer>
</div>

<style>
  /* ── CSS variables ──────────────────────────────────── */
  :global(:root) {
    --bg: #090b0f;
    --surface: #10131a;
    --surface-2: #171b24;
    --surface-3: #1e2230;
    --border: rgba(255, 255, 255, 0.07);
    --border-2: rgba(255, 255, 255, 0.12);
    --teal: #3ecfb2;
    --teal-dim: rgba(62, 207, 178, 0.12);
    --amber: #e8a838;
    --amber-dim: rgba(232, 168, 56, 0.13);
    --amber-border: rgba(232, 168, 56, 0.22);
    --rose: #e85c72;
    --rose-dim: rgba(232, 92, 114, 0.12);
    --text: #e6e8f0;
    --text-2: #8a8fa0;
    --text-3: #52566a;
    --radius: 14px;
    --radius-sm: 8px;
    --font-display: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
    --font-mono: 'DM Mono', monospace;
  }

  /* ── Layout shell ───────────────────────────────────── */
  .shell {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    position: relative;
    overflow: hidden;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    font-size: 14px;
  }

  .ambient {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(
        ellipse 55% 35% at 15% 5%,
        rgba(232, 168, 56, 0.05) 0%,
        transparent 60%
      ),
      radial-gradient(
        ellipse 45% 55% at 85% 95%,
        rgba(62, 207, 178, 0.05) 0%,
        transparent 60%
      );
    z-index: 0;
  }

  /* ── Header ─────────────────────────────────────────── */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    background: rgba(9, 11, 15, 0.85);
    backdrop-filter: blur(14px);
    position: relative;
    z-index: 10;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .back-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid var(--border-2);
    background: var(--surface-2);
    color: var(--text-2);
    display: grid;
    place-items: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .back-btn:hover {
    border-color: var(--teal);
    color: var(--teal);
    background: var(--teal-dim);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .brand-icon {
    width: 38px;
    height: 38px;
    border-radius: 11px;
    background: linear-gradient(135deg, #0d2e22, #0e3827);
    border: 1px solid rgba(62, 207, 178, 0.2);
    display: grid;
    place-items: center;
    color: var(--teal);
    box-shadow: 0 0 24px rgba(62, 207, 178, 0.08);
  }

  .brand-name {
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.01em;
    color: var(--text);
  }

  .brand-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--teal);
    font-family: var(--font-mono);
    margin-top: 2px;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--teal);
    animation: pulse 2.2s ease infinite;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 9px;
    border: 1px solid var(--border-2);
    background: var(--surface-2);
    color: var(--text-2);
    font-size: 12px;
    font-family: var(--font-body);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    border-color: var(--amber);
    color: var(--amber);
    background: var(--amber-dim);
  }

  .action-label {
    font-size: 12px;
  }

  /* ── Viewport ───────────────────────────────────────── */
  .viewport {
    flex: 1;
    overflow-y: auto;
    position: relative;
    z-index: 1;
  }

  .viewport::-webkit-scrollbar {
    width: 4px;
  }
  .viewport::-webkit-scrollbar-track {
    background: transparent;
  }
  .viewport::-webkit-scrollbar-thumb {
    background: var(--border-2);
    border-radius: 4px;
  }

  .messages {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 24px 20px;
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
  }

  /* ── Typing indicator ───────────────────────────────── */
  .typing-row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    animation: fadeUp 0.25s ease both;
  }

  .avatar {
    width: 30px;
    height: 30px;
    border-radius: 9px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .bot-avatar {
    background: linear-gradient(135deg, #0d2e22, #0f3826);
    border: 1px solid rgba(62, 207, 178, 0.22);
    color: var(--teal);
  }

  .typing-bubble {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px 14px 14px 14px;
    padding: 13px 16px;
    display: flex;
    gap: 5px;
    align-items: center;
  }

  .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--amber);
    animation: blink 1.2s ease-in-out infinite;
  }
  .dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  .dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  /* ── Suggestion chips ───────────────────────────────── */
  .suggestion-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    animation: fadeUp 0.4s ease both 0.2s;
  }

  .suggestion-label {
    font-size: 10px;
    color: var(--text-3);
    font-family: var(--font-mono);
    padding-right: 2px;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chip {
    padding: 6px 13px;
    border-radius: 20px;
    border: 1px solid var(--border-2);
    background: var(--surface-2);
    color: var(--text-2);
    font-size: 12px;
    font-family: var(--font-body);
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .chip:hover {
    border-color: var(--amber);
    color: var(--amber);
    background: var(--amber-dim);
  }

  /* ── Footer ─────────────────────────────────────────── */
  .footer {
    padding: 10px 16px 14px;
    border-top: 1px solid var(--border);
    background: rgba(9, 11, 15, 0.9);
    backdrop-filter: blur(14px);
    position: relative;
    z-index: 10;
  }

  .chips.quick {
    margin-bottom: 8px;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }

  .input-row {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }

  .input-wrap {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    background: var(--surface-2);
    border: 1px solid var(--border-2);
    border-radius: 14px;
    padding: 8px 8px 8px 14px;
    transition: border-color 0.2s ease;
  }

  .input-wrap:focus-within {
    border-color: rgba(232, 168, 56, 0.35);
  }

  textarea {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text);
    font-size: 14px;
    font-family: var(--font-body);
    resize: none;
    line-height: 1.6;
    max-height: 120px;
    overflow-y: auto;
    direction: rtl;
  }

  textarea::placeholder {
    color: var(--text-3);
  }
  textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .send-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: var(--surface-3);
    color: var(--text-3);
    cursor: not-allowed;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    transition: all 0.2s ease;
  }

  .send-btn.active {
    background: var(--amber);
    color: #000;
    cursor: pointer;
    box-shadow: 0 2px 14px rgba(232, 168, 56, 0.4);
  }

  .send-btn.active:hover {
    background: #f0b840;
    transform: scale(1.04);
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(0, 0, 0, 0.2);
    border-top-color: #000;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .footer-hint {
    text-align: center;
    font-size: 10px;
    color: var(--text-3);
    font-family: var(--font-mono);
    margin-top: 7px;
  }

  /* ── Keyframes ──────────────────────────────────────── */
  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.85);
    }
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 0.25;
      transform: scale(0.9);
    }
    50% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ── Responsive ─────────────────────────────────────── */
  @media (max-width: 560px) {
    .messages {
      padding: 16px 14px;
    }
    .action-label {
      display: none;
    }
    .header {
      padding: 12px 14px;
    }
  }
</style>
