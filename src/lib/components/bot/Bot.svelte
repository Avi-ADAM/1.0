<script>
  import { fly } from 'svelte/transition';
  import { t, locale } from '$lib/translations';
  import { goto } from '$app/navigation';
  import { idPr } from '$lib/stores/idPr';
  import { Circle3 } from 'svelte-loading-spinners';
  import { browser } from '$app/environment';

  let { data } = $props();
  let user = $derived(data.uid ? true : false);

  let visible = $state(false);
  let messages = $state([]);
  let userInput = $state('');
  let loading = $state(false);
  let messagesContainer = $state(null);

  $effect(() => {
    if (messagesContainer) {
      messages; // establish reactivity
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });

  $effect(() => {
    if (browser) {
      const storedMessages = localStorage.getItem('bot_message_history');
      if (storedMessages) {
        messages = JSON.parse(storedMessages);
      }
    }
  });

  $effect(() => {
    if (browser) {
      localStorage.setItem('bot_message_history', JSON.stringify(messages));
    }
  });

  async function handleSend() {
    if (!userInput.trim()) return;

    const currentInput = userInput;
    const messageHistory = [...messages];
    messages = [...messages, { text: currentInput, user: true }];
    userInput = '';
    loading = true;

    try {
      const action = user ? 'timer' : 'ask';
      console.log('DATA UID', data?.uid);
      const response = await fetch('/api/mastra-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          payload: { text: currentInput, history: messageHistory },
          user: { id: data.uid ?? null, lang: data.lang }
        })
      });

      const responseData = await response.json();
      if (responseData.reply) {
        messages = [...messages, { text: responseData.reply, user: false }];
      }
      if (responseData.navigation?.url) {
        goto(responseData.navigation.url);
        console.log('Navigating to:', responseData.navigation);
        if (responseData.navigation?.idPr) {
          idPr.set(responseData.navigation.idPr);
        }
        visible = false; // Close the bot after navigation
      }
    } catch (error) {
      console.error('Error sending message to bot:', error);
      messages = [...messages, { text: $t('bot.errorMessage'), user: false }];
    } finally {
      loading = false;
    }
  }
  $effect(() => {
    console.log($locale, 'locale');
  });
</script>

<div
  dir={$locale == 'he' || $locale == 'ar' ? 'rtl' : 'ltr'}
  class="fixed bottom-12 {$locale !== 'he' && $locale !== 'ar'
    ? 'left-4'
    : 'right-4'} z-50"
>
  <button
    onclick={() => (visible = !visible)}
    class="p-0 rounded-full shadow-lg {!visible ? 'floating-button' : ''}"
  >
    <img
      src="/botlogo.jpeg"
      alt={$t('bot.title')}
      class="w-14 h-14 rounded-full"
    />
  </button>
  {#if visible}
    <div
      in:fly={{ y: 20, duration: 300 }}
      out:fly={{ y: 20, duration: 300 }}
      class="absolute bottom-20 {$locale !== 'he' && $locale !== 'ar'
        ? 'left-3'
        : 'right-3'} w-80 h-96 bg-gold shadow-teal-500 rounded-xl shadow-2xl flex flex-col overflow-hidden"
    >
      <div class="p-4 bg-liteGoldTobr shadow-lg">
        <h2 class="text-lg font-semibold text-bluesun drop-shadow-sm">
          {user ? $t('bot.timerTitle') : $t('bot.welcomeTitle')}
        </h2>
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
              {$t('bot.initialMessage')}
            </div>
          </div>
        {/if}
        {#each messages as message}
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
              oninput={(e) => {
                // Auto-resize textarea
                e.target.style.height = 'auto';
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 120) + 'px';
              }}
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
