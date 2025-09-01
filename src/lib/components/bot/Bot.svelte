<script>
  import { fly } from 'svelte/transition';
  import { t, locale } from '$lib/translations';

  let { data } = $props();
  let user = $derived(data.uid ? true : false);

  let visible = $state(false);
  let messages = $state([]);
  let userInput = $state('');
  let loading = $state(false);

  async function handleSend() {
    if (!userInput.trim()) return;

    const currentInput = userInput;
    messages = [...messages, { text: currentInput, user: true }];
    userInput = '';
    loading = true;

    try {
      const action = user ? 'timer' : 'ask';
      const response = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          payload: { text: currentInput },
          user: { id: data.uid ?? null, lang: data.lang }
        })
      });

      const responseData = await response.json();
      if (responseData.reply) {
        messages = [...messages, { text: responseData.reply, user: false }];
      }
    } catch (error) {
      console.error('Error sending message to bot:', error);
      messages = [...messages, { text: $t('bot.errorMessage'), user: false }];
    } finally {
      loading = false;
    }
  }
</script>

<div dir={$locale == 'he' || $locale == 'ar' ? 'rtl' : 'ltr'} class="fixed bottom-12 {$locale == 'he' || $locale == 'ar' ? 'left-4' : 'right-4'} z-50">
  <button
    onclick={() => (visible = !visible)}
    class="p-0 rounded-full shadow-lg {!visible ? 'floating-button' : ''}"
  >
    <img src="/botlogo.jpeg" alt={$t('bot.title')} class="w-14 h-14 rounded-full" />
  </button>
  {#if visible}
    <div
      in:fly={{ y: 20, duration: 300 }}
      out:fly={{ y: 20, duration: 300 }}
      class="absolute bottom-16 {$locale == 'he' || $locale == 'ar'
        ? 'left-0'
        : 'right-0'} w-80 h-96 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
    >
      <div class="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <h2 class="text-lg font-semibold">{user ? $t('bot.timerTitle') : $t('bot.welcomeTitle')}</h2>
      </div>
      <div class="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
        {#if !user && messages.length === 0}
          <div class="chat chat-start">
            <div class="chat-bubble bg-gray-200 text-gray-800">{$t('bot.initialMessage')}</div>
          </div>
        {/if}
        {#each messages as message}
          <div class="chat {message.user ? 'chat-end' : 'chat-start'}">
            <div
              class="chat-bubble {message.user
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800'}"
            >
              {message.text}
            </div>
          </div>
        {/each}
        {#if loading}
          <div class="chat chat-start">
            <div class="chat-bubble bg-gray-200 text-gray-800">{$t('bot.typing')}</div>
          </div>
        {/if}
      </div>
      <div class="p-2 border-t flex bg-white">
        <input
          bind:value={userInput}
          onkeydown={(e) => e.key === 'Enter' && handleSend()}
          type="text"
          placeholder={user ? $t('bot.timerPlaceholder') : $t('bot.questionPlaceholder')}
          class="w-full px-4 py-2 border-none rounded-{$locale == 'he' || $locale == 'ar' ? 'r' : 'l'}-full focus:ring-0 bg-gray-100"
        />
        <button
          onclick={handleSend}
          class="bg-blue-500 text-white px-4 py-2 rounded-{$locale == 'he' || $locale == 'ar' ? 'l' : 'r'}-full hover:bg-blue-600 transition-colors"
        >
          {$t('bot.sendButton')}
        </button>
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
    padding: 0.5rem 1rem;
    border-radius: 1rem;
    word-wrap: break-word;
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
