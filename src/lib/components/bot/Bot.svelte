<script>
  import { fly } from 'svelte/transition';
  import { t, locale, isRtl} from '$lib/translations';
  import { goto } from '$app/navigation';
  import { idPr } from '$lib/stores/idPr';
  import { Circle3 } from 'svelte-loading-spinners';
  import { browser, dev } from '$app/environment';
  import { page } from '$app/stores';
  import { chatMessages } from '$lib/stores/chatStore';
  import DemoRequest from '$lib/components/main/DemoRequest.svelte';

  let { data } = $props();
  let user = $derived(data.uid ? true : false);
  let isOnChatPage = $derived($page.url.pathname === '/chat');

  let visible = $state(false);

  // פתיחה לאורח: במקום לבקש ממנו לנסח שאלה, מציעים לו את שלושת המסלולים.
  // "התחברות" בכוונה לא כאן — היא כפתור קבוע בראש האתר, ומי שכבר יש לו חשבון
  // לא מחפש אותה בבוט. היא מוצעת רק כמשפט המשך אחרי בחירה ב"להתחיל ריקמה".
  let showQuickActions = $state(true);
  let demoOpen = $state(false);
  let offeredLogin = $state(false);
  let inputEl = $state(null);

  let messages = $state([]);
  let userInput = $state('');
  let loading = $state(false);
  let messagesContainer = $state(null);

  function registerPath() {
    return $locale == 'he'
      ? '/hascama'
      : $locale == 'ar'
        ? '/aitifaqia'
        : '/convention';
  }

  function startDemo() {
    showQuickActions = false;
    demoOpen = true;
  }

  function startRegister() {
    showQuickActions = false;
    offeredLogin = true;
    visible = false;
    goto(registerPath());
  }

  function startQuestion() {
    showQuickActions = false;
    inputEl?.focus();
  }

  // Sync store → local state
  $effect(() => {
    const unsub = chatMessages.subscribe((stored) => {
      messages = stored;
    });
    return unsub;
  });

  $effect(() => {
    if (messagesContainer) {
      messages; // establish reactivity
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });

  async function handleSend() {
    if (!userInput.trim()) return;

    const currentInput = userInput;
    const messageHistory = [...messages];
    showQuickActions = false;

    chatMessages.addMessage({ text: currentInput, user: true });
    userInput = '';
    loading = true;

    try {
      const apiMessages = [
        ...messageHistory,
        { text: currentInput, user: true }
      ].map((m) => ({
        role: m.user ? 'user' : 'assistant',
        content: m.text
      }));

      const apiUrl = dev ? '/api/chat' : 'https://api.1lev1.com/api/chat';
      const response = await fetch(apiUrl, {
        method: 'POST',
        // Cross-ORIGIN in prod (www → api), so fetch's default
        // credentials:'same-origin' sends no cookies and the route's tools end
        // up as principal "anonymous" → every qid 403s. api.1lev1.com is
        // same-SITE and the jwt cookie is scoped to .1lev1.com, so asking for
        // credentials is all that's needed; CORS already allows them.
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          userId: data.uid ?? null,
          lang: data.lang,
          currentPath: $page.url.pathname,
          // Server-side conversation thread (Mastra memory) — same id as /chat,
          // so the popup and the full page continue one conversation.
          threadId: chatMessages.threadId()
        })
      });

      const responseData = await response.json();
      const replyText = responseData.content || responseData.reply;

      if (replyText) {
        chatMessages.addMessage({ text: replyText, user: false });
      }
      if (responseData.navigation?.url) {
        goto(responseData.navigation.url);
        if (responseData.navigation?.idPr) {
          idPr.set(responseData.navigation.idPr);
        }
        visible = false;
      }
    } catch (error) {
      console.error('Error sending message to bot:', error);
      chatMessages.addMessage({ text: $t('bot.errorMessage'), user: false });
    } finally {
      loading = false;
    }
  }

  function expandToFullPage() {
    visible = false;
    goto('/chat');
  }

  function autoResize(e) {
    const target = e.currentTarget;
    if (!target) return;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
  }
</script>

{#if !isOnChatPage}
  <div
    dir={$isRtl ? 'rtl' : 'ltr'}
    class="fixed bottom-20 sm:bottom-12 {$locale == 'he' || $locale == 'ar'
      ? 'left-4'
      : 'right-4'} z-50"
  >
    <button
      onclick={() => (visible = !visible)}
      class="p-0 rounded-full shadow-lg {!visible ? 'floating-button' : ''}"
    >
      <img
        src="/botlogo.png"
        alt={$t('bot.title')}
        class="sm:w-14 sm:h-14 h-12 w-12 rounded-full"
      />
    </button>
    {#if visible}
      <div
        in:fly={{ y: 20, duration: 300 }}
        out:fly={{ y: 20, duration: 300 }}
        class="absolute sm:bottom-20 bottom-5 {$locale == 'he' ||
        $locale == 'ar'
          ? 'left-3'
          : 'right-3'} sm:w-80 sm:h-96 h-[75vh] w-[75vw] bg-gold shadow-teal-500 rounded-xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div
          class="p-4 bg-liteGoldTobr shadow-lg flex justify-between items-center"
        >
          <h2 class="text-lg font-semibold text-bluesun drop-shadow-sm">
            {user ? $t('bot.timerTitle') : $t('bot.welcomeTitle')}
          </h2>
          <div class="flex items-center gap-1">
            <!-- Expand to full page button -->
            <button
              onclick={expandToFullPage}
              class="text-bluesun hover:text-blue-600 bg-gold transition-colors duration-200 p-1 rounded-full hover:bg-white/20"
              aria-label="Expand chat"
              title={$locale === 'he' ? 'פתח צ׳אט מלא' : 'Open full chat'}
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                ></path>
              </svg>
            </button>
            <!-- Close button -->
            <button
              onclick={() => (visible = false)}
              class="text-bluesun hover:text-red-600 bg-gold transition-colors duration-200 p-1 rounded-full hover:bg-white/20"
              aria-label="Close bot"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
        </div>
        <div
          bind:this={messagesContainer}
          class="flex-1 d p-4 overflow-y-auto bg-gray-50 space-y-4"
        >
          {#if !user && messages.length === 0}
            <div class="chat chat-start">
              <div
                class="chat-bubble bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200 shadow-sm"
              >
                {showQuickActions ? $t('demo.bot.intro') : $t('bot.initialMessage')}
              </div>
            </div>
            {#if showQuickActions}
              <div class="flex flex-col gap-2 px-1">
                <button
                  type="button"
                  onclick={startDemo}
                  class="w-full text-start bg-barbi text-gold hover:bg-white hover:text-barbi border-2 border-barbi font-semibold px-3 py-2 rounded-xl shadow-sm transition-colors"
                >
                  💬 {$t('demo.bot.demo')}
                  <span class="block text-xs opacity-90">{$t('demo.reassure')}</span>
                </button>
                <button
                  type="button"
                  onclick={startRegister}
                  class="w-full text-start bg-gold text-barbi hover:bg-barbi hover:text-gold border-2 border-gold font-semibold px-3 py-2 rounded-xl shadow-sm transition-colors"
                >
                  ✍️ {$t('demo.bot.register')}
                </button>
                <button
                  type="button"
                  onclick={startQuestion}
                  class="w-full text-start bg-white text-bluesun hover:bg-gray-100 border-2 border-gray-200 font-semibold px-3 py-2 rounded-xl shadow-sm transition-colors"
                >
                  ❓ {$t('demo.bot.question')}
                </button>
              </div>
            {/if}
            {#if offeredLogin}
              <div class="px-1">
                <a
                  href="/login"
                  class="block text-center text-bluesun underline text-sm hover:text-blue-600"
                >
                  {$t('demo.bot.haveAccount')}
                </a>
              </div>
            {/if}
          {/if}
          {#each messages as message, i (i)}
            <div class="chat {message.user ? 'chat-end' : 'chat-start'}">
              <div
                style="white-space: pre-wrap;"
                class="chat-bubble {message.user
                  ? 'bg-liteGoldTobr text-bluesun border border-liteGoldTobr shadow-md'
                  : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200 shadow-sm'}"
              >
                {message.text}
              </div>
            </div>
          {/each}
          {#if loading}
            <div class="chat chat-start">
              <div
                class="chat-bubble bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 shadow-sm"
              >
                <Circle3 />
              </div>
            </div>
          {/if}
        </div>
        <div class="p-3 border-t bg-gradient-to-r from-amber-50 to-rose-50">
          <div class="flex items-center gap-2">
            <div class="flex-1 relative">
              <textarea
                bind:this={inputEl}
                bind:value={userInput}
                onkeydown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  } else if (e.key === 'Enter' && e.shiftKey) {
                    // Allow new line with Shift+Enter
                  }
                }}
                placeholder={user
                  ? $t('bot.timerPlaceholder')
                  : $t('bot.questionPlaceholder')}
                rows="1"
                class="w-full px-4 py-3 border-2 border-amber-200 rounded-{$locale !==
                  'he' && $locale !== 'ar'
                  ? 'r'
                  : 'l'}-2xl
                     focus:border-amber-300 focus:ring-2 focus:ring-rose-200 focus:outline-none
                     bg-gradient-to-r from-amber-50 to-rose-50
                     text-gray-800 placeholder-gray-500
                     resize-none overflow-hidden
                     transition-all duration-200 ease-in-out
                     shadow-sm hover:shadow-md"
                style="min-height: 44px; max-height: 120px;"
                oninput={autoResize}
              ></textarea>
            </div>
            <button
              onclick={handleSend}
              disabled={loading}
              class="bg-liteGoldTobr text-bluesun px-5 py-3
                   rounded-{$locale == 'he' || $locale == 'ar' ? 'l' : 'r'}-2xl
                   hover:from-amber-500 hover:to-rose-500
                   disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed
                   transition-all duration-200 ease-in-out
                   shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95
                   font-medium min-w-[60px] h-[44px] flex items-center justify-center"
            >
              {#if loading}
                <div
                  class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                ></div>
              {:else}
                {$t('bot.sendButton')}
              {/if}
            </button>
          </div>
          <div class="text-xs text-gray-500 mt-1 px-1">
            {$locale === 'he'
              ? 'Enter לשליחה • Shift+Enter לשורה חדשה'
              : 'Enter to send • Shift+Enter for new line'}
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<!-- מסלול הדמו זמין מהבוט בכל עמוד, לא רק מדף הבית -->
<DemoRequest bind:open={demoOpen} source="bot" />

<style>
  .chat {
    display: flex;
    margin-bottom: 0.5rem;
  }
  .chat-start {
    justify-content: flex-start;
  }
  .chat-end {
    justify-content: flex-end;
  }
  .chat-bubble {
    max-width: 75%;
    padding: 0.75rem 1rem;
    border-radius: 1.25rem;
    word-wrap: break-word;
    line-height: 1.5;
    transition: all 0.2s ease-in-out;
  }

  .chat-bubble:hover {
    transform: translateY(-1px);
  }
  .floating-button {
    animation: float 6s ease-in-out infinite;
  }
  @keyframes float {
    0% {
      box-shadow: 0 5px 15px 0px rgba(0, 0, 0, 0.6);
      transform: translatey(0px);
    }
    50% {
      box-shadow: 0 25px 15px 0px rgba(0, 0, 0, 0.2);
      transform: translatey(-10px);
    }
    100% {
      box-shadow: 0 5px 15px 0px rgba(0, 0, 0, 0.6);
      transform: translatey(0px);
    }
  }
</style>
